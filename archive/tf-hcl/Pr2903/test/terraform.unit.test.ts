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
  it('defines all fundamental variables with correct defaults and descriptions', () => {
    expect(has(/variable\s+"region"/)).toBe(true);
    expect(has(/default\s*=\s*"us-east-2"/)).toBe(true);
    expect(has(/description\s*=\s*"AWS region for resource deployment"/)).toBe(true);

    expect(has(/variable\s+"environment"/)).toBe(true);
    expect(has(/description\s*=\s*"Environment name \(e\.g\., dev, staging, prod\)"/)).toBe(true);

    expect(has(/variable\s+"vpc_cidr"/)).toBe(true);
    expect(has(/default\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);

    expect(has(/variable\s+"project_name"/)).toBe(true);
    expect(has(/default\s*=\s*"tap-stack"/)).toBe(true);
  });

  // Locals
  it('declares locals for AZs, subnet CIDRs, common_tags', () => {
    expect(has(/locals\s*\{/)).toBe(true);
    expect(has(/availability_zones\s*=\s*\[.*\]/)).toBe(true);
    expect(has(/public_subnet_cidrs\s*=\s*\[.*\]/)).toBe(true);
    expect(has(/private_subnet_cidrs\s*=\s*\[.*\]/)).toBe(true);
    expect(has(/common_tags\s*=\s*\{/)).toBe(true);
  });

  // Random resources for RDS credentials
  it('generates RDS credentials using random resources', () => {
    expect(has(/resource\s+"random_id"\s+"unique_suffix"/)).toBe(true);
    expect(has(/resource\s+"random_string"\s+"rds_username"/)).toBe(true);
    expect(has(/resource\s+"random_password"\s+"rds_password"/)).toBe(true);
  });

  // Networking resources
  it('sets up VPC, Internet Gateway, Subnets, EIPs, NATs, Route Tables, and Associations', () => {
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
  it('declares IAM role, policy, log group, and flow logs for VPC', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/)).toBe(true);
    expect(has(/resource\s+"aws_flow_log"\s+"vpc"/)).toBe(true);
  });

  // Security Groups
  it('declares security groups for web, rds, lambda, elasticache with correct rules', () => {
    expect(has(/resource\s+"aws_security_group"\s+"web"/)).toBe(true);
    expect(has(/from_port\s*=\s*80/)).toBe(true);
    expect(has(/from_port\s*=\s*443/)).toBe(true);

    expect(has(/resource\s+"aws_security_group"\s+"rds"/)).toBe(true);
    expect(has(/from_port\s*=\s*3306/)).toBe(true);
    expect(has(/security_groups\s*=\s*\[.*web.*lambda.*\]/)).toBe(true);

    expect(has(/resource\s+"aws_security_group"\s+"lambda"/)).toBe(true);
    expect(has(/resource\s+"aws_security_group"\s+"elasticache"/)).toBe(true);
    expect(has(/from_port\s*=\s*6379/)).toBe(true);
  });

  // S3 Buckets (Main + CloudTrail)
  it('defines main and CloudTrail S3 buckets with encryption and public access block', () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/)).toBe(true);
    expect(has(/sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/)).toBe(true);

    expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/)).toBe(true);
    expect(has(/cloudtrail.amazonaws.com/)).toBe(true);
  });

  // S3 Bucket Policies
  it('sets secure bucket policies (deny insecure, allow CloudTrail)', () => {
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"main"/)).toBe(true);
    expect(has(/"aws:SecureTransport"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/)).toBe(true);
  });

  // IAM Roles for EC2
  it('creates EC2 IAM role, policy, attachment, and instance profile', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_access"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2"/)).toBe(true);
  });

  // Secrets Manager for RDS
  it('has secrets manager secret and version for RDS credentials', () => {
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"rds_credentials"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_credentials"/)).toBe(true);
    expect(has(/secret_string\s*=\s*jsonencode\s*\(/)).toBe(true);
  });

  // RDS resources
  it('configures db subnet group and RDS instance', () => {
    expect(has(/resource\s+"aws_db_subnet_group"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_db_instance"\s+"main"/)).toBe(true);
    expect(has(/engine\s*=\s*"mysql"/)).toBe(true);
    expect(has(/db_name\s*=\s*"appdb"/)).toBe(true);
    expect(has(/skip_final_snapshot\s*=\s*true/)).toBe(true);
    expect(has(/multi_az\s*=\s*true/)).toBe(true);
    expect(has(/publicly_accessible\s*=\s*false/)).toBe(true);
  });

  // Lambda Backup Management
  it('defines IAM role + policy, KMS key/alias, function, log group, and deployment package for Lambda', () => {
    expect(has(/resource\s+"aws_iam_role"\s+"lambda"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"lambda"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_key"\s+"lambda"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_alias"\s+"lambda"/)).toBe(true);
    expect(has(/resource\s+"aws_lambda_function"\s+"rds_backup"/)).toBe(true);
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/)).toBe(true);
    expect(has(/data\s+"archive_file"\s+"lambda_zip"/)).toBe(true);
  });

  // Elasticache Resources
  it('declares elasticache subnet group and replication group', () => {
    expect(has(/resource\s+"aws_elasticache_subnet_group"\s+"main"/)).toBe(true);
    expect(has(/resource\s+"aws_elasticache_replication_group"\s+"main"/)).toBe(true);
    expect(has(/parameter_group_name\s*=\s*"default\.redis7"/)).toBe(true);
    expect(has(/num_cache_clusters\s*=\s*2/)).toBe(true);
    expect(has(/at_rest_encryption_enabled\s*=\s*true/)).toBe(true);
    expect(has(/transit_encryption_enabled\s*=\s*true/)).toBe(true);
  });

  // CloudTrail
  it('specifies CloudTrail with S3 bucket and event selector', () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
    expect(has(/event_selector\s*{/)).toBe(true);
    expect(has(/type\s*=\s*"AWS::S3::Object"/)).toBe(true);
  });

  // Systems Manager Document
  it('defines SSM document for maintenance', () => {
    expect(has(/resource\s+"aws_ssm_document"\s+"maintenance"/)).toBe(true);
    expect(has(/description\s*:\s*'Automated maintenance tasks including patching and updates'/)).toBe(true);
    expect(has(/mainSteps\s*:/)).toBe(true);
  });

  // Outputs Validation
  it('exports outputs for all major resources/config values', () => {
    const outputVars = [
      "vpc_id",
      "vpc_cidr",
      "public_subnet_ids",
      "private_subnet_ids",
      "internet_gateway_id",
      "nat_gateway_ids",
      "s3_bucket_name",
      "s3_bucket_arn",
      "cloudtrail_s3_bucket_name",
      "rds_instance_id",
      "rds_endpoint",
      "rds_port",
      "secrets_manager_arn",
      "lambda_function_name",
      "lambda_function_arn",
      "elasticache_replication_group_id",
      "elasticache_primary_endpoint",
      "cloudtrail_name",
      "cloudtrail_arn",
      "ec2_iam_role_name",
      "ec2_iam_role_arn",
      "ec2_instance_profile_name",
      "web_security_group_id",
      "rds_security_group_id",
      "lambda_security_group_id",
      "elasticache_security_group_id",
      "vpc_flow_logs_log_group_name",
      "ssm_document_name",
      "kms_key_id",
      "availability_zones"
    ];
    outputVars.forEach(name => {
      expect(has(new RegExp(`output\\s+"${name}"`))).toBe(true);
    });
  });

  // Security: Hardcoded AWS credentials detection
  it('does not contain any hardcoded AWS credentials', () => {
    expect(has(/aws_access_key_id\s*=/)).toBe(false);
    expect(has(/aws_secret_access_key\s*=/)).toBe(false);
  });

  // Bonus: Enforced security configs
  it('S3 buckets have public access blocks and SSE AES256 encryption enforced', () => {
    expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
    expect(has(/sse_algorithm\s*=\s*"AES256"/)).toBe(true);
  });

  // Bonus: Lambda function uses KMS key for encryption
  it('Lambda function environment uses KMS encryption', () => {
    expect(has(/kms_key_arn\s*=\s*aws_kms_key\.lambda\.arn/)).toBe(true);
  });
});
