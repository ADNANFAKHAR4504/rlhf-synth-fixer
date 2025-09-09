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

  it('defines aws_region variable with default and description', () => {
    expect(has(/variable\s+"aws_region"/)).toBe(true);
    expect(has(/default\s*=\s*"us-east-2"/)).toBe(true);
    expect(has(/description\s*=\s*"AWS region for resources"/)).toBe(true);
  });

  it('defines environment and project_name variables', () => {
    expect(has(/variable\s+"environment"/)).toBe(true);
    expect(has(/variable\s+"project_name"/)).toBe(true);
  });

  it('defines domain_name variable for Route 53', () => {
    expect(has(/variable\s+"domain_name"/)).toBe(true);
    expect(has(/default\s*=\s*"NewTestlive\.com"/)).toBe(true);
  });

  it('declares EC2 instance variables', () => {
    expect(has(/variable\s+"instance_type"/)).toBe(true);
    expect(has(/default\s*=\s*"t3\.micro"/)).toBe(true);
    expect(has(/variable\s+"min_size"/)).toBe(true);
    expect(has(/variable\s+"max_size"/)).toBe(true);
    expect(has(/variable\s+"desired_capacity"/)).toBe(true);
  });

  it('sets up locals for common_tags, vpc_cidr, subnet CIDRs', () => {
    expect(has(/locals\s*\{/)).toBe(true);
    expect(has(/common_tags\s*=\s*\{/)).toBe(true);
    expect(has(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    expect(has(/public_subnet_cidrs\s*=\s*\[/)).toBe(true);
    expect(has(/private_subnet_cidrs\s*=\s*\[/)).toBe(true);
    expect(has(/db_subnet_cidrs\s*=\s*\[/)).toBe(true);
  });

  it('declares data sources for AZ, AMI, and account identity', () => {
    expect(has(/data\s+"aws_availability_zones"\s+"available"/)).toBe(true);
    expect(has(/state\s*=\s*"available"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux"/)).toBe(true);
    expect(has(/most_recent\s*=\s*true/)).toBe(true);
    expect(has(/owners\s*=\s*\["amazon"\]/)).toBe(true);
    expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
  });

  it('creates VPC, IGW, subnets, NAT gateways, route tables and associations', () => {
    expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_internet_gateway"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"database"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"nat"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
  });

  it('creates security groups for alb, ec2, rds with proper rules', () => {
    expect(has(/resource\s+"aws_security_group"\s+"alb"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"ec2"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"rds"/)).toBe(true);
    expect(has(/from_port\s*=\s*80/)).toBe(true);
    expect(has(/from_port\s*=\s*22/)).toBe(true);
    expect(has(/from_port\s*=\s*3306/)).toBe(true);
  });

  it('configures IAM roles and policies for EC2, flow logs, backups, RDS monitoring', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"flow_log_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"flow_log_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"backup_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"rds_monitoring"/)).toBe(true);
  });

  it('creates S3 buckets with public access blocks, encryption, versioning', () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"static_content"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"static_content"/)).toBe(true);
    expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"static_content"/)).toBe(true);
    expect(has(/sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"static_content"/)).toBe(true);
    expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
  });

  it('defines S3 bucket policy for CloudFront/EC2 access', () => {
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"static_content"/)).toBe(true);
    expect(has(/s3:GetObject/)).toBe(true);
    expect(has(/s3:PutObject/)).toBe(true);
  });

  it('creates Application Load Balancer, target group, and listener', () => {
    expect(has(/resource\s+"aws_lb"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_lb_target_group"\s+"main"/)).toBe(true);
    expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
    expect(has(/resource\s+"aws_lb_listener"\s+"main"/)).toBe(true);
    expect(has(/port\s*=\s*"80"/)).toBe(true);
    expect(has(/protocol\s*=\s*"HTTP"/)).toBe(true);
  });

  it('configures launch template and Auto Scaling Group', () => {
    expect(has(/resource\s+"aws_launch_template"\s+"main"/)).toBe(true);
    expect(has(/image_id\s*=\s*data.aws_ami.amazon_linux.id/)).toBe(true);
    expect(has(/instance_type\s*=\s*var.instance_type/)).toBe(true);
    expect(has(/resource\s+"aws_autoscaling_group"\s+"main"/)).toBe(true);
    expect(has(/launch_template\s*{/)).toBe(true);
  });

  it('monitors CPU with CloudWatch alarms and SNS alerts', () => {
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/)).toBe(true);
    expect(has(/metric_name\s*=\s*"CPUUtilization"/)).toBe(true);
    expect(has(/alarm_actions\s*=.*aws_autoscaling_policy\.scale_up\.arn/)).toBe(true);
    expect(has(/resource\s+"aws_sns_topic"\s+"alerts"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/)).toBe(true);
  });

  it('sets up AWS Backup vault, plan, selections, and KMS key', () => {
    expect(has(/resource\s+"aws_backup_vault"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_backup_plan"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_backup_selection"\s+"ec2"/)).toBe(true);
    expect(has(/resource\s+"aws_backup_selection"\s+"rds"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_key"\s+"backup"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_alias"\s+"backup"/)).toBe(true);
  });

  it('creates Route53 hosted zone and records for root and www domains', () => {
    expect(has(/resource\s+"aws_route53_zone"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_record"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_route53_record"\s+"www"/)).toBe(true);
  });

  it('configures CloudTrail with dedicated S3 bucket and access block', () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"random_string"\s+"cloudtrail_suffix"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
  });

  it('configures Systems Manager for patching and maintenance window', () => {
    expect(has(/resource\s+"aws_ssm_document"\s+"patch_document"/)).toBe(true);
    expect(has(/resource\s+"aws_ssm_maintenance_window"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_ssm_maintenance_window_target"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_ssm_maintenance_window_task"\s+"main"/)).toBe(true);
  });

  it('exports comprehensive outputs for major resources and configuration', () => {
    const outputVars = [
      "vpc_id",
      "vpc_cidr",
      "public_subnet_ids",
      "private_subnet_ids",
      "database_subnet_ids",
      "rds_endpoint",
      "rds_port",
      "rds_database_name",
      "secrets_manager_secret_arn",
      "load_balancer_dns_name",
      "load_balancer_zone_id",
      "s3_bucket_name",
      "s3_bucket_arn",
      "cloudtrail_bucket_name",
      "route53_zone_id",
      "route53_name_servers",
      "autoscaling_group_name",
      "autoscaling_group_arn",
      "launch_template_id",
      "ami_id",
      "ami_name",
      "ec2_iam_role_arn",
      "ec2_security_group_id",
      "rds_security_group_id",
      "alb_security_group_id",
      "backup_vault_name",
      "backup_plan_id",
      "sns_topic_arn",
      "cloudtrail_arn",
      "ssm_document_name",
      "maintenance_window_id",
      "kms_key_id",
      "availability_zones",
      "total_subnets_created",
      "total_security_groups_created",
      "total_iam_roles_created",
      "total_s3_buckets_created",
      "total_cloudwatch_alarms_created"
      // Add/remove actual output variables as needed
    ];
    outputVars.forEach(name => {
      expect(has(new RegExp(`output\\s+"${name}"`))).toBe(true);
    });
  });

  it('does not contain any hardcoded AWS credentials', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });
});
