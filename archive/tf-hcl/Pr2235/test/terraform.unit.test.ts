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

  it('declares all required input variables with correct defaults', () => {
    [
      'aws_region', 'environment', 'project_name', 'vpc_cidr',
      'availability_zones', 'db_instance_class', 'ec2_instance_type', 'elasticache_node_type'
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
    expect(has(/default\s+=\s+"us-west-2"/)).toBe(true);
    expect(has(/default\s+=\s+"Production"/i)).toBe(true);
    expect(has(/default\s+=\s+"tap-stack"/)).toBe(true);
    expect(has(/default\s+=\s+"10\.0\.0\.0\/16"/)).toBe(true);
  });

  it('defines locals for tags, subnet CIDRs, and name prefix', () => {
    [
      'common_tags', 'name_prefix', 'public_subnet_cidrs',
      'private_subnet_cidrs', 'db_subnet_cidrs'
    ].forEach(local =>
      expect(has(new RegExp(`locals\\s*{[\\s\\S]*${local}\\s*=`))).toBe(true)
    );
  });

  it('declares all essential data sources', () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"/)).toBe(true);
    expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    expect(has(/data\s+"aws_region"\s+"current"/)).toBe(true);
  });

  it('creates required random resources for unique names/credentials', () => {
    [
      /resource\s+"random_string"\s+"db_username"/,
      /resource\s+"random_password"\s+"db_password"/,
      /resource\s+"random_id"\s+"suffix"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares core VPC networking resources', () => {
    [
      /resource\s+"aws_vpc"\s+"main"/,
      /resource\s+"aws_subnet"\s+"public"/,
      /resource\s+"aws_subnet"\s+"private"/,
      /resource\s+"aws_subnet"\s+"database"/,
      /resource\s+"aws_internet_gateway"\s+"main"/,
      /resource\s+"aws_eip"\s+"nat"/,
      /resource\s+"aws_nat_gateway"\s+"main"/,
      /resource\s+"aws_route_table"\s+"public"/,
      /resource\s+"aws_route_table"\s+"private"/,
      /resource\s+"aws_route_table_association"\s+"public"/,
      /resource\s+"aws_route_table_association"\s+"private"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('sets up VPC Flow Logs and CloudWatch group', () => {
    expect(has(/resource\s+"aws_flow_log"\s+"vpc"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_log"/)).toBe(true);
  });

  it('creates security groups for EC2, RDS, and ElastiCache', () => {
    [
      /resource\s+"aws_security_group"\s+"ec2"/,
      /resource\s+"aws_security_group"\s+"rds"/,
      /resource\s+"aws_security_group"\s+"elasticache"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares IAM roles/policies for flow logs, EC2, CloudTrail, and mfa group', () => {
    [
      /resource\s+"aws_iam_role"\s+"flow_log"/,
      /resource\s+"aws_iam_role"\s+"ec2"/,
      /resource\s+"aws_iam_role"\s+"cloudtrail"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2"/,
      /resource\s+"aws_iam_group"\s+"mfa_users"/,
      /resource\s+"aws_iam_group_policy"\s+"mfa_enforcement"/,
      /resource\s+"aws_iam_role_policy"\s+"flow_log"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares RDS resources and subnet groups', () => {
    expect(has(/resource\s+"aws_db_subnet_group"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"main"/)).toBe(true);
  });

  it('declares ElastiCache resources and subnet group', () => {
    expect(has(/resource\s+"aws_elasticache_subnet_group"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_elasticache_cluster"\s+"main"/)).toBe(true);
  });

  it('declares EC2 instance', () => {
    expect(has(/resource\s+"aws_instance"\s+"main"/)).toBe(true);
  });

  it('declares all S3 resources for main and CloudTrail buckets', () => {
    [
      /resource\s+"aws_s3_bucket"\s+"main"/,
      /resource\s+"aws_s3_bucket"\s+"cloudtrail"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"main"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"main"/,
      /resource\s+"aws_s3_bucket_policy"\s+"main"/,
      /resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares CloudFront and WAF resources', () => {
    [
      /resource\s+"aws_cloudfront_origin_access_control"\s+"main"/,
      /resource\s+"aws_cloudfront_distribution"\s+"main"/,
      /resource\s+"aws_wafv2_web_acl"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares KMS keys and aliases for RDS, EBS, CloudTrail', () => {
    [
      /resource\s+"aws_kms_key"\s+"rds"/,
      /resource\s+"aws_kms_alias"\s+"rds"/,
      /resource\s+"aws_kms_key"\s+"ebs"/,
      /resource\s+"aws_kms_alias"\s+"ebs"/,
      /resource\s+"aws_kms_key"\s+"cloudtrail"/,
      /resource\s+"aws_kms_alias"\s+"cloudtrail"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares CloudTrail stack', () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
  });

  it('defines outputs for all major resources and metadata, avoids passwords', () => {
    // Output keys from your actual tap_stack.tf file
    [
      "vpc_id", "vpc_cidr_block", "public_subnet_ids", "private_subnet_ids", "database_subnet_ids",
      "internet_gateway_id", "nat_gateway_ids", "rds_endpoint", "rds_port",
      "elasticache_endpoint", "elasticache_port", "ec2_instance_id", "ec2_instance_private_ip",
      "ec2_instance_ami_id", "ec2_security_group_id", "rds_security_group_id",
      "elasticache_security_group_id", "s3_bucket_name", "s3_bucket_arn",
      "s3_bucket_domain_name", "cloudfront_distribution_id", "cloudfront_distribution_arn",
      "cloudfront_domain_name", "waf_web_acl_id", "waf_web_acl_arn",
      "cloudtrail_name", "cloudtrail_arn", "cloudtrail_s3_bucket_name",
      "kms_key_rds_id", "kms_key_rds_arn", "kms_key_ebs_id", "kms_key_ebs_arn",
      "kms_key_cloudtrail_id", "kms_key_cloudtrail_arn",
      "iam_role_ec2_name", "iam_role_ec2_arn", "iam_role_flow_log_name", "iam_role_flow_log_arn",
      "iam_role_cloudtrail_name", "iam_role_cloudtrail_arn", "iam_group_mfa_users_name", "iam_group_mfa_users_arn",
      "iam_instance_profile_ec2_name", "iam_instance_profile_ec2_arn", "vpc_flow_log_id",
      "cloudwatch_log_group_vpc_flow_log_name", "cloudwatch_log_group_vpc_flow_log_arn",
      "db_subnet_group_name", "elasticache_subnet_group_name", "nat_gateway_public_ips", "elastic_ips",
      "availability_zones", "region", "environment", "project_name", "random_suffix", "db_username",
      "cloudfront_origin_access_control_id", "ami_id", "ami_name", "ami_description", "current_account_id", "current_region"
    ].forEach(output => expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true));
    // Ensure no outputs leak passwords or sensitive secrets
    expect(
      /output\s+".*password.*"\s*{[^}]*value\s*=([^}]*random_password[^}]*|[^}]*var\.db_password[^}]*)}/i
        .test(tf)
    ).toBe(false);
  });

});
