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
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  PublishCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import axios from 'axios';
import { randomUUID } from 'crypto';

// Read CloudFormation outputs
import fs from 'fs';
import path from 'path';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

// Define interface for CloudFormation outputs
interface CloudFormationOutputs {
  ApiEndpoint?: string;
  DynamoDBTableName?: string;
  S3BucketName?: string;
  LambdaArn?: string;
  SNSTopicArn?: string;
}

let outputs: CloudFormationOutputs = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  console.warn('Warning: flat-outputs.json not found, using environment variables.');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr2827';

// Environment configuration - first try outputs, then environment variables, then construct from suffix
const config = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  API_GATEWAY_ENDPOINT: outputs.ApiEndpoint || process.env.API_GATEWAY_ENDPOINT,
  DYNAMODB_TABLE_NAME: outputs.DynamoDBTableName || process.env.DYNAMODB_TABLE_NAME || `tapstack-table-${environmentSuffix}`,
  S3_BUCKET_NAME: outputs.S3BucketName || process.env.S3_BUCKET_NAME || `tapstack-${environmentSuffix}-${process.env.AWS_ACCOUNT_ID || ''}`,
  LAMBDA_FUNCTION_NAME: outputs.LambdaArn?.split(':').pop() || process.env.LAMBDA_FUNCTION_NAME || `tap-${environmentSuffix}-LambdaFunction`,
  SNS_TOPIC_ARN: outputs.SNSTopicArn || process.env.SNS_TOPIC_ARN || `arn:aws:sns:${process.env.AWS_REGION || 'us-east-1'}:${process.env.AWS_ACCOUNT_ID || ''}:tapstack-notifications-${environmentSuffix}`
};

// Validate configuration
Object.entries(config).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required configuration: ${key}. Ensure CloudFormation outputs exist or environment variable is set.`);
  }
});

// Initialize AWS clients
const dynamoDb = new DynamoDBClient({ region: config.AWS_REGION });
const s3 = new S3Client({ region: config.AWS_REGION });
const lambda = new LambdaClient({ region: config.AWS_REGION });
const sns = new SNSClient({ region: config.AWS_REGION });

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
        TableName: config.DYNAMODB_TABLE_NAME,
        Item: testItem
      }));

      // Read item
      const result = await dynamoDb.send(new GetItemCommand({
        TableName: config.DYNAMODB_TABLE_NAME,
        Key: {
          PK: testItem.PK,
          SK: testItem.SK
        }
      }));

      expect(result.Item).toBeDefined();
      expect(result.Item?.Data.S).toBe(testItem.Data.S);

      // Cleanup
      await dynamoDb.send(new DeleteItemCommand({
        TableName: config.DYNAMODB_TABLE_NAME,
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
        Bucket: config.S3_BUCKET_NAME,
        Key: testFileName,
        Body: testContent
      }));

      // Download file
      const result = await s3.send(new GetObjectCommand({
        Bucket: config.S3_BUCKET_NAME,
        Key: testFileName
      }));

      const downloadedContent = await result.Body?.transformToString();
      expect(downloadedContent).toBe(testContent);

      // Cleanup
      await s3.send(new DeleteObjectCommand({
        Bucket: config.S3_BUCKET_NAME,
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
        FunctionName: config.LAMBDA_FUNCTION_NAME,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(testPayload))
      }));

      const result = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(result.statusCode).toBe(200);
    }, 30000);
  });

  describe('API Gateway Integration', () => {
    test('should successfully call API endpoint', async () => {
      const response = await axios.get(config.API_GATEWAY_ENDPOINT as string, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
    }, 30000);

    test('should handle CORS headers', async () => {
      const response = await axios.options(config.API_GATEWAY_ENDPOINT as string, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      console.log('CORS Response Headers:', response.headers);

      // API Gateway converts header names to lowercase
      expect(response.headers['access-control-allow-origin'] || response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['access-control-allow-methods'] || response.headers['Access-Control-Allow-Methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers'] || response.headers['Access-Control-Allow-Headers']).toBeDefined();
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
        TopicArn: config.SNS_TOPIC_ARN,
        Message: JSON.stringify(testMessage)
      }));

      expect(response.MessageId).toBeDefined();
    }, 30000);
  });

  describe('Advanced Integration Tests', () => {
    test('should handle large items in DynamoDB', async () => {
      const largeData = {
        id: testId,
        timestamp: new Date().toISOString(),
        data: Array(100).fill('test data').join(' ') // Create a larger payload
      };

      const testItem = {
        PK: { S: `LARGE#${testId}` },
        SK: { S: 'TEST_ITEM' },
        Data: { S: JSON.stringify(largeData) }
      };

      // Write large item
      await dynamoDb.send(new PutItemCommand({
        TableName: config.DYNAMODB_TABLE_NAME,
        Item: testItem
      }));

      // Read and verify
      const result = await dynamoDb.send(new GetItemCommand({
        TableName: config.DYNAMODB_TABLE_NAME,
        Key: {
          PK: testItem.PK,
          SK: testItem.SK
        }
      }));

      expect(result.Item).toBeDefined();
      expect(JSON.parse(result.Item?.Data.S || '{}')).toMatchObject(largeData);

      // Cleanup
      await dynamoDb.send(new DeleteItemCommand({
        TableName: config.DYNAMODB_TABLE_NAME,
        Key: {
          PK: testItem.PK,
          SK: testItem.SK
        }
      }));
    }, 30000);

    test('should handle binary data in S3', async () => {
      const binaryData = Buffer.from('Binary content for testing', 'utf8');
      const testFileName = `binary-${testId}.bin`;

      // Upload binary file
      await s3.send(new PutObjectCommand({
        Bucket: config.S3_BUCKET_NAME,
        Key: testFileName,
        Body: binaryData,
        ContentType: 'application/octet-stream'
      }));

      // Get object metadata
      const headResponse = await s3.send(new HeadObjectCommand({
        Bucket: config.S3_BUCKET_NAME,
        Key: testFileName
      }));

      expect(headResponse.ContentType).toBe('application/octet-stream');
      expect(headResponse.ContentLength).toBe(binaryData.length);

      // Download and verify
      const getResponse = await s3.send(new GetObjectCommand({
        Bucket: config.S3_BUCKET_NAME,
        Key: testFileName
      }));

      const downloadedData = await getResponse.Body?.transformToByteArray();
      expect(Buffer.from(downloadedData as Uint8Array)).toEqual(binaryData);

      // Cleanup
      await s3.send(new DeleteObjectCommand({
        Bucket: config.S3_BUCKET_NAME,
        Key: testFileName
      }));
    }, 30000);

    test('should handle structured data in Lambda and SNS', async () => {
      const structuredData = {
        testId,
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'test',
          version: '1.0'
        },
        payload: {
          message: 'Test message',
          priority: 'high'
        }
      };

      // First publish to SNS
      const snsResponse = await sns.send(new PublishCommand({
        TopicArn: config.SNS_TOPIC_ARN,
        Message: JSON.stringify(structuredData),
        MessageAttributes: {
          'testId': {
            DataType: 'String',
            StringValue: testId
          }
        }
      }));

      expect(snsResponse.MessageId).toBeDefined();

      // Then process with Lambda
      const lambdaResponse = await lambda.send(new InvokeCommand({
        FunctionName: config.LAMBDA_FUNCTION_NAME,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify({
          Records: [{
            Sns: {
              Message: JSON.stringify(structuredData),
              MessageAttributes: {
                testId: {
                  Type: 'String',
                  Value: testId
                }
              }
            }
          }]
        }))
      }));

      const responsePayload = lambdaResponse.Payload ? JSON.parse(Buffer.from(lambdaResponse.Payload).toString()) : undefined;
      expect(responsePayload.statusCode).toBe(200);
    }, 30000);
  });
});
