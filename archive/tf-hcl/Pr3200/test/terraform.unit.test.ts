import { readFileSync } from 'fs';
import { join } from 'path';

const tfPath = join(process.cwd(), 'lib', 'tap_stack.tf');
const tf = readFileSync(tfPath, 'utf8');

describe('tap_stack.tf - Structure and variables', () => {
  test('has proper terraform configuration', () => {
    // The terraform block with required_providers is in provider.tf, not tap_stack.tf
    // This test validates tap_stack.tf has proper structure
    expect(tf).toMatch(/variable\s+"aws_region"/);
    expect(tf).toMatch(/resource\s+"aws_/);
  });

  test('enforces allowed regions and references existing aws_region var', () => {
    expect(tf).toMatch(/variable\s+"aws_region"[\s\S]*?validation[\s\S]*?us-west-2[\s\S]*?us-east-1/);
    expect(tf).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.s3"/);
  });

  test('defines tagging variables', () => {
    expect(tf).toMatch(/variable\s+"project"/);
    expect(tf).toMatch(/variable\s+"environment"/);
    expect(tf).toMatch(/variable\s+"owner"/);
  });
});

describe('Networking and security groups', () => {
  test('single VPC, public/private subnets, IGW, NAT, routes', () => {
    expect(tf).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(tf).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(tf).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(tf).toMatch(/resource\s+"aws_internet_gateway"\s+"igw"/);
    expect(tf).toMatch(/resource\s+"aws_nat_gateway"\s+"nat"/);
    expect(tf).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(tf).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });

  test('S3 VPC endpoint (Gateway) attached to private routes', () => {
    expect(tf).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"[\s\S]*?vpc_endpoint_type\s*=\s*"Gateway"/);
    expect(tf).toMatch(/route_table_ids\s*=\s*\[aws_route_table\.private\.id]/);
  });

  test('default security group deny-all and least-privilege SGs', () => {
    expect(tf).toMatch(/resource\s+"aws_default_security_group"\s+"default"/);
    expect(tf).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
    expect(tf).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    // Lambda egress to RDS via separate security group rule (to avoid circular dependency)
    expect(tf).toMatch(/resource\s+"aws_security_group_rule"\s+"lambda_to_rds"/);
    expect(tf).toMatch(/source_security_group_id\s*=\s*aws_security_group\.rds\.id/);
    expect(tf).toMatch(/security_group_id\s*=\s*aws_security_group\.lambda\.id/);
  });
});

describe('KMS, S3, CloudFront, and WAF', () => {
  test('KMS keys for data and logs with aliases', () => {
    expect(tf).toMatch(/resource\s+"aws_kms_key"\s+"data"/);
    expect(tf).toMatch(/resource\s+"aws_kms_key"\s+"logs"/);
    expect(tf).toMatch(/resource\s+"aws_kms_alias"\s+"data"/);
    expect(tf).toMatch(/resource\s+"aws_kms_alias"\s+"logs"/);
  });

  test('S3 static bucket with versioning, SSE-KMS, TLS-only policy', () => {
    expect(tf).toMatch(/resource\s+"aws_s3_bucket"\s+"static"/);
    expect(tf).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"static"[\s\S]*?Enabled/);
    expect(tf).toMatch(/server_side_encryption[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.data\.arn/);
    expect(tf).toMatch(/aws_s3_bucket_policy"\s+"static_tls_only"[\s\S]*?aws:SecureTransport/);
  });

  test('CloudFront distribution uses OAI and attaches WAF (CLOUDFRONT scope)', () => {
    expect(tf).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"\s+"static"/);
    expect(tf).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"edge"[\s\S]*?scope\s*=\s*"CLOUDFRONT"/);
    expect(tf).toMatch(/web_acl_id\s*=\s*aws_wafv2_web_acl\.edge\.arn/);
    // Default WAF action = block and allow specific IPs rule
    expect(tf).toMatch(/default_action[\s\S]*?block\s*\{\s*\}/);
    expect(tf).toMatch(/rule[\s\S]*?AllowSpecificIPs[\s\S]*?action[\s\S]*?allow\s*\{\s*\}/);
  });
});

describe('Compute, Lambda, API Gateway', () => {
  test('EC2 uses t3.micro and encrypted EBS', () => {
    expect(tf).toMatch(/resource\s+"aws_instance"\s+"web"[\s\S]*?instance_type\s*=\s*"t3\.micro"/);
    expect(tf).toMatch(/root_block_device[\s\S]*?encrypted\s*=\s*true[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.data\.arn/);
  });

  test('Lambda uses latest runtime default and VPC config', () => {
    expect(tf).toMatch(/variable\s+"lambda_runtime"[\s\S]*?default\s*=\s*"nodejs20\.x"/);
    expect(tf).toMatch(/resource\s+"aws_lambda_function"\s+"app"/);
    expect(tf).toMatch(/vpc_config[\s\S]*?subnet_ids[\s\S]*?security_group_ids/);
  });

  test('API Gateway is REGIONAL and integrated to Lambda; stage with access logs', () => {
    expect(tf).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"api"[\s\S]*?endpoint_configuration\s*\{[\s\S]*?REGIONAL/);
    expect(tf).toMatch(/aws_api_gateway_integration"\s+"lambda_proxy"[\s\S]*?type\s*=\s*"AWS_PROXY"/);
    expect(tf).toMatch(/resource\s+"aws_api_gateway_stage"\s+"prod"[\s\S]*?access_log_settings/);
  });
});

describe('Data stores and encryption', () => {
  test('DynamoDB has CMK SSE and PITR', () => {
    expect(tf).toMatch(/resource\s+"aws_dynamodb_table"\s+"app"/);
    expect(tf).toMatch(/server_side_encryption[\s\S]*?kms_key_arn\s*=\s*aws_kms_key\.data\.arn/);
    expect(tf).toMatch(/point_in_time_recovery[\s\S]*?enabled\s*=\s*true/);
  });

  test('RDS is private, Multi-AZ, encrypted, backups, SSL required', () => {
    expect(tf).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    expect(tf).toMatch(/multi_az\s*=\s*true/);
    expect(tf).toMatch(/storage_encrypted\s*=\s*true/);
    expect(tf).toMatch(/publicly_accessible\s*=\s*false/);
    expect(tf).toMatch(/backup_retention_period\s*=\s*7/);
    expect(tf).toMatch(/parameter\s*\{[\s\S]*?name\s*=\s*"require_secure_transport"[\s\S]*?value\s*=\s*"ON"/);
  });
});

describe('Monitoring, logging, and security services', () => {
  test('CloudWatch alarms exist for Lambda errors, RDS CPU, DynamoDB throttles', () => {
    expect(tf).toMatch(/aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
    expect(tf).toMatch(/aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
    expect(tf).toMatch(/aws_cloudwatch_metric_alarm"\s+"dynamodb_throttled"/);
  });

  test('VPC Flow Logs to CloudWatch with KMS', () => {
    expect(tf).toMatch(/resource\s+"aws_flow_log"\s+"vpc"/);
    expect(tf).toMatch(/cloud-watch-logs/);
    expect(tf).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.logs\.arn/);
  });

  test('CloudTrail multi-region with KMS to CW Logs', () => {
    expect(tf).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    expect(tf).toMatch(/is_multi_region_trail\s*=\s*true/);
    expect(tf).toMatch(/kms_key_id\s*=\s*aws_kms_key\.logs\.arn/);
  });

  test('GuardDuty in primary and secondary, findings to SNS via EventBridge', () => {
    expect(tf).toMatch(/resource\s+"aws_guardduty_detector"\s+"primary"/);
    expect(tf).toMatch(/resource\s+"aws_guardduty_detector"\s+"secondary"/);
    expect(tf).toMatch(/aws_cloudwatch_event_rule"\s+"guardduty_findings"/);
    expect(tf).toMatch(/aws_cloudwatch_event_target"\s+"guardduty_to_sns"/);
  });
});

describe('SNS and IAM change management', () => {
  test('SNS topic uses CMK', () => {
    expect(tf).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.data\.arn/);
  });

  test('DevSecOps role and advisory deny policy scaffold exists', () => {
    expect(tf).toMatch(/resource\s+"aws_iam_role"\s+"devsecops"/);
    expect(tf).toMatch(/resource\s+"aws_iam_policy"\s+"security_change_guard"/);
  });
});

describe('Outputs', () => {
  test('exposes core outputs', () => {
    const outputs = [
      'vpc_id',
      'private_subnet_ids',
      'public_subnet_ids',
      'rds_endpoint',
      'dynamodb_table_name',
      'lambda_function_name',
      'cloudfront_domain_name',
      'static_bucket_name',
      'sns_topic_arn',
      'kms_data_key_id',
      'kms_logs_key_id',
    ];
    for (const out of outputs) {
      expect(tf).toMatch(new RegExp(`output\\s+"${out}"`));
    }
  });
});


