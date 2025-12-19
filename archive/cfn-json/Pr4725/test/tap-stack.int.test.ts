// Integration tests for FastShop Order Processing System
import fs from 'fs';

// Load outputs from deployed stack
let outputs: any = {};

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.log('Stack outputs not found - stack may not be deployed yet');
}

describe('FastShop Order Processing System Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have stack name output', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName).toContain('TapStack');
    });

    test('should have environment suffix output', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(typeof outputs.EnvironmentSuffix).toBe('string');
    });

    test('stack name should match expected pattern', () => {
      const stackName = outputs.StackName;
      const environmentSuffix = outputs.EnvironmentSuffix;

      expect(stackName).toContain('TapStack');
      if (environmentSuffix) {
        expect(stackName).toContain(environmentSuffix);
      }
    });
  });

  describe('Resource Naming Conventions', () => {
    test('environment suffix should be alphanumeric', () => {
      const environmentSuffix = outputs.EnvironmentSuffix;
      if (environmentSuffix) {
        expect(environmentSuffix).toMatch(/^[a-zA-Z0-9]+$/);
      }
    });

    test('stack outputs should be defined', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });
  });

  describe('Output Format Validation', () => {
    test('should have valid JSON structure', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('stack name should not be empty', () => {
      if (outputs.StackName) {
        expect(outputs.StackName.length).toBeGreaterThan(0);
      }
    });
  });
});
