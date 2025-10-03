import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // =========================
  // Variables
  // =========================
  describe('Terraform Variables', () => {
    test('should define region variable with default', () => {
      expect(tfContent).toMatch(/variable\s+"region"/);
      expect(tfContent).toMatch(/default\s+=\s+"us-west-2"/);
    });

    test('should define VPC CIDR variable', () => {
      expect(tfContent).toMatch(/variable\s+"vpc_cidr"/);
      expect(tfContent).toMatch(/default\s+=\s+"10\.0\.0\.0\/16"/);
    });
  });

  // =========================
  // VPC & Subnets
  // =========================
  describe('Networking', () => {
    test('should define VPC resource', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"/);
    });

    test('should define public and private subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_subnet".*public/i);
      expect(tfContent).toMatch(/resource\s+"aws_subnet".*private/i);
    });

    test('should create NAT Gateway for private subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"/);
    });
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
      expect(tfContent).toMatch(/schedule_expression\s+=\s+"cron/);
    });

    test('should define CloudWatch alarms for bucket size', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(tfContent).toMatch(/metric_name\s+=\s+"BucketSizeBytes"/);
    });
  });

  // =========================
  // Tags
  // =========================
  describe('Resource Tags', () => {
    test('all resources should include standard tags', () => {
      expect(tfContent).toMatch(/tags\s+=\s+{[\s\S]*ManagedBy\s+=\s+"Terraform"/);
      expect(tfContent).toMatch(/Purpose\s+=\s+"DailyBackup"/);
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
