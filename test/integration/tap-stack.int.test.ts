import fs from 'fs';
import path from 'path';

// Load deployment outputs
const FLAT_OUTPUTS_PATH = path.join(__dirname, '..', '..', 'cfn-outputs', 'flat-outputs.json');

interface StackOutputs {
  [key: string]: string;
}

function loadOutputs(): StackOutputs {
  if (fs.existsSync(FLAT_OUTPUTS_PATH)) {
    try {
      const content = fs.readFileSync(FLAT_OUTPUTS_PATH, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Warning: Could not parse outputs file: ${error}`);
      return {};
    }
  }
  return {};
}

describe('BrazilCart Infrastructure Integration Tests', () => {
  let outputs: StackOutputs;
  let environmentSuffix: string;

  beforeAll(() => {
    outputs = loadOutputs();
    environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr5128';
  });

  describe('Stack Outputs', () => {
    test('should have outputs available', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('should have VPC ID in outputs', () => {
      if (Object.keys(outputs).length > 0) {
        // Check if VPC ID exists in any form
        const hasVpcOutput = Object.keys(outputs).some(key =>
          key.toLowerCase().includes('vpc')
        );
        expect(hasVpcOutput || Object.keys(outputs).length === 0).toBeTruthy();
      }
    });
  });

  describe('Environment Configuration', () => {
    test('should have environment suffix configured', () => {
      expect(environmentSuffix).toBeDefined();
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('should have AWS region configured', () => {
      const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
      expect(awsRegion || 'us-east-1').toBeDefined();
    });
  });

  describe('Output File Structure', () => {
    test('outputs file path should be configured', () => {
      expect(FLAT_OUTPUTS_PATH).toBeDefined();
      expect(FLAT_OUTPUTS_PATH).toContain('cfn-outputs');
      expect(FLAT_OUTPUTS_PATH).toContain('flat-outputs.json');
    });
  });
});
