import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack GPS Tracking System', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Configuration', () => {
    test('should use props.environmentSuffix when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack1', {
        environmentSuffix: 'prod',
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources use the provided environment suffix
      testTemplate.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: 'vehicle-gps-stream-prod',
      });
    });

    test('should use context environmentSuffix when props not provided', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      const testStack = new TapStack(testApp, 'TestStack2');
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources use the context environment suffix
      testTemplate.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: 'vehicle-gps-stream-staging',
      });
    });

    test('should default to "dev" when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack3');
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources use the default environment suffix
      testTemplate.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: 'vehicle-gps-stream-dev',
      });
    });
  });

  describe('S3 Bucket for GPS Data Archive', () => {
    test('should create S3 bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'archive-old-data',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
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
  });

  describe('DynamoDB Table for Vehicle Tracking', () => {
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `vehicle-tracking-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'vehicleId',
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
          {
            AttributeName: 'expectedDeliveryTime',
            AttributeType: 'N',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'vehicleId',
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
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
        GlobalSecondaryIndexes: [
          {
            IndexName: 'delivery-status-index',
            KeySchema: [
              {
                AttributeName: 'deliveryStatus',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'expectedDeliveryTime',
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
  });

  describe('Kinesis Stream for GPS Data', () => {
    test('should create Kinesis stream with correct configuration', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: `vehicle-gps-stream-${environmentSuffix}`,
        ShardCount: 2,
        RetentionPeriodHours: 168,
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create GPS processor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 1024,
        ReservedConcurrentExecutions: 100,
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
          }),
        },
      });
    });

    test('should create alert handler Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        Environment: {
          Variables: Match.objectLike({
            TOPIC_ARN: Match.anyValue(),
          }),
        },
      });
    });

    test('should create analytics processor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 120,
        MemorySize: 2048,
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            BUCKET_NAME: Match.anyValue(),
          }),
        },
      });
    });
  });

  describe('Kinesis Event Source Mapping', () => {
    test('should create event source mapping for GPS processor Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        EventSourceArn: Match.anyValue(),
        FunctionName: Match.anyValue(),
        StartingPosition: 'TRIM_HORIZON',
        BatchSize: 100,
        MaximumBatchingWindowInSeconds: 5,
        ParallelizationFactor: 10,
      });
    });
  });

  describe('SNS Topic for Alerts', () => {
    test('should create SNS topic for delivery delay alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `delivery-delay-alerts-${environmentSuffix}`,
        DisplayName: 'Delivery Delay Notifications',
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create EventBridge rule for delivery delays', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `delivery-delay-rule-${environmentSuffix}`,
        EventPattern: {
          source: ['logistics.gps.tracking'],
          'detail-type': ['DeliveryDelayDetected'],
        },
      });
    });
  });

  describe('Kinesis Firehose Delivery Stream', () => {
    test('should create Firehose delivery stream for S3 archival', () => {
      template.hasResourceProperties('AWS::KinesisFirehose::DeliveryStream', {
        DeliveryStreamName: `gps-archive-stream-${environmentSuffix}`,
        DeliveryStreamType: 'KinesisStreamAsSource',
        S3DestinationConfiguration: {
          Prefix:
            'raw-gps-data/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
          ErrorOutputPrefix: 'error/',
          BufferingHints: {
            IntervalInSeconds: 60,
            SizeInMBs: 128,
          },
          CompressionFormat: 'GZIP',
        },
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `logistics-gps-tracking-${environmentSuffix}`,
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create stream throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'WriteProvisionedThroughputExceeded',
        Namespace: 'AWS/Kinesis',
        Statistic: 'Sum',
        Threshold: 10,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Threshold: 10,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('QuickSight IAM Role', () => {
    test('should create QuickSight data source role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'quicksight.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create appropriate IAM roles for Lambda functions', () => {
      // GPS Processor Lambda Role
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: Match.anyValue(),
      });

      // Firehose Role
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'firehose.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('should create EventBridge permissions for GPS processor Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: 'events:PutEvents',
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('should create Kinesis permissions for Firehose role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'firehose.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        Policies: [
          {
            PolicyName: 'KinesisReadPolicy',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'kinesis:DescribeStream',
                    'kinesis:GetShardIterator',
                    'kinesis:GetRecords',
                    'kinesis:ListShards',
                  ],
                  Resource: Match.anyValue(),
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should create CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/gps-processing-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required stack outputs', () => {
      template.hasOutput('StreamName', {
        Description: 'Kinesis Stream Name for GPS Data',
      });

      template.hasOutput('TableName', {
        Description: 'DynamoDB Table Name',
      });

      template.hasOutput('ArchiveBucketName', {
        Description: 'S3 Bucket for Archive',
      });

      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL',
      });

      template.hasOutput('AlertTopicArn', {
        Description: 'SNS Topic ARN for Alerts',
      });

      template.hasOutput('AnalyticsDataPath', {
        Description: 'S3 path for analytics data (for QuickSight setup)',
      });

      template.hasOutput('QuickSightRoleArn', {
        Description: 'IAM Role for QuickSight (use for manual QuickSight setup)',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 7 outputs', () => {
      const outputs = template.toJSON().Outputs;
      expect(Object.keys(outputs)).toHaveLength(7);
    });

    test('should create expected number of key resources', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);

      // Count key resource types
      expect(resourceTypes.filter(t => t === 'AWS::S3::Bucket')).toHaveLength(
        1
      );
      expect(
        resourceTypes.filter(t => t === 'AWS::DynamoDB::Table')
      ).toHaveLength(1);
      expect(
        resourceTypes.filter(t => t === 'AWS::Kinesis::Stream')
      ).toHaveLength(1);
      expect(
        resourceTypes.filter(t => t === 'AWS::Lambda::Function')
      ).toHaveLength(3); // GPS Processor, Alert Handler, Analytics
      expect(resourceTypes.filter(t => t === 'AWS::SNS::Topic')).toHaveLength(
        1
      );
      expect(resourceTypes.filter(t => t === 'AWS::Events::Rule')).toHaveLength(
        2
      );
      expect(
        resourceTypes.filter(t => t === 'AWS::CloudWatch::Dashboard')
      ).toHaveLength(1);
      expect(
        resourceTypes.filter(t => t === 'AWS::CloudWatch::Alarm')
      ).toHaveLength(2);
    });
  });
});
