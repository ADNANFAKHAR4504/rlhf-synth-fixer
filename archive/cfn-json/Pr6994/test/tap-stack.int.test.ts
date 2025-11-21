import fs from 'fs';
import path from 'path';
import { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

// Configuration - These are coming from cfn-outputs after deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

describe('TapStack Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have TurnAroundPromptTableName output', () => {
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableName).toContain('TurnAroundPromptTable');
    });

    test('should have TurnAroundPromptTableArn output', () => {
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toContain('arn:aws:dynamodb');
      expect(outputs.TurnAroundPromptTableArn).toContain('table/TurnAroundPromptTable');
    });

    test('should have EnvironmentSuffix output', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('should have StackName output', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName).toContain('TapStack');
    });
  });

  describe('DynamoDB Table', () => {
    test('should be able to describe the deployed table', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.TurnAroundPromptTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('table should have correct billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('table should have correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Table?.KeySchema).toHaveLength(1);
      expect(response.Table?.KeySchema?.[0].AttributeName).toBe('id');
      expect(response.Table?.KeySchema?.[0].KeyType).toBe('HASH');
    });

    test('table should have deletion protection disabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Table?.DeletionProtectionEnabled).toBe(false);
    });

    test('table should have correct attribute definitions', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });

      const response = await dynamoDBClient.send(command);

      expect(response.Table?.AttributeDefinitions).toHaveLength(1);
      expect(response.Table?.AttributeDefinitions?.[0].AttributeName).toBe('id');
      expect(response.Table?.AttributeDefinitions?.[0].AttributeType).toBe('S');
    });
  });

  describe('DynamoDB Operations', () => {
    const testItemId = `test-item-${Date.now()}`;

    afterAll(async () => {
      // Cleanup: Delete test item
      try {
        await dynamoDBClient.send(
          new DeleteItemCommand({
            TableName: outputs.TurnAroundPromptTableName,
            Key: {
              id: { S: testItemId },
            },
          })
        );
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test('should be able to put an item in the table', async () => {
      const command = new PutItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Item: {
          id: { S: testItemId },
          name: { S: 'Test Item' },
          description: { S: 'Integration test item' },
          createdAt: { N: Date.now().toString() },
        },
      });

      await expect(dynamoDBClient.send(command)).resolves.not.toThrow();
    });

    test('should be able to get an item from the table', async () => {
      // First, put an item
      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: outputs.TurnAroundPromptTableName,
          Item: {
            id: { S: testItemId },
            name: { S: 'Test Item' },
            description: { S: 'Integration test item' },
          },
        })
      );

      // Then, get the item
      const getCommand = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testItemId },
        },
      });

      const response = await dynamoDBClient.send(getCommand);

      expect(response.Item).toBeDefined();
      expect(response.Item?.id.S).toBe(testItemId);
      expect(response.Item?.name.S).toBe('Test Item');
    });

    test('should be able to delete an item from the table', async () => {
      // First, put an item
      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: outputs.TurnAroundPromptTableName,
          Item: {
            id: { S: testItemId },
            name: { S: 'Test Item to Delete' },
          },
        })
      );

      // Then, delete the item
      const deleteCommand = new DeleteItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testItemId },
        },
      });

      await expect(dynamoDBClient.send(deleteCommand)).resolves.not.toThrow();

      // Verify item is deleted
      const getCommand = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testItemId },
        },
      });

      const response = await dynamoDBClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should include environment suffix', () => {
      expect(outputs.TurnAroundPromptTableName).toContain(environmentSuffix);
    });

    test('stack name should include environment suffix', () => {
      expect(outputs.StackName).toContain(environmentSuffix);
    });

    test('table ARN should match table name', () => {
      expect(outputs.TurnAroundPromptTableArn).toContain(outputs.TurnAroundPromptTableName);
    });
  });
});
