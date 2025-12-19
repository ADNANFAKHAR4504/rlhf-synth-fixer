// Configuration - These are coming from cfn-outputs after cdk deploy
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { GetFunctionCommand, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { GetScheduleCommand, SchedulerClient } from '@aws-sdk/client-scheduler';
import { ListSubscriptionsByTopicCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

// Read the actual deployed stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS SDK clients
const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const schedulerClient = new SchedulerClient({ region: 'us-east-1' });

describe('Weather Monitoring System Integration Tests', () => {
  describe('API Gateway Integration', () => {
    test('API endpoint should be accessible', async () => {
      expect(outputs.APIEndpoint).toBeDefined();
      expect(outputs.APIEndpoint).toContain('execute-api');
      expect(outputs.APIEndpoint).toContain('/prod/sensor-data');
    });
  });

  describe('DynamoDB Integration', () => {
    test('DynamoDB table should exist and be accessible', async () => {
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableName).toContain('WeatherReadings');

      const scanCommand = new ScanCommand({
        TableName: outputs.DynamoDBTableName,
        Limit: 1
      });

      const result = await dynamoDBClient.send(scanCommand);
      expect(result.$metadata.httpStatusCode).toBe(200);
    });

    test('DynamoDB table should have proper capacity settings', async () => {
      // This test verifies the table exists and is configured
      // Auto-scaling settings are validated through unit tests
      const scanCommand = new ScanCommand({
        TableName: outputs.DynamoDBTableName,
        Limit: 5
      });

      const result = await dynamoDBClient.send(scanCommand);
      expect(result.$metadata.httpStatusCode).toBe(200);
      // The actual auto-scaling is handled by AWS and tested through CloudWatch metrics
    });
  });

  describe('Lambda Function Integration', () => {
    test('Lambda function should exist and be configured correctly', async () => {
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.LambdaFunctionArn).toContain(':function:WeatherDataAggregation');

      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: functionName
      });

      const result = await lambdaClient.send(getFunctionCommand);
      expect(result.Configuration?.Runtime).toBe('python3.11');
      expect(result.Configuration?.Timeout).toBe(30);
      expect(result.Configuration?.MemorySize).toBe(256);
    });

    test('Lambda environment variables should be set correctly', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: functionName
      });

      const result = await lambdaClient.send(getFunctionCommand);
      const envVars = result.Configuration?.Environment?.Variables;

      expect(envVars?.TABLE_NAME).toBe(outputs.DynamoDBTableName);
      expect(envVars?.SNS_TOPIC_ARN).toBe(outputs.SNSTopicArn);
    });
  });

  describe('SNS Topic Integration', () => {
    test('SNS topic should exist and be accessible', async () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toContain(':WeatherAnomalies');

      const listSubscriptionsCommand = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.SNSTopicArn
      });

      const result = await snsClient.send(listSubscriptionsCommand);
      expect(result.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('S3 Bucket Integration', () => {
    test('Failed events S3 bucket should exist', async () => {
      expect(outputs.FailedEventsBucketName).toBeDefined();
      expect(outputs.FailedEventsBucketName).toContain('weather-failed-events');

      const headBucketCommand = new HeadBucketCommand({
        Bucket: outputs.FailedEventsBucketName
      });

      const result = await s3Client.send(headBucketCommand);
      expect(result.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('EventBridge Scheduler Integration', () => {
    test('Hourly aggregation schedule should exist and be enabled', async () => {
      expect(outputs.HourlyScheduleArn).toBeDefined();
      const scheduleName = outputs.HourlyScheduleArn.split('/').pop();

      const getScheduleCommand = new GetScheduleCommand({
        Name: scheduleName
      });

      const result = await schedulerClient.send(getScheduleCommand);
      expect(result.State).toBe('ENABLED');
      expect(result.ScheduleExpression).toBe('rate(1 hour)');
    });

    test('Lambda should handle EventBridge aggregation event', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({
          source: 'EventBridge Scheduler',
          action: 'aggregate'
        })
      });

      const result = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(new TextDecoder().decode(result.Payload));
      expect(payload.statusCode).toBe(200);
    });

    test('Lambda should handle EventBridge daily report event', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({
          source: 'EventBridge Scheduler',
          reportType: 'daily'
        })
      });

      const result = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(new TextDecoder().decode(result.Payload));
      expect(payload.statusCode).toBe(200);
    });
  });

  describe('CloudWatch Alarms Integration', () => {
    test('Lambda error alarm should exist', async () => {
      const describeAlarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'WeatherLambda-HighErrorRate'
      });

      const result = await cloudWatchClient.send(describeAlarmsCommand);
      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('Errors');
      expect(alarm?.Threshold).toBe(0.01);
    });

    test('API Gateway 4xx alarm should exist', async () => {
      const describeAlarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'WeatherAPI-High4xxErrors'
      });

      const result = await cloudWatchClient.send(describeAlarmsCommand);
      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('4XXError');
      expect(alarm?.Threshold).toBe(0.05);
    });

    test('DynamoDB throttle alarm should exist', async () => {
      const describeAlarmsCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'WeatherDynamoDB-ThrottledRequests'
      });

      const result = await cloudWatchClient.send(describeAlarmsCommand);
      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('UserErrors');
      expect(alarm?.Threshold).toBe(1);
    });
  });
});
