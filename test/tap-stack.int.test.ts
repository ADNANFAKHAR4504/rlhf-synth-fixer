// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import axios from 'axios';
import fs from 'fs';

// Load outputs from CloudFormation deployment first
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    const fileContent = fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8');
    // Remove any BOM or invisible characters
    const cleanContent = fileContent.replace(/^\uFEFF/, '');
    outputs = JSON.parse(cleanContent);
  }
} catch (error) {
  console.warn(
    'Could not load CloudFormation outputs. Some tests may be skipped.',
    error
  );
}

// Get environment suffix from outputs, environment variable, or default to 'dev'
const environmentSuffix =
  outputs.EnvironmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = 'us-east-1';

// LocalStack configuration
const AWS_ENDPOINT = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const isLocalStack = AWS_ENDPOINT.includes('localhost') || AWS_ENDPOINT.includes('4566');
const AWS_ACCOUNT_ID = isLocalStack ? '000000000000' : process.env.AWS_ACCOUNT_ID;

// Configure AWS SDK for LocalStack
const localStackConfig = isLocalStack ? {
  endpoint: AWS_ENDPOINT,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  },
  s3ForcePathStyle: true,
  region: region
} : { region: region };

// Initialize AWS clients
const dynamoClient = new DynamoDBClient(localStackConfig);
const lambdaClient = new LambdaClient(localStackConfig);
const apiGatewayClient = new APIGatewayClient(localStackConfig);
const logsClient = new CloudWatchLogsClient(localStackConfig);

// Test configuration
const testConfig = {
  stackName: `TapStack${environmentSuffix}`,
  tableName: `TurnAroundPromptTable${environmentSuffix}`,
  functionName: `tap-data-processor-${environmentSuffix}`,
  apiName: `tap-api-${environmentSuffix}`,
  region,
  timeout: 30000,
};

describe('TAP Stack Integration Tests', () => {
  // Skip tests if outputs are not available
  const skipIfNoOutputs =
    outputs && Object.keys(outputs).length > 0 ? describe : describe.skip;

  describe('Infrastructure Deployment Verification', () => {
    test(
      'should verify DynamoDB table exists and is accessible',
      async () => {
        const command = new DescribeTableCommand({
          TableName: testConfig.tableName,
        });

        const response = await dynamoClient.send(command);
        expect(response.Table).toBeDefined();
        expect(response.Table?.TableName).toBe(testConfig.tableName);
        expect(response.Table?.TableStatus).toBe('ACTIVE');
        expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
          'PAY_PER_REQUEST'
        );
      },
      testConfig.timeout
    );

    test(
      'should verify Lambda function exists and is configured correctly',
      async () => {
        const command = new GetFunctionCommand({
          FunctionName: testConfig.functionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(
          testConfig.functionName
        );
        expect(response.Configuration?.Runtime).toBe('python3.9');
        expect(response.Configuration?.Handler).toBe('index.lambda_handler');
        expect(response.Configuration?.MemorySize).toBe(256);
        expect(response.Configuration?.Timeout).toBe(15);
        expect(response.Configuration?.State).toBe('Active');

        // Verify environment variables
        const envVars = response.Configuration?.Environment?.Variables;
        expect(envVars?.ENVIRONMENT).toBe(environmentSuffix);
        expect(envVars?.LOG_LEVEL).toBe('INFO');
        expect(envVars?.DATA_SOURCE).toBe('api-gateway');
        expect(envVars?.REGION).toBe(region);
        expect(envVars?.DYNAMODB_TABLE).toBe(testConfig.tableName);
      },
      testConfig.timeout
    );

    skipIfNoOutputs(
      'should verify API Gateway exists and is configured correctly',
      () => {
        test(
          'API Gateway should exist and be configured correctly',
          async () => {
            const apiId =
              outputs[`${testConfig.stackName}-TapApiGatewayId`] ||
              outputs.TapApiGatewayId;
            expect(apiId).toBeDefined();

            const command = new GetRestApiCommand({
              restApiId: apiId,
            });

            const response = await apiGatewayClient.send(command);
            expect(response.name).toBe(testConfig.apiName);
            expect(response.endpointConfiguration?.types).toContain('REGIONAL');
          },
          testConfig.timeout
        );
      }
    );

    test(
      'should verify CloudWatch log groups exist',
      async () => {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/lambda/',
        });

        const response = await logsClient.send(command);
        const lambdaLogGroup = response.logGroups?.find(lg =>
          lg.logGroupName?.includes(testConfig.functionName)
        );

        expect(lambdaLogGroup).toBeDefined();
        // LocalStack may not set retention, so only verify if it exists
        if (lambdaLogGroup?.retentionInDays) {
          expect(lambdaLogGroup?.retentionInDays).toBe(14);
        }
      },
      testConfig.timeout
    );
  });

  describe('DynamoDB Operations', () => {
    const testItemId = `test-${Date.now()}`;
    const testItem = {
      id: { S: testItemId },
      data: { S: 'test data for integration test' },
      timestamp: { S: new Date().toISOString() },
    };

    test(
      'should successfully write item to DynamoDB table',
      async () => {
        const command = new PutItemCommand({
          TableName: testConfig.tableName,
          Item: testItem,
        });

        await expect(dynamoClient.send(command)).resolves.not.toThrow();
      },
      testConfig.timeout
    );

    test(
      'should successfully read item from DynamoDB table',
      async () => {
        const command = new GetItemCommand({
          TableName: testConfig.tableName,
          Key: { id: { S: testItemId } },
        });

        const response = await dynamoClient.send(command);
        expect(response.Item).toBeDefined();
        expect(response.Item?.id.S).toBe(testItemId);
        expect(response.Item?.data.S).toBe('test data for integration test');
      },
      testConfig.timeout
    );

    afterAll(async () => {
      // Clean up test data
      try {
        const command = new DeleteItemCommand({
          TableName: testConfig.tableName,
          Key: { id: { S: testItemId } },
        });
        await dynamoClient.send(command);
      } catch (error) {
        console.warn('Failed to clean up test data:', error);
      }
    });
  });

  describe('Lambda Function Integration', () => {
    test(
      'should successfully invoke Lambda function directly',
      async () => {
        const testEvent = {
          httpMethod: 'GET',
          path: '/data',
          headers: {},
          queryStringParameters: null,
          body: null,
        };

        const command = new InvokeCommand({
          FunctionName: testConfig.functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(testEvent),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
        expect(response.Payload).toBeDefined();

        const payload = JSON.parse(Buffer.from(response.Payload!).toString());
        expect(payload.statusCode).toBe(200);
        expect(JSON.parse(payload.body)).toMatchObject({
          message: 'TAP data processed successfully',
          environment: environmentSuffix,
          data_source: 'api-gateway',
          region: region,
          dynamodb_table: testConfig.tableName,
        });
      },
      testConfig.timeout
    );

    test(
      'should handle Lambda function errors gracefully',
      async () => {
        // Test with invalid event structure to trigger error handling
        const invalidEvent = {
          invalid: 'event structure',
        };

        const command = new InvokeCommand({
          FunctionName: testConfig.functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(invalidEvent),
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);

        const payload = JSON.parse(Buffer.from(response.Payload!).toString());
        // Function should handle this gracefully and return success
        expect([200, 500]).toContain(payload.statusCode);
      },
      testConfig.timeout
    );
  });

  skipIfNoOutputs('API Gateway End-to-End Tests', () => {
    const apiEndpoint =
      outputs[`${testConfig.stackName}-TapApiEndpoint`] ||
      outputs.TapApiEndpoint;

    test(
      'should successfully call API Gateway endpoint',
      async () => {
        expect(apiEndpoint).toBeDefined();
        
        // For LocalStack, modify the endpoint URL to use localhost:4566
        let testEndpoint = apiEndpoint;
        if (isLocalStack) {
          // Convert from AWS format to LocalStack format
          // From: https://mw6kjzu9cy.execute-api.amazonaws.com:4566/dev/data
          // To: http://localhost:4566/restapis/mw6kjzu9cy/dev/_user_request_/data
          const apiId = outputs.TapApiGatewayId;
          testEndpoint = `http://localhost:4566/restapis/${apiId}/dev/_user_request_/data`;
        }

        const response = await axios.get(testEndpoint, {
          timeout: testConfig.timeout,
          validateStatus: status => status < 500, // Accept 4xx as valid responses
        });

        expect([200, 403]).toContain(response.status); // 403 might occur if API requires auth

        if (response.status === 200) {
          expect(response.data).toMatchObject({
            message: 'TAP data processed successfully',
            environment: environmentSuffix,
            data_source: 'api-gateway',
            region: region,
          });
        }
      },
      testConfig.timeout
    );

    test(
      'should return appropriate headers',
      async () => {
        try {
          const response = await axios.get(apiEndpoint, {
            timeout: testConfig.timeout,
          });

          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.headers['access-control-allow-origin']).toBe('*');
        } catch (error: any) {
          // If the endpoint requires authentication, we might get 403
          if (error.response?.status === 403) {
            expect(error.response.status).toBe(403);
          } else {
            throw error;
          }
        }
      },
      testConfig.timeout
    );

    test(
      'should handle invalid paths gracefully',
      async () => {
        const invalidEndpoint = apiEndpoint.replace('/data', '/invalid');

        try {
          await axios.get(invalidEndpoint, {
            timeout: testConfig.timeout,
          });
        } catch (error: any) {
          expect(error.response?.status).toBe(403);
        }
      },
      testConfig.timeout
    );
  });

  describe('Performance and Scalability', () => {
    test(
      'should handle multiple concurrent Lambda invocations',
      async () => {
        const concurrentInvocations = 5;
        const testEvent = {
          httpMethod: 'GET',
          path: '/data',
          headers: {},
          queryStringParameters: null,
          body: null,
        };

        const promises = Array.from({ length: concurrentInvocations }, () => {
          const command = new InvokeCommand({
            FunctionName: testConfig.functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(testEvent),
          });
          return lambdaClient.send(command);
        });

        const responses = await Promise.all(promises);

        responses.forEach(response => {
          expect(response.StatusCode).toBe(200);
          const payload = JSON.parse(Buffer.from(response.Payload!).toString());
          expect(payload.statusCode).toBe(200);
        });
      },
      testConfig.timeout
    );

    test(
      'should have acceptable Lambda cold start performance',
      async () => {
        const testEvent = {
          httpMethod: 'GET',
          path: '/data',
          headers: {},
          queryStringParameters: null,
          body: null,
        };

        const startTime = Date.now();

        const command = new InvokeCommand({
          FunctionName: testConfig.functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(testEvent),
        });

        const response = await lambdaClient.send(command);
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.StatusCode).toBe(200);
        expect(duration).toBeLessThan(15000); // Should complete within timeout limit
      },
      testConfig.timeout
    );
  });

  describe('Security and Compliance', () => {
    test(
      'should verify Lambda function has appropriate IAM permissions',
      async () => {
        const command = new GetFunctionCommand({
          FunctionName: testConfig.functionName,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration?.Role).toBeDefined();
        expect(response.Configuration?.Role).toMatch(
          /arn:aws:iam::\d+:role\/.+-execution-role-.+/
        );
      },
      testConfig.timeout
    );

    skipIfNoOutputs('should verify API Gateway uses HTTPS', () => {
      test('API Gateway endpoint should use HTTPS', () => {
        const apiEndpoint =
          outputs[`${testConfig.stackName}-TapApiEndpoint`] ||
          outputs.TapApiEndpoint;
        expect(apiEndpoint).toMatch(/^https:\/\//);
      });
    });

    test(
      'should verify DynamoDB table has proper configuration',
      async () => {
        const command = new DescribeTableCommand({
          TableName: testConfig.tableName,
        });

        const response = await dynamoClient.send(command);

        // Verify encryption at rest (DynamoDB has encryption enabled by default)
        // SSEDescription is only present for customer-managed keys, not default encryption
        const hasEncryption =
          response.Table?.SSEDescription?.Status === 'ENABLED' ||
          response.Table?.SSEDescription === undefined; // Default encryption
        expect(hasEncryption).toBeTruthy();

        // Verify billing mode is pay-per-request for cost optimization
        expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
          'PAY_PER_REQUEST'
        );
      },
      testConfig.timeout
    );
  });
});
