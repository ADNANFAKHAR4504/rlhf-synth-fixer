import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import fs from 'fs';
import path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Get environment suffix from outputs (which is the actual deployed value)
// Fall back to environment variable if not in outputs
const environmentSuffix = outputs.EnvironmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const cfnClient = new CloudFormationClient({ region });

describe('TapStack Integration Tests - DynamoDB Table', () => {
  describe('CloudFormation Stack', () => {
    test('CloudFormation stack should exist and be in CREATE_COMPLETE state', async () => {
      const stackName = outputs.StackName;
      expect(stackName).toBeDefined();

      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cfnClient.send(command);
      expect(response.Stacks).toHaveLength(1);

      const stack = response.Stacks![0];
      expect(stack.StackStatus).toBe('CREATE_COMPLETE');
      expect(stack.StackName).toBe(stackName);
    }, 30000);

    test('stack should have correct parameters', async () => {
      const stackName = outputs.StackName;

      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cfnClient.send(command);
      const stack = response.Stacks![0];

      const envSuffixParam = stack.Parameters?.find(
        p => p.ParameterKey === 'EnvironmentSuffix'
      );

      expect(envSuffixParam).toBeDefined();
      expect(envSuffixParam?.ParameterValue).toBe(environmentSuffix);
    }, 30000);

    test('stack should have correct outputs', async () => {
      const stackName = outputs.StackName;

      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cfnClient.send(command);
      const stack = response.Stacks![0];

      expect(stack.Outputs).toBeDefined();
      expect(stack.Outputs!.length).toBeGreaterThanOrEqual(4);

      const expectedOutputKeys = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputKeys.forEach(key => {
        const output = stack.Outputs?.find(o => o.OutputKey === key);
        expect(output).toBeDefined();
        expect(output?.OutputValue).toBeDefined();
      });
    }, 30000);
  });

  describe('DynamoDB Table Configuration', () => {
    test('DynamoDB table should exist and be active', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toBe(`TurnAroundPromptTable${environmentSuffix}`);

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();

      const table = response.Table!;
      expect(table.TableName).toBe(tableName);
      expect(table.TableStatus).toBe('ACTIVE');
    }, 30000);

    test('DynamoDB table should have correct ARN', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const expectedArn = outputs.TurnAroundPromptTableArn;

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      const response = await dynamoClient.send(command);
      const table = response.Table!;

      expect(table.TableArn).toBe(expectedArn);
      expect(table.TableArn).toContain(tableName);
      expect(table.TableArn).toContain(region);
    }, 30000);

    test('DynamoDB table should have correct key schema', async () => {
      const tableName = outputs.TurnAroundPromptTableName;

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      const response = await dynamoClient.send(command);
      const table = response.Table!;

      expect(table.KeySchema).toHaveLength(1);
      expect(table.KeySchema![0].AttributeName).toBe('id');
      expect(table.KeySchema![0].KeyType).toBe('HASH');
    }, 30000);

    test('DynamoDB table should have correct attribute definitions', async () => {
      const tableName = outputs.TurnAroundPromptTableName;

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      const response = await dynamoClient.send(command);
      const table = response.Table!;

      expect(table.AttributeDefinitions).toHaveLength(1);
      expect(table.AttributeDefinitions![0].AttributeName).toBe('id');
      expect(table.AttributeDefinitions![0].AttributeType).toBe('S');
    }, 30000);

    test('DynamoDB table should use PAY_PER_REQUEST billing mode', async () => {
      const tableName = outputs.TurnAroundPromptTableName;

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      const response = await dynamoClient.send(command);
      const table = response.Table!;

      expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    }, 30000);

    test('DynamoDB table should have deletion protection disabled', async () => {
      const tableName = outputs.TurnAroundPromptTableName;

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      const response = await dynamoClient.send(command);
      const table = response.Table!;

      expect(table.DeletionProtectionEnabled).toBe(false);
    }, 30000);
  });

  describe('DynamoDB Table Operations', () => {
    const testItemId = `integration-test-${Date.now()}`;
    const testItem = {
      id: { S: testItemId },
      name: { S: 'Integration Test Item' },
      description: { S: 'This is a test item created during integration tests' },
      timestamp: { N: Date.now().toString() },
    };

    afterAll(async () => {
      // Clean up test item
      try {
        const tableName = outputs.TurnAroundPromptTableName;
        await dynamoClient.send(
          new DeleteItemCommand({
            TableName: tableName,
            Key: { id: { S: testItemId } },
          })
        );
      } catch (error) {
        // Item might not exist, ignore error
      }
    });

    test('should successfully put an item into the table', async () => {
      const tableName = outputs.TurnAroundPromptTableName;

      const command = new PutItemCommand({
        TableName: tableName,
        Item: testItem,
      });

      await expect(dynamoClient.send(command)).resolves.toBeDefined();
    }, 30000);

    test('should successfully retrieve the item from the table', async () => {
      const tableName = outputs.TurnAroundPromptTableName;

      const command = new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: testItemId } },
      });

      const response = await dynamoClient.send(command);
      expect(response.Item).toBeDefined();
      expect(response.Item!.id.S).toBe(testItemId);
      expect(response.Item!.name.S).toBe('Integration Test Item');
    }, 30000);

    test('should successfully scan the table', async () => {
      const tableName = outputs.TurnAroundPromptTableName;

      const command = new ScanCommand({
        TableName: tableName,
        Limit: 10,
      });

      const response = await dynamoClient.send(command);
      expect(response.Items).toBeDefined();
      expect(Array.isArray(response.Items)).toBe(true);

      // Our test item should be in the results
      const foundItem = response.Items?.find(item => item.id.S === testItemId);
      expect(foundItem).toBeDefined();
    }, 30000);

    test('should successfully update an item in the table', async () => {
      const tableName = outputs.TurnAroundPromptTableName;

      // Update the item with new attributes
      const updatedItem = {
        ...testItem,
        description: { S: 'Updated description during integration tests' },
        updatedAt: { N: Date.now().toString() },
      };

      await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: updatedItem,
        })
      );

      // Retrieve and verify
      const getResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: { id: { S: testItemId } },
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.description.S).toBe(
        'Updated description during integration tests'
      );
      expect(getResponse.Item!.updatedAt).toBeDefined();
    }, 30000);

    test('should successfully delete an item from the table', async () => {
      const tableName = outputs.TurnAroundPromptTableName;

      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: { id: { S: testItemId } },
      });

      await expect(dynamoClient.send(deleteCommand)).resolves.toBeDefined();

      // Verify item is deleted
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: testItemId } },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeUndefined();
    }, 30000);
  });

  describe('Output Validation', () => {
    test('all outputs should match deployed resources', async () => {
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();

      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('table name should follow naming convention', () => {
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBe(`TurnAroundPromptTable${environmentSuffix}`);
    });

    test('table ARN should be properly formatted', () => {
      const tableArn = outputs.TurnAroundPromptTableArn;
      expect(tableArn).toMatch(
        /^arn:aws:dynamodb:[a-z0-9-]+:\d+:table\/TurnAroundPromptTable.+$/
      );
    });

    test('stack name should follow naming convention', () => {
      const stackName = outputs.StackName;
      expect(stackName).toBe(`TapStack${environmentSuffix}`);
    });
  });

  describe('Resource Tags and Metadata', () => {
    test('CloudFormation stack should have proper tags', async () => {
      const stackName = outputs.StackName;

      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cfnClient.send(command);
      const stack = response.Stacks![0];

      expect(stack.Tags).toBeDefined();
      // Verify that tags exist (specific tag requirements may vary)
      expect(Array.isArray(stack.Tags)).toBe(true);
    }, 30000);

    test('stack should have creation timestamp', async () => {
      const stackName = outputs.StackName;

      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cfnClient.send(command);
      const stack = response.Stacks![0];

      expect(stack.CreationTime).toBeDefined();
      expect(stack.CreationTime).toBeInstanceOf(Date);
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('complete CRUD workflow on DynamoDB table', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const workflowItemId = `e2e-test-${Date.now()}`;

      try {
        // CREATE
        await dynamoClient.send(
          new PutItemCommand({
            TableName: tableName,
            Item: {
              id: { S: workflowItemId },
              name: { S: 'E2E Test Item' },
              status: { S: 'active' },
            },
          })
        );

        // READ
        const readResponse = await dynamoClient.send(
          new GetItemCommand({
            TableName: tableName,
            Key: { id: { S: workflowItemId } },
          })
        );
        expect(readResponse.Item).toBeDefined();
        expect(readResponse.Item!.status.S).toBe('active');

        // UPDATE
        await dynamoClient.send(
          new PutItemCommand({
            TableName: tableName,
            Item: {
              id: { S: workflowItemId },
              name: { S: 'E2E Test Item' },
              status: { S: 'completed' },
            },
          })
        );

        const updatedResponse = await dynamoClient.send(
          new GetItemCommand({
            TableName: tableName,
            Key: { id: { S: workflowItemId } },
          })
        );
        expect(updatedResponse.Item!.status.S).toBe('completed');

        // DELETE
        await dynamoClient.send(
          new DeleteItemCommand({
            TableName: tableName,
            Key: { id: { S: workflowItemId } },
          })
        );

        const deletedResponse = await dynamoClient.send(
          new GetItemCommand({
            TableName: tableName,
            Key: { id: { S: workflowItemId } },
          })
        );
        expect(deletedResponse.Item).toBeUndefined();
      } catch (error) {
        // Cleanup in case of error
        await dynamoClient
          .send(
            new DeleteItemCommand({
              TableName: tableName,
              Key: { id: { S: workflowItemId } },
            })
          )
          .catch(() => { });
        throw error;
      }
    }, 30000);
  });
});
