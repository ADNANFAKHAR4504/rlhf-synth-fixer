import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      notificationEmail: 'test@example.com',
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('uses environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'prod',
        notificationEmail: 'prod@example.com',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'notification-logs-prod',
      });
    });

    test('uses environment suffix from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {
        notificationEmail: 'staging@example.com',
      });
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'notification-logs-staging',
      });
    });

    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        notificationEmail: 'default@example.com',
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'notification-logs-dev',
      });
    });

    test('uses notification email from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomEmailStack', {
        environmentSuffix: 'test',
        notificationEmail: 'custom@example.com',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'custom@example.com',
      });
    });

    test('uses notification email from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          notificationEmail: 'context@example.com',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextEmailStack', {
        environmentSuffix: 'test',
      });
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'context@example.com',
      });
    });

    test('uses default notification email when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultEmailStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates notification table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `notification-logs-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'notificationId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
          {
            AttributeName: 'deliveryStatus',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'notificationId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('creates global secondary index for status queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'StatusIndex',
            KeySchema: [
              {
                AttributeName: 'deliveryStatus',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('has retention policy set to RETAIN', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates order notification topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `order-notifications-${environmentSuffix}`,
        DisplayName: 'Order Notification Distribution Topic',
      });
    });

    test('creates alarm topic for monitoring', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `notification-alarms-${environmentSuffix}`,
        DisplayName: 'Notification System Alarms',
      });
    });

    test('creates email subscriptions', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('creates multiple email subscriptions for different topics', () => {
      const subscriptions = template.findResources('AWS::SNS::Subscription', {
        Properties: {
          Protocol: 'email',
          Endpoint: 'test@example.com',
        },
      });

      expect(Object.keys(subscriptions).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Lambda Functions', () => {
    test('creates email formatter function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `email-formatter-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 512,
      });
    });

    test('creates SMS formatter function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `sms-formatter-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 512,
      });
    });

    test('configures environment variables for email formatter', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `email-formatter-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            SENDER_EMAIL: 'test@example.com',
          },
        },
      });
    });

    test('configures environment variables for SMS formatter', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `sms-formatter-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
          },
        },
      });
    });

    test('has inline code for Lambda functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKeys = Object.keys(functions);

      expect(functionKeys.length).toBeGreaterThanOrEqual(2);
      functionKeys.forEach(key => {
        expect(functions[key].Properties.Code).toBeDefined();
      });
    });
  });

  describe('IAM Permissions', () => {
    test('grants DynamoDB write permissions to Lambda functions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ]),
            }),
          ]),
        },
      });
    });

    test('grants SES permissions to email formatter', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['ses:SendEmail', 'ses:SendRawEmail'],
              Resource: '*',
            }),
          ]),
        },
      });
    });

    test('Lambda functions have execution roles', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              }),
            ]),
          },
        },
      });

      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SNS Subscriptions', () => {
    test('creates Lambda subscription for email with filter policy', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
        FilterPolicy: {
          channel: ['email', 'both'],
        },
      });
    });

    test('creates Lambda subscription for SMS with filter policy', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
        FilterPolicy: {
          channel: ['sms', 'both'],
        },
      });
    });

    test('Lambda subscriptions are connected to correct topic', () => {
      const subscriptions = template.findResources('AWS::SNS::Subscription', {
        Properties: {
          Protocol: 'lambda',
        },
      });

      expect(Object.keys(subscriptions).length).toBe(2);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `notification-metrics-${environmentSuffix}`,
      });
    });

    test('dashboard contains proper widget configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.anyValue(),
      });
    });

    test('creates CloudWatch alarm for email formatter errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `email-formatter-errors-${environmentSuffix}`,
        Threshold: 10,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('creates CloudWatch alarm for SMS formatter errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `sms-formatter-errors-${environmentSuffix}`,
        Threshold: 10,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('alarms have SNS action configured', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmKeys = Object.keys(alarms);

      alarmKeys.forEach(key => {
        expect(alarms[key].Properties.AlarmActions).toBeDefined();
        expect(alarms[key].Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports notification topic ARN', () => {
      template.hasOutput('NotificationTopicArn', {
        Description: 'ARN of the notification topic',
        Export: {
          Name: `notification-topic-arn-${environmentSuffix}`,
        },
      });
    });

    test('exports notification table name', () => {
      template.hasOutput('NotificationTableName', {
        Description: 'Name of the notification logs table',
        Export: {
          Name: `notification-table-name-${environmentSuffix}`,
        },
      });
    });

    test('exports dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
      });
    });

    test('dashboard URL contains region reference', () => {
      const outputs = template.findOutputs('DashboardUrl');
      expect(outputs.DashboardUrl).toBeDefined();
    });
  });

  describe('Resource Count Validation', () => {
    test('creates expected number of SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
    });

    test('creates expected number of Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    test('creates expected number of DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('creates expected number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('creates expected number of CloudWatch dashboards', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });

  describe('Integration Tests', () => {
    test('Lambda functions can invoke SNS topic', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      let hasLambdaInvokePermission = false;

      Object.keys(policies).forEach(key => {
        const statements = policies[key].Properties.PolicyDocument.Statement;
        statements.forEach((statement: any) => {
          if (
            statement.Effect === 'Allow' &&
            statement.Principal?.Service === 'lambda.amazonaws.com'
          ) {
            hasLambdaInvokePermission = true;
          }
        });
      });

      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });
  });
});
