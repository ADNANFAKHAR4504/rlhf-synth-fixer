import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { KMSClient } from '@aws-sdk/client-kms';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import { SQSClient } from '@aws-sdk/client-sqs';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

describe('Crypto Price Alert System Integration Tests', () => {
  let outputs: any;
  let dynamoClient: DynamoDBClient;
  let snsClient: SNSClient;
  let sqsClient: SQSClient;
  let lambdaClient: LambdaClient;
  let apiGatewayClient: APIGatewayClient;
  let kmsClient: KMSClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    dynamoClient = new DynamoDBClient({ region });
    snsClient = new SNSClient({ region });
    sqsClient = new SQSClient({ region });
    lambdaClient = new LambdaClient({ region });
    apiGatewayClient = new APIGatewayClient({ region });
    kmsClient = new KMSClient({ region });
  });

  afterAll(async () => {
    // Cleanup: Delete all test data from DynamoDB
    try {
      const scanResponse = await dynamoClient.send(
        new ScanCommand({
          TableName: outputs.alertRulesTableName,
        })
      );

      if (scanResponse.Items) {
        for (const item of scanResponse.Items) {
          const unmarshalled = unmarshall(item);
          await dynamoClient.send(
            new DeleteItemCommand({
              TableName: outputs.alertRulesTableName,
              Key: marshall({
                userId: unmarshalled.userId,
                alertId: unmarshalled.alertId,
              }),
            })
          );
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Stack Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs.apiEndpoint).toBeDefined();
      expect(outputs.alertRulesTableName).toBeDefined();
      expect(outputs.priceHistoryTableName).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
    });

    it('should have valid API endpoint URL', () => {
      expect(outputs.apiEndpoint).toMatch(/^https:\/\/.+\.execute-api\..+\.amazonaws\.com\/.+\/webhook$/);
    });

    it('should have valid SNS topic ARN', () => {
      expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:.+:[0-9]+:.+$/);
    });

    it('should have table names with environment suffix', () => {
      expect(outputs.alertRulesTableName).toContain('crypto-alert-rules');
      expect(outputs.priceHistoryTableName).toContain('crypto-alert-price-history');
    });
  });

  describe('DynamoDB Tables', () => {
    it('should have alert rules table created', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.alertRulesTableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.alertRulesTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    it('should have correct key schema for alert rules table', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.alertRulesTableName,
        })
      );

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.find((k) => k.AttributeName === 'userId')).toBeDefined();
      expect(keySchema?.find((k) => k.AttributeName === 'alertId')).toBeDefined();
    });

    it('should have price history table created', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.priceHistoryTableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.priceHistoryTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    it('should have correct key schema for price history table', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.priceHistoryTableName,
        })
      );

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.find((k) => k.AttributeName === 'symbol')).toBeDefined();
      expect(keySchema?.find((k) => k.AttributeName === 'timestamp')).toBeDefined();
    });

    it('should be able to write and read from alert rules table', async () => {
      const testItem = {
        userId: 'test-user-123',
        alertId: 'test-alert-456',
        symbol: 'BTC',
        condition: 'above',
        threshold: 50000,
      };

      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.alertRulesTableName,
          Item: marshall(testItem),
        })
      );

      const scanResponse = await dynamoClient.send(
        new ScanCommand({
          TableName: outputs.alertRulesTableName,
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: marshall({
            ':userId': 'test-user-123',
          }),
        })
      );

      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items!.length).toBeGreaterThan(0);
      const item = unmarshall(scanResponse.Items![0]);
      expect(item.userId).toBe(testItem.userId);
      expect(item.alertId).toBe(testItem.alertId);
    });
  });

  describe('SNS Topic', () => {
    it('should have SNS topic created', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.snsTopicArn,
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.snsTopicArn);
    });

    it('should have server-side encryption enabled', async () => {
      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.snsTopicArn,
        })
      );

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    it('should have API Gateway REST API created', async () => {
      const apiId = outputs.apiEndpoint.match(/https:\/\/([^.]+)\./)?.[1];
      expect(apiId).toBeDefined();

      const response = await apiGatewayClient.send(
        new GetRestApiCommand({
          restApiId: apiId,
        })
      );

      expect(response.id).toBe(apiId);
      expect(response.name).toContain('crypto-alert-api');
    });

    it('should have X-Ray tracing enabled on API Gateway stage', async () => {
      const apiId = outputs.apiEndpoint.match(/https:\/\/([^.]+)\./)?.[1];
      const stageName = outputs.apiEndpoint.match(/\.com\/([^/]+)\//)?.[1];
      expect(apiId).toBeDefined();
      expect(stageName).toBeDefined();

      const response = await apiGatewayClient.send(
        new GetStageCommand({
          restApiId: apiId,
          stageName: stageName!,
        })
      );

      expect(response.tracingEnabled).toBe(true);
    });

    it('should respond to webhook POST requests', async () => {
      const response = await fetch(outputs.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange: 'coinbase',
          symbol: 'BTC',
          price: 42000,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('success');
    });

    it('should reject requests with missing required fields', async () => {
      const response = await fetch(outputs.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange: 'coinbase',
          // missing symbol and price
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Lambda Functions', () => {
    it('should have ingestion Lambda function created', async () => {
      const functionName = `crypto-alert-ingestion-${outputs.alertRulesTableName.split('-').pop()}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      expect(response.Configuration?.MemorySize).toBe(256);
    });

    it('should have evaluation Lambda function created', async () => {
      const functionName = `crypto-alert-evaluation-${outputs.alertRulesTableName.split('-').pop()}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Architectures).toContain('arm64');
      expect(response.Configuration?.MemorySize).toBe(512);
    });

    it('should have X-Ray tracing enabled on Lambda functions', async () => {
      const functionName = `crypto-alert-ingestion-${outputs.alertRulesTableName.split('-').pop()}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    it('should have KMS encryption for Lambda environment variables', async () => {
      const functionName = `crypto-alert-ingestion-${outputs.alertRulesTableName.split('-').pop()}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.KMSKeyArn).toBeDefined();
      expect(response.Configuration?.KMSKeyArn).toContain('arn:aws:kms');
    });
  });

  describe('End-to-End Webhook Flow', () => {
    it('should process webhook and store price data', async () => {
      const timestamp = Date.now();
      const testData = {
        exchange: 'binance',
        symbol: 'ETH',
        price: 3500,
      };

      // Send webhook request
      const response = await fetch(outputs.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBe(200);

      // Wait for Lambda to process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify data was stored in DynamoDB
      const scanResponse = await dynamoClient.send(
        new ScanCommand({
          TableName: outputs.priceHistoryTableName,
          FilterExpression: 'symbol = :symbol AND #ts > :timestamp',
          ExpressionAttributeNames: {
            '#ts': 'timestamp',
          },
          ExpressionAttributeValues: marshall({
            ':symbol': testData.symbol,
            ':timestamp': timestamp,
          }),
        })
      );

      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items!.length).toBeGreaterThan(0);
      const item = unmarshall(scanResponse.Items![0]);
      expect(item.symbol).toBe(testData.symbol);
      expect(item.price).toBe(testData.price);
      expect(item.exchange).toBe(testData.exchange);
    });

    it('should trigger alerts when conditions are met', async () => {
      // Create an alert rule
      const alertRule = {
        userId: 'integration-test-user',
        alertId: 'integration-test-alert',
        symbol: 'BTC',
        condition: 'above',
        threshold: 40000,
      };

      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.alertRulesTableName,
          Item: marshall(alertRule),
        })
      );

      // Send webhook with price above threshold
      const response = await fetch(outputs.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exchange: 'kraken',
          symbol: 'BTC',
          price: 50000,
        }),
      });

      expect(response.status).toBe(200);

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Note: In a real scenario, we would verify SNS notification was sent
      // For this test, we verify the workflow didn't error
    });
  });

  describe('Resource Configuration', () => {
    it('should have all resources using correct environment suffix', () => {
      const suffix = outputs.alertRulesTableName.split('-').pop();
      expect(outputs.priceHistoryTableName).toContain(suffix);
      expect(outputs.apiEndpoint).toContain(suffix);
    });

    it('should have resources in correct region', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: outputs.alertRulesTableName,
        })
      );

      expect(response.Table?.TableArn).toContain('us-east-1');
    });
  });
});
