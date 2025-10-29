// tests/tap-stack.unit.test.ts
import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests (Secure Baseline)', () => {
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app({ stackTraces: false });
    const stack = new TapStack(app, 'MultiRegionDrStack', {
      environmentSuffix: 'unit-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResources = (type: string) => {
    return synthesized.resource[type] || {};
  };

  const countResources = (type: string) => {
    return Object.keys(findResources(type)).length;
  };

  it('should create exactly one AWS provider for us-east-1', () => {
    // --- FIX: Expect an array containing one provider object ---
    expect(synthesized.provider.aws).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ region: 'us-east-1' }),
      ])
    );
    // Ensure only one provider is defined
    expect(Array.isArray(synthesized.provider.aws)).toBe(true);
    expect(synthesized.provider.aws.length).toBe(1);
  });

  // --- KMS ---
  it('should create one KMS Key with rotation enabled', () => {
    expect(countResources('aws_kms_key')).toBe(1);
    const key = Object.values(findResources('aws_kms_key'))[0] as any;
    expect(key.enable_key_rotation).toBe(true);
  });

  // --- IAM ---
  it('should create three IAM Roles', () => {
    // --- FIX: Expect 3 roles (MFA admin, CloudTrail, Config) ---
    expect(countResources('aws_iam_role')).toBe(3);
  });

  it('should create one IAM Policy for CloudTrail', () => {
    // --- FIX: Check for the one policy we create (for CloudTrail logs) ---
    expect(countResources('aws_iam_policy')).toBe(1);
    const policy = Object.values(findResources('aws_iam_policy'))[0] as any;
    expect(policy.name).toContain('CloudTrail-CloudWatch-Logs-Policy');
  });

  it('should create two IAM Role Policy Attachments', () => {
    // (CloudTrail role + Config role)
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
        // --- FIX: Expect the correct rule name ---
        'EC2_EBS_ENCRYPTION_BY_DEFAULT',
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      ])
    );
  });

  // --- CloudTrail ---
  it('should create one CloudTrail and one S3 Bucket for logs', () => {
    expect(countResources('aws_cloudtrail')).toBe(1);
    expect(countResources('aws_s3_bucket')).toBe(1);
    expect(countResources('aws_cloudwatch_log_group')).toBe(1);
  });

  // --- CloudWatch ---
  it('should create two CloudWatch Metric Filters', () => {
    expect(countResources('aws_cloudwatch_log_metric_filter')).toBe(2);
    const filters = findResources('aws_cloudwatch_log_metric_filter');
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
    const alarms = Object.values(
      findResources('aws_cloudwatch_metric_alarm')
    ) as any[];
    const alarmNames = alarms.map(a => a.alarm_name);

    // --- FIX: Check in any order ---
    expect(alarmNames).toEqual(
      expect.arrayContaining([
        expect.stringContaining('RootUserActivityAlarm'),
        expect.stringContaining('ConsoleLoginFailureAlarm'),
      ])
    );
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

