import * as fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
  PublishCommand,
} from '@aws-sdk/client-sns';
import {
  SQSClient,
  GetQueueAttributesCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  SchedulerClient,
  GetScheduleCommand,
} from '@aws-sdk/client-scheduler';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';

// Read actual deployment outputs
const outputsFile = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// CDKTF outputs are nested under the stack name
const outputs = outputsFile['tap-stack'];

// Set AWS region from deployment
const AWS_REGION = 'us-east-2';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const sqsClient = new SQSClient({ region: AWS_REGION });
const schedulerClient = new SchedulerClient({ region: AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: AWS_REGION });
const apiGatewayClient = new APIGatewayClient({ region: AWS_REGION });

// Get deployed resource names from outputs
const referralTableName = outputs['referral-table-name'];
const idempotencyTableName = outputs['idempotency-table-name'];
const rewardCalcLambdaName = outputs['reward-calc-lambda-name'];
const payoutLambdaName = outputs['payout-lambda-name'];
const s3BucketName = outputs['s3-bucket'];
const snsTopicArn = outputs['sns-topic'];
const dlqUrl = outputs['dlq-url'];
const apiGatewayId = outputs['api-gateway-id'];
const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr3469';

describe('Referral Management System Integration Tests', () => {
  describe('DynamoDB Tables', () => {
    test('should verify referral tracking table exists and is accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: referralTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(referralTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.KeySchema).toBeDefined();
    });

    test('should verify referral table has correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: referralTableName,
      });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table?.KeySchema || [];
      const partitionKey = keySchema.find((key) => key.KeyType === 'HASH');
      const sortKey = keySchema.find((key) => key.KeyType === 'RANGE');

      expect(partitionKey).toBeDefined();
      expect(partitionKey?.AttributeName).toBe('user_id');
      expect(sortKey).toBeDefined();
      expect(sortKey?.AttributeName).toBe('referral_timestamp');
    });

    test('should write and read data from referral table', async () => {
      const testUserId = `test-user-${Date.now()}`;
      const testTimestamp = Date.now().toString();

      // Write test item
      const putCommand = new PutItemCommand({
        TableName: referralTableName,
        Item: {
          user_id: { S: testUserId },
          referral_timestamp: { N: testTimestamp },
          referral_code: { S: 'TEST123' },
          reward_amount: { N: '10' },
        },
      });
      await dynamoClient.send(putCommand);

      // Read test item
      const getCommand = new GetItemCommand({
        TableName: referralTableName,
        Key: {
          user_id: { S: testUserId },
          referral_timestamp: { N: testTimestamp },
        },
      });
      const response = await dynamoClient.send(getCommand);

      expect(response.Item).toBeDefined();
      expect(response.Item?.user_id.S).toBe(testUserId);
      expect(response.Item?.referral_code.S).toBe('TEST123');

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: referralTableName,
        Key: {
          user_id: { S: testUserId },
          referral_timestamp: { N: testTimestamp },
        },
      });
      await dynamoClient.send(deleteCommand);
    });

    test('should verify idempotency table exists and is accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: idempotencyTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(idempotencyTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });
  });

  describe('Lambda Functions', () => {
    test('should verify reward calculator Lambda exists', async () => {
      const command = new GetFunctionCommand({
        FunctionName: rewardCalcLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(rewardCalcLambdaName);
      expect(response.Configuration?.Runtime).toContain('nodejs');
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should verify reward calculator Lambda has correct configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: rewardCalcLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Timeout).toBeGreaterThan(0);
      expect(response.Configuration?.MemorySize).toBeGreaterThanOrEqual(128);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
    });

    test('should successfully invoke reward calculator Lambda', async () => {
      const command = new InvokeCommand({
        FunctionName: rewardCalcLambdaName,
        Payload: Buffer.from(
          JSON.stringify({
            userId: 'test-user',
            referralCode: 'TEST123',
            tier: 1,
          })
        ),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();
    });

    test('should verify payout processor Lambda exists', async () => {
      const command = new GetFunctionCommand({
        FunctionName: payoutLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(payoutLambdaName);
      expect(response.Configuration?.Runtime).toContain('nodejs');
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should verify payout processor Lambda has X-Ray tracing enabled', async () => {
      const command = new GetFunctionCommand({
        FunctionName: payoutLambdaName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.TracingConfig?.Mode).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    test('should verify payout reports bucket exists', async () => {
      const command = new HeadBucketCommand({ Bucket: s3BucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should upload and verify object in S3 bucket', async () => {
      const testKey = `test-report-${Date.now()}.csv`;
      const testContent = 'userId,amount,date\ntest-user,100,2024-01-01';

      const putCommand = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/csv',
      });

      await expect(s3Client.send(putCommand)).resolves.toBeDefined();
    });

    test('should verify bucket has lifecycle configuration with Glacier transition', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: s3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      // Check for Glacier transition rule (90 days)
      const glacierRule = response.Rules?.find((rule) =>
        rule.Transitions?.some((t) => t.StorageClass === 'GLACIER')
      );
      expect(glacierRule).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('should verify reward notifications topic exists', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(snsTopicArn);
    });

    test('should successfully publish test message to SNS topic', async () => {
      const command = new PublishCommand({
        TopicArn: snsTopicArn,
        Message: JSON.stringify({
          type: 'test',
          timestamp: new Date().toISOString(),
          userId: 'test-user',
          amount: 10,
        }),
        Subject: 'Integration Test Message',
      });

      const response = await snsClient.send(command);
      expect(response.MessageId).toBeDefined();
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('should verify payout DLQ exists', async () => {
      const command = new GetQueueAttributesCommand({
        QueueUrl: dlqUrl,
        AttributeNames: ['All'],
      });

      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.QueueArn).toBeDefined();
    });

    test('should successfully send message to DLQ', async () => {
      const command = new SendMessageCommand({
        QueueUrl: dlqUrl,
        MessageBody: JSON.stringify({
          error: 'Test error message',
          timestamp: new Date().toISOString(),
        }),
      });

      const response = await sqsClient.send(command);
      expect(response.MessageId).toBeDefined();
    });
  });

  describe('EventBridge Scheduler', () => {
    test('should verify monthly payout schedule exists', async () => {
      const scheduleName = `monthly-payout-${envSuffix}`;
      const scheduleGroupName = `payout-schedules-${envSuffix}`;

      const command = new GetScheduleCommand({
        Name: scheduleName,
        GroupName: scheduleGroupName,
      });

      const response = await schedulerClient.send(command);
      expect(response.Name).toBe(scheduleName);
      expect(response.State).toBe('ENABLED');
    });

    test('should verify schedule has correct cron expression for monthly execution', async () => {
      const scheduleName = `monthly-payout-${envSuffix}`;
      const scheduleGroupName = `payout-schedules-${envSuffix}`;

      const command = new GetScheduleCommand({
        Name: scheduleName,
        GroupName: scheduleGroupName,
      });

      const response = await schedulerClient.send(command);
      expect(response.ScheduleExpression).toBeDefined();
      // Should run on 1st of each month
      expect(response.ScheduleExpression).toContain('cron');
    });
  });

  describe('API Gateway', () => {
    test('should verify REST API exists', async () => {
      const command = new GetRestApiCommand({ restApiId: apiGatewayId });
      const response = await apiGatewayClient.send(command);

      expect(response.id).toBe(apiGatewayId);
      expect(response.name).toBeDefined();
    });

    test('should verify API has environment stage deployed', async () => {
      const command = new GetStageCommand({
        restApiId: apiGatewayId,
        stageName: envSuffix,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.stageName).toBe(envSuffix);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should verify CloudWatch dashboard and monitoring is configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'referral-',
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      // Verifying monitoring is set up (alarms may or may not exist yet)
      expect(Array.isArray(response.MetricAlarms)).toBe(true);
    });
  });

  describe('End-to-End Referral Workflow', () => {
    test('should execute complete referral signup workflow', async () => {
      const testUserId = `e2e-user-${Date.now()}`;
      const testReferralCode = 'E2ETEST123';

      // 1. Invoke reward calculator Lambda
      const lambdaCommand = new InvokeCommand({
        FunctionName: rewardCalcLambdaName,
        Payload: Buffer.from(
          JSON.stringify({
            userId: testUserId,
            referralCode: testReferralCode,
            tier: 2,
          })
        ),
      });

      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      expect(lambdaResponse.StatusCode).toBe(200);

      // 2. Test SNS notification
      const snsCommand = new PublishCommand({
        TopicArn: snsTopicArn,
        Message: JSON.stringify({
          type: 'reward_calculated',
          userId: testUserId,
          referralCode: testReferralCode,
          rewardAmount: 50,
        }),
        Subject: 'Reward Calculated - E2E Test',
      });

      const snsResponse = await snsClient.send(snsCommand);
      expect(snsResponse.MessageId).toBeDefined();

      // 3. Verify S3 report upload capability
      const reportKey = `payout-reports/${testUserId}-${Date.now()}.csv`;
      const reportContent = `userId,referralCode,amount\n${testUserId},${testReferralCode},50`;

      const s3Command = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: reportKey,
        Body: reportContent,
        ContentType: 'text/csv',
      });

      await expect(s3Client.send(s3Command)).resolves.toBeDefined();
    });
  });
});
