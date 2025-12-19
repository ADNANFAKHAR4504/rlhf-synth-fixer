import fs from 'fs';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketVersioningCommand,
  GetBucketReplicationCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  KinesisClient,
  DescribeStreamCommand,
  PutRecordCommand,
} from '@aws-sdk/client-kinesis';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeGlobalClustersCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  ListTopicsCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read CloudFormation outputs
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('CloudFormation outputs not found. Some tests may be skipped.');
}

// Initialize AWS SDK clients
const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const kinesisClient = new KinesisClient({ region });
const rdsClient = new RDSClient({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });

describe('Cross-Region Trading Analytics Migration - Integration Tests', () => {
  // Skip tests if outputs are not available (stack not deployed)
  const skipIfNoOutputs = outputs && Object.keys(outputs).length > 0 ? describe : describe.skip;

  skipIfNoOutputs('S3 Cross-Region Replication', () => {
    test('source S3 bucket should exist and have versioning enabled', async () => {
      const bucketName = outputs.HistoricalDataBucketSourceName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('target S3 bucket should exist and have versioning enabled', async () => {
      const bucketName = outputs.HistoricalDataBucketTargetName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('source bucket should have replication configuration', async () => {
      const bucketName = outputs.HistoricalDataBucketSourceName;

      const command = new GetBucketReplicationCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration?.Rules).toHaveLength(1);

      const rule = response.ReplicationConfiguration?.Rules?.[0];
      expect(rule?.Status).toBe('Enabled');
    });

    test('should be able to upload object to source bucket', async () => {
      const bucketName = outputs.HistoricalDataBucketSourceName;
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Test data for replication';

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  skipIfNoOutputs('DynamoDB Global Table', () => {
    test('DynamoDB table should exist and be active', async () => {
      const tableName = outputs.DashboardTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should be able to write to DynamoDB table', async () => {
      const tableName = outputs.DashboardTableName;
      const timestamp = Date.now();

      const command = new PutItemCommand({
        TableName: tableName,
        Item: {
          userId: { S: `test-user-${timestamp}` },
          sessionId: { S: `session-${timestamp}` },
          data: { S: JSON.stringify({ test: true, timestamp }) },
        },
      });

      const response = await dynamoClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should be able to read from DynamoDB table', async () => {
      const tableName = outputs.DashboardTableName;
      const timestamp = Date.now();
      const userId = `test-user-${timestamp}`;
      const sessionId = `session-${timestamp}`;

      // First write an item
      await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            userId: { S: userId },
            sessionId: { S: sessionId },
            data: { S: JSON.stringify({ test: true }) },
          },
        })
      );

      // Then read it back
      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          userId: { S: userId },
          sessionId: { S: sessionId },
        },
      });

      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.userId.S).toBe(userId);
    });
  });

  skipIfNoOutputs('Kinesis Data Stream', () => {
    test('Kinesis stream should exist and be active', async () => {
      const streamName = outputs.KinesisStreamName;
      expect(streamName).toBeDefined();

      const command = new DescribeStreamCommand({ StreamName: streamName });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription?.StreamStatus).toBe('ACTIVE');
    });

    test('Kinesis stream should have encryption enabled', async () => {
      const streamName = outputs.KinesisStreamName;

      const command = new DescribeStreamCommand({ StreamName: streamName });
      const response = await kinesisClient.send(command);

      expect(response.StreamDescription?.EncryptionType).toBe('KMS');
    });

    test('should be able to put record to Kinesis stream', async () => {
      const streamName = outputs.KinesisStreamName;
      const testData = {
        timestamp: Date.now(),
        marketData: {
          symbol: 'TEST',
          price: 100.50,
          volume: 1000,
        },
      };

      const command = new PutRecordCommand({
        StreamName: streamName,
        Data: Buffer.from(JSON.stringify(testData)),
        PartitionKey: 'test-partition',
      });

      const response = await kinesisClient.send(command);
      expect(response.SequenceNumber).toBeDefined();
    });
  });

  skipIfNoOutputs('Aurora Global Database', () => {
    test('Aurora global cluster should exist', async () => {
      const globalClusterId = `trading-analytics-global-${environmentSuffix}`;

      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: globalClusterId,
      });

      const response = await rdsClient.send(command);
      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters?.length).toBeGreaterThan(0);
    });

    test('Aurora primary cluster should exist and be available', async () => {
      const clusterId = `trading-analytics-primary-${environmentSuffix}`;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.[0]?.Status).toBe('available');
    });

    test('Aurora should have encryption enabled', async () => {
      const clusterId = `trading-analytics-primary-${environmentSuffix}`;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters?.[0]?.StorageEncrypted).toBe(true);
    });
  });

  skipIfNoOutputs('Lambda Functions', () => {
    test('data transform Lambda function should exist', async () => {
      const functionName = `trading-analytics-transform-${environmentSuffix}`;

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('dashboard API Lambda function should exist', async () => {
      const functionName = `trading-analytics-dashboard-api-${environmentSuffix}`;

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('should be able to invoke dashboard API Lambda', async () => {
      const functionName = `trading-analytics-dashboard-api-${environmentSuffix}`;

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({
          httpMethod: 'GET',
          pathParameters: {
            userId: 'test-user',
            sessionId: 'test-session',
          },
        }),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        expect(result.statusCode).toBeDefined();
      }
    });
  });

  skipIfNoOutputs('API Gateway', () => {
    test('API Gateway should exist', async () => {
      // Extract API ID from API endpoint
      const apiEndpoint = outputs.ApiEndpoint;
      expect(apiEndpoint).toBeDefined();

      const apiIdMatch = apiEndpoint.match(/https:\/\/([a-z0-9]+)\.execute-api/);
      expect(apiIdMatch).not.toBeNull();

      if (apiIdMatch) {
        const apiId = apiIdMatch[1];
        const command = new GetRestApiCommand({ restApiId: apiId });
        const response = await apiGatewayClient.send(command);

        expect(response.name).toContain('trading-analytics-dashboard-api');
      }
    });

    test('API Gateway stage should be deployed', async () => {
      const apiEndpoint = outputs.ApiEndpoint;
      const apiIdMatch = apiEndpoint.match(/https:\/\/([a-z0-9]+)\.execute-api/);

      if (apiIdMatch) {
        const apiId = apiIdMatch[1];
        const command = new GetStageCommand({
          restApiId: apiId,
          stageName: 'prod',
        });

        const response = await apiGatewayClient.send(command);
        expect(response.stageName).toBe('prod');
      }
    });
  });

  skipIfNoOutputs('CloudWatch Monitoring', () => {
    test('replication lag alarm should exist', async () => {
      const alarmName = `trading-analytics-replication-lag-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0]?.AlarmName).toBe(alarmName);
    });

    test('database CPU alarm should exist', async () => {
      const alarmName = `trading-analytics-db-cpu-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0]?.AlarmName).toBe(alarmName);
    });

    test('API error alarm should exist', async () => {
      const alarmName = `trading-analytics-api-errors-${environmentSuffix}`;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);
      expect(response.MetricAlarms?.[0]?.AlarmName).toBe(alarmName);
    });
  });

  skipIfNoOutputs('SNS Topics', () => {
    test('migration status topic should exist', async () => {
      const topicArn = outputs.MigrationStatusTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('SNS topic should have KMS encryption', async () => {
      const topicArn = outputs.MigrationStatusTopicArn;

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  skipIfNoOutputs('End-to-End Workflow', () => {
    test('complete data pipeline workflow', async () => {
      // 1. Put data in Kinesis
      const streamName = outputs.KinesisStreamName;
      const testData = {
        timestamp: Date.now(),
        action: 'e2e-test',
        data: { test: true },
      };

      const kinesisResponse = await kinesisClient.send(
        new PutRecordCommand({
          StreamName: streamName,
          Data: Buffer.from(JSON.stringify(testData)),
          PartitionKey: 'e2e-test',
        })
      );

      expect(kinesisResponse.SequenceNumber).toBeDefined();

      // 2. Write to DynamoDB
      const tableName = outputs.DashboardTableName;
      const timestamp = Date.now();

      const dynamoResponse = await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            userId: { S: `e2e-user-${timestamp}` },
            sessionId: { S: `e2e-session-${timestamp}` },
            data: { S: JSON.stringify(testData) },
          },
        })
      );

      expect(dynamoResponse.$metadata.httpStatusCode).toBe(200);

      // 3. Verify data in DynamoDB
      const getResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            userId: { S: `e2e-user-${timestamp}` },
            sessionId: { S: `e2e-session-${timestamp}` },
          },
        })
      );

      expect(getResponse.Item).toBeDefined();

      // 4. Upload to S3
      const bucketName = outputs.HistoricalDataBucketSourceName;
      const s3Key = `e2e-test-${timestamp}.json`;

      const s3Response = await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: JSON.stringify(testData),
        })
      );

      expect(s3Response.$metadata.httpStatusCode).toBe(200);
    }, 30000); // 30 second timeout for end-to-end test
  });
});
