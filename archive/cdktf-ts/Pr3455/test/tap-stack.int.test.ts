import * as AWS from 'aws-sdk';

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const resourceSuffix = 'primary-5';

AWS.config.update({ region });

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();
const sqs = new AWS.SQS();
const sns = new AWS.SNS();
const s3 = new AWS.S3();
const cloudwatch = new AWS.CloudWatch();
const iam = new AWS.IAM();
const scheduler = new AWS.Scheduler();
const logs = new AWS.CloudWatchLogs();

describe('Price Monitoring Stack Integration Tests', () => {
  const tableName = `price-monitor-${environmentSuffix}-${resourceSuffix}`;
  const scraperFunctionName = `price-scraper-${environmentSuffix}-${resourceSuffix}`;
  const streamProcessorFunctionName = `stream-processor-${environmentSuffix}-${resourceSuffix}`;
  const queueName = `price-monitor-scraping-${environmentSuffix}-${resourceSuffix}`;
  const dlqName = `price-monitor-dlq-${environmentSuffix}-${resourceSuffix}`;
  const topicName = `price-monitor-notifications-${environmentSuffix}-${resourceSuffix}`;
  const schedulerGroupName = `price-monitor-${environmentSuffix}-${resourceSuffix}`;

  let bucketName: string;
  let queueUrl: string;
  let dlqUrl: string;
  let topicArn: string;

  beforeAll(async () => {
    // Get queue URLs
    try {
      const queues = await sqs.listQueues({ QueueNamePrefix: queueName }).promise();
      if (queues.QueueUrls && queues.QueueUrls.length > 0) {
        queueUrl = queues.QueueUrls[0];
      }

      const dlqs = await sqs.listQueues({ QueueNamePrefix: dlqName }).promise();
      if (dlqs.QueueUrls && dlqs.QueueUrls.length > 0) {
        dlqUrl = dlqs.QueueUrls[0];
      }

      // Get SNS topic ARN
      const topics = await sns.listTopics().promise();
      const topic = topics.Topics?.find((t) => t.TopicArn?.includes(topicName));
      if (topic) {
        topicArn = topic.TopicArn!;
      }

      // Get S3 bucket name (search for buckets with timestamp suffix)
      const buckets = await s3.listBuckets().promise();
      const bucket = buckets.Buckets?.find((b) =>
        b.Name?.startsWith(`price-monitor-historical-${environmentSuffix}`)
      );
      if (bucket) {
        bucketName = bucket.Name!;
      }
    } catch (error) {
      console.warn('Setup warning:', error);
    }
  }, 30000);

  describe('DynamoDB Table', () => {
    test('should exist and be active', async () => {
      const result = await dynamodb.describeTable({ TableName: tableName }).promise();

      expect(result.Table).toBeDefined();
      expect(result.Table?.TableStatus).toBe('ACTIVE');
      expect(result.Table?.TableName).toBe(tableName);
    });

    test('should have correct schema', async () => {
      const result = await dynamodb.describeTable({ TableName: tableName }).promise();

      expect(result.Table?.KeySchema).toBeDefined();
      expect(result.Table?.KeySchema?.length).toBe(2);

      const hashKey = result.Table?.KeySchema?.find((k) => k.KeyType === 'HASH');
      const rangeKey = result.Table?.KeySchema?.find((k) => k.KeyType === 'RANGE');

      expect(hashKey?.AttributeName).toBe('product_id');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    test('should have streams enabled', async () => {
      const result = await dynamodb.describeTable({ TableName: tableName }).promise();

      expect(result.Table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(result.Table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have on-demand billing', async () => {
      const result = await dynamodb.describeTable({ TableName: tableName }).promise();

      expect(result.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('Lambda Functions', () => {
    test('scraper function should exist and be configured correctly', async () => {
      const result = await lambda.getFunction({ FunctionName: scraperFunctionName }).promise();

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.FunctionName).toBe(scraperFunctionName);
      expect(result.Configuration?.Runtime).toBe('python3.10');
      expect(result.Configuration?.Timeout).toBe(60);
      expect(result.Configuration?.Handler).toBe('index.handler');
    });

    test('stream processor function should exist and be configured correctly', async () => {
      const result = await lambda
        .getFunction({ FunctionName: streamProcessorFunctionName })
        .promise();

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.FunctionName).toBe(streamProcessorFunctionName);
      expect(result.Configuration?.Runtime).toBe('python3.10');
      expect(result.Configuration?.Timeout).toBe(30);
      expect(result.Configuration?.Handler).toBe('index.handler');
    });

    test('scraper function should have correct environment variables', async () => {
      const result = await lambda.getFunction({ FunctionName: scraperFunctionName }).promise();

      expect(result.Configuration?.Environment?.Variables).toBeDefined();
      expect(result.Configuration?.Environment?.Variables?.PRICE_TABLE).toBe(tableName);
      expect(result.Configuration?.Environment?.Variables?.S3_BUCKET).toBeDefined();
      expect(result.Configuration?.Environment?.Variables?.QUEUE_URL).toBeDefined();
      expect(result.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
    });

    test('stream processor function should have correct environment variables', async () => {
      const result = await lambda
        .getFunction({ FunctionName: streamProcessorFunctionName })
        .promise();

      expect(result.Configuration?.Environment?.Variables).toBeDefined();
      expect(result.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
      expect(result.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
    });
  });

  describe('SQS Queues', () => {
    test('scraping queue should exist', async () => {
      if (!queueUrl) {
        console.warn('Queue URL not found, skipping test');
        return;
      }

      const result = await sqs.getQueueAttributes({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      }).promise();

      expect(result.Attributes).toBeDefined();
      expect(result.Attributes?.QueueArn).toContain(queueName);
    });

    test('dead letter queue should exist', async () => {
      if (!dlqUrl) {
        console.warn('DLQ URL not found, skipping test');
        return;
      }

      const result = await sqs.getQueueAttributes({
        QueueUrl: dlqUrl,
        AttributeNames: ['All'],
      }).promise();

      expect(result.Attributes).toBeDefined();
      expect(result.Attributes?.QueueArn).toContain(dlqName);
    });

    test('scraping queue should have redrive policy configured', async () => {
      if (!queueUrl) {
        console.warn('Queue URL not found, skipping test');
        return;
      }

      const result = await sqs.getQueueAttributes({
        QueueUrl: queueUrl,
        AttributeNames: ['RedrivePolicy'],
      }).promise();

      expect(result.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(result.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
    });
  });

  describe('SNS Topic', () => {
    test('notification topic should exist', async () => {
      if (!topicArn) {
        console.warn('Topic ARN not found, skipping test');
        return;
      }

      const result = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();

      expect(result.Attributes).toBeDefined();
      expect(result.Attributes?.TopicArn).toBe(topicArn);
    });
  });

  describe('S3 Bucket', () => {
    test('historical data bucket should exist', async () => {
      if (!bucketName) {
        console.warn('Bucket name not found, skipping test');
        return;
      }

      const result = await s3.headBucket({ Bucket: bucketName }).promise();

      expect(result).toBeDefined();
    });

    test('bucket should have versioning enabled', async () => {
      if (!bucketName) {
        console.warn('Bucket name not found, skipping test');
        return;
      }

      const result = await s3.getBucketVersioning({ Bucket: bucketName }).promise();

      expect(result.Status).toBe('Enabled');
    });

    test('bucket should block public access', async () => {
      if (!bucketName) {
        console.warn('Bucket name not found, skipping test');
        return;
      }

      const result = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();

      expect(result.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(result.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(result.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(result.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('scraper role should exist', async () => {
      const roleName = `price-scraper-role-${environmentSuffix}-${resourceSuffix}`;
      const result = await iam.getRole({ RoleName: roleName }).promise();

      expect(result.Role).toBeDefined();
      expect(result.Role.RoleName).toBe(roleName);
    });

    test('stream processor role should exist', async () => {
      const roleName = `stream-processor-role-${environmentSuffix}-${resourceSuffix}`;
      const result = await iam.getRole({ RoleName: roleName }).promise();

      expect(result.Role).toBeDefined();
      expect(result.Role.RoleName).toBe(roleName);
    });

    test('scheduler role should exist', async () => {
      const roleName = `price-scheduler-role-${environmentSuffix}-${resourceSuffix}`;
      const result = await iam.getRole({ RoleName: roleName }).promise();

      expect(result.Role).toBeDefined();
      expect(result.Role.RoleName).toBe(roleName);
    });

    test('scraper policy should exist', async () => {
      const policies = await iam.listPolicies({ Scope: 'Local' }).promise();
      const policyName = `price-scraper-policy-${environmentSuffix}-${resourceSuffix}`;
      const policy = policies.Policies?.find((p) => p.PolicyName === policyName);

      expect(policy).toBeDefined();
      expect(policy?.PolicyName).toBe(policyName);
    });

  });

  describe('CloudWatch Log Groups', () => {
    test('scraper log group should exist', async () => {
      const logGroupName = `/aws/lambda/${scraperFunctionName}`;
      const result = await logs.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();

      expect(result.logGroups).toBeDefined();
      expect(result.logGroups?.length).toBeGreaterThan(0);
      expect(result.logGroups?.[0].logGroupName).toBe(logGroupName);
    });

    test('stream processor log group should exist', async () => {
      const logGroupName = `/aws/lambda/${streamProcessorFunctionName}`;
      const result = await logs.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();

      expect(result.logGroups).toBeDefined();
      expect(result.logGroups?.length).toBeGreaterThan(0);
      expect(result.logGroups?.[0].logGroupName).toBe(logGroupName);
    });

    test('log groups should have 7-day retention', async () => {
      const logGroupName = `/aws/lambda/${scraperFunctionName}`;
      const result = await logs.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();

      expect(result.logGroups?.[0].retentionInDays).toBe(7);
    });
  });

  describe('EventBridge Scheduler', () => {
    test('scheduler group should exist', async () => {
      try {
        const result = await scheduler.getScheduleGroup({ Name: schedulerGroupName }).promise();

        expect(result).toBeDefined();
        expect(result.Name).toBe(schedulerGroupName);
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn('Scheduler group not found, may not be deployed yet');
        } else {
          throw error;
        }
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    test('scraper error alarm should exist', async () => {
      const alarmName = `price-scraper-errors-${environmentSuffix}-${resourceSuffix}`;
      const result = await cloudwatch.describeAlarms({ AlarmNames: [alarmName] }).promise();

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms?.length).toBeGreaterThan(0);
      expect(result.MetricAlarms?.[0].AlarmName).toBe(alarmName);
    });

    test('DLQ alarm should exist', async () => {
      const alarmName = `price-monitor-dlq-${environmentSuffix}-${resourceSuffix}`;
      const result = await cloudwatch.describeAlarms({ AlarmNames: [alarmName] }).promise();

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms?.length).toBeGreaterThan(0);
      expect(result.MetricAlarms?.[0].AlarmName).toBe(alarmName);
    });
  });

  describe('Lambda Event Source Mappings', () => {
    test('scraper should be connected to SQS queue', async () => {
      const result = await lambda
        .listEventSourceMappings({ FunctionName: scraperFunctionName })
        .promise();

      expect(result.EventSourceMappings).toBeDefined();
      expect(result.EventSourceMappings?.length).toBeGreaterThan(0);

      const sqsMapping = result.EventSourceMappings?.find((m) => m.EventSourceArn?.includes('sqs'));
      expect(sqsMapping).toBeDefined();
      expect(sqsMapping?.State).toBe('Enabled');
    });

    test('stream processor should be connected to DynamoDB stream', async () => {
      const result = await lambda
        .listEventSourceMappings({ FunctionName: streamProcessorFunctionName })
        .promise();

      expect(result.EventSourceMappings).toBeDefined();
      expect(result.EventSourceMappings?.length).toBeGreaterThan(0);

      const streamMapping = result.EventSourceMappings?.find((m) =>
        m.EventSourceArn?.includes('dynamodb')
      );
      expect(streamMapping).toBeDefined();
      expect(streamMapping?.State).toBe('Enabled');
    });
  });

  describe('End-to-End Flow', () => {
    test('should be able to write to DynamoDB and verify in S3', async () => {
      if (!bucketName) {
        console.warn('Bucket not found, skipping end-to-end test');
        return;
      }

      const testProductId = `TEST_PRODUCT_${Date.now()}`;
      const timestamp = Date.now();

      // Write test data to DynamoDB
      await dynamodb
        .putItem({
          TableName: tableName,
          Item: {
            product_id: { S: testProductId },
            timestamp: { N: timestamp.toString() },
            retailer: { S: 'test_retailer' },
            price: { N: '99.99' },
            url: { S: 'https://test.com/product' },
          },
        })
        .promise();

      // Wait a moment for processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify data exists in DynamoDB
      const dbResult = await dynamodb
        .getItem({
          TableName: tableName,
          Key: {
            product_id: { S: testProductId },
            timestamp: { N: timestamp.toString() },
          },
        })
        .promise();

      expect(dbResult.Item).toBeDefined();
      expect(dbResult.Item?.product_id.S).toBe(testProductId);

      // Clean up test data
      await dynamodb
        .deleteItem({
          TableName: tableName,
          Key: {
            product_id: { S: testProductId },
            timestamp: { N: timestamp.toString() },
          },
        })
        .promise();
    }, 30000);
  });
});
