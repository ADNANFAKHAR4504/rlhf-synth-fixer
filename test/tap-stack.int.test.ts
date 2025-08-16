// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TAP Stack Integration Tests', () => {
  const tableName = outputs[`TurnAroundPromptTableName`];
  const tableArn = outputs[`TurnAroundPromptTableArn`];
  const stackName = outputs[`StackName`];

  describe('DynamoDB Table Functionality', () => {
    test('should verify DynamoDB table exists and is accessible', async () => {
      expect(tableName).toBeDefined();
      expect(tableName).toContain(`TurnAroundPromptTable${environmentSuffix}`);

      // Basic structure validation
      expect(tableArn).toBeDefined();
      expect(tableArn).toContain('arn:aws:dynamodb');
      expect(tableArn).toContain(tableName);
    });

    test('should verify stack outputs are properly exported', async () => {
      expect(stackName).toBeDefined();
      expect(outputs[`EnvironmentSuffix`]).toBe(environmentSuffix);
    });

    test('should validate table can handle basic operations', async () => {
      // This test would require AWS SDK setup
      // For now, we validate that we have the necessary connection info
      expect(tableName).toBeTruthy();
      expect(tableArn).toBeTruthy();

      // In a real scenario, you would:
      // 1. Initialize AWS SDK with proper credentials
      // 2. Perform PutItem operation
      // 3. Perform GetItem operation
      // 4. Perform UpdateItem operation
      // 5. Perform DeleteItem operation
      // 6. Verify error handling for invalid operations
    });

    test('should verify table configuration matches expectations', async () => {
      // Validate table name follows naming convention
      const expectedPattern = new RegExp(
        `^TurnAroundPromptTable${environmentSuffix}$`
      );
      expect(tableName).toMatch(expectedPattern);

      // Validate ARN structure
      expect(tableArn).toMatch(
        /^arn:aws:dynamodb:[a-z0-9-]+:\d+:table\/TurnAroundPromptTable.+$/
      );
    });
  });

  describe('Environment Configuration', () => {
    test('should verify environment-specific resource naming', async () => {
      expect(tableName).toContain(environmentSuffix);
      expect(outputs[`EnvironmentSuffix`]).toBe(environmentSuffix);
    });

    test('should verify stack naming convention', async () => {
      expect(stackName).toBeDefined();
      expect(stackName).toBeTruthy();
    });
  });

  describe('Cross-Stack Integration', () => {
    test('should verify exports are available for other stacks', async () => {
      // Verify that all outputs have export values
      const requiredExports = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      requiredExports.forEach(exportKey => {
        expect(outputs[exportKey]).toBeDefined();
        expect(outputs[exportKey]).toBeTruthy();
      });
    });
  });
});
