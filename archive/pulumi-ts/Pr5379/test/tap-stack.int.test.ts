import * as AWS from 'aws-sdk';

// Configure AWS SDK
const region = 'eu-west-1';
AWS.config.update({ region });

// Initialize AWS clients
const cloudwatch = new AWS.CloudWatch();
const backup = new AWS.Backup();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();
const kms = new AWS.KMS();

describe('TapStack Integration Tests - Real AWS Resources', () => {
  describe('AWS SDK Configuration', () => {
    it('should have AWS SDK configured for eu-west-1', () => {
      expect(AWS.config.region).toBe('eu-west-1');
    });

    it('should initialize CloudWatch client', () => {
      expect(cloudwatch).toBeDefined();
      expect(cloudwatch.config.region).toBe('eu-west-1');
    });

    it('should initialize Backup client', () => {
      expect(backup).toBeDefined();
      expect(backup.config.region).toBe('eu-west-1');
    });

    it('should initialize S3 client', () => {
      expect(s3).toBeDefined();
      expect(s3.config.region).toBe('eu-west-1');
    });

    it('should initialize DynamoDB client', () => {
      expect(dynamodb).toBeDefined();
      expect(dynamodb.config.region).toBe('eu-west-1');
    });

    it('should initialize Lambda client', () => {
      expect(lambda).toBeDefined();
      expect(lambda.config.region).toBe('eu-west-1');
    });

    it('should initialize KMS client', () => {
      expect(kms).toBeDefined();
      expect(kms.config.region).toBe('eu-west-1');
    });
  });

  describe('AWS Service Availability', () => {
    it('should be able to list CloudWatch alarms', async () => {
      const result = await cloudwatch.describeAlarms({ MaxRecords: 1 }).promise();
      expect(result).toBeDefined();
      expect(result.MetricAlarms).toBeDefined();
    }, 30000);

    it('should be able to list backup plans', async () => {
      const result = await backup.listBackupPlans({ MaxResults: 1 }).promise();
      expect(result).toBeDefined();
      expect(result.BackupPlansList).toBeDefined();
    }, 30000);

    it('should be able to list S3 buckets', async () => {
      const result = await s3.listBuckets().promise();
      expect(result).toBeDefined();
      expect(result.Buckets).toBeDefined();
    }, 30000);

    it('should be able to list DynamoDB tables', async () => {
      const result = await dynamodb.listTables({ Limit: 1 }).promise();
      expect(result).toBeDefined();
      expect(result.TableNames).toBeDefined();
    }, 30000);

    it('should be able to list Lambda functions', async () => {
      const result = await lambda.listFunctions({ MaxItems: 1 }).promise();
      expect(result).toBeDefined();
      expect(result.Functions).toBeDefined();
    }, 30000);

    it('should be able to list KMS keys', async () => {
      const result = await kms.listKeys({ Limit: 1 }).promise();
      expect(result).toBeDefined();
      expect(result.Keys).toBeDefined();
    }, 30000);
  });

  describe('Region Validation', () => {
    it('should confirm all AWS clients use eu-west-1 region', () => {
      expect(cloudwatch.config.region).toBe('eu-west-1');
      expect(backup.config.region).toBe('eu-west-1');
      expect(s3.config.region).toBe('eu-west-1');
      expect(dynamodb.config.region).toBe('eu-west-1');
      expect(lambda.config.region).toBe('eu-west-1');
      expect(kms.config.region).toBe('eu-west-1');
    });
  });
});
