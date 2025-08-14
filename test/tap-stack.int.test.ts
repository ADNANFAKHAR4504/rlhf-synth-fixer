import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack End-to-End Integration', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;
  let output: any;
  const region = process.env.AWS_REGION;

  beforeAll(() => {
    if (!region) throw new Error('AWS_REGION environment variable must be set for integration tests.');
    app = new App();
    stack = new TapStack(app, 'IntTestStack', {
      environmentSuffix: 'inttest',
      stateBucket: 'inttest-state-bucket',
      stateBucketRegion: region,
      awsRegion: region,
      defaultTags: { tags: { Owner: 'IntegrationTest', Purpose: 'E2E' } },
    });
    synthesized = Testing.synth(stack);
    output = JSON.parse(synthesized);
  });

  test('synthesizes Terraform provider and backend', () => {
    expect(output).toHaveProperty('provider');
    expect(output.terraform).toHaveProperty('backend');
    expect(output.terraform.backend).toHaveProperty('s3');
    expect(output.terraform.required_providers).toHaveProperty('aws');
  });

  test('S3 backend is encrypted and uses lockfile', () => {
    expect(output.terraform.backend.s3).toHaveProperty('encrypt', true);
    expect(output.terraform.backend.s3).toHaveProperty('use_lockfile', true);
    expect(output.terraform.backend.s3.bucket).toBe('inttest-state-bucket');
  });

  test('provider region matches input or environment', () => {
    expect(JSON.stringify(output)).toContain(region);
  });

  test('VPC and subnets are created', () => {
    expect(JSON.stringify(output)).toMatch(/aws_vpc/);
    expect(JSON.stringify(output)).toMatch(/aws_subnet/);
  });

  test('S3 bucket and KMS key are present', () => {
    expect(JSON.stringify(output)).toMatch(/aws_s3_bucket/);
    expect(JSON.stringify(output)).toMatch(/aws_kms_key/);
  });

  test('Lambda function and IAM role are present', () => {
    expect(JSON.stringify(output)).toMatch(/aws_lambda_function/);
    expect(JSON.stringify(output)).toMatch(/aws_iam_role/);
  });

  test('RDS instance and subnet group are present', () => {
    expect(JSON.stringify(output)).toMatch(/aws_db_instance/);
    expect(JSON.stringify(output)).toMatch(/aws_db_subnet_group/);
  });

  test('EC2 IAM role is present', () => {
    expect(JSON.stringify(output)).toMatch(/aws_iam_role/);
  });

  test('default tags are applied', () => {
    expect(JSON.stringify(output)).toContain('IntegrationTest');
    expect(JSON.stringify(output)).toContain('Purpose');
    expect(JSON.stringify(output)).toContain('E2E');
  });

  test('handles unusual environmentSuffix', () => {
    const testStack = new TapStack(app, 'UnusualEnvStack', {
      environmentSuffix: '!!!',
      awsRegion: region,
      stateBucketRegion: region,
    });
    const unusualSynth = Testing.synth(testStack);
    expect(unusualSynth).toContain('!!!');
  });
});
