import fs from 'fs';
import path from 'path';

describe('DynamoDB Inventory System - Integration Tests', () => {
  let outputs: { [key: string]: string };

  beforeAll(() => {
    try {
      // Assumes the output file is at the root of the project in a 'cfn-outputs' directory
      const outputsPath = path.join(__dirname, '../../cfn-outputs/flat-outputs.json');
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } catch (error) {
      console.warn('Could not read cfn-outputs/flat-outputs.json. This is expected if the stack has not been deployed. Skipping integration tests.');
      outputs = {};
    }
  });

  // A helper test to ensure the outputs file was actually loaded before running other tests
  test('should load CloudFormation outputs for validation', () => {
    // This test will fail gracefully if the file doesn't exist, indicating a deployment issue, not a test issue.
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  describe('Output Value Validation', () => {
    let tableArnKey: string | undefined;
    let tableStreamArnKey: string | undefined;

    beforeAll(() => {
      // Find the keys dynamically since they might have a stack prefix
      tableArnKey = Object.keys(outputs).find(key => key.endsWith('TableArn'));
      tableStreamArnKey = Object.keys(outputs).find(key => key.endsWith('TableStreamArn'));
    });

    test('should have a valid Table ARN output', () => {
      expect(tableArnKey).toBeDefined();
      const tableArn = outputs[tableArnKey!];

      // Regex to validate the DynamoDB Table ARN structure in us-west-2
      const arnRegex = /^arn:aws:dynamodb:us-west-2:\d{12}:table\/ProductInventory$/;
      expect(tableArn).toMatch(arnRegex);
    });

    test('should have a valid Table Stream ARN output', () => {
      expect(tableStreamArnKey).toBeDefined();
      const streamArn = outputs[tableStreamArnKey!];

      // Regex to validate the DynamoDB Stream ARN structure in us-west-2
      const streamArnRegex = /^arn:aws:dynamodb:us-west-2:\d{12}:table\/ProductInventory\/stream\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/;
      expect(streamArn).toMatch(streamArnRegex);
    });
  });
});