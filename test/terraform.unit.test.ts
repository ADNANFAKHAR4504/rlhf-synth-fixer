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
    // Only check variables that you actually have in your current infra
    [
      'region',
      'vpc_cidr',
      'instance_type',
      'environment'
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  it('defines some locals', () => {
    // Adjust locals to match your current file
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
      /resource\s+"aws_iam_role_policy_attachment"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates S3 buckets that exist', () => {
    [
      /resource\s+"aws_s3_bucket"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates RDS instance if present', () => {
    if (has(/resource\s+"aws_db_instance"/)) {
      expect(has(/resource\s+"aws_db_subnet_group"/)).toBe(true);
    }
  });

  it('creates CloudTrail if present', () => {
    if (has(/resource\s+"aws_cloudtrail"/)) {
      expect(has(/resource\s+"aws_s3_bucket"/)).toBe(true);
    }
  });

  it('declares outputs that exist', () => {
    // Only check outputs actually present
    ['vpc_id', 'rds_endpoint', 'alb_dns_name'].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });
});
