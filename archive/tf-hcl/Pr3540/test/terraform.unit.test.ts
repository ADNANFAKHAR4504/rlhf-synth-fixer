// test/terraform.unit.test.ts
import fs from 'fs';
import path from 'path';

describe('tap_stack.tf static verification', () => {
  const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
  const content = fs.readFileSync(tfPath, 'utf-8');

  const has = (regex: RegExp) => regex.test(content);

  it('exists and is non-trivial', () => {
    expect(content.length).toBeGreaterThan(1000);
  });

  // ==========================
  // Variables
  // ==========================
  it('declares required input variables', () => {
    [
      'region',
      'project_name',
      'environment',
      'allowed_ssh_cidr',
      'allowed_ip_ranges'
    ].forEach(v => expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true));
  });

  // ==========================
  // Locals
  // ==========================
  it('defines locals for tags, prefix, AZs, and subnets', () => {
    [
      'common_tags',
      'name_prefix',
      'vpc_cidr',
      'azs',
      'public_subnets',
      'private_subnets',
      'rds_username'
    ].forEach(local => expect(has(new RegExp(`${local}\\s*=`))).toBe(true));
  });

  // ==========================
  // Data Sources
  // ==========================
  it('declares essential data sources', () => {
    [
      /data\s+"aws_caller_identity"\s+"current"/,
      /data\s+"aws_ami"\s+"amazon_linux_2"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // Networking
  // ==========================
  it('declares VPC, subnets, IGW, NATs, and route tables', () => {
    [
      /resource\s+"aws_vpc"\s+"main"/,
      /resource\s+"aws_subnet"\s+"public"/,
      /resource\s+"aws_subnet"\s+"private"/,
      /resource\s+"aws_internet_gateway"\s+"main"/,
      /resource\s+"aws_nat_gateway"\s+"main"/,
      /resource\s+"aws_eip"\s+"nat"/,
      /resource\s+"aws_route_table"\s+"public"/,
      /resource\s+"aws_route_table"\s+"private"/,
      /resource\s+"aws_route_table_association"\s+"public"/,
      /resource\s+"aws_route_table_association"\s+"private"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // Security Groups
  // ==========================
  it('creates security groups for EC2, RDS, ALB', () => {
    [
      /resource\s+"aws_security_group"\s+"ec2"/,
      /resource\s+"aws_security_group"\s+"rds"/,
      /resource\s+"aws_security_group"\s+"alb"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // IAM Roles and Policies
  // ==========================
  it('creates IAM roles, policies, and instance profiles', () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2_instance"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2_instance"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2"/,
      /resource\s+"aws_iam_role"\s+"admin_with_mfa"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"admin_policy"/,
      /resource\s+"aws_iam_role"\s+"flow_logs"/,
      /resource\s+"aws_iam_role_policy"\s+"flow_logs"/,
      /resource\s+"aws_iam_role"\s+"config"/,
      /resource\s+"aws_iam_role_policy"\s+"config"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"config"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // RDS
  // ==========================
  it('creates RDS instance and subnet group', () => {
    [
      /resource\s+"random_string"\s+"rds_username"/,
      /resource\s+"random_password"\s+"rds_password"/,
      /resource\s+"aws_db_subnet_group"\s+"main"/,
      /resource\s+"aws_db_instance"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // S3 Buckets
  // ==========================
  it('creates S3 buckets and configurations', () => {
    [
      /resource\s+"aws_s3_bucket"\s+"app_data"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"app_data"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app_data"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"app_data"/,
      /resource\s+"aws_s3_bucket_policy"\s+"app_data"/,
      /resource\s+"aws_s3_bucket"\s+"cloudtrail"/,
      /resource\s+"aws_s3_bucket"\s+"flow_logs"/,
      /resource\s+"aws_s3_bucket"\s+"config"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // CloudTrail
  // ==========================
  it('creates CloudTrail resources', () => {
    [
      /resource\s+"aws_cloudtrail"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // AWS Config
  // ==========================
  it('creates AWS Config resources', () => {
    [
      /resource\s+"aws_config_configuration_recorder"\s+"main"/,
      /resource\s+"aws_config_delivery_channel"\s+"main"/,
      /resource\s+"aws_config_configuration_recorder_status"\s+"main"/,
      /resource\s+"aws_config_config_rule"\s+"rds_encryption"/,
      /resource\s+"aws_config_config_rule"\s+"s3_public_read"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // ALB and Auto Scaling
  // ==========================
  it('creates ALB, target group, listener, launch template, and ASG', () => {
    [
      /resource\s+"aws_lb"\s+"app"/,
      /resource\s+"aws_lb_target_group"\s+"app"/,
      /resource\s+"aws_lb_listener"\s+"app"/,
      /resource\s+"aws_launch_template"\s+"app"/,
      /resource\s+"aws_autoscaling_group"\s+"app"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // WAF
  // ==========================
  it('creates WAF Web ACL and association', () => {
    [
      /resource\s+"aws_wafv2_web_acl"\s+"main"/,
      /resource\s+"aws_wafv2_web_acl_association"\s+"alb"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // Inspector
  // ==========================
  it('enables AWS Inspector v2', () => {
    expect(has(/resource\s+"aws_inspector2_enabler"\s+"main"/)).toBe(true);
  });
});
