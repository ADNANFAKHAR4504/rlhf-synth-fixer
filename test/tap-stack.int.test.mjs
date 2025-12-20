import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

// Mock config for integration tests
const mockConfig = {
  dev: {
    environment: 'dev',
    existingVpcId: 'vpc-12345678',
    instanceType: 't3.micro',
    keyPairName: 'int-test-key',
    s3BucketName: 'int-test-bucket',
    amiId: 'ami-12345678',
    subnetIds: ['subnet-12345678'],
    availabilityZones: ['us-east-1a'],
  },
  int: {
    environment: 'int',
    existingVpcId: 'vpc-12345678',
    instanceType: 't3.small',
    keyPairName: 'int-test-key',
    s3BucketName: 'int-test-bucket',
    amiId: 'ami-12345678',
    subnetIds: ['subnet-12345678'],
    availabilityZones: ['us-east-1a'],
  }
};

describe('TapStack Integration Tests', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    process.env.CDK_LOCAL = 'true';
    process.env.ENVIRONMENT_SUFFIX = 'dev';
    
    app = new App({
      context: {
        environmentSuffix: 'dev',
        environments: mockConfig
      }
    });
    
    stack = new TapStack(app, 'IntTestStack', {
      env: {
        account: process.env.AWS_ACCOUNT_ID || '123456789012',
        region: process.env.AWS_REGION || 'us-east-1'
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

  test('Stack synthesizes without errors', () => {
    expect(stack).toBeDefined();
  });

  test('CloudFormation template is valid JSON', () => {
    const json = template.toJSON();
    expect(json).toBeDefined();
    expect(json.Resources).toBeDefined();
  });

  test('Template has resources', () => {
    const json = template.toJSON();
    const resources = json.Resources || {};
    expect(Object.keys(resources).length).toBeGreaterThan(0);
  });
});
