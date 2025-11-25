// Configuration - These are coming from cfn-outputs after cdk deploy
import { DeleteItemCommand, DescribeTableCommand, DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Turn Around Prompt API Integration Tests', () => {
  const tableName = outputs.TurnAroundPromptTableName;

  describe('DynamoDB Table Integration Tests', () => {
    test('should have the DynamoDB table deployed', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table.TableName).toBe(tableName);
      expect(response.Table.TableStatus).toBe('ACTIVE');
      expect(response.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table.DeletionProtectionEnabled).toBe(false);
    });

    test('should have correct table schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');

      const attributeDefinitions = response.Table.AttributeDefinitions;
      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('should be able to put and get an item', async () => {
      const testId = `test-${Date.now()}`;
      const testData = {
        id: { S: testId },
        prompt: { S: 'Test prompt' },
        response: { S: 'Test response' },
        createdAt: { S: new Date().toISOString() }
      };

      // Put item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: testData
      });
      await dynamoClient.send(putCommand);

      // Get item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      });
      const getResponse = await dynamoClient.send(getCommand);

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item.id.S).toBe(testId);
      expect(getResponse.Item.prompt.S).toBe('Test prompt');
      expect(getResponse.Item.response.S).toBe('Test response');

      // Clean up
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      });
      await dynamoClient.send(deleteCommand);
    });
  });
});
