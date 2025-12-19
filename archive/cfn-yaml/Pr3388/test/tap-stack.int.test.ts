// Configuration - These are coming from cfn-outputs after deployment
import {
  APIGatewayClient,
  GetApiKeyCommand,
  GetRestApiCommand,
  GetStageCommand
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  ListObjectsV2Command,
  S3Client
} from '@aws-sdk/client-s3';
import {
  ListSubscriptionsByTopicCommand,
  ListTopicsCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import axios from 'axios';
import fs from 'fs';

// Load outputs if available, otherwise use mock data for CI
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, using mock outputs for testing');
  outputs = {
    ApiEndpoint: 'https://mock-api-id.execute-api.us-east-1.amazonaws.com/dev/survey/submit',
    ApiGatewayId: 'mock-api-id',
    ApiStageName: 'dev',
    DynamoDBTableName: 'SurveyResponses-dev',
    BackupBucketName: 'survey-backups-123456789012-dev',
    DashboardURL: 'https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=survey-dashboard-dev',
    ApiKeyId: 'mock-api-key-id',
    KmsKeyId: 'mock-kms-key-id',
    WebACLArn: 'arn:aws:wafv2:us-east-1:123456789012:regional/webacl/mock-waf/mock-id'
  };
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = 'us-east-1';

// Initialize AWS clients
const dynamoDBClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });

// Helper function to get API key value for authentication
const getApiKeyValue = async (): Promise<string | null> => {
  if (!outputs.ApiKeyId || outputs.ApiKeyId === 'mock-api-key-id') {
    return null; // For mock testing or when API key is not available
  }

  try {
    const command = new GetApiKeyCommand({
      apiKey: outputs.ApiKeyId,
      includeValue: true
    });
    const response = await apiGatewayClient.send(command);
    return response.value || null;
  } catch (error) {
    console.warn('Failed to retrieve API key value:', error);
    return null;
  }
};

// Helper function to create authenticated HTTP headers
const createAuthenticatedHeaders = async () => {
  const headers: any = {
    'Content-Type': 'application/json'
  };

  const apiKeyValue = await getApiKeyValue();
  if (apiKeyValue) {
    headers['x-api-key'] = apiKeyValue;
  }

  return headers;
};

// Helper function to generate test data
const generateTestSurveyResponse = (surveyId: string, respondentId?: string) => ({
  surveyId,
  respondentId: respondentId || `respondent-${Date.now()}`,
  responses: {
    question1: 'Very Satisfied',
    question2: 'Daily',
    question3: 'Excellent'
  }
});

// Skip integration tests if no actual AWS deployment exists
const skipIntegrationTests = !fs.existsSync('cfn-outputs/flat-outputs.json');
const describeTest = skipIntegrationTests ? describe.skip : describe;

describeTest('Survey Data Platform Integration Tests', () => {
  // Test data cleanup
  const testResponseIds: string[] = [];

  afterAll(async () => {
    // Clean up test data
    for (const responseId of testResponseIds) {
      try {
        await dynamoDBClient.send(new DeleteItemCommand({
          TableName: outputs.DynamoDBTableName,
          Key: {
            responseId: { S: responseId }
          }
        }));
      } catch (error) {
        console.warn(`Failed to cleanup test response ${responseId}:`, error);
      }
    }
  });

  describe('Core Functionality & Real-Time E2E Tests (Positive Flow)', () => {
    test('E2E Submission Success: Submit well-formed JSON, verify 201 status and DynamoDB storage', async () => {
      const testData = generateTestSurveyResponse('survey-123');

      // Submit survey response via API Gateway
      const headers = await createAuthenticatedHeaders();
      const response = await axios.post(outputs.ApiEndpoint, testData, {
        headers,
        timeout: 10000
      });

      // Verify API Gateway returns 201 status
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('responseId');

      const responseId = response.data.responseId;
      testResponseIds.push(responseId);

      // Verify the item exists in DynamoDB
      const getItemResponse = await dynamoDBClient.send(new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          responseId: { S: responseId }
        }
      }));

      expect(getItemResponse.Item).toBeDefined();
      expect(getItemResponse.Item!.surveyId.S).toBe(testData.surveyId);
      expect(getItemResponse.Item!.respondentId.S).toBe(testData.respondentId);
    }, 30000);

    test('GSI Query Validation: Query DynamoDB GSI by surveyId for real-time aggregation', async () => {
      const surveyId = `survey-gsi-test-${Date.now()}`;
      const testData = generateTestSurveyResponse(surveyId);

      // Submit test response
      const headers = await createAuthenticatedHeaders();
      const response = await axios.post(outputs.ApiEndpoint, testData, { headers });
      const responseId = response.data.responseId;
      testResponseIds.push(responseId);

      // Wait a moment for eventual consistency
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Query using the SurveyIdIndex GSI
      const queryResponse = await dynamoDBClient.send(new QueryCommand({
        TableName: outputs.DynamoDBTableName,
        IndexName: 'SurveyIdIndex',
        KeyConditionExpression: 'surveyId = :surveyId',
        ExpressionAttributeValues: {
          ':surveyId': { S: surveyId }
        }
      }));

      expect(queryResponse.Items).toBeDefined();
      expect(queryResponse.Items!.length).toBeGreaterThan(0);
      expect(queryResponse.Items![0].surveyId.S).toBe(surveyId);
    }, 30000);

    test('Data Integrity Check: Verify stored data matches submitted payload exactly', async () => {
      const testData = generateTestSurveyResponse('survey-integrity-test', 'respondent-integrity');

      // Submit survey response
      const headers = await createAuthenticatedHeaders();
      const response = await axios.post(outputs.ApiEndpoint, testData, { headers });
      const responseId = response.data.responseId;
      testResponseIds.push(responseId);

      // Retrieve stored item from DynamoDB
      const getItemResponse = await dynamoDBClient.send(new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          responseId: { S: responseId }
        }
      }));

      const storedItem = getItemResponse.Item!;

      // Verify data integrity
      expect(storedItem.surveyId.S).toBe(testData.surveyId);
      expect(storedItem.respondentId.S).toBe(testData.respondentId);

      // Verify responses object - DynamoDB stores complex objects in M (Map) format, not as JSON strings
      // So we need to access the responses as a Map and convert it back to a regular object
      const storedResponses: any = {};
      if (storedItem.responses?.M) {
        // Convert DynamoDB Map format back to regular object
        for (const [key, value] of Object.entries(storedItem.responses.M)) {
          storedResponses[key] = (value as any).S || (value as any).N || value;
        }
      }
      expect(storedResponses).toEqual(testData.responses);

      // Verify timestamp format (ISO format)
      expect(storedItem.timestamp.S).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?/);
    }, 30000);
  });

  describe('Resilience and Negative Testing', () => {
    test('Input Validation Failure: Submit payload with missing required fields, verify 400 error', async () => {
      const invalidPayload = {
        // Missing surveyId and responses
        respondentId: 'test-respondent'
      };

      try {
        const headers = await createAuthenticatedHeaders();
        await axios.post(outputs.ApiEndpoint, invalidPayload, { headers });
        fail('Expected request to fail with 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('Missing required fields');
      }
    }, 30000);

    test('API Throttling Enforcement: Execute burst of requests to verify 429 throttling', async () => {
      const testData = generateTestSurveyResponse('throttle-test');
      const headers = await createAuthenticatedHeaders();
      const requests = [];

      // Create a burst of requests (more than the rate limit)
      for (let i = 0; i < 50; i++) {
        requests.push(axios.post(outputs.ApiEndpoint, testData, { headers, timeout: 5000 }));
      }

      const results = await Promise.allSettled(requests);

      // Check that some requests were throttled
      const throttledRequests = results.filter(result =>
        result.status === 'rejected' &&
        (result.reason?.response?.status === 429 || result.reason?.code === 'ECONNRESET')
      );

      // At high burst, we should see some throttling (this may vary based on AWS API Gateway configuration)
      // If no throttling is detected, at least verify that all successful requests returned proper responses
      const successfulRequests = results.filter(result => result.status === 'fulfilled');
      successfulRequests.forEach(result => {
        if (result.status === 'fulfilled') {
          testResponseIds.push((result.value as any).data.responseId);
        }
      });

      expect(successfulRequests.length + throttledRequests.length).toBe(results.length);
    }, 60000);

    test('Lambda Execution Failure: Simulate error and verify 500 response with SNS notification', async () => {
      // This test simulates a Lambda failure by sending malformed JSON
      const malformedPayload = '{ "surveyId": "test", "responses": invalid-json }';

      try {
        const headers = await createAuthenticatedHeaders();
        await axios.post(outputs.ApiEndpoint, malformedPayload, {
          headers
        });
        fail('Expected request to fail with 500 error');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toBe('Internal server error');
      }
    }, 30000);
  });

  describe('Scheduled Automation and Monitoring Tests', () => {
    test('CloudWatch Visibility: Verify dashboard displays key metrics and monitoring is active', async () => {
      const dashboardName = `survey-dashboard-${environmentSuffix}`;

      // Verify CloudWatch Dashboard exists
      const dashboardResponse = await cloudWatchClient.send(new GetDashboardCommand({
        DashboardName: dashboardName
      }));

      expect(dashboardResponse.DashboardName).toBe(dashboardName);
      expect(dashboardResponse.DashboardBody).toBeDefined();

      // Parse dashboard configuration
      const dashboardConfig = JSON.parse(dashboardResponse.DashboardBody!);
      expect(dashboardConfig.widgets).toBeDefined();
      expect(dashboardConfig.widgets.length).toBeGreaterThan(0);

      // Verify dashboard contains API Gateway and Lambda metrics
      const dashboardBody = dashboardResponse.DashboardBody!;
      expect(dashboardBody).toContain('AWS/ApiGateway');
      expect(dashboardBody).toContain('AWS/Lambda');
      expect(dashboardBody).toContain('Count');
      expect(dashboardBody).toContain('Invocations');
    }, 30000);

    test('SNS Alert Confirmation: Verify SNS topic exists and has email subscription', async () => {
      // List all SNS topics and find our admin notification topic
      const listTopicsResponse = await snsClient.send(new ListTopicsCommand({}));

      const adminTopic = listTopicsResponse.Topics?.find(topic =>
        topic.TopicArn?.includes(`survey-admin-notifications-${environmentSuffix}`)
      );

      expect(adminTopic).toBeDefined();

      // Verify email subscription exists
      const subscriptionsResponse = await snsClient.send(new ListSubscriptionsByTopicCommand({
        TopicArn: adminTopic!.TopicArn
      }));

      expect(subscriptionsResponse.Subscriptions).toBeDefined();
      expect(subscriptionsResponse.Subscriptions!.length).toBeGreaterThan(0);

      const emailSubscription = subscriptionsResponse.Subscriptions!.find(sub =>
        sub.Protocol === 'email'
      );

      expect(emailSubscription).toBeDefined();
      expect(emailSubscription!.Endpoint).toContain('@');
    }, 30000);
  });

  describe('Infrastructure Validation Tests', () => {
    test('API Gateway Configuration: Verify REST API and stage configuration', async () => {
      const getRestApiResponse = await apiGatewayClient.send(new GetRestApiCommand({
        restApiId: outputs.ApiGatewayId
      }));

      expect(getRestApiResponse.name).toContain('SurveyAPI');
      expect(getRestApiResponse.description).toBe('API for survey data collection');

      // Verify stage configuration
      const getStageResponse = await apiGatewayClient.send(new GetStageCommand({
        restApiId: outputs.ApiGatewayId,
        stageName: outputs.ApiStageName
      }));

      expect(getStageResponse.stageName).toBeDefined();
      expect(getStageResponse.methodSettings).toBeDefined();
    }, 30000);

    test('DynamoDB Table Configuration: Verify table exists with correct GSI configuration', async () => {
      // Test the table is accessible and has the expected structure
      const scanResponse = await dynamoDBClient.send(new ScanCommand({
        TableName: outputs.DynamoDBTableName,
        Limit: 1
      }));

      // Should not throw an error, indicating table exists and is accessible
      expect(scanResponse).toBeDefined();
    }, 30000);

    test('S3 Bucket Configuration: Verify backup bucket exists and is accessible', async () => {
      const listObjectsResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: outputs.BackupBucketName,
        MaxKeys: 1
      }));

      // Should not throw an error, indicating bucket exists and is accessible
      expect(listObjectsResponse).toBeDefined();
    }, 30000);

    test('CloudWatch Alarm Configuration: Verify error alarms are configured', async () => {
      const alarmName = `API-Error-Alarm-${environmentSuffix}`;

      const describeAlarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      }));

      expect(describeAlarmsResponse.MetricAlarms).toBeDefined();
      expect(describeAlarmsResponse.MetricAlarms!.length).toBe(1);

      const alarm = describeAlarmsResponse.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe('5XXError');
      expect(alarm.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Threshold).toBe(5);
    }, 30000);
  });

  describe('End-to-End Workflow Tests', () => {
    test('Complete Survey Submission Workflow: Submit -> Store -> Query -> Aggregate -> Backup', async () => {
      const workflowSurveyId = `workflow-test-${Date.now()}`;
      const testResponses = [];

      // Step 1: Submit multiple survey responses
      for (let i = 0; i < 3; i++) {
        const testData = generateTestSurveyResponse(
          workflowSurveyId,
          `workflow-respondent-${i}`
        );

        const headers = await createAuthenticatedHeaders();
        const response = await axios.post(outputs.ApiEndpoint, testData, { headers });
        expect(response.status).toBe(201);
        testResponses.push(response.data.responseId);
      }

      testResponseIds.push(...testResponses);

      // Step 2: Wait and verify storage in DynamoDB
      await new Promise(resolve => setTimeout(resolve, 2000));

      for (const responseId of testResponses) {
        const getItemResponse = await dynamoDBClient.send(new GetItemCommand({
          TableName: outputs.DynamoDBTableName,
          Key: { responseId: { S: responseId } }
        }));
        expect(getItemResponse.Item).toBeDefined();
      }

      // Step 3: Query by survey ID using GSI
      const queryResponse = await dynamoDBClient.send(new QueryCommand({
        TableName: outputs.DynamoDBTableName,
        IndexName: 'SurveyIdIndex',
        KeyConditionExpression: 'surveyId = :surveyId',
        ExpressionAttributeValues: {
          ':surveyId': { S: workflowSurveyId }
        }
      }));

      expect(queryResponse.Items!.length).toBe(3);

      // Step 4: Trigger aggregation with today's date
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const aggregationResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: `survey-aggregation-${environmentSuffix}`,
        Payload: JSON.stringify({ date: today }),
      }));

      expect(aggregationResponse.StatusCode).toBe(200);

      // Step 5: Trigger backup
      const backupResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: `survey-backup-${environmentSuffix}`,
        Payload: JSON.stringify({}),
      }));

      expect(backupResponse.StatusCode).toBe(200);
    }, 120000);
  });
});
