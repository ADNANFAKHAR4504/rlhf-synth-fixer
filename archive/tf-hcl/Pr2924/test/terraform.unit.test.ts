import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TAP_STACK_TF = path.join(LIB_DIR, 'tap_stack.tf');
const tf = fs.readFileSync(TAP_STACK_TF, 'utf8');
const has = (regex: RegExp) => regex.test(tf);

// --- Test Suite Starts ---

describe('tap_stack.tf Full Coverage Unit Tests', () => {

  it('tap_stack.tf exists and is non-empty', () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  // Variables
  it('defines all expected variables with correct defaults and descriptions', () => {
    expect(has(/variable\s+"aws_region"/)).toBe(true);
    expect(has(/default\s*=\s*"us-east-2"/)).toBe(true);
    expect(has(/description\s*=\s*"AWS region for deployment"/)).toBe(true);

    expect(has(/variable\s+"vpc_cidr"/)).toBe(true);
    expect(has(/default\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);

    expect(has(/variable\s+"authorized_cidr_blocks"/)).toBe(true);
    expect(has(/description\s*=\s*"CIDR blocks authorized for HTTP\/HTTPS access"/)).toBe(true);

    expect(has(/variable\s+"environment"/)).toBe(true);

    expect(has(/variable\s+"project_name"/)).toBe(true);
    expect(has(/default\s*=\s*"tap-stack"/)).toBe(true);
  });

  // Locals
  it('declares locals for suffix, tags, AZs, subnet CIDRs', () => {
    expect(has(/locals\s*\{/)).toBe(true);
    expect(has(/suffix\s*=\s*random_id\.suffix\.hex/)).toBe(true);
    expect(has(/common_tags\s*=\s*\{/)).toBe(true);
    expect(has(/azs\s*=\s*\[.*\]/)).toBe(true);
    expect(has(/public_subnet_cidrs\s*=\s*\[.*\]/)).toBe(true);
    expect(has(/private_subnet_cidrs\s*=\s*\[.*\]/)).toBe(true);
  });

  // Random resources for RDS credentials
  it('generates RDS credentials using random resources and starts username with letter', () => {
    expect(has(/resource\s+"random_id"\s+"suffix"/)).toBe(true);
    expect(has(/resource\s+"random_string"\s+"rds_username"/)).toBe(true);
    expect(has(/resource\s+"random_password"\s+"rds_password"/)).toBe(true);
    expect(has(/rds_master_username\s*=\s*\"u\${substr\(random_string\.rds_username\.result, 1, 7\)}/)).toBe(true);
  });

  // Data sources
  it('declares required data sources (AMI, AWS account, region)', () => {
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"/)).toBe(true);
    expect(has(/owners\s*=\s*\["amazon"\]/)).toBe(true);
    expect(has(/data\s+"aws_caller_identity"/)).toBe(true);
    expect(has(/data\s+"aws_region"/)).toBe(true);
  });

  // Networking resources
  it('sets up VPC, Internet Gateway, Subnets, NATs, EIPs, Route Tables and Associations', () => {
    expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_internet_gateway"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"nat"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
  });

  // VPC Flow Logs
  it('configures VPC Flow Logs with role, log group, and flow log', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"flow_log_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"flow_log_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_log"/)).toBe(true);
    expect(has(/resource\s+"aws_flow_log"\s+"vpc_flow_log"/)).toBe(true);
  });

  // Security Groups
  it('declares security groups for alb, ec2, rds with proper ingress/egress', () => {
    expect(has(/resource\s+"aws_security_group"\s+"alb"/)).toBe(true);
    expect(has(/from_port\s*=\s*80/)).toBe(true);
    expect(has(/from_port\s*=\s*443/)).toBe(true);

    expect(has(/resource\s+"aws_security_group"\s+"ec2"/)).toBe(true);
    expect(has(/from_port\s*=\s*80/)).toBe(true);

    expect(has(/resource\s+"aws_security_group"\s+"rds"/)).toBe(true);
    expect(has(/from_port\s*=\s*3306/)).toBe(true);
  });

  // IAM Roles for EC2 and VPC Flow Logs
  it('creates EC2 IAM role, policy, profile; VPC Flow Logs IAM role and policy', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);

    expect(has(/resource\s+"aws_iam_role"\s+"flow_log_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"flow_log_policy"/)).toBe(true);
  });

  // S3 Buckets + Logging + Public Block
  it('defines S3 buckets for static content, access logs, cloudtrail, with logging and public access block', () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"static_content"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"static_content"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"access_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_logging"\s+"static_content"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"static_content"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"static_content"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"access_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/)).toBe(true);
  });

  // DynamoDB
  it('creates DynamoDB table with server-side encryption', () => {
    expect(has(/resource\s+"aws_dynamodb_table"\s+"main"/)).toBe(true);
    expect(has(/server_side_encryption\s*\{\s*enabled\s*=\s*true\s*\}/)).toBe(true);
  });

  // Secrets Manager for RDS
  it('stores RDS credentials in Secrets Manager', () => {
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/)).toBe(true);
    expect(has(/secret_string\s*=\s*jsonencode\s*\(\s*\{/)).toBe(true);
  });

  // RDS
  it('configures RDS subnet group and instance with secure settings', () => {
    expect(has(/resource\s+"aws_db_subnet_group"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"main"/)).toBe(true);
    expect(has(/engine\s*=\s*"mysql"/)).toBe(true);
    expect(has(/instance_class\s*=\s*"db\.t3\.micro"/)).toBe(true);
    expect(has(/multi_az\s*=\s*true/)).toBe(true);
    expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
    expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
  });

  // AWS Backup for RDS
  it('sets up AWS Backup vault, KMS, backup plan, selection, and IAM role', () => {
    expect(has(/resource\s+"aws_backup_vault"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_key"\s+"backup"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_alias"\s+"backup"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"backup_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"backup_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_backup_plan"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_backup_selection"\s+"main"/)).toBe(true);
  });

  // Application Load Balancer stack
  it('deploys an internet-facing ALB with target group and listener', () => {
    expect(has(/resource\s+"aws_lb"\s+"main"/)).toBe(true);
    expect(has(/load_balancer_type\s*=\s*"application"/)).toBe(true);
    expect(has(/resource\s+"aws_lb_target_group"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_lb_listener"\s+"main"/)).toBe(true);
  });

  // Launch Template & Auto Scaling Group
  it('configures launch template and ASG for EC2s', () => {
    expect(has(/resource\s+"aws_launch_template"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_autoscaling_group"\s+"main"/)).toBe(true);
    expect(has(/instance_type\s*=\s*"t3\.micro"/)).toBe(true);
  });

  // AWS WAF
  it('sets WAF web ACL and associates with ALB', () => {
    expect(has(/resource\s+"aws_wafv2_web_acl"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/)).toBe(true);
    expect(has(/rate_based_statement/)).toBe(true);
    expect(has(/managed_rule_group_statement/)).toBe(true);
  });

  // CloudTrail
  it('configures CloudTrail with proper settings', () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
    expect(has(/event_selector\s*{/)).toBe(true);
  });

  // CloudWatch and SNS
  it('configures CloudWatch Log Groups, SNS topic, and metric alarms', () => {
    expect(has(/resource\s+"aws_sns_topic"\s+"alerts"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"ec2_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/)).toBe(true);
  });

  // Outputs validation
  it('exports outputs for all major resources/config values', () => {
    const outputVars = [
      "vpc_id",
      "vpc_cidr_block",
      "public_subnet_ids",
      "private_subnet_ids",
      "internet_gateway_id",
      "nat_gateway_ids",
      "nat_gateway_public_ips",
      "public_route_table_id",
      "private_route_table_ids",
      "vpc_flow_log_id",
      "vpc_flow_log_group_name",
      "vpc_flow_log_group_arn",
      "alb_dns_name",
      "alb_zone_id",
      "alb_arn",
      "alb_security_group_id",
      "asg_name",
      "asg_arn",
      "asg_min_size",
      "asg_max_size",
      "asg_desired_capacity",
      "asg_health_check_type",
      "rds_endpoint",
      "rds_port",
      "rds_instance_id",
      "rds_credentials_secret_arn",
      "static_content_bucket_name",
      "static_content_bucket_arn",
      "access_logs_bucket_name",
      "access_logs_bucket_arn",
      "cloudtrail_bucket_name",
      "cloudtrail_bucket_arn",
      "dynamodb_table_name",
      "dynamodb_table_arn",
      "ec2_role_arn",
      "ec2_instance_profile_name",
      "ami_id",
      "ami_name",
      "ami_description",
      "ami_owner_id",
      "ami_creation_date",
      "sns_topic_arn",
      "backup_vault_name",
      "backup_vault_arn",
      "backup_role_arn",
      "rds_subnet_group_name",
      "rds_subnet_group_arn",
      "launch_template_id",
      "launch_template_name",
      "launch_template_latest_version",
      "target_group_arn",
      "target_group_name",
      "waf_web_acl_arn",
      "waf_web_acl_id",
      "waf_web_acl_capacity",
      "backup_kms_key_id",
      "backup_kms_key_arn",
      "backup_kms_alias_name",
      "backup_plan_id",
      "backup_plan_arn",
      "backup_selection_id",
      "ec2_log_group_name",
      "ec2_log_group_arn",
      "high_cpu_alarm_name",
      "high_cpu_alarm_arn",
      "rds_cpu_alarm_name",
      "rds_cpu_alarm_arn",
      "rds_credentials_secret_name",
      "rds_credentials_secret_version_id",
      "random_suffix_b64_std",
      "random_suffix_b64_url",
      "random_suffix_dec",
      "availability_zones",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "current_aws_account_id",
      "current_aws_region",
      "rds_database_name",
      "rds_engine",
      "rds_engine_version",
      "rds_instance_class",
      "rds_allocated_storage",
      "rds_max_allocated_storage",
      "rds_backup_retention_period",
      "rds_backup_window",
      "rds_maintenance_window",
      "rds_multi_az",
      "rds_publicly_accessible",
      "rds_auto_minor_version_upgrade",
      "rds_storage_encrypted"
    ];
    outputVars.forEach(name => {
      expect(has(new RegExp(`output\\s+"${name}"`))).toBe(true);
    });
  });

  // Security: No hardcoded AWS credentials
  it('does not contain any hardcoded AWS credentials', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });

  // Security: S3 public access blocks are enforced
  it('S3 buckets have public access blocks enforced', () => {
    expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
    expect(has(/ignore_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
  });

  // S3 bucket versioning
  it('S3 static content bucket has versioning enabled', () => {
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"static_content"/)).toBe(true);
    expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
  });

  // Encryption for RDS, DynamoDB, Backup
  it('enforces encryption for RDS, DynamoDB, AWS Backup', () => {
    expect(has(/storage_encrypted\s*=\s*true/)).toBe(true);
    expect(has(/server_side_encryption\s*\{\s*enabled\s*=\s*true\s*\}/)).toBe(true);
    expect(has(/kms_key_arn\s*=\s*aws_kms_key\.backup\.arn/)).toBe(true);
  });

  // Monitoring, alarms and notifications
  it('sets up CloudWatch alarms for EC2 and RDS CPU, and SNS notifications', () => {
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/)).toBe(true);
    expect(has(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/)).toBe(true);
  });
});
