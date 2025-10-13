// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure
// Tests tap_stack.tf without running terraform init/plan/apply

import fs from 'fs';
import { parseToObject } from 'hcl2-parser';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const STACK_PATH = path.join(LIB_DIR, 'tap_stack.tf');
const PROVIDER_PATH = path.join(LIB_DIR, 'provider.tf');
const VARIABLES_PATH = path.join(LIB_DIR, 'variables.tf');

describe('Terraform Infrastructure - File Structure', () => {
  test('tap_stack.tf file exists', () => {
    expect(fs.existsSync(STACK_PATH)).toBe(true);
  });

  test('provider.tf file exists', () => {
    expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
  });

  test('variables.tf file exists', () => {
    expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
  });

  test('lambda_function.py exists', () => {
    const lambdaPath = path.join(LIB_DIR, 'lambda_function.py');
    expect(fs.existsSync(lambdaPath)).toBe(true);
  });
});

describe('Terraform Infrastructure - Provider Configuration', () => {
  let providerContent: string;
  let parsedProvider: any;

  beforeAll(() => {
    providerContent = fs.readFileSync(PROVIDER_PATH, 'utf-8');
    try {
      parsedProvider = parseToObject(providerContent);
    } catch (e) {
      parsedProvider = null;
    }
  });

  test('provider.tf contains terraform block', () => {
    expect(providerContent).toContain('terraform');
  });

  test('provider.tf has multi-region AWS providers', () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"primary"/);
    expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"secondary"/);
  });

  test('provider.tf includes archive provider', () => {
    expect(providerContent).toContain('archive');
  });

  test('provider.tf has S3 backend configured', () => {
    expect(providerContent).toMatch(/backend\s+"s3"/);
  });

  test('tap_stack.tf does not contain provider blocks', () => {
    const stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
    expect(stackContent).not.toMatch(/^provider\s+"aws"\s*{/m);
  });
});

describe('Terraform Infrastructure - Variables', () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(VARIABLES_PATH, 'utf-8');
  });

  const requiredVariables = [
    'app_name',
    'environment',
    'primary_region',
    'secondary_region',
    'domain_name',
    'lambda_reserved_concurrency',
    'waf_rate_limit',
    'blocked_countries',
    'log_retention_days',
    'common_tags',
  ];

  requiredVariables.forEach((varName) => {
    test(`variable "${varName}" is defined`, () => {
      const regex = new RegExp(`variable\\s+"${varName}"\\s*{`, 'i');
      expect(variablesContent).toMatch(regex);
    });
  });

  test('primary_region defaults to us-east-1', () => {
    expect(variablesContent).toMatch(/primary_region[\s\S]*?default\s*=\s*"us-east-1"/);
  });

  test('secondary_region defaults to us-west-2', () => {
    expect(variablesContent).toMatch(/secondary_region[\s\S]*?default\s*=\s*"us-west-2"/);
  });
});

describe('Terraform Infrastructure - Multi-Region Resources', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  describe('KMS Keys', () => {
    test('primary KMS key is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"primary_key"/);
    });

    test('secondary KMS key is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"secondary_key"/);
    });

    test('KMS keys have key rotation enabled', () => {
      const matches = stackContent.match(/enable_key_rotation\s*=\s*true/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test('KMS key aliases are defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"primary_key_alias"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"secondary_key_alias"/);
    });
  });

  describe('S3 Buckets', () => {
    test('primary S3 bucket is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primary_bucket"/);
    });

    test('secondary S3 bucket is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secondary_bucket"/);
    });

    test('S3 buckets have versioning enabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary_versioning"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secondary_versioning"/);
    });

    test('S3 buckets have encryption configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary_encryption"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary_encryption"/);
    });

    test('S3 buckets have public access blocked', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"primary_bucket"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"secondary_bucket"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('S3 buckets have lifecycle policies', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"primary_lifecycle"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"secondary_lifecycle"/);
    });

    test('cross-region replication is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"replication"/);
    });

    test('replication uses KMS encryption', () => {
      expect(stackContent).toMatch(/encryption_configuration\s*{[\s\S]*?replica_kms_key_id/);
    });
  });

  describe('DynamoDB Global Tables', () => {
    test('DynamoDB global table is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"global_table"/);
    });

    test('DynamoDB uses PAY_PER_REQUEST billing', () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('DynamoDB has streams enabled', () => {
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
    });

    test('DynamoDB has point-in-time recovery enabled', () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test('DynamoDB has server-side encryption', () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test('DynamoDB has replica in secondary region', () => {
      expect(stackContent).toMatch(/replica\s*{[\s\S]*?region_name/);
    });

    test('DynamoDB has TTL enabled for GDPR compliance', () => {
      expect(stackContent).toMatch(/ttl\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test('DynamoDB has global secondary indexes', () => {
      expect(stackContent).toMatch(/global_secondary_index\s*{[\s\S]*?name\s*=\s*"email-index"/);
      expect(stackContent).toMatch(/global_secondary_index\s*{[\s\S]*?name\s*=\s*"tenant-created-index"/);
    });
  });

  describe('Lambda Functions', () => {
    test('primary Lambda function is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"api_handler_primary"/);
    });

    test('secondary Lambda function is defined', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"api_handler_secondary"/);
    });

    test('Lambda uses Graviton2 architecture', () => {
      const matches = stackContent.match(/architectures\s*=\s*\["arm64"\]/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test('Lambda has X-Ray tracing enabled', () => {
      expect(stackContent).toMatch(/tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"/);
    });

    test('Lambda has proper environment variables', () => {
      expect(stackContent).toMatch(/environment\s*{[\s\S]*?variables\s*=\s*{[\s\S]*?ENVIRONMENT/);
      expect(stackContent).toMatch(/TABLE_NAME/);
      expect(stackContent).toMatch(/BUCKET_NAME/);
      expect(stackContent).toMatch(/KMS_KEY_ID/);
      expect(stackContent).toMatch(/EVENT_BUS_NAME/);
    });

  test('Lambda IAM roles are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role_secondary"/);
  });

  test('Lambda IAM policies are defined with least privilege', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_policy_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_policy_secondary"/);
    // Check that there are no wildcard resources in critical permissions
    const policySection = stackContent.match(/resource\s+"aws_iam_policy"\s+"lambda_policy_primary"[\s\S]*?(?=resource\s+"|$)/);
    if (policySection) {
      // Should have specific ARNs, not wildcards for DynamoDB
      expect(policySection[0]).toMatch(/dynamodb:.*table\/\$\{var\.app_name\}/);
    }
  });

    test('Lambda deployment package is defined', () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"lambda_package"/);
    });
  });
});

describe('Terraform Infrastructure - API Gateway', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('primary API Gateway is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"primary_api"/);
  });

  test('secondary API Gateway is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"secondary_api"/);
  });

  test('API Gateway has health endpoint', () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"primary_health"/);
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"secondary_health"/);
    expect(stackContent).toMatch(/path_part\s*=\s*"health"/);
  });

  test('API Gateway has users endpoint', () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"primary_users"/);
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"secondary_users"/);
    expect(stackContent).toMatch(/path_part\s*=\s*"users"/);
  });

  test('API Gateway has stage configuration', () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"primary_stage"/);
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"secondary_stage"/);
  });

  test('API Gateway has X-Ray tracing enabled', () => {
    expect(stackContent).toMatch(/xray_tracing_enabled\s*=\s*true/);
  });

  test('API Gateway has CloudWatch logging configured', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs_secondary"/);
    expect(stackContent).toMatch(/access_log_settings/);
  });

  test('API Gateway has throttling configured', () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method_settings"/);
    expect(stackContent).toMatch(/throttling_burst_limit/);
    expect(stackContent).toMatch(/throttling_rate_limit/);
  });

  test('API Gateway has caching enabled', () => {
    expect(stackContent).toMatch(/caching_enabled/);
    expect(stackContent).toMatch(/cache_ttl_in_seconds/);
    expect(stackContent).toMatch(/cache_data_encrypted\s*=\s*true/);
  });

  test('API Gateway has proper IAM roles for logging', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch_secondary"/);
  });

  test('API Gateway deployments exist', () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"primary_deployment"/);
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"secondary_deployment"/);
  });

  test('Lambda permissions for API Gateway are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"primary_api_permission"/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"secondary_api_permission"/);
  });
});

describe('Terraform Infrastructure - Route 53', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('Route 53 hosted zone is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"main"/);
  });

  test('Route 53 health checks are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"primary_health"/);
    expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"secondary_health"/);
  });

  test('Route 53 health checks monitor health endpoint', () => {
    expect(stackContent).toMatch(/resource_path\s*=\s*".*health"/);
  });

  test('Route 53 records have latency-based routing', () => {
    expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"primary_api"/);
    expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"secondary_api"/);
    expect(stackContent).toMatch(/latency_routing_policy/);
  });

  test('Route 53 records are associated with health checks', () => {
    expect(stackContent).toMatch(/health_check_id\s*=\s*aws_route53_health_check/);
  });
});

describe('Terraform Infrastructure - WAF', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('WAF Web ACL for primary region is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"primary_waf"/);
  });

  test('WAF Web ACL for secondary region is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"secondary_waf"/);
  });

  test('WAF has rate limiting rule', () => {
    expect(stackContent).toMatch(/rate_based_statement/);
    expect(stackContent).toMatch(/aggregate_key_type\s*=\s*"IP"/);
  });

  test('WAF has geo-blocking rule', () => {
    expect(stackContent).toMatch(/geo_match_statement/);
    expect(stackContent).toMatch(/country_codes/);
  });

  test('WAF has SQL injection protection', () => {
    expect(stackContent).toMatch(/sqli_match_statement/);
  });

  test('WAF is associated with API Gateway', () => {
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"primary_api_waf"/);
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"secondary_api_waf"/);
  });

  test('WAF has CloudWatch metrics enabled', () => {
    expect(stackContent).toMatch(/cloudwatch_metrics_enabled\s*=\s*true/);
  });
});

describe('Terraform Infrastructure - EventBridge', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('EventBridge buses are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_bus"\s+"primary_bus"/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_bus"\s+"secondary_bus"/);
  });

  test('EventBridge rules are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"primary_user_events"/);
  });

  test('EventBridge has cross-region event target', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"cross_region_replication"/);
  });

  test('EventBridge IAM role is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge_role"/);
  });

  test('EventBridge IAM policy is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"eventbridge_policy"/);
  });
});

describe('Terraform Infrastructure - CloudWatch Synthetics', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('Synthetics buckets are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"synthetics_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"synthetics_secondary"/);
  });

  test('Synthetics buckets have security configurations', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"synthetics_primary_versioning"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"synthetics_primary_encryption"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"synthetics_primary"/);
  });

  test('Synthetics canaries are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_synthetics_canary"\s+"primary_canary"/);
    expect(stackContent).toMatch(/resource\s+"aws_synthetics_canary"\s+"secondary_canary"/);
  });

  test('Synthetics canary scripts are inline', () => {
    expect(stackContent).toMatch(/data\s+"archive_file"\s+"canary_script_primary"/);
    expect(stackContent).toMatch(/data\s+"archive_file"\s+"canary_script_secondary"/);
  });

  test('Synthetics canaries have X-Ray enabled', () => {
    expect(stackContent).toMatch(/active_tracing\s*=\s*true/);
  });

  test('Synthetics IAM roles are defined for both regions', () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"synthetics_role_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"synthetics_role_secondary"/);
  });
});

describe('Terraform Infrastructure - X-Ray', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('X-Ray sampling rule is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_xray_sampling_rule"\s+"main"/);
  });

  test('X-Ray has appropriate sampling rate', () => {
    expect(stackContent).toMatch(/fixed_rate\s*=\s*0\.\d+/);
  });
});

describe('Terraform Infrastructure - QuickSight & Analytics', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('QuickSight S3 bucket is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"quicksight_data"/);
  });

  test('QuickSight bucket has security configurations', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"quicksight_versioning"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"quicksight_encryption"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"quicksight_data"/);
  });

  test('Athena database is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_athena_database"\s+"analytics_db"/);
  });

  test('Athena workgroup is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_athena_workgroup"\s+"analytics_workgroup"/);
  });

  test('Athena has encryption configured', () => {
    expect(stackContent).toMatch(/encryption_configuration\s*{[\s\S]*?encryption_option\s*=\s*"SSE_KMS"/);
  });

  test('Athena results bucket is defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"athena_results"/);
  });
});

describe('Terraform Infrastructure - CloudWatch Monitoring', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('CloudWatch log groups for Lambda are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs_secondary"/);
  });

  test('CloudWatch log groups have retention configured', () => {
    expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
  });

  test('CloudWatch log groups have encryption', () => {
    expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key/);
  });

  test('CloudWatch alarms are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttles"/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_gateway_5xx_primary"/);
  });

  test('CloudWatch alarms have proper thresholds', () => {
    expect(stackContent).toMatch(/threshold\s*=\s*\d+/);
    expect(stackContent).toMatch(/evaluation_periods\s*=\s*\d+/);
  });

  test('SNS topics for alerts are defined', () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts_primary"/);
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts_secondary"/);
  });

  test('SNS topics have KMS encryption', () => {
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key/);
  });
});

describe('Terraform Infrastructure - Security Best Practices', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('no hardcoded credentials in code', () => {
    expect(stackContent).not.toMatch(/password\s*=\s*"[^$]/i);
    expect(stackContent).not.toMatch(/secret\s*=\s*"[^$]/i);
    expect(stackContent).not.toMatch(/access_key\s*=\s*"AK/i);
  });

  test('KMS encryption is used for sensitive resources', () => {
    const kmsMatches = stackContent.match(/kms_key_arn|kms_master_key_id|kms_key_id/g);
    expect(kmsMatches).toBeTruthy();
    expect(kmsMatches!.length).toBeGreaterThan(10);
  });

  test('S3 buckets have secure configurations', () => {
    // All S3 buckets should have public access blocked
    const s3BucketMatches = stackContent.match(/resource\s+"aws_s3_bucket"/g);
    const publicAccessMatches = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g);

    expect(s3BucketMatches).toBeTruthy();
    expect(publicAccessMatches).toBeTruthy();
    // Should have multiple public access blocks
    expect(publicAccessMatches!.length).toBeGreaterThanOrEqual(5);
  });

  test('IAM policies use least privilege (no wildcards in critical resources)', () => {
    // Check that KMS policies don't use wildcards
    const kmsSection = stackContent.match(/kms:Decrypt[\s\S]*?Resource\s*=\s*(\[[\s\S]*?\]|"[^"]*")/g);
    if (kmsSection && kmsSection.length > 0) {
      // At least some KMS policies should have specific ARNs
      const specificKmsArns = kmsSection.filter(s => s.includes('aws_kms_key'));
      expect(specificKmsArns.length).toBeGreaterThan(0);
    }
  });

  test('resources have proper tags for cost allocation', () => {
    expect(stackContent).toMatch(/tags\s*=\s*merge\(var\.common_tags/);
  });

  test('depends_on is used for proper resource ordering', () => {
    const dependsOnMatches = stackContent.match(/depends_on\s*=\s*\[/g);
    expect(dependsOnMatches).toBeTruthy();
    expect(dependsOnMatches!.length).toBeGreaterThan(5);
  });
});

describe('Terraform Infrastructure - GDPR Compliance', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('DynamoDB has TTL enabled for data retention', () => {
    expect(stackContent).toMatch(/ttl\s*{[\s\S]*?attribute_name\s*=\s*"ttl"/);
    expect(stackContent).toMatch(/ttl\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test('S3 buckets have lifecycle policies for data retention', () => {
    expect(stackContent).toMatch(/expiration\s*{[\s\S]*?days\s*=\s*\d+/);
  });

  test('KMS keys have GDPR compliance tags', () => {
    expect(stackContent).toMatch(/Compliance\s*=\s*"GDPR"/);
  });

  test('encryption at rest is configured for all data stores', () => {
    expect(stackContent).toMatch(/server_side_encryption/);
    expect(stackContent).toMatch(/encryption_configuration/);
  });

  test('point-in-time recovery is enabled', () => {
    expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
  });
});

describe('Terraform Infrastructure - High Availability', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('resources are deployed in multiple regions', () => {
    expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
    expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
  });

  test('DynamoDB has global table replication', () => {
    expect(stackContent).toMatch(/replica\s*{[\s\S]*?region_name/);
  });

  test('S3 has cross-region replication', () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"/);
  });

  test('Route 53 provides automated failover', () => {
    expect(stackContent).toMatch(/health_check_id/);
    expect(stackContent).toMatch(/latency_routing_policy/);
  });

  test('Lambda has reserved concurrency configured', () => {
    expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*var\.lambda_reserved_concurrency/);
  });
});

describe('Terraform Infrastructure - Outputs', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('primary API endpoint output is defined', () => {
    expect(stackContent).toMatch(/output\s+"primary_api_endpoint"/);
  });

  test('secondary API endpoint output is defined', () => {
    expect(stackContent).toMatch(/output\s+"secondary_api_endpoint"/);
  });

  test('global API endpoint output is defined', () => {
    expect(stackContent).toMatch(/output\s+"global_api_endpoint"/);
  });

  test('DynamoDB table name output is defined', () => {
    expect(stackContent).toMatch(/output\s+"dynamodb_table_name"/);
  });

  test('outputs have descriptions', () => {
    const outputMatches = stackContent.match(/output\s+"[^"]+"\s*{[\s\S]*?description/g);
    expect(outputMatches).toBeTruthy();
    expect(outputMatches!.length).toBeGreaterThan(3);
  });
});

describe('Lambda Application - Python Code', () => {
  let lambdaContent: string;

  beforeAll(() => {
    const lambdaPath = path.join(LIB_DIR, 'lambda_function.py');
    lambdaContent = fs.readFileSync(lambdaPath, 'utf-8');
  });

  test('lambda_handler function is defined', () => {
    expect(lambdaContent).toMatch(/def\s+lambda_handler\s*\(/);
  });

  test('CRUD operations are implemented', () => {
    expect(lambdaContent).toMatch(/def\s+create_user\s*\(/);
    expect(lambdaContent).toMatch(/def\s+get_user\s*\(/);
    expect(lambdaContent).toMatch(/def\s+update_user\s*\(/);
    expect(lambdaContent).toMatch(/def\s+delete_user\s*\(/);
    expect(lambdaContent).toMatch(/def\s+list_users\s*\(/);
  });

  test('health check endpoint is implemented', () => {
    expect(lambdaContent).toMatch(/def\s+health_check\s*\(/);
  });

  test('X-Ray tracing is configured', () => {
    expect(lambdaContent).toMatch(/aws_xray_sdk/);
    expect(lambdaContent).toMatch(/xray_recorder/);
  });

  test('EventBridge integration is present', () => {
    expect(lambdaContent).toMatch(/def\s+send_analytics_event/);
    expect(lambdaContent).toMatch(/events\.put_events/);
  });

  test('GDPR compliance features are implemented', () => {
    expect(lambdaContent).toMatch(/ttl/i);
    expect(lambdaContent).toMatch(/gdprConsent/);
    expect(lambdaContent).toMatch(/dataRetention/);
  });

  test('error handling is implemented', () => {
    expect(lambdaContent).toMatch(/try:/);
    expect(lambdaContent).toMatch(/except/);
    expect(lambdaContent).toMatch(/logger\.error/);
  });

  test('environment variables are used', () => {
    expect(lambdaContent).toMatch(/os\.environ/);
    expect(lambdaContent).toMatch(/TABLE_NAME/);
    expect(lambdaContent).toMatch(/BUCKET_NAME/);
    expect(lambdaContent).toMatch(/REGION/);
  });

  test('multi-tenant support is implemented', () => {
    expect(lambdaContent).toMatch(/tenantId/);
  });

  test('logging is configured', () => {
    expect(lambdaContent).toMatch(/import\s+logging/);
    expect(lambdaContent).toMatch(/logger\s*=\s*logging\.getLogger/);
  });
});

describe('Requirements Compliance from PROMPT.md', () => {
  let stackContent: string;
  let variablesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
    variablesContent = fs.readFileSync(VARIABLES_PATH, 'utf-8');
  });

  test('multi-region deployment (us-east-1 and us-west-2)', () => {
    expect(variablesContent).toMatch(/primary_region[\s\S]*?default\s*=\s*"us-east-1"/);
    expect(variablesContent).toMatch(/secondary_region[\s\S]*?default\s*=\s*"us-west-2"/);
  });

  test('API Gateway in both regions', () => {
    expect(stackContent).toMatch(/aws_api_gateway_rest_api.*primary_api/);
    expect(stackContent).toMatch(/aws_api_gateway_rest_api.*secondary_api/);
  });

  test('Lambda with Graviton2 processors', () => {
    expect(stackContent).toMatch(/architectures.*arm64/);
  });

  test('DynamoDB Global Tables', () => {
    expect(stackContent).toMatch(/aws_dynamodb_table.*global_table/);
    expect(stackContent).toMatch(/replica/);
  });

  test('S3 cross-region replication', () => {
    expect(stackContent).toMatch(/aws_s3_bucket_replication_configuration/);
  });

  test('Route 53 latency-based routing', () => {
    expect(stackContent).toMatch(/latency_routing_policy/);
  });

  test('EventBridge for cross-region events', () => {
    expect(stackContent).toMatch(/aws_cloudwatch_event_bus/);
    expect(stackContent).toMatch(/cross_region/i);
  });

  test('CloudWatch Synthetics for monitoring', () => {
    expect(stackContent).toMatch(/aws_synthetics_canary/);
  });

  test('WAF for security', () => {
    expect(stackContent).toMatch(/aws_wafv2_web_acl/);
    expect(stackContent).toMatch(/rate_based_statement/);
  });

  test('X-Ray for tracing', () => {
    expect(stackContent).toMatch(/xray_tracing_enabled\s*=\s*true/);
    expect(stackContent).toMatch(/aws_xray_sampling_rule/);
  });

  test('QuickSight for analytics', () => {
    expect(stackContent).toMatch(/quicksight/i);
    expect(stackContent).toMatch(/athena/i);
  });

  test('99.999% uptime design (multi-region, health checks, failover)', () => {
    expect(stackContent).toMatch(/aws_route53_health_check/);
    expect(stackContent).toMatch(/replica/);
    expect(stackContent).toMatch(/replication/);
  });

  test('GDPR compliance features', () => {
    expect(stackContent).toMatch(/ttl/i);
    expect(stackContent).toMatch(/Compliance.*GDPR/);
    expect(stackContent).toMatch(/encryption/i);
  });

  test('real-time analytics infrastructure', () => {
    expect(stackContent).toMatch(/EventBridge|event_bus/i);
    expect(stackContent).toMatch(/QuickSight|athena/i);
  });

  test('demo SaaS application (Lambda function)', () => {
    const lambdaPath = path.join(LIB_DIR, 'lambda_function.py');
    expect(fs.existsSync(lambdaPath)).toBe(true);
    const lambdaContent = fs.readFileSync(lambdaPath, 'utf-8');
    expect(lambdaContent).toMatch(/create_user|get_user|update_user|delete_user/);
  });
});

describe('Code Quality & Standards', () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf-8');
  });

  test('consistent resource naming convention', () => {
    // Resources should follow pattern: service_purpose_region
    expect(stackContent).toMatch(/primary_\w+|secondary_\w+/);
  });

  test('comprehensive comments for complex resources', () => {
    const commentMatches = stackContent.match(/#[^\n]+/g);
    expect(commentMatches).toBeTruthy();
    expect(commentMatches!.length).toBeGreaterThan(50);
  });

  test('no TODO or FIXME comments in production code', () => {
    expect(stackContent).not.toMatch(/TODO|FIXME/i);
  });

  test('proper HCL formatting (no syntax errors)', () => {
    // Basic syntax check - balanced braces
    const openBraces = (stackContent.match(/{/g) || []).length;
    const closeBraces = (stackContent.match(/}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });
});