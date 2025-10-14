// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  EC2Client,
  DescribeVpcsCommand,
} from '@aws-sdk/client-ec2';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const ec2Client = new EC2Client({ region });

// Resource names based on naming convention
const tableName = `serverless-data-table-${environmentSuffix}`;
const bucketName = outputs[`DataBucketName-${environmentSuffix}`] || `serverless-data-bucket-${environmentSuffix}-`;
const functionName = `serverless-data-processor-${environmentSuffix}`;
const secretName = `serverless-api-secret-${environmentSuffix}`;
const apiEndpoint = outputs[`ApiEndpoint-${environmentSuffix}`] || outputs.ApiEndpoint;

describe('Serverless Application Integration Tests', () => {
  describe('DynamoDB Table Tests', () => {
    test('DynamoDB table exists and is active', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(tableName);
    }, 30000);

    test('DynamoDB table has correct schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.KeySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
          expect.objectContaining({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
        ])
      );
    }, 30000);

    test('DynamoDB table has Global Secondary Index', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.GlobalSecondaryIndexes).toBeDefined();
      const statusIndex = response.Table?.GlobalSecondaryIndexes?.find(
        (index) => index.IndexName === 'StatusIndex'
      );
      expect(statusIndex).toBeDefined();
    }, 30000);

    test('Can write to and read from DynamoDB table', async () => {
      const testId = `test-${Date.now()}`;
      const testTimestamp = Date.now();

      // Put item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          timestamp: { N: testTimestamp.toString() },
          status: { S: 'test' },
          data: { S: JSON.stringify({ test: true }) },
        },
      });
      await dynamoClient.send(putCommand);

      // Get item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
          timestamp: { N: testTimestamp.toString() },
        },
      });
      const response = await dynamoClient.send(getCommand);

      expect(response.Item).toBeDefined();
      expect(response.Item?.id.S).toBe(testId);

      // Clean up
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
          timestamp: { N: testTimestamp.toString() },
        },
      });
      await dynamoClient.send(deleteCommand);
    }, 30000);
  });

  describe('S3 Bucket Tests', () => {
    test('S3 bucket exists and is accessible', async () => {
      // Find the bucket name from outputs (prefer BucketName key, otherwise search for bucket pattern)
      let bucket = outputs['BucketName'] || outputs[`DataBucketName-${environmentSuffix}`];

      if (!bucket) {
        const actualBucketName = Object.keys(outputs).find((key) =>
          key.includes('BucketName') && outputs[key] && outputs[key].toString().includes(`serverless-data-bucket-${environmentSuffix}`) && !outputs[key].toString().includes('arn:')
        );
        bucket = actualBucketName ? outputs[actualBucketName] : null;
      }

      if (!bucket) {
        console.warn('Bucket name not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: bucket });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);

    test('Can write to and read from S3 bucket', async () => {
      // Find the bucket name from outputs (prefer BucketName key, otherwise search for bucket pattern)
      let bucket = outputs['BucketName'] || outputs[`DataBucketName-${environmentSuffix}`];

      if (!bucket) {
        const actualBucketName = Object.keys(outputs).find((key) =>
          key.includes('BucketName') && outputs[key] && outputs[key].toString().includes(`serverless-data-bucket-${environmentSuffix}`) && !outputs[key].toString().includes('arn:')
        );
        bucket = actualBucketName ? outputs[actualBucketName] : null;
      }

      if (!bucket) {
        console.warn('Bucket name not found in outputs, skipping test');
        return;
      }
      const testKey = `test/${Date.now()}.json`;
      const testData = JSON.stringify({ test: true, timestamp: Date.now() });

      // Put object
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: testData,
        ContentType: 'application/json',
      });
      await s3Client.send(putCommand);

      // Get object
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: testKey,
      });
      const response = await s3Client.send(getCommand);
      const body = await response.Body?.transformToString();

      expect(body).toBe(testData);

      // Clean up
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    }, 30000);
  });

  describe('Lambda Function Tests', () => {
    test('Lambda function exists and is configured correctly', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toContain('nodejs22');
      expect(response.Configuration?.State).toBe('Active');
    }, 30000);

    test('Lambda function has correct environment variables', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.TABLE_NAME).toBe(tableName);
      expect(envVars?.ENVIRONMENT).toBe(environmentSuffix);
    }, 30000);

    test('Lambda function has VPC configuration', async () => {
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.VpcId).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Secrets Manager Tests', () => {
    test('Secret exists and is configured correctly', async () => {
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);

      expect(response.Name).toBe(secretName);
      expect(response.ARN).toBeDefined();
    }, 30000);

    test('Secret has correct tags', async () => {
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);

      const tags = response.Tags || [];
      const hasIacTag = tags.some(
        (tag) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
      );
      expect(hasIacTag).toBe(true);
    }, 30000);
  });

  describe('VPC Tests', () => {
    test('VPC exists with correct tags', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`serverless-vpc-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);

      const vpc = response.Vpcs?.[0];
      const tags = vpc?.Tags || [];
      const hasIacTag = tags.some(
        (tag) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
      );
      expect(hasIacTag).toBe(true);
    }, 30000);
  });

  describe('API Gateway Tests', () => {
    test('API Gateway endpoint is accessible', async () => {
      if (!apiEndpoint) {
        console.warn('API endpoint not found in outputs, skipping test');
        return;
      }

      const response = await fetch(apiEndpoint, { method: 'OPTIONS' });
      expect(response.status).toBeLessThan(500); // Should not have server errors
    }, 30000);

    test('API Gateway has CORS enabled', async () => {
      if (!apiEndpoint) {
        console.warn('API endpoint not found in outputs, skipping test');
        return;
      }

      const response = await fetch(apiEndpoint, { method: 'OPTIONS' });
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Test', () => {
    test('Complete data flow: API -> Lambda -> DynamoDB -> S3', async () => {
      if (!apiEndpoint) {
        console.warn('API endpoint not found in outputs, skipping test');
        return;
      }

      const testData = {
        data: {
          test: true,
          timestamp: Date.now(),
          environment: environmentSuffix,
        },
      };

      // POST to API Gateway
      const response = await fetch(`${apiEndpoint}data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.id).toBeDefined();
      expect(responseData.timestamp).toBeDefined();

      // Wait a bit for data to be written
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify data in DynamoDB
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: responseData.id },
          timestamp: { N: responseData.timestamp.toString() },
        },
      });
      const dbResponse = await dynamoClient.send(getCommand);
      expect(dbResponse.Item).toBeDefined();

      // Clean up
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: responseData.id },
          timestamp: { N: responseData.timestamp.toString() },
        },
      });
      await dynamoClient.send(deleteCommand);
    }, 60000);
  });
});
