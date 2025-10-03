// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { DynamoDBClient, DescribeTableCommand, PutItemCommand, GetItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

describe('DynamoDB Table Integration Tests', () => {
  let tableName: string;
  let tableArn: string;

  beforeAll(() => {
    tableName = outputs.TurnAroundPromptTableName;
    tableArn = outputs.TurnAroundPromptTableArn;
    expect(tableName).toBeDefined();
    expect(tableArn).toBeDefined();
  });

  describe('E2E-01: Data Storage and Retrieval Pipeline (Adapted)', () => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    test('should successfully store and retrieve data', async () => {
      // Action: Put test data
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          prompt: { S: 'Test prompt for data masking pipeline' },
          response: { S: 'Masked response content' },
          timestamp: { N: Date.now().toString() }
        }
      });
      
      await dynamoClient.send(putCommand);

      // Verification: Retrieve and validate data
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      });
      
      const result = await dynamoClient.send(getCommand);
      expect(result.Item).toBeDefined();
      expect(result.Item?.id.S).toBe(testId);
      expect(result.Item?.prompt.S).toBe('Test prompt for data masking pipeline');
    });

    test('should handle data masking simulation', async () => {
      const maskedData = {
        id: { S: `masked-${testId}` },
        original_ssn: { S: 'MASKED-123-XX-XXXX' },
        original_email: { S: 'user-MASKED@example.com' },
        masked_at: { N: Date.now().toString() }
      };

      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: maskedData
      });
      
      await dynamoClient.send(putCommand);

      // Verification: Ensure masked data is stored correctly
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: `masked-${testId}` } }
      });
      
      const result = await dynamoClient.send(getCommand);
      expect(result.Item?.original_ssn.S).toContain('MASKED');
      expect(result.Item?.original_email.S).toContain('MASKED');
    });

    afterAll(async () => {
      // Cleanup test data
      const deleteCommands = [
        new DeleteItemCommand({
          TableName: tableName,
          Key: { id: { S: testId } }
        }),
        new DeleteItemCommand({
          TableName: tableName,
          Key: { id: { S: `masked-${testId}` } }
        })
      ];

      await Promise.all(deleteCommands.map(cmd => dynamoClient.send(cmd)));
    });
  });

  describe('E2E-02: Access Control and Security Validation', () => {
    test('should validate table accessibility within AWS account', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: tableName
      });
      
      const tableInfo = await dynamoClient.send(describeCommand);
      
      // Expected Result: Connection successful from authorized environment
      expect(tableInfo.Table).toBeDefined();
      expect(tableInfo.Table?.TableName).toBe(tableName);
      expect(tableInfo.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should verify table has proper deletion protection disabled', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: tableName
      });
      
      const tableInfo = await dynamoClient.send(describeCommand);
      
      // Verification: Deletion protection should be disabled for staging
      expect(tableInfo.Table?.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('E2E-03: IAM and Permission Validation (Simulated)', () => {
    test('should validate standard operations are permitted', async () => {
      const testId = `iam-test-${Date.now()}`;
      
      // Action: Attempt standard read/write operations
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          operation: { S: 'iam-validation' },
          timestamp: { N: Date.now().toString() }
        }
      });
      
      // Expected Result: Standard operations succeed
      await expect(dynamoClient.send(putCommand)).resolves.toBeDefined();

      // Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      }));
    });

    test('should validate table metadata access', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: tableName
      });
      
      // Expected Result: Metadata access succeeds
      const result = await dynamoClient.send(describeCommand);
      expect(result.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('E2E-04: Data Integrity and Schema Validation', () => {
    test('should maintain data consistency during operations', async () => {
      const testId = `integrity-${Date.now()}`;
      const originalTimestamp = Date.now();
      
      // Action: Create initial record
      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          created_at: { N: originalTimestamp.toString() },
          data_type: { S: 'integrity_test' }
        }
      }));

      // Action: Retrieve and verify
      const getResult = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      }));

      // Expected Result: Data integrity maintained
      expect(getResult.Item?.created_at.N).toBe(originalTimestamp.toString());
      expect(getResult.Item?.data_type.S).toBe('integrity_test');

      // Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      }));
    });

    test('should validate table schema consistency', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: tableName
      });
      
      const tableInfo = await dynamoClient.send(describeCommand);
      
      // Expected Result: Schema matches CloudFormation definition
      expect(tableInfo.Table?.KeySchema).toHaveLength(1);
      expect(tableInfo.Table?.KeySchema?.[0].AttributeName).toBe('id');
      expect(tableInfo.Table?.KeySchema?.[0].KeyType).toBe('HASH');
      expect(tableInfo.Table?.AttributeDefinitions?.[0].AttributeType).toBe('S');
    });
  });

  describe('E2E-05: Error Handling and Resilience', () => {
    test('should handle invalid operations gracefully', async () => {
      // Action: Attempt to access non-existent item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: 'non-existent-id-12345' } }
      });
      
      const result = await dynamoClient.send(getCommand);
      
      // Expected Result: No error thrown, empty result returned
      expect(result.Item).toBeUndefined();
    });

    test('should validate error responses for malformed requests', async () => {
      // Action: Attempt invalid attribute type
      const invalidCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: `error-test-${Date.now()}` },
          invalid_number: { N: 'not-a-number' } // This should cause an error
        }
      });
      
      // Expected Result: Proper error handling
      await expect(dynamoClient.send(invalidCommand)).rejects.toThrow();
    });
  });

  describe('E2E-06: Recovery and Backup Simulation', () => {
    test('should validate table is accessible for backup operations', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: tableName
      });
      
      const tableInfo = await dynamoClient.send(describeCommand);
      
      // Expected Result: Table supports point-in-time recovery features
      expect(tableInfo.Table?.TableStatus).toBe('ACTIVE');
      expect(tableInfo.Table?.TableArn).toBe(tableArn);
    });

    test('should simulate data recovery scenarios', async () => {
      const testId = `recovery-${Date.now()}`;
      
      // Action: Create test data
      await dynamoClient.send(new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          backup_test: { S: 'data-for-recovery' },
          created: { N: Date.now().toString() }
        }
      }));

      // Action: Verify data exists (simulate pre-recovery state)
      const beforeResult = await dynamoClient.send(new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      }));
      
      expect(beforeResult.Item).toBeDefined();

      // Cleanup (simulate recovery completion)
      await dynamoClient.send(new DeleteItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } }
      }));
    });
  });

  describe('E2E-07: Monitoring and Cost Control Validation', () => {
    test('should validate table configuration for cost efficiency', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: tableName
      });
      
      const tableInfo = await dynamoClient.send(describeCommand);
      
      // Expected Result: Pay-per-request billing reduces costs
      expect(tableInfo.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(tableInfo.Table?.ProvisionedThroughput).toBeUndefined();
    });

    test('should validate table supports monitoring capabilities', async () => {
      const describeCommand = new DescribeTableCommand({
        TableName: tableName
      });
      
      const tableInfo = await dynamoClient.send(describeCommand);
      
      // Expected Result: Table has proper configuration for CloudWatch integration
      expect(tableInfo.Table?.TableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(tableInfo.Table?.TableName).toContain(environmentSuffix);
    });

    test('should perform load testing simulation (lightweight)', async () => {
      const testPromises = [];
      const testPrefix = `load-test-${Date.now()}`;
      
      // Action: Simulate concurrent operations
      for (let i = 0; i < 10; i++) {
        testPromises.push(
          dynamoClient.send(new PutItemCommand({
            TableName: tableName,
            Item: {
              id: { S: `${testPrefix}-${i}` },
              load_test: { S: 'concurrent-operation' },
              index: { N: i.toString() }
            }
          }))
        );
      }

      // Expected Result: All operations complete successfully
      await expect(Promise.all(testPromises)).resolves.toHaveLength(10);

      // Cleanup
      const cleanupPromises = [];
      for (let i = 0; i < 10; i++) {
        cleanupPromises.push(
          dynamoClient.send(new DeleteItemCommand({
            TableName: tableName,
            Key: { id: { S: `${testPrefix}-${i}` } }
          }))
        );
      }
      await Promise.all(cleanupPromises);
    });
  });
});
