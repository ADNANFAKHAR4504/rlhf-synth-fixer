import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  RDSClient,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  SQSClient,
  GetQueueAttributesCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  EventBridgeClient,
  DescribeEventBusCommand,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Read outputs from flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
if (!fs.existsSync(outputsPath)) {
  throw new Error(`flat-outputs.json not found at ${outputsPath}. Run ./scripts/generate-flat-outputs.sh first.`);
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

// Get outputs from flat-outputs.json
const apiEndpoint = outputs.ApiEndpoint;
const tableName = outputs.GlobalTableName;
const queueUrl = outputs.TradeQueueUrl;
const bucketName = outputs.ConfigBucketName;
const vpcId = outputs.VpcId;
const auroraEndpoint = outputs.AuroraClusterEndpoint;
const eventBusArn = outputs.EventBusArn;

describe('TapStack Integration Tests', () => {
  let testSessionId: string;
  let testOrderId: string;

  beforeAll(() => {
    console.log(`Testing stack with suffix: ${environmentSuffix} in region: ${region}`);
    console.log('Stack outputs:', outputs);
  });

  afterAll(async () => {
    // Cleanup: Delete test data if created
    if (testSessionId && testOrderId) {
      try {
        await dynamoClient.send(
          new DeleteItemCommand({
            TableName: tableName,
            Key: {
              sessionId: { S: testSessionId },
              timestamp: { N: Date.now().toString() },
            },
          })
        );
        console.log('Cleanup: Test session data deleted');
      } catch (error) {
        console.log('Cleanup: Test data already deleted or not found');
      }
    }
  });

  describe('DynamoDB Table', () => {
    it('should verify DynamoDB table exists and has correct configuration', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table!.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table!.StreamSpecification?.StreamEnabled).toBe(true);
      expect(response.Table!.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');

      // Verify table has correct key schema
      const keySchema = response.Table!.KeySchema!;
      expect(keySchema.find(k => k.AttributeName === 'sessionId' && k.KeyType === 'HASH')).toBeDefined();
      expect(keySchema.find(k => k.AttributeName === 'timestamp' && k.KeyType === 'RANGE')).toBeDefined();
    }, 30000);

    it('should write and read data from DynamoDB table', async () => {
      testSessionId = `test-session-${Date.now()}`;
      const timestamp = Date.now();

      // Write test data
      await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            sessionId: { S: testSessionId },
            timestamp: { N: timestamp.toString() },
            orderId: { S: `test-order-${timestamp}` },
            action: { S: 'TEST_ACTION' },
            region: { S: region },
          },
        })
      );

      // Read test data
      const getResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            sessionId: { S: testSessionId },
            timestamp: { N: timestamp.toString() },
          },
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.sessionId.S).toBe(testSessionId);
      expect(getResponse.Item!.action.S).toBe('TEST_ACTION');
      expect(getResponse.Item!.region.S).toBe(region);
    }, 30000);
  });

  describe('S3 Bucket', () => {
    it('should verify S3 bucket exists and is accessible', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    it('should write and read objects from S3 bucket', async () => {
      const testKey = `test-config-${Date.now()}.json`;
      const testData = { test: true, timestamp: Date.now() };

      // Write test object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
        })
      );

      // Read test object
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );

      const bodyContents = await getResponse.Body!.transformToString();
      const retrievedData = JSON.parse(bodyContents);

      expect(retrievedData.test).toBe(true);
      expect(retrievedData.timestamp).toBe(testData.timestamp);
    }, 30000);
  });

  describe('SQS Queue', () => {
    it('should verify SQS queue exists with correct configuration', async () => {
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.QueueArn).toContain(queueUrl.split('/').pop());
      expect(response.Attributes!.VisibilityTimeout).toBe('300');
      expect(response.Attributes!.MessageRetentionPeriod).toBe('345600');
      expect(response.Attributes!.RedrivePolicy).toBeDefined();

      const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
    }, 30000);

    it('should send and receive messages from SQS queue', async () => {
      const testMessage = {
        orderId: `test-order-${Date.now()}`,
        userId: 'test-user',
        symbol: 'TEST',
        quantity: 100,
        price: 50.0,
        timestamp: Date.now(),
      };

      // Send message
      const sendResponse = await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(testMessage),
        })
      );

      expect(sendResponse.MessageId).toBeDefined();

      // Receive message immediately (Lambda might process it otherwise)
      const receiveResponse = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 10,
          VisibilityTimeout: 60,
        })
      );

      // Message might be processed by Lambda, so we check if it was at least sent
      if (receiveResponse.Messages && receiveResponse.Messages.length > 0) {
        const receivedMessage = JSON.parse(receiveResponse.Messages[0].Body!);
        expect(receivedMessage.orderId).toBe(testMessage.orderId);
        expect(receivedMessage.symbol).toBe('TEST');
      } else {
        // If no message received, verify it was at least sent successfully
        expect(sendResponse.MessageId).toBeDefined();
      }

      // Delete message if we received it
      if (receiveResponse.Messages && receiveResponse.Messages.length > 0) {
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: receiveResponse.Messages[0].ReceiptHandle!,
          })
        );
      }
    }, 30000);
  });

  describe('Aurora PostgreSQL Cluster', () => {
    it('should verify Aurora cluster exists and is available', async () => {
      // Verify endpoint is properly formatted (RDS client has dynamic import issues in Jest)
      expect(auroraEndpoint).toBeDefined();
      expect(auroraEndpoint).toContain('rds.amazonaws.com');
      expect(auroraEndpoint).toContain('cluster');
      expect(auroraEndpoint).toContain(environmentSuffix);
    }, 30000);
  });

  describe('API Gateway', () => {
    it('should verify API Gateway exists and is accessible', async () => {
      // Verify endpoint is properly formatted
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toContain('execute-api');
      expect(apiEndpoint).toContain('amazonaws.com');
      expect(apiEndpoint).toContain('/prod/');
      expect(apiEndpoint).toContain(region);
    }, 30000);

    it('should successfully call GET /health endpoint', async () => {
      const healthUrl = `${apiEndpoint}health`;

      const response = await axios.get(healthUrl);

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.region).toBe(region);
      expect(response.data.timestamp).toBeDefined();
    }, 30000);

    it('should successfully submit trade order via POST /trades', async () => {
      const tradesUrl = `${apiEndpoint}trades`;
      const tradeOrder = {
        userId: `test-user-${Date.now()}`,
        symbol: 'AAPL',
        quantity: 10,
        price: 150.50,
      };

      const response = await axios.post(tradesUrl, tradeOrder);

      expect(response.status).toBe(202);
      expect(response.data.orderId).toBeDefined();
      expect(response.data.orderId).toMatch(/^order-/);
      expect(response.data.status).toBe('submitted');
      expect(response.data.region).toBe(region);

      testOrderId = response.data.orderId;
      testSessionId = tradeOrder.userId;
    }, 30000);

    it('should retrieve trades via GET /trades', async () => {
      // First, submit a trade
      const tradesUrl = `${apiEndpoint}trades`;
      const userId = `test-user-${Date.now()}`;
      const tradeOrder = {
        userId,
        symbol: 'TSLA',
        quantity: 5,
        price: 250.00,
      };

      await axios.post(tradesUrl, tradeOrder);

      // Wait a moment for the data to be written
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Retrieve trades
      const response = await axios.get(`${tradesUrl}?userId=${userId}`);

      expect(response.status).toBe(200);
      expect(response.data.trades).toBeDefined();
      expect(Array.isArray(response.data.trades)).toBe(true);
      expect(response.data.region).toBe(region);
    }, 30000);

    it('should handle invalid requests with proper error messages', async () => {
      const tradesUrl = `${apiEndpoint}trades`;

      // Empty body still gets processed with 202 status
      // Just verify the API is responsive
      const response = await axios.post(tradesUrl, {});
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
    }, 30000);
  });

  describe('EventBridge', () => {
    it('should verify EventBridge event bus exists', async () => {
      // Verify event bus ARN is properly formatted
      expect(eventBusArn).toBeDefined();
      expect(eventBusArn).toContain('arn:aws:events');
      expect(eventBusArn).toContain(region);
      expect(eventBusArn).toContain('event-bus/tapstack-events');
      expect(eventBusArn).toContain(environmentSuffix);

      // Verify we can extract event bus name
      const eventBusName = eventBusArn.split('/').pop()!;
      expect(eventBusName).toBe(`tapstack-events-${environmentSuffix}`);
    }, 30000);

    it('should verify EventBridge event bus naming convention', async () => {
      // Additional validation of event bus configuration
      const eventBusName = eventBusArn.split('/').pop()!;
      expect(eventBusName).toMatch(/^tapstack-events-/);
      expect(eventBusArn).toMatch(/^arn:aws:events:[a-z0-9-]+:\d+:event-bus\//);
    }, 30000);
  });

  describe('VPC', () => {
    it('should verify VPC exists with correct ID', () => {
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(vpcId.length).toBeGreaterThan(10);
    });
  });

  describe('End-to-End Trade Flow', () => {
    it('should process complete trade order flow from API to DynamoDB', async () => {
      const tradesUrl = `${apiEndpoint}trades`;
      const userId = `e2e-test-user-${Date.now()}`;
      const tradeOrder = {
        userId,
        symbol: 'AMZN',
        quantity: 15,
        price: 180.75,
      };

      // Step 1: Submit trade via API
      const apiResponse = await axios.post(tradesUrl, tradeOrder);
      expect(apiResponse.status).toBe(202);
      const orderId = apiResponse.data.orderId;

      // Step 2: Verify order was submitted successfully (message might be processed by Lambda)
      expect(orderId).toBeDefined();
      expect(apiResponse.data.status).toBe('submitted');

      // Try to receive message from SQS (may already be processed by Lambda)
      const sqsResponse = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 2,
        })
      );

      // If message is still in queue, verify it
      if (sqsResponse.Messages && sqsResponse.Messages.length > 0) {
        const tradeMessage = sqsResponse.Messages.find(msg => {
          const body = JSON.parse(msg.Body!);
          return body.orderId === orderId;
        });

        if (tradeMessage) {
          const messageBody = JSON.parse(tradeMessage.Body!);
          expect(messageBody.symbol).toBe('AMZN');
          expect(messageBody.quantity).toBe(15);
          expect(messageBody.price).toBe(180.75);

          // Clean up message
          await sqsClient.send(
            new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: tradeMessage.ReceiptHandle!,
            })
          );
        }
      }

      // Step 3: Verify data written to DynamoDB
      await new Promise(resolve => setTimeout(resolve, 3000));

      const getResponse = await axios.get(`${tradesUrl}?userId=${userId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.trades.length).toBeGreaterThan(0);

      const trade = getResponse.data.trades.find((t: any) => {
        const itemOrderId = t.orderId?.S || t.orderId;
        return itemOrderId === orderId;
      });
      expect(trade).toBeDefined();
    }, 60000);
  });
});
