/**
 * Integration tests for TapStack
 * Tests actual deployed resources using cfn-outputs/flat-outputs.json
 * NO MOCKING - uses real AWS resources
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  EventBridgeClient,
  PutEventsCommand,
  DescribeEventBusCommand,
} from '@aws-sdk/client-eventbridge';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  DescribeTableCommand,
  ScanCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  const outputsData = fs.readFileSync(outputsPath, 'utf-8');
  outputs = JSON.parse(outputsData);
} catch (error) {
  console.error('Failed to load cfn-outputs/flat-outputs.json:', error);
  throw new Error(
    'cfn-outputs/flat-outputs.json not found. Run deployment first.'
  );
}

const region = process.env.AWS_REGION || 'us-east-1';

describe('TapStack Integration Tests', () => {
  describe('EventBridge Resources', () => {
    const eventBridgeClient = new EventBridgeClient({ region });

    it('should have deployed custom event bus', async () => {
      const command = new DescribeEventBusCommand({
        Name: outputs.eventBusName,
      });

      const response = await eventBridgeClient.send(command);

      expect(response.Arn).toBe(outputs.eventBusArn);
      expect(response.Name).toBe(outputs.eventBusName);
    });

    it('should be able to put events to custom event bus', async () => {
      const command = new PutEventsCommand({
        Entries: [
          {
            Source: 'crypto.exchange',
            DetailType: 'PriceUpdate',
            Detail: JSON.stringify({
              symbol: 'BTC',
              price: 50000.0,
              timestamp: Date.now(),
            }),
            EventBusName: outputs.eventBusName,
          },
        ],
      });

      const response = await eventBridgeClient.send(command);

      expect(response.FailedEntryCount).toBe(0);
      expect(response.Entries).toHaveLength(1);
      expect(response.Entries?.[0].EventId).toBeTruthy();
    });
  });

  describe('Lambda Functions', () => {
    const lambdaClient = new LambdaClient({ region });

    it('should have deployed price-processor function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.priceProcessorFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(
        outputs.priceProcessorFunctionName
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    it('should have deployed alert-generator function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.alertGeneratorFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(
        outputs.alertGeneratorFunctionName
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    it('should be able to invoke price-processor function', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.priceProcessorFunctionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          detail: {
            symbol: 'ETH',
            price: 3000.0,
          },
        }),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const payload = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );
      expect(payload.statusCode).toBe(200);
    });
  });

  describe('DynamoDB Table', () => {
    const dynamodbClient = new DynamoDBClient({ region });

    it('should have deployed price-history table', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamodbTableName,
      });

      const response = await dynamodbClient.send(command);

      expect(response.Table?.TableName).toBe(outputs.dynamodbTableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
      expect(response.Table?.KeySchema).toEqual([
        { AttributeName: 'symbol', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ]);
    });

    it('should verify data is written to DynamoDB after Lambda invocation', async () => {
      const lambdaClient = new LambdaClient({ region });

      // Invoke price processor to write data
      const testSymbol = 'TEST' + Date.now();
      const testPrice = 12345.67;

      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.priceProcessorFunctionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({
            detail: {
              symbol: testSymbol,
              price: testPrice,
            },
          }),
        })
      );

      // Wait a bit for write to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Scan DynamoDB for the test record
      const scanCommand = new ScanCommand({
        TableName: outputs.dynamodbTableName,
        FilterExpression: '#sym = :symbol',
        ExpressionAttributeNames: {
          '#sym': 'symbol',
        },
        ExpressionAttributeValues: {
          ':symbol': { S: testSymbol },
        },
      });

      const scanResponse = await dynamodbClient.send(scanCommand);

      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items!.length).toBeGreaterThan(0);

      const item = scanResponse.Items![0];
      expect(item.symbol.S).toBe(testSymbol);
      expect(parseFloat(item.price.N!)).toBe(testPrice);

      // Cleanup: delete test record
      await dynamodbClient.send(
        new DeleteItemCommand({
          TableName: outputs.dynamodbTableName,
          Key: {
            symbol: { S: testSymbol },
            timestamp: { N: item.timestamp.N! },
          },
        })
      );
    }, 15000);
  });

  describe('SNS Topic', () => {
    const snsClient = new SNSClient({ region });

    it('should have deployed price-alerts topic', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);

      expect(response.Attributes?.TopicArn).toBe(outputs.snsTopicArn);
    });
  });

  describe('CloudWatch Log Groups', () => {
    const logsClient = new CloudWatchLogsClient({ region });

    it('should have created log group for price-processor function', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.priceProcessorFunctionName}`,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe(
        `/aws/lambda/${outputs.priceProcessorFunctionName}`
      );
      expect(response.logGroups![0].retentionInDays).toBe(14);
    });

    it('should have created log group for alert-generator function', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.alertGeneratorFunctionName}`,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe(
        `/aws/lambda/${outputs.alertGeneratorFunctionName}`
      );
      expect(response.logGroups![0].retentionInDays).toBe(14);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should process price event through entire workflow', async () => {
      const eventBridgeClient = new EventBridgeClient({ region });
      const dynamodbClient = new DynamoDBClient({ region });

      // 1. Send price event to EventBridge
      const testSymbol = 'E2E' + Date.now();
      const testPrice = 98765.43;

      const putEventsCommand = new PutEventsCommand({
        Entries: [
          {
            Source: 'crypto.exchange',
            DetailType: 'PriceUpdate',
            Detail: JSON.stringify({
              symbol: testSymbol,
              price: testPrice,
              timestamp: Date.now(),
            }),
            EventBusName: outputs.eventBusName,
          },
        ],
      });

      const putEventsResponse =
        await eventBridgeClient.send(putEventsCommand);
      expect(putEventsResponse.FailedEntryCount).toBe(0);

      // 2. Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 3. Verify data in DynamoDB
      const scanCommand = new ScanCommand({
        TableName: outputs.dynamodbTableName,
        FilterExpression: '#sym = :symbol',
        ExpressionAttributeNames: {
          '#sym': 'symbol',
        },
        ExpressionAttributeValues: {
          ':symbol': { S: testSymbol },
        },
      });

      const scanResponse = await dynamodbClient.send(scanCommand);

      expect(scanResponse.Items).toBeDefined();
      expect(scanResponse.Items!.length).toBeGreaterThan(0);

      const item = scanResponse.Items![0];
      expect(item.symbol.S).toBe(testSymbol);
      expect(parseFloat(item.price.N!)).toBe(testPrice);

      // Cleanup
      await dynamodbClient.send(
        new DeleteItemCommand({
          TableName: outputs.dynamodbTableName,
          Key: {
            symbol: { S: testSymbol },
            timestamp: { N: item.timestamp.N! },
          },
        })
      );
    }, 20000);
  });
});
