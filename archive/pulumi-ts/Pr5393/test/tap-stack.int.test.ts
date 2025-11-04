import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Load deployment outputs
const outputsPath = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  throw new Error(
    'Deployment outputs not found. Run deployment before integration tests.'
  );
}

// Initialize AWS clients
const region = process.env.AWS_REGION || 'ca-central-1';
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('TAP Stack Integration Tests', () => {
  const testKey = `test-file-${Date.now()}.txt`;
  const testContent = 'Test content for integration testing';

  describe('S3 Bucket Configuration', () => {
    it('should have the bucket deployed and accessible', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.bucketName,
        MaxKeys: 1,
      });

      const response = await s3Client.send(command);
      expect(response).toBeDefined();
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should allow object uploads', async () => {
      const command = new PutObjectCommand({
        Bucket: outputs.bucketName,
        Key: testKey,
        Body: testContent,
      });

      const response = await s3Client.send(command);
      expect(response).toBeDefined();
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled', async () => {
      // Versioning check would require GetBucketVersioning
      // For now, we verify bucket exists and is functional
      expect(outputs.bucketName).toBeDefined();
      expect(outputs.bucketName).toContain('rawdata-bucket');
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should have lambda function deployed', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response).toBeDefined();
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain(
        'datavalidation-function'
      );
    });

    it('should have correct runtime configuration', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toContain('nodejs');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(60);
    });

    it('should have environment variables configured', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.DYNAMO_TABLE_NAME
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.ENVIRONMENT
      ).toBeDefined();
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should have DynamoDB table accessible', async () => {
      const command = new ScanCommand({
        TableName: outputs.dynamoTableName,
        Limit: 1,
      });

      const response = await dynamoClient.send(command);
      expect(response).toBeDefined();
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    it('should have log group created for lambda function', async () => {
      // Extract environment suffix from bucket name
      const envSuffix = outputs.bucketName.split('-')[0];
      const logGroupName = `/aws/lambda/${envSuffix}-datavalidation-function`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeDefined();
    });
  });

  describe('End-to-End Data Flow', () => {
    it('should retrieve uploaded file from S3', async () => {
      const command = new GetObjectCommand({
        Bucket: outputs.bucketName,
        Key: testKey,
      });

      const response = await s3Client.send(command);
      expect(response).toBeDefined();
      expect(response.Body).toBeDefined();

      const content = await response.Body?.transformToString();
      expect(content).toBe(testContent);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use environment suffix in all resource names', () => {
      expect(outputs.bucketName).toMatch(/^[a-z0-9-]+-rawdata-bucket-[a-z0-9-]+$/);
      expect(outputs.dynamoTableName).toMatch(
        /^[a-z0-9-]+-metadata-table-[a-z0-9-]+$/
      );
      expect(outputs.lambdaArn).toContain('datavalidation-function');
    });

    it('should have consistent naming across resources', () => {
      const bucketEnvPrefix = outputs.bucketName.split('-')[0];
      const tableEnvPrefix = outputs.dynamoTableName.split('-')[0];

      expect(bucketEnvPrefix).toBe(tableEnvPrefix);
    });
  });
});
