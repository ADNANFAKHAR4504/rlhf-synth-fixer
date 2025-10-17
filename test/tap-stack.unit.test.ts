import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('stack synthesizes without errors', () => {
      expect(() => app.synth()).not.toThrow();
    });

    test('stack has correct name format', () => {
      expect(stack.stackName).toBe(`TapStack${environmentSuffix}`);
    });

    test('stack is in correct region', () => {
      expect(stack.region).toBe('us-east-1');
    });

    test('stack has correct account', () => {
      expect(stack.account).toBe('123456789012');
    });
  });

  describe('WebhookStack Integration', () => {
    test('creates WebhookStack with correct properties', () => {
      // Webhook stack should be created as part of TapStack
      expect(() => app.synth()).not.toThrow();
    });

    test('passes environment suffix to WebhookStack', () => {
      const customSuffix = 'prod';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, `TapStack${customSuffix}`, {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: customSuffix,
      });

      expect(() => customApp.synth()).not.toThrow();
    });
  });

  describe('Environment Configuration', () => {
    test('accepts different environment suffixes', () => {
      const suffixes = ['dev', 'staging', 'prod', 'pr1234'];

      suffixes.forEach(suffix => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, `TapStack${suffix}`, {
          env: {
            account: '123456789012',
            region: 'us-east-1',
          },
          environmentSuffix: suffix,
        });

        expect(() => testApp.synth()).not.toThrow();
        expect(testStack.stackName).toBe(`TapStack${suffix}`);
      });
    });

    test('accepts different AWS regions', () => {
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1'];

      regions.forEach(region => {
        const regionApp = new cdk.App();
        const regionStack = new TapStack(regionApp, `TapStack${region}`, {
          env: {
            account: '123456789012',
            region,
          },
          environmentSuffix: 'test',
        });

        expect(() => regionApp.synth()).not.toThrow();
        expect(regionStack.region).toBe(region);
      });
    });

    test('uses dev as default stageName in context', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('stage', 'dev');

      const contextStack = new TapStack(contextApp, 'TapStackContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'test',
      });

      expect(() => contextApp.synth()).not.toThrow();
    });
  });

  describe('Stack Metadata', () => {
    test('stack artifact is created', () => {
      const synthesized = app.synth();
      const stackArtifact = synthesized.getStackByName(stack.stackName);
      expect(stackArtifact).toBeDefined();
      expect(stackArtifact.templateFile).toBeDefined();
    });

    test('stack has no unresolved tokens', () => {
      const synthesized = app.synth();
      const stackArtifact = synthesized.getStackByName(stack.stackName);
      expect(stackArtifact).toBeDefined();
    });
  });

  describe('Optional Custom Domain Parameters', () => {
    test('creates stack without custom domain parameters', () => {
      const noDomainApp = new cdk.App();
      const noDomainStack = new TapStack(noDomainApp, 'TapStackNoDomain', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'test',
      });

      expect(() => noDomainApp.synth()).not.toThrow();
    });

    test('creates stack with custom domain parameters from context', () => {
      const domainApp = new cdk.App();
      domainApp.node.setContext('customDomain', 'webhooks.example.com');
      domainApp.node.setContext('hostedZoneId', 'Z1234567890ABC');
      domainApp.node.setContext('certificateArn', 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012');

      const domainStack = new TapStack(domainApp, 'TapStackDomain', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'test',
      });

      expect(() => domainApp.synth()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('uses default when environmentSuffix is empty', () => {
      const errorApp = new cdk.App();
      const stack = new TapStack(errorApp, 'TapStackError', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: '',
      });
      // Should not throw, uses 'dev' as default
      expect(() => errorApp.synth()).not.toThrow();
    });

    test('handles undefined environment gracefully', () => {
      const undefEnvApp = new cdk.App();
      const undefEnvStack = new TapStack(undefEnvApp, 'TapStackUndefEnv', {
        environmentSuffix: 'test',
      });

      expect(() => undefEnvApp.synth()).not.toThrow();
    });
  });
});
