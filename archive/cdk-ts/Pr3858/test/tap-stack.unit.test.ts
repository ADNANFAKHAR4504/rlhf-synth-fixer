import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `document-jobs-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          { AttributeName: 'jobId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
          { AttributeName: 'status', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'jobId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should create Global Secondary Index for status queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'StatusIndex',
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `document-conversion-notifications-${environmentSuffix}`,
        DisplayName: 'Document Conversion Notifications',
      });
    });
  });

  describe('SQS Queues', () => {
    test('should create main processing queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `document-processing-queue-${environmentSuffix}`,
        VisibilityTimeout: 1200,
      });
    });

    test('should create dead letter queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `document-processing-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
      });
    });

    test('should configure dead letter queue on main queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `document-processing-queue-${environmentSuffix}`,
        RedrivePolicy: {
          maxReceiveCount: 3,
          deadLetterTargetArn: Match.anyValue(),
        },
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create document upload bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });

      // Check that bucket name contains the expected prefix
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.keys(buckets);
      expect(bucketNames.some((key) => key.includes('DocumentBucket'))).toBe(
        true
      );
    });

    test('should create output bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });

      // Check that output bucket exists
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.keys(buckets);
      expect(bucketNames.some((key) => key.includes('OutputBucket'))).toBe(
        true
      );
    });

    test('should block public access on all buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create conversion function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `document-converter-${environmentSuffix}`,
        Runtime: 'python3.10',
        Handler: 'index.handler',
        Timeout: 900,
        MemorySize: 3008,
        ReservedConcurrentExecutions: 100,
      });
    });

    test('should create init job function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `init-job-${environmentSuffix}`,
        Runtime: 'python3.10',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('should create validation function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `document-validator-${environmentSuffix}`,
        Runtime: 'python3.10',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('should create notification function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `notify-completion-${environmentSuffix}`,
        Runtime: 'python3.10',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('should create orchestrator function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `document-orchestrator-${environmentSuffix}`,
        Runtime: 'python3.10',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('conversion function should have correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `document-converter-${environmentSuffix}`,
        Environment: {
          Variables: {
            JOB_TABLE_NAME: Match.anyValue(),
            OUTPUT_BUCKET: Match.anyValue(),
            SNS_TOPIC_ARN: Match.anyValue(),
          },
        },
      });
    });
  });

  describe('Step Functions State Machine', () => {
    test('should create state machine with correct configuration', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `document-conversion-${environmentSuffix}`,
      });
    });

    test('should have logging configured', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        LoggingConfiguration: {
          Level: 'ALL',
          Destinations: Match.anyValue(),
        },
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });

    test('should create log group for state machine', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/stepfunctions/document-conversion-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  describe('S3 Event Notifications', () => {
    test('should configure S3 event notifications for document uploads', () => {
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [
            Match.objectLike({
              Events: ['s3:ObjectCreated:*'],
              Filter: {
                Key: {
                  FilterRules: [{ Name: 'suffix', Value: '.doc' }],
                },
              },
            }),
            Match.objectLike({
              Events: ['s3:ObjectCreated:*'],
              Filter: {
                Key: {
                  FilterRules: [{ Name: 'suffix', Value: '.docx' }],
                },
              },
            }),
            Match.objectLike({
              Events: ['s3:ObjectCreated:*'],
              Filter: {
                Key: {
                  FilterRules: [{ Name: 'suffix', Value: '.txt' }],
                },
              },
            }),
            Match.objectLike({
              Events: ['s3:ObjectCreated:*'],
              Filter: {
                Key: {
                  FilterRules: [{ Name: 'suffix', Value: '.rtf' }],
                },
              },
            }),
          ],
        },
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `document-conversion-${environmentSuffix}`,
      });
    });

    test('should create alarm for conversion errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `document-conversion-errors-${environmentSuffix}`,
        Threshold: 10,
        EvaluationPeriods: 1,
      });
    });

    test('should create alarm for DLQ messages', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `document-dlq-messages-${environmentSuffix}`,
        Threshold: 5,
        EvaluationPeriods: 1,
      });
    });
  });

  describe('IAM Permissions', () => {
    test('should grant DynamoDB permissions to Lambda functions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant S3 read permissions to validation function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:GetObject*']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant SNS publish permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output document bucket name', () => {
      template.hasOutput('DocumentBucketName', {
        Description: 'S3 bucket for document uploads',
      });
    });

    test('should output output bucket name', () => {
      template.hasOutput('OutputBucketName', {
        Description: 'S3 bucket for converted documents',
      });
    });

    test('should output state machine ARN', () => {
      template.hasOutput('StateMachineArn', {
        Description: 'Step Functions state machine ARN',
      });
    });

    test('should output job table name', () => {
      template.hasOutput('JobTableName', {
        Description: 'DynamoDB table for job tracking',
      });
    });

    test('should output notification topic ARN', () => {
      template.hasOutput('NotificationTopicArn', {
        Description: 'SNS topic for notifications',
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of Lambda functions', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: Match.stringLikeRegexp(`.*${environmentSuffix}`),
        },
      });
      // 5 main functions: converter, init-job, validator, notifier, orchestrator
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(5);
    });

    test('should create two S3 buckets', () => {
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      const mainBuckets = Object.keys(s3Buckets).filter(
        (key) => key.includes('DocumentBucket') || key.includes('OutputBucket')
      );
      expect(mainBuckets.length).toBe(2);
    });

    test('should create two SQS queues', () => {
      const sqsQueues = template.findResources('AWS::SQS::Queue', {
        Properties: {
          QueueName: Match.stringLikeRegexp(`.*${environmentSuffix}`),
        },
      });
      expect(Object.keys(sqsQueues).length).toBe(2);
    });
  });
});
