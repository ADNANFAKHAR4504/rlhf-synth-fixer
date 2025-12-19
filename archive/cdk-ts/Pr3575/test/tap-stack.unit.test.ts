import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let template: Template;
  let stack: TapStack;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should use environmentSuffix from props', () => {
      const app = new cdk.App();
      const testStack = new TapStack(app, 'TestStackWithProps', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasOutput('UploadBucketName', {
        Export: {
          Name: 'prod-UploadBucketName',
        },
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const testStack = new TapStack(app, 'TestStackWithContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasOutput('UploadBucketName', {
        Export: {
          Name: 'staging-UploadBucketName',
        },
      });
    });

    test('should default to dev when no environmentSuffix provided', () => {
      const app = new cdk.App();
      const testStack = new TapStack(app, 'TestStackWithDefaults', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasOutput('UploadBucketName', {
        Export: {
          Name: 'dev-UploadBucketName',
        },
      });
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description:
          'KMS key for encrypting content in the media processing pipeline',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create upload bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create two S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });
  });

  describe('DynamoDB Table', () => {
    test('should create processing table with correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'assetId',
            KeyType: 'HASH',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('should create GSI for jobId', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'JobIdIndex',
            KeySchema: [
              {
                AttributeName: 'jobId',
                KeyType: 'HASH',
              },
            ],
          },
        ],
      });
    });
  });

  describe('SQS Queues', () => {
    test('should create dead letter queue with KMS encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('should create job queue with DLQ configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        RedrivePolicy: {
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        },
        VisibilityTimeout: 300,
      });
    });

    test('should create three SQS queues', () => {
      template.resourceCountIs('AWS::SQS::Queue', 3);
    });
  });

  describe('Lambda Functions', () => {
    test('should create upload handler function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should create processor function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 1024,
      });
    });

    test('should create status updater function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('should create three Lambda functions', () => {
      // CDK creates additional Lambda functions for custom resources (e.g., autoDeleteObjects)
      // So we check for at least 3 application functions
      const functions = template.findResources('AWS::Lambda::Function');
      const functionCount = Object.keys(functions).length;
      expect(functionCount).toBeGreaterThanOrEqual(3);
    });

    test('should configure environment variables for upload handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            JOB_QUEUE_URL: Match.anyValue(),
            PROCESSING_TABLE: Match.anyValue(),
          },
        },
      });
    });

    test('should configure environment variables for processor', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            UPLOAD_BUCKET: Match.anyValue(),
            OUTPUT_BUCKET: Match.anyValue(),
            PROCESSING_TABLE: Match.anyValue(),
            MEDIACONVERT_ROLE_ARN: Match.anyValue(),
          },
        },
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create upload handler role with basic execution policy', () => {
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
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AWSLambdaBasicExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should create processor role with MediaConvert permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: [
                'mediaconvert:CreateJob',
                'mediaconvert:GetJob',
                'mediaconvert:DescribeEndpoints',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
          ]),
        },
      });
    });

    test('should create MediaConvert role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'mediaconvert.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should grant PassRole permission to processor', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'iam:PassRole',
              Condition: {
                StringLike: {
                  'iam:PassedToService': 'mediaconvert.amazonaws.com',
                },
              },
              Effect: 'Allow',
              Resource: '*',
            },
          ]),
        },
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create MediaConvert rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.mediaconvert'],
          'detail-type': ['MediaConvert Job State Change'],
        },
      });
    });

    test('should have SQS target for MediaConvert rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: [
          {
            Arn: Match.anyValue(),
            Id: Match.anyValue(),
          },
        ],
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create dead letter queue alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Threshold: 1,
        EvaluationPeriods: 1,
        AlarmDescription: 'Messages in dead letter queue',
      });
    });

    test('should create processor error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Threshold: 5,
        AlarmDescription: 'High error rate in processor lambda',
      });
    });

    test('should create processor throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Throttles',
        Threshold: 5,
        AlarmDescription: 'High throttle rate in processor lambda',
      });
    });

    test('should create status updater error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'High error rate in status updater lambda',
      });
    });

    test('should create upload handler error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'High error rate in upload handler lambda',
      });
    });

    test('should create job queue depth alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Threshold: 100,
        AlarmDescription: 'High number of messages in job queue',
      });
    });

    test('should create status queue depth alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'High number of messages in status update queue',
      });
    });

    test('should create job queue age alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ApproximateAgeOfOldestMessage',
        Threshold: 300,
        AlarmDescription: 'Messages not processed quickly enough in job queue',
      });
    });

    test('should create status queue age alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Messages not processed quickly enough in status queue',
      });
    });

    test('should create nine CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 9);
    });
  });

  describe('S3 Event Notifications', () => {
    test('should configure S3 bucket notification', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
      });
    });
  });

  describe('Lambda Event Sources', () => {
    test('should create event source mapping for processor', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
      });
    });

    test('should create two event source mappings', () => {
      template.resourceCountIs('AWS::Lambda::EventSourceMapping', 2);
    });
  });

  describe('Stack Outputs', () => {
    test('should output upload bucket name', () => {
      template.hasOutput('UploadBucketName', {
        Export: {
          Name: 'test-UploadBucketName',
        },
      });
    });

    test('should output output bucket name', () => {
      template.hasOutput('OutputBucketName', {
        Export: {
          Name: 'test-OutputBucketName',
        },
      });
    });

    test('should output processing table name', () => {
      template.hasOutput('ProcessingTableName', {
        Export: {
          Name: 'test-ProcessingTableName',
        },
      });
    });

    test('should output job queue URL', () => {
      template.hasOutput('JobQueueUrl', {
        Export: {
          Name: 'test-JobQueueUrl',
        },
      });
    });

    test('should output status update queue URL', () => {
      template.hasOutput('StatusUpdateQueueUrl', {
        Export: {
          Name: 'test-StatusUpdateQueueUrl',
        },
      });
    });

    test('should output dead letter queue URL', () => {
      template.hasOutput('DeadLetterQueueUrl', {
        Export: {
          Name: 'test-DeadLetterQueueUrl',
        },
      });
    });
  });

  describe('Resource Encryption', () => {
    test('should have KMS encryption on all S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketKeys = Object.keys(buckets);

      bucketKeys.forEach((bucketKey) => {
        if (!bucketKey.includes('LoggingBucket')) {
          expect(buckets[bucketKey].Properties.BucketEncryption).toBeDefined();
        }
      });
    });

    test('should have KMS encryption on DynamoDB table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    test('should have KMS encryption on all SQS queues', () => {
      const queues = template.findResources('AWS::SQS::Queue');
      const queueKeys = Object.keys(queues);

      queueKeys.forEach((queueKey) => {
        expect(queues[queueKey].Properties.KmsMasterKeyId).toBeDefined();
      });
    });
  });

  describe('Resource Deletion', () => {
    test('should have DESTROY removal policy on KMS key', () => {
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should have DESTROY removal policy on DynamoDB table', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Multi-AZ Configuration', () => {
    test('should rely on regional services for multi-AZ support', () => {
      const resources = template.toJSON().Resources;
      const vpcResources = Object.keys(resources).filter(
        (key) => resources[key].Type === 'AWS::EC2::VPC'
      );
      expect(vpcResources.length).toBe(0);
    });
  });
});
