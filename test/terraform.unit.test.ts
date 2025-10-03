import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });


  // =========================
  // S3 Buckets
  // =========================
  describe('S3 Buckets', () => {
    test('should define backup bucket with server-side encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"backup_bucket"/);
      expect(tfContent).toMatch(/server_side_encryption_configuration/);
    });

    test('should block public access', () => {
      expect(tfContent).toMatch(/block_public_acls\s+=\s+true/);
      expect(tfContent).toMatch(/ignore_public_acls\s+=\s+true/);
      expect(tfContent).toMatch(/restrict_public_buckets\s+=\s+true/);
    });
  });

  // =========================
  // KMS Key
  // =========================
  describe('KMS Key', () => {
    test('should define a KMS key for backups', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"/);
      expect(tfContent).toMatch(/enable_key_rotation\s+=\s+true/);
    });

    test('should create alias for the KMS key', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"/);
    });
  });

  // =========================
  // EventBridge / CloudWatch
  // =========================
  describe('EventBridge & CloudWatch', () => {
    test('should define EventBridge rule for daily backup', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"/);
      expect(tfContent).toMatch(/schedule_expression\s+=\s+(var\.)?backup_schedule/);
    });

    test('should define CloudWatch alarms for bucket size', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(tfContent).toMatch(/metric_name\s+=\s+"BucketSizeBytes"/);
    });
  });

  // =========================
  // Outputs
  // =========================
  describe('Outputs', () => {
    test('should export backup bucket name and ARN', () => {
      expect(tfContent).toMatch(/output\s+"backup_bucket_name"/);
      expect(tfContent).toMatch(/output\s+"backup_bucket_arn"/);
    });

    test('should export KMS key ARN', () => {
      expect(tfContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test('should export EventBridge rule ARN', () => {
      expect(tfContent).toMatch(/output\s+"eventbridge_rule_arn"/);
    });

    test('should export CloudWatch alarms', () => {
      expect(tfContent).toMatch(/output\s+"cloudwatch_alarms"/);
    });
  });
});
