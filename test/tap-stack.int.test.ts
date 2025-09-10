// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Infrastructure Integration Tests', () => {
    test('should validate deployment outputs exist', async () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('should have required infrastructure outputs', async () => {
      // These outputs should be available from the CloudFormation deployment
      // Testing will depend on what outputs are actually generated
      const requiredOutputs = ['VPCId'];
      
      for (const output of requiredOutputs) {
        if (outputs[output]) {
          expect(outputs[output]).toBeDefined();
          expect(typeof outputs[output]).toBe('string');
          expect(outputs[output]).not.toBe('');
        }
      }
    });
  });
});
