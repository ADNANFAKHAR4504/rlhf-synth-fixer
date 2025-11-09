import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Infrastructure Analysis System', () => {
    test('creates analysis resources with environment suffix', () => {
      // ARRANGE
      const envSuffix = 'testenv';
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: envSuffix,
      });
      template = Template.fromStack(stack);

      // ASSERT
      template.resourceCountIs('AWS::DynamoDB::Table', 2); // Analysis results and compliance scores
      template.resourceCountIs('AWS::S3::Bucket', 1); // Analysis reports bucket
      template.resourceCountIs('AWS::Lambda::Function', 2); // Resource scanner and security analyzer
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1); // API Gateway
      template.resourceCountIs('AWS::SNS::Topic', 2); // Critical findings and analysis reports

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `infrastructure-analysis-results-${envSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `infrastructure-analysis-reports-${envSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('defaults environment suffix to dev if not provided', () => {
      // ARRANGE
      stack = new TapStack(app, 'TestStackDefault');
      template = Template.fromStack(stack);

      // ASSERT
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'infrastructure-analysis-results-dev',
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'infrastructure-analysis-reports-dev',
      });
    });

    test('creates Lambda functions with correct configuration', () => {
      // ARRANGE
      const envSuffix = 'testenv';
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: envSuffix,
      });
      template = Template.fromStack(stack);

      // ASSERT - Resource Scanner Lambda
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `resource-inventory-scanner-${envSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 600, // 10 minutes
      });

      // ASSERT - Security Analyzer Lambda
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `security-analysis-engine-${envSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 300, // 5 minutes
      });
    });

    test('creates API Gateway with CORS and endpoints', () => {
      // ARRANGE
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // ASSERT
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Description: 'API for infrastructure analysis results',
      });

      // Check for method resources (GET endpoints)
      template.resourceCountIs('AWS::ApiGateway::Method', 2); // GET methods for results and compliance
    });

    test('creates EventBridge rules for scheduled analysis', () => {
      // ARRANGE
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // ASSERT
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Trigger infrastructure analysis on schedule',
        ScheduleExpression: 'cron(0 2 * * ? *)', // Daily at 2 AM
        State: 'ENABLED',
      });
    });

    test('creates CloudWatch alarms for monitoring', () => {
      // ARRANGE
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // ASSERT
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2); // Lambda errors and compliance score alarms
    });

    test('creates SNS topics with email subscriptions', () => {
      // ARRANGE
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // ASSERT
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Infrastructure Critical Findings',
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Infrastructure Analysis Reports',
      });

      // Check for email subscriptions
      template.resourceCountIs('AWS::SNS::Subscription', 2); // Email subscriptions
    });
  });
});
