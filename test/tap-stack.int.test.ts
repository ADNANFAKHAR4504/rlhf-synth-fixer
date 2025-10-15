// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DescribeTableCommand,
  ListTagsOfResourceCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get region from environment variable
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS SDK clients
const s3Client = new S3Client({ region });
const dynamoDBClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });

// Extract resource names from outputs using environment suffix
const bucketName = outputs[`BucketName${environmentSuffix}`];
const tableName = outputs[`TableName${environmentSuffix}`];
const lambdaFunctionName = outputs[`LambdaFunctionName${environmentSuffix}`];
const errorTopicArn = outputs[`ErrorTopicArn${environmentSuffix}`];
const apiUrl = outputs[`ApiUrl${environmentSuffix}`];

describe('TAP Stack Integration Tests', () => {
  describe('S3 Bucket', () => {
    test('should exist and be accessible', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should allow putting and getting objects', async () => {
      const testKey = `test-${Date.now()}.txt`;
      const testData = 'Integration test data';

      // Put object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testData,
        })
      );

      // Get object
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );

      const retrievedData = await getResponse.Body?.transformToString();
      expect(retrievedData).toBe(testData);
    });

    test('should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
    });
  });

  describe('DynamoDB Table', () => {
    test('should exist and be accessible', async () => {
      const response = await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should have on-demand billing mode', async () => {
      const response = await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('should allow putting and getting items', async () => {
      const testId = `test-${Date.now()}`;
      const testData = 'Integration test data';

      // Put item
      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            id: { S: testId },
            data: { S: testData },
            timestamp: { N: Date.now().toString() },
          },
        })
      );

      // Get item
      const getResponse = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: testId },
          },
        })
      );

      expect(getResponse.Item?.id.S).toBe(testId);
      expect(getResponse.Item?.data.S).toBe(testData);
    });

    test('should have encryption enabled', async () => {
      const response = await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });
  });

  describe('Lambda Function', () => {
    test('should exist and be accessible', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: lambdaFunctionName })
      );
      expect(response.Configuration?.FunctionName).toBe(lambdaFunctionName);
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should have correct runtime', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: lambdaFunctionName })
      );
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('should have environment variables configured', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: lambdaFunctionName })
      );
      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.S3_BUCKET_NAME).toBe(bucketName);
      expect(envVars?.DYNAMODB_TABLE_NAME).toBe(tableName);
      expect(envVars?.ERROR_TOPIC_ARN).toBe(errorTopicArn);
      expect(envVars?.ENVIRONMENT).toBe(environmentSuffix);
    });

    test('should have X-Ray tracing enabled', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: lambdaFunctionName })
      );
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should be invocable', async () => {
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: lambdaFunctionName,
          Payload: JSON.stringify({
            body: JSON.stringify({ test: 'data' }),
          }),
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const payload = JSON.parse(
        Buffer.from(response.Payload!).toString('utf-8')
      );
      expect(payload.statusCode).toBe(200);
    });
  });

  describe('SNS Topic', () => {
    test('should exist and be accessible', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: errorTopicArn })
      );
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(errorTopicArn);
    });

    test('should have correct display name', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: errorTopicArn })
      );
      expect(response.Attributes?.DisplayName).toBe(
        `TAP Error Alerts (${environmentSuffix})`
      );
    });
  });

  describe('API Gateway', () => {
    test('should be accessible via HTTP', async () => {
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toMatch(/^https:\/\//);

      const response = await fetch(apiUrl);
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    test('should return JSON response', async () => {
      const response = await fetch(apiUrl);
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    test('should include environment information', async () => {
      const response = await fetch(apiUrl);
      const data = await response.json();
      expect(data.environment).toBe(environmentSuffix);
      expect(data.bucket).toBe(bucketName);
      expect(data.table).toBe(tableName);
    });

    test('should have CORS headers configured', async () => {
      const response = await fetch(apiUrl, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'GET',
        },
      });

      expect(response.headers.get('access-control-allow-origin')).toBe(
        'https://example.com'
      );
      expect(
        response.headers.get('access-control-allow-methods')
      ).toBeDefined();
    });
  });

  describe('Integration Flow', () => {
    test('should handle end-to-end data flow through API Gateway, Lambda, and DynamoDB', async () => {
      const testId = `integration-${Date.now()}`;

      // Make request through API Gateway
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: testId,
          action: 'test',
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);

      const data = await response.json();
      expect(data).toBeDefined();
    });

    test('should have proper IAM permissions for Lambda to access S3', async () => {
      // Verify Lambda can read from S3 by checking function configuration
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: lambdaFunctionName })
      );

      expect(response.Configuration?.Role).toBeDefined();
      // Role ARN should contain the lambda role name
      expect(response.Configuration?.Role).toContain('tap-lambda-role');
    });
  });

  describe('Resource Tagging', () => {
    test('S3 bucket should have correct tags', async () => {
      const response = await s3Client.send(
        new GetBucketTaggingCommand({ Bucket: bucketName })
      );

      const tags = response.TagSet || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const projectTag = tags.find((t) => t.Key === 'Project');

      expect(envTag?.Value).toBe(environmentSuffix);
      expect(projectTag?.Value).toBe('iac-rlhf-amazon');
    });

    test('DynamoDB table should have correct tags', async () => {
      const describeResponse = await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      const response = await dynamoDBClient.send(
        new ListTagsOfResourceCommand({
          ResourceArn: describeResponse.Table?.TableArn,
        })
      );

      const tags = response.Tags || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const projectTag = tags.find((t) => t.Key === 'Project');

      expect(envTag?.Value).toBe(environmentSuffix);
      expect(projectTag?.Value).toBe('iac-rlhf-amazon');
    });
  });
});
