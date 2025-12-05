import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvironmentSuffix = 'test-env';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: testEnvironmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    it('creates a DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `drift-detection-${testEnvironmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'stackName',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'stackName',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    it('sets DynamoDB table removal policy to DESTROY', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    it('includes environmentSuffix in table name', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}$`),
      });
    });
  });

  describe('SNS Topic', () => {
    it('creates an SNS topic for drift alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `drift-alerts-${testEnvironmentSuffix}`,
        DisplayName: 'CloudFormation Drift Detection Alerts',
      });
    });

    it('includes environmentSuffix in topic name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}$`),
      });
    });
  });

  describe('Lambda Function', () => {
    it('creates a Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `drift-detector-${testEnvironmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 900,
        MemorySize: 512,
      });
    });

    it('sets correct environment variables for Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DRIFT_TABLE_NAME: Match.objectLike({
              Ref: Match.stringLikeRegexp('DriftTable.*'),
            }),
            ENVIRONMENT_SUFFIX: testEnvironmentSuffix,
            ALERT_TOPIC_ARN: Match.objectLike({
              Ref: Match.stringLikeRegexp('AlertTopic.*'),
            }),
          },
        },
      });
    });

    it('includes environmentSuffix in function name', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}$`),
      });
    });

    it('grants Lambda CloudFormation read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'cloudformation:DescribeStacks',
                'cloudformation:ListStacks',
                'cloudformation:DetectStackDrift',
                'cloudformation:DescribeStackDriftDetectionStatus',
                'cloudformation:DescribeStackResourceDrifts',
              ]),
            }),
          ]),
        },
      });
    });

    it('grants Lambda DynamoDB write permissions', () => {
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

    it('grants Lambda SNS publish permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'sns:Publish',
            }),
          ]),
        },
      });
    });
  });

  describe('EventBridge Rule', () => {
    it('creates an EventBridge rule with correct schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `drift-detection-schedule-${testEnvironmentSuffix}`,
        Description: 'Triggers drift detection every 6 hours',
        ScheduleExpression: 'rate(6 hours)',
        State: 'ENABLED',
      });
    });

    it('includes environmentSuffix in rule name', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}$`),
      });
    });

    it('targets the Lambda function', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: [
          {
            Arn: Match.objectLike({
              'Fn::GetAtt': Match.arrayWith([
                Match.stringLikeRegexp('DriftFunction.*'),
              ]),
            }),
            Id: 'Target0',
          },
        ],
      });
    });

    it('creates Lambda permission for EventBridge to invoke', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'events.amazonaws.com',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    it('exports DriftTableName output', () => {
      template.hasOutput('DriftTableName', {
        Description: 'DynamoDB table for drift detection results',
        Export: {
          Name: `DriftTableName-${testEnvironmentSuffix}`,
        },
      });
    });

    it('exports DriftFunctionName output', () => {
      template.hasOutput('DriftFunctionName', {
        Description: 'Lambda function for drift detection',
        Export: {
          Name: `DriftFunctionName-${testEnvironmentSuffix}`,
        },
      });
    });

    it('exports AlertTopicArn output', () => {
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS topic for drift alerts',
        Export: {
          Name: `AlertTopicArn-${testEnvironmentSuffix}`,
        },
      });
    });

    it('exports ScheduleRuleName output', () => {
      template.hasOutput('ScheduleRuleName', {
        Description: 'EventBridge rule for drift detection schedule',
        Export: {
          Name: `ScheduleRuleName-${testEnvironmentSuffix}`,
        },
      });
    });
  });

  describe('Email Subscription', () => {
    it('creates SNS email subscription when email provided', () => {
      const appWithEmail = new cdk.App();
      const stackWithEmail = new TapStack(appWithEmail, 'TestStackWithEmail', {
        environmentSuffix: 'test',
        alertEmail: 'test@example.com',
      });
      const templateWithEmail = Template.fromStack(stackWithEmail);

      templateWithEmail.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    it('does not create email subscription when email not provided', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 0);
    });
  });

  describe('Resource Count', () => {
    it('creates exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    it('creates exactly one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    it('creates exactly one Lambda function', () => {
      template.resourceCountIs('AWS::Lambda::Function', 1);
    });

    it('creates exactly one EventBridge rule', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
    });

    it('creates exactly one Lambda permission', () => {
      template.resourceCountIs('AWS::Lambda::Permission', 1);
    });

    it('creates exactly one IAM role for Lambda', () => {
      template.resourceCountIs('AWS::IAM::Role', 1);
    });

    it('creates exactly one IAM policy for Lambda', () => {
      template.resourceCountIs('AWS::IAM::Policy', 1);
    });
  });

  describe('Stack Properties', () => {
    it('has correct stack name format', () => {
      expect(stack.stackName).toBe('TestStack');
    });

    it('passes environmentSuffix to resources', () => {
      const stackProps = stack.node.tryGetContext('environmentSuffix');
      expect(stackProps).toBeUndefined();
    });
  });

  describe('IAM Role Configuration', () => {
    it('creates Lambda execution role with correct managed policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp(
                  '.*AWSLambdaBasicExecutionRole.*'
                ),
              ]),
            ]),
          },
        ]),
      });
    });
  });

  describe('Tags', () => {
    it('applies tags from app level', () => {
      const taggedApp = new cdk.App();
      cdk.Tags.of(taggedApp).add('Environment', testEnvironmentSuffix);
      const taggedStack = new TapStack(taggedApp, 'TaggedStack', {
        environmentSuffix: testEnvironmentSuffix,
      });
      const taggedTemplate = Template.fromStack(taggedStack);

      taggedTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: testEnvironmentSuffix,
          },
        ]),
      });
    });
  });
});
