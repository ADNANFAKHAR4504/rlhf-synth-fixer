// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

describe('TurnAroundPromptTable Integration Tests', () => {
  const testId = uuidv4();
  const tableName = outputs.TurnAroundPromptTableName;

  beforeAll(() => {
    // Validate that required outputs exist
    expect(tableName).toBeDefined();
    expect(tableName).toMatch(new RegExp(`TurnAroundPromptTable${environmentSuffix}`));
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      }));
    } catch (error) {
      // Item might not exist, which is fine
    }
  });

  describe('Basic CRUD Operations', () => {
    test('should successfully put an item in the table', async () => {
      const testData = {
        id: { S: testId },
        prompt: { S: 'Test prompt for integration testing' },
        timestamp: { N: Date.now().toString() },
        status: { S: 'active' }
      };

      const command = new PutItemCommand({
        TableName: tableName,
        Item: testData
      });

      await expect(dynamoClient.send(command)).resolves.toBeDefined();
    });

    test('should successfully retrieve the item from the table', async () => {
      const command = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      });

      const response = await dynamoClient.send(command);
      expect(response.Item).toBeDefined();
      expect(response.Item?.id.S).toBe(testId);
      expect(response.Item?.prompt.S).toBe('Test prompt for integration testing');
    });

    test('should successfully scan the table', async () => {
      const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'id = :testId',
        ExpressionAttributeValues: {
          ':testId': { S: testId }
        }
      });

      const response = await dynamoClient.send(command);
      expect(response.Items).toBeDefined();
      expect(response.Items?.length).toBeGreaterThanOrEqual(1);
      
      const testItem = response.Items?.find(item => item.id.S === testId);
      expect(testItem).toBeDefined();
    });

    test('should successfully delete the item from the table', async () => {
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      });

      await expect(dynamoClient.send(deleteCommand)).resolves.toBeDefined();

      // Verify item is deleted
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId }
        }
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    });
  });

  describe('Table Configuration Validation', () => {
    test('should validate table exists and is accessible', async () => {
      const command = new ScanCommand({
        TableName: tableName,
        Limit: 1
      });

      await expect(dynamoClient.send(command)).resolves.toBeDefined();
    });

    test('should validate table name follows naming convention', () => {
      expect(tableName).toMatch(/^TurnAroundPromptTable[a-zA-Z0-9]+$/);
      expect(tableName).toContain(environmentSuffix);
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle non-existent item gracefully', async () => {
      const command = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: 'non-existent-id-12345' }
        }
      });

      const response = await dynamoClient.send(command);
      expect(response.Item).toBeUndefined();
    });

    test('should handle batch operations within reasonable time', async () => {
      const batchSize = 5;
      const testIds = Array.from({ length: batchSize }, () => uuidv4());
      
      const start = Date.now();
      
      // Put multiple items
      const putPromises = testIds.map(id => 
        dynamoClient.send(new PutItemCommand({
          TableName: tableName,
          Item: {
            id: { S: id },
            prompt: { S: `Batch test item ${id}` },
            timestamp: { N: Date.now().toString() }
          }
        }))
      );

      await Promise.all(putPromises);

      // Clean up
      const deletePromises = testIds.map(id =>
        dynamoClient.send(new DeleteItemCommand({
          TableName: tableName,
          Key: { id: { S: id } }
        }))
      );

      await Promise.all(deletePromises);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
