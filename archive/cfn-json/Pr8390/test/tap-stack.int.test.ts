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

describe('VPC Infrastructure Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    if (!hasOutputs) {
      // If there's no deploy outputs available, skip integration tests with a helpful message
      test.skip('Integration tests skipped — missing cfn-outputs/flat-outputs.json (run CDK deploy or provide mock outputs)', () => { });
    } else {
      test('should have deployment outputs defined', async () => {
        expect(outputs).toBeDefined();
        expect(Object.keys(outputs).length).toBeGreaterThan(0);
      });

      test('should have VPC output with valid ID format', async () => {
        expect(outputs.VPCId).toBeDefined();
        expect(typeof outputs.VPCId).toBe('string');
        expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);
      });

      test('should have public subnet outputs with valid IDs', async () => {
        expect(outputs.PublicSubnet1Id).toBeDefined();
        expect(outputs.PublicSubnet2Id).toBeDefined();
        expect(outputs.PublicSubnet3Id).toBeDefined();
        expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-z0-9]+$/);
        expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-z0-9]+$/);
        expect(outputs.PublicSubnet3Id).toMatch(/^subnet-[a-z0-9]+$/);
      });

      test('should have private subnet outputs with valid IDs', async () => {
        expect(outputs.PrivateSubnet1Id).toBeDefined();
        expect(outputs.PrivateSubnet2Id).toBeDefined();
        expect(outputs.PrivateSubnet3Id).toBeDefined();
        expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-z0-9]+$/);
        expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-z0-9]+$/);
        expect(outputs.PrivateSubnet3Id).toMatch(/^subnet-[a-z0-9]+$/);
      });

      test('should have unique subnet IDs across all subnets', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id,
        ];
        const uniqueIds = new Set(subnetIds);
        expect(uniqueIds.size).toBe(subnetIds.length);
      });
    }
  });
});
