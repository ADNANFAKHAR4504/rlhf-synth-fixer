import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Configuration', () => {
    test('should use environment suffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'myorg-test-users'
      });
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'myorg-test-data'
      });
    });

    test('should use environment suffix from context when no props provided', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'myorg-staging-users'
      });
    });

    test('should default to "dev" when no props or context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'myorg-dev-users'
      });
    });
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24'
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24'
      });
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('DynamoDB Tables', () => {
    test('should create DynamoDB tables with on-demand billing', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 2);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        TableName: `myorg-${environmentSuffix}-users`
      });
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        TableName: `myorg-${environmentSuffix}-data`
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create Lambda functions with Python 3.8 runtime', () => {
      // Should have at least 2 Lambda functions (API and S3 handlers)
      const lambdaCount = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaCount).length).toBeGreaterThanOrEqual(2);
      
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.8'
      });
    });
  });

  describe('API Gateway', () => {
    test('should create API Gateway REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `myorg-${environmentSuffix}-api`,
        Description: 'Serverless application API'
      });
    });

    test('should create API Gateway methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET'
      });
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST'
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with public access blocked', () => {
      // Should have at least 1 data bucket (may have more for CDK assets)
      const s3Count = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(s3Count).length).toBeGreaterThanOrEqual(1);
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create CloudWatch alarms for Lambda error rates', () => {
      // Should have 2 CloudWatch alarms (one for API Lambda, one for S3 Lambda)
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        Threshold: 5
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create IAM roles for Lambda execution', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole'
            }
          ])
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should define stack outputs', () => {
      template.hasOutput('ApiGatewayUrl', {});
      template.hasOutput('UserTableName', {});
      template.hasOutput('DataTableName', {});
    });
  });
});
