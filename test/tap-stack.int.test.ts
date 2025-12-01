// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { execSync } from 'child_process';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('environmentSuffix should match deployment environment', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('stack name should include environment suffix', () => {
      expect(outputs.StackName).toContain(environmentSuffix);
    });

    test('table name should include environment suffix', () => {
      expect(outputs.TurnAroundPromptTableName).toContain(environmentSuffix);
      expect(outputs.TurnAroundPromptTableName).toBe(`TurnAroundPromptTable${environmentSuffix}`);
    });

    test('table ARN should be valid format', () => {
      expect(outputs.TurnAroundPromptTableArn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d+:table\/.+$/);
    });
  });

  describe('DynamoDB Table Validation (via AWS CLI)', () => {
    test('DynamoDB table should exist and be active', () => {
      const result = execSync(
        `aws dynamodb describe-table --table-name ${outputs.TurnAroundPromptTableName} --region us-east-1 --output json`,
        { encoding: 'utf8' }
      );
      const tableInfo = JSON.parse(result);

      expect(tableInfo.Table).toBeDefined();
      expect(tableInfo.Table.TableName).toBe(outputs.TurnAroundPromptTableName);
      expect(tableInfo.Table.TableStatus).toBe('ACTIVE');
    });

    test('DynamoDB table should have correct billing mode', () => {
      const result = execSync(
        `aws dynamodb describe-table --table-name ${outputs.TurnAroundPromptTableName} --region us-east-1 --output json`,
        { encoding: 'utf8' }
      );
      const tableInfo = JSON.parse(result);

      expect(tableInfo.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have correct key schema', () => {
      const result = execSync(
        `aws dynamodb describe-table --table-name ${outputs.TurnAroundPromptTableName} --region us-east-1 --output json`,
        { encoding: 'utf8' }
      );
      const tableInfo = JSON.parse(result);

      expect(tableInfo.Table.KeySchema).toHaveLength(1);
      expect(tableInfo.Table.KeySchema[0].AttributeName).toBe('id');
      expect(tableInfo.Table.KeySchema[0].KeyType).toBe('HASH');
    });

    test('DynamoDB table should have correct attribute definitions', () => {
      const result = execSync(
        `aws dynamodb describe-table --table-name ${outputs.TurnAroundPromptTableName} --region us-east-1 --output json`,
        { encoding: 'utf8' }
      );
      const tableInfo = JSON.parse(result);

      expect(tableInfo.Table.AttributeDefinitions).toHaveLength(1);
      expect(tableInfo.Table.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(tableInfo.Table.AttributeDefinitions[0].AttributeType).toBe('S');
    });

    test('DynamoDB table should have deletion protection disabled', () => {
      const result = execSync(
        `aws dynamodb describe-table --table-name ${outputs.TurnAroundPromptTableName} --region us-east-1 --output json`,
        { encoding: 'utf8' }
      );
      const tableInfo = JSON.parse(result);

      expect(tableInfo.Table.DeletionProtectionEnabled).toBe(false);
    });

    test('DynamoDB table ARN should match output', () => {
      const result = execSync(
        `aws dynamodb describe-table --table-name ${outputs.TurnAroundPromptTableName} --region us-east-1 --output json`,
        { encoding: 'utf8' }
      );
      const tableInfo = JSON.parse(result);

      expect(tableInfo.Table.TableArn).toBe(outputs.TurnAroundPromptTableArn);
    });
  });

  describe('Resource Configuration Validation', () => {
    test('table should be configured for test environment cleanup', () => {
      const result = execSync(
        `aws dynamodb describe-table --table-name ${outputs.TurnAroundPromptTableName} --region us-east-1 --output json`,
        { encoding: 'utf8' }
      );
      const tableInfo = JSON.parse(result);

      // Verify table can be deleted (no deletion protection)
      expect(tableInfo.Table.DeletionProtectionEnabled).toBe(false);

      // Verify on-demand billing (no reserved capacity to worry about)
      expect(tableInfo.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('stack should support multi-environment deployment', () => {
      // Table name includes environment suffix for isolation
      expect(outputs.TurnAroundPromptTableName).toMatch(/^TurnAroundPromptTable[a-zA-Z0-9]+$/);

      // Stack name includes environment suffix
      expect(outputs.StackName).toMatch(/^TapStack[a-zA-Z0-9]+$/);
    });
  });
});
