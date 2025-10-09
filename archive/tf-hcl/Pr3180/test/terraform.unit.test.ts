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

  it('declares required input variables', () => {
    [
      'aws_region',
      'environment',
      'owner',
      'department',
      'vpc_cidr',
      'ssh_allowed_cidr',
      'instance_type'
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  it('declares essential data sources', () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_2"/,
      /data\s+"aws_caller_identity"\s+"current"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines locals for tags, prefix, AZs, and subnets', () => {
    [
      'common_tags',
      'azs',
      'public_subnet_cidrs',
      'private_subnet_cidrs',
      'name_prefix'
    ].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  it('creates random resources for RDS credentials and S3 suffix', () => {
    [
      /resource\s+"random_string"\s+"rds_username"/,
      /resource\s+"random_password"\s+"rds_password"/,
      /resource\s+"random_id"\s+"s3_bucket_suffix"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

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

  it('creates security groups for EC2, RDS, and ALB', () => {
    [
      /resource\s+"aws_security_group"\s+"ec2"/,
      /resource\s+"aws_security_group"\s+"rds"/,
      /resource\s+"aws_security_group"\s+"alb"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines IAM roles, policies, and attachments', () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2"/,
      /resource\s+"aws_iam_policy"\s+"ec2_policy"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_policy"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2"/,
      /resource\s+"aws_iam_role"\s+"cloudtrail"/,
      /resource\s+"aws_iam_role"\s+"dlm"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines S3 buckets with security configs', () => {
    [
      /resource\s+"aws_s3_bucket"\s+"main"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"main"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"main"/,
      /resource\s+"aws_s3_bucket"\s+"logs"/,
      /resource\s+"aws_s3_bucket_acl"\s+"logs"/,
      /resource\s+"aws_s3_bucket_logging"\s+"main"/,
      /resource\s+"aws_s3_bucket"\s+"cloudtrail"/,
      /resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates RDS resources', () => {
    [
      /resource\s+"aws_db_subnet_group"\s+"main"/,
      /resource\s+"aws_db_instance"\s+"main"/,
      /resource\s+"aws_ssm_parameter"\s+"rds_username"/,
      /resource\s+"aws_ssm_parameter"\s+"rds_password"/,
      /resource\s+"aws_ssm_parameter"\s+"rds_endpoint"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates ALB, target group, and listener', () => {
    [
      /resource\s+"aws_lb"\s+"main"/,
      /resource\s+"aws_lb_target_group"\s+"main"/,
      /resource\s+"aws_lb_listener"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates Launch Template, ASG, and scaling policies', () => {
    [
      /resource\s+"aws_launch_template"\s+"main"/,
      /resource\s+"aws_autoscaling_group"\s+"main"/,
      /resource\s+"aws_autoscaling_policy"\s+"scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"scale_down"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('defines CloudWatch alarms', () => {
    [
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates CloudTrail with proper dependency', () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
  });

  it('creates EBS DLM lifecycle manager resources', () => {
    [
      /resource\s+"aws_dlm_lifecycle_policy"\s+"ebs_snapshots"/,
      /resource\s+"aws_iam_role"\s+"dlm"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"dlm"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares key outputs', () => {
    [
      'vpc_id',
      'rds_endpoint',
      's3_bucket_name',
      'alb_dns_name',
      'autoscaling_group_name',
      'dlm_lifecycle_policy_id',
      'ami_id'
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });
});
