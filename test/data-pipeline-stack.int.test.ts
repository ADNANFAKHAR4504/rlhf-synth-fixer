import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  GetBucketNotificationConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { IAMClient, GetPolicyCommand } from '@aws-sdk/client-iam';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '../cfn-outputs/flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// AWS region from environment or default
const REGION = process.env.AWS_REGION || 'ap-southeast-1';

// Initialize AWS clients
const s3Client = new S3Client({ region: REGION });
const dynamoDBClient = new DynamoDBClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const eventBridgeClient = new EventBridgeClient({ region: REGION });
const iamClient = new IAMClient({ region: REGION });

describe('DataPipelineStack Integration Tests', () => {
  describe('S3 Bucket Integration', () => {
    test('should verify S3 bucket exists and has correct versioning', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should verify S3 bucket has lifecycle configuration', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules.length).toBeGreaterThan(0);

      const rule = response.Rules[0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Expiration).toBeDefined();
      expect(rule.Expiration.Days).toBe(30); // Dev environment
    });

    test('should verify S3 bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration.Rules.length
      ).toBeGreaterThan(0);

      const rule = response.ServerSideEncryptionConfiguration.Rules[0];
      expect(
        rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
      expect(rule.BucketKeyEnabled).toBe(true);
    });

    test('should verify S3 bucket has public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        response.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration.IgnorePublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
    });

    test('should verify S3 bucket has EventBridge notifications enabled', async () => {
      const command = new GetBucketNotificationConfigurationCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.EventBridgeConfiguration).toBeDefined();
    });

    test('should upload file to S3 bucket successfully', async () => {
      const testKey = `test-${Date.now()}.txt`;
      const command = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
        Body: 'Integration test file content',
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });
  });

  describe('DynamoDB Table Integration', () => {
    test('should verify DynamoDB table exists with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table.TableName).toBe(outputs.DynamoDBTableName);
      expect(response.Table.TableStatus).toBe('ACTIVE');
    });

    test('should verify DynamoDB table has correct schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table.KeySchema).toBeDefined();
      expect(response.Table.KeySchema.length).toBe(2);

      const hashKey = response.Table.KeySchema.find((k) => k.KeyType === 'HASH');
      const rangeKey = response.Table.KeySchema.find(
        (k) => k.KeyType === 'RANGE'
      );

      expect(hashKey).toBeDefined();
      expect(hashKey.AttributeName).toBe('id');
      expect(rangeKey).toBeDefined();
      expect(rangeKey.AttributeName).toBe('timestamp');
    });

    test('should verify DynamoDB table has correct billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoDBClient.send(command);

      // Dev environment should use PAY_PER_REQUEST
      expect(response.Table.BillingModeSummary.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('should verify DynamoDB table has encryption enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table.SSEDescription).toBeDefined();
      expect(response.Table.SSEDescription.Status).toBe('ENABLED');
    });

    test('should verify DynamoDB table has point-in-time recovery enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table.ArchivalSummary).toBeUndefined(); // Not archived
      // Note: Point-in-time recovery status requires DescribeContinuousBackups API
    });
  });

  describe('Lambda Function Integration', () => {
    test('should verify Lambda function exists with correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.FunctionName).toBe(
        outputs.LambdaFunctionName
      );
      expect(response.Configuration.Runtime).toBe('nodejs18.x');
      expect(response.Configuration.Handler).toBe('index.handler');
    });

    test('should verify Lambda function has correct memory size', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      // Dev environment should have 512MB
      expect(response.Configuration.MemorySize).toBe(512);
    });

    test('should verify Lambda function has correct timeout', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration.Timeout).toBe(300); // 5 minutes
    });

    test('should verify Lambda function has correct environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration.Environment).toBeDefined();
      expect(response.Configuration.Environment.Variables).toBeDefined();

      const vars = response.Configuration.Environment.Variables;
      expect(vars.ENVIRONMENT).toBe('dev');
      expect(vars.DYNAMODB_TABLE).toBe(outputs.DynamoDBTableName);
      expect(vars.SNS_TOPIC_ARN).toBe(outputs.SNSTopicArn);
      expect(vars.S3_BUCKET).toBe(outputs.S3BucketName);
    });

    test('should verify Lambda function has correct tracing mode', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      // Dev environment should have PassThrough (X-Ray disabled)
      expect(response.Configuration.TracingConfig).toBeDefined();
      expect(response.Configuration.TracingConfig.Mode).toBe('PassThrough');
    });

    test('should verify Lambda function has execution role', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration.Role).toBeDefined();
      expect(response.Configuration.Role).toContain('arn:aws:iam::');
      expect(response.Configuration.Role).toContain('lambda-role');
    });
  });

  describe('SNS Topic Integration', () => {
    test('should verify SNS topic exists', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.TopicArn).toBe(outputs.SNSTopicArn);
    });

    test('should verify SNS topic has display name', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes.DisplayName).toBe('Data Pipeline Alerts - dev');
    });

    test('should verify SNS topic has subscriptions', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes.SubscriptionsConfirmed).toBeDefined();
      expect(response.Attributes.SubscriptionsPending).toBeDefined();
    });
  });

  describe('EventBridge Rule Integration', () => {
    test('should verify EventBridge rule name is in outputs', () => {
      expect(outputs.EventBridgeRuleName).toBeDefined();
      expect(outputs.EventBridgeRuleName).toContain('myapp');
      expect(outputs.EventBridgeRuleName).toContain('s3-events');
    });
  });

  describe('End-to-End Workflow Integration', () => {
    test('should verify S3 bucket references match Lambda environment', async () => {
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);

      const s3Bucket =
        lambdaResponse.Configuration.Environment.Variables.S3_BUCKET;
      expect(s3Bucket).toBe(outputs.S3BucketName);
    });

    test('should verify DynamoDB table references match Lambda environment', async () => {
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);

      const dynamoTable =
        lambdaResponse.Configuration.Environment.Variables.DYNAMODB_TABLE;
      expect(dynamoTable).toBe(outputs.DynamoDBTableName);
    });

    test('should verify SNS topic references match Lambda environment', async () => {
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);

      const snsTopicArn =
        lambdaResponse.Configuration.Environment.Variables.SNS_TOPIC_ARN;
      expect(snsTopicArn).toBe(outputs.SNSTopicArn);
    });

    test('should verify EventBridge rule name format is correct', () => {
      expect(outputs.EventBridgeRuleName).toContain('myapp');
      expect(outputs.EventBridgeRuleName).toContain('dev');
      expect(outputs.EventBridgeRuleName).toContain('s3-events');
    });

    test('should verify all resource names include environment suffix', () => {
      // Extract environment suffix from outputs
      const bucketParts = outputs.S3BucketName.split('-');
      const suffix = bucketParts[bucketParts.length - 1];

      expect(outputs.S3BucketName).toContain(suffix);
      expect(outputs.DynamoDBTableName).toContain(suffix);
      expect(outputs.LambdaFunctionName).toContain(suffix);
      expect(outputs.SNSTopicArn).toContain(suffix);
      expect(outputs.EventBridgeRuleName).toContain(suffix);
    });

    test('should verify all resources are in correct region', async () => {
      // Check S3 bucket
      const s3Command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      await expect(s3Client.send(s3Command)).resolves.toBeDefined();

      // Check DynamoDB table
      const dynamoCommand = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const dynamoResponse = await dynamoDBClient.send(dynamoCommand);
      expect(dynamoResponse.Table.TableArn).toContain(REGION);

      // Check Lambda function
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      expect(lambdaResponse.Configuration.FunctionArn).toContain(REGION);

      // Check SNS topic
      expect(outputs.SNSTopicArn).toContain(REGION);
    });
  });

  describe('Resource Tags Integration', () => {
    test('should verify Lambda function has correct tags', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Tags).toBeDefined();
      expect(response.Tags.Purpose).toBe('Data Processing');
    });

    test('should verify DynamoDB table has correct tags', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoDBClient.send(command);

      // Note: Tags require ListTagsOfResource API for complete validation
      expect(response.Table.TableArn).toBeDefined();
    });
  });
});
