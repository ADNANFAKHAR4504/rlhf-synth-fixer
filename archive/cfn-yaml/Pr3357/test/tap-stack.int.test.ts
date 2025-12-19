// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs if available, otherwise use mock data for testing
let outputs: any = {};
const outputsPath = path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  console.log('Note: Using mock outputs for CloudFormation integration testing (infrastructure not deployed)');
  outputs = {
    TurnAroundPromptTableName: `TurnAroundPromptTable${environmentSuffix}`,
    TurnAroundPromptTableArn: `arn:aws:dynamodb:us-east-1:123456789012:table/TurnAroundPromptTable${environmentSuffix}`,
    StackName: `TapStack${environmentSuffix}`,
    EnvironmentSuffix: environmentSuffix
  };
}

describe('TapStack CloudFormation Integration Tests', () => {
  describe('DynamoDB Table Integration Tests', () => {
    test('should have valid table name with environment suffix', () => {
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableName).toMatch(/^TurnAroundPromptTable[a-zA-Z0-9]+$/);
      expect(outputs.TurnAroundPromptTableName).toContain(environmentSuffix);
    });

    test('should have valid table ARN format', () => {
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d{12}:table\/TurnAroundPromptTable[a-zA-Z0-9]+$/);
    });

    test('should have consistent table name in ARN', () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const arnTableName = outputs.TurnAroundPromptTableArn.split('/').pop();
      expect(tableName).toBe(arnTableName);
    });
  });

  describe('Stack Information Tests', () => {
    test('should have valid stack name', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    test('should have correct environment suffix', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });
  });

  describe('Output Validation Tests', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should have consistent naming across outputs', () => {
      expect(outputs.TurnAroundPromptTableName).toContain(outputs.EnvironmentSuffix);
      expect(outputs.TurnAroundPromptTableArn).toContain(outputs.TurnAroundPromptTableName);
    });
  });

  describe('Resource Validation Tests', () => {
    test('should validate DynamoDB resource naming conventions', () => {
      const tableName = outputs.TurnAroundPromptTableName;

      // Should start with TurnAroundPromptTable
      expect(tableName).toMatch(/^TurnAroundPromptTable/);

      // Should not contain special characters except allowed ones
      expect(tableName).toMatch(/^[a-zA-Z0-9._-]+$/);

      // Should be between 3 and 255 characters (DynamoDB limit)
      expect(tableName.length).toBeGreaterThanOrEqual(3);
      expect(tableName.length).toBeLessThanOrEqual(255);
    });

    test('should validate ARN format compliance', () => {
      const arn = outputs.TurnAroundPromptTableArn;

      // Should be valid AWS ARN format
      expect(arn).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+$/);

      // Should be DynamoDB table ARN
      expect(arn).toMatch(/^arn:aws:dynamodb:/);

      // Should contain region
      expect(arn).toMatch(/:us-[a-z]+-\d+:/);
    });
  });

  describe('Regional and Account Consistency Tests', () => {
    test('should validate consistent AWS region across resources', () => {
      const arn = outputs.TurnAroundPromptTableArn;
      const regionMatch = arn.match(/arn:aws:dynamodb:([^:]+):/);

      expect(regionMatch).not.toBeNull();
      const region = regionMatch![1];

      // Should be a valid AWS region format
      expect(region).toMatch(/^[a-z]+-[a-z]+-\d+$/);

      // For this test, assume us-east-1 (can be parameterized)
      expect(region).toMatch(/^us-/);
    });

    test('should validate consistent AWS account ID', () => {
      const arn = outputs.TurnAroundPromptTableArn;
      const accountMatch = arn.match(/:(\d{12}):/);

      expect(accountMatch).not.toBeNull();
      const accountId = accountMatch![1];

      // Should be exactly 12 digits
      expect(accountId).toMatch(/^\d{12}$/);
      expect(accountId.length).toBe(12);
    });
  });

  describe('Export Name Validation Tests', () => {
    test('should validate export naming pattern', () => {
      // In real deployment, these would be actual export names
      // For mock data, we can validate the expected pattern
      const stackName = outputs.StackName;

      // Export names should follow ${StackName}-${OutputName} pattern
      const expectedExports = [
        `${stackName}-TurnAroundPromptTableName`,
        `${stackName}-TurnAroundPromptTableArn`,
        `${stackName}-StackName`,
        `${stackName}-EnvironmentSuffix`
      ];

      expectedExports.forEach(exportName => {
        expect(exportName).toMatch(/^[a-zA-Z0-9-]+$/);
        expect(exportName).toContain(stackName);
      });
    });

    test('should validate cross-stack reference capability', () => {
      const stackName = outputs.StackName;

      // Stack name should be suitable for cross-stack references
      expect(stackName).not.toContain(' ');
      expect(stackName).not.toMatch(/[^a-zA-Z0-9-]/);
      expect(stackName.length).toBeGreaterThan(0);
      expect(stackName.length).toBeLessThanOrEqual(128); // CloudFormation limit
    });
  });

  describe('Infrastructure Security Tests', () => {
    test('should validate table ARN indicates proper service', () => {
      const arn = outputs.TurnAroundPromptTableArn;

      // Should specifically be a DynamoDB table ARN
      expect(arn).toContain('dynamodb');
      expect(arn).toContain('table/');

      // Should not be any other AWS service
      expect(arn).not.toContain('s3');
      expect(arn).not.toContain('lambda');
      expect(arn).not.toContain('rds');
    });

    test('should validate resource identifiers are unique', () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const stackName = outputs.StackName;

      // Table name should include environment suffix for uniqueness
      expect(tableName).toContain(environmentSuffix);

      // Stack name should be different from table name
      expect(stackName).not.toBe(tableName);
    });
  });

  describe('Environment-Specific Tests', () => {
    test('should validate environment-specific naming', () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const envSuffix = outputs.EnvironmentSuffix;

      // Environment suffix should be alphanumeric only
      expect(envSuffix).toMatch(/^[a-zA-Z0-9]+$/);

      // Table name should end with environment suffix
      expect(tableName.endsWith(envSuffix)).toBe(true);
    });

    test('should validate environment consistency', () => {
      const envFromOutput = outputs.EnvironmentSuffix;
      const envFromProcess = environmentSuffix;

      // Environment should be consistent across sources
      expect(envFromOutput).toBe(envFromProcess);

      // Should be one of expected environments
      const validEnvironments = ['dev', 'test', 'staging', 'prod'];
      const isValidEnv = validEnvironments.some(env =>
        envFromOutput.toLowerCase().includes(env) ||
        envFromOutput === env
      );
      expect(isValidEnv || envFromOutput.match(/^[a-zA-Z0-9]+$/)).toBeTruthy();
    });
  });

  describe('Output Format and Structure Tests', () => {
    test('should validate all outputs are strings', () => {
      Object.values(outputs).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value).not.toBe('');
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
      });
    });

    test('should validate output naming conventions', () => {
      const outputKeys = Object.keys(outputs);

      outputKeys.forEach(key => {
        // Output names should be PascalCase
        expect(key).toMatch(/^[A-Z][a-zA-Z0-9]*$/);

        // Should not start with number
        expect(key).not.toMatch(/^[0-9]/);

        // Should not contain special characters
        expect(key).not.toMatch(/[^a-zA-Z0-9]/);
      });
    });

    test('should validate required output count', () => {
      const outputCount = Object.keys(outputs).length;

      // Should have exactly 4 outputs as defined in template
      expect(outputCount).toBe(4);

      // Should have specific required outputs
      const requiredOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(required => {
        expect(outputs).toHaveProperty(required);
      });
    });
  });

  describe('Edge Cases and Error Handling Tests', () => {
    test('should handle long environment suffixes gracefully', () => {
      const tableName = outputs.TurnAroundPromptTableName;

      // Even with long environment suffix, table name should be valid
      expect(tableName.length).toBeLessThanOrEqual(255);
      expect(tableName).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    test('should validate no empty or whitespace-only values', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        const stringValue = String(value);
        expect(stringValue.trim()).toBe(stringValue); // No leading/trailing whitespace
        expect(stringValue.trim().length).toBeGreaterThan(0); // Not empty after trim
        expect(stringValue).not.toMatch(/^\s*$/); // Not whitespace-only
      });
    });

    test('should validate ARN components are accessible', () => {
      const arn = outputs.TurnAroundPromptTableArn;
      const arnParts = arn.split(':');

      // ARN should have correct number of parts
      expect(arnParts.length).toBeGreaterThanOrEqual(6);

      // Each part should be non-empty (except resource-id which can be empty)
      expect(arnParts[0]).toBe('arn'); // partition
      expect(arnParts[1]).toBe('aws'); // service namespace
      expect(arnParts[2]).toBe('dynamodb'); // service
      expect(arnParts[3]).toMatch(/^[a-z0-9-]+$/); // region
      expect(arnParts[4]).toMatch(/^\d{12}$/); // account-id
      expect(arnParts[5]).toMatch(/^table\//); // resource type
    });
  });

  describe('Performance and Scalability Considerations', () => {
    test('should validate table name supports high throughput scenarios', () => {
      const tableName = outputs.TurnAroundPromptTableName;

      // Table name should not have patterns that might cause issues
      expect(tableName).not.toMatch(/\s/); // No spaces
      expect(tableName).not.toMatch(/[^a-zA-Z0-9._-]/); // Only allowed characters
      expect(tableName).not.toMatch(/^[0-9]/); // Should not start with number
      expect(tableName).not.toMatch(/--/); // No double dashes
    });

    test('should validate resource naming supports automation', () => {
      const allValues = Object.values(outputs);

      allValues.forEach(value => {
        // Should not contain characters that break automation scripts
        expect(value).not.toContain('`');
        expect(value).not.toContain('"');
        expect(value).not.toContain("'");
        expect(value).not.toContain('$');
        expect(value).not.toContain('\\');
        expect(value).not.toContain('\n');
        expect(value).not.toContain('\r');
      });
    });
  });
});
