// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';

describe('Turn Around Prompt API Integration Tests', () => {
  const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const tableName = outputs.TurnAroundPromptTableName;
  const testId = `test-${Date.now()}`;

  describe('DynamoDB Table Tests', () => {
    test('should verify DynamoDB table exists', async () => {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should verify table has correct attribute definitions', async () => {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.AttributeDefinitions).toHaveLength(1);
      expect(response.Table?.AttributeDefinitions?.[0].AttributeName).toBe('id');
      expect(response.Table?.AttributeDefinitions?.[0].AttributeType).toBe('S');
    });

    test('should verify table has correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.KeySchema).toHaveLength(1);
      expect(response.Table?.KeySchema?.[0].AttributeName).toBe('id');
      expect(response.Table?.KeySchema?.[0].KeyType).toBe('HASH');
    });

    test('should verify table billing mode is PAY_PER_REQUEST', async () => {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should verify deletion protection is disabled', async () => {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('DynamoDB Operations Tests', () => {
    test('should successfully write an item to the table', async () => {
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          prompt: { S: 'Test prompt content' },
          createdAt: { N: Date.now().toString() },
        },
      });

      await expect(dynamoClient.send(putCommand)).resolves.not.toThrow();
    });

    test('should successfully read an item from the table', async () => {
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
        },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.id.S).toBe(testId);
      expect(response.Item?.prompt.S).toBe('Test prompt content');
    });

    test('should successfully delete an item from the table', async () => {
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
        },
      });

      await expect(dynamoClient.send(deleteCommand)).resolves.not.toThrow();

      // Verify deletion
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: testId },
        },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    });
  });

  describe('Table Configuration Validation', () => {
    test('should verify table name includes environment suffix', () => {
      expect(tableName).toContain(environmentSuffix);
    });

    test('should verify table ARN is exported in outputs', () => {
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toContain('arn:aws:dynamodb');
      expect(outputs.TurnAroundPromptTableArn).toContain(tableName);
    });

    test('should verify environment suffix is in outputs', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('should verify stack name is in outputs', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName).toContain(environmentSuffix);
    });
  });
});
