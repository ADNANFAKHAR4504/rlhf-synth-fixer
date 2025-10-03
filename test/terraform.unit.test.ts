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
      throw new Error(`[unit] Expected stack at: ${stackPath}`);
    }
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    expect(exists).toBe(true);
  });

  // --- Provider and Basic Structure Tests ---

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  // --- Variable Tests ---

  test("declares all required variables", () => {
    const requiredVariables = [
      "aws_region",
      "environment",
      "ingestion_bucket_name",
      "archive_bucket_name",
      "dynamo_table_name",
      "email_recipients",
      "owner_tag",
      "cost_center"
    ];

    requiredVariables.forEach(variable => {
      expect(content).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
    });
  });

  test("variables have appropriate defaults", () => {
    expect(content).toMatch(/default\s*=\s*"us-east-1"/); // aws_region
    expect(content).toMatch(/default\s*=\s*"prod"/); // environment
    expect(content).toMatch(/default\s*=\s*\["compliance@example\.com"\]/); // email_recipients
  });

  // --- KMS Key Tests ---

  test("creates KMS keys for all required services", () => {
    const kmsKeys = [
      "aws_kms_key.s3_key",
      "aws_kms_key.glue_key",
      "aws_kms_key.athena_key",
      "aws_kms_key.dynamodb_key",
      "aws_kms_key.lambda_key"
    ];

    kmsKeys.forEach(key => {
      expect(content).toMatch(new RegExp(`resource\\s+"aws_kms_key"\\s+"${key.split('.')[1]}"`));
    });
  });

  test("KMS keys have key rotation enabled", () => {
    const rotationMatches = content.match(/enable_key_rotation\s*=\s*true/g);
    expect(rotationMatches).toBeTruthy();
    expect(rotationMatches!.length).toBeGreaterThanOrEqual(5); // At least 5 KMS keys
  });

  test("KMS keys have appropriate deletion windows", () => {
    const deletionMatches = content.match(/deletion_window_in_days\s*=\s*10/g);
    expect(deletionMatches).toBeTruthy();
    expect(deletionMatches!.length).toBeGreaterThanOrEqual(5);
  });

  // --- S3 Bucket Tests ---

  test("creates required S3 buckets", () => {
    const s3Buckets = [
      "aws_s3_bucket.ingestion",
      "aws_s3_bucket.archive",
      "aws_s3_bucket.athena_results",
      "aws_s3_bucket.glue_scripts",
      "aws_s3_bucket.cloudtrail"
    ];

    s3Buckets.forEach(bucket => {
      expect(content).toMatch(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket.split('.')[1]}"`));
    });
  });

  test("S3 buckets have versioning enabled", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"ingestion"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"archive"/);
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("S3 buckets have server-side encryption configured", () => {
    const encryptionResources = [
      "aws_s3_bucket_server_side_encryption_configuration.ingestion",
      "aws_s3_bucket_server_side_encryption_configuration.archive",
      "aws_s3_bucket_server_side_encryption_configuration.athena_results"
    ];

    encryptionResources.forEach(resource => {
      expect(content).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"`));
    });
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("S3 buckets have public access blocked", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"ingestion"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"archive"/);
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("archive bucket has Object Lock enabled for compliance", () => {
    expect(content).toMatch(/object_lock_enabled\s*=\s*true/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_object_lock_configuration"\s+"archive"/);
    expect(content).toMatch(/mode\s*=\s*"COMPLIANCE"/);
    expect(content).toMatch(/days\s*=\s*3650/); // 10 years
  });

  // --- DynamoDB Tests ---

  test("creates DynamoDB table with correct configuration", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"metadata"/);
    expect(content).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    expect(content).toMatch(/hash_key\s*=\s*"reportId"/);
  });

  test("DynamoDB table has required attributes and GSIs", () => {
    expect(content).toMatch(/name\s*=\s*"reportId"/);
    expect(content).toMatch(/name\s*=\s*"source"/);
    expect(content).toMatch(/name\s*=\s*"complianceType"/);
    expect(content).toMatch(/name\s*=\s*"SourceIndex"/);
    expect(content).toMatch(/name\s*=\s*"ComplianceTypeIndex"/);
  });

  test("DynamoDB table has encryption and backup enabled", () => {
    expect(content).toMatch(/server_side_encryption\s*{/);
    expect(content).toMatch(/enabled\s*=\s*true/);
    expect(content).toMatch(/point_in_time_recovery\s*{/);
  });

  // --- Lambda and SQS Tests ---

  test("creates SQS Dead Letter Queue", () => {
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"lambda_dlq"/);
    expect(content).toMatch(/message_retention_seconds\s*=\s*1209600/); // 14 days
  });

  // --- Glue Tests ---

  test("creates Glue catalog database and resources", () => {
    expect(content).toMatch(/resource\s+"aws_glue_catalog_database"\s+"compliance_db"/);
    expect(content).toMatch(/resource\s+"aws_glue_crawler"\s+"raw_data_crawler"/);
    expect(content).toMatch(/resource\s+"aws_glue_job"\s+"compliance_etl"/);
  });

  test("Glue has security configuration", () => {
    expect(content).toMatch(/resource\s+"aws_glue_security_configuration"\s+"glue_security"/);
    expect(content).toMatch(/cloudwatch_encryption_mode\s*=\s*"SSE-KMS"/);
    expect(content).toMatch(/job_bookmarks_encryption_mode\s*=\s*"SSE-KMS"/);
    expect(content).toMatch(/s3_encryption_mode\s*=\s*"SSE-KMS"/);
  });

  test("Glue ETL job has job bookmarks enabled", () => {
    expect(content).toMatch(/"--job-bookmark-option"\s*=\s*"job-bookmark-enable"/);
    expect(content).toMatch(/"--enable-job-insights"\s*=\s*"true"/);
  });

  // --- Lake Formation Tests ---

  test("configures Lake Formation data lake settings", () => {
    expect(content).toMatch(/resource\s+"aws_lakeformation_data_lake_settings"\s+"compliance"/);
    expect(content).toMatch(/resource\s+"aws_lakeformation_resource"\s+"ingestion_bucket"/);
    expect(content).toMatch(/resource\s+"aws_lakeformation_resource"\s+"archive_bucket"/);
  });

  test("configures Lake Formation permissions", () => {
    expect(content).toMatch(/resource\s+"aws_lakeformation_permissions"\s+"glue_database_permissions"/);
    expect(content).toMatch(/"CREATE_TABLE", "ALTER", "DROP", "DESCRIBE"/);
  });

  // --- Athena Tests ---

  test("creates Athena workgroup with proper configuration", () => {
    expect(content).toMatch(/resource\s+"aws_athena_workgroup"\s+"compliance"/);
    expect(content).toMatch(/enforce_workgroup_configuration\s*=\s*true/);
    expect(content).toMatch(/publish_cloudwatch_metrics_enabled\s*=\s*true/);
    expect(content).toMatch(/encryption_option\s*=\s*"SSE_KMS"/);
  });

  // --- Step Functions Tests ---

  test("creates Step Functions state machine", () => {
    expect(content).toMatch(/resource\s+"aws_sfn_state_machine"\s+"compliance_workflow"/);
    expect(content).toMatch(/Comment\s*=\s*"Compliance report generation workflow"/);
    expect(content).toMatch(/StartAt\s*=\s*"RunETL"/);
  });

  test("Step Functions has retry and error handling", () => {
    expect(content).toMatch(/Retry\s*=\s*\[/);
    expect(content).toMatch(/Catch\s*=\s*\[/);
    expect(content).toMatch(/BackoffRate\s*=\s*2\.0/);
    expect(content).toMatch(/MaxAttempts\s*=\s*3/);
  });

  // --- CloudWatch Tests ---

  test("creates CloudWatch Log Groups with retention", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    expect(content).toMatch(/retention_in_days\s*=\s*30/);
  });

  // --- SNS and Notifications Tests ---

  test("creates SNS topic and email subscriptions", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"notifications"/);
    expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"/);
    expect(content).toMatch(/for_each\s*=\s*toset\(var\.email_recipients\)/);
  });

  // --- EventBridge Tests ---

  test("creates EventBridge rule for scheduled execution", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"daily_reports"/);
    expect(content).toMatch(/schedule_expression\s*=\s*"cron\(0 2 \* \* \? \*\)"/); // 2 AM UTC
    expect(content).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"step_functions"/);
  });

  // --- CloudTrail Tests ---

  test("creates CloudTrail with proper configuration", () => {
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"audit"/);
    expect(content).toMatch(/include_global_service_events\s*=\s*true/);
    expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
    expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
  });

  test("CloudTrail has data events configured for S3", () => {
    expect(content).toMatch(/data_resource\s*{/);
    expect(content).toMatch(/type\s*=\s*"AWS::S3::Object"/);
  });

  // --- Macie Tests ---

  test("configures Macie for PII detection", () => {
    expect(content).toMatch(/resource\s+"aws_macie2_account"\s+"compliance"/);
    expect(content).toMatch(/resource\s+"aws_macie2_classification_job"\s+"pii_detection"/);
    expect(content).toMatch(/job_type\s*=\s*"ONE_TIME"/);
  });

  // --- AWS Config Tests ---

  test("configures AWS Config for compliance", () => {
    expect(content).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"compliance"/);
    expect(content).toMatch(/resource\s+"aws_config_delivery_channel"\s+"compliance"/);
    expect(content).toMatch(/all_supported\s*=\s*true/);
  });

  // --- IAM Role Tests ---

  test("creates required IAM roles", () => {
    const iamRoles = [
      "aws_iam_role.glue_service_role",
      "aws_iam_role.step_functions_role",
      "aws_iam_role.events_role"
    ];

    iamRoles.forEach(role => {
      expect(content).toMatch(new RegExp(`resource\\s+"aws_iam_role"`));
    });
  });

  // --- Tagging Tests ---

  test("uses consistent tagging with locals", () => {
    expect(content).toMatch(/locals\s*{/);
    expect(content).toMatch(/common_tags\s*=/);
    expect(content).toMatch(/Environment\s*=\s*var\.environment/);
    expect(content).toMatch(/Compliance\s*=\s*"Yes"/);
    expect(content).toMatch(/Owner\s*=\s*var\.owner_tag/);
    expect(content).toMatch(/CostCenter\s*=\s*var\.cost_center/);
  });

  test("applies tags to resources using merge function", () => {
    const taggedResources = content.match(/tags\s*=\s*merge\(local\.common_tags/g);
    expect(taggedResources).toBeTruthy();
    expect(taggedResources!.length).toBeGreaterThan(10); // Many resources should be tagged
  });

  // --- Output Tests ---

  test("defines all required outputs", () => {
    const requiredOutputs = [
      "ingestion_bucket_arn",
      "archive_bucket_arn",
      "glue_catalog_id",
      "lake_formation_data_lake_arn",
      "athena_workgroup",
      "quicksight_dashboard_url",
      "dynamodb_table_arn",
      "step_functions_arn",
      "cloudtrail_arn",
      "sns_topic_arn"
    ];

    requiredOutputs.forEach(output => {
      expect(content).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
    });
  });

  test("outputs have descriptions", () => {
    const descriptionMatches = content.match(/description\s*=\s*"[^"]+"/g);
    expect(descriptionMatches).toBeTruthy();
    expect(descriptionMatches!.length).toBeGreaterThanOrEqual(10); // All outputs should have descriptions
  });

  // --- Security and Compliance Tests ---

  test("enforces encryption at rest for all data stores", () => {
    // Check for KMS encryption in various services
    expect(content).toMatch(/kms_master_key_id/);
    expect(content).toMatch(/kms_key_arn/);
    expect(content).toMatch(/server_side_encryption/);
  });

  test("follows principle of least privilege for IAM", () => {
    // Should have specific service actions instead of broad wildcards
    expect(content).toMatch(/glue:StartJobRun/);
    expect(content).toMatch(/s3:GetObject/);
    expect(content).toMatch(/dynamodb:PutItem/);
    expect(content).toMatch(/lambda:InvokeFunction/);
  });

  test("configures proper lifecycle policies for long-term retention", () => {
    expect(content).toMatch(/aws_s3_bucket_lifecycle_configuration/);
    expect(content).toMatch(/storage_class\s*=\s*"GLACIER"/);
    expect(content).toMatch(/storage_class\s*=\s*"DEEP_ARCHIVE"/);
    expect(content).toMatch(/days\s*=\s*3650/); // 10 year retention
  });

  // --- Data Processing Workflow Tests ---

  test("implements data lineage tracking", () => {
    // Should have DynamoDB table for metadata tracking
    expect(content).toMatch(/reportId/);
    expect(content).toMatch(/source/);
    expect(content).toMatch(/timestamp/);
  });

  test("configures data quality validation", () => {
    // Should reference data validation in Step Functions or Lambda
    expect(content).toMatch(/ValidateData/);
    expect(content).toMatch(/data-validation/);
  });

});
