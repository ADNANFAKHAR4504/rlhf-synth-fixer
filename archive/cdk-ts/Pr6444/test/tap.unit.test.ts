import { APIGatewayProxyEvent, SQSEvent, EventBridgeEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Set environment variables before importing handlers
process.env.REGION = 'us-east-1';
process.env.SESSION_TABLE_NAME = 'test-sessions-table';
process.env.TRADE_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
process.env.ENVIRONMENT_SUFFIX = 'test';
process.env.CONFIG_BUCKET_NAME = 'test-config-bucket';

// Import handlers after setting env vars
import { handler as apiHandler } from '../lib/lambda/api-handler/index';
import { handler as tradeProcessor } from '../lib/lambda/trade-processor/index';
import { handler as eventHandler } from '../lib/lambda/event-handler/index';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Mock AWS SDK clients
const dynamoMock = mockClient(DynamoDBClient);
const sqsMock = mockClient(SQSClient);
const s3Mock = mockClient(S3Client);

describe('TapStack Unit Tests', () => {
  beforeEach(() => {
    dynamoMock.reset();
    sqsMock.reset();
    s3Mock.reset();
    jest.clearAllMocks();
  });

  describe('API Handler Lambda', () => {
    describe('GET /health', () => {
      it('should return healthy status with correct headers', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/health',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: null,
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(200);
        expect(result.headers).toEqual({ 'Content-Type': 'application/json' });

        const body = JSON.parse(result.body);
        expect(body.status).toBe('healthy');
        expect(body.region).toBe('us-east-1');
        expect(body.timestamp).toBeDefined();
        expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0);
      });
    });

    describe('POST /trades', () => {
      it('should submit trade order successfully', async () => {
        dynamoMock.on(PutItemCommand).resolves({});
        sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: JSON.stringify({
            userId: 'user-123',
            symbol: 'AAPL',
            quantity: 10,
            price: 150.50,
          }),
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(202);
        expect(result.headers['Content-Type']).toBe('application/json');

        const body = JSON.parse(result.body);
        expect(body.orderId).toMatch(/^order-\d+-[a-z0-9]+$/);
        expect(body.status).toBe('submitted');
        expect(body.region).toBe('us-east-1');

        // Verify DynamoDB was called correctly
        expect(dynamoMock.commandCalls(PutItemCommand).length).toBe(1);
        const dynamoCall = dynamoMock.commandCalls(PutItemCommand)[0].args[0].input;
        expect(dynamoCall.TableName).toBe('test-sessions-table');
        expect(dynamoCall.Item?.sessionId.S).toBe('user-123');
        expect(dynamoCall.Item?.action.S).toBe('ORDER_SUBMITTED');
        expect(dynamoCall.Item?.region.S).toBe('us-east-1');
        expect(dynamoCall.Item?.timestamp.N).toBeDefined();

        // Verify SQS was called correctly
        expect(sqsMock.commandCalls(SendMessageCommand).length).toBe(1);
        const sqsCall = sqsMock.commandCalls(SendMessageCommand)[0].args[0].input;
        expect(sqsCall.QueueUrl).toBe('https://sqs.us-east-1.amazonaws.com/123456789012/test-queue');

        const messageBody = JSON.parse(sqsCall.MessageBody!);
        expect(messageBody.orderId).toMatch(/^order-/);
        expect(messageBody.userId).toBe('user-123');
        expect(messageBody.symbol).toBe('AAPL');
        expect(messageBody.quantity).toBe(10);
        expect(messageBody.price).toBe(150.50);
        expect(messageBody.timestamp).toBeDefined();
      });

      it('should return 400 when body is missing', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: null,
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Request body required');
        expect(dynamoMock.commandCalls(PutItemCommand).length).toBe(0);
        expect(sqsMock.commandCalls(SendMessageCommand).length).toBe(0);
      });

      it('should handle DynamoDB errors gracefully', async () => {
        dynamoMock.on(PutItemCommand).rejects(new Error('DynamoDB connection failed'));

        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: JSON.stringify({
            userId: 'user-123',
            symbol: 'AAPL',
          }),
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Internal server error');
        expect(body.message).toBe('DynamoDB connection failed');
      });

      it('should handle SQS errors gracefully', async () => {
        dynamoMock.on(PutItemCommand).resolves({});
        sqsMock.on(SendMessageCommand).rejects(new Error('SQS queue not available'));

        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: JSON.stringify({
            userId: 'user-123',
            symbol: 'AAPL',
          }),
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Internal server error');
        expect(body.message).toBe('SQS queue not available');
      });

      it('should use anonymous user when userId is not provided', async () => {
        dynamoMock.on(PutItemCommand).resolves({});
        sqsMock.on(SendMessageCommand).resolves({ MessageId: 'test-message-id' });

        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: JSON.stringify({
            symbol: 'TSLA',
            quantity: 5,
            price: 250.00,
          }),
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(202);

        const dynamoCall = dynamoMock.commandCalls(PutItemCommand)[0].args[0].input;
        expect(dynamoCall.Item?.sessionId.S).toBe('anonymous');
      });

      it('should handle invalid JSON in request body', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: 'invalid json{',
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Internal server error');
        expect(body.message).toContain('Unexpected token');
      });

      it('should handle non-Error exceptions with Unknown error message', async () => {
        // Mock JSON.parse to throw a non-Error type
        const originalParse = JSON.parse;
        (global as any).JSON = {
          ...JSON,
          parse: (text: string) => {
            if (text && text.includes('throw-non-error')) {
              throw { code: 'CUSTOM_ERROR', details: 'Not an Error object' };
            }
            return originalParse(text);
          },
          stringify: JSON.stringify,
        };

        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: 'throw-non-error',
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Internal server error');
        expect(body.message).toBe('Unknown error');

        // Restore original JSON.parse
        (global as any).JSON = { parse: originalParse, stringify: JSON.stringify };
      });

    });

    describe('GET /trades', () => {
      it('should return trades for specified user', async () => {
        dynamoMock.on(QueryCommand).resolves({
          Items: [
            {
              sessionId: { S: 'user-123' },
              timestamp: { N: '1699999999999' },
              orderId: { S: 'order-123' },
              action: { S: 'ORDER_SUBMITTED' },
              region: { S: 'us-east-1' },
            },
            {
              sessionId: { S: 'user-123' },
              timestamp: { N: '1699999998888' },
              orderId: { S: 'order-122' },
              action: { S: 'ORDER_EXECUTED' },
              region: { S: 'us-east-1' },
            },
          ],
        });

        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: { userId: 'user-123' },
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: null,
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(200);

        const body = JSON.parse(result.body);
        expect(body.trades).toHaveLength(2);
        expect(body.region).toBe('us-east-1');

        const queryCall = dynamoMock.commandCalls(QueryCommand)[0].args[0].input;
        expect(queryCall.TableName).toBe('test-sessions-table');
        expect(queryCall.KeyConditionExpression).toBe('sessionId = :userId');
        expect(queryCall.ExpressionAttributeValues?.[':userId'].S).toBe('user-123');
        expect(queryCall.Limit).toBe(20);
        expect(queryCall.ScanIndexForward).toBe(false);
      });

      it('should return empty array when no trades found', async () => {
        dynamoMock.on(QueryCommand).resolves({ Items: [] });

        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: { userId: 'user-123' },
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: null,
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.trades).toEqual([]);
      });

      it('should return empty array when Items is undefined', async () => {
        dynamoMock.on(QueryCommand).resolves({ Items: undefined });

        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: { userId: 'user-789' },
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: null,
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.trades).toEqual([]);
        expect(body.region).toBe('us-east-1');
      });

      it('should use anonymous when userId is not provided', async () => {
        dynamoMock.on(QueryCommand).resolves({ Items: [] });

        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: null,
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(200);

        const queryCall = dynamoMock.commandCalls(QueryCommand)[0].args[0].input;
        expect(queryCall.ExpressionAttributeValues?.[':userId'].S).toBe('anonymous');
      });

      it('should handle query errors gracefully', async () => {
        dynamoMock.on(QueryCommand).rejects(new Error('Query failed'));

        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: { userId: 'user-123' },
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: null,
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Internal server error');
      });
    });

    describe('404 Not Found', () => {
      it('should return 404 for unknown paths', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/unknown',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: null,
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(404);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Not found');
      });

      it('should return 404 for unsupported methods', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'DELETE',
          path: '/trades',
          headers: {},
          multiValueHeaders: {},
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          pathParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: '',
          body: null,
          isBase64Encoded: false,
        };

        const result = await apiHandler(event);

        expect(result.statusCode).toBe(404);
      });
    });
  });

  describe('Trade Processor Lambda', () => {
    it('should process single trade order successfully', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('No config'));
      dynamoMock.on(PutItemCommand).resolves({});

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify({
              orderId: 'order-123',
              userId: 'user-123',
              symbol: 'AAPL',
              quantity: 10,
              price: 150.50,
              timestamp: Date.now(),
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1699999999999',
              SenderId: 'sender-1',
              ApproximateFirstReceiveTimestamp: '1699999999999',
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await tradeProcessor(event);

      expect(dynamoMock.commandCalls(PutItemCommand).length).toBe(1);
      const dynamoCall = dynamoMock.commandCalls(PutItemCommand)[0].args[0].input;
      expect(dynamoCall.TableName).toBe('test-sessions-table');
      expect(dynamoCall.Item?.sessionId.S).toBe('user-123');
      expect(dynamoCall.Item?.orderId.S).toBe('order-123');
      expect(dynamoCall.Item?.symbol.S).toBe('AAPL');
      expect(dynamoCall.Item?.quantity.N).toBe('10');
      expect(dynamoCall.Item?.price.N).toBe('150.5');
      expect(dynamoCall.Item?.region.S).toBe('us-east-1');
      expect(dynamoCall.Item?.processedAt.S).toBeDefined();
    });

    it('should load and use S3 config when available', async () => {
      const mockConfig = { maxRetries: 5, timeout: 30000 };
      const mockStream = {
        transformToString: async () => JSON.stringify(mockConfig),
      };

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });
      dynamoMock.on(PutItemCommand).resolves({});

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify({
              orderId: 'order-123',
              userId: 'user-123',
              symbol: 'AAPL',
              quantity: 10,
              price: 150.50,
              timestamp: Date.now(),
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1699999999999',
              SenderId: 'sender-1',
              ApproximateFirstReceiveTimestamp: '1699999999999',
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await tradeProcessor(event);

      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(1);
      expect(dynamoMock.commandCalls(PutItemCommand).length).toBe(1);
    });

    it('should process multiple trade orders in parallel', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('No config'));
      dynamoMock.on(PutItemCommand).resolves({});

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify({
              orderId: 'order-1',
              userId: 'user-1',
              symbol: 'AAPL',
              quantity: 10,
              price: 150.50,
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1699999999999',
              SenderId: 'sender-1',
              ApproximateFirstReceiveTimestamp: '1699999999999',
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
          {
            messageId: 'msg-2',
            receiptHandle: 'receipt-2',
            body: JSON.stringify({
              orderId: 'order-2',
              userId: 'user-2',
              symbol: 'TSLA',
              quantity: 5,
              price: 250.00,
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1699999999999',
              SenderId: 'sender-1',
              ApproximateFirstReceiveTimestamp: '1699999999999',
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await tradeProcessor(event);

      expect(dynamoMock.commandCalls(PutItemCommand).length).toBe(2);
    });

    it('should reject invalid trade orders', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('No config'));

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify({
              orderId: 'order-123',
              // Missing required fields
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1699999999999',
              SenderId: 'sender-1',
              ApproximateFirstReceiveTimestamp: '1699999999999',
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await expect(tradeProcessor(event)).rejects.toThrow('Invalid trade order');
      expect(dynamoMock.commandCalls(PutItemCommand).length).toBe(0);
    });

    it('should handle DynamoDB errors during trade processing', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('No config'));
      dynamoMock.on(PutItemCommand).rejects(new Error('DynamoDB error'));

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify({
              orderId: 'order-123',
              userId: 'user-123',
              symbol: 'AAPL',
              quantity: 10,
              price: 150.50,
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1699999999999',
              SenderId: 'sender-1',
              ApproximateFirstReceiveTimestamp: '1699999999999',
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1',
          },
        ],
      };

      await expect(tradeProcessor(event)).rejects.toThrow('DynamoDB error');
    });

  });

  describe('Event Handler Lambda', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle Trade Executed events', async () => {
      const event: EventBridgeEvent<string, any> = {
        version: '0',
        id: 'event-1',
        'detail-type': 'Trade Executed',
        source: 'trading.platform',
        account: '123456789012',
        time: '2023-01-01T00:00:00Z',
        region: 'us-east-1',
        resources: [],
        detail: {
          eventType: 'trade_executed',
          data: {
            orderId: 'order-123',
            symbol: 'AAPL',
            quantity: 10,
          },
          timestamp: '2023-01-01T00:00:00Z',
        },
      };

      await eventHandler(event);

      expect(console.log).toHaveBeenCalled();
      const calls = (console.log as jest.Mock).mock.calls;
      const hasExpectedCall = calls.some(call =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('Handling Trade Executed event'))
      );
      expect(hasExpectedCall).toBe(true);
    });

    it('should handle System Alert events', async () => {
      const event: EventBridgeEvent<string, any> = {
        version: '0',
        id: 'event-1',
        'detail-type': 'System Alert',
        source: 'trading.platform',
        account: '123456789012',
        time: '2023-01-01T00:00:00Z',
        region: 'us-east-1',
        resources: [],
        detail: {
          eventType: 'system_alert',
          data: {
            severity: 'high',
            message: 'Database connection issue',
          },
          timestamp: '2023-01-01T00:00:00Z',
        },
      };

      await eventHandler(event);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('ALERT: System event'),
        expect.anything()
      );
    });

    it('should handle unknown event types gracefully', async () => {
      const event: EventBridgeEvent<string, any> = {
        version: '0',
        id: 'event-1',
        'detail-type': 'Unknown Event',
        source: 'trading.platform',
        account: '123456789012',
        time: '2023-01-01T00:00:00Z',
        region: 'us-east-1',
        resources: [],
        detail: {
          eventType: 'unknown',
          data: {},
          timestamp: '2023-01-01T00:00:00Z',
        },
      };

      await eventHandler(event);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Unknown event type: Unknown Event')
      );
    });
  });

  describe('CDK Stack Tests', () => {
    it('should create TapStack with correct configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        env: { region: 'us-east-1' },
        environmentSuffix: 'test',
        region: 'us-east-1',
      });

      // Verify stack properties
      expect(stack.vpc).toBeDefined();
      expect(stack.auroraCluster).toBeDefined();
      expect(stack.globalTable).toBeDefined();
      expect(stack.configBucket).toBeDefined();
      expect(stack.tradeQueue).toBeDefined();
      expect(stack.api).toBeDefined();

      // Synthesize to verify no errors
      const template = Template.fromStack(stack);

      // Verify key resources exist
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::SQS::Queue', 2); // Main queue + DLQ
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::Lambda::Function', 5); // API, Processor, EventHandler + 2 log retention functions
      template.resourceCountIs('AWS::Events::EventBus', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    it('should use correct resource names with environment suffix', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        env: { region: 'us-east-1' },
        environmentSuffix: 'pr1234',
        region: 'us-east-1',
      });

      const template = Template.fromStack(stack);

      // Verify DynamoDB table name
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tapstack-sessions-pr1234',
      });

      // Verify S3 bucket name
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tapstack-config-pr1234-us-east-1',
      });

      // Verify SQS queue names
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'tapstack-orders-pr1234',
      });

      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'tapstack-orders-dlq-pr1234',
      });
    });

    it('should configure Aurora with correct settings', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        env: { region: 'us-east-1' },
        environmentSuffix: 'test',
        region: 'us-east-1',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.12',
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 2,
        },
        StorageEncrypted: true,
      });
    });

    it('should configure API Gateway with correct endpoints', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        env: { region: 'us-east-1' },
        environmentSuffix: 'test',
        region: 'us-east-1',
      });

      const template = Template.fromStack(stack);

      // Verify API Gateway configuration
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tapstack-api-test',
      });

      // Verify API resources exist
      template.resourceCountIs('AWS::ApiGateway::Resource', 2); // /trades and /health
      template.resourceCountIs('AWS::ApiGateway::Method', 3); // POST /trades, GET /trades, GET /health
    });
  });

  describe('Environment Variable Defaults', () => {
    it('should use default environment variables when not set', async () => {
      // Save current env vars
      const savedEnv = {
        REGION: process.env.REGION,
        SESSION_TABLE_NAME: process.env.SESSION_TABLE_NAME,
        TRADE_QUEUE_URL: process.env.TRADE_QUEUE_URL,
      };

      // Clear env vars
      delete process.env.REGION;
      delete process.env.SESSION_TABLE_NAME;
      delete process.env.TRADE_QUEUE_URL;

      // Reset modules to reload handlers with new env vars
      jest.resetModules();

      // Re-import handlers using require
      const { handler: apiHandlerWithDefaults } = require('../lib/lambda/api-handler/index');
      const { handler: eventHandlerWithDefaults } = require('../lib/lambda/event-handler/index');

      // Test API handler uses defaults
      const apiEvent: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/health',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        body: null,
        isBase64Encoded: false,
      };

      const apiResult = await apiHandlerWithDefaults(apiEvent);
      expect(apiResult.statusCode).toBe(200);
      const body = JSON.parse(apiResult.body);
      expect(body.region).toBe('us-east-1'); // default REGION

      // Test event handler uses defaults
      const eventBridgeEvent: EventBridgeEvent<string, any> = {
        version: '0',
        id: 'test-id',
        'detail-type': 'Trade Executed',
        source: 'test',
        account: '123456789012',
        time: new Date().toISOString(),
        region: 'us-east-1',
        resources: [],
        detail: {
          eventType: 'Trade Executed',
          data: { orderId: 'test-123' },
          timestamp: new Date().toISOString(),
        },
      };

      await expect(eventHandlerWithDefaults(eventBridgeEvent)).resolves.not.toThrow();

      // Restore env vars
      process.env.REGION = savedEnv.REGION;
      process.env.SESSION_TABLE_NAME = savedEnv.SESSION_TABLE_NAME;
      process.env.TRADE_QUEUE_URL = savedEnv.TRADE_QUEUE_URL;

      // Reset modules again to restore original handlers
      jest.resetModules();
    });
  });
});
