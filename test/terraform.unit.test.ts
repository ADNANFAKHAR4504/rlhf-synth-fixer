// tests/unit/unit-tests.ts
// Comprehensive unit tests for cross-account S3 data sharing system
// Tests all resources, variables, outputs, and compliance requirements

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

// Helper function to read terraform code
function getTerraformCode(): string {
  return fs.readFileSync(stackPath, "utf8");
}

describe("Terraform Infrastructure - Cross-Account S3 Data Sharing", () => {

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf", () => {
      const content = getTerraformCode();
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("Lambda function directories exist", () => {
      const lambdaDir = path.resolve(__dirname, "../lib");
      expect(fs.existsSync(path.join(lambdaDir, "lambda-access-validator"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "lambda-access-logger"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "lambda-governance-check"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "lambda-expiration-enforcer"))).toBe(true);
    });

    test("Lambda function code files exist", () => {
      const lambdaDir = path.resolve(__dirname, "../lib");
      expect(fs.existsSync(path.join(lambdaDir, "lambda-access-validator/index.py"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "lambda-access-logger/index.py"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "lambda-governance-check/index.py"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "lambda-expiration-enforcer/index.py"))).toBe(true);
    });
  });

  describe("Variables - Basic Configuration", () => {
    const code = getTerraformCode();

    test("declares aws_region variable with default", () => {
      expect(code).toMatch(/variable\s+"aws_region"\s+\{[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test("declares environment variable with validation", () => {
      expect(code).toMatch(/variable\s+"environment"\s+\{/);
      expect(code).toMatch(/validation\s+\{[\s\S]*?contains\(\["development",\s*"staging",\s*"production"\]/);
    });

    test("declares project_name variable", () => {
      expect(code).toMatch(/variable\s+"project_name"\s+\{/);
      expect(code).toMatch(/default\s*=\s*"cross-account-s3-sharing"/);
    });

    test("declares environment_suffix variable", () => {
      expect(code).toMatch(/variable\s+"environment_suffix"\s+\{/);
      expect(code).toMatch(/default\s*=\s*""/);
    });

    test("declares primary_account_id variable", () => {
      expect(code).toMatch(/variable\s+"primary_account_id"\s+\{/);
    });

    test("declares consumer_accounts variable as map of objects", () => {
      expect(code).toMatch(/variable\s+"consumer_accounts"\s+\{/);
      expect(code).toMatch(/type\s*=\s*map\(object\(/);
      expect(code).toMatch(/account_id\s*=\s*string/);
      expect(code).toMatch(/allowed_prefixes\s*=\s*list\(string\)/);
      expect(code).toMatch(/access_level\s*=\s*string/);
      expect(code).toMatch(/external_id\s*=\s*string/);
    });

    test("consumer_accounts has validation for access_level", () => {
      expect(code).toMatch(/validation\s+\{[\s\S]*?contains\(\["read",\s*"write"\]/);
    });

    test("declares bucket_name_prefix variable", () => {
      expect(code).toMatch(/variable\s+"bucket_name_prefix"\s+\{/);
      expect(code).toMatch(/default\s*=\s*"shared-data"/);
    });
  });

  describe("Variables - Lifecycle Configuration", () => {
    const code = getTerraformCode();

    test("declares lifecycle_intelligent_tiering_days variable", () => {
      expect(code).toMatch(/variable\s+"lifecycle_intelligent_tiering_days"\s+\{/);
      expect(code).toMatch(/default\s*=\s*30/);
    });

    test("lifecycle_intelligent_tiering_days has validation", () => {
      expect(code).toMatch(/validation\s+\{[\s\S]*?lifecycle_intelligent_tiering_days\s*>=\s*0/);
    });

    test("declares lifecycle_glacier_days variable", () => {
      expect(code).toMatch(/variable\s+"lifecycle_glacier_days"\s+\{/);
      expect(code).toMatch(/default\s*=\s*90/);
    });

    test("lifecycle_glacier_days has validation", () => {
      expect(code).toMatch(/validation\s+\{[\s\S]*?lifecycle_glacier_days\s*>=\s*0/);
    });
  });

  describe("Variables - Cross-Region Replication", () => {
    const code = getTerraformCode();

    test("declares enable_cross_region_replication variable", () => {
      expect(code).toMatch(/variable\s+"enable_cross_region_replication"\s+\{/);
      expect(code).toMatch(/type\s*=\s*bool/);
      expect(code).toMatch(/default\s*=\s*false/);
    });

    test("declares replication_region variable", () => {
      expect(code).toMatch(/variable\s+"replication_region"\s+\{/);
      expect(code).toMatch(/default\s*=\s*"us-west-2"/);
    });
  });

  describe("Variables - Audit and Compliance", () => {
    const code = getTerraformCode();

    test("declares cloudtrail_retention_days variable", () => {
      expect(code).toMatch(/variable\s+"cloudtrail_retention_days"\s+\{/);
      expect(code).toMatch(/default\s*=\s*2555/);
    });

    test("cloudtrail_retention_days has minimum 365 days validation", () => {
      expect(code).toMatch(/validation\s+\{[\s\S]*?cloudtrail_retention_days\s*>=\s*365/);
    });

    test("declares s3_access_log_retention_days variable", () => {
      expect(code).toMatch(/variable\s+"s3_access_log_retention_days"\s+\{/);
    });

    test("declares audit_log_ttl_days variable", () => {
      expect(code).toMatch(/variable\s+"audit_log_ttl_days"\s+\{/);
      expect(code).toMatch(/default\s*=\s*365/);
    });

    test("audit_log_ttl_days has minimum 90 days validation", () => {
      expect(code).toMatch(/validation\s+\{[\s\S]*?audit_log_ttl_days\s*>=\s*90/);
    });
  });

  describe("Variables - Monitoring and Alerting", () => {
    const code = getTerraformCode();

    test("declares alarm_email_endpoints variable", () => {
      expect(code).toMatch(/variable\s+"alarm_email_endpoints"\s+\{/);
      expect(code).toMatch(/type\s*=\s*list\(string\)/);
    });

    test("declares business_hours_start variable", () => {
      expect(code).toMatch(/variable\s+"business_hours_start"\s+\{/);
      expect(code).toMatch(/default\s*=\s*9/);
    });

    test("business_hours_start has 0-23 validation", () => {
      expect(code).toMatch(/validation\s+\{[\s\S]*?business_hours_start\s*>=\s*0\s*&&\s*.*?\s*<=\s*23/);
    });

    test("declares business_hours_end variable", () => {
      expect(code).toMatch(/variable\s+"business_hours_end"\s+\{/);
      expect(code).toMatch(/default\s*=\s*18/);
    });

    test("declares request_rate_threshold variable", () => {
      expect(code).toMatch(/variable\s+"request_rate_threshold"\s+\{/);
      expect(code).toMatch(/default\s*=\s*1000/);
    });

    test("declares failed_auth_threshold variable", () => {
      expect(code).toMatch(/variable\s+"failed_auth_threshold"\s+\{/);
      expect(code).toMatch(/default\s*=\s*10/);
    });

    test("declares data_egress_threshold_gb variable", () => {
      expect(code).toMatch(/variable\s+"data_egress_threshold_gb"\s+\{/);
      expect(code).toMatch(/default\s*=\s*100/);
    });
  });

  describe("Variables - Optional Features and Lambda", () => {
    const code = getTerraformCode();

    test("declares enable_self_service variable", () => {
      expect(code).toMatch(/variable\s+"enable_self_service"\s+\{/);
      expect(code).toMatch(/type\s*=\s*bool/);
      expect(code).toMatch(/default\s*=\s*false/);
    });

    test("declares enable_storage_lens variable with default false", () => {
      expect(code).toMatch(/variable\s+"enable_storage_lens"\s+\{/);
      expect(code).toMatch(/variable\s+"enable_storage_lens"[\s\S]*?default\s*=\s*false/);
    });

    test("declares governance_check_schedule variable", () => {
      expect(code).toMatch(/variable\s+"governance_check_schedule"\s+\{/);
      expect(code).toMatch(/cron\(0\s+2\s+\*\s+\*\s+\?\s+\*\)/);
    });

    test("declares expiration_enforcer_schedule variable", () => {
      expect(code).toMatch(/variable\s+"expiration_enforcer_schedule"\s+\{/);
      expect(code).toMatch(/rate\(1\s+hour\)/);
    });

    test("declares lambda_runtime variable", () => {
      expect(code).toMatch(/variable\s+"lambda_runtime"\s+\{/);
      expect(code).toMatch(/default\s*=\s*"python3\.11"/);
    });

    test("declares lambda_timeout variable with 3-900 validation", () => {
      expect(code).toMatch(/variable\s+"lambda_timeout"\s+\{/);
      expect(code).toMatch(/validation\s+\{[\s\S]*?lambda_timeout\s*>=\s*3\s*&&\s*.*?\s*<=\s*900/);
    });

    test("declares lambda_memory_size variable with 128-10240 validation", () => {
      expect(code).toMatch(/variable\s+"lambda_memory_size"\s+\{/);
      expect(code).toMatch(/validation\s+\{[\s\S]*?lambda_memory_size\s*>=\s*128\s*&&\s*.*?\s*<=\s*10240/);
    });
  });

  describe("Data Sources", () => {
    const code = getTerraformCode();

    test("defines aws_caller_identity data source", () => {
      expect(code).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*\{/);
    });

    test("defines aws_partition data source", () => {
      expect(code).toMatch(/data\s+"aws_partition"\s+"current"\s*\{/);
    });

    test("defines aws_availability_zones data source", () => {
      expect(code).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*\{/);
      expect(code).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe("Random Resources for Unique Naming", () => {
    const code = getTerraformCode();

    test("defines random_string resource for environment_suffix", () => {
      expect(code).toMatch(/resource\s+"random_string"\s+"environment_suffix"\s*\{/);
      expect(code).toMatch(/count\s*=\s*var\.environment_suffix\s*==\s*""\s*\?\s*1\s*:\s*0/);
      expect(code).toMatch(/length\s*=\s*8/);
      expect(code).toMatch(/special\s*=\s*false/);
      expect(code).toMatch(/upper\s*=\s*false/);
    });
  });

  describe("Locals Block", () => {
    const code = getTerraformCode();

    test("defines locals block", () => {
      expect(code).toMatch(/locals\s*\{/);
    });

    test("defines env_suffix local with conditional", () => {
      expect(code).toMatch(/env_suffix\s*=\s*var\.environment_suffix\s*!=\s*""\s*\?/);
      expect(code).toMatch(/random_string\.environment_suffix\[0\]\.result/);
    });

    test("defines account_id local with conditional", () => {
      expect(code).toMatch(/account_id\s*=\s*var\.primary_account_id\s*!=\s*""\s*\?/);
      expect(code).toMatch(/data\.aws_caller_identity\.current\.account_id/);
    });

    test("defines primary_bucket_name local with suffix", () => {
      expect(code).toMatch(/primary_bucket_name\s*=.*?env_suffix/);
    });

    test("defines audit_bucket_name local with suffix", () => {
      expect(code).toMatch(/audit_bucket_name\s*=.*?env_suffix/);
    });

    test("defines common_tags local", () => {
      expect(code).toMatch(/common_tags\s*=\s*\{/);
      expect(code).toMatch(/Project\s*=/);
      expect(code).toMatch(/Environment\s*=/);
      expect(code).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test("defines consumer_account_ids local", () => {
      expect(code).toMatch(/consumer_account_ids\s*=\s*\[for\s+account\s+in\s+values\(var\.consumer_accounts\)/);
    });
  });

  describe("KMS Encryption Key", () => {
    const code = getTerraformCode();

    test("defines aws_kms_key resource", () => {
      expect(code).toMatch(/resource\s+"aws_kms_key"\s+"primary"\s*\{/);
    });

    test("KMS key has deletion window of 30 days", () => {
      expect(code).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("KMS key has rotation enabled", () => {
      expect(code).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key policy includes root account permissions", () => {
      expect(code).toMatch(/Enable IAM User Permissions/);
    });

    test("KMS key policy includes CloudWatch Logs service principal", () => {
      expect(code).toMatch(/Allow CloudWatch Logs/);
      expect(code).toMatch(/logs\..*?\.amazonaws\.com/);
    });

    test("KMS key policy includes S3 service principal", () => {
      expect(code).toMatch(/Allow S3 Service/);
      expect(code).toMatch(/s3\.amazonaws\.com/);
    });

    test("KMS key policy includes CloudTrail service principal", () => {
      expect(code).toMatch(/Allow CloudTrail/);
      expect(code).toMatch(/cloudtrail\.amazonaws\.com/);
    });

    test("KMS key policy includes DynamoDB service principal", () => {
      expect(code).toMatch(/Allow DynamoDB Service/);
      expect(code).toMatch(/dynamodb\.amazonaws\.com/);
    });

    test("KMS key policy includes consumer accounts decrypt permissions", () => {
      expect(code).toMatch(/Allow Consumer Accounts Decrypt/);
      expect(code).toMatch(/kms:Decrypt/);
      expect(code).toMatch(/kms:CreateGrant/);
    });

    test("KMS key has common_tags", () => {
      expect(code).toMatch(/resource\s+"aws_kms_key"\s+"primary"[\s\S]*?tags\s*=\s*merge\(\s*local\.common_tags/);
    });

    test("defines aws_kms_alias resource", () => {
      expect(code).toMatch(/resource\s+"aws_kms_alias"\s+"primary"\s*\{/);
      expect(code).toMatch(/name\s*=\s*"alias\/.*?env_suffix/);
      expect(code).toMatch(/target_key_id\s*=\s*aws_kms_key\.primary\.key_id/);
    });
  });

  describe("S3 Primary Bucket", () => {
    const code = getTerraformCode();

    test("defines aws_s3_bucket resource for primary bucket", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"\s*\{/);
      expect(code).toMatch(/bucket\s*=\s*local\.primary_bucket_name/);
    });

    test("primary bucket has versioning enabled", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/);
      expect(code).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("primary bucket has KMS encryption configured", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/);
      expect(code).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(code).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.primary\.arn/);
      expect(code).toMatch(/bucket_key_enabled\s*=\s*true/);
    });

    test("primary bucket has public access blocked", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"primary"/);
      expect(code).toMatch(/block_public_acls\s*=\s*true/);
      expect(code).toMatch(/block_public_policy\s*=\s*true/);
      expect(code).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(code).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("primary bucket has lifecycle configuration", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"primary"/);
    });

    test("lifecycle includes intelligent-tiering transition", () => {
      expect(code).toMatch(/id\s*=\s*"intelligent-tiering-transition"/);
      expect(code).toMatch(/storage_class\s*=\s*"INTELLIGENT_TIERING"/);
    });

    test("lifecycle includes glacier transition", () => {
      expect(code).toMatch(/id\s*=\s*"glacier-transition"/);
      expect(code).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("primary bucket has access logging enabled", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"primary"/);
      expect(code).toMatch(/target_bucket\s*=\s*aws_s3_bucket\.audit\.id/);
      expect(code).toMatch(/target_prefix\s*=\s*"s3-access-logs\/"/);
    });
  });

  describe("S3 Audit Bucket", () => {
    const code = getTerraformCode();

    test("defines aws_s3_bucket resource for audit bucket", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket"\s+"audit"\s*\{/);
      expect(code).toMatch(/bucket\s*=\s*local\.audit_bucket_name/);
    });

    test("audit bucket has versioning enabled", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"audit"/);
    });

    test("audit bucket has KMS encryption configured", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"audit"/);
    });

    test("audit bucket has public access blocked", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"audit"/);
    });

    test("audit bucket has lifecycle configuration for log retention", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"audit"/);
    });

    test("audit bucket lifecycle includes cloudtrail logs retention", () => {
      expect(code).toMatch(/id\s*=\s*"cloudtrail-logs-retention"/);
      expect(code).toMatch(/prefix\s*=\s*"cloudtrail-logs\/"/);
    });

    test("audit bucket lifecycle includes s3 access logs retention", () => {
      expect(code).toMatch(/id\s*=\s*"s3-access-logs-retention"/);
      expect(code).toMatch(/prefix\s*=\s*"s3-access-logs\/"/);
    });

    test("defines audit bucket policy", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"audit"/);
    });

    test("audit bucket policy allows CloudTrail ACL check", () => {
      expect(code).toMatch(/AWSCloudTrailAclCheck/);
      expect(code).toMatch(/s3:GetBucketAcl/);
    });

    test("audit bucket policy allows CloudTrail write", () => {
      expect(code).toMatch(/AWSCloudTrailWrite/);
      expect(code).toMatch(/s3:PutObject/);
    });

    test("audit bucket policy allows S3 access logs", () => {
      expect(code).toMatch(/S3ServerAccessLogsPolicy/);
      expect(code).toMatch(/logging\.s3\.amazonaws\.com/);
    });
  });

  describe("S3 Primary Bucket Policy for Cross-Account Access", () => {
    const code = getTerraformCode();

    test("defines primary bucket policy", () => {
      expect(code).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"primary"/);
    });

    test("bucket policy denies unencrypted uploads", () => {
      expect(code).toMatch(/DenyUnencryptedObjectUploads/);
      expect(code).toMatch(/s3:x-amz-server-side-encryption/);
    });

    test("bucket policy denies insecure transport", () => {
      expect(code).toMatch(/DenyInsecureTransport/);
      expect(code).toMatch(/aws:SecureTransport/);
    });

    test("bucket policy includes cross-account access statements", () => {
      expect(code).toMatch(/CrossAccountAccess/);
      expect(code).toMatch(/for\s+account_key,\s+account_config\s+in\s+var\.consumer_accounts/);
    });

    test("cross-account policy uses external ID condition", () => {
      expect(code).toMatch(/sts:ExternalId/);
    });

    test("cross-account policy grants different actions based on access level", () => {
      expect(code).toMatch(/access_level\s*==\s*"write"/);
      expect(code).toMatch(/s3:GetObject/);
      expect(code).toMatch(/s3:PutObject/);
    });
  });

  describe("DynamoDB Tables", () => {
    const code = getTerraformCode();

    test("defines access_control DynamoDB table", () => {
      expect(code).toMatch(/resource\s+"aws_dynamodb_table"\s+"access_control"\s*\{/);
      expect(code).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(code).toMatch(/hash_key\s*=\s*"account_id"/);
      expect(code).toMatch(/range_key\s*=\s*"prefix"/);
    });

    test("access_control table has expiration-index GSI", () => {
      expect(code).toMatch(/global_secondary_index\s*\{[\s\S]*?name\s*=\s*"expiration-index"/);
      expect(code).toMatch(/hash_key\s*=\s*"expiration_date"/);
    });

    test("access_control table has encryption enabled", () => {
      expect(code).toMatch(/resource\s+"aws_dynamodb_table"\s+"access_control"[\s\S]*?server_side_encryption\s*\{/);
      expect(code).toMatch(/enabled\s*=\s*true/);
      expect(code).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.primary\.arn/);
    });

    test("access_control table has point-in-time recovery", () => {
      expect(code).toMatch(/resource\s+"aws_dynamodb_table"\s+"access_control"[\s\S]*?point_in_time_recovery\s*\{/);
      expect(code).toMatch(/enabled\s*=\s*true/);
    });

    test("defines audit_logs DynamoDB table", () => {
      expect(code).toMatch(/resource\s+"aws_dynamodb_table"\s+"audit_logs"\s*\{/);
      expect(code).toMatch(/hash_key\s*=\s*"timestamp"/);
      expect(code).toMatch(/range_key\s*=\s*"request_id"/);
    });

    test("audit_logs table has account-index GSI", () => {
      expect(code).toMatch(/global_secondary_index\s*\{[\s\S]*?name\s*=\s*"account-index"/);
      expect(code).toMatch(/hash_key\s*=\s*"account_id"/);
    });

    test("audit_logs table has TTL enabled", () => {
      expect(code).toMatch(/resource\s+"aws_dynamodb_table"\s+"audit_logs"[\s\S]*?ttl\s*\{/);
      expect(code).toMatch(/attribute_name\s*=\s*"ttl"/);
      expect(code).toMatch(/enabled\s*=\s*true/);
    });

    test("audit_logs table has encryption enabled", () => {
      expect(code).toMatch(/resource\s+"aws_dynamodb_table"\s+"audit_logs"[\s\S]*?server_side_encryption\s*\{/);
    });

    test("audit_logs table has point-in-time recovery", () => {
      expect(code).toMatch(/resource\s+"aws_dynamodb_table"\s+"audit_logs"[\s\S]*?point_in_time_recovery\s*\{/);
    });
  });

  describe("CloudTrail", () => {
    const code = getTerraformCode();

    test("defines CloudTrail trail resource", () => {
      expect(code).toMatch(/resource\s+"aws_cloudtrail"\s+"organization"\s*\{/);
    });

    test("CloudTrail uses audit bucket", () => {
      expect(code).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.audit\.id/);
      expect(code).toMatch(/s3_key_prefix\s*=\s*"cloudtrail-logs"/);
    });

    test("CloudTrail is multi-region", () => {
      expect(code).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail includes global service events", () => {
      expect(code).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("CloudTrail has log file validation enabled", () => {
      expect(code).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("CloudTrail uses KMS encryption", () => {
      expect(code).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
    });

    test("CloudTrail has S3 data events configured", () => {
      expect(code).toMatch(/event_selector\s*\{/);
      expect(code).toMatch(/data_resource\s*\{/);
      expect(code).toMatch(/type\s*=\s*"AWS::S3::Object"/);
    });

    test("CloudTrail depends on audit bucket policy", () => {
      expect(code).toMatch(/resource\s+"aws_cloudtrail"\s+"organization"[\s\S]*?depends_on\s*=\s*\[aws_s3_bucket_policy\.audit\]/);
    });
  });

  describe("SNS Topic and Subscriptions", () => {
    const code = getTerraformCode();

    test("defines SNS topic for alerts", () => {
      expect(code).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*\{/);
    });

    test("SNS topic uses KMS encryption", () => {
      expect(code).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.primary\.id/);
    });

    test("defines SNS topic subscriptions for email", () => {
      expect(code).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email_alerts"\s*\{/);
      expect(code).toMatch(/count\s*=\s*length\(var\.alarm_email_endpoints\)/);
      expect(code).toMatch(/protocol\s*=\s*"email"/);
    });
  });

  describe("IAM Role for Lambda Functions", () => {
    const code = getTerraformCode();

    test("defines IAM role for Lambda execution", () => {
      expect(code).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"\s*\{/);
    });

    test("Lambda execution role has assume role policy for Lambda service", () => {
      expect(code).toMatch(/lambda\.amazonaws\.com/);
      expect(code).toMatch(/sts:AssumeRole/);
    });

    test("defines IAM policy for Lambda execution", () => {
      expect(code).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_execution"\s*\{/);
    });

    test("Lambda policy includes CloudWatch Logs permissions", () => {
      expect(code).toMatch(/CloudWatchLogs/);
      expect(code).toMatch(/logs:CreateLogGroup/);
      expect(code).toMatch(/logs:PutLogEvents/);
    });

    test("Lambda policy includes DynamoDB permissions", () => {
      expect(code).toMatch(/DynamoDBAccess/);
      expect(code).toMatch(/dynamodb:GetItem/);
      expect(code).toMatch(/dynamodb:PutItem/);
      expect(code).toMatch(/dynamodb:Query/);
    });

    test("Lambda policy includes S3 bucket permissions", () => {
      expect(code).toMatch(/S3BucketAccess/);
      expect(code).toMatch(/s3:GetBucketPolicy/);
      expect(code).toMatch(/s3:GetEncryptionConfiguration/);
    });

    test("Lambda policy includes CloudTrail permissions", () => {
      expect(code).toMatch(/CloudTrailAccess/);
      expect(code).toMatch(/cloudtrail:GetTrailStatus/);
    });

    test("Lambda policy includes IAM read permissions", () => {
      expect(code).toMatch(/IAMReadAccess/);
      expect(code).toMatch(/iam:GetRole/);
    });

    test("Lambda policy includes KMS permissions", () => {
      expect(code).toMatch(/KMSAccess/);
      expect(code).toMatch(/kms:Decrypt/);
      expect(code).toMatch(/kms:Encrypt/);
    });

    test("Lambda policy includes SNS publish permissions", () => {
      expect(code).toMatch(/SNSPublish/);
      expect(code).toMatch(/sns:Publish/);
    });

    test("Lambda policy includes CloudWatch metrics permissions", () => {
      expect(code).toMatch(/CloudWatchMetrics/);
      expect(code).toMatch(/cloudwatch:PutMetricData/);
    });
  });

  describe("CloudWatch Log Groups for Lambda", () => {
    const code = getTerraformCode();

    test("defines log group for access_validator Lambda", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"access_validator"\s*\{/);
      expect(code).toMatch(/name\s*=\s*"\/aws\/lambda\/.*?access-validator/);
    });

    test("access_validator log group has 30 day retention", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"access_validator"[\s\S]*?retention_in_days\s*=\s*30/);
    });

    test("access_validator log group uses KMS encryption", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"access_validator"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
    });

    test("access_validator log group depends on KMS key", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"access_validator"[\s\S]*?depends_on\s*=\s*\[aws_kms_key\.primary\]/);
    });

    test("defines log group for access_logger Lambda", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"access_logger"/);
    });

    test("defines log group for governance_check Lambda", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"governance_check"/);
    });

    test("defines log group for expiration_enforcer Lambda", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"expiration_enforcer"/);
    });
  });

  describe("Lambda Functions and Archive Files", () => {
    const code = getTerraformCode();

    test("defines archive_file data source for access_validator", () => {
      expect(code).toMatch(/data\s+"archive_file"\s+"access_validator"\s*\{/);
      expect(code).toMatch(/source_file\s*=.*?lambda-access-validator\/index\.py/);
    });

    test("defines access_validator Lambda function", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_function"\s+"access_validator"\s*\{/);
      expect(code).toMatch(/handler\s*=\s*"index\.lambda_handler"/);
    });

    test("access_validator Lambda has correct environment variables", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_function"\s+"access_validator"[\s\S]*?ACCESS_CONTROL_TABLE/);
      expect(code).toMatch(/PRIMARY_BUCKET/);
      expect(code).toMatch(/SNS_TOPIC_ARN/);
    });

    test("access_validator Lambda depends on IAM policy and log group", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_function"\s+"access_validator"[\s\S]*?depends_on\s*=\s*\[[\s\S]*?aws_iam_role_policy\.lambda_execution/);
      expect(code).toMatch(/aws_cloudwatch_log_group\.access_validator/);
    });

    test("defines access_logger Lambda function", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_function"\s+"access_logger"\s*\{/);
    });

    test("access_logger Lambda has correct environment variables", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_function"\s+"access_logger"[\s\S]*?AUDIT_LOGS_TABLE/);
      expect(code).toMatch(/TTL_DAYS/);
    });

    test("defines governance_check Lambda function", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_function"\s+"governance_check"\s*\{/);
    });

    test("governance_check Lambda has all required environment variables", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_function"\s+"governance_check"[\s\S]*?ACCESS_CONTROL_TABLE/);
      expect(code).toMatch(/KMS_KEY_ID/);
      expect(code).toMatch(/CLOUDTRAIL_NAME/);
    });

    test("defines expiration_enforcer Lambda function", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_function"\s+"expiration_enforcer"\s*\{/);
    });

    test("all Lambda functions use configurable runtime", () => {
      const lambdaFunctions = code.match(/resource\s+"aws_lambda_function"[\s\S]*?runtime\s*=\s*var\.lambda_runtime/g);
      expect(lambdaFunctions).toBeTruthy();
      expect(lambdaFunctions!.length).toBeGreaterThanOrEqual(4);
    });

    test("all Lambda functions use configurable timeout and memory", () => {
      expect(code).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
      expect(code).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
    });
  });

  describe("EventBridge Rules and Targets", () => {
    const code = getTerraformCode();

    test("defines EventBridge rule for S3 access events", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"s3_access_events"\s*\{/);
    });

    test("S3 access events rule captures CloudTrail S3 events", () => {
      expect(code).toMatch(/source.*?aws\.s3/);
      expect(code).toMatch(/GetObject/);
      expect(code).toMatch(/PutObject/);
      expect(code).toMatch(/DeleteObject/);
    });

    test("defines EventBridge target for access logger", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"s3_access_to_logger"\s*\{/);
      expect(code).toMatch(/arn\s*=\s*aws_lambda_function\.access_logger\.arn/);
    });

    test("defines Lambda permission for EventBridge to invoke access_logger", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_access_logger"\s*\{/);
      expect(code).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });

    test("defines EventBridge rule for unauthorized access", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"unauthorized_access"\s*\{/);
      expect(code).toMatch(/errorCode.*?AccessDenied/);
    });

    test("defines EventBridge rule for bucket policy changes", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"bucket_policy_changes"\s*\{/);
      expect(code).toMatch(/PutBucketPolicy/);
      expect(code).toMatch(/DeleteBucketPolicy/);
    });

    test("policy changes rule triggers SNS notification", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"bucket_policy_changes_sns"\s*\{/);
    });

    test("defines scheduled rule for governance check", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"governance_check"\s*\{/);
      expect(code).toMatch(/schedule_expression\s*=\s*var\.governance_check_schedule/);
    });

    test("governance check rule triggers Lambda", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"governance_check_lambda"\s*\{/);
      expect(code).toMatch(/arn\s*=\s*aws_lambda_function\.governance_check\.arn/);
    });

    test("defines Lambda permission for governance check EventBridge trigger", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_governance"\s*\{/);
    });

    test("defines scheduled rule for expiration enforcer", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"expiration_enforcer"\s*\{/);
      expect(code).toMatch(/schedule_expression\s*=\s*var\.expiration_enforcer_schedule/);
    });

    test("expiration enforcer rule triggers Lambda", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"expiration_enforcer_lambda"\s*\{/);
    });

    test("defines Lambda permission for expiration enforcer EventBridge trigger", () => {
      expect(code).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_expiration"\s*\{/);
    });
  });

  describe("CloudWatch Alarms", () => {
    const code = getTerraformCode();

    test("defines CloudWatch alarm for high request rate", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_request_rate"\s*\{/);
      expect(code).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(code).toMatch(/threshold\s*=\s*var\.request_rate_threshold/);
    });

    test("high request rate alarm uses S3 metrics", () => {
      expect(code).toMatch(/namespace\s*=\s*"AWS\/S3"/);
      expect(code).toMatch(/dimensions\s*=\s*\{[\s\S]*?BucketName\s*=\s*aws_s3_bucket\.primary\.id/);
    });

    test("high request rate alarm triggers SNS", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_request_rate"[\s\S]*?alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
    });

    test("defines CloudWatch alarm for high data egress", () => {
      expect(code).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_data_egress"\s*\{/);
      expect(code).toMatch(/metric_name\s*=\s*"BytesDownloaded"/);
    });

    test("high data egress alarm uses threshold from variable", () => {
      expect(code).toMatch(/threshold\s*=\s*var\.data_egress_threshold_gb\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024/);
    });
  });

  describe("S3 Storage Lens", () => {
    const code = getTerraformCode();

    test("defines S3 Storage Lens configuration with count condition", () => {
      expect(code).toMatch(/resource\s+"aws_s3control_storage_lens_configuration"\s+"main"\s*\{/);
      expect(code).toMatch(/count\s*=\s*var\.enable_storage_lens\s*\?\s*1\s*:\s*0/);
    });

    test("Storage Lens is enabled", () => {
      expect(code).toMatch(/resource\s+"aws_s3control_storage_lens_configuration"[\s\S]*?enabled\s*=\s*true/);
    });

    test("Storage Lens has activity metrics enabled", () => {
      expect(code).toMatch(/activity_metrics\s*\{[\s\S]*?enabled\s*=\s*true/);
    });

    test("Storage Lens uses basic configuration for compatibility", () => {
      expect(code).toMatch(/account_level\s*\{[\s\S]*?bucket_level\s*\{/);
    });
  });

  describe("Outputs", () => {
    const code = getTerraformCode();

    test("outputs primary_bucket_name", () => {
      expect(code).toMatch(/output\s+"primary_bucket_name"\s*\{/);
      expect(code).toMatch(/value\s*=\s*aws_s3_bucket\.primary\.id/);
    });

    test("outputs primary_bucket_arn", () => {
      expect(code).toMatch(/output\s+"primary_bucket_arn"\s*\{/);
      expect(code).toMatch(/value\s*=\s*aws_s3_bucket\.primary\.arn/);
    });

    test("outputs audit_bucket_name", () => {
      expect(code).toMatch(/output\s+"audit_bucket_name"\s*\{/);
      expect(code).toMatch(/value\s*=\s*aws_s3_bucket\.audit\.id/);
    });

    test("outputs kms_key_id and kms_key_arn", () => {
      expect(code).toMatch(/output\s+"kms_key_id"\s*\{/);
      expect(code).toMatch(/output\s+"kms_key_arn"\s*\{/);
    });

    test("outputs access_control_table_name", () => {
      expect(code).toMatch(/output\s+"access_control_table_name"\s*\{/);
      expect(code).toMatch(/value\s*=\s*aws_dynamodb_table\.access_control\.name/);
    });

    test("outputs audit_logs_table_name", () => {
      expect(code).toMatch(/output\s+"audit_logs_table_name"\s*\{/);
      expect(code).toMatch(/value\s*=\s*aws_dynamodb_table\.audit_logs\.name/);
    });

    test("outputs cloudtrail_name and cloudtrail_arn", () => {
      expect(code).toMatch(/output\s+"cloudtrail_name"\s*\{/);
      expect(code).toMatch(/output\s+"cloudtrail_arn"\s*\{/);
    });

    test("outputs sns_topic_arn", () => {
      expect(code).toMatch(/output\s+"sns_topic_arn"\s*\{/);
      expect(code).toMatch(/value\s*=\s*aws_sns_topic\.alerts\.arn/);
    });

    test("outputs all Lambda function ARNs", () => {
      expect(code).toMatch(/output\s+"lambda_access_validator_arn"\s*\{/);
      expect(code).toMatch(/output\s+"lambda_access_logger_arn"\s*\{/);
      expect(code).toMatch(/output\s+"lambda_governance_check_arn"\s*\{/);
      expect(code).toMatch(/output\s+"lambda_expiration_enforcer_arn"\s*\{/);
    });

    test("outputs consumer_role_name_pattern", () => {
      expect(code).toMatch(/output\s+"consumer_role_name_pattern"\s*\{/);
    });
  });

  describe("Security and Compliance Checks", () => {
    const code = getTerraformCode();

    test("no hardcoded secrets or credentials", () => {
      expect(code).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(code).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(code).not.toMatch(/access_key\s*=\s*"AKIA/);
    });

    test("all resources use common_tags or merge with common_tags", () => {
      const taggedResources = code.match(/tags\s*=\s*(local\.common_tags|merge\(\s*local\.common_tags)/g);
      expect(taggedResources).toBeTruthy();
      expect(taggedResources!.length).toBeGreaterThan(10);
    });

    test("KMS encryption is used for sensitive resources", () => {
      expect(code).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
      expect(code).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.primary\.arn/);
      expect(code).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.primary/);
    });

    test("S3 buckets block all public access", () => {
      const publicAccessBlocks = code.match(/block_public_acls\s*=\s*true/g);
      expect(publicAccessBlocks).toBeTruthy();
      expect(publicAccessBlocks!.length).toBeGreaterThanOrEqual(2);
    });

    test("S3 bucket versioning is enabled", () => {
      const versioningEnabled = code.match(/status\s*=\s*"Enabled"/g);
      expect(versioningEnabled).toBeTruthy();
      expect(versioningEnabled!.length).toBeGreaterThanOrEqual(2);
    });

    test("CloudTrail log file validation is enabled", () => {
      expect(code).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("DynamoDB tables have point-in-time recovery enabled", () => {
      const pitrEnabled = code.match(/point_in_time_recovery\s*\{[\s\S]*?enabled\s*=\s*true/g);
      expect(pitrEnabled).toBeTruthy();
      expect(pitrEnabled!.length).toBeGreaterThanOrEqual(2);
    });

    test("CloudWatch log groups have retention policy", () => {
      const retention = code.match(/retention_in_days\s*=\s*30/g);
      expect(retention).toBeTruthy();
      expect(retention!.length).toBeGreaterThanOrEqual(4);
    });

    test("Lambda functions have proper depends_on for resources", () => {
      const lambdaDependsOn = code.match(/resource\s+"aws_lambda_function"[\s\S]*?depends_on\s*=\s*\[/g);
      expect(lambdaDependsOn).toBeTruthy();
      expect(lambdaDependsOn!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Resource Naming with Unique Suffix", () => {
    const code = getTerraformCode();

    test("S3 bucket names use local.env_suffix", () => {
      expect(code).toMatch(/bucket\s*=\s*local\.primary_bucket_name/);
      expect(code).toMatch(/bucket\s*=\s*local\.audit_bucket_name/);
    });

    test("DynamoDB table names use env_suffix", () => {
      expect(code).toMatch(/name\s*=.*?env_suffix/);
    });

    test("KMS alias uses env_suffix", () => {
      expect(code).toMatch(/name\s*=\s*"alias\/.*?env_suffix/);
    });

    test("CloudTrail name uses env_suffix", () => {
      expect(code).toMatch(/resource\s+"aws_cloudtrail"[\s\S]*?name\s*=.*?env_suffix/);
    });

    test("SNS topic name uses env_suffix", () => {
      expect(code).toMatch(/resource\s+"aws_sns_topic"[\s\S]*?name\s*=.*?env_suffix/);
    });

    test("Lambda function names use env_suffix", () => {
      const lambdaNames = code.match(/function_name\s*=.*?env_suffix/g);
      expect(lambdaNames).toBeTruthy();
      expect(lambdaNames!.length).toBeGreaterThanOrEqual(4);
    });

    test("IAM role name uses env_suffix", () => {
      expect(code).toMatch(/resource\s+"aws_iam_role"[\s\S]*?name\s*=.*?env_suffix/);
    });

    test("EventBridge rule names use env_suffix", () => {
      const ruleNames = code.match(/resource\s+"aws_cloudwatch_event_rule"[\s\S]*?name\s*=.*?env_suffix/g);
      expect(ruleNames).toBeTruthy();
      expect(ruleNames!.length).toBeGreaterThanOrEqual(4);
    });

    test("CloudWatch alarm names use env_suffix", () => {
      const alarmNames = code.match(/alarm_name\s*=.*?env_suffix/g);
      expect(alarmNames).toBeTruthy();
      expect(alarmNames!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Lambda Function Code Quality", () => {
    const validatorCode = fs.readFileSync(
      path.resolve(__dirname, "../lib/lambda-access-validator/index.py"),
      "utf8"
    );
    const loggerCode = fs.readFileSync(
      path.resolve(__dirname, "../lib/lambda-access-logger/index.py"),
      "utf8"
    );

    test("access_validator has structured logging", () => {
      expect(validatorCode).toMatch(/def log_structured/);
      expect(validatorCode).toMatch(/json\.dumps/);
    });

    test("access_validator has retry logic with exponential backoff", () => {
      expect(validatorCode).toMatch(/def retry_with_backoff/);
      expect(validatorCode).toMatch(/RETRY_DELAY_BASE\s*\*\*\s*\(/);
    });

    test("access_validator has custom exception class", () => {
      expect(validatorCode).toMatch(/class AccessValidationError/);
    });

    test("access_validator has proper error handling", () => {
      expect(validatorCode).toMatch(/try:/);
      expect(validatorCode).toMatch(/except.*?:/);
      expect(validatorCode).toMatch(/log_structured.*?ERROR/);
    });

    test("access_logger has structured logging", () => {
      expect(loggerCode).toMatch(/def log_structured/);
    });

    test("access_logger has retry logic", () => {
      expect(loggerCode).toMatch(/def retry_with_backoff/);
    });

    test("access_logger sends custom CloudWatch metrics", () => {
      expect(loggerCode).toMatch(/def send_custom_metrics/);
      expect(loggerCode).toMatch(/cloudwatch\.put_metric_data/);
    });

    test("access_logger calculates TTL for DynamoDB items", () => {
      expect(loggerCode).toMatch(/ttl_timestamp/);
      expect(loggerCode).toMatch(/timedelta\(days=TTL_DAYS\)/);
    });
  });
});
