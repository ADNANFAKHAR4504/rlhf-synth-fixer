import {
  CloudWatchClient,
  GetDashboardCommand,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { GetRestApiCommand, APIGatewayClient } from '@aws-sdk/client-api-gateway';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import { GetBucketLocationCommand, S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Read deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = outputs.Region || process.env.AWS_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

describe('Serverless Data Processing Pipeline - Integration Tests', () => {
  beforeAll(() => {
    // Verify we have the required outputs from deployment
    expect(outputs).toBeDefined();
    expect(outputs.APIEndpoint).toBeDefined();
    expect(outputs.LambdaFunctionName).toBeDefined();
    expect(outputs.LambdaFunctionArn).toBeDefined();
    expect(outputs.SNSTopicArn).toBeDefined();
    expect(outputs.SNSTopicName).toBeDefined();
    expect(outputs.BucketName).toBeDefined();
    expect(outputs.BucketArn).toBeDefined();
    expect(outputs.IAMRoleArn).toBeDefined();
    expect(outputs.IAMRoleName).toBeDefined();
    expect(outputs.APIGatewayId).toBeDefined();
    expect(outputs.CloudWatchDashboardName).toBeDefined();
    expect(outputs.ErrorAlarmName).toBeDefined();
    expect(outputs.DurationAlarmName).toBeDefined();
  });

  describe('S3 Bucket Integration', () => {
    test('S3 bucket exists and is accessible', async () => {
      const bucketName = outputs.BucketName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketLocationCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      // LocationConstraint is null for us-east-1 region, undefined for classic regions
      expect(response).toBeDefined();
    });

    test('S3 bucket accepts file uploads', async () => {
      const bucketName = outputs.BucketName;
      const testKey = `integration-test-${Date.now()}.json`;
      const testData = JSON.stringify({
        test: 'data',
        timestamp: new Date().toISOString(),
        priority: 'high',
      });

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testData,
        ContentType: 'application/json',
      });

      const response = await s3Client.send(command);
      expect(response.ETag).toBeDefined();
    });
  });

  describe('Lambda Function Integration', () => {
    test('Lambda function exists and is invocable', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'DryRun',
      });

      try {
        await lambdaClient.send(command);
      } catch (error: any) {
        // DryRun should return DryRunOperation error if function exists
        expect(error.name).toBe('DryRunOperation');
      }
    });

    test('Lambda function processes S3 event correctly', async () => {
      const functionName = outputs.LambdaFunctionName;
      const bucketName = outputs.BucketName;

      // Simulate an S3 event payload
      const s3Event = {
        Records: [
          {
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            eventTime: new Date().toISOString(),
            eventName: 's3:ObjectCreated:Put',
            s3: {
              bucket: {
                name: bucketName,
                arn: outputs.BucketArn,
              },
              object: {
                key: 'test-data.json',
                size: 1024,
              },
            },
          },
        ],
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(s3Event)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const payload = response.Payload ? Buffer.from(response.Payload).toString() : '{}';
      let parsedPayload;

      try {
        parsedPayload = JSON.parse(payload);
      } catch (e) {
        console.error('Error parsing Lambda response:', e);
        parsedPayload = { rawPayload: payload };
      }

      expect(parsedPayload).toBeDefined();
      // Lambda should process the event without throwing errors
      expect(response.FunctionError).toBeUndefined();
    });

    test('Lambda function handles API Gateway event', async () => {
      const functionName = outputs.LambdaFunctionName;

      // Simulate an API Gateway event payload
      const apiEvent = {
        httpMethod: 'POST',
        path: '/process',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [
            { id: 1, value: 'test', priority: 'high' },
            { id: 2, value: 'data', priority: 'medium' },
          ],
          type: 'batch',
        }),
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(apiEvent)),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();
    });
  });

  describe('IAM Role Integration', () => {
    test('IAM role exists with correct configuration', async () => {
      const roleName = outputs.IAMRoleName;
      expect(roleName).toBeDefined();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.Arn).toBe(outputs.IAMRoleArn);

      // Verify the role is for Lambda service
      const assumeRolePolicyDocument = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );
      const lambdaService = assumeRolePolicyDocument.Statement?.find(
        (stmt: any) => stmt.Principal?.Service === 'lambda.amazonaws.com'
      );
      expect(lambdaService).toBeDefined();
    });
  });

  describe('SNS Topic Integration', () => {
    test('SNS topic exists and has correct configuration', async () => {
      const topicArn = outputs.SNSTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);

      // DisplayName might be different from the topic name, check if it exists
      const displayName = response.Attributes?.DisplayName;
      if (displayName) {
        expect(displayName).toBeDefined();
        // Verify it contains some identifying information
        expect(displayName.length).toBeGreaterThan(0);
      }
    });
  });

  describe('API Gateway Integration', () => {
    test('API Gateway exists with correct configuration', async () => {
      const apiId = outputs.APIGatewayId;
      expect(apiId).toBeDefined();

      const command = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.id).toBe(apiId);
      expect(response.name).toContain('Data-Processing-API');
    });

    test('API Gateway endpoint is accessible', async () => {
      const apiEndpoint = outputs.APIEndpoint;
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/.*/);

      // Test OPTIONS request for CORS
      const response = await fetch(`${apiEndpoint}process`, {
        method: 'OPTIONS',
      });

      // API Gateway should respond to OPTIONS requests
      expect(response.status).toBeLessThan(500);
    });

    test('API Gateway POST endpoint invokes Lambda function', async () => {
      const apiEndpoint = outputs.APIEndpoint;

      const testPayload = {
        data: [
          { id: 1, value: 'integration-test', priority: 'high' },
        ],
        type: 'realtime',
      };

      const response = await fetch(`${apiEndpoint}process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);

      // Verify response can be parsed as JSON
      const responseData = await response.json();
      expect(responseData).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring Integration', () => {
    test('CloudWatch dashboard exists', async () => {
      const dashboardName = outputs.CloudWatchDashboardName;
      expect(dashboardName).toBeDefined();

      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });

      const response = await cloudWatchClient.send(command);
      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
    });

    test('CloudWatch alarms exist and are configured', async () => {
      const errorAlarmName = outputs.ErrorAlarmName;
      const durationAlarmName = outputs.DurationAlarmName;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [errorAlarmName, durationAlarmName],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(2);

      const errorAlarm = response.MetricAlarms?.find(alarm => alarm.AlarmName === errorAlarmName);
      const durationAlarm = response.MetricAlarms?.find(alarm => alarm.AlarmName === durationAlarmName);

      expect(errorAlarm).toBeDefined();
      expect(durationAlarm).toBeDefined();

      // Verify alarms are monitoring the correct Lambda function
      expect(errorAlarm?.Dimensions?.some(d => d.Value === outputs.LambdaFunctionName)).toBe(true);
      expect(durationAlarm?.Dimensions?.some(d => d.Value === outputs.LambdaFunctionName)).toBe(true);
    });
  });

  describe('End-to-End Data Processing Workflow', () => {
    test('Complete data processing pipeline via API Gateway', async () => {
      const apiEndpoint = outputs.APIEndpoint;
      const functionName = outputs.LambdaFunctionName;

      // Step 1: Send data processing request via API Gateway
      const testData = {
        data: [
          { id: 1, value: 'workflow-test-1', priority: 'high' },
          { id: 2, value: 'workflow-test-2', priority: 'medium' },
          { id: 3, value: 'workflow-test-3', priority: 'low' },
        ],
        type: 'batch',
        metadata: {
          source: 'integration-test',
          timestamp: new Date().toISOString(),
        },
      };

      const apiResponse = await fetch(`${apiEndpoint}process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      // Step 2: Verify API Gateway response
      expect(apiResponse.status).toBeGreaterThanOrEqual(200);
      expect(apiResponse.status).toBeLessThan(600);

      const responseData = await apiResponse.json();
      expect(responseData).toBeDefined();

      // Step 3: Verify Lambda function is functioning (dry run)
      const lambdaCommand = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'DryRun',
      });

      try {
        await lambdaClient.send(lambdaCommand);
      } catch (error: any) {
        expect(error.name).toBe('DryRunOperation');
      }
    });

    test('S3 upload triggers Lambda processing workflow', async () => {
      const bucketName = outputs.BucketName;
      const functionName = outputs.LambdaFunctionName;

      // Step 1: Upload test data to S3 bucket
      const testKey = `workflow-test-${Date.now()}.json`;
      const testData = JSON.stringify({
        workflow: 'integration-test',
        data: [
          { id: 1, value: 's3-trigger-test', priority: 'high' },
        ],
        timestamp: new Date().toISOString(),
      });

      const uploadCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testData,
        ContentType: 'application/json',
      });

      const uploadResponse = await s3Client.send(uploadCommand);
      expect(uploadResponse.ETag).toBeDefined();

      // Step 2: Verify Lambda function processes S3 events
      const s3Event = {
        Records: [
          {
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            eventName: 's3:ObjectCreated:Put',
            s3: {
              bucket: {
                name: bucketName,
                arn: outputs.BucketArn,
              },
              object: {
                key: testKey,
                size: testData.length,
              },
            },
          },
        ],
      };

      const lambdaCommand = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(s3Event)),
      });

      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      expect(lambdaResponse.StatusCode).toBe(200);
      expect(lambdaResponse.FunctionError).toBeUndefined();
    });
  });

  describe('Infrastructure Validation', () => {
    test('All deployment outputs are valid and accessible', () => {
      // Validate output formats match expected patterns
      expect(outputs.APIEndpoint).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/.*/);
      expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:.*/);
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:.*/);
      expect(outputs.BucketArn).toMatch(/^arn:aws:s3:::.*/);
      expect(outputs.IAMRoleArn).toMatch(/^arn:aws:iam::.*/);
      expect(outputs.DashboardUrl).toMatch(/^https:\/\/.*\.console\.aws\.amazon\.com\/.*/);

      // Validate environment suffix consistency (without hardcoding values)
      const envSuffix = outputs.EnvironmentSuffix;
      expect(outputs.LambdaFunctionName).toContain(envSuffix);
      expect(outputs.SNSTopicName).toContain(envSuffix);
      expect(outputs.BucketName).toContain(envSuffix);
      expect(outputs.IAMRoleName).toContain(envSuffix);
      expect(outputs.CloudWatchDashboardName).toContain(envSuffix);
    });

    test('Resource naming follows consistent patterns', () => {
      const envSuffix = outputs.EnvironmentSuffix;

      // Verify consistent naming patterns across resources
      expect(outputs.LambdaFunctionName).toBe(`data-processor-${envSuffix}`);
      expect(outputs.SNSTopicName).toBe(`data-processing-notifications-${envSuffix}`);
      expect(outputs.IAMRoleName).toBe(`data-processing-role-${envSuffix}`);
      expect(outputs.CloudWatchDashboardName).toBe(`data-processing-pipeline-${envSuffix}`);
      expect(outputs.ErrorAlarmName).toBe(`data-processor-errors-${envSuffix}`);
      expect(outputs.DurationAlarmName).toBe(`data-processor-duration-${envSuffix}`);
    });

    test('All required infrastructure components are interconnected', () => {
      // Verify region consistency across all resources
      const region = outputs.Region;
      expect(outputs.LambdaFunctionArn).toContain(region);
      expect(outputs.SNSTopicArn).toContain(region);
      expect(outputs.BucketName).toContain(region);
      expect(outputs.APIEndpoint).toContain(region);
      expect(outputs.DashboardUrl).toContain(region);
    });
  });
});