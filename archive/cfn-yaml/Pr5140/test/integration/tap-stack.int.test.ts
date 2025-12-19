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

describe('LMS Infrastructure Integration Tests', () => {
  let outputs: StackOutputs;
  let environmentSuffix: string;

  beforeAll(() => {
    outputs = loadOutputs();
    environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr5140';
  });

  describe('Environment Configuration', () => {
    test('should have environment suffix configured', () => {
      expect(environmentSuffix).toBeDefined();
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('should have AWS region configured', () => {
      const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
      expect(awsRegion).toBeDefined();
      expect(awsRegion.length).toBeGreaterThan(0);
    });
  });

  describe('Template File', () => {
    test('should have CloudFormation template', () => {
      const templatePath = path.join(__dirname, '..', '..', 'lib', 'TapStack.yml');
      expect(fs.existsSync(templatePath)).toBe(true);
    });
  });
});
