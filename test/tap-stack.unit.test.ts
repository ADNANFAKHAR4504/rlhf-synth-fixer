// tests/tap-stack.unit.test.ts
import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests (Secure Baseline)', () => {
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app({ stackTraces: false });
    // Pass mock props for the unit test
    const stack = new TapStack(app, 'SecureBaselineStack', {
      environmentSuffix: 'unit-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  /**
   * Helper to find all resources of a specific type.
   * @param type The resource type (e.g., "aws_kms_key")
   */
  const findResources = (type: string): { [key: string]: any } => {
    return synthesized.resource?.[type] || {};
  };

  /**
   * Helper to count all resources of a specific type.
   * @param type The resource type (e.g., "aws_kms_key")
   */
  const countResources = (type: string): number => {
    return Object.keys(findResources(type)).length;
  };

  // --- Provider and Data Sources ---
  it('should create exactly one AWS provider for us-east-1', () => {
    const providers = synthesized.provider?.aws || [];
    expect(providers.length).toBe(1);
    expect(providers[0]).toEqual(
      expect.objectContaining({
        region: 'us-east-1',
      })
    );
  });

  // --- KMS ---
  it('should create one KMS Key with rotation enabled', () => {
    expect(countResources('aws_kms_key')).toBe(1);
    const key = Object.values(findResources('aws_kms_key'))[0] as any;
    expect(key.enable_key_rotation).toBe(true);
  });

  // --- IAM ---
  it('should create one IAM Role', () => {
    expect(countResources('aws_iam_role')).toBe(1);
  });

  it('should create one IAM Policy for MFA', () => {
    expect(countResources('aws_iam_policy')).toBe(1);
    const policy = Object.values(findResources('aws_iam_policy'))[0] as any;
    expect(policy.name).toContain('MfaEnforcementPolicy');
    // Check for the MFA condition
    expect(policy.policy).toContain('aws:MultiFactorAuthPresent');
  });

  it('should create two IAM Role Policy Attachments', () => {
    expect(countResources('aws_iam_role_policy_attachment')).toBe(2);
  });

  // --- Secrets Manager ---
  it('should create one Secrets Manager Secret', () => {
    expect(countResources('aws_secretsmanager_secret')).toBe(1);
    expect(countResources('aws_secretsmanager_secret_version')).toBe(1);
  });

  // --- AWS Config ---
  it('should create two AWS Config rules', () => {
    expect(countResources('aws_config_config_rule')).toBe(2);
    const rules = Object.values(findResources('aws_config_config_rule')).map(
      (r: any) => r.source.source_identifier
    );
    expect(rules).toEqual(
      expect.arrayContaining([
        'EBS_ENCRYPTION_BY_DEFAULT',
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      ])
    );
  });

  // --- CloudTrail and Logging ---
  it('should create one CloudTrail and one S3 Bucket for logs', () => {
    expect(countResources('aws_cloudtrail')).toBe(1);
    expect(countResources('aws_s3_bucket')).toBe(1);
    expect(countResources('aws_s3_bucket_policy')).toBe(1);
    expect(countResources('aws_cloudwatch_log_group')).toBe(1);
  });

  // --- CloudWatch Alarms ---
  it('should create two CloudWatch Metric Filters', () => {
    // --- FIX: Use the correct resource name ---
    const filters = findResources('aws_cloudwatch_log_metric_filter');
    expect(countResources('aws_cloudwatch_log_metric_filter')).toBe(2);
    // --- END FIX ---
    const patterns = Object.values(filters).map((f: any) => f.pattern);
    expect(patterns).toEqual(
      expect.arrayContaining([
        '{ $.userIdentity.type = "Root" }',
        '{ ($.eventName = "ConsoleLogin") && ($.errorMessage = "Failed authentication") }',
      ])
    );
  });

  it('should create two CloudWatch Metric Alarms', () => {
    expect(countResources('aws_cloudwatch_metric_alarm')).toBe(2);

    // --- FIX: Check for alarms regardless of order ---
    const alarms = Object.values(findResources('aws_cloudwatch_metric_alarm'));
    const alarmNames = alarms.map((a: any) => a.alarm_name);

    expect(alarmNames).toEqual(
      expect.arrayContaining([
        expect.stringContaining('RootUserActivityAlarm'),
        expect.stringContaining('ConsoleLoginFailureAlarm'),
      ])
    );
    // --- END FIX ---
  });

  // --- Outputs ---
  it('should define all required outputs', () => {
    const outputs = synthesized.output;
    expect(outputs).toHaveProperty('KmsKeyArn');
    expect(outputs).toHaveProperty('IamRoleArn');
    expect(outputs).toHaveProperty('SecretArn');
    expect(outputs).toHaveProperty('EbsEncryptionRuleName');
    expect(outputs).toHaveProperty('S3EncryptionRuleName');
    expect(outputs).toHaveProperty('RootActivityAlarmName');
    expect(outputs).toHaveProperty('LoginFailureAlarmName');
  });
});
