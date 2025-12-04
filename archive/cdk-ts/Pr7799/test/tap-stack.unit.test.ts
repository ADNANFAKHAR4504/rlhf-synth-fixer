import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack, config } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack - Big Data Pipeline', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('S3 Buckets', () => {
    test('creates three required S3 buckets (raw, processed, failed)', () => {
      template.resourceCountIs('AWS::S3::Bucket', 5); // raw, processed, failed, scripts, athena-results
    });

    test('raw data bucket has correct name and KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `fin-s3-raw-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('processed data bucket has correct name and KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `fin-s3-processed-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('failed records bucket has correct name and KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `fin-s3-failed-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('all buckets block public access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: Record<string, unknown>) => {
        const props = bucket['Properties'] as Record<string, unknown>;
        expect(props['PublicAccessBlockConfiguration']).toMatchObject({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('S3 buckets have lifecycle policies for Intelligent Tiering', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'INTELLIGENT_TIERING',
                  TransitionInDays: config.lifecycleDays.intelligentTiering,
                }),
              ]),
            }),
          ]),
        },
      });
    });

    test('S3 buckets have lifecycle policies for Glacier after 90 days', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: config.lifecycleDays.glacier,
                }),
              ]),
            }),
          ]),
        },
      });
    });

    test('raw data bucket has EventBridge notifications enabled', () => {
      // EventBridge notifications are enabled via a custom resource in CDK
      // Verify the custom resource exists for S3 notifications
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          EventBridgeConfiguration: {},
        },
      });
    });
  });

  describe('Glue Database and Table', () => {
    test('creates Glue database with correct name', () => {
      template.hasResourceProperties('AWS::Glue::Database', {
        DatabaseInput: {
          Name: `fin_glue_db_${environmentSuffix}`,
          Description: 'Financial transaction data lake database',
        },
      });
    });

    test('creates Glue table with all required columns', () => {
      template.hasResourceProperties('AWS::Glue::Table', {
        TableInput: {
          Name: `fin_glue_transactions_${environmentSuffix}`,
          StorageDescriptor: {
            Columns: Match.arrayWith([
              { Name: 'transaction_id', Type: 'string' },
              { Name: 'customer_id', Type: 'string' },
              { Name: 'amount', Type: 'decimal(10,2)' },
              { Name: 'timestamp', Type: 'timestamp' },
              { Name: 'merchant_id', Type: 'string' },
              { Name: 'transaction_type', Type: 'string' },
              { Name: 'status', Type: 'string' },
            ]),
            InputFormat:
              'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
            OutputFormat:
              'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
          },
        },
      });
    });

    test('Glue table has partition keys for date and transaction_type', () => {
      template.hasResourceProperties('AWS::Glue::Table', {
        TableInput: {
          PartitionKeys: Match.arrayWith([
            { Name: 'date', Type: 'string' },
            { Name: 'transaction_type_partition', Type: 'string' },
          ]),
        },
      });
    });

    test('Glue table is configured as EXTERNAL_TABLE', () => {
      template.hasResourceProperties('AWS::Glue::Table', {
        TableInput: {
          TableType: 'EXTERNAL_TABLE',
        },
      });
    });
  });

  describe('Glue ETL Job', () => {
    test('creates Glue ETL job with correct name', () => {
      template.hasResourceProperties('AWS::Glue::Job', {
        Name: `fin-glue-etl-job-${environmentSuffix}`,
      });
    });

    test('Glue job is configured as PySpark ETL job', () => {
      template.hasResourceProperties('AWS::Glue::Job', {
        Command: {
          Name: 'glueetl',
          PythonVersion: config.glueJobSettings.pythonVersion,
        },
      });
    });

    test('Glue job has correct worker configuration', () => {
      template.hasResourceProperties('AWS::Glue::Job', {
        WorkerType: config.glueJobSettings.workerType,
        NumberOfWorkers: config.glueJobSettings.numberOfWorkers,
      });
    });

    test('Glue job has metrics and logging enabled', () => {
      template.hasResourceProperties('AWS::Glue::Job', {
        DefaultArguments: Match.objectLike({
          '--enable-metrics': 'true',
          '--enable-continuous-cloudwatch-log': 'true',
          '--enable-spark-ui': 'true',
        }),
      });
    });

    test('Glue job has correct timeout and retry settings', () => {
      template.hasResourceProperties('AWS::Glue::Job', {
        Timeout: config.glueJobSettings.timeout,
        MaxRetries: config.glueJobSettings.maxRetries,
      });
    });
  });

  describe('Glue Crawler', () => {
    test('creates Glue crawler with correct name', () => {
      template.hasResourceProperties('AWS::Glue::Crawler', {
        Name: `fin-glue-crawler-${environmentSuffix}`,
      });
    });

    test('Glue crawler runs during off-peak hours (2-5 AM UTC)', () => {
      template.hasResourceProperties('AWS::Glue::Crawler', {
        Schedule: {
          ScheduleExpression: config.crawlerSchedule,
        },
      });
    });

    test('Glue crawler targets processed S3 bucket', () => {
      template.hasResourceProperties('AWS::Glue::Crawler', {
        Targets: {
          S3Targets: Match.arrayWith([
            Match.objectLike({
              Path: Match.objectLike({
                'Fn::Join': Match.anyValue(),
              }),
            }),
          ]),
        },
      });
    });
  });

  describe('Athena Workgroup', () => {
    test('creates Athena workgroup with correct name', () => {
      template.hasResourceProperties('AWS::Athena::WorkGroup', {
        Name: `fin-athena-workgroup-${environmentSuffix}`,
      });
    });

    test('Athena workgroup has 5GB scan limit', () => {
      template.hasResourceProperties('AWS::Athena::WorkGroup', {
        WorkGroupConfiguration: {
          BytesScannedCutoffPerQuery: config.athenaScanLimitBytes,
        },
      });
    });

    test('Athena workgroup enforces configuration', () => {
      template.hasResourceProperties('AWS::Athena::WorkGroup', {
        WorkGroupConfiguration: {
          EnforceWorkGroupConfiguration: true,
        },
      });
    });

    test('Athena workgroup publishes CloudWatch metrics', () => {
      template.hasResourceProperties('AWS::Athena::WorkGroup', {
        WorkGroupConfiguration: {
          PublishCloudWatchMetricsEnabled: true,
        },
      });
    });

    test('Athena workgroup uses KMS encryption for results', () => {
      template.hasResourceProperties('AWS::Athena::WorkGroup', {
        WorkGroupConfiguration: {
          ResultConfiguration: {
            EncryptionConfiguration: {
              EncryptionOption: 'SSE_KMS',
            },
          },
        },
      });
    });
  });

  describe('EventBridge and Lambda', () => {
    test('creates EventBridge rule for S3 triggers', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `fin-eventbridge-s3-trigger-${environmentSuffix}`,
        EventPattern: Match.objectLike({
          source: ['aws.s3'],
          'detail-type': ['Object Created'],
        }),
      });
    });

    test('creates Lambda function for Glue job trigger', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `fin-lambda-glue-trigger-${environmentSuffix}`,
        Runtime: 'python3.12',
        Handler: 'index.handler',
      });
    });

    test('Lambda function has permission to start Glue job', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'glue:StartJobRun',
            }),
          ]),
        },
      });
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('creates SQS DLQ with correct name', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `fin-sqs-dlq-${environmentSuffix}`,
      });
    });

    test('SQS DLQ has KMS encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: 'alias/aws/sqs',
      });
    });

    test('SQS DLQ has 14 day retention period', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });
  });

  describe('SNS Alert Topic', () => {
    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `fin-sns-alerts-${environmentSuffix}`,
      });
    });

    test('SNS topic has KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Dashboard and Alarms', () => {
    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `fin-cw-dashboard-${environmentSuffix}`,
      });
    });

    test('creates SLA breach alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `fin-cw-alarm-sla-breach-${environmentSuffix}`,
      });
    });

    test('creates job failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `fin-cw-alarm-job-failure-${environmentSuffix}`,
      });
    });

    test('SLA breach alarm threshold is 2 hours', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `fin-cw-alarm-sla-breach-${environmentSuffix}`,
        Threshold: config.slaThresholdHours * 60 * 60 * 1000,
      });
    });
  });

  describe('VPC and Networking', () => {
    test('creates VPC for Glue jobs', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `fin-vpc-pipeline-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('creates S3 VPC Gateway Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.anyValue(),
        }),
        VpcEndpointType: 'Gateway',
      });
    });

    test('creates Glue VPC Interface Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.anyValue(),
        }),
        VpcEndpointType: 'Interface',
      });
    });

    test('creates security group for Glue', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `fin-sg-glue-${environmentSuffix}`,
        GroupDescription: 'Security group for Glue ETL jobs',
      });
    });

    test('security group allows HTTPS egress for AWS services', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates separate IAM role for Glue ETL jobs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `fin-iam-glue-etl-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'glue.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('creates separate IAM role for Glue crawlers', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `fin-iam-glue-crawler-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'glue.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('creates separate IAM role for Athena queries', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `fin-iam-athena-query-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'athena.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('KMS Encryption', () => {
    test('creates KMS key for data encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: 'KMS key for big data pipeline encryption',
      });
    });

    test('creates KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/fin-kms-data-${environmentSuffix}`,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports raw data bucket name', () => {
      template.hasOutput('RawDataBucketName', {
        Export: {
          Name: `RawDataBucketName-${environmentSuffix}`,
        },
      });
    });

    test('exports processed data bucket name', () => {
      template.hasOutput('ProcessedDataBucketName', {
        Export: {
          Name: `ProcessedDataBucketName-${environmentSuffix}`,
        },
      });
    });

    test('exports Glue job name', () => {
      template.hasOutput('GlueJobName', {
        Export: {
          Name: `GlueJobName-${environmentSuffix}`,
        },
      });
    });

    test('exports Athena workgroup name', () => {
      template.hasOutput('AthenaWorkgroupName', {
        Export: {
          Name: `AthenaWorkgroupName-${environmentSuffix}`,
        },
      });
    });

    test('exports SNS topic ARN', () => {
      template.hasOutput('SNSTopicARN', {
        Export: {
          Name: `SNSTopicARN-${environmentSuffix}`,
        },
      });
    });

    test('exports EventBridge rule ARN', () => {
      template.hasOutput('EventBridgeRuleARN', {
        Export: {
          Name: `EventBridgeRuleARN-${environmentSuffix}`,
        },
      });
    });

    test('exports DLQ URL', () => {
      template.hasOutput('DLQueueURL', {
        Export: {
          Name: `DLQueueURL-${environmentSuffix}`,
        },
      });
    });

    test('exports CloudWatch dashboard URL', () => {
      template.hasOutput('CloudWatchDashboardURL', {
        Export: {
          Name: `CloudWatchDashboardURL-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Removal Policies', () => {
    test('S3 buckets have DESTROY removal policy for test environment', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: Record<string, unknown>) => {
        expect(bucket['DeletionPolicy']).toBe('Delete');
        expect(bucket['UpdateReplacePolicy']).toBe('Delete');
      });
    });

    test('KMS key has DESTROY removal policy for test environment', () => {
      const keys = template.findResources('AWS::KMS::Key');
      Object.values(keys).forEach((key: Record<string, unknown>) => {
        expect(key['DeletionPolicy']).toBe('Delete');
        expect(key['UpdateReplacePolicy']).toBe('Delete');
      });
    });
  });

  describe('Configuration', () => {
    test('config has correct default values', () => {
      expect(config.region).toBe('us-east-1');
      expect(config.glueJobSettings.workerType).toBe('G.1X');
      expect(config.glueJobSettings.numberOfWorkers).toBe(2);
      expect(config.glueJobSettings.timeout).toBe(120);
      expect(config.glueJobSettings.glueVersion).toBe('4.0');
      expect(config.athenaScanLimitBytes).toBe(5368709120); // 5GB
      expect(config.lifecycleDays.intelligentTiering).toBe(30);
      expect(config.lifecycleDays.glacier).toBe(90);
      expect(config.slaThresholdHours).toBe(2);
    });
  });
});

// Additional tests for branch coverage - Environment Suffix Resolution
describe('TapStack - Environment Suffix Branch Coverage', () => {
  test('uses environmentSuffix from props when provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'PropsTestStack', {
      environmentSuffix: 'fromprops',
    });
    const template = Template.fromStack(stack);

    // Verify the suffix is used in resource names
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'fin-s3-raw-fromprops',
    });
  });

  test('uses environmentSuffix from context when props not provided', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'fromcontext',
      },
    });
    const stack = new TapStack(app, 'ContextTestStack', {});
    const template = Template.fromStack(stack);

    // Verify the suffix from context is used in resource names
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'fin-s3-raw-fromcontext',
    });
  });

  test('uses default dev suffix when neither props nor context provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'DefaultTestStack');
    const template = Template.fromStack(stack);

    // Verify the default 'dev' suffix is used in resource names
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'fin-s3-raw-dev',
    });
  });
});
