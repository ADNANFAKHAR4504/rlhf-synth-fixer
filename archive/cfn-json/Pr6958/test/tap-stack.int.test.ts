import * as fs from 'fs';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  Route53Client,
  GetHealthCheckCommand,
} from '@aws-sdk/client-route-53';

// Load outputs from deployed stack
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS region from environment or default
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const lambdaClient = new LambdaClient({ region });
const dynamoDBClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const route53Client = new Route53Client({ region });

describe('Multi-Region Payment Processing System - Integration Tests', () => {
  describe('Lambda Function Tests', () => {
    test('should have Lambda function deployed', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('PaymentProcessor');
    });

    test('Lambda function should have correct runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('Lambda function should have correct memory and timeout', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    test('Lambda function should have reserved concurrency set', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Concurrency?.ReservedConcurrentExecutions).toBe(100);
    });

    test('Lambda function should have correct environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.AWS_REGION_NAME).toBeDefined();
      expect(envVars?.REGION_TYPE).toBeDefined();
      expect(envVars?.DYNAMODB_TABLE).toBe(outputs.DynamoDBTableName);
      expect(envVars?.S3_BUCKET).toBe(outputs.S3BucketName);
      expect(envVars?.SECRET_ARN).toBe(outputs.SecretArn);
    });

    test('Lambda function should execute successfully', async () => {
      const testPayload = {
        transaction_id: `test-${Date.now()}`,
        amount: 150.50,
      };

      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        Payload: JSON.stringify(testPayload),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.message).toContain('Payment processed successfully');
      expect(body.transaction_id).toBe(testPayload.transaction_id);
    });
  });

  describe('DynamoDB Global Table Tests', () => {
    test('should have DynamoDB table deployed', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toContain('Transactions');
    });

    test('DynamoDB table should have correct billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });

      const response = await dynamoDBClient.send(command);
      const keySchema = response.Table?.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema?.find(k => k.AttributeName === 'transaction_id' && k.KeyType === 'HASH')).toBeDefined();
      expect(keySchema?.find(k => k.AttributeName === 'timestamp' && k.KeyType === 'RANGE')).toBeDefined();
    });

    test('DynamoDB table should have stream enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should be able to write and read from DynamoDB table', async () => {
      const testTransactionId = `integration-test-${Date.now()}`;
      const testTimestamp = new Date().toISOString();

      // Write item
      const putCommand = new PutItemCommand({
        TableName: outputs.DynamoDBTableName,
        Item: {
          transaction_id: { S: testTransactionId },
          timestamp: { S: testTimestamp },
          amount: { S: '99.99' },
          region: { S: region },
          status: { S: 'test' },
        },
      });

      await dynamoDBClient.send(putCommand);

      // Read item
      const getCommand = new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transaction_id: { S: testTransactionId },
          timestamp: { S: testTimestamp },
        },
      });

      const response = await dynamoDBClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.transaction_id.S).toBe(testTransactionId);
      expect(response.Item?.amount.S).toBe('99.99');
      expect(response.Item?.status.S).toBe('test');
    });
  });

  describe('S3 Bucket Tests', () => {
    test('should have S3 bucket deployed', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should be able to write and read from S3 bucket', async () => {
      const testKey = `test-logs/integration-test-${Date.now()}.json`;
      const testData = {
        transaction_id: `test-${Date.now()}`,
        amount: 250.75,
        timestamp: new Date().toISOString(),
      };

      // Write object
      const putCommand = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json',
      });

      await s3Client.send(putCommand);

      // Read object
      const getCommand = new GetObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
      });

      const response = await s3Client.send(getCommand);
      const bodyString = await response.Body?.transformToString();
      const retrievedData = JSON.parse(bodyString || '{}');

      expect(retrievedData.transaction_id).toBe(testData.transaction_id);
      expect(retrievedData.amount).toBe(testData.amount);
    });
  });

  describe('Secrets Manager Tests', () => {
    test('should have secret deployed', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.SecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(outputs.SecretArn);
      expect(response.Name).toContain('PaymentAPISecret');
    });

    test('should be able to retrieve secret value', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.SecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString || '{}');
      expect(secretData.api_key).toBeDefined();
      expect(secretData.region).toBeDefined();
    });
  });

  describe('SNS Topic Tests', () => {
    test('should have SNS topic deployed', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.SNSTopicArn);
    });

    test('SNS topic should have email subscription', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.SNSTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions?.length).toBeGreaterThan(0);

      const emailSub = response.Subscriptions?.find(sub => sub.Protocol === 'email');
      expect(emailSub).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Tests', () => {
    test('should have Lambda error alarm deployed', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'PaymentProcessor-Errors',
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('Errors');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.Threshold).toBe(5);
    });

    test('should have Lambda throttle alarm deployed', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'PaymentProcessor-Throttles',
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('Throttles');
      expect(alarm?.Namespace).toBe('AWS/Lambda');
    });

    test('should have DynamoDB throttle alarm deployed', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'DynamoDB-ReadThrottle',
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('UserErrors');
      expect(alarm?.Namespace).toBe('AWS/DynamoDB');
    });

    test('all alarms should send notifications to SNS topic', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'PaymentProcessor',
      });

      const response = await cloudWatchClient.send(command);
      response.MetricAlarms?.forEach(alarm => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions?.includes(outputs.SNSTopicArn)).toBe(true);
      });
    });
  });

  describe('Route 53 Health Check Tests', () => {
    test('should have health check deployed', async () => {
      const command = new GetHealthCheckCommand({
        HealthCheckId: outputs.HealthCheckId,
      });

      const response = await route53Client.send(command);
      expect(response.HealthCheck).toBeDefined();
      expect(response.HealthCheck?.Id).toBe(outputs.HealthCheckId);
    });

    test('health check should use HTTPS', async () => {
      const command = new GetHealthCheckCommand({
        HealthCheckId: outputs.HealthCheckId,
      });

      const response = await route53Client.send(command);
      expect(response.HealthCheck?.HealthCheckConfig.Type).toBe('HTTPS');
      expect(response.HealthCheck?.HealthCheckConfig.Port).toBe(443);
    });

    test('health check should have correct interval and threshold', async () => {
      const command = new GetHealthCheckCommand({
        HealthCheckId: outputs.HealthCheckId,
      });

      const response = await route53Client.send(command);
      expect(response.HealthCheck?.HealthCheckConfig.RequestInterval).toBe(30);
      expect(response.HealthCheck?.HealthCheckConfig.FailureThreshold).toBe(3);
    });

    test('should have health check alarm deployed', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'HealthCheck',
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.MetricName).toBe('HealthCheckStatus');
      expect(alarm?.Namespace).toBe('AWS/Route53');
    });
  });

  describe('End-to-End Payment Processing Workflow', () => {
    test('should process payment from Lambda to DynamoDB and S3', async () => {
      const testTransactionId = `e2e-test-${Date.now()}`;
      const testAmount = 299.99;

      // Invoke Lambda function
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        Payload: JSON.stringify({
          transaction_id: testTransactionId,
          amount: testAmount,
        }),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify DynamoDB entry
      const queryCommand = new QueryCommand({
        TableName: outputs.DynamoDBTableName,
        KeyConditionExpression: 'transaction_id = :txnId',
        ExpressionAttributeValues: {
          ':txnId': { S: testTransactionId },
        },
        Limit: 1,
      });

      const queryResponse = await dynamoDBClient.send(queryCommand);
      expect(queryResponse.Items).toBeDefined();
      expect(queryResponse.Items?.length).toBeGreaterThan(0);
      expect(queryResponse.Items?.[0].transaction_id.S).toBe(testTransactionId);
      expect(queryResponse.Items?.[0].status.S).toBe('processed');

      // Verify S3 log entry
      const getObjectCommand = new GetObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: `logs/${testTransactionId}.json`,
      });

      const s3Response = await s3Client.send(getObjectCommand);
      const logData = JSON.parse(await s3Response.Body?.transformToString() || '{}');
      expect(logData.transaction_id).toBe(testTransactionId);
      expect(logData.amount).toBe(testAmount);
      expect(logData.region).toBeDefined();
    });
  });

  describe('Stack Outputs Validation', () => {
    test('all required outputs should be present', () => {
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.LambdaFunctionName).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableArn).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketArn).toBeDefined();
      expect(outputs.SecretArn).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.HealthCheckId).toBeDefined();
      expect(outputs.RegionType).toBeDefined();
    });

    test('outputs should have correct format', () => {
      expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.DynamoDBTableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(outputs.S3BucketArn).toMatch(/^arn:aws:s3:/);
      expect(outputs.SecretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.HealthCheckId).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.RegionType).toBe('primary');
    });
  });
});
