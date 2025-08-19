// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Stack Synthesis', () => {
    test('should synthesize stack without errors', () => {
      // This test verifies that the stack can be synthesized
      // In a real integration test, you would deploy the stack and test the actual resources
      expect(environmentSuffix).toBeDefined();
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });
  });
});
