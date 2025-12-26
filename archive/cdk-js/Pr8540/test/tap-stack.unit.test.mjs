import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    // Set LocalStack environment for most tests
    process.env.CDK_LOCAL = 'true';
    process.env.ENVIRONMENT_SUFFIX = 'test';
    
    app = new App({
      context: {
        environmentSuffix: 'test'
      }
    });
    stack = new TapStack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
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

  test('Stack has VPC resource', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {});
  });

  test('Stack has DynamoDB table', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST'
    });
  });

  test('Stack has Lambda function', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x'
    });
  });

  test('Stack has API Gateway', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {});
  });
});

// Test non-LocalStack path for coverage
describe('TapStack Non-LocalStack Tests', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    // Clear LocalStack environment to test ElastiCache path
    delete process.env.CDK_LOCAL;
    delete process.env.AWS_ENDPOINT_URL;
    delete process.env.LOCALSTACK_HOSTNAME;
    process.env.ENVIRONMENT_SUFFIX = 'prod';
    
    app = new App({
      context: {
        environmentSuffix: 'prod'
      }
    });
    stack = new TapStack(app, 'ProdStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  afterAll(() => {
    delete process.env.ENVIRONMENT_SUFFIX;
  });

  test('Non-LocalStack stack is created successfully', () => {
    expect(stack).toBeDefined();
  });

  test('Non-LocalStack stack has ElastiCache resources', () => {
    // This covers the ElastiCache code path (lines 54-68)
    template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
      Engine: 'redis',
      CacheNodeType: 'cache.t3.micro'
    });
  });

  test('Non-LocalStack stack has NAT Gateway', () => {
    // VPC with natGateways: 1 in non-LocalStack mode
    const resources = template.toJSON().Resources || {};
    const natGatewayCount = Object.values(resources).filter(r => 
      r.Type === 'AWS::EC2::NatGateway'
    ).length;
    expect(natGatewayCount).toBeGreaterThan(0);
  });

  test('Non-LocalStack stack has Redis subnet group', () => {
    template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
      Description: 'Subnet group for Redis cluster'
    });
  });
});
