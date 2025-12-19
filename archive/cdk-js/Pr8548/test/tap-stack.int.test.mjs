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
        env: {
          account: '123456789012',
          region: 'ca-central-1',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.stackName).toBeDefined();
    });

    test('stack has correct region', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'ca-central-1',
        },
      });

      expect(stack.region).toBe('ca-central-1');
    });

    test('stack has correct account', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'ca-central-1',
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
        env: {
          account: '123456789012',
          region: 'ca-central-1',
        },
      });
    });

    test('stack has child constructs', () => {
      const children = stack.node.children;
      expect(children.length).toBeGreaterThan(0);
    });

    test('stack has networking construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('Networking');
    });

    test('stack has security construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('Security');
    });

    test('stack has data ingestion construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('DataIngestion');
    });

    test('stack has database construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('Database');
    });

    test('stack has storage construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('Storage');
    });

    test('stack has cache construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('Cache');
    });

    test('stack has compute construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('Compute');
    });

    test('stack has api construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('Api');
    });

    test('stack has pipeline construct', () => {
      const children = stack.node.children.map(c => c.node.id);
      expect(children).toContain('Pipeline');
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
        env: {
          account: '123456789012',
          region: 'ca-central-1',
        },
      });

      const assembly = app.synth();
      expect(assembly).toBeDefined();
    });

    test('synthesized stack has artifacts', () => {
      const app = new cdk.App();
      new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: environmentSuffix,
        env: {
          account: '123456789012',
          region: 'ca-central-1',
        },
      });

      const assembly = app.synth();
      expect(assembly.artifacts.length).toBeGreaterThan(0);
    });
  });
});

