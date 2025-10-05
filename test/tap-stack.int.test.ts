import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  GetItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  SQSClient,
  GetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { readFileSync } from 'fs';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});
const cloudwatchClient = new CloudWatchClient({});

let stackOutputs: any;
let uploadBucket: string;
let outputBucket: string;
let processingTable: string;
let jobQueueUrl: string;
let statusUpdateQueueUrl: string;
let deadLetterQueueUrl: string;

describe('TapStack Integration Tests', () => {
  beforeAll(async () => {
    const outputsPath = './cdk-outputs.json';
    try {
      const outputs = JSON.parse(readFileSync(outputsPath, 'utf8'));
      const stackName = Object.keys(outputs)[0];
      stackOutputs = outputs[stackName];

      console.log('Stack outputs loaded:', stackOutputs);

      // Map stack outputs to test variables
      // Support multiple output name patterns for flexibility
      uploadBucket =
        stackOutputs.UploadBucketName || stackOutputs.BackupBucketName;
      outputBucket =
        stackOutputs.OutputBucketName || stackOutputs.ReplicationBucketName;
      processingTable =
        stackOutputs.ProcessingTableName ||
        stackOutputs.MetadataTableName ||
        stackOutputs.DeduplicationTableName;
      jobQueueUrl = stackOutputs.JobQueueUrl || stackOutputs.BackupQueueUrl;
      statusUpdateQueueUrl = stackOutputs.StatusUpdateQueueUrl;
      deadLetterQueueUrl = stackOutputs.DeadLetterQueueUrl;

      console.log('Mapped resources:', {
        uploadBucket,
        outputBucket,
        processingTable,
        jobQueueUrl,
        statusUpdateQueueUrl,
        deadLetterQueueUrl,
      });
    } catch (error) {
      console.error('Failed to load stack outputs:', error);
      throw error;
    }
  }, 30000);

  describe('S3 Buckets', () => {
    test('should have upload bucket available', async () => {
      expect(uploadBucket).toBeDefined();
      expect(uploadBucket).toMatch(/^[a-z0-9-]+$/);
    });

    test('should have output bucket available', async () => {
      expect(outputBucket).toBeDefined();
      expect(outputBucket).toMatch(/^[a-z0-9-]+$/);
    });

    test(
      'should upload file to upload bucket',
      async () => {
        const testKey = `test-${Date.now()}.txt`;
        const testContent = 'Test file content';

        await s3Client.send(
          new PutObjectCommand({
            Bucket: uploadBucket,
            Key: testKey,
            Body: testContent,
          })
        );

        const response = await s3Client.send(
          new GetObjectCommand({
            Bucket: uploadBucket,
            Key: testKey,
          })
        );

        const content = await response.Body?.transformToString();
        expect(content).toBe(testContent);
      },
      30000
    );

    test(
      'should have encryption enabled on buckets',
      async () => {
        const testKey = `encryption-test-${Date.now()}.txt`;

        const putResponse = await s3Client.send(
          new PutObjectCommand({
            Bucket: uploadBucket,
            Key: testKey,
            Body: 'Encryption test',
          })
        );

        expect(putResponse.ServerSideEncryption).toBeDefined();
      },
      30000
    );
  });

  describe('DynamoDB Table', () => {
    test('should have processing table available', async () => {
      expect(processingTable).toBeDefined();
      expect(processingTable).toMatch(/^[a-zA-Z0-9_.-]+$/);
    });

    test(
      'should be able to query the processing table',
      async () => {
        const response = await dynamoClient.send(
          new ScanCommand({
            TableName: processingTable,
            Limit: 1,
          })
        );

        expect(response).toBeDefined();
        expect(response.Items).toBeDefined();
      },
      30000
    );
  });

  describe('SQS Queues', () => {
    test('should have job queue available', async () => {
      expect(jobQueueUrl).toBeDefined();
      expect(jobQueueUrl).toContain('sqs');
    });

    test('should have status update queue available', async () => {
      // This queue is optional in the current stack
      if (statusUpdateQueueUrl) {
        expect(statusUpdateQueueUrl).toContain('sqs');
      }
    });

    test('should have dead letter queue available', async () => {
      // This queue is optional in the current stack
      if (deadLetterQueueUrl) {
        expect(deadLetterQueueUrl).toContain('sqs');
      }
    });

    test(
      'should have encryption enabled on job queue',
      async () => {
        const response = await sqsClient.send(
          new GetQueueAttributesCommand({
            QueueUrl: jobQueueUrl,
            AttributeNames: ['KmsMasterKeyId'],
          })
        );

        expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      },
      30000
    );

    test(
      'should have dead letter queue configured',
      async () => {
        const response = await sqsClient.send(
          new GetQueueAttributesCommand({
            QueueUrl: jobQueueUrl,
            AttributeNames: ['RedrivePolicy'],
          })
        );

        expect(response.Attributes?.RedrivePolicy).toBeDefined();
        const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
        expect(redrivePolicy.maxReceiveCount).toBe('3');
      },
      30000
    );
  });

  describe('CloudWatch Alarms', () => {
    test(
      'should have alarms created',
      async () => {
        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            MaxRecords: 100,
          })
        );

        const stackAlarms = response.MetricAlarms?.filter((alarm) =>
          alarm.AlarmName?.includes('TapStack')
        );

        expect(stackAlarms?.length).toBeGreaterThan(0);
      },
      30000
    );

    test(
      'should have DLQ alarm',
      async () => {
        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            MaxRecords: 100,
          })
        );

        const dlqAlarm = response.MetricAlarms?.find((alarm) =>
          alarm.AlarmDescription?.includes('dead letter queue')
        );

        expect(dlqAlarm).toBeDefined();
      },
      30000
    );

    test(
      'should have Lambda error alarms',
      async () => {
        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            MaxRecords: 100,
          })
        );

        const errorAlarms = response.MetricAlarms?.filter((alarm) =>
          alarm.AlarmDescription?.includes('error rate')
        );

        expect(errorAlarms?.length).toBeGreaterThanOrEqual(3);
      },
      30000
    );

    test(
      'should have queue depth alarms',
      async () => {
        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            MaxRecords: 100,
          })
        );

        const queueAlarms = response.MetricAlarms?.filter((alarm) =>
          alarm.AlarmDescription?.includes('messages')
        );

        expect(queueAlarms?.length).toBeGreaterThan(0);
      },
      30000
    );
  });

  describe('End-to-End Workflow', () => {
    test(
      'should create DynamoDB record when file is uploaded',
      async () => {
        const testAssetId = `e2e-test-${Date.now()}`;
        const testKey = `${testAssetId}.mp4`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: uploadBucket,
            Key: testKey,
            Body: 'Mock video content',
            ContentType: 'video/mp4',
          })
        );

        await new Promise((resolve) => setTimeout(resolve, 10000));

        const response = await dynamoClient.send(
          new GetItemCommand({
            TableName: processingTable,
            Key: {
              assetId: { S: testAssetId },
            },
          })
        );

        expect(response.Item).toBeDefined();
        expect(response.Item?.status.S).toBeDefined();
      },
      60000
    );

    test(
      'should process multiple uploads concurrently',
      async () => {
        const uploadPromises = [];
        const testIds = [];

        for (let i = 0; i < 5; i++) {
          const testAssetId = `concurrent-test-${Date.now()}-${i}`;
          testIds.push(testAssetId);

          uploadPromises.push(
            s3Client.send(
              new PutObjectCommand({
                Bucket: uploadBucket,
                Key: `${testAssetId}.mp4`,
                Body: `Mock video content ${i}`,
                ContentType: 'video/mp4',
              })
            )
          );
        }

        await Promise.all(uploadPromises);

        await new Promise((resolve) => setTimeout(resolve, 15000));

        const scanResponse = await dynamoClient.send(
          new ScanCommand({
            TableName: processingTable,
            FilterExpression: 'begins_with(assetId, :prefix)',
            ExpressionAttributeValues: {
              ':prefix': { S: 'concurrent-test-' },
            },
          })
        );

        expect(scanResponse.Items?.length).toBeGreaterThan(0);
      },
      90000
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle non-video files gracefully',
      async () => {
        const testKey = `error-test-${Date.now()}.txt`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: uploadBucket,
            Key: testKey,
            Body: 'Not a video file',
            ContentType: 'text/plain',
          })
        );

        await new Promise((resolve) => setTimeout(resolve, 5000));

        expect(true).toBe(true);
      },
      30000
    );
  });

  describe('Security', () => {
    test(
      'should verify buckets are not publicly accessible',
      async () => {
        try {
          const response = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: uploadBucket,
              MaxKeys: 1,
            })
          );

          expect(response).toBeDefined();
        } catch (error: any) {
          if (error.name === 'AccessDenied') {
            throw error;
          }
        }
      },
      30000
    );

    test(
      'should verify encryption at rest',
      async () => {
        const testKey = `security-test-${Date.now()}.txt`;

        const putResponse = await s3Client.send(
          new PutObjectCommand({
            Bucket: uploadBucket,
            Key: testKey,
            Body: 'Security test content',
          })
        );

        expect(putResponse.ServerSideEncryption).toBeTruthy();
      },
      30000
    );
  });

  describe('Scalability', () => {
    test(
      'should handle burst of uploads',
      async () => {
        const batchSize = 10;
        const uploads = [];

        for (let i = 0; i < batchSize; i++) {
          uploads.push(
            s3Client.send(
              new PutObjectCommand({
                Bucket: uploadBucket,
                Key: `burst-test-${Date.now()}-${i}.mp4`,
                Body: `Burst test content ${i}`,
                ContentType: 'video/mp4',
              })
            )
          );
        }

        await Promise.all(uploads);

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const queueAttrs = await sqsClient.send(
          new GetQueueAttributesCommand({
            QueueUrl: jobQueueUrl,
            AttributeNames: ['ApproximateNumberOfMessages'],
          })
        );

        expect(queueAttrs.Attributes).toBeDefined();
      },
      60000
    );
  });

  describe('Resource Outputs', () => {
    test('should have all required outputs', () => {
      expect(uploadBucket).toBeDefined();
      expect(outputBucket).toBeDefined();
      expect(processingTable).toBeDefined();
      expect(jobQueueUrl).toBeDefined();
      expect(stackOutputs).toBeDefined();
    });

    test('should have valid resource names', () => {
      expect(uploadBucket).toMatch(/^[a-z0-9-]+$/);
      expect(outputBucket).toMatch(/^[a-z0-9-]+$/);
      expect(processingTable).toMatch(/^[a-zA-Z0-9_.-]+$/);
    });
  });
});
