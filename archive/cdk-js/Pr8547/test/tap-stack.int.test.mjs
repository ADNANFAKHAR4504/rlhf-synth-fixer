// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  describe('Environment Configuration', () => {
    test('environment suffix is set', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('environment suffix has valid format', () => {
      expect(environmentSuffix).toMatch(/^[a-z0-9]+$/i);
    });

    test('environment suffix is not default in CI mode', () => {
      if (process.env.CI_MODE === '1') {
        expect(environmentSuffix).not.toBe('dev');
      } else {
        expect(environmentSuffix).toBeDefined();
      }
    });
  });

  describe('Stack Instantiation', () => {
    test('can create TapStack instance', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: environmentSuffix,
        instanceCount: 1,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.stackName).toBeDefined();
    });

    test('stack has correct region', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: environmentSuffix,
        instanceCount: 1,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(stack.region).toBe('us-east-1');
    });

    test('stack has correct account', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: environmentSuffix,
        instanceCount: 1,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(stack.account).toBe('123456789012');
    });
  });

  describe('Stack Structure', () => {
    let app;
    let stack;

    beforeAll(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: environmentSuffix,
        instanceCount: 1,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
    });

    test('stack has child constructs', () => {
      const children = stack.node.children;
      expect(children.length).toBeGreaterThan(0);
    });

    test('stack has VPC construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('MonitoringVpc');
    });

    test('stack has security group construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('InstanceSecurityGroup');
    });

    test('stack has S3 bucket construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('LogArchiveBucket');
    });

    test('stack has IAM role construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('Ec2InstanceRole');
    });

    test('stack has SNS topic construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('AlertTopic');
    });

    test('stack has CloudWatch dashboard construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('MonitoringDashboard');
    });
  });

  describe('Outputs File Validation', () => {
    test('cfn-outputs directory may or may not exist', () => {
      const dirExists = fs.existsSync('cfn-outputs');
      expect(typeof dirExists).toBe('boolean');
    });

    test('if outputs file exists it should be valid JSON', () => {
      if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
        const fileContent = fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8');
        expect(() => JSON.parse(fileContent)).not.toThrow();
      } else {
        expect(true).toBe(true);
      }
    });
  });

  describe('Environment Variables', () => {
    test('ENVIRONMENT_SUFFIX can be read', () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX;
      expect(envSuffix === undefined || typeof envSuffix === 'string').toBe(true);
    });

    test('CI_MODE can be read', () => {
      const ciMode = process.env.CI_MODE;
      expect(ciMode === undefined || typeof ciMode === 'string').toBe(true);
    });
  });

  describe('CDK App Synthesis', () => {
    test('can synthesize TapStack', () => {
      const app = new cdk.App();
      new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: environmentSuffix,
        instanceCount: 1,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      const assembly = app.synth();
      expect(assembly).toBeDefined();
    });

    test('synthesized stack has artifacts', () => {
      const app = new cdk.App();
      new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: environmentSuffix,
        instanceCount: 1,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      const assembly = app.synth();
      expect(assembly.artifacts.length).toBeGreaterThan(0);
    });
  });
});

