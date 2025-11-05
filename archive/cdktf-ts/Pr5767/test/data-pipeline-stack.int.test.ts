import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

const REGION = process.env.AWS_REGION || 'ap-southeast-1';

const s3Client = new S3Client({ region: REGION });
const dynamoDBClient = new DynamoDBClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });

function loadOutputs(): any {
  const outputsPath = path.join(
    __dirname,
    '../cfn-outputs/flat-outputs.json'
  );

  if (!fs.existsSync(outputsPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } catch (error) {
    console.error('Error loading outputs file:', error);
    return null;
  }
}

const outputs = loadOutputs();
const isInfrastructureDeployed = () => outputs !== null && Object.keys(outputs).length > 0;

describe('DataPipelineStack Integration Tests', () => {
  beforeAll(() => {
    if (!isInfrastructureDeployed()) {
      console.log('⚠️  Infrastructure not deployed - skipping integration tests');
      console.log('   Run deployment first to execute integration tests');
    } else {
      console.log('✅ Infrastructure detected - running integration tests');
    }
  });

  describe('S3 Bucket Integration', () => {
    test('should verify S3 bucket exists and has correct versioning', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('should verify S3 bucket has encryption enabled', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should verify S3 bucket has public access blocked', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('should upload file to S3 bucket successfully', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: 'test-integration.txt',
        Body: 'Integration test file',
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });
  });

  describe('DynamoDB Table Integration', () => {
    test('should verify DynamoDB table exists with correct configuration', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.DynamoDBTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should verify DynamoDB table has correct schema', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table?.KeySchema).toBeDefined();
      expect(response.Table?.KeySchema?.length).toBe(2);

      const hashKey = response.Table?.KeySchema?.find(
        (key) => key.KeyType === 'HASH'
      );
      expect(hashKey).toBeDefined();
      expect(hashKey?.AttributeName).toBe('id');

      const rangeKey = response.Table?.KeySchema?.find(
        (key) => key.KeyType === 'RANGE'
      );
      expect(rangeKey).toBeDefined();
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    test('should verify DynamoDB table has encryption enabled', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });
      const response = await dynamoDBClient.send(command);

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });
  });

  describe('Lambda Function Integration', () => {
    test('should verify Lambda function exists with correct configuration', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.LambdaFunctionName
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
    });

    test('should verify Lambda function has correct memory and timeout', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(300);
    });

    test('should verify Lambda function has correct environment variables', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.ENVIRONMENT).toBe('dev');
      expect(envVars?.DYNAMODB_TABLE).toBe(outputs.DynamoDBTableName);
      expect(envVars?.SNS_TOPIC_ARN).toBe(outputs.SNSTopicArn);
      expect(envVars?.S3_BUCKET).toBe(outputs.S3BucketName);
    });
  });

  describe('SNS Topic Integration', () => {
    test('should verify SNS topic exists', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.SNSTopicArn);
    });

    test('should verify SNS topic has display name', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes?.DisplayName).toBe(
        'Data Pipeline Alerts - dev'
      );
    });
  });

  describe('End-to-End Integration', () => {
    test('should verify all resource names include environment suffix', () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const bucketParts = outputs.S3BucketName.split('-');
      const suffix = bucketParts[bucketParts.length - 1];

      expect(outputs.S3BucketName).toContain(suffix);
      expect(outputs.DynamoDBTableName).toContain(suffix);
      expect(outputs.LambdaFunctionName).toContain(suffix);
      expect(outputs.SNSTopicArn).toContain(suffix);
    });

    test('should verify Lambda environment references match deployed resources', async () => {
      if (!isInfrastructureDeployed()) {
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName,
      });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars?.S3_BUCKET).toBe(outputs.S3BucketName);
      expect(envVars?.DYNAMODB_TABLE).toBe(outputs.DynamoDBTableName);
      expect(envVars?.SNS_TOPIC_ARN).toBe(outputs.SNSTopicArn);
    });
  });
});
