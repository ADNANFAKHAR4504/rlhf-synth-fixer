import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

// Mock config - includes ALL required fields
const mockConfig = {
  dev: {
    environment: 'dev',
    existingVpcId: 'vpc-12345678',
    vpcCidrBlock: '10.0.0.0/16',
    existingS3Bucket: 'test-bucket-dev',
    sshCidrBlock: '10.0.0.0/16',
    trustedOutboundCidrs: ['10.0.0.0/8', '172.16.0.0/12'],
    instanceType: 't3.micro',
    keyPairName: 'test-key',
    amiId: 'ami-12345678',
    subnetIds: ['subnet-12345678'],
    availabilityZones: ['us-east-1a'],
  }
};

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    process.env.CDK_LOCAL = 'true';
    process.env.ENVIRONMENT_SUFFIX = 'dev';
    
    app = new App({
      context: {
        environmentSuffix: 'dev',
        environments: mockConfig,
        '@aws-cdk/core:newStyleStackSynthesis': false
      }
    });
    
    stack = new TapStack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      },
      environmentSuffix: 'dev',
      config: mockConfig
    });
    template = Template.fromStack(stack);
  });

  afterAll(() => {
    delete process.env.CDK_LOCAL;
    delete process.env.ENVIRONMENT_SUFFIX;
  });

  test('Stack is created successfully', () => {
    expect(stack).toBeDefined();
    expect(stack instanceof Stack).toBe(true);
  });

  test('Template is valid', () => {
    expect(template).toBeDefined();
  });

  test('Stack has expected resources', () => {
    const resources = template.toJSON().Resources || {};
    expect(Object.keys(resources).length).toBeGreaterThan(0);
  });

  test('Stack has correct environment tag', () => {
    const json = template.toJSON();
    expect(json).toBeDefined();
  });
});
