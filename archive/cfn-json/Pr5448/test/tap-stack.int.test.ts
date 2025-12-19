// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

// Path to outputs produced by deploy (CDK / CloudFormation).
// Use INTEGRATION_OUTPUTS_PATH env var to allow running tests against a mock file locally.
const outputsPath = process.env.INTEGRATION_OUTPUTS_PATH || 'cfn-outputs/flat-outputs.json';
const hasOutputs = fs.existsSync(outputsPath);
let outputs: any = {};
if (hasOutputs) {
  try {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } catch (e) {
    // If parsing fails, treat as no outputs available
    // The tests below will be skipped when outputs are missing or invalid
    outputs = {};
  }
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    if (!hasOutputs) {
      // If there's no deploy outputs available, skip integration tests with a helpful message
      test.skip('Integration tests skipped — missing cfn-outputs/flat-outputs.json (run CDK deploy or provide mock outputs)', () => { });
    } else {
      // Minimal integration smoke tests that validate expected outputs exist.
      test('should have necessary deploy outputs (TurnAroundPromptTableName)', async () => {
        expect(outputs).toBeDefined();
        expect(outputs.TurnAroundPromptTableName).toBeDefined();
        expect(typeof outputs.TurnAroundPromptTableName).toBe('string');
      });
    }
  });
});
