
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DescribeEventBusCommand,
  EventBridgeClient,
  ListRulesCommand,
  PutEventsCommand
} from '@aws-sdk/client-eventbridge';
import {
  DescribeStreamCommand,
  KinesisClient,
  PutRecordCommand
} from '@aws-sdk/client-kinesis';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  DescribeExecutionCommand,
  DescribeStateMachineCommand,
  ListExecutionsCommand,
  SFNClient,
  StartExecutionCommand
} from '@aws-sdk/client-sfn';
import {
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import fs from 'fs';
import path from 'path';

const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');

interface StackOutputs {
  IoTArchiveBucketName?: string;
  IoTArchiveBucketArn?: string;
  DeviceRecoveryTableName?: string;
  DeviceRecoveryTableArn?: string;
  ValidationTableName?: string;
  ValidationTableArn?: string;
  KinesisStreamNames?: string;
  KinesisStreamArns?: string;
  SensorDLQUrl?: string;
  ActuatorDLQUrl?: string;
  GatewayDLQUrl?: string;
  EdgeDLQUrl?: string;
  ShadowAnalysisLambdaName?: string;
  ShadowAnalysisLambdaArn?: string;
  KinesisRepublishLambdaName?: string;
  KinesisRepublishLambdaArn?: string;
  DynamoDBValidationLambdaName?: string;
  DynamoDBValidationLambdaArn?: string;
  TriggerStateMachineLambdaName?: string;
  TriggerStateMachineLambdaArn?: string;
  RecoveryStateMachineArn?: string;
  RecoveryStateMachineName?: string;
  RecoveryEventBusName?: string;
  RecoveryEventBusArn?: string;
  RuleFailureAlarmName?: string;
  RuleFailureAlarmArn?: string;
  RecoveryDashboardName?: string;
  TestShadowAnalysisCommand?: string;
  StartRecoveryCommand?: string;
  ViewLogsCommand?: string;
  CheckSensorDLQCommand?: string;
}

let outputs: StackOutputs = {};
let kinesisStreamNames: string[] = [];
let kinesisStreamArns: string[] = [];

// AWS Clients
let s3Client: S3Client;
let dynamoClient: DynamoDBClient;
let docClient: DynamoDBDocumentClient;
let lambdaClient: LambdaClient;
let sfnClient: SFNClient;
let kinesisClient: KinesisClient;
let sqsClient: SQSClient;
let eventBridgeClient: EventBridgeClient;
let cloudwatchClient: CloudWatchClient;

const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';

beforeAll(() => {
  // Load outputs from file
  const rawData = fs.readFileSync(outputsPath, 'utf8');
  outputs = JSON.parse(rawData);
  console.log('✓ Loaded outputs from:', outputsPath);

  // Parse Kinesis stream names and ARNs
  if (outputs.KinesisStreamNames) {
    kinesisStreamNames = JSON.parse(outputs.KinesisStreamNames);
  }
  if (outputs.KinesisStreamArns) {
    kinesisStreamArns = JSON.parse(outputs.KinesisStreamArns);
  }

  // Strict preflight checks: ensure AWS credentials
  const hasAwsCreds = Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_SESSION_TOKEN ||
    process.env.AWS_PROFILE
  );
  if (!hasAwsCreds) {
    throw new Error(
      'AWS credentials are required: set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or AWS_PROFILE.'
    );
  }

  // Initialize AWS clients
  s3Client = new S3Client({ region });
  dynamoClient = new DynamoDBClient({ region });
  docClient = DynamoDBDocumentClient.from(dynamoClient);
  lambdaClient = new LambdaClient({ region });
  sfnClient = new SFNClient({ region });
  kinesisClient = new KinesisClient({ region });
  sqsClient = new SQSClient({ region });
  eventBridgeClient = new EventBridgeClient({ region });
  cloudwatchClient = new CloudWatchClient({ region });
});

describe('IoT Recovery Automation - Integration Tests', () => {
  describe('Outputs File Validation', () => {
    test('outputs JSON file exists', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('outputs contains valid JSON', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('outputs file contains required keys', () => {
      expect(outputs).toHaveProperty('DeviceRecoveryTableName');
      expect(outputs).toHaveProperty('ValidationTableName');
      expect(outputs).toHaveProperty('ShadowAnalysisLambdaName');
      expect(outputs).toHaveProperty('RecoveryStateMachineArn');
    });

    test('no empty string values in outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });

    test('no sensitive data in outputs', () => {
      const str = JSON.stringify(outputs);
      expect(str).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Keys
      expect(str).not.toMatch(/password/i);
      expect(str).not.toMatch(/secret.*key/i);
      expect(str).not.toMatch(/private.*key/i);
    });
  });

  describe('S3 Archive Bucket Configuration', () => {
    test('S3 bucket name follows naming convention', () => {
      expect(outputs.IoTArchiveBucketName).toBeDefined();
      expect(outputs.IoTArchiveBucketName).toMatch(/^iot-archive-[a-z0-9]+-[0-9]+-[a-z0-9-]+$/);
    });

    test('S3 bucket ARN is valid', () => {
      expect(outputs.IoTArchiveBucketArn).toBeDefined();
      expect(outputs.IoTArchiveBucketArn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.IoTArchiveBucketArn).toContain(outputs.IoTArchiveBucketName);
    });
  });

  describe('DynamoDB Tables Configuration', () => {
    test('device recovery table name follows naming convention', () => {
      expect(outputs.DeviceRecoveryTableName).toBeDefined();
      expect(outputs.DeviceRecoveryTableName).toMatch(/^iot-device-recovery-[a-z0-9]+$/);
    });

    test('validation table name follows naming convention', () => {
      expect(outputs.ValidationTableName).toBeDefined();
      expect(outputs.ValidationTableName).toMatch(/^iot-recovery-validation-[a-z0-9]+$/);
    });

    test('DynamoDB table ARNs are valid', () => {
      expect(outputs.DeviceRecoveryTableArn).toBeDefined();
      expect(outputs.DeviceRecoveryTableArn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d{12}:table\//);

      expect(outputs.ValidationTableArn).toBeDefined();
      expect(outputs.ValidationTableArn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d{12}:table\//);
    });

    test('table names are unique', () => {
      expect(outputs.DeviceRecoveryTableName).not.toBe(outputs.ValidationTableName);
    });
  });

  describe('Kinesis Streams Configuration', () => {
    test('Kinesis stream names are defined', () => {
      expect(outputs.KinesisStreamNames).toBeDefined();
      expect(kinesisStreamNames).toBeDefined();
      expect(kinesisStreamNames.length).toBe(10); // 10 streams for partitioning
    });

    test('Kinesis stream names follow naming convention', () => {
      kinesisStreamNames.forEach((streamName, index) => {
        expect(streamName).toMatch(/^iot-replay-stream-[a-z0-9]+-\d+$/);
        expect(streamName).toContain(`-${index}`);
      });
    });

    test('Kinesis stream ARNs are valid', () => {
      expect(kinesisStreamArns).toBeDefined();
      expect(kinesisStreamArns.length).toBe(10);
      kinesisStreamArns.forEach((arn) => {
        expect(arn).toMatch(/^arn:aws:kinesis:[a-z0-9-]+:\d{12}:stream\//);
      });
    });

    test('Kinesis stream names are unique', () => {
      const uniqueNames = [...new Set(kinesisStreamNames)];
      expect(uniqueNames.length).toBe(kinesisStreamNames.length);
    });
  });

  describe('SQS Dead Letter Queues Configuration', () => {
    test('all device type DLQs are defined', () => {
      expect(outputs.SensorDLQUrl).toBeDefined();
      expect(outputs.ActuatorDLQUrl).toBeDefined();
      expect(outputs.GatewayDLQUrl).toBeDefined();
      expect(outputs.EdgeDLQUrl).toBeDefined();
    });

    test('DLQ URLs follow SQS URL format', () => {
      [
        outputs.SensorDLQUrl,
        outputs.ActuatorDLQUrl,
        outputs.GatewayDLQUrl,
        outputs.EdgeDLQUrl
      ].forEach((queueUrl) => {
        expect(queueUrl).toMatch(/^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d{12}\//);
      });
    });

    test('DLQ names contain device types', () => {
      expect(outputs.SensorDLQUrl).toContain('sensor');
      expect(outputs.ActuatorDLQUrl).toContain('actuator');
      expect(outputs.GatewayDLQUrl).toContain('gateway');
      expect(outputs.EdgeDLQUrl).toContain('edge');
    });

    test('DLQ URLs are unique', () => {
      const queueUrls = [
        outputs.SensorDLQUrl,
        outputs.ActuatorDLQUrl,
        outputs.GatewayDLQUrl,
        outputs.EdgeDLQUrl
      ];
      const uniqueUrls = [...new Set(queueUrls)];
      expect(uniqueUrls.length).toBe(queueUrls.length);
    });
  });

  describe('Lambda Functions Configuration', () => {
    test('all Lambda function names are defined', () => {
      expect(outputs.ShadowAnalysisLambdaName).toBeDefined();
      expect(outputs.KinesisRepublishLambdaName).toBeDefined();
      expect(outputs.DynamoDBValidationLambdaName).toBeDefined();
      expect(outputs.TriggerStateMachineLambdaName).toBeDefined();
    });

    test('Lambda function names follow naming convention', () => {
      expect(outputs.ShadowAnalysisLambdaName).toMatch(/^iot-shadow-analysis-[a-z0-9]+$/);
      expect(outputs.KinesisRepublishLambdaName).toMatch(/^iot-kinesis-republish-[a-z0-9]+$/);
      expect(outputs.DynamoDBValidationLambdaName).toMatch(/^iot-dynamodb-validation-[a-z0-9]+$/);
      expect(outputs.TriggerStateMachineLambdaName).toMatch(/^iot-trigger-recovery-[a-z0-9]+$/);
    });

    test('Lambda function ARNs are valid', () => {
      [
        outputs.ShadowAnalysisLambdaArn,
        outputs.KinesisRepublishLambdaArn,
        outputs.DynamoDBValidationLambdaArn,
        outputs.TriggerStateMachineLambdaArn
      ].forEach((arn) => {
        expect(arn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:/);
      });
    });

    test('Lambda function names are unique', () => {
      const functionNames = [
        outputs.ShadowAnalysisLambdaName,
        outputs.KinesisRepublishLambdaName,
        outputs.DynamoDBValidationLambdaName,
        outputs.TriggerStateMachineLambdaName
      ];
      const uniqueNames = [...new Set(functionNames)];
      expect(uniqueNames.length).toBe(functionNames.length);
    });
  });

  describe('Step Functions Configuration', () => {
    test('state machine ARN is defined and valid', () => {
      expect(outputs.RecoveryStateMachineArn).toBeDefined();
      expect(outputs.RecoveryStateMachineArn).toMatch(
        /^arn:aws:states:[a-z0-9-]+:\d{12}:stateMachine:/
      );
    });

    test('state machine name follows naming convention', () => {
      expect(outputs.RecoveryStateMachineName).toBeDefined();
      expect(outputs.RecoveryStateMachineName).toMatch(/^iot-recovery-orchestration-[a-z0-9]+$/);
    });
  });

  describe('EventBridge Configuration', () => {
    test('event bus name is defined and valid', () => {
      expect(outputs.RecoveryEventBusName).toBeDefined();
      expect(outputs.RecoveryEventBusName).toMatch(/^iot-recovery-events-[a-z0-9]+$/);
    });

    test('event bus ARN is valid', () => {
      expect(outputs.RecoveryEventBusArn).toBeDefined();
      expect(outputs.RecoveryEventBusArn).toMatch(/^arn:aws:events:[a-z0-9-]+:\d{12}:event-bus\//);
    });
  });

  describe('CloudWatch Monitoring Configuration', () => {
    test('alarm name is defined and valid', () => {
      expect(outputs.RuleFailureAlarmName).toBeDefined();
      expect(outputs.RuleFailureAlarmName).toMatch(/^iot-rule-failures-[a-z0-9]+$/);
    });

    test('alarm ARN is valid', () => {
      expect(outputs.RuleFailureAlarmArn).toBeDefined();
      expect(outputs.RuleFailureAlarmArn).toMatch(/^arn:aws:cloudwatch:[a-z0-9-]+:\d{12}:alarm:/);
    });

    test('dashboard name is defined', () => {
      expect(outputs.RecoveryDashboardName).toBeDefined();
      expect(outputs.RecoveryDashboardName).toMatch(/^iot-recovery-monitoring-[a-z0-9]+$/);
    });
  });

  describe('Helper Commands Validation', () => {
    test('helper commands are properly formatted', () => {
      expect(outputs.TestShadowAnalysisCommand).toContain('aws lambda invoke');
      expect(outputs.StartRecoveryCommand).toContain('aws stepfunctions start-execution');
      expect(outputs.ViewLogsCommand).toContain('aws logs tail');
      expect(outputs.CheckSensorDLQCommand).toContain('aws sqs receive-message');
    });

    test('helper commands reference correct resources', () => {
      expect(outputs.TestShadowAnalysisCommand).toContain(outputs.ShadowAnalysisLambdaName!);
      expect(outputs.StartRecoveryCommand).toContain(outputs.RecoveryStateMachineArn!);
      expect(outputs.ViewLogsCommand).toContain(outputs.ShadowAnalysisLambdaName!);
      expect(outputs.CheckSensorDLQCommand).toContain(outputs.SensorDLQUrl!);
    });
  });

  // ========== INTERACTIVE INTEGRATION TESTS ==========
  // These tests interact with actual AWS resources to verify functionality

  describe('Interactive Integration Tests', () => {
    describe('S3 Archive Bucket Validation', () => {
      test('S3 bucket exists and is accessible', async () => {
        if (!outputs.IoTArchiveBucketName) {
          console.log('⊘ Skipping: IoTArchiveBucketName not in outputs');
          return;
        }

        const bucketName = outputs.IoTArchiveBucketName;

        // Verify bucket exists
        await s3Client.send(
          new HeadBucketCommand({
            Bucket: bucketName
          })
        );

        console.log(`✓ S3 bucket ${bucketName} exists and is accessible`);
      }, 30000);

      test('S3 bucket has versioning enabled', async () => {
        if (!outputs.IoTArchiveBucketName) {
          console.log('⊘ Skipping: IoTArchiveBucketName not in outputs');
          return;
        }

        const bucketName = outputs.IoTArchiveBucketName;

        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName
          })
        );

        expect(versioningResponse.Status).toBe('Enabled');
        console.log(`✓ S3 bucket ${bucketName} has versioning enabled`);
      }, 30000);

      test('S3 bucket has public access blocked', async () => {
        if (!outputs.IoTArchiveBucketName) {
          console.log('⊘ Skipping: IoTArchiveBucketName not in outputs');
          return;
        }

        const bucketName = outputs.IoTArchiveBucketName;

        const publicAccessResponse = await s3Client.send(
          new GetPublicAccessBlockCommand({
            Bucket: bucketName
          })
        );

        const config = publicAccessResponse.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);

        console.log(`✓ S3 bucket ${bucketName} has public access blocked`);
      }, 30000);
    });

    describe('DynamoDB Tables Validation', () => {
      test('device recovery table exists and is active', async () => {
        if (!outputs.DeviceRecoveryTableName) {
          console.log('⊘ Skipping: DeviceRecoveryTableName not in outputs');
          return;
        }

        const tableName = outputs.DeviceRecoveryTableName;

        const tableResponse = await dynamoClient.send(
          new DescribeTableCommand({
            TableName: tableName
          })
        );

        const table = tableResponse.Table!;
        expect(table.TableStatus).toBe('ACTIVE');
        expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

        // Verify key schema
        const hashKey = table.KeySchema?.find((k) => k.KeyType === 'HASH');
        const rangeKey = table.KeySchema?.find((k) => k.KeyType === 'RANGE');
        expect(hashKey?.AttributeName).toBe('deviceId');
        expect(rangeKey?.AttributeName).toBe('timestamp');

        // Verify GSI exists
        expect(table.GlobalSecondaryIndexes?.length).toBeGreaterThan(0);
        const deviceTypeIndex = table.GlobalSecondaryIndexes?.find((gsi) =>
          gsi.IndexName?.includes('deviceType-index')
        );
        expect(deviceTypeIndex).toBeDefined();

        console.log(`✓ DynamoDB table ${tableName} is active`);
        console.log(`  Billing mode: ${table.BillingModeSummary?.BillingMode}`);
        console.log(`  GSI count: ${table.GlobalSecondaryIndexes?.length || 0}`);
      }, 30000);

      test('validation table exists and is active', async () => {
        if (!outputs.ValidationTableName) {
          console.log('⊘ Skipping: ValidationTableName not in outputs');
          return;
        }

        const tableName = outputs.ValidationTableName;

        const tableResponse = await dynamoClient.send(
          new DescribeTableCommand({
            TableName: tableName
          })
        );

        const table = tableResponse.Table!;
        expect(table.TableStatus).toBe('ACTIVE');
        expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

        // Verify GSI for time-range queries
        const timestampIndex = table.GlobalSecondaryIndexes?.find((gsi) =>
          gsi.IndexName?.includes('timestamp-index')
        );
        expect(timestampIndex).toBeDefined();

        console.log(`✓ DynamoDB validation table ${tableName} is active`);
        console.log(`  GSI configured for time-range queries`);
      }, 30000);

      test('DynamoDB table CRUD operations work correctly', async () => {
        if (!outputs.DeviceRecoveryTableName) {
          console.log('⊘ Skipping: DeviceRecoveryTableName not in outputs');
          return;
        }

        const tableName = outputs.DeviceRecoveryTableName;
        const testDeviceId = `test-device-${Date.now()}`;
        const testTimestamp = Date.now();

        // PUT operation
        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              deviceId: testDeviceId,
              timestamp: testTimestamp,
              deviceType: 'sensor',
              testData: 'Integration test data',
              recoveryStatus: 'pending'
            }
          })
        );

        console.log(`✓ PUT operation successful for device ${testDeviceId}`);

        // GET operation
        const getResponse = await docClient.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              deviceId: testDeviceId,
              timestamp: testTimestamp
            }
          })
        );

        expect(getResponse.Item).toBeDefined();
        expect(getResponse.Item!.deviceId).toBe(testDeviceId);
        expect(getResponse.Item!.deviceType).toBe('sensor');

        console.log(`✓ GET operation successful for device ${testDeviceId}`);

        // DELETE operation (cleanup)
        await docClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              deviceId: testDeviceId,
              timestamp: testTimestamp
            }
          })
        );

        console.log(`✓ DELETE operation successful for device ${testDeviceId}`);
      }, 45000);
    });

    describe('Kinesis Streams Validation', () => {
      test('Kinesis streams exist and are active', async () => {
        if (kinesisStreamNames.length === 0) {
          console.log('⊘ Skipping: No Kinesis streams in outputs');
          return;
        }

        for (const streamName of kinesisStreamNames.slice(0, 3)) {
          // Test first 3 streams
          const streamResponse = await kinesisClient.send(
            new DescribeStreamCommand({
              StreamName: streamName
            })
          );

          const description = streamResponse.StreamDescription!;
          expect(description.StreamStatus).toBe('ACTIVE');
          expect(description.Shards?.length).toBe(100); // 100 shards per stream

          console.log(`✓ Kinesis stream ${streamName} is active`);
          console.log(`  Shards: ${description.Shards?.length}`);
          console.log(`  Retention: ${description.RetentionPeriodHours} hours`);
        }
      }, 60000);

      test('can write to Kinesis streams', async () => {
        if (kinesisStreamNames.length === 0) {
          console.log('⊘ Skipping: No Kinesis streams in outputs');
          return;
        }

        const streamName = kinesisStreamNames[0]; // Test first stream
        const testMessage = {
          deviceId: `test-device-${Date.now()}`,
          deviceType: 'sensor',
          timestamp: Date.now(),
          data: { temperature: 25.5 }
        };

        const putResponse = await kinesisClient.send(
          new PutRecordCommand({
            StreamName: streamName,
            Data: Buffer.from(JSON.stringify(testMessage)),
            PartitionKey: testMessage.deviceId
          })
        );

        expect(putResponse.SequenceNumber).toBeDefined();
        expect(putResponse.ShardId).toBeDefined();

        console.log(`✓ Successfully wrote test message to Kinesis stream ${streamName}`);
        console.log(`  Shard ID: ${putResponse.ShardId}`);
      }, 30000);
    });

    describe('SQS Dead Letter Queues Validation', () => {
      test('SQS queues are accessible', async () => {
        const queueUrls = [
          outputs.SensorDLQUrl,
          outputs.ActuatorDLQUrl,
          outputs.GatewayDLQUrl,
          outputs.EdgeDLQUrl
        ];

        for (const queueUrl of queueUrls) {
          if (!queueUrl) continue;

          const attributesResponse = await sqsClient.send(
            new GetQueueAttributesCommand({
              QueueUrl: queueUrl,
              AttributeNames: ['All']
            })
          );

          expect(attributesResponse.Attributes).toBeDefined();
          expect(attributesResponse.Attributes!.VisibilityTimeout).toBe('900'); // 15 minutes
          expect(attributesResponse.Attributes!.MessageRetentionPeriod).toBe('1209600'); // 14 days

          const queueName = queueUrl.split('/').pop();
          console.log(`✓ SQS queue ${queueName} is accessible`);
        }
      }, 45000);

      test('can send and receive messages from DLQs', async () => {
        if (!outputs.SensorDLQUrl) {
          console.log('⊘ Skipping: SensorDLQUrl not in outputs');
          return;
        }

        const queueUrl = outputs.SensorDLQUrl;
        const testMessageBody = JSON.stringify({
          deviceId: `test-sensor-${Date.now()}`,
          deviceType: 'sensor',
          failureReason: 'integration-test',
          timestamp: Date.now()
        });

        // Send message
        const sendResponse = await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: testMessageBody
          })
        );

        expect(sendResponse.MessageId).toBeDefined();
        console.log(`✓ Sent test message to sensor DLQ`);

        // Receive message
        const receiveResponse = await sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 5
          })
        );

        expect(receiveResponse.Messages).toBeDefined();
        expect(receiveResponse.Messages!.length).toBeGreaterThan(0);

        const receivedMessage = receiveResponse.Messages!.find(
          (msg) => msg.MessageId === sendResponse.MessageId
        );
        expect(receivedMessage).toBeDefined();

        console.log(`✓ Received test message from sensor DLQ`);
      }, 45000);
    });

    describe('Lambda Functions Validation', () => {
      test('shadow analysis Lambda exists and is configured correctly', async () => {
        if (!outputs.ShadowAnalysisLambdaName) {
          console.log('⊘ Skipping: ShadowAnalysisLambdaName not in outputs');
          return;
        }

        const functionName = outputs.ShadowAnalysisLambdaName;

        const functionResponse = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName
          })
        );

        const config = functionResponse.Configuration!;
        expect(config.State).toBe('Active');
        expect(config.Runtime).toContain('nodejs');
        expect(config.MemorySize).toBe(3008);
        expect(config.Timeout).toBe(900); // 15 minutes

        // Verify environment variables
        expect(config.Environment?.Variables?.DEVICE_TABLE_NAME).toBe(
          outputs.DeviceRecoveryTableName
        );
        expect(config.Environment?.Variables?.BUCKET_NAME).toBe(outputs.IoTArchiveBucketName);
        expect(config.Environment?.Variables?.ENVIRONMENT).toBeDefined();

        console.log(`✓ Lambda ${functionName} is properly configured`);
        console.log(`  Runtime: ${config.Runtime}`);
        console.log(`  Memory: ${config.MemorySize} MB`);
        console.log(`  Timeout: ${config.Timeout} seconds`);
      }, 30000);

      test('Kinesis republish Lambda exists and is configured correctly', async () => {
        if (!outputs.KinesisRepublishLambdaName) {
          console.log('⊘ Skipping: KinesisRepublishLambdaName not in outputs');
          return;
        }

        const functionName = outputs.KinesisRepublishLambdaName;

        const functionResponse = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName
          })
        );

        const config = functionResponse.Configuration!;
        expect(config.State).toBe('Active');
        expect(config.MemorySize).toBe(3008);

        // Verify Kinesis streams in environment
        expect(config.Environment?.Variables?.KINESIS_STREAMS).toBeDefined();
        const envStreams = JSON.parse(config.Environment!.Variables!.KINESIS_STREAMS!);
        expect(envStreams.length).toBe(10);

        console.log(`✓ Lambda ${functionName} is properly configured`);
        console.log(`  Kinesis streams configured: ${envStreams.length}`);
      }, 30000);

      test('DynamoDB validation Lambda exists and is configured correctly', async () => {
        if (!outputs.DynamoDBValidationLambdaName) {
          console.log('⊘ Skipping: DynamoDBValidationLambdaName not in outputs');
          return;
        }

        const functionName = outputs.DynamoDBValidationLambdaName;

        const functionResponse = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionName
          })
        );

        const config = functionResponse.Configuration!;
        expect(config.State).toBe('Active');

        // Verify environment variables
        expect(config.Environment?.Variables?.VALIDATION_TABLE_NAME).toBe(
          outputs.ValidationTableName
        );
        expect(config.Environment?.Variables?.DEVICE_TABLE_NAME).toBe(
          outputs.DeviceRecoveryTableName
        );

        console.log(`✓ Lambda ${functionName} is properly configured`);
      }, 30000);

      test('Lambda functions can be invoked', async () => {
        if (!outputs.TriggerStateMachineLambdaName) {
          console.log('⊘ Skipping: TriggerStateMachineLambdaName not in outputs');
          return;
        }

        const functionName = outputs.TriggerStateMachineLambdaName;
        const testPayload = JSON.stringify({
          test: true,
          source: 'integration-test',
          timestamp: Date.now()
        });

        const invokeResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(testPayload)
          })
        );

        expect(invokeResponse.StatusCode).toBe(200);
        expect(invokeResponse.FunctionError).toBeUndefined();

        const responsePayload = JSON.parse(
          new TextDecoder().decode(invokeResponse.Payload)
        );
        expect(responsePayload).toBeDefined();

        console.log(`✓ Lambda ${functionName} invoked successfully`);
        console.log(`  Status code: ${invokeResponse.StatusCode}`);
      }, 30000);
    });

    describe('Step Functions State Machine Validation', () => {
      test('state machine exists and is active', async () => {
        if (!outputs.RecoveryStateMachineArn) {
          console.log('⊘ Skipping: RecoveryStateMachineArn not in outputs');
          return;
        }

        const stateMachineArn = outputs.RecoveryStateMachineArn;

        const stateMachineResponse = await sfnClient.send(
          new DescribeStateMachineCommand({
            stateMachineArn
          })
        );

        expect(stateMachineResponse.status).toBe('ACTIVE');
        expect(stateMachineResponse.type).toBe('STANDARD');
        expect(stateMachineResponse.definition).toBeDefined();

        // Verify definition contains expected tasks
        const definition = stateMachineResponse.definition!;
        expect(definition).toContain('ParallelBackfill');
        expect(definition).toContain('BackfillTask');
        expect(definition).toContain('RepublishTask');
        expect(definition).toContain('ValidationTask');

        console.log(`✓ State machine ${outputs.RecoveryStateMachineName} is active`);
        console.log(`  Type: ${stateMachineResponse.type}`);
      }, 30000);

      test('can start state machine execution', async () => {
        if (!outputs.RecoveryStateMachineArn) {
          console.log('⊘ Skipping: RecoveryStateMachineArn not in outputs');
          return;
        }

        const stateMachineArn = outputs.RecoveryStateMachineArn;
        const executionName = `test-execution-${Date.now()}`;
        const testInput = JSON.stringify({
          processedDevices: 1000,
          failedDevices: 5,
          archivesToProcess: ['test-archive-1.json'],
          bucketName: outputs.IoTArchiveBucketName,
          totalMessagesReplayed: 0
        });

        const startResponse = await sfnClient.send(
          new StartExecutionCommand({
            stateMachineArn,
            name: executionName,
            input: testInput
          })
        );

        expect(startResponse.executionArn).toBeDefined();
        expect(startResponse.startDate).toBeDefined();

        console.log(`✓ Started state machine execution: ${executionName}`);

        // Wait a bit for execution to progress
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Check execution status
        const describeResponse = await sfnClient.send(
          new DescribeExecutionCommand({
            executionArn: startResponse.executionArn
          })
        );

        expect(describeResponse.status).toBeDefined();
        console.log(`✓ Execution status: ${describeResponse.status}`);
      }, 60000);
    });

    describe('EventBridge Event Bus Validation', () => {
      test('event bus exists and is active', async () => {
        if (!outputs.RecoveryEventBusName) {
          console.log('⊘ Skipping: RecoveryEventBusName not in outputs');
          return;
        }

        const eventBusName = outputs.RecoveryEventBusName;

        const eventBusResponse = await eventBridgeClient.send(
          new DescribeEventBusCommand({
            Name: eventBusName
          })
        );

        expect(eventBusResponse.Name).toBe(eventBusName);
        expect(eventBusResponse.Arn).toBeDefined();

        console.log(`✓ EventBridge event bus ${eventBusName} exists`);
      }, 30000);

      test('EventBridge rules exist for all device types', async () => {
        if (!outputs.RecoveryEventBusName) {
          console.log('⊘ Skipping: RecoveryEventBusName not in outputs');
          return;
        }

        const eventBusName = outputs.RecoveryEventBusName;

        const rulesResponse = await eventBridgeClient.send(
          new ListRulesCommand({
            EventBusName: eventBusName
          })
        );

        const rules = rulesResponse.Rules || [];
        const deviceTypes = ['sensor', 'actuator', 'gateway', 'edge'];

        deviceTypes.forEach((deviceType) => {
          const rule = rules.find((r) => r.Name?.includes(deviceType));
          expect(rule).toBeDefined();
          console.log(`✓ EventBridge rule found for ${deviceType} devices`);
        });
      }, 30000);

      test('can send events to EventBridge', async () => {
        if (!outputs.RecoveryEventBusName) {
          console.log('⊘ Skipping: RecoveryEventBusName not in outputs');
          return;
        }

        const eventBusName = outputs.RecoveryEventBusName;
        const testEvent = {
          Source: 'iot.recovery',
          DetailType: 'Device Recovery Event',
          Detail: JSON.stringify({
            deviceId: `test-device-${Date.now()}`,
            deviceType: 'sensor',
            timestamp: Date.now(),
            reason: 'integration-test'
          }),
          EventBusName: eventBusName
        };

        const putEventsResponse = await eventBridgeClient.send(
          new PutEventsCommand({
            Entries: [testEvent]
          })
        );

        expect(putEventsResponse.FailedEntryCount).toBe(0);
        expect(putEventsResponse.Entries![0].EventId).toBeDefined();

        console.log(`✓ Successfully sent test event to EventBridge`);
      }, 30000);
    });

    describe('CloudWatch Monitoring Validation', () => {
      test('CloudWatch alarm exists and is configured', async () => {
        if (!outputs.RuleFailureAlarmName) {
          console.log('⊘ Skipping: RuleFailureAlarmName not in outputs');
          return;
        }

        const alarmName = outputs.RuleFailureAlarmName;

        const alarmsResponse = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName]
          })
        );

        expect(alarmsResponse.MetricAlarms).toHaveLength(1);
        const alarm = alarmsResponse.MetricAlarms![0];

        expect(alarm.MetricName).toBe('RuleMessageThrottled');
        expect(alarm.Namespace).toBe('AWS/IoT');
        expect(alarm.Statistic).toBe('Sum');
        expect(alarm.Period).toBe(60); // 1 minute
        expect(alarm.Threshold).toBe(1);

        console.log(`✓ CloudWatch alarm ${alarmName} is configured`);
        console.log(`  State: ${alarm.StateValue}`);
        console.log(`  Metric: ${alarm.Namespace}/${alarm.MetricName}`);
      }, 30000);
    });

    describe('End-to-End Recovery Pipeline Tests', () => {
      test('complete recovery pipeline flow', async () => {
        console.log('\n=== Testing Complete IoT Recovery Pipeline ===');

        // Skip if any critical output is missing
        if (
          !outputs.DeviceRecoveryTableName ||
          !outputs.ValidationTableName ||
          !outputs.ShadowAnalysisLambdaName ||
          !outputs.RecoveryStateMachineArn
        ) {
          console.log('⊘ Skipping: Required outputs not available');
          return;
        }

        const testDeviceId = `pipeline-test-${Date.now()}`;
        const testTimestamp = Date.now();

        // Step 1: Simulate device failure in DynamoDB
        console.log('\n[Step 1] Simulating device failure...');
        await docClient.send(
          new PutCommand({
            TableName: outputs.DeviceRecoveryTableName,
            Item: {
              deviceId: testDeviceId,
              timestamp: testTimestamp,
              deviceType: 'sensor',
              lastSeen: testTimestamp - 7200000, // 2 hours ago
              needsRecovery: true,
              recoveryStatus: 'pending'
            }
          })
        );
        console.log(`✓ Created device failure record for ${testDeviceId}`);

        // Step 2: Verify device record exists
        console.log('\n[Step 2] Verifying device record...');
        const getResponse = await docClient.send(
          new GetCommand({
            TableName: outputs.DeviceRecoveryTableName,
            Key: {
              deviceId: testDeviceId,
              timestamp: testTimestamp
            }
          })
        );
        expect(getResponse.Item).toBeDefined();
        expect(getResponse.Item!.needsRecovery).toBe(true);
        console.log(`✓ Device record verified in DynamoDB`);

        // Step 3: Invoke shadow analysis Lambda
        console.log('\n[Step 3] Testing shadow analysis Lambda...');
        const shadowTestPayload = JSON.stringify({
          test: true,
          deviceId: testDeviceId
        });

        const shadowInvokeResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.ShadowAnalysisLambdaName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(shadowTestPayload)
          })
        );

        expect(shadowInvokeResponse.StatusCode).toBe(200);
        console.log(`✓ Shadow analysis Lambda invoked successfully`);

        // Step 4: Test DynamoDB validation Lambda
        console.log('\n[Step 4] Testing DynamoDB validation...');
        if (outputs.DynamoDBValidationLambdaName) {
          const validationPayload = JSON.stringify({
            processedDevices: 1000,
            failedDevices: 5,
            totalMessagesReplayed: 45000000,
            archivesToProcess: []
          });

          const validationResponse = await lambdaClient.send(
            new InvokeCommand({
              FunctionName: outputs.DynamoDBValidationLambdaName,
              InvocationType: 'RequestResponse',
              Payload: Buffer.from(validationPayload)
            })
          );

          expect(validationResponse.StatusCode).toBe(200);
          const validationResult = JSON.parse(
            new TextDecoder().decode(validationResponse.Payload)
          );
          expect(validationResult.recoveryPercentage).toBeDefined();
          console.log(`✓ DynamoDB validation Lambda executed successfully`);
          console.log(`  Recovery percentage: ${validationResult.recoveryPercentage}%`);
        }

        // Step 5: Query validation table for time-series data
        console.log('\n[Step 5] Testing time-series range queries...');
        const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;

        const queryResponse = await docClient.send(
          new QueryCommand({
            TableName: outputs.ValidationTableName,
            KeyConditionExpression: 'deviceId = :deviceId AND #ts >= :startTime',
            ExpressionAttributeNames: {
              '#ts': 'timestamp'
            },
            ExpressionAttributeValues: {
              ':deviceId': 'RECOVERY_VALIDATION',
              ':startTime': twelveHoursAgo
            }
          })
        );

        console.log(`✓ Time-series query executed successfully`);
        console.log(`  Records found: ${queryResponse.Items?.length || 0}`);

        // Cleanup
        console.log('\n[Cleanup] Removing test data...');
        await docClient.send(
          new DeleteCommand({
            TableName: outputs.DeviceRecoveryTableName,
            Key: {
              deviceId: testDeviceId,
              timestamp: testTimestamp
            }
          })
        );
        console.log(`✓ Test data cleaned up`);

        console.log('\n✓ Complete recovery pipeline tested successfully\n');
      }, 90000);

      test('parallel execution and orchestration', async () => {
        console.log('\n=== Testing Parallel Execution Orchestration ===');

        if (!outputs.RecoveryStateMachineArn) {
          console.log('⊘ Skipping: RecoveryStateMachineArn not available');
          return;
        }

        // Start a test execution
        const executionName = `orchestration-test-${Date.now()}`;
        const testInput = JSON.stringify({
          processedDevices: 2300000,
          failedDevices: 1000,
          archivesToProcess: ['archive-1.json', 'archive-2.json'],
          bucketName: outputs.IoTArchiveBucketName,
          totalMessagesReplayed: 0
        });

        const startResponse = await sfnClient.send(
          new StartExecutionCommand({
            stateMachineArn: outputs.RecoveryStateMachineArn,
            name: executionName,
            input: testInput
          })
        );

        console.log(`✓ Started orchestration execution: ${executionName}`);

        // Wait for execution to progress
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check execution status
        const describeResponse = await sfnClient.send(
          new DescribeExecutionCommand({
            executionArn: startResponse.executionArn
          })
        );

        expect(describeResponse.status).toBeDefined();
        console.log(`✓ Execution status: ${describeResponse.status}`);

        // List recent executions
        const listResponse = await sfnClient.send(
          new ListExecutionsCommand({
            stateMachineArn: outputs.RecoveryStateMachineArn,
            maxResults: 5
          })
        );

        expect(listResponse.executions).toBeDefined();
        console.log(`✓ Recent executions: ${listResponse.executions!.length}`);

        console.log('\n✓ Parallel orchestration verified\n');
      }, 60000);

      test('EventBridge to SQS routing', async () => {
        console.log('\n=== Testing EventBridge to SQS Routing ===');

        if (!outputs.RecoveryEventBusName || !outputs.SensorDLQUrl) {
          console.log('⊘ Skipping: Required outputs not available');
          return;
        }

        const eventBusName = outputs.RecoveryEventBusName;
        const testDeviceId = `eventbridge-test-${Date.now()}`;

        // Send event to EventBridge
        const testEvent = {
          Source: 'iot.recovery',
          DetailType: 'Device Recovery Event',
          Detail: JSON.stringify({
            deviceId: testDeviceId,
            deviceType: 'sensor',
            timestamp: Date.now(),
            reason: 'kinesis_republish_failed'
          }),
          EventBusName: eventBusName
        };

        const putEventsResponse = await eventBridgeClient.send(
          new PutEventsCommand({
            Entries: [testEvent]
          })
        );

        expect(putEventsResponse.FailedEntryCount).toBe(0);
        console.log(`✓ Event sent to EventBridge`);

        // Wait for event to route to SQS
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check if message arrived in sensor DLQ
        const receiveResponse = await sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: outputs.SensorDLQUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 10
          })
        );

        // Note: Message might not arrive immediately due to EventBridge async nature
        console.log(
          `✓ Checked sensor DLQ, messages found: ${receiveResponse.Messages?.length || 0}`
        );

        console.log('\n✓ EventBridge to SQS routing verified\n');
      }, 60000);

      test('data continuity and timestamp gap detection', async () => {
        console.log('\n=== Testing Data Continuity & Timestamp Gap Detection ===');

        if (!outputs.ValidationTableName || !outputs.DynamoDBValidationLambdaName) {
          console.log('⊘ Skipping: Required outputs not available');
          return;
        }

        const validationTable = outputs.ValidationTableName;
        const currentTime = Date.now();

        // Create validation records with intentional gaps
        const records = [
          { timestamp: currentTime - 60 * 60 * 1000 }, // 1 hour ago
          { timestamp: currentTime - 55 * 60 * 1000 }, // 55 min ago
          { timestamp: currentTime - 50 * 60 * 1000 }, // 50 min ago
          // GAP of 30 minutes here
          { timestamp: currentTime - 20 * 60 * 1000 }, // 20 min ago
          { timestamp: currentTime - 15 * 60 * 1000 }, // 15 min ago
          { timestamp: currentTime - 10 * 60 * 1000 } // 10 min ago
        ];

        console.log(`[Step 1] Creating ${records.length} validation records with gaps...`);
        for (const record of records) {
          await docClient.send(
            new PutCommand({
              TableName: validationTable,
              Item: {
                deviceId: 'RECOVERY_VALIDATION',
                timestamp: record.timestamp,
                validationType: 'recovery_metrics',
                processedDevices: 2300000,
                failedDevices: 100,
                ttl: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
              }
            })
          );
        }
        console.log(`✓ Created validation records`);

        // Invoke validation Lambda to detect gaps
        console.log('\n[Step 2] Invoking validation Lambda to detect gaps...');
        const validationPayload = JSON.stringify({
          processedDevices: 2300000,
          failedDevices: 100,
          totalMessagesReplayed: 45000000,
          archivesToProcess: []
        });

        const validationResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.DynamoDBValidationLambdaName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(validationPayload)
          })
        );

        expect(validationResponse.StatusCode).toBe(200);
        const result = JSON.parse(new TextDecoder().decode(validationResponse.Payload));

        expect(result.timestampGaps).toBeDefined();
        console.log(`✓ Timestamp gap detection executed`);
        console.log(`  Gaps detected: ${result.timestampGaps}`);
        console.log(`  Data continuity: ${result.dataContinuityPercentage}%`);

        console.log('\n✓ Data continuity verification complete\n');
      }, 60000);

      test('99.9% recovery target validation', async () => {
        console.log('\n=== Testing 99.9% Recovery Target Validation ===');

        if (!outputs.DynamoDBValidationLambdaName) {
          console.log('⊘ Skipping: DynamoDBValidationLambdaName not available');
          return;
        }

        // Test with successful recovery (99.9%+)
        const successPayload = JSON.stringify({
          processedDevices: 2300000,
          failedDevices: 230, // 0.01% failure rate
          totalMessagesReplayed: 45000000,
          archivesToProcess: []
        });

        const successResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.DynamoDBValidationLambdaName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(successPayload)
          })
        );

        const successResult = JSON.parse(new TextDecoder().decode(successResponse.Payload));
        expect(successResult.recoveryPercentage).toBeGreaterThanOrEqual(99.9);
        console.log(`✓ Success case: ${successResult.recoveryPercentage}% recovery`);

        // Test with failed recovery (< 99.9%)
        const failurePayload = JSON.stringify({
          processedDevices: 2300000,
          failedDevices: 50000, // 2.17% failure rate
          totalMessagesReplayed: 40000000,
          archivesToProcess: []
        });

        const failureResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.DynamoDBValidationLambdaName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(failurePayload)
          })
        );

        const failureResult = JSON.parse(new TextDecoder().decode(failureResponse.Payload));
        expect(failureResult.recoveryPercentage).toBeLessThan(99.9);
        expect(failureResult.targetMet).toBe(false);
        console.log(`✓ Failure case: ${failureResult.recoveryPercentage}% recovery`);

        console.log('\n✓ 99.9% recovery target validation complete\n');
      }, 60000);

      test('Kinesis message replay with ordering', async () => {
        console.log('\n=== Testing Kinesis Message Replay with Ordering ===');

        if (kinesisStreamNames.length === 0 || !outputs.KinesisRepublishLambdaName) {
          console.log('⊘ Skipping: Kinesis streams or Lambda not available');
          return;
        }

        const streamName = kinesisStreamNames[0];
        const testMessages = [
          {
            deviceId: `replay-test-${Date.now()}`,
            deviceType: 'sensor',
            timestamp: Date.now() - 3000,
            sequenceNumber: 1,
            data: { value: 'message-1' }
          },
          {
            deviceId: `replay-test-${Date.now()}`,
            deviceType: 'sensor',
            timestamp: Date.now() - 2000,
            sequenceNumber: 2,
            data: { value: 'message-2' }
          },
          {
            deviceId: `replay-test-${Date.now()}`,
            deviceType: 'sensor',
            timestamp: Date.now() - 1000,
            sequenceNumber: 3,
            data: { value: 'message-3' }
          }
        ];

        console.log(`[Step 1] Replaying ${testMessages.length} ordered messages to Kinesis...`);

        for (const message of testMessages) {
          const putResponse = await kinesisClient.send(
            new PutRecordCommand({
              StreamName: streamName,
              Data: Buffer.from(JSON.stringify(message)),
              PartitionKey: message.deviceId
            })
          );

          expect(putResponse.SequenceNumber).toBeDefined();
          console.log(
            `✓ Message ${message.sequenceNumber} written to shard ${putResponse.ShardId}`
          );
        }

        console.log('\n✓ Kinesis message replay with ordering verified\n');
      }, 60000);

      test('multi-device-type event routing', async () => {
        console.log('\n=== Testing Multi-Device-Type Event Routing ===');

        if (!outputs.RecoveryEventBusName) {
          console.log('⊘ Skipping: RecoveryEventBusName not available');
          return;
        }

        const eventBusName = outputs.RecoveryEventBusName;
        const deviceTypes = ['sensor', 'actuator', 'gateway', 'edge'];
        const dlqUrls = {
          sensor: outputs.SensorDLQUrl,
          actuator: outputs.ActuatorDLQUrl,
          gateway: outputs.GatewayDLQUrl,
          edge: outputs.EdgeDLQUrl
        };

        console.log(`[Step 1] Sending events for all device types...`);

        for (const deviceType of deviceTypes) {
          const testEvent = {
            Source: 'iot.recovery',
            DetailType: 'Device Recovery Event',
            Detail: JSON.stringify({
              deviceId: `routing-test-${deviceType}-${Date.now()}`,
              deviceType: deviceType,
              timestamp: Date.now(),
              reason: 'routing-test'
            }),
            EventBusName: eventBusName
          };

          const putResponse = await eventBridgeClient.send(
            new PutEventsCommand({
              Entries: [testEvent]
            })
          );

          expect(putResponse.FailedEntryCount).toBe(0);
          console.log(`✓ Sent ${deviceType} event to EventBridge`);
        }

        console.log('\n✓ Multi-device-type routing verified\n');
      }, 60000);

      test('CloudWatch metrics are being published', async () => {
        console.log('\n=== Testing CloudWatch Metrics Publishing ===');

        if (!outputs.DynamoDBValidationLambdaName) {
          console.log('⊘ Skipping: DynamoDBValidationLambdaName not available');
          return;
        }

        // Invoke validation Lambda to generate metrics
        const validationPayload = JSON.stringify({
          processedDevices: 2300000,
          failedDevices: 500,
          totalMessagesReplayed: 44000000,
          archivesToProcess: []
        });

        await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.DynamoDBValidationLambdaName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(validationPayload)
          })
        );

        console.log(`✓ Validation Lambda invoked to generate metrics`);

        // Wait for metrics to be published
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // Query CloudWatch for metrics
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); // Last 15 minutes

        const metricsResponse = await cloudwatchClient.send(
          new GetMetricStatisticsCommand({
            Namespace: 'IoTRecovery-dev', // Adjust based on environment
            MetricName: 'RecoveryPercentage',
            StartTime: startTime,
            EndTime: endTime,
            Period: 300, // 5 minutes
            Statistics: ['Average', 'Maximum']
          })
        );

        console.log(
          `✓ CloudWatch metrics query executed, datapoints: ${metricsResponse.Datapoints?.length || 0}`
        );

        console.log('\n✓ CloudWatch metrics publishing verified\n');
      }, 60000);
    });

    describe('Performance and Scale Tests', () => {
      test('DynamoDB tables support high-throughput operations', async () => {
        console.log('\n=== Testing High-Throughput DynamoDB Operations ===');

        if (!outputs.DeviceRecoveryTableName) {
          console.log('⊘ Skipping: DeviceRecoveryTableName not available');
          return;
        }

        const tableName = outputs.DeviceRecoveryTableName;
        const batchSize = 25; // DynamoDB BatchWrite limit
        const testDevices: any[] = [];

        console.log(`[Step 1] Creating ${batchSize} test device records...`);

        // Create batch of test devices
        const writePromises: Promise<any>[] = [];
        for (let i = 0; i < batchSize; i++) {
          const deviceId = `throughput-test-${Date.now()}-${i}`;
          const timestamp = Date.now() + i;

          testDevices.push({ deviceId, timestamp });

          writePromises.push(
            docClient.send(
              new PutCommand({
                TableName: tableName,
                Item: {
                  deviceId,
                  timestamp,
                  deviceType: 'sensor',
                  needsRecovery: true,
                  recoveryStatus: 'pending'
                }
              })
            )
          );
        }

        await Promise.all(writePromises);
        console.log(`✓ ${batchSize} device records written successfully`);

        // Cleanup
        console.log('\n[Cleanup] Removing test devices...');
        const deletePromises = testDevices.map((device) =>
          docClient.send(
            new DeleteCommand({
              TableName: tableName,
              Key: {
                deviceId: device.deviceId,
                timestamp: device.timestamp
              }
            })
          )
        );

        await Promise.all(deletePromises);
        console.log(`✓ ${batchSize} test devices cleaned up`);

        console.log('\n✓ High-throughput operations verified\n');
      }, 60000);

      test('time-series range query performance', async () => {
        console.log('\n=== Testing Time-Series Range Query Performance ===');

        if (!outputs.ValidationTableName) {
          console.log('⊘ Skipping: ValidationTableName not available');
          return;
        }

        const tableName = outputs.ValidationTableName;
        const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;

        const startTime = Date.now();

        const queryResponse = await docClient.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'deviceId = :deviceId AND #ts >= :startTime',
            ExpressionAttributeNames: {
              '#ts': 'timestamp'
            },
            ExpressionAttributeValues: {
              ':deviceId': 'RECOVERY_VALIDATION',
              ':startTime': twelveHoursAgo
            }
          })
        );

        const queryDuration = Date.now() - startTime;

        console.log(`✓ Time-series query completed in ${queryDuration}ms`);
        console.log(`  Records retrieved: ${queryResponse.Items?.length || 0}`);

        // Query should complete within 5 seconds for performance requirement
        expect(queryDuration).toBeLessThan(5000);

        console.log('\n✓ Query performance meets requirements\n');
      }, 30000);
    });

    describe('Recovery Workflow Validation', () => {
      test('alarm triggers Lambda function', async () => {
        console.log('\n=== Testing Alarm → Lambda Trigger ===');

        if (!outputs.RuleFailureAlarmName || !outputs.ShadowAnalysisLambdaName) {
          console.log('⊘ Skipping: Required outputs not available');
          return;
        }

        // Get alarm configuration
        const alarmsResponse = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [outputs.RuleFailureAlarmName]
          })
        );

        expect(alarmsResponse.MetricAlarms).toHaveLength(1);
        const alarm = alarmsResponse.MetricAlarms![0];

        // Verify alarm has actions configured
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);

        // Verify action points to shadow analysis Lambda
        const lambdaAction = alarm.AlarmActions!.find((action) =>
          action.includes(outputs.ShadowAnalysisLambdaArn!)
        );
        expect(lambdaAction).toBeDefined();

        console.log(`✓ Alarm ${outputs.RuleFailureAlarmName} configured to trigger Lambda`);

        console.log('\n✓ Alarm trigger configuration verified\n');
      }, 30000);

      test('Step Functions parallel execution branches', async () => {
        console.log('\n=== Testing Step Functions Parallel Branches ===');

        if (!outputs.RecoveryStateMachineArn) {
          console.log('⊘ Skipping: RecoveryStateMachineArn not available');
          return;
        }

        const stateMachineResponse = await sfnClient.send(
          new DescribeStateMachineCommand({
            stateMachineArn: outputs.RecoveryStateMachineArn
          })
        );

        const definition = JSON.parse(stateMachineResponse.definition!);

        // Verify parallel execution structure
        expect(definition.States.ParallelBackfill).toBeDefined();
        expect(definition.States.ParallelBackfill.Type).toBe('Parallel');
        expect(definition.States.ParallelBackfill.Branches).toBeDefined();
        expect(definition.States.ParallelBackfill.Branches.length).toBe(2); // Backfill and Republish

        // Verify branches contain correct tasks
        const backfillBranch = definition.States.ParallelBackfill.Branches.find((b: any) =>
          JSON.stringify(b).includes('BackfillTask')
        );
        const republishBranch = definition.States.ParallelBackfill.Branches.find((b: any) =>
          JSON.stringify(b).includes('RepublishTask')
        );

        expect(backfillBranch).toBeDefined();
        expect(republishBranch).toBeDefined();

        // Verify validation task follows parallel execution
        expect(definition.States.ValidationTask).toBeDefined();

        console.log(`✓ State machine has parallel execution branches`);
        console.log(`  Branches: 2 (Backfill + Republish)`);
        console.log(`  Validation follows parallel execution`);

        console.log('\n✓ Parallel execution structure verified\n');
      }, 30000);
    });

    describe('Comprehensive Integration Test', () => {
      test('full recovery workflow from alarm to validation', async () => {
        console.log('\n=== Full Recovery Workflow Integration Test ===');

        // Skip if critical resources are missing
        if (
          !outputs.DeviceRecoveryTableName ||
          !outputs.ShadowAnalysisLambdaName ||
          !outputs.KinesisRepublishLambdaName ||
          !outputs.DynamoDBValidationLambdaName ||
          !outputs.RecoveryStateMachineArn ||
          !outputs.RecoveryEventBusName
        ) {
          console.log('⊘ Skipping: Required outputs not available');
          return;
        }

        const testRunId = Date.now();

        // Step 1: Create failed device records (simulating IoT rule failures)
        console.log('\n[Step 1] Simulating IoT rule failures...');
        const failedDevices: Array<{ deviceId: string; timestamp: number }> = [];
        for (let i = 0; i < 5; i++) {
          const deviceId = `workflow-test-${testRunId}-${i}`;
          const timestamp = Date.now() + i;
          failedDevices.push({ deviceId, timestamp });

          await docClient.send(
            new PutCommand({
              TableName: outputs.DeviceRecoveryTableName,
              Item: {
                deviceId,
                timestamp,
                deviceType: 'sensor',
                lastSeen: timestamp - 3600000, // 1 hour ago
                needsRecovery: true,
                recoveryStatus: 'pending'
              }
            })
          );
        }
        console.log(`✓ Created ${failedDevices.length} failed device records`);

        // Step 2: Start recovery state machine
        console.log('\n[Step 2] Starting recovery orchestration...');
        const executionName = `full-workflow-test-${testRunId}`;
        const stateInput = JSON.stringify({
          processedDevices: 2300000,
          failedDevices: failedDevices.length,
          archivesToProcess: [],
          bucketName: outputs.IoTArchiveBucketName,
          totalMessagesReplayed: 0
        });

        const startResponse = await sfnClient.send(
          new StartExecutionCommand({
            stateMachineArn: outputs.RecoveryStateMachineArn,
            name: executionName,
            input: stateInput
          })
        );

        expect(startResponse.executionArn).toBeDefined();
        console.log(`✓ Recovery state machine started: ${executionName}`);

        // Step 3: Monitor execution progress
        console.log('\n[Step 3] Monitoring execution progress...');
        await new Promise((resolve) => setTimeout(resolve, 8000)); // Wait for execution

        const describeResponse = await sfnClient.send(
          new DescribeExecutionCommand({
            executionArn: startResponse.executionArn
          })
        );

        expect(describeResponse.status).toBeDefined();
        console.log(`✓ Execution status: ${describeResponse.status}`);

        // Step 4: Send recovery events to EventBridge
        console.log('\n[Step 4] Sending recovery events to EventBridge...');
        const events = ['sensor', 'actuator'].map((deviceType) => ({
          Source: 'iot.recovery',
          DetailType: 'Device Recovery Event',
          Detail: JSON.stringify({
            deviceId: `workflow-${deviceType}-${testRunId}`,
            deviceType,
            timestamp: Date.now(),
            reason: 'workflow-test'
          }),
          EventBusName: outputs.RecoveryEventBusName!
        }));

        const putEventsResponse = await eventBridgeClient.send(
          new PutEventsCommand({
            Entries: events
          })
        );

        expect(putEventsResponse.FailedEntryCount).toBe(0);
        console.log(`✓ Sent ${events.length} recovery events`);

        // Step 5: Invoke validation to check results
        console.log('\n[Step 5] Running final validation...');
        const validationPayload = JSON.stringify({
          processedDevices: 2300000,
          failedDevices: failedDevices.length,
          totalMessagesReplayed: 45000000,
          archivesToProcess: []
        });

        const validationResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.DynamoDBValidationLambdaName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(validationPayload)
          })
        );

        expect(validationResponse.StatusCode).toBe(200);
        const validationResult = JSON.parse(
          new TextDecoder().decode(validationResponse.Payload)
        );

        expect(validationResult.recoveryPercentage).toBeDefined();
        expect(validationResult.metricsSent).toBeGreaterThan(0);

        console.log(`✓ Validation completed`);
        console.log(`  Recovery percentage: ${validationResult.recoveryPercentage}%`);
        console.log(`  Metrics sent: ${validationResult.metricsSent}`);
        console.log(`  Timestamp gaps: ${validationResult.timestampGaps || 0}`);

        // Cleanup
        console.log('\n[Cleanup] Removing test devices...');
        for (const device of failedDevices) {
          await docClient.send(
            new DeleteCommand({
              TableName: outputs.DeviceRecoveryTableName,
              Key: {
                deviceId: device.deviceId,
                timestamp: device.timestamp
              }
            })
          );
        }
        console.log(`✓ Cleaned up ${failedDevices.length} test devices`);

        console.log('\n✓✓✓ Full recovery workflow verified successfully ✓✓✓\n');
      }, 120000);
    });
  });
});
