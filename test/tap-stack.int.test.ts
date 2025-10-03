import {
  KinesisClient,
  DescribeStreamCommand,
  PutRecordCommand,
  PutRecordsCommand,
} from '@aws-sdk/client-kinesis';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  GetBucketLifecycleConfigurationCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK Clients
const kinesisClient = new KinesisClient({});
const dynamodbClient = new DynamoDBClient({});
const s3Client = new S3Client({});
const snsClient = new SNSClient({});
const cloudwatchClient = new CloudWatchClient({});

// Resource names from outputs
const streamName = outputs.StreamName;
const tableName = outputs.TableName;
const bucketName = outputs.ArchiveBucketName;
const topicArn = outputs.AlertTopicArn;

// Track test data for cleanup
const testDataToCleanup: Array<{ type: string; key: string; timestamp?: number }> = [];

describe('GPS Tracking System Integration Tests', () => {
  // Cleanup after all tests
  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');
    
    // Clean up DynamoDB items
    for (const item of testDataToCleanup) {
      try {
        if (item.type === 'dynamodb' && item.timestamp) {
          await dynamodbClient.send(new DeleteItemCommand({
            TableName: tableName,
            Key: {
              vehicleId: { S: item.key },
              timestamp: { N: String(item.timestamp) },
            },
          }));
          console.log(`  ✅ Deleted DynamoDB item: ${item.key}`);
        } else if (item.type === 's3') {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: item.key,
          }));
          console.log(`  ✅ Deleted S3 object: ${item.key}`);
        }
      } catch (error) {
        console.log(`  ⚠️ Failed to cleanup ${item.type} ${item.key}:`, error);
      }
    }
    
    console.log('✅ Cleanup completed');
  });
  describe('Kinesis Stream Operations', () => {
    test('should describe Kinesis stream and verify it is ACTIVE', async () => {
      const command = new DescribeStreamCommand({
        StreamName: streamName,
      });
      const response = await kinesisClient.send(command);
      
      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription!.StreamStatus).toBe('ACTIVE');
      expect(response.StreamDescription!.StreamName).toBe(streamName);
    }, 30000);

    test('should successfully put a single GPS record to Kinesis', async () => {
      const gpsData = {
        vehicleId: 'VEHICLE-001',
        timestamp: Date.now(),
        latitude: 37.7749,
        longitude: -122.4194,
        speed: 55,
        heading: 180,
        deliveryId: 'DELIVERY-001',
        expectedDeliveryTime: Date.now() + 3600000,
        deliveryStatus: 'IN_TRANSIT',
      };

      const command = new PutRecordCommand({
        StreamName: streamName,
        Data: Buffer.from(JSON.stringify(gpsData)),
        PartitionKey: gpsData.vehicleId,
      });

      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
      expect(response.ShardId).toBeDefined();
    }, 30000);

    test('should successfully put batch of GPS records to Kinesis', async () => {
      const records = Array.from({ length: 5 }, (_, i) => ({
        Data: Buffer.from(JSON.stringify({
          vehicleId: `VEHICLE-${String(i).padStart(3, '0')}`,
          timestamp: Date.now(),
          latitude: 37.7749 + i * 0.01,
          longitude: -122.4194 + i * 0.01,
          speed: 50 + i,
          heading: 180,
          deliveryId: `DELIVERY-${String(i).padStart(3, '0')}`,
          expectedDeliveryTime: Date.now() + 3600000,
          deliveryStatus: 'IN_TRANSIT',
        })),
        PartitionKey: `VEHICLE-${String(i).padStart(3, '0')}`,
      }));

      const command = new PutRecordsCommand({
        StreamName: streamName,
        Records: records,
      });

      const response = await kinesisClient.send(command);
      expect(response.FailedRecordCount).toBe(0);
      expect(response.Records).toHaveLength(5);
    }, 30000);
  });

  describe('DynamoDB Table Operations', () => {
    test('should describe DynamoDB table and verify schema', async () => {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamodbClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.KeySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'vehicleId', KeyType: 'HASH' }),
          expect.objectContaining({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
        ])
      );
    }, 30000);

    test('should put and get vehicle tracking data from DynamoDB', async () => {
      const vehicleId = 'TEST-VEHICLE-001';
      const timestamp = Date.now();

      // Track for cleanup
      testDataToCleanup.push({ type: 'dynamodb', key: vehicleId, timestamp });

      // Put item
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          vehicleId: { S: vehicleId },
          timestamp: { N: String(timestamp) },
          latitude: { N: '37.7749' },
          longitude: { N: '-122.4194' },
          speed: { N: '55' },
          heading: { N: '180' },
          deliveryId: { S: 'TEST-DELIVERY-001' },
          expectedDeliveryTime: { N: String(timestamp + 3600000) },
          deliveryStatus: { S: 'IN_TRANSIT' },
          ttl: { N: String(Math.floor(Date.now() / 1000) + 2592000) },
        },
      });
      await dynamodbClient.send(putCommand);

      // Get item
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          vehicleId: { S: vehicleId },
          timestamp: { N: String(timestamp) },
        },
      });
      const response = await dynamodbClient.send(getCommand);
      
      expect(response.Item).toBeDefined();
      expect(response.Item!.vehicleId.S).toBe(vehicleId);
      expect(response.Item!.deliveryStatus.S).toBe('IN_TRANSIT');
    }, 30000);

    test('should query by delivery status using GSI', async () => {
      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'delivery-status-index',
        KeyConditionExpression: 'deliveryStatus = :status',
        ExpressionAttributeValues: {
          ':status': { S: 'IN_TRANSIT' },
        },
        Limit: 10,
      });

      const response = await dynamodbClient.send(command);
      expect(response.Items).toBeDefined();
      expect(Array.isArray(response.Items)).toBe(true);
    }, 30000);
  });

  describe('S3 Bucket Operations', () => {
    test('should access S3 bucket and verify it exists', async () => {
      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });
      
      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);

    test('should put and get objects from S3 bucket', async () => {
      const key = `test-data/gps-test-${Date.now()}.json`;
      const testData = {
        vehicleId: 'TEST-VEHICLE-S3',
        timestamp: Date.now(),
        latitude: 37.7749,
        longitude: -122.4194,
      };

      // Track for cleanup
      testDataToCleanup.push({ type: 's3', key });

      // Put object
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(testData),
        ContentType: 'application/json',
      });
      await s3Client.send(putCommand);

      // Get object
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      const response = await s3Client.send(getCommand);
      
      expect(response.Body).toBeDefined();
      const body = await response.Body!.transformToString();
      const parsedData = JSON.parse(body);
      expect(parsedData.vehicleId).toBe('TEST-VEHICLE-S3');
    }, 30000);

    test('should verify S3 bucket lifecycle configuration', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      
      const archiveRule = response.Rules!.find(rule => rule.ID === 'archive-old-data');
      expect(archiveRule).toBeDefined();
      expect(archiveRule!.Transitions).toBeDefined();
      expect(archiveRule!.Transitions!.length).toBe(2);
    }, 30000);
  });

  describe('SNS Topic Operations', () => {
    test('should get SNS topic attributes', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });
      
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    }, 30000);

    test('should publish test message to SNS topic', async () => {
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify({
          alert: 'TEST ALERT',
          vehicleId: 'TEST-VEHICLE-001',
          timestamp: new Date().toISOString(),
        }),
        Subject: 'Integration Test Alert',
      });
      
      const response = await snsClient.send(command);
      expect(response.MessageId).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Pipeline Tests', () => {
    test('should process GPS data through complete pipeline', async () => {
      const vehicleId = 'E2E-VEHICLE-001';
      const timestamp = Date.now();
      
      // 1. Put GPS data to Kinesis
      const gpsData = {
        vehicleId,
        timestamp,
        latitude: 37.7749,
        longitude: -122.4194,
        speed: 60,
        heading: 90,
        deliveryId: 'E2E-DELIVERY-001',
        expectedDeliveryTime: timestamp + 3600000,
        deliveryStatus: 'IN_TRANSIT',
      };

      const putRecordCommand = new PutRecordCommand({
        StreamName: streamName,
        Data: Buffer.from(JSON.stringify(gpsData)),
        PartitionKey: vehicleId,
      });
      await kinesisClient.send(putRecordCommand);

      // 2. Wait for Lambda to process (adjust wait time as needed)
      await new Promise(resolve => setTimeout(resolve, 15000));

      // 3. Verify data is in DynamoDB
      const getItemCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          vehicleId: { S: vehicleId },
          timestamp: { N: String(timestamp) },
        },
      });
      
      const response = await dynamodbClient.send(getItemCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item!.vehicleId.S).toBe(vehicleId);
      expect(response.Item!.latitude.N).toBe('37.7749');
    }, 45000);

    test('should handle high volume GPS data ingestion', async () => {
      const batchSize = 25;
      const records = Array.from({ length: batchSize }, (_, i) => ({
        Data: Buffer.from(JSON.stringify({
          vehicleId: `BULK-VEHICLE-${String(i).padStart(3, '0')}`,
          timestamp: Date.now() + i,
          latitude: 37.7749 + i * 0.001,
          longitude: -122.4194 + i * 0.001,
          speed: 50 + (i % 20),
          heading: (i * 15) % 360,
          deliveryId: `BULK-DELIVERY-${String(i).padStart(3, '0')}`,
          expectedDeliveryTime: Date.now() + 3600000,
          deliveryStatus: 'IN_TRANSIT',
        })),
        PartitionKey: `BULK-VEHICLE-${String(i).padStart(3, '0')}`,
      }));

      const command = new PutRecordsCommand({
        StreamName: streamName,
        Records: records,
      });

      const response = await kinesisClient.send(command);
      expect(response.FailedRecordCount).toBe(0);
      expect(response.Records).toHaveLength(batchSize);
    }, 30000);
  });

  describe('Monitoring and Observability', () => {
    test('should retrieve Kinesis stream metrics from CloudWatch', async () => {
      const command = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Kinesis',
        MetricName: 'IncomingRecords',
        Dimensions: [
          {
            Name: 'StreamName',
            Value: streamName,
          },
        ],
        StartTime: new Date(Date.now() - 3600000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum'],
      });

      const response = await cloudwatchClient.send(command);
      expect(response.Datapoints).toBeDefined();
      expect(Array.isArray(response.Datapoints)).toBe(true);
    }, 30000);

    test('should retrieve DynamoDB table metrics from CloudWatch', async () => {
      const command = new GetMetricStatisticsCommand({
        Namespace: 'AWS/DynamoDB',
        MetricName: 'ConsumedReadCapacityUnits',
        Dimensions: [
          {
            Name: 'TableName',
            Value: tableName,
          },
        ],
        StartTime: new Date(Date.now() - 3600000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum'],
      });

      const response = await cloudwatchClient.send(command);
      expect(response.Datapoints).toBeDefined();
      expect(Array.isArray(response.Datapoints)).toBe(true);
    }, 30000);
  });

  describe('Error Handling and Resilience', () => {
    test('should handle malformed GPS data gracefully', async () => {
      const malformedData = {
        vehicleId: 'MALFORMED-VEHICLE',
        // Missing required fields
        timestamp: Date.now(),
      };

      const command = new PutRecordCommand({
        StreamName: streamName,
        Data: Buffer.from(JSON.stringify(malformedData)),
        PartitionKey: malformedData.vehicleId,
      });

      // Should not throw - Kinesis accepts any data
      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
    }, 30000);

    test('should handle empty GPS data', async () => {
      const emptyData = {};

      const command = new PutRecordCommand({
        StreamName: streamName,
        Data: Buffer.from(JSON.stringify(emptyData)),
        PartitionKey: 'EMPTY-DATA',
      });

      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
    }, 30000);
  });
});
