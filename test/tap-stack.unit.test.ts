import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
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
      notificationEmail: 'test@example.com'
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('creates notification table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `notification-logs-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'notificationId',
            AttributeType: 'S'
          },
          {
            AttributeName: 'timestamp', 
            AttributeType: 'N'
          },
          {
            AttributeName: 'deliveryStatus',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'notificationId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
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
                KeyType: 'HASH'
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
              }
            ]
          }
        ]
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates order notification topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `order-notifications-${environmentSuffix}`,
        DisplayName: 'Order Notification Distribution Topic'
      });
    });

    test('creates alarm topic for monitoring', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `notification-alarms-${environmentSuffix}`,
        DisplayName: 'Notification System Alarms'
      });
    });

    test('creates email subscriptions', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com'
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates email formatter function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `email-formatter-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 512
      });
    });

    test('creates SMS formatter function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `sms-formatter-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 512
      });
    });

    test('configures environment variables for Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            SENDER_EMAIL: 'test@example.com'
          }
        }
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue()
          }
        }
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
                'dynamodb:DeleteItem'
              ])
            })
          ])
        }
      });
    });

    test('grants SES permissions to email formatter', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['ses:SendEmail', 'ses:SendRawEmail'],
              Resource: '*'
            })
          ])
        }
      });
    });

    test('grants SNS publish permissions to SMS formatter', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: '*'
            })
          ])
        }
      });
    });
  });

  describe('SNS Subscriptions', () => {
    test('creates Lambda subscriptions with filter policies', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
        FilterPolicy: {
          channel: ['email', 'both']
        }
      });

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
        FilterPolicy: {
          channel: ['sms', 'both']
        }
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `notification-metrics-${environmentSuffix}`
      });
    });

    test('creates CloudWatch alarms for Lambda errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `email-formatter-errors-${environmentSuffix}`,
        Threshold: 10,
        ComparisonOperator: 'GreaterThanThreshold'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `sms-formatter-errors-${environmentSuffix}`,
        Threshold: 10,
        ComparisonOperator: 'GreaterThanThreshold'
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports notification topic ARN', () => {
      template.hasOutput('NotificationTopicArn', {
        Description: 'ARN of the notification topic',
        Export: {
          Name: `notification-topic-arn-${environmentSuffix}`
        }
      });
    });

    test('exports notification table name', () => {
      template.hasOutput('NotificationTableName', {
        Description: 'Name of the notification logs table',
        Export: {
          Name: `notification-table-name-${environmentSuffix}`
        }
      });
    });

    test('exports dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL'
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('has expected number of resources', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::SNS::Topic', 2);
      template.resourceCountIs('AWS::Lambda::Function', 2);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });
});
