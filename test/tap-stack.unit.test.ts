// test/tap-stack.unit.test.ts
import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests (Secure Baseline)', () => {
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app({ stackTraces: false });
    const stack = new TapStack(app, 'SecureBaselineStack', {
      environmentSuffix: 'unit-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResources = (type: string) => synthesized.resource[type] || {};
  const countResources = (type: string) => Object.keys(findResources(type)).length;

  it('should create one AWS provider in us-east-1', () => {
    const providers = synthesized.provider.aws;
    expect(Array.isArray(providers)).toBe(true);
    expect(providers[0].region).toBe('us-east-1');
  });

  // --- KMS ---
  it('should create one KMS Key and one Key Policy', () => {
    expect(countResources('aws_kms_key')).toBe(1);
    expect(countResources('aws_kms_key_policy')).toBe(1);
  });

  // --- IAM ---
  it('should create two IAM Roles', () => {
    // Stack currently defines 2 roles (CloudTrail + Config)
    expect(countResources('aws_iam_role')).toBe(2);
  });

  it('should create one IAM Policy for CloudTrail', () => {
    expect(countResources('aws_iam_policy')).toBe(1);
    const policy = Object.values(findResources('aws_iam_policy'))[0] as any;
    expect(policy.name).toContain('CloudTrail-CloudWatch-Logs-Policy');
  });

  it('should create one IAM Role Policy Attachment', () => {
    expect(countResources('aws_iam_role_policy_attachment')).toBe(1);
  });

  // --- Secrets Manager ---
  it('should create one Secrets Manager Secret', () => {
    expect(countResources('aws_secretsmanager_secret')).toBe(1);
    expect(countResources('aws_secretsmanager_secret_version')).toBe(1);
  });

  // --- CloudTrail ---
  it('should create CloudTrail, S3 bucket, and Log Group for audit logs', () => {
    expect(countResources('aws_cloudtrail')).toBe(1);
    expect(countResources('aws_s3_bucket')).toBe(1);
    expect(countResources('aws_cloudwatch_log_group')).toBe(1);
  });

  // --- CloudWatch ---
  it('should create two CloudWatch Metric Filters and Alarms', () => {
    expect(countResources('aws_cloudwatch_log_metric_filter')).toBeGreaterThanOrEqual(1);
    expect(countResources('aws_cloudwatch_metric_alarm')).toBeGreaterThanOrEqual(1);
  });

  // --- Outputs ---
  it('should define expected outputs', () => {
    const outputs = synthesized.output;
    expect(outputs).toHaveProperty('KmsKeyArn');
    expect(outputs).toHaveProperty('IamRoleArn');
    expect(outputs).toHaveProperty('SecretArn');
  });
});
