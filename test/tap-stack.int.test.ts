// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  test('should validate CloudFormation outputs exist', () => {
    expect(outputs).toBeDefined();
    expect(outputs).toHaveProperty('TurnAroundPromptTableName');
    expect(outputs).toHaveProperty('TurnAroundPromptTableArn');
    expect(outputs).toHaveProperty('StackName');
    expect(outputs).toHaveProperty('EnvironmentSuffix');
  });

  test('should verify table name follows naming convention', () => {
    const tableName = outputs.TurnAroundPromptTableName;
    expect(tableName).toMatch(/^TurnAroundPromptTable[a-zA-Z0-9]+$/);
  });

  test('should verify ARN format is valid', () => {
    const tableArn = outputs.TurnAroundPromptTableArn;
    expect(tableArn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d{12}:table\/.+$/);
  });

  test('should verify environment suffix matches expected value', () => {
    const envSuffix = outputs.EnvironmentSuffix;
    expect(envSuffix).toBe(environmentSuffix);
  });
});
