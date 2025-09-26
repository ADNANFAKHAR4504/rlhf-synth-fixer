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
    expect(tf.length).toBeGreaterThan(5000); // large file
    expect(tf).toMatch(/resource|variable|output/);
  });

  it('declares required input variables', () => {
    ['aws_region', 'vpc_cidr', 'availability_zones', 'ec2_instance_type', 'rds_instance_class']
      .forEach(variable =>
        expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
      );
  });

  it('declares essential data sources', () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_2"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines locals for tags, suffix, and subnets', () => {
    [
      'common_tags',
      'resource_suffix',
      'public_subnet_cidrs',
      'private_subnet_cidrs'
    ].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it('creates random username and password for RDS', () => {
    [
      /resource\s+"random_string"\s+"rds_username"/,
      /resource\s+"random_password"\s+"rds_password"/,
      /resource\s+"random_string"\s+"rds_username_prefix"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares VPC, subnets, IGW, NAT, and route tables', () => {
    [
      /resource\s+"aws_vpc"\s+"main_vpc"/,
      /resource\s+"aws_subnet"\s+"public_subnets"/,
      /resource\s+"aws_subnet"\s+"private_subnets"/,
      /resource\s+"aws_internet_gateway"\s+"igw"/,
      /resource\s+"aws_eip"\s+"nat_eip"/,
      /resource\s+"aws_nat_gateway"\s+"nat_gateways"/,
      /resource\s+"aws_route_table"\s+"public_rt"/,
      /resource\s+"aws_route_table"\s+"private_rt"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates security groups for EC2 and RDS', () => {
    [
      /resource\s+"aws_security_group"\s+"ec2_sg"/,
      /resource\s+"aws_security_group"\s+"rds_sg"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines IAM stack for EC2', () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_role"/,
      /resource\s+"aws_iam_policy"\s+"s3_access_policy"/,
      /resource\s+"aws_iam_policy"\s+"cloudwatch_policy"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates S3 buckets with versioning, encryption, pab, logging, and policies', () => {
    [
      /resource\s+"aws_s3_bucket"\s+"access_logs_bucket"/,
      /resource\s+"aws_s3_bucket"\s+"main_bucket"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"main_bucket_versioning"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main_bucket_encryption"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"main_bucket_pab"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"access_logs_pab"/,
      /resource\s+"aws_s3_bucket_logging"\s+"main_bucket_logging"/,
      /resource\s+"aws_s3_bucket_policy"\s+"main_bucket_policy"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines Secrets Manager for RDS credentials', () => {
    [
      /resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/,
      /resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials_version"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines RDS resources', () => {
    [
      /resource\s+"aws_db_subnet_group"\s+"rds_subnet_group"/,
      /resource\s+"aws_db_instance"\s+"main_db"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines EC2 app servers', () => {
    expect(has(/resource\s+"aws_instance"\s+"app_servers"/)).toBe(true);
  });

  it('defines CloudFront distribution', () => {
    [
      /resource\s+"aws_cloudfront_origin_access_identity"\s+"oai"/,
      /resource\s+"aws_cloudfront_distribution"\s+"cdn"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines CloudWatch dashboard and alarms', () => {
    [
      /resource\s+"aws_cloudwatch_dashboard"\s+"main_dashboard"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines outputs for major resources', () => {
    [
      "vpc_id",
      "vpc_cidr",
      "public_subnet_ids",
      "private_subnet_ids",
      "internet_gateway_id",
      "nat_gateway_ids",
      "ec2_instance_ids",
      "ec2_instance_private_ips",
      "ec2_security_group_id",
      "rds_security_group_id",
      "rds_endpoint",
      "rds_instance_id",
      "rds_secret_arn",
      "s3_main_bucket_name",
      "s3_main_bucket_arn",
      "s3_access_logs_bucket_name",
      "kms_key_id",
      "kms_key_arn",
      "iam_ec2_role_arn",
      "iam_ec2_role_name",
      "iam_instance_profile_name",
      "cloudfront_distribution_id",
      "cloudfront_distribution_domain_name",
      "cloudwatch_dashboard_name",
      "ami_id",
      "route_table_public_id",
      "route_table_private_ids"
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });
});
