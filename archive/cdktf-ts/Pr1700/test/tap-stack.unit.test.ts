import { Testing } from 'cdktf';
import { MultiEnvironmentStack } from '../lib/tap-stack';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Multi-Environment Single Stack - Unit Tests', () => {
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new MultiEnvironmentStack(app, 'multi-env-test-stack');
    const synthesized = JSON.parse(Testing.synth(stack));
    resources = synthesized.resource || {};
  });

  it('should create a VPC and multi-AZ networking for each environment', () => {
    expect(Object.keys(resources.aws_vpc || {})).toHaveLength(3);
    expect(Object.keys(resources.aws_subnet || {})).toHaveLength(12);
    expect(Object.keys(resources.aws_internet_gateway || {})).toHaveLength(3);
    expect(Object.keys(resources.aws_nat_gateway || {})).toHaveLength(3);
  });

  it('should create RDS instances for all environments', () => {
    const rdsInstances = Object.values(
      resources.aws_db_instance || {}
    ) as any[];
    expect(rdsInstances).toHaveLength(3);
    // Correctly find the production RDS instance by its unique identifier
    const prodRds = rdsInstances.find(rds =>
      rds.identifier.startsWith('appdb-prod')
    );
    expect(prodRds).toBeDefined();
    expect(prodRds.backup_retention_period).toBe(7);
    expect(prodRds.db_subnet_group_name).toBeDefined();
  });

  it('should create three S3 buckets', () => {
    expect(Object.keys(resources.aws_s3_bucket || {})).toHaveLength(3);
  });

  it('should create a KMS key for each environment', () => {
    expect(Object.keys(resources.aws_kms_key || {})).toHaveLength(3);
  });

  it('should configure S3 buckets with KMS encryption', () => {
    const encryptionConfigs = Object.values(
      resources.aws_s3_bucket_server_side_encryption_configuration || {}
    ) as any[];
    expect(encryptionConfigs).toHaveLength(3);
  });

  it('should create IAM roles and policies', () => {
    expect(Object.keys(resources.aws_iam_role || {})).toHaveLength(3);
    expect(Object.keys(resources.aws_iam_policy || {})).toHaveLength(3);
  });

  it('should create security groups for ALB, Web, and DB', () => {
    const securityGroups = Object.values(
      resources.aws_security_group || {}
    ) as any[];
    expect(securityGroups).toHaveLength(9);
  });

  it('should create secrets for all databases', () => {
    expect(Object.keys(resources.aws_secretsmanager_secret || {})).toHaveLength(
      3
    );
  });

  it('should create a CloudWatch alarm for each Auto Scaling Group', () => {
    const alarms = Object.values(
      resources.aws_cloudwatch_metric_alarm || {}
    ) as any[];
    expect(alarms).toHaveLength(3);
  });

  it('should create Auto Scaling components', () => {
    expect(Object.keys(resources.aws_launch_template || {})).toHaveLength(3);
    expect(Object.keys(resources.aws_autoscaling_group || {})).toHaveLength(3);
    expect(Object.keys(resources.aws_lb || {})).toHaveLength(3);
  });

  it('should throw an error for invalid VPC CIDR', () => {
    const app = Testing.app();
    const invalidConfig = [
      {
        env: 'dev' as const,
        vpcCidr: '10.10.0.0/24', // Invalid CIDR
        instanceType: 't3.micro',
        createDb: true,
        dbInstanceClass: 'db.t3.micro',
        tags: { Environment: 'Development', ManagedBy: 'CDKTF' },
      },
    ];

    // The error is thrown during synthesis, so the action must include synth()
    const action = () => {
      const stack = new MultiEnvironmentStack(
        app,
        'invalid-stack',
        invalidConfig
      );
      Testing.synth(stack);
    };

    expect(action).toThrow('VPC CIDR for dev must be a /16 prefix.');
  });
});
