import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Configuration', () => {
    test('should use environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'test-env',
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources are created with the test environment suffix
      testTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              'iot-sensor-data-',
              {
                Ref: 'AWS::AccountId',
              },
              '-',
              {
                Ref: 'AWS::Region',
              },
              '-dev-test-env',
            ],
          ],
        },
      });
    });

    test('should use environment suffix from context when props not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context-env');
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources are created with the context environment suffix
      testTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              'iot-sensor-data-',
              {
                Ref: 'AWS::AccountId',
              },
              '-',
              {
                Ref: 'AWS::Region',
              },
              '-dev-context-env',
            ],
          ],
        },
      });
    });

    test('should use default dev suffix when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources are created with the default dev suffix
      testTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              'iot-sensor-data-',
              {
                Ref: 'AWS::AccountId',
              },
              '-',
              {
                Ref: 'AWS::Region',
              },
              '-dev-dev',
            ],
          ],
        },
      });
    });

    test('should prioritize props over context when both provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context-env');
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'props-env',
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources are created with the props environment suffix
      testTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              'iot-sensor-data-',
              {
                Ref: 'AWS::AccountId',
              },
              '-',
              {
                Ref: 'AWS::Region',
              },
              '-dev-props-env',
            ],
          ],
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              'iot-sensor-data-',
              {
                Ref: 'AWS::AccountId',
              },
              '-',
              {
                Ref: 'AWS::Region',
              },
              `-dev-${environmentSuffix}`,
            ],
          ],
        },
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle rules for cost optimization', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(buckets)[0];
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
      expect(
        bucket.Properties.LifecycleConfiguration.Rules.some(
          (rule: any) => rule.Id === 'transition-to-ia'
        )
      ).toBe(true);
      expect(
        bucket.Properties.LifecycleConfiguration.Rules.some(
          (rule: any) => rule.Id === 'delete-old-versions'
        )
      ).toBe(true);
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-device-state-dev-${environmentSuffix}`,
        KeySchema: [
          {
            AttributeName: 'deviceId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'deviceId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
          {
            AttributeName: 'status',
            AttributeType: 'S',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should create Global Secondary Index', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'status-timestamp-index',
            KeySchema: [
              {
                AttributeName: 'status',
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
  });

  describe('DynamoDB Metrics Table', () => {
    test('should create DynamoDB metrics table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-sensor-metrics-dev-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should create DynamoDB metrics table with correct key schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-sensor-metrics-dev-${environmentSuffix}`,
        KeySchema: [
          {
            AttributeName: 'deviceId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'deviceId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
          {
            AttributeName: 'metricType',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('should create GSI for timestamp queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-sensor-metrics-dev-${environmentSuffix}`,
        GlobalSecondaryIndexes: [
          {
            IndexName: 'timestamp-index',
            KeySchema: [
              {
                AttributeName: 'metricType',
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
  });

  describe('Kinesis Data Stream', () => {
    test('should create Kinesis Data Stream with correct properties', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        // Name includes timestamp suffix, so we skip name validation
        ShardCount: 2,
        RetentionPeriodHours: 24,
        StreamModeDetails: {
          StreamMode: 'PROVISIONED',
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-stream-processor-dev-${environmentSuffix}`,
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 512,
        ReservedConcurrentExecutions: 10,
        Environment: {
          Variables: {
            DYNAMODB_TABLE: {
              Ref: 'DeviceStateTable0D20B4A5',
            },
            METRICS_TABLE: {
              Ref: 'SensorMetricsTableA94D079E',
            },
          },
        },
      });
    });

    test('should have Kinesis event source', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        EventSourceArn: {
          'Fn::GetAtt': ['SensorDataStreamE291174A', 'Arn'],
        },
        FunctionName: {
          Ref: 'StreamProcessorA985C501',
        },
        StartingPosition: 'LATEST',
        BatchSize: 100,
        MaximumBatchingWindowInSeconds: 5,
        ParallelizationFactor: 2,
        MaximumRetryAttempts: 3,
      });
    });
  });

  describe('Kinesis Data Firehose', () => {
    test('should create Firehose delivery stream', () => {
      template.hasResourceProperties('AWS::KinesisFirehose::DeliveryStream', {
        // Name includes timestamp suffix, so we skip name validation
        DeliveryStreamType: 'KinesisStreamAsSource',
        ExtendedS3DestinationConfiguration: {
          BucketARN: {
            'Fn::GetAtt': ['IotDataBucket90DE0005', 'Arn'],
          },
          Prefix:
            'raw-data/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
          ErrorOutputPrefix: 'error-data/',
          BufferingHints: {
            IntervalInSeconds: 300,
            SizeInMBs: 128,
          },
          CompressionFormat: 'UNCOMPRESSED',
          DataFormatConversionConfiguration: {
            Enabled: false,
          },
        },
      });
    });
  });

  describe('IoT Core', () => {
    test('should create IoT Topic Rule', () => {
      template.hasResourceProperties('AWS::IoT::TopicRule', {
        RuleName: `route_sensor_data_to_kinesis_dev_${environmentSuffix}`,
        TopicRulePayload: {
          Sql: "SELECT *, topic(2) as deviceId, timestamp() as timestamp FROM 'device/+/telemetry'",
          Description: 'Route sensor telemetry data to Kinesis Data Stream',
          Actions: [
            {
              Kinesis: {
                StreamName: {
                  Ref: 'SensorDataStreamE291174A',
                },
                PartitionKey: '${deviceId}',
              },
            },
          ],
          RuleDisabled: false,
        },
      });
    });

    test('should create IoT Policy', () => {
      template.hasResourceProperties('AWS::IoT::Policy', {
        PolicyName: `IoTDeviceAccessPolicy-dev-${environmentSuffix}`,
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'iot:Connect',
                'iot:Publish',
                'iot:Subscribe',
                'iot:Receive',
              ],
            },
            {
              Effect: 'Allow',
              Action: ['iot:GetThingShadow', 'iot:UpdateThingShadow'],
            },
          ],
        },
      });
    });
  });

  describe('Glue Database and Crawler', () => {
    test('should create Glue Database', () => {
      template.hasResourceProperties('AWS::Glue::Database', {
        CatalogId: {
          Ref: 'AWS::AccountId',
        },
        DatabaseInput: {
          Name: `iot_sensor_db_dev_${environmentSuffix}`,
          Description: 'IoT sensor data catalog',
        },
      });
    });

    test('should create Glue Crawler', () => {
      template.hasResourceProperties('AWS::Glue::Crawler', {
        Name: `iot-sensor-data-crawler-dev-${environmentSuffix}`,
        DatabaseName: {
          Ref: 'GlueDatabase',
        },
        Schedule: {
          ScheduleExpression: 'cron(0 */6 * * ? *)',
        },
        SchemaChangePolicy: {
          UpdateBehavior: 'UPDATE_IN_DATABASE',
          DeleteBehavior: 'LOG',
        },
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS Topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `iot-pipeline-alerts-dev-${environmentSuffix}`,
        DisplayName: 'IoT Pipeline Alerts',
      });
    });

    test('should create DLQ SNS Topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `iot-pipeline-dlq-dev-${environmentSuffix}`,
        DisplayName: 'IoT Pipeline Dead Letter Queue',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create Kinesis high throughput alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iot-kinesis-high-throughput-dev-${environmentSuffix}`,
        AlarmDescription: 'Alert when Kinesis receives > 10000 records/minute',
        Threshold: 10000,
        EvaluationPeriods: 2,
      });
    });

    test('should create Lambda error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iot-lambda-high-error-rate-dev-${environmentSuffix}`,
        AlarmDescription: 'Alert when Lambda error rate > 1%',
        Threshold: 0.01,
        EvaluationPeriods: 2,
      });
    });

    test('should create DynamoDB throttling alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iot-dynamodb-throttling-dev-${environmentSuffix}`,
        AlarmDescription: 'Alert when DynamoDB experiences throttling',
        Threshold: 5,
        EvaluationPeriods: 2,
      });
    });

    test('should create Firehose data freshness alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iot-firehose-data-staleness-dev-${environmentSuffix}`,
        AlarmDescription:
          'Alert when Firehose data delivery is delayed > 10 minutes',
        Threshold: 600,
        EvaluationPeriods: 2,
      });
    });

    test('should create Lambda DLQ messages alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iot-lambda-dlq-messages-dev-${environmentSuffix}`,
        AlarmDescription: 'Alert when Lambda sends messages to DLQ',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should create DynamoDB metrics table throttling alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iot-dynamodb-metrics-throttling-dev-${environmentSuffix}`,
        AlarmDescription:
          'Alert when DynamoDB metrics table experiences throttling',
        Threshold: 5,
        EvaluationPeriods: 2,
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `iot-pipeline-monitoring-dev-${environmentSuffix}`,
      });
    });
  });

  describe('Outputs', () => {
    test('should create IoT Endpoint output', () => {
      template.hasOutput('IoTEndpoint', {
        Description: 'AWS IoT Core Endpoint',
      });
    });

    test('should create S3 Bucket Name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket for sensor data',
      });
    });

    test('should create Kinesis Stream Name output', () => {
      template.hasOutput('KinesisStreamName', {
        Description: 'Kinesis Data Stream name',
      });
    });

    test('should create DynamoDB Table Name output', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB table for device state',
      });
    });

    test('should create Sensor Metrics Table output', () => {
      template.hasOutput('SensorMetricsTableName', {
        Description: 'DynamoDB table for sensor metrics',
      });
    });

    test('should create Alert Topic ARN output', () => {
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS Topic for alerts',
      });
    });

    test('should create Athena Query Example output', () => {
      template.hasOutput('AthenaQueryExample', {
        Description: 'Example Athena query',
      });
    });

    test('should create DLQ Topic ARN output', () => {
      template.hasOutput('DLQTopicArn', {
        Description: 'SNS Topic for Lambda DLQ',
      });
    });

    test('should create Glue Database Name output', () => {
      template.hasOutput('GlueDatabaseName', {
        Description: 'Glue Database for data catalog',
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of resources', () => {
      // Count major resource types
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 2); // Device state + Metrics tables
      template.resourceCountIs('AWS::Kinesis::Stream', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::KinesisFirehose::DeliveryStream', 1);
      template.resourceCountIs('AWS::IoT::TopicRule', 1);
      template.resourceCountIs('AWS::IoT::Policy', 1);
      template.resourceCountIs('AWS::Glue::Database', 1);
      template.resourceCountIs('AWS::Glue::Crawler', 1);
      template.resourceCountIs('AWS::SNS::Topic', 2); // Alert + DLQ topics
      template.resourceCountIs('AWS::CloudWatch::Alarm', 6); // Added 2 new alarms
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      // Note: Lambda automatically creates its log group, Firehose has explicit log group and stream
    });
  });
});
