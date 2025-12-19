import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Integration Tests', () => {
  let outputs: any;
  let dynamoClient: DynamoDBClient;

  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load stack outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Initialize AWS SDK clients
    dynamoClient = new DynamoDBClient({ region });
  });

  afterAll(() => {
    // Clean up clients
    dynamoClient.destroy();
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs).toHaveProperty('TurnAroundPromptTableName');
      expect(outputs).toHaveProperty('TurnAroundPromptTableArn');
      expect(outputs).toHaveProperty('EnvironmentSuffix');
      expect(outputs).toHaveProperty('StackName');
    });

    test('outputs should have correct format', () => {
      expect(outputs.TurnAroundPromptTableName).toMatch(/^TurnAroundPromptTable/);
      expect(outputs.TurnAroundPromptTableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(outputs.StackName).toMatch(/^TapStack/);
      expect(outputs.EnvironmentSuffix).toBeTruthy();
    });

    test('table name should include environment suffix', () => {
      expect(outputs.TurnAroundPromptTableName).toContain(outputs.EnvironmentSuffix);
    });
  });

  describe('DynamoDB Table Tests', () => {
    const testId = `test-item-${Date.now()}`;
    const testData = {
      title: 'Test Prompt',
      content: 'This is a test prompt for integration testing',
      category: 'testing',
      priority: 'high',
    };

    test('should describe table and verify configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.TurnAroundPromptTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

      // Verify key schema
      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toBeDefined();
      expect(keySchema?.length).toBe(1);
      expect(keySchema?.[0].AttributeName).toBe('id');
      expect(keySchema?.[0].KeyType).toBe('HASH');
    });

    test('should write item to DynamoDB', async () => {
      const command = new PutItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Item: {
          id: { S: testId },
          title: { S: testData.title },
          content: { S: testData.content },
          category: { S: testData.category },
          priority: { S: testData.priority },
          createdAt: { N: Date.now().toString() },
        },
      });

      await expect(dynamoClient.send(command)).resolves.not.toThrow();
    });

    test('should read item from DynamoDB', async () => {
      const command = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId },
        },
      });

      const response = await dynamoClient.send(command);
      expect(response.Item).toBeDefined();
      expect(response.Item?.id.S).toBe(testId);
      expect(response.Item?.title.S).toBe(testData.title);
      expect(response.Item?.content.S).toBe(testData.content);
      expect(response.Item?.category.S).toBe(testData.category);
      expect(response.Item?.priority.S).toBe(testData.priority);
    });

    test('should scan table and find items', async () => {
      const command = new ScanCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Limit: 10,
      });

      const response = await dynamoClient.send(command);
      expect(response.Items).toBeDefined();
      expect(Array.isArray(response.Items)).toBe(true);
    });

    test('should update item in DynamoDB', async () => {
      const updatedContent = 'Updated test content';

      // First update the item
      const putCommand = new PutItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Item: {
          id: { S: testId },
          title: { S: testData.title },
          content: { S: updatedContent },
          category: { S: testData.category },
          priority: { S: 'medium' },
          updatedAt: { N: Date.now().toString() },
        },
      });

      await dynamoClient.send(putCommand);

      // Then verify the update
      const getCommand = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId },
        },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item?.content.S).toBe(updatedContent);
      expect(response.Item?.priority.S).toBe('medium');
    });

    test('should delete item from DynamoDB', async () => {
      // Delete the test item
      const deleteCommand = new DeleteItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId },
        },
      });

      await expect(dynamoClient.send(deleteCommand)).resolves.not.toThrow();

      // Verify deletion
      const getCommand = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: testId },
        },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    });
  });

  describe('Table Properties Tests', () => {
    test('should verify table ARN format', () => {
      expect(outputs.TurnAroundPromptTableArn).toMatch(
        /^arn:aws:dynamodb:[a-z0-9-]+:[0-9]+:table\/TurnAroundPromptTable/
      );
    });

    test('should verify table is in correct region', () => {
      expect(outputs.TurnAroundPromptTableArn).toContain(region);
    });
  });

  describe('Batch Operations Tests', () => {
    test('should handle multiple writes and reads', async () => {
      const batchSize = 5;
      const testItems = Array.from({ length: batchSize }, (_, i) => ({
        id: `batch-test-${Date.now()}-${i}`,
        title: `Batch Item ${i}`,
        content: `Content for batch item ${i}`,
      }));

      // Write multiple items
      for (const item of testItems) {
        const command = new PutItemCommand({
          TableName: outputs.TurnAroundPromptTableName,
          Item: {
            id: { S: item.id },
            title: { S: item.title },
            content: { S: item.content },
            createdAt: { N: Date.now().toString() },
          },
        });
        await dynamoClient.send(command);
      }

      // Read back and verify
      for (const item of testItems) {
        const command = new GetItemCommand({
          TableName: outputs.TurnAroundPromptTableName,
          Key: {
            id: { S: item.id },
          },
        });
        const response = await dynamoClient.send(command);
        expect(response.Item).toBeDefined();
        expect(response.Item?.id.S).toBe(item.id);
      }

      // Clean up
      for (const item of testItems) {
        const command = new DeleteItemCommand({
          TableName: outputs.TurnAroundPromptTableName,
          Key: {
            id: { S: item.id },
          },
        });
        await dynamoClient.send(command);
      }
    }, 30000);
  });

  describe('Error Handling Tests', () => {
    test('should handle reading non-existent item gracefully', async () => {
      const command = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: {
          id: { S: 'non-existent-item-id' },
        },
      });

      const response = await dynamoClient.send(command);
      expect(response.Item).toBeUndefined();
    });

    test('should handle invalid table name', async () => {
      const command = new GetItemCommand({
        TableName: 'non-existent-table',
        Key: {
          id: { S: 'test' },
        },
      });

      await expect(dynamoClient.send(command)).rejects.toThrow();
    });
  });
});
