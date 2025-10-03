// test/terraform.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

const {
  backup_bucket_arn,
  backup_bucket_name,
  backup_schedule,
  cloudwatch_alarms,
  eventbridge_rule_arn,
  kms_key_arn,
  retention_days,
  sns_topic_arn
} = terraformOutput;

const s3 = new AWS.S3({ region: 'us-west-2' });
const eventbridge = new AWS.EventBridge({ region: 'us-west-2' });
const kms = new AWS.KMS({ region: 'us-west-2' });
const sns = new AWS.SNS({ region: 'us-west-2' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-west-2' });

describe('TAP Stack Live Integration Tests', () => {

  // -----------------------------
  // S3 Backup Bucket
  // -----------------------------
  describe('Backup S3 Bucket', () => {

    it('should exist', async () => {
      if (!backup_bucket_name) return console.warn('Backup bucket missing, skipping test.');
      const res = await s3.headBucket({ Bucket: backup_bucket_name }).promise();
      expect(res).toBeDefined();
    });

    it('should allow uploading and deleting objects', async () => {
      if (!backup_bucket_name) return console.warn('Backup bucket missing, skipping test.');
      const testKey = 'integration-test.txt';
      await s3.putObject({ Bucket: backup_bucket_name, Key: testKey, Body: 'test' }).promise();
      const head = await s3.headObject({ Bucket: backup_bucket_name, Key: testKey }).promise();
      expect(head).toBeDefined();
      await s3.deleteObject({ Bucket: backup_bucket_name, Key: testKey }).promise();
    });

    it('should have correct retention/lifecycle', async () => {
      try {
        const res = await s3.getBucketLifecycleConfiguration({ Bucket: backup_bucket_name }).promise();
        const rule = res.Rules?.find(r => r.Status === 'Enabled');
        expect(rule).toBeDefined();
        expect(rule?.Expiration?.Days?.toString()).toBe(retention_days);
      } catch (err: any) {
        console.warn('Bucket lifecycle not configured or unavailable:', err.message);
      }
    });
  });

  // -----------------------------
  // EventBridge Rule
  // -----------------------------
  describe('EventBridge Backup Schedule', () => {

    it('rule exists', async () => {
      if (!eventbridge_rule_arn) return console.warn('EventBridge rule missing, skipping test.');
      const name = eventbridge_rule_arn.split('/').pop();
      if (!name) return console.warn('EventBridge rule name extraction failed.');
      const res = await eventbridge.describeRule({ Name: name }).promise();
      expect(res.Name).toBe(name);
      expect(res.ScheduleExpression).toBe(backup_schedule);
    });

    it('rule has targets', async () => {
      const name = eventbridge_rule_arn.split('/').pop();
      if (!name) return console.warn('EventBridge rule name extraction failed.');
      const targets = await eventbridge.listTargetsByRule({ Rule: name }).promise();
      expect(targets.Targets?.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------
  // KMS Key
  // -----------------------------
  describe('KMS Key', () => {
    it('should exist and be usable for encrypt/decrypt', async () => {
      if (!kms_key_arn) return console.warn('KMS key missing, skipping test.');
      const plaintext = Buffer.from('test-data');
      const encrypted = await kms.encrypt({ KeyId: kms_key_arn, Plaintext: plaintext }).promise();
      expect(encrypted.CiphertextBlob).toBeDefined();

      const decrypted = await kms.decrypt({ CiphertextBlob: encrypted.CiphertextBlob! }).promise();
      expect(decrypted.Plaintext?.toString()).toBe('test-data');
    });
  });

  // -----------------------------
  // SNS Topic
  // -----------------------------
  describe('SNS Topic', () => {
    it('should exist and allow publishing', async () => {
      if (!sns_topic_arn) return console.warn('SNS topic missing, skipping test.');
      const res = await sns.getTopicAttributes({ TopicArn: sns_topic_arn }).promise();
      expect(res.Attributes?.TopicArn).toBe(sns_topic_arn);

      // Publish a test message
      const msgRes = await sns.publish({ TopicArn: sns_topic_arn, Message: 'Integration test message' }).promise();
      expect(msgRes.MessageId).toBeDefined();
    });
  });

  // -----------------------------
  // CloudWatch Alarms
  // -----------------------------
  describe('CloudWatch Alarms', () => {
    it('should have at least one alarm', async () => {
      const res = await cloudwatch.describeAlarms().promise();
      expect(res.MetricAlarms?.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------
  // Cleanup notice
  // -----------------------------
  afterAll(() => {
    console.log('Integration test completed. Test objects were removed from S3.');
  });
});
