/**
 * Integration tests for TAP Stack CloudFormation deployment.
 * Tests actual deployed DynamoDB table using CloudFormation stack outputs.
 */

import { DeleteItemCommand, DescribeTableCommand, DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Deployment', () => {
  let outputs: any;
  let dynamodbClient: DynamoDBClient;
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  beforeAll(() => {
    // Load stack outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please ensure deployment has completed.`
      );
    }
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Initialize AWS SDK clients
    dynamodbClient = new DynamoDBClient({ region });
  });

  describe('DynamoDB Table Integration', () => {
    let tableName: string;

    beforeAll(() => {
      tableName = outputs.TurnAroundPromptTableName;
    });

    test('should have deployed DynamoDB table', () => {
      expect(tableName).toBeDefined();
      expect(tableName).toContain(environmentSuffix);
    });

    test('table should be accessible and in ACTIVE state', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
    });

    test('table should have correct key schema', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      const keySchema = response.Table!.KeySchema;
      expect(keySchema).toHaveLength(1);

      const hashKey = keySchema!.find(k => k.KeyType === 'HASH');
      expect(hashKey!.AttributeName).toBe('id');
    });

    test('table should have correct attribute definitions', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      const attrDefs = response.Table!.AttributeDefinitions;
      expect(attrDefs).toHaveLength(1);
      expect(attrDefs![0].AttributeName).toBe('id');
      expect(attrDefs![0].AttributeType).toBe('S');
    });

    test('table should have PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table!.BillingModeSummary!.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('table should not have deletion protection enabled', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table!.DeletionProtectionEnabled).toBe(false);
    });

    test('should be able to write and read items', async () => {
      const testItem = {
        TableName: tableName,
        Item: {
          id: { S: 'test-integration-item' },
          data: { S: 'test data for integration' },
          timestamp: { S: new Date().toISOString() }
        }
      };

      // Write item
      await dynamodbClient.send(new PutItemCommand(testItem));

      // Read item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          id: { S: 'test-integration-item' }
        }
      });

      const response = await dynamodbClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item!.id.S).toBe('test-integration-item');
      expect(response.Item!.data.S).toBe('test data for integration');

      // Cleanup
      await dynamodbClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: 'test-integration-item' }
        }
      }));
    });
  });

  describe('Stack Outputs Validation', () => {
    test('should have TurnAroundPromptTableName output', () => {
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(typeof outputs.TurnAroundPromptTableName).toBe('string');
    });

    test('should have TurnAroundPromptTableArn output', () => {
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toContain('arn:aws:dynamodb');
      expect(outputs.TurnAroundPromptTableArn).toContain('TurnAroundPromptTable');
    });

    test('should have StackName output', () => {
      expect(outputs.StackName).toBeDefined();
      expect(typeof outputs.StackName).toBe('string');
    });

    test('should have EnvironmentSuffix output', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });
  });
});
