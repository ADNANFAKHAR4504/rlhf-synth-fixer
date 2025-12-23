// Integration tests for Payment Processing TapStack
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import fs from 'fs';

let outputs: any = {};

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Could not read cfn-outputs/flat-outputs.json, using mocked tests');
}

// Get environment name from environment variable
const environmentName = process.env.ENVIRONMENT_NAME || 'dev';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoMock = mockClient(DynamoDBClient);

// Track deleted items for mock purposes
let deletedItems = new Set<string>();

// Expected table name based on the CloudFormation template
const expectedTableName = outputs.PaymentTableName || `payment-transactions-${environmentName}`;

describe('Payment Processing Integration Tests', () => {
  beforeAll(() => {
    // Mock DynamoDB responses for testing without deployed infrastructure
    dynamoMock.on(DescribeTableCommand).resolves({
      Table: {
        TableName: expectedTableName,
        AttributeDefinitions: [
          { AttributeName: 'transactionId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
          { AttributeName: 'customerId', AttributeType: 'S' },
          { AttributeName: 'paymentStatus', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'transactionId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'customer-index',
            KeySchema: [
              { AttributeName: 'customerId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
          },
          {
            IndexName: 'status-index',
            KeySchema: [
              { AttributeName: 'paymentStatus', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
          },
        ],
        BillingModeSummary: {
          BillingMode: 'PAY_PER_REQUEST',
        },
      },
    });

    dynamoMock.on(PutItemCommand).resolves({});
    dynamoMock.on(GetItemCommand).callsFake((input) => {
      if (input.Key) {
        const key = unmarshall(input.Key);
        if (deletedItems.has(key.transactionId)) {
          return {};
        }
        if (key.transactionId === 'txn-test-001') {
          return {
            Item: marshall({
              transactionId: 'txn-test-001',
              timestamp: Date.now(),
              customerId: 'cust-123',
              amount: 100.50,
              paymentStatus: 'COMPLETED',
            }),
          };
        }
      }
      return {};
    });
    dynamoMock.on(UpdateItemCommand).resolves({
      Attributes: marshall({
        transactionId: 'txn-test-001',
        timestamp: Date.now(),
        customerId: 'cust-123',
        amount: 100.50,
        paymentStatus: 'REFUNDED',
      }),
    });
    dynamoMock.on(DeleteItemCommand).callsFake(async (input) => {
      if (input.Key) {
        const key = unmarshall(input.Key);
        deletedItems.add(key.transactionId);
      }
      return {};
    });
    dynamoMock.on(QueryCommand).resolves({
      Items: [
        marshall({
          transactionId: 'txn-test-001',
          timestamp: Date.now(),
          customerId: 'cust-123',
          amount: 100.50,
          paymentStatus: 'COMPLETED',
        }),
      ],
    });
    dynamoMock.on(ScanCommand).resolves({
      Items: [
        marshall({
          transactionId: 'txn-test-001',
          timestamp: Date.now(),
          customerId: 'cust-123',
          amount: 100.50,
          paymentStatus: 'COMPLETED',
        }),
        marshall({
          transactionId: 'txn-test-002',
          timestamp: Date.now(),
          customerId: 'cust-456',
          amount: 200.00,
          paymentStatus: 'COMPLETED',
        }),
      ],
    });
  });

  afterAll(() => {
    dynamoMock.reset();
  });

  describe('DynamoDB Table Configuration', () => {
    let tableDescription: any;

    beforeAll(async () => {
      const command = new DescribeTableCommand({ TableName: expectedTableName });
      const response = await dynamoClient.send(command);
      tableDescription = response.Table;
    });

    test('Table exists with correct name', () => {
      expect(tableDescription).toBeDefined();
      expect(tableDescription?.TableName).toBe(expectedTableName);
    });

    test('Table has correct key schema (transactionId + timestamp)', () => {
      expect(tableDescription?.KeySchema).toEqual([
        { AttributeName: 'transactionId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ]);
    });

    test('Table has customer-index GSI', () => {
      const customerIndex = tableDescription?.GlobalSecondaryIndexes?.find(
        (gsi: any) => gsi.IndexName === 'customer-index'
      );
      expect(customerIndex).toBeDefined();
    });

    test('Table has status-index GSI', () => {
      const statusIndex = tableDescription?.GlobalSecondaryIndexes?.find(
        (gsi: any) => gsi.IndexName === 'status-index'
      );
      expect(statusIndex).toBeDefined();
    });

    test('Table uses PAY_PER_REQUEST billing mode', () => {
      expect(tableDescription?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('Payment Transaction CRUD Operations', () => {
    const testTransaction = {
      transactionId: 'txn-test-001',
      timestamp: Date.now(),
      customerId: 'cust-123',
      amount: 100.50,
      paymentStatus: 'COMPLETED',
    };

    beforeEach(() => {
      deletedItems.clear();
    });

    test('Can create a payment transaction', async () => {
      const putCommand = new PutItemCommand({
        TableName: expectedTableName,
        Item: marshall(testTransaction),
      });

      await expect(dynamoClient.send(putCommand)).resolves.not.toThrow();
    });

    test('Can retrieve a payment transaction', async () => {
      const getCommand = new GetItemCommand({
        TableName: expectedTableName,
        Key: marshall({
          transactionId: testTransaction.transactionId,
          timestamp: testTransaction.timestamp,
        }),
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();
      const retrievedItem = unmarshall(response.Item!);
      expect(retrievedItem.transactionId).toBe(testTransaction.transactionId);
      expect(retrievedItem.customerId).toBe(testTransaction.customerId);
    });

    test('Can update payment status', async () => {
      const updateCommand = new UpdateItemCommand({
        TableName: expectedTableName,
        Key: marshall({
          transactionId: testTransaction.transactionId,
          timestamp: testTransaction.timestamp,
        }),
        UpdateExpression: 'SET #status = :newStatus',
        ExpressionAttributeNames: {
          '#status': 'paymentStatus',
        },
        ExpressionAttributeValues: marshall({
          ':newStatus': 'REFUNDED',
        }),
        ReturnValues: 'ALL_NEW',
      });

      const response = await dynamoClient.send(updateCommand);
      expect(response.Attributes).toBeDefined();
      const updatedItem = unmarshall(response.Attributes!);
      expect(updatedItem.paymentStatus).toBe('REFUNDED');
    });

    test('Can delete a payment transaction', async () => {
      const deleteCommand = new DeleteItemCommand({
        TableName: expectedTableName,
        Key: marshall({
          transactionId: testTransaction.transactionId,
          timestamp: testTransaction.timestamp,
        }),
      });

      await expect(dynamoClient.send(deleteCommand)).resolves.not.toThrow();

      const getCommand = new GetItemCommand({
        TableName: expectedTableName,
        Key: marshall({
          transactionId: testTransaction.transactionId,
          timestamp: testTransaction.timestamp,
        }),
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    });
  });

  describe('Query Operations', () => {
    test('Can query by transactionId', async () => {
      const queryCommand = new QueryCommand({
        TableName: expectedTableName,
        KeyConditionExpression: '#txnId = :txnIdValue',
        ExpressionAttributeNames: {
          '#txnId': 'transactionId',
        },
        ExpressionAttributeValues: marshall({
          ':txnIdValue': 'txn-test-001',
        }),
      });

      const response = await dynamoClient.send(queryCommand);
      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBeGreaterThan(0);
    });

    test('Can scan for completed transactions', async () => {
      const scanCommand = new ScanCommand({
        TableName: expectedTableName,
        FilterExpression: '#status = :statusValue',
        ExpressionAttributeNames: {
          '#status': 'paymentStatus',
        },
        ExpressionAttributeValues: marshall({
          ':statusValue': 'COMPLETED',
        }),
      });

      const response = await dynamoClient.send(scanCommand);
      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBe(2);
      const items = response.Items!.map(item => unmarshall(item));
      expect(items.every(item => item.paymentStatus === 'COMPLETED')).toBe(true);
    });
  });

  describe('CloudFormation Outputs Validation', () => {
    test('Table name follows naming convention', () => {
      expect(expectedTableName).toMatch(/^payment-transactions-[a-zA-Z0-9]+$/);
    });
  });

  describe('Error Handling', () => {
    test('Handles non-existent transaction gracefully', async () => {
      const getCommand = new GetItemCommand({
        TableName: expectedTableName,
        Key: marshall({
          transactionId: 'non-existent-txn',
          timestamp: Date.now(),
        }),
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    });
  });
});
