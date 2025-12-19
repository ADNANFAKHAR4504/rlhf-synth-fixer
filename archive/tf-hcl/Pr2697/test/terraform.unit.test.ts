import * as fs from 'fs';
import * as path from 'path';
const LIB_DIR = path.resolve(__dirname, '../lib');
const TAP_STACK_TF = path.join(LIB_DIR, 'tap_stack.tf');
// Load the Terraform file once
const tf = fs.readFileSync(TAP_STACK_TF, 'utf8');
// Helper to check regex matches in the Terraform file
const has = (regex: RegExp) => regex.test(tf);

describe('tap_stack.tf full unit coverage', () => {
  // -------------------- Core File & General --------------------
  it('the file exists and is sufficiently large', () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  // -------------------- Inputs & Validation --------------------
  it('declares region variable with default', () => {
    expect(has(/variable\s+"region"/)).toBe(true);
    expect(has(/default\s*=\s*"us-east-2"/)).toBe(true);
  });

  it('declares vpc_cidr, allowed_ssh_cidrs, allowed_https_cidrs variables', () => {
    expect(has(/variable\s+"vpc_cidr"/)).toBe(true);
    expect(has(/variable\s+"allowed_ssh_cidrs"/)).toBe(true);
    expect(has(/variable\s+"allowed_https_cidrs"/)).toBe(true);
  });

  it('declares random string and password resources for secure RDS credentials', () => {
    expect(has(/resource\s+"random_string"\s+"rds_username"/)).toBe(true);
    expect(has(/resource\s+"random_password"\s+"rds_password"/)).toBe(true);
  });

  // -------------------- Data Sources --------------------
  it('declares AWS availability zones, AMI, and caller identity data sources', () => {
    expect(has(/data\s+"aws_availability_zones"/)).toBe(true);
    expect(has(/data\s+"aws_ami"/)).toBe(true);
    expect(has(/data\s+"aws_caller_identity"/)).toBe(true);
  });

  // -------------------- VPC & Subnets --------------------
  it('defines a main VPC resource with DNS settings', () => {
    expect(has(/resource\s+"aws_vpc"\s+"main"/)).toBe(true);
    expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
    expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
  });

  it('creates two public and two private subnets with correct CIDR blocks', () => {
    expect(has(/resource\s+"aws_subnet"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_subnet"\s+"private"/)).toBe(true);
    expect(has(/count\s*=\s*2/)).toBe(true);
    expect(has(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ (1|10)\}\.0\/24"/)).toBe(true);
  });

  // -------------------- Networking --------------------
  it('configures an Internet Gateway and NAT Gateways', () => {
    expect(has(/resource\s+"aws_internet_gateway"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_nat_gateway"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_eip"\s+"nat"/)).toBe(true);
  });

  it('defines public and private route tables, links via route table associations', () => {
    expect(has(/resource\s+"aws_route_table"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table"\s+"private"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"public"/)).toBe(true);
    expect(has(/resource\s+"aws_route_table_association"\s+"private"/)).toBe(true);
  });

  it('creates VPC endpoints for S3 and Lambda', () => {
    expect(has(/resource\s+"aws_vpc_endpoint"\s+"s3"/)).toBe(true);
    expect(has(/resource\s+"aws_vpc_endpoint"\s+"lambda"/)).toBe(true);
  });

  // -------------------- Security Groups --------------------
  it('defines security groups for EC2, RDS, and VPC endpoints with correct ports', () => {
    expect(has(/resource\s+"aws_security_group"\s+"ec2"/)).toBe(true);
    expect(has(/ingress\s*{[^}]*from_port\s*=\s*22/)).toBe(true);
    expect(has(/from_port\s*=\s*443/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"rds"/)).toBe(true);
    expect(has(/from_port\s*=\s*3306/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"vpc_endpoint"/)).toBe(true);
  });

  // -------------------- RDS & Secrets Manager --------------------
  it('configures RDS subnet group, DB instance, and secrets for credentials', () => {
    expect(has(/resource\s+"aws_db_subnet_group"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/)).toBe(true);
    expect(has(/username\s*=\s*"a\$\{random_string\.rds_username\.result\}"/)).toBe(true);
    expect(has(/password\s*=\s*random_password\.rds_password\.result/)).toBe(true);
  });

  // -------------------- IAM --------------------
  it('declares IAM roles and instance profile for EC2, Lambda, and Config', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"lambda_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"config_role"/)).toBe(true);
  });

  it('attaches policies and handles role policy attachments', () => {
    expect(has(/resource\s+"aws_iam_policy"\s+"lambda_rds_backup"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_rds_backup"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"config_role_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"config_s3_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"config_s3_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_group"\s+"mfa_required"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"mfa_required"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_group_policy_attachment"\s+"mfa_required"/)).toBe(true);
  });

  // -------------------- S3 Buckets and Policies --------------------
  it('creates multiple S3 buckets for main, config, cloudtrail, and applies policies', () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"config"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"config"/)).toBe(true);
  });

  it('enables S3 bucket versioning, encryption, and public access block', () => {
    expect(has(/resource\s+"aws_s3_bucket_versioning"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"/)).toBe(true);
  });

  // -------------------- CloudWatch & Config --------------------
  it('creates CloudWatch log group, AWS Config recorder and delivery channel', () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"/)).toBe(true);
    expect(has(/resource\s+"aws_config_configuration_recorder"/)).toBe(true);
    expect(has(/resource\s+"aws_config_delivery_channel"/)).toBe(true);
  });

  // -------------------- CloudTrail --------------------
  it('defines CloudTrail with event selector and links to S3 bucket', () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
    expect(has(/event_selector/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/)).toBe(true);
  });

  // -------------------- Lambda --------------------
  it('creates Lambda function for RDS backup with code archive', () => {
    expect(has(/resource\s+"aws_lambda_function"\s+"rds_backup"/)).toBe(true);
    expect(has(/data\s+"archive_file"\s+"lambda_zip"/)).toBe(true);
    expect(has(/handler\s*=\s*"index\.handler"/)).toBe(true);
    expect(has(/runtime\s*=\s*"python3\.9"/)).toBe(true);
  });

  // -------------------- EC2 Instance --------------------
  it('creates EC2 instance with appropriate subnet and IAM profile', () => {
    expect(has(/resource\s+"aws_instance"\s+"main"/)).toBe(true);
    expect(has(/subnet_id\s*=\s*aws_subnet.private\[0\].id/)).toBe(true);
    expect(has(/iam_instance_profile\s*=\s*aws_iam_instance_profile.ec2_profile.name/)).toBe(true);
    expect(has(/instance_type\s*=\s*"t3\.micro"/)).toBe(true);
  });

  // -------------------- Tags & Standards --------------------
  it('applies common tags via merge(local.common_tags...) to resources', () => {
    expect(has(/tags\s*=\s*merge\(local\.common_tags/)).toBe(true);
    expect(has(/Environment\s*=\s*"(Production)?"/)).toBe(true);
  });
  
  // -------------------- Outputs --------------------
  it('exports all major resource outputs including VPC, subnets, NAT, SG, RDS, Lambda, S3, Config, CloudTrail', () => {
    [
      "output \"region\"",
      "output \"vpc_id\"",
      "output \"public_subnet_ids\"",
      "output \"private_subnet_ids\"",
      "output \"nat_gateway_ids\"",
      "output \"internet_gateway_id\"",
      "output \"security_group_ec2_id\"",
      "output \"security_group_rds_id\"",
      "output \"rds_instance_id\"",
      "output \"rds_db_name\"",
      "output \"vpc_s3_endpoint_id\"",
      "output \"lambda_function_name\"",
      "output \"cloudwatch_log_group_name\"",
      "output \"cloudtrail_name\"",
      "output \"config_recorder_name\"",
      "output \"s3_bucket_name\"",
      "output \"s3_config_bucket_name\"",
      "output \"s3_cloudtrail_bucket_name\"",
      "output \"ami_id\""
    ].forEach(outName => expect(tf.includes(outName)).toBe(true));
  });

  // -------------------- Security Best Practices --------------------
  it('does NOT contain hardcoded AWS credentials anywhere', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });

  // -------------------- Advanced: Standards and Compliance --------------------
  it('enforces MFA via IAM group and policy', () => {
    expect(has(/resource\s+"aws_iam_group"\s+"mfa_required"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_policy"\s+"mfa_required"/)).toBe(true);
    expect(has(/"DenyAllExceptUnlessSignedInWithMFA"/)).toBe(true);
    expect(has(/group_policy_attachment.*mfa_required/)).toBe(true);
  });

  it('uses random_string and random_password with secure settings for entropy', () => {
    expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
    expect(has(/resource\s+"random_string"\s+"config_bucket_suffix"/)).toBe(true);
    expect(has(/length\s*=\s*8/)).toBe(true);
    expect(has(/resource\s+"random_password"/)).toBe(true);
    expect(has(/length\s*=\s*16/)).toBe(true);
  });

  // -------------------- Infrastructure Integrity --------------------
  it('cloudtrail and config S3 bucket policies reference correct principals and resources', () => {
    expect(has(/Principal\s*=\s*{\s*Service\s*=\s*"config\.amazonaws\.com"/)).toBe(true);
    expect(has(/Principal\s*=\s*{\s*Service\s*=\s*"cloudtrail\.amazonaws\.com"/)).toBe(true);
    expect(has(/Condition\s*=\s*{[^}]*StringEquals/)).toBe(true);
  });

  it('outputs random suffix values for buckets and rds username for uniqueness', () => {
    expect(has(/output\s+"rds_username_suffix"/)).toBe(true);
    expect(has(/output\s+"bucket_suffix"/)).toBe(true);
  });
});
