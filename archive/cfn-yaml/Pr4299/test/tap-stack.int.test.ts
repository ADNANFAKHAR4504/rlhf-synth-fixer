import fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import {
  KinesisClient,
  DescribeStreamCommand,
  PutRecordCommand
} from '@aws-sdk/client-kinesis';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand
} from '@aws-sdk/client-lambda';
import {
  IoTClient,
  DescribeThingCommand,
  ListTopicRulesCommand,
  GetTopicRuleCommand
} from '@aws-sdk/client-iot';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'us-east-1';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const kinesisClient = new KinesisClient({ region });
const lambdaClient = new LambdaClient({ region });
const iotClient = new IoTClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('Manufacturing IoT Data Processing Pipeline - Integration Tests', () => {
  describe('DynamoDB Table', () => {
    test('should exist and be ACTIVE', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.SensorDataTableName
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(outputs.SensorDataTableName);
    });

    test('should have correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.SensorDataTableName
      });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table?.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema?.[0].AttributeName).toBe('deviceId');
      expect(keySchema?.[0].KeyType).toBe('HASH');
      expect(keySchema?.[1].AttributeName).toBe('timestamp');
      expect(keySchema?.[1].KeyType).toBe('RANGE');
    });

    test('should have encryption enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.SensorDataTableName
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    test('should be able to write and read data', async () => {
      const testData = {
        deviceId: { S: 'test-device-001' },
        timestamp: { N: Date.now().toString() },
        sensorType: { S: 'temperature' },
        value: { N: '45.5' },
        status: { S: 'NORMAL' },
        anomalyDetected: { BOOL: false }
      };

      // Write data
      const putCommand = new PutItemCommand({
        TableName: outputs.SensorDataTableName,
        Item: testData
      });
      await dynamoClient.send(putCommand);

      // Read data
      const queryCommand = new QueryCommand({
        TableName: outputs.SensorDataTableName,
        KeyConditionExpression: 'deviceId = :deviceId',
        ExpressionAttributeValues: {
          ':deviceId': { S: 'test-device-001' }
        },
        Limit: 1
      });
      const queryResponse = await dynamoClient.send(queryCommand);

      expect(queryResponse.Items).toBeDefined();
      expect(queryResponse.Items?.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket', () => {
    test('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.RawDataBucketName
      });
      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.RawDataBucketName
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = response.ServerSideEncryptionConfiguration?.Rules;
      expect(rules).toBeDefined();
      expect(rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have lifecycle policy configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.RawDataBucketName
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      const rule = response.Rules?.[0];
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Transitions).toBeDefined();
      expect(rule?.Transitions?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Kinesis Stream', () => {
    test('should exist and be ACTIVE', async () => {
      const command = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName
      });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription?.StreamStatus).toBe('ACTIVE');
      expect(response.StreamDescription?.StreamName).toBe(outputs.KinesisStreamName);
    });

    test('should have correct shard count', async () => {
      const command = new DescribeStreamCommand({
        StreamName: outputs.KinesisStreamName
      });
      const response = await kinesisClient.send(command);

      const shards = response.StreamDescription?.Shards;
      expect(shards).toBeDefined();
      expect(shards?.length).toBe(1);
    });

    test('should accept data and trigger Lambda processing', async () => {
      // Send test data to Kinesis
      const testPayload = {
        deviceId: 'integration-test-device',
        sensorType: 'temperature',
        value: 45.5,
        timestamp: Date.now()
      };

      const command = new PutRecordCommand({
        StreamName: outputs.KinesisStreamName,
        Data: Buffer.from(JSON.stringify(testPayload)),
        PartitionKey: testPayload.deviceId
      });

      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
      expect(response.ShardId).toBeDefined();

      // Wait a bit for Lambda to process
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify data was processed and stored in DynamoDB
      const queryCommand = new QueryCommand({
        TableName: outputs.SensorDataTableName,
        KeyConditionExpression: 'deviceId = :deviceId',
        ExpressionAttributeValues: {
          ':deviceId': { S: 'integration-test-device' }
        },
        ScanIndexForward: false,
        Limit: 1
      });

      const queryResponse = await dynamoClient.send(queryCommand);
      expect(queryResponse.Items).toBeDefined();
      expect(queryResponse.Items?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Lambda Function', () => {
    test('should exist and be active', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.DataProcessorFunctionName
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.DataProcessorFunctionName);
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
    });

    test('should have correct environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.DataProcessorFunctionName
      });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.DYNAMODB_TABLE).toBe(outputs.SensorDataTableName);
      expect(envVars?.S3_BUCKET).toBe(outputs.RawDataBucketName);
      expect(envVars?.TEMP_THRESHOLD_HIGH).toBe('80');
      expect(envVars?.TEMP_THRESHOLD_LOW).toBe('10');
    });

    test('should have correct timeout and memory', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.DataProcessorFunctionName
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Timeout).toBe(60);
      expect(response.Configuration?.MemorySize).toBe(256);
    });
  });

  describe('IoT Resources', () => {
    test('IoT Thing should exist', async () => {
      const command = new DescribeThingCommand({
        thingName: outputs.IoTThingName
      });
      const response = await iotClient.send(command);

      expect(response.thingName).toBe(outputs.IoTThingName);
      expect(response.attributes).toBeDefined();
      expect(response.attributes?.deviceType).toBe('sensor');
      expect(response.attributes?.location).toBe('manufacturing-floor');
    });

    test('IoT Topic Rule should exist and be enabled', async () => {
      const listCommand = new ListTopicRulesCommand({});
      const listResponse = await iotClient.send(listCommand);

      const ruleName = `SensorDataRule_${outputs.EnvironmentSuffix}`;
      const rules = listResponse.rules?.filter(r => r.ruleName === ruleName);
      expect(rules).toBeDefined();
      expect(rules?.length).toBeGreaterThan(0);
      expect(rules?.[0].ruleDisabled).toBe(false);
    });
  });

  describe('CloudWatch Resources', () => {
    test('Log group should exist for Lambda function', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${outputs.DataProcessorFunctionName}`
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(`/aws/lambda/${outputs.DataProcessorFunctionName}`);
    });

    test('CloudWatch alarms should exist', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudwatchClient.send(command);

      const alarmNames = response.MetricAlarms?.map(a => a.AlarmName) || [];

      // Check for Lambda error alarm
      const lambdaErrorAlarm = alarmNames.find(name =>
        name?.includes('IoT-Lambda-Errors') && name?.includes(outputs.EnvironmentSuffix)
      );
      expect(lambdaErrorAlarm).toBeDefined();

      // Check for anomaly alarm
      const anomalyAlarm = alarmNames.find(name =>
        name?.includes('IoT-High-Anomalies') && name?.includes(outputs.EnvironmentSuffix)
      );
      expect(anomalyAlarm).toBeDefined();

      // Check for Kinesis iterator age alarm
      const kinesisAlarm = alarmNames.find(name =>
        name?.includes('IoT-Kinesis-Iterator-Age') && name?.includes(outputs.EnvironmentSuffix)
      );
      expect(kinesisAlarm).toBeDefined();
    });
  });

  describe('End-to-End Data Flow', () => {
    test('should process sensor data through entire pipeline', async () => {
      const testPayload = {
        deviceId: 'e2e-test-device',
        sensorType: 'temperature',
        value: 85.0, // Above threshold - should trigger anomaly
        timestamp: Date.now()
      };

      // 1. Send data to Kinesis
      const putRecordCommand = new PutRecordCommand({
        StreamName: outputs.KinesisStreamName,
        Data: Buffer.from(JSON.stringify(testPayload)),
        PartitionKey: testPayload.deviceId
      });

      const putResponse = await kinesisClient.send(putRecordCommand);
      expect(putResponse.SequenceNumber).toBeDefined();

      // 2. Wait for Lambda to process
      await new Promise(resolve => setTimeout(resolve, 10000));

      // 3. Verify data in DynamoDB
      const queryCommand = new QueryCommand({
        TableName: outputs.SensorDataTableName,
        KeyConditionExpression: 'deviceId = :deviceId',
        ExpressionAttributeValues: {
          ':deviceId': { S: 'e2e-test-device' }
        },
        ScanIndexForward: false,
        Limit: 1
      });

      const queryResponse = await dynamoClient.send(queryCommand);
      expect(queryResponse.Items).toBeDefined();
      expect(queryResponse.Items?.length).toBeGreaterThan(0);

      const item = queryResponse.Items?.[0];
      expect(item?.sensorType.S).toBe('temperature');
      expect(item?.anomalyDetected.BOOL).toBe(true); // Should detect anomaly
      expect(item?.status.S).toBe('ANOMALY');

      // 4. Check that raw data was archived to S3
      await new Promise(resolve => setTimeout(resolve, 2000));

      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.RawDataBucketName,
        Prefix: 'raw/e2e-test-device/'
      });

      const listResponse = await s3Client.send(listCommand);
      expect(listResponse.Contents).toBeDefined();
      expect(listResponse.Contents?.length).toBeGreaterThan(0);
    }, 60000);

    test('should correctly classify normal sensor readings', async () => {
      const normalPayload = {
        deviceId: 'normal-sensor-device',
        sensorType: 'temperature',
        value: 25.0, // Normal range
        timestamp: Date.now()
      };

      // Send data to Kinesis
      const putCommand = new PutRecordCommand({
        StreamName: outputs.KinesisStreamName,
        Data: Buffer.from(JSON.stringify(normalPayload)),
        PartitionKey: normalPayload.deviceId
      });

      await kinesisClient.send(putCommand);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Verify classification in DynamoDB
      const queryCommand = new QueryCommand({
        TableName: outputs.SensorDataTableName,
        KeyConditionExpression: 'deviceId = :deviceId',
        ExpressionAttributeValues: {
          ':deviceId': { S: 'normal-sensor-device' }
        },
        ScanIndexForward: false,
        Limit: 1
      });

      const queryResponse = await dynamoClient.send(queryCommand);
      expect(queryResponse.Items?.length).toBeGreaterThan(0);

      const item = queryResponse.Items?.[0];
      expect(item?.anomalyDetected.BOOL).toBe(false);
      expect(item?.status.S).toBe('NORMAL');
    }, 30000);
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include environment suffix', () => {
      expect(outputs.SensorDataTableName).toContain(outputs.EnvironmentSuffix);
      expect(outputs.RawDataBucketName).toContain(outputs.EnvironmentSuffix);
      expect(outputs.KinesisStreamName).toContain(outputs.EnvironmentSuffix);
      expect(outputs.DataProcessorFunctionName).toContain(outputs.EnvironmentSuffix);
      expect(outputs.IoTThingName).toContain(outputs.EnvironmentSuffix);
    });
  });
});
