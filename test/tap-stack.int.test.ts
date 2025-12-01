// Configuration - These are coming from cfn-outputs after cdk deploy
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
import fs from 'fs';

let outputs: any = {};
let tapStackDeployed = false;

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  // Check if TapStack outputs are present
  tapStackDeployed = outputs.TurnAroundPromptTableName !== undefined;
} catch (error) {
  console.warn('Could not read cfn-outputs/flat-outputs.json, tests will be skipped');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Expected table name based on the CloudFormation template
const expectedTableName = outputs.TurnAroundPromptTableName || `TurnAroundPromptTable${environmentSuffix}`;

const describeIf = (condition: boolean) => condition ? describe : describe.skip;

describeIf(tapStackDeployed)('Turn Around Prompt API Integration Tests', () => {
  // Skip all tests if TapStack is not deployed
  beforeAll(() => {
    if (!tapStackDeployed) {
      console.warn('TapStack not deployed, skipping integration tests');
    }
  });

  describe('DynamoDB Table Existence and Configuration', () => {
    let tableDescription: any;

    beforeAll(async () => {
      if (!tapStackDeployed) {
        tableDescription = null;
        return;
      }
      try {
        // Describe the table to get its configuration
        const command = new DescribeTableCommand({ TableName: expectedTableName });
        const response = await dynamoClient.send(command);
        tableDescription = response.Table;
      } catch (error) {
        console.warn('Could not describe table:', error);
        tableDescription = null;
      }
    });

    test('Table exists with correct name', () => {
      if (!tapStackDeployed) return;
      expect(tableDescription).toBeDefined();
      expect(tableDescription?.TableName).toBe(expectedTableName);
    });

    test('Table has correct attribute definitions', () => {
      if (!tapStackDeployed) return;
      expect(tableDescription?.AttributeDefinitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            AttributeName: 'id',
            AttributeType: 'S',
          }),
        ])
      );
    });

    test('Table has correct key schema', () => {
      if (!tapStackDeployed) return;
      expect(tableDescription?.KeySchema).toEqual([
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ]);
    });

    test('Table uses PAY_PER_REQUEST billing mode', () => {
      if (!tapStackDeployed) return;
      expect(tableDescription?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('Table has deletion protection disabled', () => {
      if (!tapStackDeployed) return;
      expect(tableDescription?.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('DynamoDB CRUD Operations', () => {
    const testItem = {
      id: 'test-integration-id',
      prompt: 'Test prompt for integration testing',
      createdAt: new Date().toISOString(),
    };

    test('Can put an item into the table', async () => {
      if (!tapStackDeployed) return;
      const putCommand = new PutItemCommand({
        TableName: expectedTableName,
        Item: marshall(testItem),
      });

      await expect(dynamoClient.send(putCommand)).resolves.not.toThrow();
    });

    test('Can get an item from the table', async () => {
      if (!tapStackDeployed) return;
      const getCommand = new GetItemCommand({
        TableName: expectedTableName,
        Key: marshall({ id: testItem.id }),
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();
      const retrievedItem = unmarshall(response.Item!);
      expect(retrievedItem.id).toBe(testItem.id);
      expect(retrievedItem.prompt).toBe(testItem.prompt);
    });

    test('Can update an item in the table', async () => {
      if (!tapStackDeployed) return;
      const updateCommand = new UpdateItemCommand({
        TableName: expectedTableName,
        Key: marshall({ id: testItem.id }),
        UpdateExpression: 'SET #prompt = :newPrompt',
        ExpressionAttributeNames: {
          '#prompt': 'prompt',
        },
        ExpressionAttributeValues: marshall({
          ':newPrompt': 'Updated test prompt',
        }),
        ReturnValues: 'ALL_NEW',
      });

      const response = await dynamoClient.send(updateCommand);
      expect(response.Attributes).toBeDefined();
      const updatedItem = unmarshall(response.Attributes!);
      expect(updatedItem.prompt).toBe('Updated test prompt');
    });

    test('Can delete an item from the table', async () => {
      if (!tapStackDeployed) return;
      const deleteCommand = new DeleteItemCommand({
        TableName: expectedTableName,
        Key: marshall({ id: testItem.id }),
      });

      await expect(dynamoClient.send(deleteCommand)).resolves.not.toThrow();

      // Verify item is deleted
      const getCommand = new GetItemCommand({
        TableName: expectedTableName,
        Key: marshall({ id: testItem.id }),
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    });
  });

  describe('DynamoDB Query and Scan Operations', () => {
    const testItems = [
      {
        id: 'query-test-1',
        prompt: 'Query test prompt 1',
        category: 'test',
      },
      {
        id: 'query-test-2',
        prompt: 'Query test prompt 2',
        category: 'test',
      },
      {
        id: 'scan-test-1',
        prompt: 'Scan test prompt 1',
        category: 'scan',
      },
    ];

    beforeAll(async () => {
      if (!tapStackDeployed) return;
      // Insert test items
      for (const item of testItems) {
        try {
          const putCommand = new PutItemCommand({
            TableName: expectedTableName,
            Item: marshall(item),
          });
          await dynamoClient.send(putCommand);
        } catch (error) {
          console.warn('Could not insert test item:', error);
        }
      }
    });

    afterAll(async () => {
      if (!tapStackDeployed) return;
      // Clean up test items
      for (const item of testItems) {
        try {
          const deleteCommand = new DeleteItemCommand({
            TableName: expectedTableName,
            Key: marshall({ id: item.id }),
          });
          await dynamoClient.send(deleteCommand);
        } catch (error) {
          console.warn('Could not delete test item:', error);
        }
      }
    });

    test('Can query items (though limited with hash key only)', async () => {
      if (!tapStackDeployed) return;
      // Since it's a simple hash key table, query by key
      const queryCommand = new QueryCommand({
        TableName: expectedTableName,
        KeyConditionExpression: '#id = :idValue',
        ExpressionAttributeNames: {
          '#id': 'id',
        },
        ExpressionAttributeValues: marshall({
          ':idValue': 'query-test-1',
        }),
      });

      const response = await dynamoClient.send(queryCommand);
      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBe(1);
      const item = unmarshall(response.Items![0]);
      expect(item.id).toBe('query-test-1');
    });

    test('Can scan items', async () => {
      if (!tapStackDeployed) return;
      const scanCommand = new ScanCommand({
        TableName: expectedTableName,
        FilterExpression: '#category = :categoryValue',
        ExpressionAttributeNames: {
          '#category': 'category',
        },
        ExpressionAttributeValues: marshall({
          ':categoryValue': 'test',
        }),
      });

      const response = await dynamoClient.send(scanCommand);
      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBe(2);
      const items = response.Items!.map(item => unmarshall(item));
      expect(items.every(item => item.category === 'test')).toBe(true);
    });
  });

  describe('CloudFormation Outputs Validation', () => {
    test('Outputs contain expected table name', () => {
      if (!tapStackDeployed) return;
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
    });

    test('Table name matches expected pattern', () => {
      expect(expectedTableName).toMatch(/^TurnAroundPromptTable[a-zA-Z0-9]+$/);
    });

    test('Environment suffix is applied correctly', () => {
      expect(expectedTableName).toContain(environmentSuffix);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('Handles non-existent item gracefully', async () => {
      if (!tapStackDeployed) return;
      const getCommand = new GetItemCommand({
        TableName: expectedTableName,
        Key: marshall({ id: 'non-existent-id' }),
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    });

    test('Handles invalid key gracefully', async () => {
      if (!tapStackDeployed) return;
      const getCommand = new GetItemCommand({
        TableName: expectedTableName,
        Key: marshall({ invalidKey: 'value' }),
      });

      await expect(dynamoClient.send(getCommand)).rejects.toThrow();
    });
  });
});
