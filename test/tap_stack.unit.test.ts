import fs from 'fs';
import path from 'path';

const TF_FILE = path.resolve(__dirname, '..', 'lib', 'tap_stack.tf');

function readTf(): string {
  return fs.readFileSync(TF_FILE, 'utf8');
}

function expectContains(haystack: string, needle: RegExp | string, hint?: string) {
  const pass = typeof needle === 'string' ? haystack.includes(needle) : needle.test(haystack);
  if (!pass) {
    throw new Error(hint ?? `Expected content to include: ${needle.toString()}`);
  }
}

describe('tap_stack.tf static validations', () => {
  let tf: string;

  beforeAll(() => {
    tf = readTf();
  });

  test('has terraform and aws provider constraints', () => {
    expectContains(tf, /terraform\s*\{/);
    expectContains(tf, /required_providers\s*\{[\s\S]*aws[\s\S]*version\s*=\s*">=\s*5\.0"[\s\S]*\}/);
  });

  test('declares required variables with types and sensible defaults', () => {
    // Required by provider.tf
    expectContains(tf, /variable\s+"aws_region"\s*\{[\s\S]*type\s*=\s*string[\s\S]*\}/, 'aws_region variable missing');

    // Common configuration variables
    [
      'app_name',
      'common_tags',
      'vpc_cidr_us_east_1',
      'vpc_cidr_us_west_2',
      'public_subnet_cidrs_us_east_1',
      'private_subnet_cidrs_us_east_1',
      'public_subnet_cidrs_us_west_2',
      'private_subnet_cidrs_us_west_2',
      'allowed_ingress_cidrs',
      'db_engine',
      'db_engine_version',
      'db_instance_class',
      'db_username',
      'db_password',
      'backup_retention_days',
      's3_bucket_name_prefix',
      'lambda_zip_path',
      'lambda_handler',
      'lambda_runtime',
      'enable_https',
      'certificate_arn',
      'app_port',
      'one_nat_gateway_per_region',
      'log_retention_days',
      'enable_bastion',
      'bastion_allowed_cidrs',
    ].forEach((v) => expectContains(tf, new RegExp(`variable\\s+"${v}"\\s*\\{`), `variable ${v} missing`));

    // Sensitive marking for db_password
    expectContains(tf, /variable\s+"db_password"[\s\S]*sensitive\s*=\s*true/, 'db_password must be sensitive');
  });

  test('defines locals for regions, vpc_configs and common_tags', () => {
    expectContains(tf, /locals\s*\{[\s\S]*regions\s*=\s*\["us-east-1",\s*"us-west-2"\]/);
    expectContains(tf, /vpc_configs\s*=\s*\{/);
    expectContains(tf, /common_tags\s*=\s*merge\(var\.common_tags,\s*\{[\s\S]*Environment\s*=\s*"Production"/);
  });

  test('KMS keys per region with rotation and aliases', () => {
    expectContains(tf, /resource\s+"aws_kms_key"\s+"main_us_east_1"[\s\S]*enable_key_rotation\s*=\s*true/);
    expectContains(tf, /resource\s+"aws_kms_alias"\s+"main_us_east_1"/);
    expectContains(tf, /resource\s+"aws_kms_key"\s+"main_us_west_2"[\s\S]*enable_key_rotation\s*=\s*true/);
    expectContains(tf, /resource\s+"aws_kms_alias"\s+"main_us_west_2"/);
  });

  test('multi-AZ VPCs with public and private subnets and IGWs', () => {
    expectContains(tf, /resource\s+"aws_vpc"\s+"main_us_east_1"/);
    expectContains(tf, /resource\s+"aws_vpc"\s+"main_us_west_2"/);
    expectContains(tf, /resource\s+"aws_internet_gateway"\s+"main_us_east_1"/);
    expectContains(tf, /resource\s+"aws_internet_gateway"\s+"main_us_west_2"/);
    expectContains(tf, /resource\s+"aws_subnet"\s+"public_us_east_1"[\s\S]*count/);
    expectContains(tf, /resource\s+"aws_subnet"\s+"private_us_east_1"[\s\S]*count/);
    expectContains(tf, /resource\s+"aws_subnet"\s+"public_us_west_2"[\s\S]*count/);
    expectContains(tf, /resource\s+"aws_subnet"\s+"private_us_west_2"[\s\S]*count/);
  });

  test('NAT gateways, route tables, and associations exist per region', () => {
    expectContains(tf, /resource\s+"aws_nat_gateway"\s+"main_us_east_1"/);
    expectContains(tf, /resource\s+"aws_nat_gateway"\s+"main_us_west_2"/);
    expectContains(tf, /resource\s+"aws_route_table"\s+"public_us_east_1"/);
    expectContains(tf, /resource\s+"aws_route_table"\s+"private_us_east_1"/);
    expectContains(tf, /resource\s+"aws_route_table_association"\s+"public_us_east_1"/);
    expectContains(tf, /resource\s+"aws_route_table_association"\s+"private_us_east_1"/);
    expectContains(tf, /resource\s+"aws_route_table"\s+"public_us_west_2"/);
    expectContains(tf, /resource\s+"aws_route_table"\s+"private_us_west_2"/);
    expectContains(tf, /resource\s+"aws_route_table_association"\s+"public_us_west_2"/);
    expectContains(tf, /resource\s+"aws_route_table_association"\s+"private_us_west_2"/);
  });

  test('VPC Flow Logs to KMS-encrypted CloudWatch log groups with role and policy', () => {
    expectContains(tf, /resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs_us_east_1"[\s\S]*kms_key_id/);
    expectContains(tf, /resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs_us_west_2"[\s\S]*kms_key_id/);
    expectContains(tf, /resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
    expectContains(tf, /resource\s+"aws_flow_log"\s+"vpc_us_east_1"[\s\S]*traffic_type\s*=\s*"ALL"/);
    expectContains(tf, /resource\s+"aws_flow_log"\s+"vpc_us_west_2"[\s\S]*traffic_type\s*=\s*"ALL"/);
  });

  test('S3 buckets per region with KMS SSE, versioning, lifecycle, and public access block', () => {
    expectContains(tf, /resource\s+"aws_s3_bucket"\s+"app_us_east_1"/);
    expectContains(tf, /resource\s+"aws_s3_bucket"\s+"app_us_west_2"/);
    expectContains(tf, /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app_us_east_1"[\s\S]*kms_master_key_id/);
    expectContains(tf, /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app_us_west_2"[\s\S]*kms_master_key_id/);
    expectContains(tf, /resource\s+"aws_s3_bucket_versioning"\s+"app_us_east_1"/);
    expectContains(tf, /resource\s+"aws_s3_bucket_versioning"\s+"app_us_west_2"/);
    expectContains(tf, /resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"app_us_east_1"[\s\S]*noncurrent_version_expiration/);
    expectContains(tf, /resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"app_us_west_2"[\s\S]*noncurrent_version_expiration/);
    expectContains(tf, /resource\s+"aws_s3_bucket_public_access_block"\s+"app_us_east_1"/);
    expectContains(tf, /resource\s+"aws_s3_bucket_public_access_block"\s+"app_us_west_2"/);
  });

  test('ALBs, target groups, listeners, and attachments exist per region', () => {
    expectContains(tf, /resource\s+"aws_lb"\s+"main_us_east_1"/);
    expectContains(tf, /resource\s+"aws_lb"\s+"main_us_west_2"/);
    expectContains(tf, /resource\s+"aws_lb_target_group"\s+"app_us_east_1"/);
    expectContains(tf, /resource\s+"aws_lb_target_group"\s+"app_us_west_2"/);
    expectContains(tf, /resource\s+"aws_lb_listener"\s+"http_us_east_1"/);
    expectContains(tf, /resource\s+"aws_lb_listener"\s+"http_us_west_2"/);
    // Optional HTTPS listeners
    expectContains(tf, /resource\s+"aws_lb_listener"\s+"https_us_east_1"/);
    expectContains(tf, /resource\s+"aws_lb_listener"\s+"https_us_west_2"/);
    expectContains(tf, /resource\s+"aws_lb_target_group_attachment"\s+"app_us_east_1"/);
    expectContains(tf, /resource\s+"aws_lb_target_group_attachment"\s+"app_us_west_2"/);
  });

  test('EC2 instances use instance profile and encrypted EBS with KMS', () => {
    expectContains(tf, /resource\s+"aws_iam_instance_profile"\s+"ec2_instance"/);
    expectContains(tf, /aws_instance\s+"app_us_east_1"[\s\S]*iam_instance_profile/);
    expectContains(tf, /aws_instance\s+"app_us_east_1"[\s\S]*encrypted\s*=\s*true[\s\S]*kms_key_id/);
    expectContains(tf, /aws_instance\s+"app_us_west_2"[\s\S]*iam_instance_profile/);
    expectContains(tf, /aws_instance\s+"app_us_west_2"[\s\S]*encrypted\s*=\s*true[\s\S]*kms_key_id/);
  });

  test('RDS instances meet security requirements', () => {
    expectContains(tf, /aws_db_instance\s+"main_us_east_1"[\s\S]*storage_encrypted\s*=\s*true/);
    expectContains(tf, /aws_db_instance\s+"main_us_east_1"[\s\S]*backup_retention_period\s*=\s*var\.backup_retention_days/);
    expectContains(tf, /aws_db_instance\s+"main_us_east_1"[\s\S]*deletion_protection\s*=\s*true/);
    expectContains(tf, /aws_db_instance\s+"main_us_west_2"[\s\S]*storage_encrypted\s*=\s*true/);
    expectContains(tf, /aws_db_instance\s+"main_us_west_2"[\s\S]*backup_retention_period\s*=\s*var\.backup_retention_days/);
    expectContains(tf, /aws_db_instance\s+"main_us_west_2"[\s\S]*deletion_protection\s*=\s*true/);
  });

  test('Lambda IAM role and policies exist (logs + KMS + S3 policy stubs)', () => {
    expectContains(tf, /resource\s+"aws_iam_role"\s+"lambda"/);
    expectContains(tf, /resource\s+"aws_iam_role_policy"\s+"lambda_logs_us_east_1"/);
    expectContains(tf, /resource\s+"aws_iam_role_policy"\s+"lambda_logs_us_west_2"/);
    expectContains(tf, /resource\s+"aws_iam_role_policy"\s+"lambda_s3_us_east_1"/);
  });

  test('Lambda functions per region with env vars and KMS encryption are defined (requirement)', () => {
    // Expected shape hints; these checks will fail until functions are implemented
    expectContains(
      tf,
      /resource\s+"aws_lambda_function"\s+"main_us_east_1"[\s\S]*filename\s*=\s*var\.lambda_zip_path[\s\S]*handler\s*=\s*var\.lambda_handler[\s\S]*runtime\s*=\s*var\.lambda_runtime[\s\S]*kms_key_arn\s*=\s*aws_kms_key\.main_us_east_1\.arn/,
      'Missing aws_lambda_function.main_us_east_1 with KMS-encrypted env'
    );
    expectContains(
      tf,
      /resource\s+"aws_lambda_function"\s+"main_us_west_2"[\s\S]*filename\s*=\s*var\.lambda_zip_path[\s\S]*handler\s*=\s*var\.lambda_handler[\s\S]*runtime\s*=\s*var\.lambda_runtime[\s\S]*kms_key_arn\s*=\s*aws_kms_key\.main_us_west_2\.arn/,
      'Missing aws_lambda_function.main_us_west_2 with KMS-encrypted env'
    );
  });

  test('All regional resources specify provider alias explicitly', () => {
    // Spot check a representative set
    [
      'aws_vpc.main_us_east_1',
      'aws_vpc.main_us_west_2',
      'aws_subnet.public_us_east_1',
      'aws_subnet.public_us_west_2',
      'aws_cloudwatch_log_group.vpc_flow_logs_us_east_1',
      'aws_cloudwatch_log_group.vpc_flow_logs_us_west_2',
      'aws_lb.main_us_east_1',
      'aws_lb.main_us_west_2',
      'aws_instance.app_us_east_1',
      'aws_instance.app_us_west_2',
    ].forEach((res) => {
      const [type, name] = res.split('.');
      const re = new RegExp(`resource\\s+"${type}"\\s+"${name}"[\\s\\S]*provider\\s*=\\s*aws\\.(us_east_1|us_west_2)`);
      expectContains(tf, re, `Resource ${res} should set provider alias explicitly`);
    });
  });

  test('Global tagging applied to taggable resources', () => {
    // Check some taggable resources include merge(local.common_tags)
    [
      'aws_vpc.main_us_east_1',
      'aws_vpc.main_us_west_2',
      'aws_lb.main_us_east_1',
      'aws_lb.main_us_west_2',
      'aws_s3_bucket.app_us_east_1',
      'aws_s3_bucket.app_us_west_2',
      'aws_db_instance.main_us_east_1',
      'aws_db_instance.main_us_west_2',
    ].forEach((res) => {
      const [type, name] = res.split('.');
      const re = new RegExp(`resource\\s+"${type}"\\s+"${name}"[\\s\\S]*tags\\s*=\\s*merge\\(local\\.common_tags`);
      expectContains(tf, re, `Resource ${res} should merge local.common_tags`);
    });
  });

  test('Security groups adhere to least-privilege patterns', () => {
    // App SG only ingress from ALB SG
    expectContains(tf, /aws_security_group\s+"app_us_east_1"[\s\S]*security_groups\s*=\s*\[aws_security_group\.alb_us_east_1\.id\]/);
    expectContains(tf, /aws_security_group\s+"app_us_west_2"[\s\S]*security_groups\s*=\s*\[aws_security_group\.alb_us_west_2\.id\]/);

    // DB SG only ingress from app SG
    expectContains(tf, /aws_security_group\s+"db_us_east_1"[\s\S]*security_groups\s*=\s*\[aws_security_group\.app_us_east_1\.id\]/);
    expectContains(tf, /aws_security_group\s+"db_us_west_2"[\s\S]*security_groups\s*=\s*\[aws_security_group\.app_us_west_2\.id\]/);
  });

  test('Outputs are defined for key artifacts per region (requirement)', () => {
    // These checks will fail until outputs are implemented in tap_stack.tf
    const requiredOutputs = [
      'vpc_id_us_east_1',
      'vpc_id_us_west_2',
      'alb_dns_name_us_east_1',
      'alb_dns_name_us_west_2',
      's3_bucket_name_us_east_1',
      's3_bucket_name_us_west_2',
      'kms_key_arn_us_east_1',
      'kms_key_arn_us_west_2',
      'rds_endpoint_us_east_1',
      'rds_endpoint_us_west_2',
      'lambda_arn_us_east_1',
      'lambda_arn_us_west_2',
      'vpc_flow_log_id_us_east_1',
      'vpc_flow_log_id_us_west_2',
    ];
    requiredOutputs.forEach((name) => {
      expectContains(tf, new RegExp(`output\\s+"${name}"\\s*\\{`), `Missing output ${name}`);
    });
  });

  test('Hardening defaults: allowed_ingress_cidrs default should not be 0.0.0.0/0', () => {
    // This check enforces a stricter default posture per prompt guidance
    const match = tf.match(/variable\s+"allowed_ingress_cidrs"[\s\S]*default\s*=\s*\[([^\]]*)\]/);
    if (match) {
      const defaults = match[1];
      expect(defaults.includes('0.0.0.0/0')).toBe(false);
    }
  });
});


