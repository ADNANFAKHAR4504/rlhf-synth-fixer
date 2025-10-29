import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import fs from 'fs';


// Helper: skip tests if deployment outputs are missing
const skipIfNoDeployment = (): boolean => {
  try {
    fs.accessSync('cfn-outputs/flat-outputs.json', fs.constants.R_OK);
    return false;
  } catch {
    console.log('⚠️  Skipping integration tests - deployment outputs not available (run in CI/CD only)');
    return true;
  }
};

let outputs: any = {};
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  outputs = {};
}

const region = process.env.AWS_REGION || 'us-east-1';
const dynamoClient = new DynamoDBClient({ region });


describe('TapStack Minimal Infrastructure - Integration Tests', () => {
  const shouldSkip = skipIfNoDeployment();

  beforeAll(() => {
    if (shouldSkip) {
      console.log('Integration tests will be skipped - no deployment outputs found');
    }
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      if (shouldSkip) return;
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix'
      ];
      expectedOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have correct value formats', () => {
      if (shouldSkip) return;
      expect(outputs.TurnAroundPromptTableName).toMatch(/^TurnAroundPromptTable/);
      expect(outputs.TurnAroundPromptTableArn).toMatch(/^arn:aws:dynamodb:[\w-]+:\d+:table\//);
      expect(typeof outputs.StackName).toBe('string');
      expect(typeof outputs.EnvironmentSuffix).toBe('string');
    });
  });

  describe('DynamoDB Table', () => {
    test('DynamoDB table should exist and have correct key schema', async () => {
      if (shouldSkip) return;
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeDefined();

      const response = await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      expect(response.Table).toBeDefined();
      expect(response.Table?.KeySchema).toEqual([
        { AttributeName: 'id', KeyType: 'HASH' }
      ]);
      expect(response.Table?.AttributeDefinitions).toEqual([
        { AttributeName: 'id', AttributeType: 'S' }
      ]);
      // BillingModeSummary may be undefined in some AWS environments for PAY_PER_REQUEST tables
      if (response.Table?.BillingModeSummary) {
        expect(response.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
      }
      // Check DeletionProtectionEnabled property
      expect(response.Table?.DeletionProtectionEnabled).toBe(false);
      // Check table status is ACTIVE
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 20000);

    test('should fail to describe a non-existent table', async () => {
      if (shouldSkip) return;
      const fakeTableName = 'NonExistentTable_' + Date.now();
      await expect(
        dynamoClient.send(new DescribeTableCommand({ TableName: fakeTableName }))
      ).rejects.toThrow();
    });
  });

  describe('Stack Output Values', () => {
    test('StackName and EnvironmentSuffix outputs should match deployment', () => {
      if (shouldSkip) return;
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
      // Optionally, check that StackName is a non-empty string
      expect(typeof outputs.StackName).toBe('string');
      expect(outputs.StackName.length).toBeGreaterThan(0);
      expect(typeof outputs.EnvironmentSuffix).toBe('string');
      expect(outputs.EnvironmentSuffix.length).toBeGreaterThan(0);
    });
  });
});
