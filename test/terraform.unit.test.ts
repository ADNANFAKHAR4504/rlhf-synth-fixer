// test/terraform.unit.test.ts
import fs from 'fs';
import path from 'path';

describe('tap_stack.tf static verification', () => {
  const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
  const content = fs.readFileSync(tfPath, 'utf-8');

  const has = (regex: RegExp) => regex.test(content);

  it('exists and is a non-trivial config file', () => {
    expect(content.length).toBeGreaterThan(500);
  });

  it('declares some input variables', () => {
    ['region', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids', 'ec2_instance_type'].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  it('defines some locals', () => {
    ['common_tags', 'name_prefix', 'azs'].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it('defines VPC, subnets, and networking resources', () => {
    [
      /resource\s+"aws_vpc"/,
      /resource\s+"aws_subnet"/,
      /resource\s+"aws_internet_gateway"/,
      /resource\s+"aws_nat_gateway"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines IAM roles and policies that exist', () => {
    [
      /resource\s+"aws_iam_role"/,
      /resource\s+"aws_iam_policy"/,
      /resource\s+"aws_iam_role_policy_attachment"/,
      /resource\s+"aws_iam_instance_profile"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates S3 buckets that exist', () => {
    [
      /resource\s+"aws_s3_bucket"/,
      /resource\s+"aws_s3_bucket_versioning"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"/,
      /resource\s+"aws_s3_bucket_public_access_block"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates RDS instance if present', () => {
    [
      /resource\s+"aws_db_instance"/,
      /resource\s+"aws_db_subnet_group"/,
      /resource\s+"aws_ssm_parameter"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates CloudTrail if present', () => {
    expect(has(/resource\s+"aws_cloudtrail"/)).toBe(true);
  });

  it('declares outputs that exist', () => {
    ['vpc_id', 'rds_endpoint', 's3_bucket_id', 'ami_id', 'autoscaling_group_name', 'cloudtrail_name', 'ec2_iam_role_arn'].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });
});

