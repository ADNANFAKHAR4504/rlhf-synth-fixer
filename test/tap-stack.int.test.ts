import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests - Actual Deployment', () => {
  let outputs: any;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cdk-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'Deployment outputs not found. Please run deployment first.'
      );
    }
    const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    // Extract the first stack's outputs
    outputs = Object.values(rawOutputs)[0];
  });

  describe('Deployment Output Validation', () => {
    test('Should have all required backup system outputs', () => {
      // Test that all expected outputs exist
      expect(outputs.BackupQueueUrl).toBeDefined();
      expect(outputs.ReplicationBucketName).toBeDefined();
      expect(outputs.BackupBucketName).toBeDefined();
      expect(outputs.NotificationTopicArn).toBeDefined();
      expect(outputs.EncryptionKeyId).toBeDefined();
      expect(outputs.DeduplicationTableName).toBeDefined();
      expect(outputs.MetadataTableName).toBeDefined();
      expect(outputs.SystemCapabilities).toBeDefined();
      expect(outputs.DashboardURL).toBeDefined();
    });

    test('Should have valid SQS queue URL format', () => {
      expect(outputs.BackupQueueUrl).toMatch(/^https:\/\/sqs\..+\.amazonaws\.com\/\d+\/.+$/);
      expect(outputs.BackupQueueUrl).toContain('BackupQueue');
    });

    test('Should have valid S3 bucket names', () => {
      expect(outputs.BackupBucketName).toMatch(/^backup-primary-dev-\d+-us-east-1$/);
      expect(outputs.ReplicationBucketName).toMatch(/^backup-replication-dev-\d+-us-east-1$/);
    });

    test('Should have valid SNS topic ARN format', () => {
      expect(outputs.NotificationTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d+:.+$/);
      expect(outputs.NotificationTopicArn).toContain('BackupNotificationTopic');
    });

    test('Should have valid KMS key ID format', () => {
      expect(outputs.EncryptionKeyId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('Should have valid DynamoDB table names', () => {
      expect(outputs.MetadataTableName).toContain('BackupMetadataTable');
      expect(outputs.DeduplicationTableName).toContain('DeduplicationTable');

      // Check for proper CDK naming convention
      expect(outputs.MetadataTableName).toMatch(/^TapStackdev-.+-.+$/);
      expect(outputs.DeduplicationTableName).toMatch(/^TapStackdev-.+-.+$/);
    });

    test('Should have valid CloudWatch dashboard URL', () => {
      expect(outputs.DashboardURL).toMatch(/^https:\/\/console\.aws\.amazon\.com\/cloudwatch\/home\?region=us-east-1#dashboards:name=.+$/);
      expect(outputs.DashboardURL).toContain('BackupSystemMonitoring');
    });
  });

  describe('System Configuration Validation', () => {
    test('Should have valid system capabilities JSON', () => {
      expect(outputs.SystemCapabilities).toBeDefined();

      const capabilities = JSON.parse(outputs.SystemCapabilities);

      // Validate all expected capability fields exist
      expect(capabilities.maxUsers).toBeDefined();
      expect(capabilities.retentionDays).toBeDefined();
      expect(capabilities.rto).toBeDefined();
      expect(capabilities.rpo).toBeDefined();
      expect(capabilities.availability).toBeDefined();
      expect(capabilities.encryption).toBeDefined();
      expect(capabilities.replication).toBeDefined();
      expect(capabilities.deduplication).toBeDefined();
      expect(capabilities.networkIsolation).toBeDefined();
      expect(capabilities.auditLogging).toBeDefined();
      expect(capabilities.costOptimization).toBeDefined();

      // Validate some specific values
      expect(typeof capabilities.maxUsers).toBe('number');
      expect(typeof capabilities.retentionDays).toBe('number');
      expect(typeof capabilities.networkIsolation).toBe('boolean');
      expect(capabilities.availability).toMatch(/^\d+\.\d+%$/);
    });
  });

  describe('Resource Naming Consistency', () => {
    test('Should use consistent environment suffix across resources', () => {
      const envSuffix = 'dev';

      // All resource names should include the environment suffix
      expect(outputs.BackupBucketName).toContain(`-${envSuffix}-`);
      expect(outputs.ReplicationBucketName).toContain(`-${envSuffix}-`);
      expect(outputs.DashboardURL).toContain(`-${envSuffix}`);

      // DynamoDB tables should start with TapStack + env suffix
      expect(outputs.MetadataTableName).toMatch(new RegExp(`^TapStack${envSuffix}-`));
      expect(outputs.DeduplicationTableName).toMatch(new RegExp(`^TapStack${envSuffix}-`));
    });

    test('Should use consistent AWS account and region', () => {
      const expectedAccount = '342597974367';
      const expectedRegion = 'us-east-1';

      expect(outputs.BackupQueueUrl).toContain(expectedAccount);
      expect(outputs.BackupQueueUrl).toContain(expectedRegion);
      expect(outputs.NotificationTopicArn).toContain(expectedAccount);
      expect(outputs.NotificationTopicArn).toContain(expectedRegion);
      expect(outputs.BackupBucketName).toContain(expectedAccount);
      expect(outputs.BackupBucketName).toContain(expectedRegion);
      expect(outputs.ReplicationBucketName).toContain(expectedAccount);
      expect(outputs.ReplicationBucketName).toContain(expectedRegion);
      expect(outputs.DashboardURL).toContain(`region=${expectedRegion}`);
    });
  });

  describe('Deployment Completeness', () => {
    test('Should have exactly 9 output values', () => {
      const outputKeys = Object.keys(outputs);
      expect(outputKeys).toHaveLength(9);
    });

    test('Should have no undefined or empty outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBe('');
        expect(value).not.toBe(null);
      });
    });
  });
});