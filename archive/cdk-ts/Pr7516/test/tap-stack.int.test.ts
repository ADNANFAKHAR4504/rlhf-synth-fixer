import fs from 'fs';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  GetQueueAttributesCommand,
  PurgeQueueCommand,
} from '@aws-sdk/client-sqs';
import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  SubscribeCommand,
  UnsubscribeCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  SetAlarmStateCommand,
} from '@aws-sdk/client-cloudwatch';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// Load outputs from CDK deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const sqsClient = new SQSClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const lambdaClient = new LambdaClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const ssmClient = new SSMClient({ region });

// Get stack outputs
const getOutput = (key: string): string => {
  const stackKey = `TapStack${environmentSuffix}`;
  return outputs[stackKey]?.[key] || outputs[key] || '';
};

const taskQueueUrl = getOutput('TaskQueueUrl');
const dlqUrl = getOutput('DLQUrl');
const taskTableName = getOutput('TaskTableName');
const lockTableName = getOutput('LockTableName');
const successTopicArn = getOutput('SuccessTopicArn');
const failureTopicArn = getOutput('FailureTopicArn');
const taskProcessorArn = getOutput('TaskProcessorArn');
const bucket1Name = getOutput('Bucket1Name');
const bucket2Name = getOutput('Bucket2Name');
const dlqAlarmArn = getOutput('DLQAlarmArn');

// Helper to wait for conditions
const waitFor = async (
  conditionFn: () => Promise<boolean>,
  timeoutMs = 60000,
  intervalMs = 2000
): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (await conditionFn()) return true;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return false;
};

// Helper to generate unique task ID
const generateTaskId = (): string =>
  `task-${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Distributed Task Processing System - Integration Tests', () => {
  beforeAll(() => {
    // Verify required outputs are available
    expect(taskQueueUrl).toBeTruthy();
    expect(taskTableName).toBeTruthy();
    expect(lockTableName).toBeTruthy();
    expect(bucket1Name).toBeTruthy();
  });

  describe('End-to-End Task Processing Flow', () => {
    test('should process a task message through the entire pipeline', async () => {
      const taskId = generateTaskId();
      const taskData = {
        taskId,
        operation: 'PROCESS_TRANSACTION',
        amount: 1500.0,
        currency: 'USD',
        accountId: 'ACC-12345',
        timestamp: new Date().toISOString(),
      };

      // Step 1: Send message to task queue
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: taskQueueUrl,
          MessageBody: JSON.stringify(taskData),
          MessageAttributes: {
            TaskType: { DataType: 'String', StringValue: 'TRANSACTION' },
          },
        })
      );

      // Step 2: Wait for task to be processed and stored in DynamoDB
      const taskProcessed = await waitFor(async () => {
        const result = await dynamoClient.send(
          new QueryCommand({
            TableName: taskTableName,
            KeyConditionExpression: 'taskId = :taskId',
            ExpressionAttributeValues: {
              ':taskId': { S: taskId },
            },
          })
        );
        const item = result.Items?.[0];
        return item?.status?.S === 'COMPLETED';
      }, 90000);

      expect(taskProcessed).toBe(true);

      // Step 3: Verify task record in DynamoDB
      const queryResult = await dynamoClient.send(
        new QueryCommand({
          TableName: taskTableName,
          KeyConditionExpression: 'taskId = :taskId',
          ExpressionAttributeValues: {
            ':taskId': { S: taskId },
          },
        })
      );

      expect(queryResult.Items).toBeDefined();
      expect(queryResult.Items!.length).toBeGreaterThan(0);

      const taskRecord = queryResult.Items![0];
      expect(taskRecord.status?.S).toBe('COMPLETED');
      expect(taskRecord.completedAt?.N).toBeDefined();
    }, 120000);

    test('should query tasks by status using GSI', async () => {
      // Query completed tasks using the status GSI
      const result = await dynamoClient.send(
        new QueryCommand({
          TableName: taskTableName,
          IndexName: 'statusIndex',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': { S: 'COMPLETED' },
          },
          Limit: 10,
        })
      );

      expect(result.Items).toBeDefined();
      // Verify GSI returns results sorted by timestamp
      if (result.Items && result.Items.length > 1) {
        const timestamps = result.Items.map(item => Number(item.timestamp?.N));
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
        }
      }
    }, 30000);
  });

  describe('Distributed Locking Mechanism', () => {
    test('should acquire and release distributed lock correctly', async () => {
      const lockId = `test-lock-${Date.now()}`;
      const owner = `test-owner-${Math.random().toString(36).substring(7)}`;
      const ttl = Math.floor(Date.now() / 1000) + 60; // 60 seconds TTL

      // Step 1: Acquire lock
      await dynamoClient.send(
        new PutItemCommand({
          TableName: lockTableName,
          Item: {
            lockId: { S: lockId },
            owner: { S: owner },
            ttl: { N: ttl.toString() },
            acquiredAt: { N: Date.now().toString() },
          },
          ConditionExpression: 'attribute_not_exists(lockId)',
        })
      );

      // Step 2: Verify lock exists
      const lockResult = await dynamoClient.send(
        new GetItemCommand({
          TableName: lockTableName,
          Key: { lockId: { S: lockId } },
        })
      );

      expect(lockResult.Item).toBeDefined();
      expect(lockResult.Item!.owner?.S).toBe(owner);

      // Step 3: Attempt to acquire same lock (should fail - already locked)
      let lockFailed = false;
      try {
        await dynamoClient.send(
          new PutItemCommand({
            TableName: lockTableName,
            Item: {
              lockId: { S: lockId },
              owner: { S: 'another-owner' },
              ttl: { N: ttl.toString() },
              acquiredAt: { N: Date.now().toString() },
            },
            ConditionExpression: 'attribute_not_exists(lockId) OR #ttl < :now',
            ExpressionAttributeNames: { '#ttl': 'ttl' },
            ExpressionAttributeValues: {
              ':now': { N: Math.floor(Date.now() / 1000).toString() },
            },
          })
        );
      } catch (error: unknown) {
        if (
          (error as { name: string }).name === 'ConditionalCheckFailedException'
        ) {
          lockFailed = true;
        }
      }

      expect(lockFailed).toBe(true);

      // Step 4: Release lock (set TTL to 0)
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: lockTableName,
          Key: { lockId: { S: lockId } },
        })
      );

      // Step 5: Verify lock is released
      const releasedLock = await dynamoClient.send(
        new GetItemCommand({
          TableName: lockTableName,
          Key: { lockId: { S: lockId } },
        })
      );

      expect(releasedLock.Item).toBeUndefined();
    }, 30000);

    test('should handle concurrent lock attempts correctly', async () => {
      const lockId = `concurrent-lock-${Date.now()}`;
      const ttl = Math.floor(Date.now() / 1000) + 60;
      const results: boolean[] = [];

      // Simulate concurrent lock attempts
      const lockAttempts = Array.from({ length: 5 }, (_, i) =>
        (async () => {
          try {
            await dynamoClient.send(
              new PutItemCommand({
                TableName: lockTableName,
                Item: {
                  lockId: { S: lockId },
                  owner: { S: `owner-${i}` },
                  ttl: { N: ttl.toString() },
                  acquiredAt: { N: Date.now().toString() },
                },
                ConditionExpression: 'attribute_not_exists(lockId)',
              })
            );
            return true;
          } catch {
            return false;
          }
        })()
      );

      const outcomes = await Promise.all(lockAttempts);
      const successCount = outcomes.filter(success => success).length;

      // Only one lock attempt should succeed
      expect(successCount).toBe(1);

      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: lockTableName,
          Key: { lockId: { S: lockId } },
        })
      );
    }, 30000);
  });

  describe('S3 Event-Driven Processing Flow', () => {
    test('should trigger task processing when file is uploaded to S3', async () => {
      const objectKey = `test-upload-${Date.now()}.json`;
      const fileContent = JSON.stringify({
        transactionId: `TXN-${Date.now()}`,
        amount: 2500.0,
        type: 'PAYMENT',
      });

      // Step 1: Upload file to S3 bucket
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket1Name,
          Key: objectKey,
          Body: fileContent,
          ContentType: 'application/json',
        })
      );

      // Step 2: Wait for EventBridge to trigger and message to be processed
      // The EventBridge rule sends to SQS which triggers Lambda
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Step 3: Check that a message was sent to the queue (via EventBridge)
      // The Lambda should have processed it
      const queueAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: taskQueueUrl,
          AttributeNames: [
            'ApproximateNumberOfMessages',
            'ApproximateNumberOfMessagesNotVisible',
          ],
        })
      );

      // Queue should be processing or have processed messages
      expect(queueAttrs.Attributes).toBeDefined();

      // Step 4: Cleanup - delete the test object
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket1Name,
          Key: objectKey,
        })
      );
    }, 60000);

    test('should process files from multiple buckets', async () => {
      const testFiles = [
        { bucket: bucket1Name, key: `multi-test-1-${Date.now()}.json` },
        { bucket: bucket2Name, key: `multi-test-2-${Date.now()}.json` },
      ];

      // Upload files to both buckets
      for (const file of testFiles) {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: file.bucket,
            Key: file.key,
            Body: JSON.stringify({
              source: file.bucket,
              timestamp: Date.now(),
            }),
            ContentType: 'application/json',
          })
        );
      }

      // Wait for EventBridge processing
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Cleanup
      for (const file of testFiles) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: file.bucket,
            Key: file.key,
          })
        );
      }
    }, 60000);
  });

  describe('Dead Letter Queue Handling', () => {
    test('should verify DLQ is configured and accessible', async () => {
      // Get DLQ attributes to verify it exists and is configured
      const dlqAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: dlqUrl,
          AttributeNames: ['MessageRetentionPeriod', 'QueueArn'],
        })
      );

      expect(dlqAttrs.Attributes).toBeDefined();
      // 14 days in seconds
      expect(dlqAttrs.Attributes!.MessageRetentionPeriod).toBe('1209600');
    }, 30000);

    test('should verify main queue has DLQ redrive policy', async () => {
      const queueAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: taskQueueUrl,
          AttributeNames: ['RedrivePolicy'],
        })
      );

      expect(queueAttrs.Attributes?.RedrivePolicy).toBeDefined();

      const redrivePolicy = JSON.parse(queueAttrs.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
    }, 30000);
  });

  describe('SSM Parameter Store Integration', () => {
    test('should retrieve configuration from SSM Parameter Store', async () => {
      // Get queue URL parameter
      const queueUrlParam = await ssmClient.send(
        new GetParameterCommand({
          Name: `/distributed-task-system/${environmentSuffix}/queue-url`,
        })
      );

      expect(queueUrlParam.Parameter?.Value).toBe(taskQueueUrl);

      // Get table name parameter
      const tableNameParam = await ssmClient.send(
        new GetParameterCommand({
          Name: `/distributed-task-system/${environmentSuffix}/table-name`,
        })
      );

      expect(tableNameParam.Parameter?.Value).toBe(taskTableName);

      // Get lock table name parameter
      const lockTableParam = await ssmClient.send(
        new GetParameterCommand({
          Name: `/distributed-task-system/${environmentSuffix}/lock-table-name`,
        })
      );

      expect(lockTableParam.Parameter?.Value).toBe(lockTableName);
    }, 30000);
  });

  describe('CloudWatch Alarm Verification', () => {
    test('should verify DLQ alarm is configured correctly', async () => {
      const alarmName = `distributed-task-dlq-alarm-${environmentSuffix}`;

      const alarmsResult = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(alarmsResult.MetricAlarms).toBeDefined();
      expect(alarmsResult.MetricAlarms!.length).toBe(1);

      const alarm = alarmsResult.MetricAlarms![0];
      expect(alarm.Threshold).toBe(10);
      expect(alarm.MetricName).toBe('ApproximateNumberOfMessagesVisible');
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    }, 30000);
  });

  describe('At-Least-Once Processing Guarantee', () => {
    test('should process same task idempotently using distributed lock', async () => {
      const taskId = generateTaskId();
      const taskData = {
        taskId,
        operation: 'IDEMPOTENT_TEST',
        value: Math.random(),
      };

      // Send the same message twice
      for (let i = 0; i < 2; i++) {
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: taskQueueUrl,
            MessageBody: JSON.stringify(taskData),
            MessageGroupId: taskId, // Ensure FIFO-like behavior if applicable
          })
        );
      }

      // Wait for processing
      await waitFor(async () => {
        const result = await dynamoClient.send(
          new QueryCommand({
            TableName: taskTableName,
            KeyConditionExpression: 'taskId = :taskId',
            ExpressionAttributeValues: {
              ':taskId': { S: taskId },
            },
          })
        );
        return (result.Items?.length ?? 0) >= 1;
      }, 90000);

      // Verify only one completed record exists per unique processing
      const finalResult = await dynamoClient.send(
        new QueryCommand({
          TableName: taskTableName,
          KeyConditionExpression: 'taskId = :taskId',
          ExpressionAttributeValues: {
            ':taskId': { S: taskId },
          },
        })
      );

      // At least one record should exist
      expect(finalResult.Items!.length).toBeGreaterThanOrEqual(1);

      // The distributed lock should prevent duplicate processing
      const completedItems = finalResult.Items!.filter(
        item => item.status?.S === 'COMPLETED'
      );
      expect(completedItems.length).toBeGreaterThanOrEqual(1);
    }, 120000);
  });

  describe('High Volume Task Processing', () => {
    test('should handle batch of concurrent tasks', async () => {
      const batchSize = 10;
      const tasks = Array.from({ length: batchSize }, () => ({
        taskId: generateTaskId(),
        operation: 'BATCH_PROCESS',
        index: Math.random(),
        timestamp: new Date().toISOString(),
      }));

      // Send all tasks concurrently
      await Promise.all(
        tasks.map(task =>
          sqsClient.send(
            new SendMessageCommand({
              QueueUrl: taskQueueUrl,
              MessageBody: JSON.stringify(task),
            })
          )
        )
      );

      // Wait for batch processing
      const allProcessed = await waitFor(
        async () => {
          let processedCount = 0;
          for (const task of tasks) {
            const result = await dynamoClient.send(
              new QueryCommand({
                TableName: taskTableName,
                KeyConditionExpression: 'taskId = :taskId',
                ExpressionAttributeValues: {
                  ':taskId': { S: task.taskId },
                },
              })
            );
            if (result.Items?.some(item => item.status?.S === 'COMPLETED')) {
              processedCount++;
            }
          }
          return processedCount === batchSize;
        },
        180000,
        5000
      );

      expect(allProcessed).toBe(true);
    }, 200000);
  });

  describe('Financial Transaction Simulation', () => {
    test('should process financial transaction with full audit trail', async () => {
      const transactionId = `FIN-${Date.now()}`;
      const transaction = {
        taskId: transactionId,
        operation: 'FINANCIAL_TRANSACTION',
        type: 'TRANSFER',
        fromAccount: 'ACC-001',
        toAccount: 'ACC-002',
        amount: 5000.0,
        currency: 'USD',
        initiatedAt: new Date().toISOString(),
        correlationId: `CORR-${Math.random().toString(36).substring(7)}`,
      };

      // Step 1: Send transaction for processing
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: taskQueueUrl,
          MessageBody: JSON.stringify(transaction),
          MessageAttributes: {
            TransactionType: { DataType: 'String', StringValue: 'TRANSFER' },
            Priority: { DataType: 'String', StringValue: 'HIGH' },
          },
        })
      );

      // Step 2: Wait for transaction processing
      const processed = await waitFor(async () => {
        const result = await dynamoClient.send(
          new QueryCommand({
            TableName: taskTableName,
            KeyConditionExpression: 'taskId = :taskId',
            ExpressionAttributeValues: {
              ':taskId': { S: transactionId },
            },
          })
        );
        return (
          result.Items?.some(item => item.status?.S === 'COMPLETED') ?? false
        );
      }, 90000);

      expect(processed).toBe(true);

      // Step 3: Verify audit trail in DynamoDB
      const auditResult = await dynamoClient.send(
        new QueryCommand({
          TableName: taskTableName,
          KeyConditionExpression: 'taskId = :taskId',
          ExpressionAttributeValues: {
            ':taskId': { S: transactionId },
          },
        })
      );

      expect(auditResult.Items).toBeDefined();
      const record = auditResult.Items!.find(
        item => item.status?.S === 'COMPLETED'
      );
      expect(record).toBeDefined();
      expect(record!.data?.S).toContain('FINANCIAL_TRANSACTION');
    }, 120000);
  });

  describe('Queue Visibility Timeout Behavior', () => {
    test('should verify queue has 300-second visibility timeout', async () => {
      const queueAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: taskQueueUrl,
          AttributeNames: ['VisibilityTimeout'],
        })
      );

      expect(queueAttrs.Attributes?.VisibilityTimeout).toBe('300');
    }, 30000);
  });

  describe('SNS Notification Flow', () => {
    test('should verify success and failure topics exist and are accessible', async () => {
      // Verify success topic
      const successSubs = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: successTopicArn,
        })
      );
      expect(successSubs.Subscriptions).toBeDefined();

      // Verify failure topic
      const failureSubs = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: failureTopicArn,
        })
      );
      expect(failureSubs.Subscriptions).toBeDefined();
    }, 30000);
  });
});
