// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  let content: string;

  beforeAll(() => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
      throw new Error(`Stack file not found: ${stackPath}`);
    }
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  // --- Provider and Variables ---

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares all required variables", () => {
    expect(content).toMatch(/variable\s+"project_name"\s*{/);
    expect(content).toMatch(/variable\s+"environment"\s*{/);
    expect(content).toMatch(/variable\s+"owner"\s*{/);
    expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
    expect(content).toMatch(/variable\s+"lambda_timeout"\s*{/);
    expect(content).toMatch(/variable\s+"lambda_memory_size"\s*{/);
  });

  // --- Networking Resources ---

  describe("Networking Components", () => {
    test("declares VPC resource", () => {
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("declares private subnets", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test("declares public subnets", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    });

    test("declares Internet Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("declares NAT Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    });

    test("declares VPC Flow Logs for security monitoring", () => {
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"main"\s*{/);
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("declares route tables for public and private subnets", () => {
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });
  });

  // --- Security Components ---

  describe("Security & Encryption", () => {
    test("declares KMS key for encryption", () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("declares KMS alias", () => {
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
    });

    test("declares security groups for Lambda", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    });

    test("declares security groups for ElastiCache", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"elasticache"\s*{/);
    });

    test("declares WAF Web ACL", () => {
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"api"\s*{/);
    });

    test("WAF includes rate limiting rule", () => {
      expect(content).toMatch(/rate_based_statement\s*{/);
      expect(content).toMatch(/aggregate_key_type\s*=\s*"IP"/);
    });

    test("WAF includes SQL injection protection", () => {
      expect(content).toMatch(/sqli_match_statement\s*{/);
    });

    test("WAF is associated with API Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"api"\s*{/);
    });
  });

  // --- IAM Resources ---

  describe("IAM Roles & Policies", () => {
    test("declares Lambda execution role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"\s*{/);
    });

    test("declares Lambda policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_policy"\s*{/);
    });

    test("Lambda policy includes DynamoDB permissions", () => {
      expect(content).toMatch(/dynamodb:GetItem/);
      expect(content).toMatch(/dynamodb:PutItem/);
      expect(content).toMatch(/dynamodb:Query/);
    });

    test("Lambda policy includes X-Ray permissions", () => {
      expect(content).toMatch(/xray:PutTraceSegments/);
      expect(content).toMatch(/xray:PutTelemetryRecords/);
    });

    test("Lambda policy includes SSM Parameter Store permissions", () => {
      expect(content).toMatch(/ssm:GetParameter/);
    });

    test("Lambda policy includes KMS permissions", () => {
      expect(content).toMatch(/kms:Decrypt/);
      expect(content).toMatch(/kms:GenerateDataKey/);
    });

    test("attaches policy to Lambda role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_policy_attachment"\s*{/);
    });
  });

  // --- Data Layer ---

  describe("DynamoDB", () => {
    test("declares DynamoDB table", () => {
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"travel_search"\s*{/);
    });

    test("DynamoDB uses encryption with KMS", () => {
      expect(content).toMatch(/server_side_encryption\s*{/);
      expect(content).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("DynamoDB has point-in-time recovery enabled", () => {
      expect(content).toMatch(/point_in_time_recovery\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
    });

    test("DynamoDB has TTL enabled for GDPR compliance", () => {
      expect(content).toMatch(/ttl\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
    });
  });

  // --- Cache Layer ---

  describe("ElastiCache Redis", () => {
    test("declares ElastiCache subnet group", () => {
      expect(content).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis"\s*{/);
    });

    test("declares ElastiCache parameter group", () => {
      expect(content).toMatch(/resource\s+"aws_elasticache_parameter_group"\s+"redis"\s*{/);
    });

    test("declares ElastiCache replication group", () => {
      expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*{/);
    });

    test("Redis has encryption at rest enabled", () => {
      expect(content).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
    });

    test("Redis has encryption in transit enabled", () => {
      expect(content).toMatch(/transit_encryption_enabled\s*=\s*true/);
    });

    test("Redis has automatic failover enabled", () => {
      expect(content).toMatch(/automatic_failover_enabled\s*=\s*true/);
    });

    test("Redis is deployed in private subnets", () => {
      expect(content).toMatch(/subnet_group_name\s*=\s*aws_elasticache_subnet_group\.redis\.name/);
    });
  });

  // --- Compute Layer ---

  describe("Lambda Functions", () => {
    test("declares Lambda function", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"search_handler"\s*{/);
    });

    test("Lambda uses Python 3.10 runtime", () => {
      expect(content).toMatch(/runtime\s*=\s*"python3\.10"/);
    });

    test("Lambda has X-Ray tracing enabled", () => {
      expect(content).toMatch(/tracing_config\s*{/);
      expect(content).toMatch(/mode\s*=\s*"Active"/);
    });

    test("Lambda is deployed in VPC", () => {
      expect(content).toMatch(/vpc_config\s*{/);
    });

    test("Lambda has environment variables with SSM reference", () => {
      expect(content).toMatch(/environment\s*{/);
      expect(content).toMatch(/SSM_CONFIG_PATH/);
    });

    test("declares Lambda permission for API Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway"\s*{/);
    });
  });

  // --- API Layer ---

  describe("API Gateway", () => {
    test("declares API Gateway REST API", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"\s*{/);
    });

    test("API Gateway is Edge-optimized", () => {
      expect(content).toMatch(/types\s*=\s*\["EDGE"\]/);
    });

    test("declares API Gateway resource for search endpoint", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"search"\s*{/);
      expect(content).toMatch(/path_part\s*=\s*"search"/);
    });

    test("declares API Gateway method (POST)", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"search_post"\s*{/);
      expect(content).toMatch(/http_method\s*=\s*"POST"/);
    });

    test("declares API Gateway integration with Lambda", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"search_post"\s*{/);
      expect(content).toMatch(/type\s*=\s*"AWS_PROXY"/);
    });

    test("declares API Gateway deployment", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"main"\s*{/);
    });

    test("declares API Gateway stage", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"\s*{/);
    });

    test("API Gateway stage has X-Ray tracing enabled", () => {
      expect(content).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });

    test("API Gateway has access logging configured", () => {
      expect(content).toMatch(/access_log_settings\s*{/);
    });

    test("declares API Gateway method settings", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_method_settings"\s+"main"\s*{/);
    });

    test("API Gateway has caching enabled", () => {
      expect(content).toMatch(/caching_enabled\s*=\s*true/);
    });

    test("API Gateway has throttling configured", () => {
      expect(content).toMatch(/throttling_rate_limit/);
      expect(content).toMatch(/throttling_burst_limit/);
    });

    test("API Gateway has metrics enabled", () => {
      expect(content).toMatch(/metrics_enabled\s*=\s*true/);
    });
  });

  // --- Monitoring & Logging ---

  describe("CloudWatch Monitoring", () => {
    test("declares CloudWatch log group for API Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"\s*{/);
    });

    test("declares CloudWatch log group for Lambda", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"\s*{/);
    });

    test("declares CloudWatch log group for VPC Flow Logs", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"\s*{/);
    });

    test("log groups have 30-day retention", () => {
      expect(content).toMatch(/retention_in_days\s*=\s*30/);
    });

    test("log groups are encrypted with KMS", () => {
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("declares CloudWatch alarm for API errors", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_error_rate"\s*{/);
      expect(content).toMatch(/metric_name\s*=\s*"5XXError"/);
    });

    test("declares CloudWatch alarm for API latency", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_latency"\s*{/);
      expect(content).toMatch(/metric_name\s*=\s*"Latency"/);
    });

    test("declares CloudWatch alarm for Lambda errors", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*{/);
    });

    test("declares CloudWatch alarm for DynamoDB throttling", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttled"\s*{/);
      expect(content).toMatch(/metric_name\s*=\s*"ThrottledRequests"/);
    });

    test("declares CloudWatch alarm for Redis CPU", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"redis_cpu"\s*{/);
    });

    test("declares CloudWatch Dashboard", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*{/);
    });

    test("CloudWatch Dashboard includes API Gateway metrics", () => {
      expect(content).toMatch(/"API Gateway Metrics"/);
    });

    test("CloudWatch Dashboard includes Lambda metrics", () => {
      expect(content).toMatch(/"Lambda Metrics"/);
    });

    test("CloudWatch Dashboard includes DynamoDB metrics", () => {
      expect(content).toMatch(/"DynamoDB Metrics"/);
    });

    test("CloudWatch Dashboard includes ElastiCache metrics", () => {
      expect(content).toMatch(/"ElastiCache Redis Metrics"/);
    });
  });

  describe("SNS for Notifications", () => {
    test("declares SNS topic for alerts", () => {
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*{/);
    });

    test("SNS topic is encrypted with KMS", () => {
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test("alarms send notifications to SNS topic", () => {
      expect(content).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });
  });

  // --- GDPR Compliance & Audit ---

  describe("CloudTrail & GDPR Compliance", () => {
    test("declares S3 bucket for CloudTrail logs", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"\s*{/);
    });

    test("S3 bucket has versioning enabled", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"\s*{/);
    });

    test("S3 bucket has encryption configured", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs"\s*{/);
    });

    test("S3 bucket blocks public access", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"\s*{/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("S3 bucket has lifecycle policy for GDPR retention", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"cloudtrail_logs"\s*{/);
      expect(content).toMatch(/gdpr-compliance-retention/);
    });

    test("S3 lifecycle includes archival to Glacier", () => {
      expect(content).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("S3 lifecycle includes expiration", () => {
      expect(content).toMatch(/expiration\s*{/);
      expect(content).toMatch(/days\s*=\s*365/); // 1 year retention
    });

    test("declares CloudTrail", () => {
      expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
    });

    test("CloudTrail is multi-region", () => {
      expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail has log file validation enabled", () => {
      expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("CloudTrail logs are encrypted with KMS", () => {
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("CloudTrail includes DynamoDB data events", () => {
      expect(content).toMatch(/type\s*=\s*"AWS::DynamoDB::Table"/);
    });

    test("CloudTrail includes Lambda data events", () => {
      expect(content).toMatch(/type\s*=\s*"AWS::Lambda::Function"/);
    });
  });

  // --- SSM Parameter Store ---

  describe("SSM Parameter Store", () => {
    test("declares SSM parameter for API config", () => {
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"api_config"\s*{/);
    });

    test("SSM parameter uses SecureString type", () => {
      expect(content).toMatch(/type\s*=\s*"SecureString"/);
    });

    test("SSM parameter is encrypted with KMS", () => {
      expect(content).toMatch(/key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });
  });

  // --- Analytics ---

  describe("QuickSight Analytics", () => {
    test("declares QuickSight data source", () => {
      expect(content).toMatch(/resource\s+"aws_quicksight_data_source"\s+"dynamodb"\s*{/);
    });

    test("QuickSight uses Athena", () => {
      expect(content).toMatch(/type\s*=\s*"ATHENA"/);
    });
  });

  // --- Tagging ---

  describe("Resource Tagging", () => {
    test("defines common_tags in locals", () => {
      expect(content).toMatch(/common_tags\s*=/);
    });

    test("common_tags include Environment", () => {
      expect(content).toMatch(/Environment\s*=\s*var\.environment/);
    });

    test("common_tags include Owner", () => {
      expect(content).toMatch(/Owner\s*=\s*var\.owner/);
    });

    test("common_tags include Project", () => {
      expect(content).toMatch(/Project\s*=\s*var\.project_name/);
    });

    test("common_tags include Compliance tag", () => {
      expect(content).toMatch(/Compliance\s*=\s*"GDPR"/);
    });

    test("resources are tagged with common_tags", () => {
      expect(content).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("resources merge common_tags with specific tags", () => {
      expect(content).toMatch(/tags\s*=\s*merge\s*\(/);
    });
  });

  // --- Outputs ---

  describe("Outputs", () => {
    test("outputs API Gateway URL", () => {
      expect(content).toMatch(/output\s+"api_gateway_url"\s*{/);
    });

    test("outputs DynamoDB table name", () => {
      expect(content).toMatch(/output\s+"dynamodb_table_name"\s*{/);
    });

    test("outputs Redis endpoint", () => {
      expect(content).toMatch(/output\s+"redis_endpoint"\s*{/);
    });

    test("outputs Lambda function name", () => {
      expect(content).toMatch(/output\s+"lambda_function_name"\s*{/);
    });

    test("outputs CloudWatch log groups", () => {
      expect(content).toMatch(/output\s+"cloudwatch_log_group_api"\s*{/);
      expect(content).toMatch(/output\s+"cloudwatch_log_group_lambda"\s*{/);
    });

    test("outputs SNS topic ARN", () => {
      expect(content).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("outputs CloudTrail name", () => {
      expect(content).toMatch(/output\s+"cloudtrail_name"\s*{/);
    });

    test("outputs CloudTrail S3 bucket", () => {
      expect(content).toMatch(/output\s+"cloudtrail_s3_bucket"\s*{/);
    });

    test("outputs VPC ID", () => {
      expect(content).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("outputs WAF Web ACL ARN", () => {
      expect(content).toMatch(/output\s+"waf_web_acl_arn"\s*{/);
    });

    test("outputs CloudWatch Dashboard name", () => {
      expect(content).toMatch(/output\s+"cloudwatch_dashboard_name"\s*{/);
    });
  });

  // --- Code Quality ---

  describe("Code Quality & Best Practices", () => {
    test("uses data sources for AWS account ID", () => {
      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test("uses data sources for AWS region", () => {
      expect(content).toMatch(/data\s+"aws_region"\s+"current"\s*{/);
    });

    test("defines locals for reusable values", () => {
      expect(content).toMatch(/locals\s*{/);
    });

    test("uses consistent naming with project_name variable", () => {
      expect(content).toMatch(/\$\{var\.project_name\}/);
    });

    test("includes descriptive comments", () => {
      expect(content).toMatch(/# VPC and Networking/);
      expect(content).toMatch(/# Security Groups/);
      expect(content).toMatch(/# KMS Key for encryption/);
    });

    test("file is reasonably sized (comprehensive but not excessive)", () => {
      const lines = content.split("\n").length;
      expect(lines).toBeGreaterThan(1000); // Should be comprehensive
      expect(lines).toBeLessThan(2000); // But not excessively long
    });
  });

  // --- Security Best Practices ---

  describe("Security Best Practices", () => {
    test("all encryption uses KMS CMK (not AWS managed keys)", () => {
      expect(content).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("KMS key rotation is enabled", () => {
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("sensitive data uses SSM SecureString", () => {
      expect(content).toMatch(/type\s*=\s*"SecureString"/);
    });

    test("Lambda functions are in private subnets", () => {
      expect(content).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\.\*\.id/);
    });

    test("ElastiCache is in private subnets", () => {
      expect(content).toMatch(/subnet_group_name\s*=\s*aws_elasticache_subnet_group\.redis\.name/);
    });

    test("security groups restrict access appropriately", () => {
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/);
    });
  });
});
