import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  PublishCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import axios from 'axios';
import { randomUUID } from 'crypto';

// Validate required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'API_GATEWAY_ENDPOINT',
  'DYNAMODB_TABLE_NAME',
  'S3_BUCKET_NAME',
  'LAMBDA_FUNCTION_NAME',
  'SNS_TOPIC_ARN'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

// Initialize AWS clients
const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });
const lambda = new LambdaClient({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });

describe('TapStack Integration Tests', () => {
  const testId = randomUUID();

  describe('DynamoDB Integration', () => {
    const testItem = {
      PK: { S: `TEST#${testId}` },
      SK: { S: 'TEST_ITEM' },
      Data: { S: 'Integration test data' }
    };

    test('should successfully write and read from DynamoDB', async () => {
      // Write item
      await dynamoDb.send(new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: testItem
      }));

      // Read item
      const result = await dynamoDb.send(new GetItemCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
          PK: testItem.PK,
          SK: testItem.SK
        }
      }));

      expect(result.Item).toBeDefined();
      expect(result.Item?.Data.S).toBe(testItem.Data.S);

      // Cleanup
      await dynamoDb.send(new DeleteItemCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
          PK: testItem.PK,
          SK: testItem.SK
        }
      }));
    }, 30000);
  });

  describe('S3 Integration', () => {
    const testFileName = `test-${testId}.txt`;
    const testContent = 'Integration test content';

    test('should successfully upload and download from S3', async () => {
      // Upload file
      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: testFileName,
        Body: testContent
      }));

      // Download file
      const result = await s3.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: testFileName
      }));

      const downloadedContent = await result.Body?.transformToString();
      expect(downloadedContent).toBe(testContent);

      // Cleanup
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: testFileName
      }));
    }, 30000);
  });

  describe('Lambda Integration', () => {
    test('should successfully invoke Lambda function', async () => {
      const testPayload = {
        test: true,
        testId: testId
      };

      const response = await lambda.send(new InvokeCommand({
        FunctionName: process.env.LAMBDA_FUNCTION_NAME,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(testPayload))
      }));

      const result = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(result.statusCode).toBe(200);
    }, 30000);
  });

  describe('API Gateway Integration', () => {
    test('should successfully call API endpoint', async () => {
      const response = await axios.get(process.env.API_GATEWAY_ENDPOINT as string, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
    }, 30000);

    test('should handle CORS headers', async () => {
      const response = await axios.options(process.env.API_GATEWAY_ENDPOINT as string);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    }, 30000);
  });

  describe('SNS Integration', () => {
    test('should successfully publish to SNS topic', async () => {
      const testMessage = {
        test: true,
        testId: testId,
        message: 'Integration test message'
      };

      const response = await sns.send(new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: JSON.stringify(testMessage)
      }));

      expect(response.MessageId).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Flow', () => {
    test('should process data through the entire stack', async () => {
      // 1. Upload file to S3
      const fileName = `e2e-${testId}.json`;
      const testData = { testId, timestamp: new Date().toISOString() };

      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: JSON.stringify(testData)
      }));

      // 2. Invoke Lambda to process the file
      const lambdaPayload = {
        detail: {
          bucket: process.env.S3_BUCKET_NAME,
          key: fileName
        }
      };

      await lambda.send(new InvokeCommand({
        FunctionName: process.env.LAMBDA_FUNCTION_NAME,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(lambdaPayload))
      }));

      // 3. Check DynamoDB for processed data
      const result = await dynamoDb.send(new GetItemCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
          PK: { S: `FILE#${fileName}` },
          SK: { S: 'METADATA' }
        }
      }));

      expect(result.Item).toBeDefined();
      expect(JSON.parse(result.Item?.data.S || '{}')).toMatchObject({
        fileName,
        processed: true
      });

      // Cleanup
      await Promise.all([
        // Delete S3 file
        s3.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName
        })),
        // Delete DynamoDB entry
        dynamoDb.send(new DeleteItemCommand({
          TableName: process.env.DYNAMODB_TABLE_NAME,
          Key: {
            PK: { S: `FILE#${fileName}` },
            SK: { S: 'METADATA' }
          }
        }))
      ]);
    }, 60000);
  });
});
