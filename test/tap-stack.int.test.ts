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

  describe('End-to-End Flow', () => {
    test('should process data through the entire stack', async () => {
      // 1. Upload file to S3
      const fileName = `e2e-${testId}.json`;
      const testData = { testId, timestamp: new Date().toISOString() };

      await s3.send(new PutObjectCommand({
        Bucket: config.S3_BUCKET_NAME,
        Key: fileName,
        Body: JSON.stringify(testData)
      }));

      // 2. Invoke Lambda to process the file
      // Wait a bit for S3 consistency
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify the file exists in S3 before triggering Lambda
      const s3HeadResponse = await s3.send(new HeadObjectCommand({
        Bucket: config.S3_BUCKET_NAME,
        Key: fileName
      }));

      console.log('S3 file metadata:', s3HeadResponse);

      // Create S3 event payload that matches the actual S3 event format
      const lambdaPayload = {
        Records: [{
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          awsRegion: config.AWS_REGION,
          eventTime: new Date().toISOString(),
          eventName: 'ObjectCreated:Put',
          eventSourceARN: `arn:aws:s3:::${config.S3_BUCKET_NAME}`,
          s3: {
            s3SchemaVersion: '1.0',
            bucket: {
              name: config.S3_BUCKET_NAME,
              arn: `arn:aws:s3:::${config.S3_BUCKET_NAME}`,
              ownerIdentity: {
                principalId: 'EXAMPLE'
              }
            },
            object: {
              key: fileName,
              size: Buffer.from(JSON.stringify(testData)).length,
              eTag: s3HeadResponse.ETag?.replace(/"/g, '') || 'test-etag',
              sequencer: Date.now().toString()
            }
          },
          requestParameters: {
            sourceIPAddress: '127.0.0.1'
          },
          responseElements: {
            'x-amz-request-id': 'EXAMPLE123456789',
            'x-amz-id-2': 'EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH'
          }
        }]
      };

      console.log('Invoking Lambda with payload:', JSON.stringify(lambdaPayload, null, 2));

      const lambdaResponse = await lambda.send(new InvokeCommand({
        FunctionName: config.LAMBDA_FUNCTION_NAME,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(lambdaPayload))
      }));

      const responsePayload = lambdaResponse.Payload ? Buffer.from(lambdaResponse.Payload).toString() : undefined;
      console.log('Lambda response:', {
        StatusCode: lambdaResponse.StatusCode,
        FunctionError: lambdaResponse.FunctionError,
        Response: responsePayload
      });

      if (lambdaResponse.FunctionError) {
        throw new Error(`Lambda invocation failed: ${lambdaResponse.FunctionError}`);
      }

      // Parse and check the response for errors
      if (responsePayload) {
        const parsedResponse = JSON.parse(responsePayload);
        if (parsedResponse.errorMessage || parsedResponse.errorType) {
          console.error('Lambda execution error:', parsedResponse);
          throw new Error(`Lambda execution failed: ${parsedResponse.errorMessage}`);
        }
      }

      // 3. Check DynamoDB for processed data with retries
      const maxRetries = 10;
      const retryDelay = 3000; // 3 seconds
      let result = await dynamoDb.send(new GetItemCommand({
        TableName: config.DYNAMODB_TABLE_NAME,
        Key: {
          PK: { S: `FILE#${fileName}` },
          SK: { S: 'METADATA' }
        }
      }));

      console.log('Initial DynamoDB query result:', JSON.stringify(result, null, 2));

      // Retry if item not found
      for (let i = 0; i < maxRetries - 1 && !result.Item; i++) {
        console.log(`Retry ${i + 1}/${maxRetries - 1} - Waiting ${retryDelay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        result = await dynamoDb.send(new GetItemCommand({
          TableName: config.DYNAMODB_TABLE_NAME,
          Key: {
            PK: { S: `FILE#${fileName}` },
            SK: { S: 'METADATA' }
          }
        }));
        console.log(`Retry ${i + 1} result:`, JSON.stringify(result, null, 2));
      }

      console.log('Final DynamoDB Item:', JSON.stringify(result.Item, null, 2));
      expect(result.Item).toBeDefined();

      // Try all potential attribute names that the Lambda might use
      const itemData = result.Item?.data?.S || result.Item?.Data?.S || result.Item?.content?.S || result.Item?.Content?.S || '{}';
      console.log('Item Data:', itemData);

      // Log the full DynamoDB response for debugging
      console.log('Full DynamoDB Response:', JSON.stringify(result, null, 2));

      const parsedData = JSON.parse(itemData);
      console.log('Parsed Item Data:', parsedData);

      expect(parsedData).toMatchObject({
        fileName,
        processed: true
      });      // Cleanup
      await Promise.all([
        // Delete S3 file
        s3.send(new DeleteObjectCommand({
          Bucket: config.S3_BUCKET_NAME,
          Key: fileName
        })),
        // Delete DynamoDB entry
        dynamoDb.send(new DeleteItemCommand({
          TableName: config.DYNAMODB_TABLE_NAME,
          Key: {
            PK: { S: `FILE#${fileName}` },
            SK: { S: 'METADATA' }
          }
        }))
      ]);
    }, 90000); // Increased timeout for retries
  });
});
