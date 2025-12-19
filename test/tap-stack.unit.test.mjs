import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct key schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayWith([
          Match.objectLike({ AttributeName: 'userId', KeyType: 'HASH' }),
          Match.objectLike({ AttributeName: 'workoutTimestamp', KeyType: 'RANGE' }),
        ]),
      });
    });

    test('should have provisioned billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: Match.absent(),
        ProvisionedThroughput: Match.objectLike({
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        }),
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function', () => {
      template.resourceCountIs('AWS::Lambda::Function', Match.anyValue());
    });

    test('should have Node.js runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: Match.stringLikeRegexp('nodejs'),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('should create API key', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
    });

    test('should create usage plan', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
    });
  });

  describe('CloudWatch', () => {
    test('should create CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });

  describe('IAM', () => {
    test('should create IAM role for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'lambda.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create SSM parameter for API rate limit', () => {
      template.resourceCountIs('AWS::SSM::Parameter', Match.anyValue());
    });
  });

  describe('Auto Scaling', () => {
    test('should create Application Auto Scaling targets', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 2);
    });

    test('should create scaling policies', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
    });
  });

  describe('Stack Outputs', () => {
    test('should have API endpoint output', () => {
      template.hasOutput('ApiEndpoint', {});
    });

    test('should have API key ID output', () => {
      template.hasOutput('ApiKeyId', {});
    });

    test('should have table name output', () => {
      template.hasOutput('TableName', {});
    });
  });
});

