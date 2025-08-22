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
      'aws_region', 'environment', 'project_name', 'allowed_ssh_cidr'
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
    // Optional: check for default values
    expect(has(/default\s+=\s+"production"/)).toBe(true);
    expect(has(/default\s+=\s+"tap-stack"/)).toBe(true);
  });

  it('defines locals for tags, prefixes, vpc cidrs, and subnets', () => {
    [
      'common_tags', 'name_prefix', 'vpc_cidr', 
      'public_subnet_cidrs', 'private_subnet_cidrs', 'availability_zones'
    ].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it('declares essential data sources for AZs, AMIs, and caller identity', () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux"/,
      /data\s+"aws_caller_identity"\s+"current"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates random resource for password and username', () => {
    [
      /resource\s+"random_password"\s+"rds_password"/,
      /resource\s+"random_password"\s+"rds_username"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares VPC, subnets, IGW, NAT, and route tables', () => {
    [
      /resource\s+"aws_vpc"\s+"main"/,
      /resource\s+"aws_subnet"\s+"public"/,
      /resource\s+"aws_subnet"\s+"private"/,
      /resource\s+"aws_internet_gateway"\s+"main"/,
      /resource\s+"aws_eip"\s+"nat"/,
      /resource\s+"aws_nat_gateway"\s+"main"/,
      /resource\s+"aws_route_table"\s+"public"/,
      /resource\s+"aws_route_table"\s+"private"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates security groups for EC2 and RDS', () => {
    [
      /resource\s+"aws_security_group"\s+"ec2"/,
      /resource\s+"aws_security_group"\s+"rds"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('manages S3 buckets, versioning, encryption, and public access block', () => {
    [
      'main', 'cloudtrail'
    ].forEach(bucket => {
      [
        'aws_s3_bucket',
        'aws_s3_bucket_public_access_block',
      ].forEach(typ =>
        expect(has(new RegExp(`resource\\s+"${typ}"\\s+"${bucket}`))).toBe(true)
      );
    });
    expect(has(/aws_s3_bucket_server_side_encryption_configuration/)).toBe(true);
    expect(has(/aws_s3_bucket_versioning/)).toBe(true);
  });

  it('defines IAM stack for EC2 and RDS', () => {
    [
      /resource\s+"aws_iam_role"\s+"rds_access"/,
      /resource\s+"aws_iam_role_policy"\s+"rds_access"/,
      /resource\s+"aws_iam_role"\s+"user_least_privilege"/,
      /resource\s+"aws_iam_role_policy"\s+"user_least_privilege"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares EC2 instances and RDS', () => {
    [
      /resource\s+"aws_instance"\s+"main"/,
      /resource\s+"aws_db_instance"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares subnet group for RDS and SSM parameters', () => {
    [
      /resource\s+"aws_db_subnet_group"\s+"main"/,
      /resource\s+"aws_ssm_parameter"\s+"rds_username"/,
      /resource\s+"aws_ssm_parameter"\s+"rds_password"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines outputs for all major resources, excludes sensitive values', () => {
    [
      "vpc_id",
      "vpc_cidr_block",
      "public_subnet_ids",
      "private_subnet_ids",
      "ec2_instance_id",
      "ec2_public_ip",
      "ec2_private_ip",
      "ami_id",
      "rds_endpoint",
      "rds_instance_id",
      "rds_db_name",
      "s3_bucket_name",
      "s3_bucket_arn",
      "rds_access_role_arn",
      "user_role_arn",
      "ec2_instance_profile_name",
      "ec2_security_group_id",
      "rds_security_group_id",
      "cloudtrail_s3_bucket_name",
      "cloudtrail_arn",
      "rds_username_parameter_name",
      "rds_password_parameter_name",
      "internet_gateway_id",
      "nat_gateway_id",
      "nat_gateway_eip"
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
    // Exclude sensitive data: like 'db password actual value'
    expect(
      /output\s+".*password.*"\s*{[^}]*value\s*=\s*(random_password\.rds_password\.result|var\.db_password)[^}]*}/
        .test(tf)
    ).toBe(false);
  });

});
