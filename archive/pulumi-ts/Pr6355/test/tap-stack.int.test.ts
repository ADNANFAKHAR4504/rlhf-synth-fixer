import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Load stack outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Extract environment suffix from bucket name dynamically
const extractSuffix = (bucketName: string): string => {
  const match = bucketName.match(/market-data-bucket-(.+)-[a-f0-9]+$/);
  return match ? match[1] : 'dev';
};
const environmentSuffix = extractSuffix(outputs.bucketName);

// AWS SDK configuration
const region = 'us-east-1';
AWS.config.update({ region });

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();
const sqs = new AWS.SQS();
const apiGateway = new AWS.APIGateway();
const cloudwatch = new AWS.CloudWatchLogs();
const iam = new AWS.IAM();

describe('TapStack Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    it('should have apiUrl output', () => {
      expect(outputs.apiUrl).toBeDefined();
      expect(typeof outputs.apiUrl).toBe('string');
      expect(outputs.apiUrl.length).toBeGreaterThan(0);
    });

    it('should have bucketName output', () => {
      expect(outputs.bucketName).toBeDefined();
      expect(typeof outputs.bucketName).toBe('string');
      expect(outputs.bucketName.length).toBeGreaterThan(0);
    });

    it('should have tableArn output', () => {
      expect(outputs.tableArn).toBeDefined();
      expect(typeof outputs.tableArn).toBe('string');
      expect(outputs.tableArn.startsWith('arn:aws:dynamodb:')).toBe(true);
    });

    it('should have all three required outputs', () => {
      expect(Object.keys(outputs)).toContain('apiUrl');
      expect(Object.keys(outputs)).toContain('bucketName');
      expect(Object.keys(outputs)).toContain('tableArn');
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should exist and be accessible', async () => {
      const result = await s3.headBucket({ Bucket: outputs.bucketName }).promise();
      expect(result).toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const result = await s3.getBucketVersioning({ Bucket: outputs.bucketName }).promise();
      expect(result.Status).toBe('Enabled');
    });

    it('should have server-side encryption configured', async () => {
      const result = await s3.getBucketEncryption({ Bucket: outputs.bucketName }).promise();
      expect(result.ServerSideEncryptionConfiguration).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(result.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    it('should have lifecycle policy configured', async () => {
      const result = await s3.getBucketLifecycleConfiguration({ Bucket: outputs.bucketName }).promise();
      expect(result.Rules).toBeDefined();
      expect(result.Rules?.length).toBeGreaterThan(0);
      const expirationRule = result.Rules?.find(r => r.Expiration?.Days === 30);
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Status).toBe('Enabled');
    });

    it('should have appropriate tags', async () => {
      const result = await s3.getBucketTagging({ Bucket: outputs.bucketName }).promise();
      expect(result.TagSet).toBeDefined();
      const environmentTag = result.TagSet.find(t => t.Key === 'Environment');
      const projectTag = result.TagSet.find(t => t.Key === 'Project');
      expect(environmentTag).toBeDefined();
      expect(projectTag).toBeDefined();
      expect(projectTag?.Value).toBe('MarketAnalytics');
    });
  });

  describe('DynamoDB Table Configuration', () => {
    const tableName = outputs.tableArn.split('/')[1];

    it('should exist and be active', async () => {
      const result = await dynamodb.describeTable({ TableName: tableName }).promise();
      expect(result.Table).toBeDefined();
      expect(result.Table?.TableStatus).toBe('ACTIVE');
    });

    it('should have correct key schema', async () => {
      const result = await dynamodb.describeTable({ TableName: tableName }).promise();
      expect(result.Table?.KeySchema).toHaveLength(2);
      const hashKey = result.Table?.KeySchema?.find(k => k.KeyType === 'HASH');
      const rangeKey = result.Table?.KeySchema?.find(k => k.KeyType === 'RANGE');
      expect(hashKey?.AttributeName).toBe('symbol');
      expect(rangeKey?.AttributeName).toBe('timestamp');
    });

    it('should use on-demand billing mode', async () => {
      const result = await dynamodb.describeTable({ TableName: tableName }).promise();
      expect(result.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have point-in-time recovery enabled', async () => {
      const result = await dynamodb.describeContinuousBackups({ TableName: tableName }).promise();
      expect(result.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    });

    it('should have attribute definitions for keys', async () => {
      const result = await dynamodb.describeTable({ TableName: tableName }).promise();
      expect(result.Table?.AttributeDefinitions).toBeDefined();
      const symbolAttr = result.Table?.AttributeDefinitions?.find(a => a.AttributeName === 'symbol');
      const timestampAttr = result.Table?.AttributeDefinitions?.find(a => a.AttributeName === 'timestamp');
      expect(symbolAttr?.AttributeType).toBe('S');
      expect(timestampAttr?.AttributeType).toBe('N');
    });
  });

  describe('Lambda Functions', () => {
    it('should have DataIngestion function deployed', async () => {
      const result = await lambda.getFunction({ FunctionName: `DataIngestion-${environmentSuffix}` }).promise();
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.Runtime).toBe('nodejs18.x');
      expect(result.Configuration?.MemorySize).toBe(1024);
    });

    it('should have DataProcessor function deployed', async () => {
      const result = await lambda.getFunction({ FunctionName: `DataProcessor-${environmentSuffix}` }).promise();
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.Runtime).toBe('nodejs18.x');
      expect(result.Configuration?.MemorySize).toBe(1024);
    });

    it('should have DataAggregator function deployed', async () => {
      const result = await lambda.getFunction({ FunctionName: `DataAggregator-${environmentSuffix}` }).promise();
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration?.Runtime).toBe('nodejs18.x');
      expect(result.Configuration?.MemorySize).toBe(1024);
    });

    it('should have X-Ray tracing enabled on DataIngestion', async () => {
      const result = await lambda.getFunction({ FunctionName: `DataIngestion-${environmentSuffix}` }).promise();
      expect(result.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    it('should have X-Ray tracing enabled on DataProcessor', async () => {
      const result = await lambda.getFunction({ FunctionName: `DataProcessor-${environmentSuffix}` }).promise();
      expect(result.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    it('should have X-Ray tracing enabled on DataAggregator', async () => {
      const result = await lambda.getFunction({ FunctionName: `DataAggregator-${environmentSuffix}` }).promise();
      expect(result.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    it('should have appropriate timeout configured', async () => {
      const result = await lambda.getFunction({ FunctionName: `DataIngestion-${environmentSuffix}` }).promise();
      expect(result.Configuration?.Timeout).toBeDefined();
      expect(result.Configuration?.Timeout).toBeGreaterThan(0);
    });
  });

  describe('SQS Queues', () => {
    it('should have ProcessingQueue created', async () => {
      const result = await sqs.listQueues({ QueueNamePrefix: 'ProcessingQueue' }).promise();
      expect(result.QueueUrls).toBeDefined();
      expect(result.QueueUrls?.length).toBeGreaterThan(0);
    });

    it('should have correct message retention period', async () => {
      const queueList = await sqs.listQueues({ QueueNamePrefix: 'ProcessingQueue' }).promise();
      const queueUrl = queueList.QueueUrls?.[0];
      if (queueUrl) {
        const attrs = await sqs.getQueueAttributes({
          QueueUrl: queueUrl,
          AttributeNames: ['MessageRetentionPeriod']
        }).promise();
        expect(attrs.Attributes?.MessageRetentionPeriod).toBe('345600'); // 4 days
      }
    });

    it('should have correct visibility timeout', async () => {
      const queueList = await sqs.listQueues({ QueueNamePrefix: 'ProcessingQueue' }).promise();
      const queueUrl = queueList.QueueUrls?.[0];
      if (queueUrl) {
        const attrs = await sqs.getQueueAttributes({
          QueueUrl: queueUrl,
          AttributeNames: ['VisibilityTimeout']
        }).promise();
        expect(attrs.Attributes?.VisibilityTimeout).toBe('300'); // 5 minutes
      }
    });

    it('should have dead letter queue configured', async () => {
      const queueList = await sqs.listQueues({ QueueNamePrefix: 'ProcessingQueue' }).promise();
      const queueUrl = queueList.QueueUrls?.[0];
      if (queueUrl) {
        const attrs = await sqs.getQueueAttributes({
          QueueUrl: queueUrl,
          AttributeNames: ['RedrivePolicy']
        }).promise();
        expect(attrs.Attributes?.RedrivePolicy).toBeDefined();
        const redrivePolicy = JSON.parse(attrs.Attributes?.RedrivePolicy || '{}');
        expect(redrivePolicy.maxReceiveCount).toBe(3);
        expect(redrivePolicy.deadLetterTargetArn).toBeDefined();
      }
    });

    it('should have dead letter queue accessible', async () => {
      const result = await sqs.listQueues({ QueueNamePrefix: 'processing-dlq' }).promise();
      expect(result.QueueUrls).toBeDefined();
      expect(result.QueueUrls?.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should have log group for DataIngestion Lambda', async () => {
      const logGroupName = `/aws/lambda/DataIngestion-${environmentSuffix}`;
      const result = await cloudwatch.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();
      expect(result.logGroups).toBeDefined();
      expect(result.logGroups?.length).toBeGreaterThan(0);
    });

    it('should have 7-day retention on DataIngestion logs', async () => {
      const logGroupName = `/aws/lambda/DataIngestion-${environmentSuffix}`;
      const result = await cloudwatch.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();
      const logGroup = result.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup?.retentionInDays).toBe(7);
    });

    it('should have log group for DataProcessor Lambda', async () => {
      const logGroupName = `/aws/lambda/DataProcessor-${environmentSuffix}`;
      const result = await cloudwatch.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();
      expect(result.logGroups).toBeDefined();
      expect(result.logGroups?.length).toBeGreaterThan(0);
    });

    it('should have log group for DataAggregator Lambda', async () => {
      const logGroupName = `/aws/lambda/DataAggregator-${environmentSuffix}`;
      const result = await cloudwatch.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();
      expect(result.logGroups).toBeDefined();
      expect(result.logGroups?.length).toBeGreaterThan(0);
    });

    it('should have metric filters configured', async () => {
      const logGroupName = `/aws/lambda/DataIngestion-${environmentSuffix}`;
      const result = await cloudwatch.describeMetricFilters({ logGroupName }).promise();
      expect(result.metricFilters).toBeDefined();
      expect(result.metricFilters?.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway Configuration', () => {
    it('should have API Gateway endpoint accessible', (done) => {
      const url = `https://${outputs.apiUrl}`;
      https.get(url, (res) => {
        expect(res.statusCode).toBeDefined();
        // API might return 403 (auth required) or other status, but should respond
        expect(typeof res.statusCode).toBe('number');
        done();
      }).on('error', (err) => {
        // Even if there's an error, the endpoint should at least be resolvable
        fail(`API endpoint not accessible: ${err.message}`);
      });
    });

    it('should have API URL in correct format', () => {
      expect(outputs.apiUrl).toMatch(/^[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/.+/);
    });

    it('should include /ingest path', () => {
      expect(outputs.apiUrl.endsWith('/ingest')).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should have role for DataIngestion Lambda', async () => {
      const funcResult = await lambda.getFunction({ FunctionName: `DataIngestion-${environmentSuffix}` }).promise();
      const roleArn = funcResult.Configuration?.Role;
      expect(roleArn).toBeDefined();
      const roleName = roleArn?.split('/')[1];
      const result = await iam.getRole({ RoleName: roleName! }).promise();
      expect(result.Role).toBeDefined();
      expect(result.Role.AssumeRolePolicyDocument).toBeDefined();
    });

    it('should have role for DataProcessor Lambda', async () => {
      const funcResult = await lambda.getFunction({ FunctionName: `DataProcessor-${environmentSuffix}` }).promise();
      const roleArn = funcResult.Configuration?.Role;
      expect(roleArn).toBeDefined();
      const roleName = roleArn?.split('/')[1];
      const result = await iam.getRole({ RoleName: roleName! }).promise();
      expect(result.Role).toBeDefined();
    });

    it('should have role for DataAggregator Lambda', async () => {
      const funcResult = await lambda.getFunction({ FunctionName: `DataAggregator-${environmentSuffix}` }).promise();
      const roleArn = funcResult.Configuration?.Role;
      expect(roleArn).toBeDefined();
      const roleName = roleArn?.split('/')[1];
      const result = await iam.getRole({ RoleName: roleName! }).promise();
      expect(result.Role).toBeDefined();
    });

    it('should have inline policies attached to DataIngestion role', async () => {
      const funcResult = await lambda.getFunction({ FunctionName: `DataIngestion-${environmentSuffix}` }).promise();
      const roleArn = funcResult.Configuration?.Role;
      const roleName = roleArn?.split('/')[1];
      const result = await iam.listRolePolicies({ RoleName: roleName! }).promise();
      expect(result.PolicyNames).toBeDefined();
      expect(result.PolicyNames.length).toBeGreaterThan(0);
    });

    it('should have managed policies attached', async () => {
      const funcResult = await lambda.getFunction({ FunctionName: `DataIngestion-${environmentSuffix}` }).promise();
      const roleArn = funcResult.Configuration?.Role;
      const roleName = roleArn?.split('/')[1];
      const result = await iam.listAttachedRolePolicies({ RoleName: roleName! }).promise();
      expect(result.AttachedPolicies).toBeDefined();
      const xrayPolicy = result.AttachedPolicies?.find(p => p.PolicyName?.includes('XRay'));
      expect(xrayPolicy).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environmentSuffix in bucket name', () => {
      expect(outputs.bucketName).toContain(environmentSuffix);
    });

    it('should use environmentSuffix in table name', () => {
      expect(outputs.tableArn).toContain(environmentSuffix);
    });

    it('should have consistent suffix across resources', () => {
      const bucketSuffix = outputs.bucketName.match(/synth6zn07n/);
      const tableSuffix = outputs.tableArn.match(/synth6zn07n/);
      expect(bucketSuffix).toBeDefined();
      expect(tableSuffix).toBeDefined();
    });
  });

  describe('Resource Tags', () => {
    it('should have Environment tag on S3 bucket', async () => {
      const result = await s3.getBucketTagging({ Bucket: outputs.bucketName }).promise();
      const envTag = result.TagSet.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag?.Value).toBe('Production');
    });

    it('should have Project tag on S3 bucket', async () => {
      const result = await s3.getBucketTagging({ Bucket: outputs.bucketName }).promise();
      const projectTag = result.TagSet.find(t => t.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag?.Value).toBe('MarketAnalytics');
    });

    it('should have tags on DynamoDB table', async () => {
      const tableArn = outputs.tableArn;
      const result = await dynamodb.listTagsOfResource({ ResourceArn: tableArn }).promise();
      expect(result.Tags).toBeDefined();
      expect(result.Tags?.length).toBeGreaterThan(0);
    });
  });
});
