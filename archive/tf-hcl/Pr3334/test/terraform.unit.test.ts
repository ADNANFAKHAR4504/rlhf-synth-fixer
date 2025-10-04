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
      'aws_region',
      'environment',
      'project_name',
      'vpc_cidr',
      'instance_type',
      'rds_instance_class',
      'ssh_allowed_cidr'
    ].forEach(v => expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true));
  });

  // ==========================
  // Locals
  // ==========================
  it('defines locals for tags, prefix, AZs, and subnets', () => {
    [
      'name_prefix',
      'common_tags',
      'public_subnet_cidrs',
      'private_subnet_cidrs',
      'availability_zones'
    ].forEach(local => expect(has(new RegExp(`${local}\\s*=`))).toBe(true));
  });

  // ==========================
  // Data Sources
  // ==========================
  it('declares essential data sources', () => {
    [
      /data\s+"aws_ami"\s+"amazon_linux_2"/,
      /data\s+"aws_caller_identity"\s+"current"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // Random / Secrets
  // ==========================
  it('creates random resources for RDS credentials', () => {
    [
      /resource\s+"random_string"\s+"rds_username"/,
      /resource\s+"random_password"\s+"rds_password"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('creates Secrets Manager secret for RDS credentials', () => {
    [
      /resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/,
      /resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/
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
  it('creates security groups for EC2, RDS, and ALB', () => {
    [
      /resource\s+"aws_security_group"\s+"ec2"/,
      /resource\s+"aws_security_group"\s+"rds"/,
      /resource\s+"aws_security_group"\s+"alb"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // IAM
  // ==========================
  it('defines IAM roles, policies, and instance profiles', () => {
    [
      /resource\s+"aws_iam_role"\s+"ec2"/,
      /resource\s+"aws_iam_role_policy"\s+"ec2_secrets_manager"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"/,
      /resource\s+"aws_iam_instance_profile"\s+"ec2"/,
      /resource\s+"aws_iam_role"\s+"flow_logs"/,
      /resource\s+"aws_iam_role_policy"\s+"flow_logs"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // RDS
  // ==========================
  it('creates RDS resources', () => {
    [
      /resource\s+"aws_db_subnet_group"\s+"main"/,
      /resource\s+"aws_db_instance"\s+"mysql"/,
      /resource\s+"aws_kms_key"\s+"rds"/,
      /resource\s+"aws_kms_alias"\s+"rds"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // Parameter Store
  // ==========================
  it('creates SSM parameter for EC2 config', () => {
    expect(has(/resource\s+"aws_ssm_parameter"\s+"ec2_config"/)).toBe(true);
  });

  // ==========================
  // ALB
  // ==========================
  it('creates ALB, target group, and listener', () => {
    [
      /resource\s+"aws_lb"\s+"main"/,
      /resource\s+"aws_lb_target_group"\s+"main"/,
      /resource\s+"aws_lb_listener"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // Launch Template / ASG
  // ==========================
  it('creates Launch Template, ASG, and scaling policies', () => {
    [
      /resource\s+"aws_launch_template"\s+"main"/,
      /resource\s+"aws_autoscaling_group"\s+"main"/,
      /resource\s+"aws_autoscaling_policy"\s+"scale_up"/,
      /resource\s+"aws_autoscaling_policy"\s+"scale_down"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // CloudWatch Alarms
  // ==========================
  it('defines CloudWatch alarms', () => {
    [
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/,
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_healthy_hosts"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // VPC Flow Logs
  // ==========================
  it('creates VPC Flow Logs', () => {
    [
      /resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"/,
      /resource\s+"aws_flow_log"\s+"main"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  // ==========================
  // Outputs
  // ==========================
  it('declares key outputs', () => {
    [
      'vpc_id',
      'vpc_cidr',
      'public_subnet_ids',
      'private_subnet_ids',
      'internet_gateway_id',
      'nat_gateway_ids',
      'elastic_ip_addresses',
      'alb_dns_name',
      'alb_arn',
      'target_group_arn',
      'autoscaling_group_name',
      'launch_template_id',
      'rds_endpoint',
      'rds_address',
      'rds_port',
      'rds_instance_id',
      'db_subnet_group_name',
      'secrets_manager_secret_arn',
      'secrets_manager_secret_name',
      'ssm_parameter_name',
      'kms_key_id',
      'kms_key_arn',
      'ec2_iam_role_arn',
      'ec2_instance_profile_arn',
      'flow_logs_role_arn',
      'flow_log_id',
      'cloudwatch_log_group_name',
      'security_group_ec2_id',
      'security_group_alb_id',
      'security_group_rds_id',
      'ami_id',
      'account_id',
      'cloudwatch_alarm_high_cpu_name',
      'cloudwatch_alarm_low_cpu_name',
      'cloudwatch_alarm_rds_cpu_name',
      'cloudwatch_alarm_alb_healthy_hosts_name'
    ].forEach(output => expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true));
  });
});
