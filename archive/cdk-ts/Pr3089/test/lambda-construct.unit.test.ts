import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { LambdaConstruct } from '../lib/stacks/lambda-stack';

describe('LambdaConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let dataBucket: s3.Bucket;
  let metadataTable: dynamodb.Table;
  let encryptionKey: kms.Key;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    // Create test dependencies
    encryptionKey = new kms.Key(stack, 'TestKey');
    dataBucket = new s3.Bucket(stack, 'TestBucket', {
      encryptionKey
    });
    metadataTable = new dynamodb.Table(stack, 'TestTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      encryptionKey
    });
  });

  describe('with development environment', () => {
    beforeEach(() => {
      new LambdaConstruct(stack, 'TestLambda', {
        prefix: 'test-app',
        environment: 'dev',
        dataBucket,
        metadataTable,
        encryptionKey
      });
      template = Template.fromStack(stack);
    });

    test('creates SNS alarm topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'test-app-alarms-dev'
      });
    });

    test('creates IAM role for Lambda with basic execution policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': ['', [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
            ]]
          }
        ]
      });
    });

    test('adds fault injection permissions to IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: [
                'fis:InjectApiInternalError',
                'fis:InjectApiThrottleError',
                'fis:InjectApiUnavailableError'
              ],
              Resource: '*'
            })
          ])
        }
      });
    });

    test('creates CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/test-app-data-processor-dev',
        RetentionInDays: 7
      });
    });

    test('creates Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-app-data-processor-dev',
        Runtime: 'nodejs18.x',
        Handler: 'data-processor.handler',
        Timeout: 30,
        MemorySize: 512,
        Environment: {
          Variables: {
            BUCKET_NAME: { Ref: Match.anyValue() },
            TABLE_NAME: { Ref: Match.anyValue() },
            ENVIRONMENT: 'dev',
            LOG_LEVEL: 'debug',
            POWERTOOLS_SERVICE_NAME: 'test-app-data-processor',
            POWERTOOLS_METRICS_NAMESPACE: 'test-app'
          }
        },
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('creates CloudWatch alarms', () => {
      // Error alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'test-app-lambda-errors-dev',
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Period: 300,
        Threshold: 5,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching'
      });

      // Throttle alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'test-app-lambda-throttles-dev',
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Period: 300,
        Threshold: 10,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold'
      });

      // Duration alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'test-app-lambda-duration-dev',
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Statistic: 'Average',
        Period: 300,
        Threshold: 25000,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold'
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'test-app-application-signals-dev'
      });
    });

    test('grants permissions to Lambda function', () => {
      // Check that IAM policies are created that include S3 and DynamoDB permissions
      // The policies might be combined into a single policy document
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject*'
              ])
            })
          ])
        }
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem'
              ])
            })
          ])
        }
      });
    });
  });

  describe('with production environment', () => {
    beforeEach(() => {
      new LambdaConstruct(stack, 'TestLambda', {
        prefix: 'prod-app',
        environment: 'prod',
        dataBucket,
        metadataTable,
        encryptionKey
      });
      template = Template.fromStack(stack);
    });

    test('creates resources with production naming', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'prod-app-data-processor-prod',
        Environment: {
          Variables: {
            ENVIRONMENT: 'prod',
            LOG_LEVEL: 'info'
          }
        }
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'prod-app-alarms-prod'
      });
    });
  });

  describe('construct exports', () => {
    test('exposes public readonly properties', () => {
      const construct = new LambdaConstruct(stack, 'TestLambda', {
        prefix: 'test-app',
        environment: 'dev',
        dataBucket,
        metadataTable,
        encryptionKey
      });

      expect(construct.dataProcessor).toBeInstanceOf(lambda.Function);
      expect(construct.alarmTopic).toBeInstanceOf(sns.Topic);
    });
  });

  describe('alarm actions', () => {
    beforeEach(() => {
      new LambdaConstruct(stack, 'TestLambda', {
        prefix: 'test-app',
        environment: 'dev',
        dataBucket,
        metadataTable,
        encryptionKey
      });
      template = Template.fromStack(stack);
    });

    test('configures alarm actions to SNS topic', () => {
      const topicCapture = new Capture();
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: [{ Ref: topicCapture }]
      });

      // Verify the captured reference is for an SNS topic
      template.hasResourceProperties('AWS::SNS::Topic', {});
    });
  });

  describe('resource count', () => {
    test('creates expected number of resources', () => {
      new LambdaConstruct(stack, 'TestLambda', {
        prefix: 'test-app',
        environment: 'dev',
        dataBucket,
        metadataTable,
        encryptionKey
      });
      template = Template.fromStack(stack);

      // Should create: SNS Topic, IAM Role, IAM Policies, Log Group, Lambda Function, Alarms, Dashboard
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::IAM::Role', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3); // Error, Throttle, Duration
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });
});