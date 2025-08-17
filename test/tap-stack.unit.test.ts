import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new TapStack(app, 'unit-test-stack');
    const synthesized = Testing.synth(stack);
    resources = JSON.parse(synthesized).resource;
  });

  it('should create a KMS Key with rotation enabled', () => {
    const kmsKey = Object.values(resources.aws_kms_key)[0] as any;
    expect(kmsKey).toBeDefined();
    expect(kmsKey.enable_key_rotation).toBe(true);
  });

  it('should create an IAM group policy that denies actions without MFA', () => {
    const groupPolicy = Object.values(resources.aws_iam_group_policy)[0] as any;
    const policyDocument = JSON.parse(groupPolicy.policy);
    const denyStatement = policyDocument.Statement.find(
      (s: any) => s.Effect === 'Deny'
    );

    expect(denyStatement).toBeDefined();
    expect(
      denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']
    ).toBe('false');
  });

  it('should encrypt the S3 data bucket with a KMS key and bucket key', () => {
    const s3Encryption = Object.values(
      resources.aws_s3_bucket_server_side_encryption_configuration
    )[0] as any;
    const kmsKeyLogicalId = Object.keys(resources.aws_kms_key)[0];

    expect(
      s3Encryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm
    ).toBe('aws:kms');
    expect(
      s3Encryption.rule[0].apply_server_side_encryption_by_default
        .kms_master_key_id
    ).toBe(`\${aws_kms_key.${kmsKeyLogicalId}.id}`);
    expect(s3Encryption.rule[0].bucket_key_enabled).toBe(true);
  });

  it('should create an EC2 IAM Role with a correct inline policy', () => {
    const iamRole = Object.values(resources.aws_iam_role).find(
      (r: any) => r.name && r.name.startsWith('secure-ec2-role-')
    ) as any;
    expect(iamRole).toBeDefined();
    expect(iamRole.inline_policy).toBeDefined();
    expect(iamRole.inline_policy.length).toBe(1);

    // FIXED: The test now correctly parses the valid JSON string from the inline policy.
    const inlinePolicy = JSON.parse(iamRole.inline_policy[0].policy);
    const statements = inlinePolicy.Statement;
    expect(statements.length).toBe(3);
    expect(statements.some((s: any) => s.Action.includes('s3:GetObject'))).toBe(
      true
    );
    expect(statements.some((s: any) => s.Action.includes('kms:Decrypt'))).toBe(
      true
    );
  });

  it('should enable VPC Flow Logs to a CloudWatch Log Group', () => {
    const flowLog = Object.values(resources.aws_flow_log)[0] as any;
    expect(flowLog).toBeDefined();
    expect(flowLog.traffic_type).toBe('ALL');
  });

  it('should encrypt the EC2 instance root volume', () => {
    const instance = Object.values(resources.aws_instance)[0] as any;
    expect(instance.root_block_device.encrypted).toBe(true);
  });
});
