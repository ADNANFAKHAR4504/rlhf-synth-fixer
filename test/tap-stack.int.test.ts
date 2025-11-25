// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  test('TapStack outputs should be available', () => {
    expect(outputs.TurnAroundPromptTableName).toBeDefined();
    expect(outputs.TurnAroundPromptTableArn).toBeDefined();
    expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
  });

  test('DynamoDB table name should include environment suffix', () => {
    expect(outputs.TurnAroundPromptTableName).toContain(environmentSuffix);
  });

  test('DynamoDB table ARN should be valid', () => {
    expect(outputs.TurnAroundPromptTableArn).toMatch(/^arn:aws:dynamodb:/);
  });
});
