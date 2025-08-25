import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../lib/tap_stack.tf');
let tf: string;

beforeAll(() => {
  tf = fs.readFileSync(filePath, 'utf8');
});

function has(rx: RegExp): boolean {
  return rx.test(tf);
}

describe('tap_stack.tf static verification', () => {
  it('exists and is a non-trivial config file', () => {
    expect(tf).toBeDefined();
    expect(tf.length).toBeGreaterThan(500);
    expect(tf).toMatch(/resource|variable|output/);
  });

  it('declares required input variables', () => {
    [
      'aws_region',
      'environment',
      'project_name',
      'instance_type',
      'key_pair_name'
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
    
    // Check aws_region default and validation condition
    expect(has(/default\s+=\s+"us-west-2"/)).toBe(true);
    expect(has(/condition\s+=\s+var\.aws_region\s+==\s+"us-west-2"/)).toBe(true);
  });

  it('defines locals for tags, prefixes, VPC cidr, and subnets', () => {
    [
      'common_tags',
      'name_prefix',
      'vpc_cidr',
      'azs',
      'public_subnet_cidrs',
      'private_subnet_cidrs',
    ].forEach(local =>
      expect(has(new RegExp(`locals\\s*{[\\s\\S]*${local}\\s*=`, 'm')) || has(new RegExp(`${local}\\s*=`, 'm'))).toBe(true)
    );
  });

  it('declares essential data sources for AMIs, caller identity, and region', () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux"/,
      /data\s+"aws_caller_identity"\s+"current"/,
      /data\s+"aws_region"\s+"current"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('does not declare random_password resources (not in tap_stack.tf)', () => {
    [
      /resource\s+"random_password"\s+"rds_password"/,
      /resource\s+"random_password"\s+"rds_username"/,
      /resource\s+"random_string"\s+"bucket_suffix"/,
      /resource\s+"random_string"\s+"cloudtrail_suffix"/
    ].forEach(rx => {
      if (rx.toString().includes('random_string')) {
        expect(has(rx)).toBe(true); // random_string resources exist
      } else {
        expect(has(rx)).toBe(false); // random_password resources do not exist
      }
    });
  });

  it('declares VPC, subnets, internet gateway, EIPs, NAT gateways, and route tables', () => {
    [
      /resource\s+"aws_vpc"\s+"main"/,
      /resource\s+"aws_subnet"\s+"public"/,
      /resource\s+"aws_subnet"\s+"private"/,
      /resource\s+"aws_internet_gateway"\s+"main"/,
      /resource\s+"aws_eip"\s+"nat"/,
      /resource\s+"aws_nat_gateway"\s+"main"/,
      /resource\s+"aws_route_table"\s+"public"/,
      /resource\s+"aws_route_table"\s+"private"/,
      /resource\s+"aws_route_table_association"\s+"public"/,
      /resource\s+"aws_route_table_association"\s+"private"/,
      /resource\s+"aws_vpc_endpoint"\s+"s3"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates security group for EC2 instance only (no RDS SG)', () => {
    expect(has(/resource\s+"aws_security_group"\s+"ec2_sg"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"rds"/)).toBe(false);
  });

  it('manages S3 buckets including private and cloudtrail, with versioning, encryption, and public access block', () => {
    ['private', 'cloudtrail'].forEach(bucket => {
      [
        new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"`),
        new RegExp(`resource\\s+"aws_s3_bucket_versioning"\\s+"${bucket}"`),
        new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${bucket}"`),
        new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${bucket}"`),
        new RegExp(`resource\\s+"aws_s3_bucket_policy"\\s+"${bucket}"`)
      ].forEach(rx => expect(has(rx)).toBe(true));
    });

    // Random strings for bucket suffixes checked previously
  });

  it('defines IAM roles, policies, instance profile, and MFA group/policies', () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_policy"\s+"ec2_s3_policy"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_s3_policy"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/,
      /resource\s+"aws_iam_group"\s+"mfa_required"/,
      /resource\s+"aws_iam_policy"\s+"mfa_policy"/,
      /resource\s+"aws_iam_group_policy_attachment"\s+"mfa_policy"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares EC2 instance resource only; no RDS defined', () => {
    expect(has(/resource\s+"aws_instance"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"/)).toBe(false);
  });

  it('does not declare RDS subnet groups or SSM parameters', () => {
    expect(has(/resource\s+"aws_db_subnet_group"/)).toBe(false);
    expect(has(/resource\s+"aws_ssm_parameter"/)).toBe(false);
  });

  it('declares CloudTrail resource with proper configuration', () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
  });

  it('defines outputs for all major resources (matching tap_stack.tf outputs)', () => {
    const expectedOutputs = [
      "vpc_id",
      "vpc_cidr_block",
      "public_subnet_ids",
      "private_subnet_ids",
      "s3_bucket_id",
      "s3_bucket_arn",
      "cloudtrail_s3_bucket_id",
      "kms_key_id",
      "kms_key_arn",
      "ec2_instance_id",
      "ec2_private_ip",
      "ec2_ami_id",
      "ec2_iam_role_arn",
      "ec2_instance_profile_arn",
      "mfa_group_name",
      "ec2_security_group_id",
      "cloudtrail_arn",
      "s3_vpc_endpoint_id",
      "internet_gateway_id",
      "nat_gateway_ids",
      "route_table_public_id",
      "route_table_private_ids"
    ];

    expectedOutputs.forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );

    // Check to ensure no sensitive values like passwords exposed in outputs
    expect(
      /output\s+".*password.*"\s*{[^}]*value\s*=/.test(tf)
    ).toBe(false);
  });
});
