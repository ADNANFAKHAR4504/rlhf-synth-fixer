// Unit tests for CloudTrail Analytics Platform
// Validates tap_stack.tf configuration without executing Terraform

import fs from "fs";
import path from "path";

const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const terraformCode = fs.readFileSync(stackPath, "utf8");

describe("CloudTrail Analytics Platform - Unit Tests", () => {

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf", () => {
      expect(terraformCode).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(terraformCode).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable with validation", () => {
      expect(terraformCode).toMatch(/variable\s+"environment"\s*{/);
      expect(terraformCode).toMatch(/validation\s*{/);
    });

    test("declares project_name variable", () => {
      expect(terraformCode).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("declares account_ids variable as list", () => {
      expect(terraformCode).toMatch(/variable\s+"account_ids"\s*{/);
      expect(terraformCode).toMatch(/type\s*=\s*list\(string\)/);
    });

    test("declares enable_organization_trail variable", () => {
      expect(terraformCode).toMatch(/variable\s+"enable_organization_trail"\s*{/);
    });

    test("declares lifecycle configuration variables", () => {
      expect(terraformCode).toMatch(/variable\s+"lifecycle_intelligent_tiering_days"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"lifecycle_glacier_days"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"lifecycle_expiration_days"\s*{/);
    });

    test("declares Glue crawler schedule variable", () => {
      expect(terraformCode).toMatch(/variable\s+"glue_crawler_schedule"\s*{/);
    });

    test("declares Lambda schedule variables", () => {
      expect(terraformCode).toMatch(/variable\s+"security_analysis_schedule"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"log_compaction_schedule"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"compliance_report_schedule"\s*{/);
    });

    test("declares SNS alert email variables", () => {
      expect(terraformCode).toMatch(/variable\s+"critical_alert_emails"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"high_alert_emails"\s*{/);
      expect(terraformCode).toMatch(/variable\s+"medium_alert_emails"\s*{/);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_caller_identity data source", () => {
      expect(terraformCode).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test("declares aws_partition data source", () => {
      expect(terraformCode).toMatch(/data\s+"aws_partition"\s+"current"\s*{/);
    });

    test("declares aws_region data source", () => {
      expect(terraformCode).toMatch(/data\s+"aws_region"\s+"current"\s*{/);
    });

    test("declares aws_organizations_organization data source for organization trail", () => {
      expect(terraformCode).toMatch(/data\s+"aws_organizations_organization"\s+"current"\s*{/);
    });
  });

  describe("Random Resources", () => {
    test("declares random_string for environment_suffix", () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"\s*{/);
      expect(terraformCode).toMatch(/count\s*=\s*var\.environment_suffix\s*==\s*""\s*\?\s*1\s*:\s*0/);
    });
  });

  describe("Locals", () => {
    test("defines env_suffix in locals", () => {
      expect(terraformCode).toMatch(/locals\s*{[\s\S]*?env_suffix\s*=/);
    });

    test("defines common_tags in locals", () => {
      expect(terraformCode).toMatch(/common_tags\s*=\s*merge/);
    });

    test("defines high_risk_actions list", () => {
      expect(terraformCode).toMatch(/high_risk_actions\s*=\s*\[/);
    });
  });

  describe("KMS Key", () => {
    test("creates KMS key for CloudTrail encryption", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_kms_key"\s+"cloudtrail"\s*{/);
    });

    test("enables key rotation on KMS key", () => {
      expect(terraformCode).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key policy includes CloudTrail service principal", () => {
      expect(terraformCode).toMatch(/Service\s*=\s*"cloudtrail\.amazonaws\.com"/);
    });

    test("KMS key policy includes CloudWatch Logs service principal", () => {
      expect(terraformCode).toMatch(/Service\s*=\s*"logs\.\$\{var\.aws_region\}\.amazonaws\.com"/);
    });

    test("creates KMS alias", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_kms_alias"\s+"cloudtrail"\s*{/);
    });
  });

  describe("S3 Buckets", () => {
    test("creates CloudTrail logs bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"\s*{/);
    });

    test("creates Athena results bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"athena_results"\s*{/);
    });

    test("creates enriched logs bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"enriched_logs"\s*{/);
    });

    test("creates compliance reports bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"compliance_reports"\s*{/);
    });

    test("enables versioning on CloudTrail logs bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"\s*{/);
      expect(terraformCode).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures KMS encryption for all buckets", () => {
      const encryptionMatches = terraformCode.match(/sse_algorithm\s*=\s*"aws:kms"/g);
      expect(encryptionMatches).toBeTruthy();
      expect(encryptionMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test("blocks public access on all buckets", () => {
      const publicAccessMatches = terraformCode.match(/block_public_acls\s*=\s*true/g);
      expect(publicAccessMatches).toBeTruthy();
      expect(publicAccessMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test("configures lifecycle policies on CloudTrail logs bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"cloudtrail_logs"\s*{/);
      expect(terraformCode).toMatch(/INTELLIGENT_TIERING/);
      expect(terraformCode).toMatch(/GLACIER/);
    });

    test("configures bucket policy for CloudTrail logs", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs"\s*{/);
      expect(terraformCode).toMatch(/AWSCloudTrailWrite/);
    });

    test("organization trail S3 bucket policy includes both account and organization paths", () => {
      expect(terraformCode).toMatch(/AWSLogs\/\$\{local\.account_id\}\/\*/);
      expect(terraformCode).toMatch(/AWSLogs\/\$\{data\.aws_organizations_organization\.current\.id\}\/\*/);
    });
  });

  describe("CloudTrail", () => {
    test("creates CloudTrail trail", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudtrail"\s+"organization"\s*{/);
    });

    test("CloudTrail is multi-region", () => {
      expect(terraformCode).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail enables log file validation", () => {
      expect(terraformCode).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("CloudTrail uses KMS key", () => {
      expect(terraformCode).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cloudtrail\.arn/);
    });

    test("CloudTrail includes event selector with dynamic data resource", () => {
      expect(terraformCode).toMatch(/event_selector\s*{/);
      expect(terraformCode).toMatch(/dynamic\s+"data_resource"\s*{/);
    });
  });

  describe("Glue Data Catalog", () => {
    test("creates Glue database for raw logs", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_glue_catalog_database"\s+"cloudtrail_raw"\s*{/);
    });

    test("creates Glue database for enriched logs", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_glue_catalog_database"\s+"cloudtrail_enriched"\s*{/);
    });

    test("creates Glue crawler", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_glue_crawler"\s+"cloudtrail"\s*{/);
    });

    test("Glue crawler has schedule", () => {
      expect(terraformCode).toMatch(/schedule\s*=\s*var\.glue_crawler_schedule/);
    });

    test("Glue crawler targets CloudTrail logs S3", () => {
      expect(terraformCode).toMatch(/s3_target\s*{/);
      expect(terraformCode).toMatch(/path\s*=\s*"s3:\/\/\$\{aws_s3_bucket\.cloudtrail_logs\.id\}\/AWSLogs\/"/);
    });
  });

  describe("Athena", () => {
    test("creates Athena workgroup", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_athena_workgroup"\s+"cloudtrail"\s*{/);
    });

    test("Athena workgroup enforces configuration", () => {
      expect(terraformCode).toMatch(/enforce_workgroup_configuration\s*=\s*true/);
    });

    test("Athena workgroup encrypts query results", () => {
      expect(terraformCode).toMatch(/encryption_option\s*=\s*"SSE_KMS"/);
    });

    test("Athena workgroup has bytes scanned limit", () => {
      expect(terraformCode).toMatch(/bytes_scanned_cutoff_per_query\s*=\s*var\.athena_bytes_scanned_limit/);
    });
  });

  describe("DynamoDB", () => {
    test("creates security findings table", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_dynamodb_table"\s+"security_findings"\s*{/);
    });

    test("DynamoDB table uses PAY_PER_REQUEST billing", () => {
      expect(terraformCode).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test("DynamoDB table has TTL enabled", () => {
      expect(terraformCode).toMatch(/ttl\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test("DynamoDB table has global secondary indexes", () => {
      expect(terraformCode).toMatch(/global_secondary_index\s*{[\s\S]*?name\s*=\s*"account-index"/);
      expect(terraformCode).toMatch(/global_secondary_index\s*{[\s\S]*?name\s*=\s*"finding-type-index"/);
    });

    test("DynamoDB table has point-in-time recovery", () => {
      expect(terraformCode).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test("DynamoDB table uses KMS encryption", () => {
      expect(terraformCode).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
    });
  });

  describe("SNS Topics", () => {
    test("creates critical alerts SNS topic", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"critical_alerts"\s*{/);
    });

    test("creates high alerts SNS topic", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"high_alerts"\s*{/);
    });

    test("creates medium alerts SNS topic", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"medium_alerts"\s*{/);
    });

    test("SNS topics use KMS encryption", () => {
      const kmsMatches = terraformCode.match(/kms_master_key_id\s*=\s*aws_kms_key\.cloudtrail\.id/g);
      expect(kmsMatches).toBeTruthy();
      expect(kmsMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("IAM Roles", () => {
    test("creates Glue crawler IAM role", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"glue_crawler"\s*{/);
    });

    test("creates Lambda execution IAM role", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"\s*{/);
    });

    test("Glue crawler role has S3 permissions", () => {
      expect(terraformCode).toMatch(/"s3:GetObject"/);
      expect(terraformCode).toMatch(/"s3:ListBucket"/);
    });

    test("Lambda role has comprehensive permissions", () => {
      expect(terraformCode).toMatch(/"logs:CreateLogGroup"/);
      expect(terraformCode).toMatch(/"dynamodb:PutItem"/);
      expect(terraformCode).toMatch(/"athena:StartQueryExecution"/);
      expect(terraformCode).toMatch(/"sns:Publish"/);
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("creates log group for log processor Lambda", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"log_processor"\s*{/);
    });

    test("creates log group for security analyzer Lambda", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"security_analyzer"\s*{/);
    });

    test("creates log group for alert enricher Lambda", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"alert_enricher"\s*{/);
    });

    test("log groups have retention configured", () => {
      expect(terraformCode).toMatch(/retention_in_days\s*=\s*var\.lambda_log_retention_days/);
    });

    test("log groups use KMS encryption", () => {
      const logGroupKmsMatches = terraformCode.match(/aws_cloudwatch_log_group[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.cloudtrail\.arn/g);
      expect(logGroupKmsMatches).toBeTruthy();
      expect(logGroupKmsMatches!.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Lambda Functions", () => {
    test("creates archive data source for all Lambda functions", () => {
      expect(terraformCode).toMatch(/data\s+"archive_file"\s+"log_processor"\s*{/);
      expect(terraformCode).toMatch(/data\s+"archive_file"\s+"security_analyzer"\s*{/);
      expect(terraformCode).toMatch(/data\s+"archive_file"\s+"alert_enricher"\s*{/);
      expect(terraformCode).toMatch(/data\s+"archive_file"\s+"log_compactor"\s*{/);
      expect(terraformCode).toMatch(/data\s+"archive_file"\s+"compliance_reporter"\s*{/);
    });

    test("creates log processor Lambda function", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"log_processor"\s*{/);
    });

    test("creates security analyzer Lambda function", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"security_analyzer"\s*{/);
    });

    test("creates alert enricher Lambda function", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_function"\s+"alert_enricher"\s*{/);
    });

    test("Lambda functions use Python 3.12 runtime", () => {
      expect(terraformCode).toMatch(/runtime\s*=\s*"python3\.12"/);
    });

    test("Lambda functions have X-Ray tracing enabled", () => {
      expect(terraformCode).toMatch(/tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"/);
    });

    test("Lambda functions have dead letter queues configured", () => {
      expect(terraformCode).toMatch(/dead_letter_config\s*{/);
    });

    test("Lambda functions have environment variables", () => {
      expect(terraformCode).toMatch(/environment\s*{[\s\S]*?variables\s*=/);
    });
  });

  describe("EventBridge Rules", () => {
    test("creates security analysis schedule rule", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"security_analysis"\s*{/);
    });

    test("creates log compaction schedule rule", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"log_compaction"\s*{/);
    });

    test("creates compliance reporting schedule rule", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"compliance_reporting"\s*{/);
    });

    test("creates root account usage detection rule", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"root_account_usage"\s*{/);
    });

    test("creates console login without MFA rule", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"console_login_no_mfa"\s*{/);
    });

    test("EventBridge rules have targets configured", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"security_analysis"\s*{/);
      expect(terraformCode).toMatch(/arn\s*=\s*aws_lambda_function\.security_analyzer\.arn/);
    });

    test("Lambda permissions allow EventBridge invocation", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_security_analysis"\s*{/);
      expect(terraformCode).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  describe("CloudWatch Alarms", () => {
    test("creates alarm for Glue crawler failures", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"glue_crawler_failures"\s*{/);
    });

    test("creates alarms for Lambda errors", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*{/);
      expect(terraformCode).toMatch(/for_each\s*=/);
    });

    test("alarms send notifications to SNS", () => {
      expect(terraformCode).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.(high|critical)_alerts\.arn\]/);
    });
  });

  describe("Outputs", () => {
    test("outputs CloudTrail logs bucket", () => {
      expect(terraformCode).toMatch(/output\s+"cloudtrail_logs_bucket"\s*{/);
    });

    test("outputs Athena workgroup", () => {
      expect(terraformCode).toMatch(/output\s+"athena_workgroup"\s*{/);
    });

    test("outputs all Lambda function ARNs", () => {
      expect(terraformCode).toMatch(/output\s+"lambda_log_processor_arn"\s*{/);
      expect(terraformCode).toMatch(/output\s+"lambda_security_analyzer_arn"\s*{/);
      expect(terraformCode).toMatch(/output\s+"lambda_alert_enricher_arn"\s*{/);
    });

    test("outputs SNS topic ARNs", () => {
      expect(terraformCode).toMatch(/output\s+"critical_alerts_topic_arn"\s*{/);
      expect(terraformCode).toMatch(/output\s+"high_alerts_topic_arn"\s*{/);
    });

    test("outputs Glue database names", () => {
      expect(terraformCode).toMatch(/output\s+"glue_database_raw"\s*{/);
      expect(terraformCode).toMatch(/output\s+"glue_database_enriched"\s*{/);
    });
  });

  describe("Resource Naming", () => {
    test("resources use unique suffix pattern", () => {
      expect(terraformCode).toMatch(/\$\{var\.project_name\}-.*-\$\{local\.env_suffix\}/);
    });

    test("S3 buckets use env_suffix", () => {
      expect(terraformCode).toMatch(/bucket\s*=\s*"\$\{var\.project_name\}-(logs|athena-results|enriched-logs|compliance-reports)-\$\{local\.env_suffix\}"/);
    });
  });

  describe("Security and Compliance", () => {
    test("all resources have tags", () => {
      const tagMatches = terraformCode.match(/tags\s*=\s*(merge\()?local\.common_tags/g);
      expect(tagMatches).toBeTruthy();
      expect(tagMatches!.length).toBeGreaterThan(20);
    });

    test("no hardcoded account IDs in ARNs", () => {
      expect(terraformCode).not.toMatch(/arn:aws:[a-z]+:[a-z0-9-]*:\d{12}:/);
    });

    test("uses data source for account ID", () => {
      expect(terraformCode).toMatch(/local\.account_id/);
    });
  });
});
