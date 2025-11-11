import { App, Testing, TerraformStack } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { KmsModule } from '../lib/kms-module';
import { S3Module } from '../lib/s3-module';
import { IamModule } from '../lib/iam-module';
import { MonitoringModule } from '../lib/monitoring-module';
import { ScpModule } from '../lib/scp-module';

// Helper type for parsed Terraform JSON
interface TerraformResource {
  [key: string]: any;
}

interface ParsedTerraform {
  provider?: any;
  terraform?: any;
  resource?: any;
  output?: any;
  data?: any;
}

// ------------------ TapStack Tests ------------------
describe('TapStack', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should instantiate TapStack with all props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'ap-southeast-1',
      awsRegion: 'ap-southeast-1',
      defaultTags: [
        { tags: { Custom: 'tag' } },
      ],
    });
    synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    expect(parsed).toHaveProperty('provider');
    expect(parsed).toHaveProperty('terraform');
    expect(parsed).toHaveProperty('resource');
  });

  test('should use default values for missing props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    expect(parsed.provider.aws[0].region).toBe('ap-southeast-1');
    expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(parsed.terraform.backend.s3.region).toBe('ap-southeast-1');
  });

  test('should produce all required Terraform outputs', () => {
    app = new App();
    stack = new TapStack(app, 'TestOutputs', { environmentSuffix: 'output' });
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    expect(parsed.output['s3-kms-key-id']).toBeDefined();
    expect(parsed.output['logs-kms-key-id']).toBeDefined();
    expect(parsed.output['s3-bucket-name']).toBeDefined();
    expect(parsed.output['s3-bucket-arn']).toBeDefined();
    expect(parsed.output['payment-role-arn']).toBeDefined();
    expect(parsed.output['cross-account-role-arn']).toBeDefined();
    expect(parsed.output['audit-log-group-name']).toBeDefined();
    expect(parsed.output['compliance-topic-arn']).toBeDefined();
    expect(parsed.output['security-scp-id']).toBeDefined();
  });

  test('should apply tags and suffixes correctly', () => {
    app = new App();
    stack = new TapStack(app, 'TestTags', { environmentSuffix: 'special-1' });
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    expect(parsed.provider.aws[0].default_tags[0].tags.Environment).toBe('special-1');
  });

  test('should handle undefined environment suffix and use default', () => {
    // Don't provide environmentSuffix at all
    app = new App();
    stack = new TapStack(app, 'TestUndefinedEnv', {
      awsRegion: 'us-west-1',
    });
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    // Should use default 'dev'
    expect(parsed.provider.aws[0].default_tags[0].tags.Environment).toBe('dev');
    expect(parsed.terraform.backend.s3.key).toContain('dev/');
  });
  

  test('should create config bucket with policy', () => {
    app = new App();
    stack = new TapStack(app, 'TestConfigBucket', { environmentSuffix: 'config' });
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    expect(parsed.resource.aws_s3_bucket['config-bucket']).toBeDefined();
    expect(parsed.resource.aws_s3_bucket_policy['config-bucket-policy']).toBeDefined();
  });

  test('should use custom stateBucketRegion when provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestCustomStateBucket', {
      environmentSuffix: 'custom',
      stateBucketRegion: 'us-west-2',
    });
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    expect(parsed.terraform.backend.s3.region).toBe('us-west-2');
  });

  test('should use AWS_REGION_OVERRIDE even when awsRegion prop is provided', () => {
    // Set the override
    process.env.AWS_REGION_OVERRIDE = 'ap-southeast-1';
    app = new App();
    stack = new TapStack(app, 'TestRegionOverride', {
      environmentSuffix: 'override',
      awsRegion: 'ap-southeast-1',
    });
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    expect(parsed.provider.aws[0].region).toBe('ap-southeast-1');
    // Clean up
    delete process.env.AWS_REGION_OVERRIDE;
  });

  test('should use awsRegion prop when AWS_REGION_OVERRIDE is not set', () => {
    // Ensure override is not set
    delete process.env.AWS_REGION_OVERRIDE;
    app = new App();
    stack = new TapStack(app, 'TestNoOverride', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1',
    });
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    expect(parsed.provider.aws[0].region).toBe('us-east-1');
  });

  test('should use default region when no override or prop provided', () => {
    // Ensure override is not set
    delete process.env.AWS_REGION_OVERRIDE;
    app = new App();
    stack = new TapStack(app, 'TestDefaultRegion', {
      environmentSuffix: 'default',
    });
    synthesized = Testing.synth(stack);
    const parsed = JSON.parse(synthesized) as ParsedTerraform;
    expect(parsed.provider.aws[0].region).toBe('ap-southeast-1');
  });
});

// ------------------ KmsModule Tests ------------------
describe('KmsModule', () => {
  let stack: TerraformStack;

  beforeEach(() => {
    stack = new TerraformStack(Testing.app(), 'test-kmsstack');
  });

  test('should create S3 KMS key with correct configuration', () => {
    const kms = new KmsModule(stack, 'test-s3-kms', {
      environmentSuffix: 'dev',
      keyType: 's3',
      region: 'ap-southeast-1',
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const kmsKey = Object.values(parsed.resource.aws_kms_key)[0] as TerraformResource;
    expect(kmsKey.tags.Name).toContain('s3-kms-key-dev');
    expect(kmsKey.enable_key_rotation).toBe(true);
    expect(kmsKey.multi_region).toBe(true);
    expect(kmsKey.deletion_window_in_days).toBe(7);
  });

  test('should create Logs KMS key with alias', () => {
    const kms = new KmsModule(stack, 'test-logs', {
      environmentSuffix: 'prod',
      keyType: 'logs',
      region: 'eu-west-2',
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    expect(parsed.resource.aws_kms_alias).toBeDefined();
    const alias = Object.values(parsed.resource.aws_kms_alias)[0] as TerraformResource;
    expect(alias.name).toBe('alias/logs-key-prod');
  });

  test('should configure correct CloudWatch Logs service principal for region', () => {
    const kms = new KmsModule(stack, 'test-region', {
      environmentSuffix: 'test',
      keyType: 's3',
      region: 'eu-south-1',
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const kmsKey = Object.values(parsed.resource.aws_kms_key)[0] as TerraformResource;
    const policy = JSON.parse(kmsKey.policy);
    expect(policy.Statement[1].Principal.Service).toBe('logs.eu-south-1.amazonaws.com');
  });

  test('should expose key and keyAlias properties', () => {
    const kms = new KmsModule(stack, 'test-props', {
      environmentSuffix: 'test',
      keyType: 's3',
      region: 'ap-southeast-1',
    });
    expect(kms.key).toBeDefined();
    expect(kms.keyAlias).toBeDefined();
  });
});

// ------------------ S3Module Tests ------------------
describe('S3Module', () => {
  let stack: TerraformStack;
  const mockKmsArn = 'arn:aws:kms:ap-southeast-1:111111111111:key/mock';

  beforeEach(() => {
    stack = new TerraformStack(Testing.app(), 'test-s3stack');
  });

  test('should create bucket with correct name and tags', () => {
    const s3 = new S3Module(stack, 'test-s3', {
      environmentSuffix: 'ci',
      kmsKeyArn: mockKmsArn
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const bucket = Object.values(parsed.resource.aws_s3_bucket)[0] as TerraformResource;
    expect(bucket.bucket).toBe('payment-data-bucket-ci');
    expect(bucket.tags.Environment).toBe('ci');
    expect(bucket.tags.DataClassification).toBe('sensitive');
    expect(bucket.tags.ComplianceScope).toBe('pci-dss');
  });

  test('should enable versioning on bucket', () => {
    const s3 = new S3Module(stack, 'versioned', {
      environmentSuffix: 'v',
      kmsKeyArn: mockKmsArn,
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const versioning = Object.values(parsed.resource.aws_s3_bucket_versioning)[0] as TerraformResource;
    expect(versioning.versioning_configuration.status).toBe('Enabled');
  });

  test('should configure encryption with KMS', () => {
    const s3 = new S3Module(stack, 'encrypted', {
      environmentSuffix: 'enc',
      kmsKeyArn: mockKmsArn,
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const encryption = Object.values(parsed.resource.aws_s3_bucket_server_side_encryption_configuration)[0] as TerraformResource;
    expect(encryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm).toBe('aws:kms');
    expect(encryption.rule[0].apply_server_side_encryption_by_default.kms_master_key_id).toBe(mockKmsArn);
    expect(encryption.rule[0].bucket_key_enabled).toBe(true);
  });

  test('should block all public access', () => {
    const s3 = new S3Module(stack, 'public-block', {
      environmentSuffix: 'pb',
      kmsKeyArn: mockKmsArn,
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const publicBlock = Object.values(parsed.resource.aws_s3_bucket_public_access_block)[0] as TerraformResource;
    expect(publicBlock.block_public_acls).toBe(true);
    expect(publicBlock.block_public_policy).toBe(true);
    expect(publicBlock.ignore_public_acls).toBe(true);
    expect(publicBlock.restrict_public_buckets).toBe(true);
  });

  test('should create bucket policy with security statements', () => {
    const s3 = new S3Module(stack, 'policy', {
      environmentSuffix: 'secure',
      kmsKeyArn: mockKmsArn,
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const bucketPolicyResource = Object.values(parsed.resource.aws_s3_bucket_policy)[0] as TerraformResource;
    const policy = JSON.parse(bucketPolicyResource.policy);
    expect(policy.Statement).toHaveLength(2);
    expect(policy.Statement.map((s: any) => s.Sid)).toContain('DenyUnencryptedObjectUploads');
    expect(policy.Statement.map((s: any) => s.Sid)).toContain('DenyInsecureTransport');
  });

  test('should expose bucket property', () => {
    const s3 = new S3Module(stack, 'prop-test', {
      environmentSuffix: 'test',
      kmsKeyArn: mockKmsArn,
    });
    expect(s3.bucket).toBeDefined();
  });
});

// ------------------ IamModule Tests ------------------
describe('IamModule', () => {
  let stack: TerraformStack;
  const mockS3Arn = 'arn:aws:s3:::test-bucket';
  const mockKmsArn = 'arn:aws:kms:ap-southeast-1:111111111111:key/mock';

  beforeEach(() => {
    stack = new TerraformStack(Testing.app(), 'test-iamstack');
  });

  test('should create payment processing role and cross-account role', () => {
    const mod = new IamModule(stack, 'iam', {
      environmentSuffix: 'ci',
      s3BucketArn: mockS3Arn,
      kmsKeyArn: mockKmsArn,
      allowedIpRanges: ['10.0.0.0/8']
    });
    expect(mod.paymentProcessingRole).toBeDefined();
    expect(mod.crossAccountRole).toBeDefined();
  });

  test('should create IAM policies and attach to roles', () => {
    const mod = new IamModule(stack, 'iam-2', {
      environmentSuffix: 'prod',
      s3BucketArn: mockS3Arn,
      kmsKeyArn: mockKmsArn,
      allowedIpRanges: ['192.168.1.0/24'],
      auditAccountId: '222222222222'
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    expect(parsed.resource.aws_iam_role_policy_attachment).toBeDefined();
    expect(parsed.resource.aws_iam_policy).toBeDefined();
  });

  test('should configure payment role with MFA requirement', () => {
    const mod = new IamModule(stack, 'iam-mfa', {
      environmentSuffix: 'test',
      s3BucketArn: mockS3Arn,
      kmsKeyArn: mockKmsArn,
      allowedIpRanges: ['10.0.0.0/8']
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const paymentRole = Object.values(parsed.resource.aws_iam_role).find((r: any) =>
      r.name.includes('payment-processing')
    ) as TerraformResource;
    const assumePolicy = JSON.parse(paymentRole.assume_role_policy);
    expect(assumePolicy.Statement[0].Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
  });

  test('should configure cross-account role with external ID', () => {
    const mod = new IamModule(stack, 'iam-external', {
      environmentSuffix: 'test',
      s3BucketArn: mockS3Arn,
      kmsKeyArn: mockKmsArn,
      allowedIpRanges: ['10.0.0.0/8']
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const crossAccountRole = Object.values(parsed.resource.aws_iam_role).find((r: any) =>
      r.name.includes('cross-account')
    ) as TerraformResource;
    const assumePolicy = JSON.parse(crossAccountRole.assume_role_policy);
    expect(assumePolicy.Statement[0].Condition.StringEquals['sts:ExternalId']).toBe('payment-processing-external-id');
  });
});

// ------------------ MonitoringModule Tests ------------------
describe('MonitoringModule', () => {
  let stack: TerraformStack;
  const mockKmsArn = 'arn:aws:kms:ap-southeast-1:111111111111:key/mock';

  beforeEach(() => {
    stack = new TerraformStack(Testing.app(), 'test-mon');
  });

  test('should create CloudWatch log group with encryption', () => {
    const mod = new MonitoringModule(stack, 'mon', {
      environmentSuffix: 'ci',
      logsKmsKeyArn: mockKmsArn,
      configBucketName: 'test-bucket',
      alertEmail: 'alert@example.com',
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const logGroup = Object.values(parsed.resource.aws_cloudwatch_log_group)[0] as TerraformResource;
    expect(logGroup).toBeDefined();
    expect(logGroup.retention_in_days).toBe(365);
  });

  test('should create SNS topic and subscription', () => {
    const mod = new MonitoringModule(stack, 'mon-sns', {
      environmentSuffix: 'test',
      logsKmsKeyArn: mockKmsArn,
      configBucketName: 'test-bucket',
      alertEmail: 'security@example.com',
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    expect(parsed.resource.aws_sns_topic).toBeDefined();
    expect(parsed.resource.aws_sns_topic_subscription).toBeDefined();
    const subscription = Object.values(parsed.resource.aws_sns_topic_subscription)[0] as TerraformResource;
    expect(subscription.protocol).toBe('email');
    expect(subscription.endpoint).toBe('security@example.com');
  });

  test('should create AWS Config resources', () => {
    const mod = new MonitoringModule(stack, 'mon-config', {
      environmentSuffix: 'test',
      logsKmsKeyArn: mockKmsArn,
      configBucketName: 'config-bucket',
      alertEmail: 'alerts@example.com',
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    expect(parsed.resource.aws_config_configuration_recorder).toBeDefined();
    expect(parsed.resource.aws_config_delivery_channel).toBeDefined();
  });

  test('should create all Config rules', () => {
    const mod = new MonitoringModule(stack, 'mon-rules', {
      environmentSuffix: 'test',
      logsKmsKeyArn: mockKmsArn,
      configBucketName: 'config-bucket',
      alertEmail: 'alerts@example.com',
    });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    expect(parsed.resource.aws_config_config_rule).toBeDefined();
    const rules = Object.keys(parsed.resource.aws_config_config_rule);
    expect(rules.length).toBeGreaterThanOrEqual(5);
  });

  test('should expose public properties', () => {
    const mod = new MonitoringModule(stack, 'mon-props', {
      environmentSuffix: 'test',
      logsKmsKeyArn: mockKmsArn,
      configBucketName: 'config-bucket',
      alertEmail: 'alerts@example.com',
    });
    expect(mod.auditLogGroup).toBeDefined();
    expect(mod.complianceTopic).toBeDefined();
  });
});

// ------------------ ScpModule Tests ------------------
describe('ScpModule', () => {
  let stack: TerraformStack;

  beforeEach(() => {
    stack = new TerraformStack(Testing.app(), 'test-scpstack');
  });

  test('should create SCP with all required statements', () => {
    const mod = new ScpModule(stack, 'scp', { environmentSuffix: 'ci' });
    expect(mod.securityPolicy).toBeDefined();
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const scp = Object.values(parsed.resource.aws_organizations_policy)[0] as TerraformResource;
    const content = JSON.parse(scp.content);
    expect(content.Statement.length).toBeGreaterThanOrEqual(4);
    expect(content.Statement[0].Sid).toBe('PreventSecurityResourceDeletion');
    expect(content.Statement[1].Sid).toBe('RequireS3Encryption');
    expect(content.Statement[2].Sid).toBe('RequireSecureTransport');
    expect(content.Statement[3].Sid).toBe('PreventDisableSecurityLogging');
  });

  test('should configure SCP with correct type', () => {
    const mod = new ScpModule(stack, 'scp-type', { environmentSuffix: 'prod' });
    const synth = Testing.synth(stack);
    const parsed = JSON.parse(synth) as ParsedTerraform;
    const scp = Object.values(parsed.resource.aws_organizations_policy)[0] as TerraformResource;
    expect(scp.type).toBe('SERVICE_CONTROL_POLICY');
  });

  test('should expose securityPolicy property', () => {
    const mod = new ScpModule(stack, 'scp-prop', { environmentSuffix: 'test' });
    expect(mod.securityPolicy).toBeDefined();
  });
});
