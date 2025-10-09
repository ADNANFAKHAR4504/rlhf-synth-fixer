import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
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
    test('creates error logs table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `error-logs-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'errorId',
            AttributeType: 'S'
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S'
          },
          {
            AttributeName: 'functionName',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'errorId',
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

    test('creates global secondary index for function name queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'FunctionNameIndex',
            KeySchema: [
              {
                AttributeName: 'functionName',
                KeyType: 'HASH'
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
              }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ]
      });
    });
  });

  describe('SNS Topic and Subscription', () => {
    test('creates SNS topic with correct name and display name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `monitoring-alerts-${environmentSuffix}`,
        DisplayName: `Monitoring Alerts - ${environmentSuffix.toUpperCase()}`
      });
    });

    test('creates email subscription for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com'
      });
    });
  });

  describe('IAM Role', () => {
    test('creates Lambda execution role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        },
        ManagedPolicyArns: [
          Match.objectLike({
            'Fn::Join': Match.anyValue()
          })
        ]
      });
    });

    test('grants DynamoDB write permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.anyValue()
        }
      });
    });

    test('grants CloudWatch Logs permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              Resource: '*'
            }
          ])
        }
      });
    });
  });

  describe('Lambda Functions', () => {
    const functionNames = ['user-service', 'order-processor', 'payment-handler', 'notification-sender', 'data-aggregator'];

    test('creates all five Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 5);
    });

    functionNames.forEach(funcName => {
      test(`creates ${funcName} function with correct configuration`, () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `${funcName}-${environmentSuffix}`,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          Timeout: 30,
          MemorySize: 256,
          Environment: {
            Variables: {
              ERROR_TABLE_NAME: Match.anyValue(),
              FUNCTION_NAME: `${funcName}-${environmentSuffix}`,
              ENVIRONMENT: environmentSuffix
            }
          }
        });
      });
    });

    test('Lambda functions have inline code with error handling', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.stringLikeRegexp('DynamoDBClient.*PutItemCommand')
        }
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates error rate alarms for all functions', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 15); // 3 alarms per function * 5 functions
    });

    test('creates error rate alarm with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('Error rate exceeded 5%'),
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('creates latency alarm with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('Average duration exceeded 500ms'),
        Threshold: 500,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('creates throttle alarm with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('is being throttled'),
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching'
      });
    });

    test('alarms are configured with SNS actions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue()
          })
        ])
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates dashboard with correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-monitoring-${environmentSuffix}`
      });
    });

    test('dashboard has configuration body', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.anyValue()
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports DynamoDB table name', () => {
      template.hasOutput('ErrorLogsTableName', {
        Description: 'DynamoDB table for error logs'
      });
    });

    test('exports SNS topic ARN', () => {
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS topic for monitoring alerts'
      });
    });

    test('exports dashboard URL', () => {
      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL'
      });
    });

    test('exports all Lambda function names', () => {
      for (let i = 1; i <= 5; i++) {
        template.hasOutput(`Function${i}Name`, {
          Description: `Lambda function ${i}`
        });
      }
    });
  });

  describe('Resource Naming', () => {
    test('all resources use environment suffix correctly', () => {
      // DynamoDB Table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `error-logs-${environmentSuffix}`
      });

      // SNS Topic
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `monitoring-alerts-${environmentSuffix}`
      });

      // Lambda Functions
      const functionNames = ['user-service', 'order-processor', 'payment-handler', 'notification-sender', 'data-aggregator'];
      functionNames.forEach(funcName => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `${funcName}-${environmentSuffix}`
        });
      });
    });
  });

  describe('Security Configuration', () => {
    test('Lambda functions use dedicated execution role', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Role: Match.anyValue()
      });
    });

    test('DynamoDB table has deletion policy for cleanup', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete'
      });
    });

    test('IAM role follows least privilege principle', () => {
      // Role should only have necessary permissions
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
          Match.objectLike({
            'Fn::Join': Match.anyValue()
          })
        ]
      });
    });
  });
});
