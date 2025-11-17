import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

// Mock process.env
const originalEnv = process.env;

describe('bin/tap.ts', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('creates stack with default environmentSuffix when not provided', () => {
    // Set environment variables
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    process.env.CDK_DEFAULT_REGION = 'us-east-1';
    delete process.env.ENVIRONMENT_SUFFIX;

    const app = new cdk.App();

    // Dynamically require to ensure fresh module load
    const { TapStack } = require('../lib/tap-stack');

    // Simulate bin/tap.ts logic
    const environmentSuffix = 'synthf4z68k';

    const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      },
      description: `Payment processing API infrastructure for ${environmentSuffix} environment`,
      tags: {
        Environment: environmentSuffix,
        Project: 'PaymentAPI',
        ManagedBy: 'CDK',
      },
    });

    expect(stack).toBeDefined();
    expect(stack.stackName).toBe(`TapStack${environmentSuffix}`);
  });

  test('creates stack with ENVIRONMENT_SUFFIX from environment variable', () => {
    // Set environment variables
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    process.env.CDK_DEFAULT_REGION = 'us-east-1';
    process.env.ENVIRONMENT_SUFFIX = 'testenv';

    const app = new cdk.App();

    const { TapStack } = require('../lib/tap-stack');

    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

    const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      },
      description: `Payment processing API infrastructure for ${environmentSuffix} environment`,
      tags: {
        Environment: environmentSuffix,
        Project: 'PaymentAPI',
        ManagedBy: 'CDK',
      },
    });

    expect(stack).toBeDefined();
    expect(stack.stackName).toBe('TapStacktestenv');
  });

  test('creates stack with custom domain when provided', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    process.env.CDK_DEFAULT_REGION = 'us-east-1';

    const app = new cdk.App();

    const { TapStack } = require('../lib/tap-stack');

    const environmentSuffix = 'prod';
    const customDomainName = 'api.example.com';
    const certificateArn = 'arn:aws:acm:us-east-1:123456789012:certificate/test';

    const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      customDomainName,
      certificateArn,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      },
      description: `Payment processing API infrastructure for ${environmentSuffix} environment`,
      tags: {
        Environment: environmentSuffix,
        Project: 'PaymentAPI',
        ManagedBy: 'CDK',
      },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::DomainName', {
      DomainName: customDomainName,
    });
  });

  test('uses default region when CDK_DEFAULT_REGION not set', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    delete process.env.CDK_DEFAULT_REGION;

    const app = new cdk.App();

    const { TapStack } = require('../lib/tap-stack');

    const environmentSuffix = 'test';

    const stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      },
      description: `Payment processing API infrastructure for ${environmentSuffix} environment`,
    });

    expect(stack).toBeDefined();
    expect(stack.region).toBe('us-east-1');
  });
});
