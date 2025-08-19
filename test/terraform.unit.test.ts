import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const stackPath = path.resolve(__dirname, STACK_REL);

const readStack = () => fs.readFileSync(stackPath, 'utf8');

describe('Terraform single-file stack: tap_stack.tf', () => {
  test('tap_stack.tf exists', () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) console.error(`[unit] Expected stack at: ${stackPath}`);
    expect(exists).toBe(true);
  });

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    const content = readStack();
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*\{/);
  });

  test('declares required variables', () => {
    const c = readStack();
    const vars = [
      'aws_region',
      'project_name',
      'environment',
      'allowed_cidrs',
      'instance_type',
      'ec2_key_name',
      'desired_capacity',
      'min_size',
      'max_size',
      'rds_engine_version',
      'rds_instance_class',
      'rds_username',
      'rds_password',
      'log_retention_days',
      'cost_allocation_tag_keys',
      'alarm_email',
      'acm_certificate_arn',
    ];
    for (const v of vars) {
      expect(c).toMatch(new RegExp(`variable\\s+"${v}"\\s*\\{`));
    }
  });

  test('has locals for naming/tagging and AZs', () => {
    const c = readStack();
    expect(c).toMatch(/locals\s*\{/);
    expect(c).toMatch(
      /name_prefix\s*=\s*"\$\{var\.project_name}-\$\{var\.environment}\"/
    );
    expect(c).toMatch(/common_tags\s*=\s*\{/);
    expect(c).toMatch(
      /azs\s*=\s*data\.aws_availability_zones\.available\.names/
    );
  });

  test('KMS keys exist for main and RDS', () => {
    const c = readStack();
    expect(c).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*\{/);
    expect(c).toMatch(/resource\s+"aws_kms_key"\s+"rds"\s*\{/);
  });

  test('VPC and subnets across multiple AZs', () => {
    const c = readStack();
    expect(c).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(c).toMatch(/resource\s+"aws_subnet"\s+"public"[\s\S]*count\s*=\s*2/);
    expect(c).toMatch(
      /resource\s+"aws_subnet"\s+"private"[\s\S]*count\s*=\s*2/
    );
    expect(c).toMatch(
      /resource\s+"aws_subnet"\s+"database"[\s\S]*count\s*=\s*2/
    );
  });

  test('NAT gateways and routing are configured', () => {
    const c = readStack();
    expect(c).toMatch(
      /resource\s+"aws_nat_gateway"\s+"main"[\s\S]*count\s*=\s*2/
    );
    expect(c).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(c).toMatch(
      /resource\s+"aws_route_table"\s+"private"[\s\S]*count\s*=\s*2/
    );
  });

  test('VPC endpoint for S3 exists', () => {
    const c = readStack();
    expect(c).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
  });

  test('Flow logs to CloudWatch with KMS and IAM role', () => {
    const c = readStack();
    expect(c).toMatch(/aws_cloudwatch_log_group"\s+"vpc_flow"/);
    expect(c).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    expect(c).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow"/);
    expect(c).toMatch(/resource\s+"aws_flow_log"\s+"vpc"/);
  });

  test('S3 buckets (logs, data, config) with versioning, SSE-KMS, PAB, lifecycle/logging', () => {
    const c = readStack();
    // Buckets
    expect(c).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    expect(c).toMatch(/resource\s+"aws_s3_bucket"\s+"data"/);
    expect(c).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
    // SSE configuration blocks
    expect(c).toMatch(
      /aws_s3_bucket_server_side_encryption_configuration"\s+"logs"[\s\S]*apply_server_side_encryption_by_default/
    );
    expect(c).toMatch(
      /aws_s3_bucket_server_side_encryption_configuration"\s+"data"[\s\S]*apply_server_side_encryption_by_default/
    );
    expect(c).toMatch(
      /aws_s3_bucket_server_side_encryption_configuration"\s+"config"[\s\S]*apply_server_side_encryption_by_default/
    );
    // Public access block
    expect(c).toMatch(/aws_s3_bucket_public_access_block"\s+"logs"/);
    expect(c).toMatch(/aws_s3_bucket_public_access_block"\s+"data"/);
    expect(c).toMatch(/aws_s3_bucket_public_access_block"\s+"config"/);
    // Lifecycle filter usage
    expect(c).toMatch(
      /aws_s3_bucket_lifecycle_configuration"\s+"logs"[\s\S]*filter\s*\{\s*prefix\s*=\s*""/
    );
    expect(c).toMatch(
      /aws_s3_bucket_lifecycle_configuration"\s+"data"[\s\S]*filter\s*\{\s*prefix\s*=\s*""/
    );
    // Data bucket logging to logs bucket
    expect(c).toMatch(
      /resource\s+"aws_s3_bucket_logging"\s+"data"[\s\S]*target_bucket\s*=\s*aws_s3_bucket\.logs\.id/
    );
    // ALB log bucket policy
    expect(c).toMatch(
      /aws_s3_bucket_policy"\s+"logs"[\s\S]*logdelivery\.elasticloadbalancing\.amazonaws\.com/
    );
  });

  test('ALB with HTTPS and redirect from HTTP', () => {
    const c = readStack();
    expect(c).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(c).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
    const hasSingleHttp = /resource\s+"aws_lb_listener"\s+"http"/.test(c);
    const hasSplitHttp =
      /resource\s+"aws_lb_listener"\s+"http_redirect"/.test(c) &&
      /resource\s+"aws_lb_listener"\s+"http_forward"/.test(c);
    expect(hasSingleHttp || hasSplitHttp).toBe(true);
  });

  test('EC2 LT + ASG in private subnets and no external templatefile', () => {
    const c = readStack();
    expect(c).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    expect(c).toMatch(/user_data\s*=\s*local\.user_data/);
    expect(c).not.toMatch(/templatefile\(/);
    expect(c).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
  });

  test('RDS is encrypted, private, multi-AZ with subnet/parameter groups', () => {
    const c = readStack();
    expect(c).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    expect(c).toMatch(/resource\s+"aws_db_parameter_group"\s+"main"/);
    expect(c).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    expect(c).toMatch(/storage_encrypted\s*=\s*true/);
    expect(c).toMatch(/publicly_accessible\s*=\s*false/);
    expect(c).toMatch(/multi_az\s*=\s*true/);
  });

  test('AWS Config recorder, delivery channel, status, and baseline rules', () => {
    const c = readStack();
    expect(c).toMatch(
      /resource\s+"aws_config_configuration_recorder"\s+"main"/
    );
    expect(c).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    expect(c).toMatch(
      /resource\s+"aws_config_configuration_recorder_status"\s+"main"/
    );
    expect(c).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_encryption"/);
    expect(c).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_public_read"/);
    expect(c).toMatch(
      /resource\s+"aws_config_config_rule"\s+"iam_password_policy"/
    );
  });

  test('CloudWatch alarms and SNS topic for notifications exist', () => {
    const c = readStack();
    expect(c).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    expect(c).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_5xx"/);
    expect(c).toMatch(
      /resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_target_5xx"/
    );
  });

  test('Required outputs are defined', () => {
    const c = readStack();
    const outputs = [
      'vpc_id',
      'public_subnet_ids',
      'private_subnet_ids',
      'database_subnet_ids',
      'alb_dns_name',
      'alb_arn',
      'target_group_arn',
      'asg_name',
      'rds_endpoint',
      'kms_main_arn',
      'kms_rds_arn',
      's3_logs_bucket',
      's3_data_bucket',
      's3_config_bucket',
      'sns_topic_arn',
      'vpc_flow_log_group',
      'config_recorder_name',
    ];
    for (const o of outputs) {
      expect(c).toMatch(new RegExp(`output\\s+"${o}"\\s*\\{`));
    }
  });
});
