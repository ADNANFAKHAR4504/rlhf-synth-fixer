// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates structure, resources, and requirements WITHOUT running Terraform

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");

describe("Terraform Stack: tap_stack.tf", () => {
  let stackContent: string;

  beforeAll(() => {
    if (!fs.existsSync(STACK_PATH)) {
      throw new Error(`tap_stack.tf not found at: ${STACK_PATH}`);
    }
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  // ============================================================================
  // BASIC FILE STRUCTURE
  // ============================================================================

  describe("File Structure", () => {
    test("file exists and is not empty", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(1000);
    });

    test("does NOT declare provider (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*\{/);
    });

    test("contains data sources section", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"/);
    });

    test("contains locals block", () => {
      expect(stackContent).toMatch(/locals\s*\{/);
    });

    test("is a single file (no module references)", () => {
      expect(stackContent).not.toMatch(/\bmodule\s+"/);
    });
  });

  // ============================================================================
  // REQUIRED VARIABLES
  // ============================================================================

  describe("Required Variables", () => {
    const requiredVariables = [
      "aws_region",
      "environment",
      "vpc_cidr",
      "public_subnet_cidrs",
      "private_subnet_cidrs",
      "enable_nat",
      "service_names",
      "ddb_tables",
      "aurora_engine",
      "aurora_instance_class",
      "aurora_username",
      "aurora_password",
      "aurora_db_name",
      "artifact_bucket_name",
      "data_bucket_name",
      "staging_bucket_name",
      "masking_rules",
      "source_account_id",
      "tags",
    ];

    requiredVariables.forEach((varName) => {
      test(`declares variable "${varName}"`, () => {
        const regex = new RegExp(`variable\\s+"${varName}"\\s*\\{`);
        expect(stackContent).toMatch(regex);
      });
    });

    test("aws_region has default value", () => {
      const awsRegionBlock = stackContent.match(
        /variable\s+"aws_region"\s*\{[^}]*\}/s
      );
      expect(awsRegionBlock).toBeTruthy();
      expect(awsRegionBlock![0]).toMatch(/default\s*=/);
    });

    test("aurora_password is marked sensitive", () => {
      const passwordBlock = stackContent.match(
        /variable\s+"aurora_password"\s*\{[^}]*\}/s
      );
      expect(passwordBlock).toBeTruthy();
      expect(passwordBlock![0]).toMatch(/sensitive\s*=\s*true/);
    });

    test("ddb_tables uses map(object()) type", () => {
      const ddbBlock = stackContent.match(
        /variable\s+"ddb_tables"[\s\S]{0,300}type\s*=\s*map\(object\(/
      );
      expect(ddbBlock).toBeTruthy();
    });

    test("service_names is list(string)", () => {
      const serviceBlock = stackContent.match(
        /variable\s+"service_names"\s*\{[^}]*type\s*=\s*list\(string\)/s
      );
      expect(serviceBlock).toBeTruthy();
    });
  });

  // ============================================================================
  // NETWORKING RESOURCES
  // ============================================================================

  describe("Networking Resources", () => {
    test("creates VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("creates public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("creates NAT Gateway and EIP", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test("creates route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("creates route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });

    test("creates security groups for Aurora and Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
    });

    test("uses aws_security_group_rule (not inline rules)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group_rule"/);
    });

    test("creates VPC endpoint for S3", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.s3"/);
    });

    test("creates VPC endpoint for DynamoDB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
    });

    test("creates VPC endpoint for SSM", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm"/);
    });

    test("creates VPC endpoint for CloudWatch Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"logs"/);
    });

    test("creates additional VPC endpoints (ec2messages, ssmmessages)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ec2messages"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssmmessages"/);
    });
  });

  // ============================================================================
  // KMS KEYS & ENCRYPTION
  // ============================================================================

  describe("KMS Keys & Encryption", () => {
    test("creates KMS key for data", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"data"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("creates KMS key for logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"logs"/);
    });

    test("creates KMS key for SSM", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"ssm"/);
    });

    test("creates KMS key for S3", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
    });

    test("creates per-service KMS keys", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"service"/);
      expect(stackContent).toMatch(/for_each\s*=\s*toset\(var\.service_names\)/);
    });

    test("creates KMS aliases", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"data"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"logs"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"ssm"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3"/);
    });

    test("KMS keys have proper policies for CloudWatch Logs", () => {
      const logsKeyBlock = stackContent.match(
        /resource\s+"aws_kms_key"\s+"logs"\s*\{[\s\S]*?(?=resource\s+"|$)/
      );
      expect(logsKeyBlock).toBeTruthy();
      expect(logsKeyBlock![0]).toMatch(/logs.*amazonaws\.com/);
    });

    test("KMS aliases follow naming pattern", () => {
      const hasAliases = /resource\s+"aws_kms_alias"/.test(stackContent);
      const hasAliasNames = /name\s*=\s*(local\.kms_aliases|local\.service_kms_aliases|"alias\/)/.test(stackContent);
      expect(hasAliases).toBe(true);
      expect(hasAliasNames).toBe(true);
    });
  });

  // ============================================================================
  // S3 BUCKETS
  // ============================================================================

  describe("S3 Buckets", () => {
    test("creates artifact bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"artifact"/);
    });

    test("creates data bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"data"/);
    });

    test("creates staging bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"staging"/);
    });

    test("enables versioning on buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"artifact"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"data"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"staging"/);
    });

    test("configures server-side encryption with KMS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("configures lifecycle policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    });

    test("blocks public access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });
  });

  // ============================================================================
  // DYNAMODB TABLES
  // ============================================================================

  describe("DynamoDB Tables", () => {
    test("creates DynamoDB tables with range keys", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"with_range_key"/);
      expect(stackContent).toMatch(/for_each\s*=\s*local\.tables_with_range_key/);
    });

    test("creates DynamoDB tables without range keys", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"without_range_key"/);
      expect(stackContent).toMatch(/for_each\s*=\s*local\.tables_without_range_key/);
    });

    test("enables point-in-time recovery", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*\{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("configures server-side encryption", () => {
      const ddbEncryption = stackContent.match(/server_side_encryption\s*\{[\s\S]*?kms_key_arn/);
      expect(ddbEncryption).toBeTruthy();
    });

    test("seeds sample data for tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table_item"\s+"sample_with_range"/);
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table_item"\s+"sample_without_range"/);
    });

    test("handles billing_mode PROVISIONED with capacity", () => {
      expect(stackContent).toMatch(/read_capacity\s*=.*billing_mode.*PROVISIONED/s);
      expect(stackContent).toMatch(/write_capacity\s*=.*billing_mode.*PROVISIONED/s);
    });

    test("configures autoscaling for PROVISIONED tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"dynamodb_read/);
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"dynamodb_read/);
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"dynamodb_write/);
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"dynamodb_write/);
    });
  });

  // ============================================================================
  // AURORA DATABASE
  // ============================================================================

  describe("Aurora Database", () => {
    test("creates Aurora cluster", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"/);
    });

    test("creates Aurora cluster instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora"/);
      expect(stackContent).toMatch(/count\s*=\s*2/); // At least 2 instances
    });

    test("creates DB subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"/);
    });

    test("creates cluster parameter group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_parameter_group"\s+"aurora"/);
    });

    test("creates instance parameter group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"aurora"/);
    });

    test("enables storage encryption", () => {
      const auroraBlock = stackContent.match(
        /resource\s+"aws_rds_cluster"\s+"aurora"\s*\{[\s\S]*?(?=resource\s+"|$)/
      );
      expect(auroraBlock).toBeTruthy();
      expect(auroraBlock![0]).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("uses KMS key for encryption", () => {
      const auroraBlock = stackContent.match(
        /resource\s+"aws_rds_cluster"\s+"aurora"\s*\{[\s\S]*?(?=resource\s+"|$)/
      );
      expect(auroraBlock![0]).toMatch(/kms_key_id/);
    });

    test("configures backup retention", () => {
      expect(stackContent).toMatch(/backup_retention_period/);
    });
  });

  // ============================================================================
  // SSM PARAMETERS
  // ============================================================================

  describe("SSM Parameters", () => {
    test("creates SSM parameter for masking rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"masking_rules"/);
    });

    test("creates SSM parameter for Aurora endpoint", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"aurora_endpoint"/);
    });

    test("uses environment-specific parameter paths", () => {
      expect(stackContent).toMatch(/\/\$\{var\.environment\}\/fintech/);
    });

    test("encrypts SecureString parameters with KMS", () => {
      const ssmBlock = stackContent.match(
        /resource\s+"aws_ssm_parameter"\s+"masking_rules"[\s\S]*?(?=resource\s+"|$)/
      );
      expect(ssmBlock).toBeTruthy();
      expect(ssmBlock![0]).toMatch(/type\s*=\s*"SecureString"/);
      expect(ssmBlock![0]).toMatch(/key_id/);
    });
  });

  // ============================================================================
  // LAMBDA FUNCTIONS
  // ============================================================================

  describe("Lambda Functions", () => {
    const requiredLambdas = [
      "masking_handler",
      "dynamodb_refresh_handler",
      "aurora_refresh_handler",
      "s3_sync_handler",
      "integration_tests_handler",
      "parity_validation_handler",
    ];

    requiredLambdas.forEach((lambda) => {
      test(`creates ${lambda} Lambda function`, () => {
        const regex = new RegExp(`resource\\s+"aws_lambda_function"\\s+"${lambda}"`);
        expect(stackContent).toMatch(regex);
      });

      test(`creates archive_file data source for ${lambda}`, () => {
        const regex = new RegExp(`data\\s+"archive_file"\\s+"${lambda}"`);
        expect(stackContent).toMatch(regex);
      });
    });

    test("Lambda functions use inline code (heredoc)", () => {
      expect(stackContent).toMatch(/<<-EOF[\s\S]*?import.*boto3/);
    });

    test("Lambda functions have VPC configuration", () => {
      expect(stackContent).toMatch(/vpc_config\s*\{/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private/);
    });

    test("Lambda functions depend on log groups", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda\]/);
    });

    test("creates IAM roles for Lambda functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda"/);
      expect(stackContent).toMatch(/for_each\s*=\s*local\.lambda_functions/);
    });

    test("Lambda IAM roles use VPC execution policy", () => {
      expect(stackContent).toMatch(/aws_iam_role_policy_attachment.*lambda_vpc/);
      expect(stackContent).toMatch(/AWSLambdaVPCAccessExecutionRole/);
    });

    test("creates function-specific IAM policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"masking_handler"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"dynamodb_refresh_handler"/);
    });
  });

  // ============================================================================
  // IAM ROLES & POLICIES
  // ============================================================================

  describe("IAM Roles & Policies", () => {
    test("creates common Lambda IAM policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_common"/);
    });

    test("creates Step Functions IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"sfn"/);
    });

    test("creates SSM Automation IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ssm_automation"/);
    });

    test("creates EventBridge IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge"/);
    });

    test("IAM policies use least privilege (no wildcards for resources)", () => {
      // Should NOT have policies like "Resource": "*" for sensitive actions
      const s3PolicyMatches = stackContent.match(/"s3:\*"[\s\S]*?"Resource"\s*:\s*"\*"/);
      expect(s3PolicyMatches).toBeFalsy();
    });

    test("includes cross-account assume role permissions", () => {
      expect(stackContent).toMatch(/sts:AssumeRole/);
      expect(stackContent).toMatch(/source_account_id/);
    });

    test("Lambda policies include KMS permissions", () => {
      expect(stackContent).toMatch(/kms:Decrypt/);
      expect(stackContent).toMatch(/kms:GenerateDataKey/);
    });

    test("Lambda policies include SSM GetParameter", () => {
      expect(stackContent).toMatch(/ssm:GetParameter/);
    });

    test("Lambda policies include CloudWatch PutMetricData", () => {
      expect(stackContent).toMatch(/cloudwatch:PutMetricData/);
    });
  });

  // ============================================================================
  // CLOUDWATCH LOG GROUPS
  // ============================================================================

  describe("CloudWatch Log Groups", () => {
    test("creates log groups for Lambda functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(stackContent).toMatch(/for_each\s*=\s*local\.lambda_functions/);
    });

    test("creates log group for Step Functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"sfn"/);
    });

    test("log groups have retention configured", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*\d+/);
    });

    test("log groups use KMS encryption", () => {
      const logGroupBlock = stackContent.match(
        /resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id/
      );
      expect(logGroupBlock).toBeTruthy();
    });

    test("log group names follow AWS conventions", () => {
      expect(stackContent).toMatch(/\/aws\/lambda\//);
      expect(stackContent).toMatch(/\/aws\/vendedlogs\/states\//);
    });
  });

  // ============================================================================
  // SSM AUTOMATION DOCUMENT
  // ============================================================================

  describe("SSM Automation Document", () => {
    test("creates SSM automation document", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_document"\s+"aurora_masking"/);
    });

    test("document type is Automation", () => {
      const ssmBlock = stackContent.match(
        /resource\s+"aws_ssm_document"\s+"aurora_masking"[\s\S]{0,500}/
      );
      expect(ssmBlock).toBeTruthy();
      expect(ssmBlock![0]).toMatch(/document_type\s*=\s*"Automation"/);
    });

    test("document has assumeRole parameter", () => {
      const ssmBlock = stackContent.match(
        /resource\s+"aws_ssm_document"\s+"aurora_masking"[\s\S]*?assumeRole/
      );
      expect(ssmBlock).toBeTruthy();
    });

    test("document content uses YAML format", () => {
      expect(stackContent).toMatch(/document_format\s*=\s*"YAML"/);
    });

    test("document has RestoreFromSnapshot step", () => {
      expect(stackContent).toMatch(/RestoreFromSnapshot/);
      expect(stackContent).toMatch(/RestoreDBClusterFromSnapshot/);
    });
  });

  // ============================================================================
  // STEP FUNCTIONS STATE MACHINE
  // ============================================================================

  describe("Step Functions State Machine", () => {
    test("creates Step Functions state machine", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"daily_refresh"/);
    });

    test("state machine has logging configured", () => {
      expect(stackContent).toMatch(/logging_configuration\s*\{/);
      expect(stackContent).toMatch(/include_execution_data\s*=\s*true/);
    });

    test("state machine definition includes S3Sync state", () => {
      const sfnBlock = stackContent.match(
        /resource\s+"aws_sfn_state_machine"[\s\S]{0,5000}/
      );
      expect(sfnBlock).toBeTruthy();
      expect(sfnBlock![0]).toMatch(/S3Sync/);
    });

    test("state machine definition includes DynamoDBRefresh state", () => {
      const sfnBlock = stackContent.match(
        /resource\s+"aws_sfn_state_machine"[\s\S]{0,5000}/
      );
      expect(sfnBlock![0]).toMatch(/DynamoDBRefresh/);
    });

    test("state machine definition includes AuroraRefresh state", () => {
      const sfnBlock = stackContent.match(
        /resource\s+"aws_sfn_state_machine"[\s\S]{0,5000}/
      );
      expect(sfnBlock![0]).toMatch(/AuroraRefresh/);
    });

    test("state machine definition includes IntegrationTests state", () => {
      const sfnBlock = stackContent.match(
        /resource\s+"aws_sfn_state_machine"[\s\S]{0,5000}/
      );
      expect(sfnBlock![0]).toMatch(/IntegrationTests/);
    });

    test("DynamoDB refresh uses Map state", () => {
      const sfnBlock = stackContent.match(
        /resource\s+"aws_sfn_state_machine"[\s\S]{0,5000}/
      );
      expect(sfnBlock![0]).toMatch(/Type.*Map/);
      expect(sfnBlock![0]).toMatch(/Iterator/);
    });

    test("state machine uses proper Lambda invoke syntax", () => {
      const sfnBlock = stackContent.match(
        /resource\s+"aws_sfn_state_machine"[\s\S]{0,5000}/
      );
      expect(sfnBlock![0]).toMatch(/arn:aws:states:::lambda:invoke/);
    });
  });

  // ============================================================================
  // EVENTBRIDGE RULES
  // ============================================================================

  describe("EventBridge Rules", () => {
    test("creates daily refresh EventBridge rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"daily_refresh"/);
    });

    test("creates weekly parity validation EventBridge rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"weekly_parity"/);
    });

    test("daily refresh uses cron schedule", () => {
      const dailyBlock = stackContent.match(
        /resource\s+"aws_cloudwatch_event_rule"\s+"daily_refresh"[\s\S]{0,500}/
      );
      expect(dailyBlock).toBeTruthy();
      expect(dailyBlock![0]).toMatch(/cron/);
    });

    test("weekly parity uses cron schedule", () => {
      const weeklyBlock = stackContent.match(
        /resource\s+"aws_cloudwatch_event_rule"\s+"weekly_parity"[\s\S]{0,500}/
      );
      expect(weeklyBlock).toBeTruthy();
      expect(weeklyBlock![0]).toMatch(/cron/);
    });

    test("creates EventBridge targets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"daily_refresh"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"weekly_parity"/);
    });

    test("Lambda permission for EventBridge invocation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"weekly_parity"/);
      expect(stackContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  // ============================================================================
  // CLOUDWATCH DASHBOARDS & ALARMS
  // ============================================================================

  describe("CloudWatch Dashboards & Alarms", () => {
    test("creates main CloudWatch dashboard", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
    });

    test("creates per-service dashboards", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"service"/);
      expect(stackContent).toMatch(/for_each\s*=\s*toset\(var\.service_names\)/);
    });

    test("dashboard body is JSON encoded", () => {
      expect(stackContent).toMatch(/dashboard_body\s*=\s*jsonencode/);
    });

    test("creates alarms for Step Functions failures", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"sfn_failed"/);
      expect(stackContent).toMatch(/ExecutionsFailed/);
    });

    test("creates alarms for Lambda errors", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
      expect(stackContent).toMatch(/for_each\s*=\s*local\.lambda_functions/);
    });

    test("alarms use appropriate comparison operators", () => {
      expect(stackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    });
  });

  // ============================================================================
  // OUTPUTS
  // ============================================================================

  describe("Required Outputs", () => {
    const requiredOutputs = [
      "vpc_id",
      "public_subnet_ids",
      "private_subnet_ids",
      "aurora_endpoint",
      "s3_buckets",
      "dynamodb_tables",
      "kms_keys",
      "step_functions_arn",
      "eventbridge_rules",
      "ssm_document",
      "dashboards",
      "drift_report_uri",
    ];

    requiredOutputs.forEach((output) => {
      test(`declares output "${output}"`, () => {
        const regex = new RegExp(`output\\s+"${output}"\\s*\\{`);
        expect(stackContent).toMatch(regex);
      });
    });

    test("outputs have descriptions or values", () => {
      const outputBlocks = stackContent.match(/output\s+"[^"]+"\s*\{/g);
      expect(outputBlocks).toBeTruthy();
      expect(outputBlocks!.length).toBeGreaterThan(10);
    });

    test("drift_report_uri output includes S3 URI", () => {
      const driftBlock = stackContent.match(/output\s+"drift_report_uri"[\s\S]{0,200}/);
      expect(driftBlock).toBeTruthy();
      expect(driftBlock![0]).toMatch(/s3:/);
    });
  });

  // ============================================================================
  // CODE QUALITY & BEST PRACTICES
  // ============================================================================

  describe("Code Quality & Best Practices", () => {
    test("uses for_each for multi-resource patterns", () => {
      const forEachCount = (stackContent.match(/for_each\s*=/g) || []).length;
      expect(forEachCount).toBeGreaterThan(10);
    });

    test("uses locals for computed values", () => {
      expect(stackContent).toMatch(/local\./);
    });

    test("uses merge() for tags", () => {
      const mergeCount = (stackContent.match(/merge\(var\.tags/g) || []).length;
      expect(mergeCount).toBeGreaterThan(20);
    });

    test("resources have meaningful names", () => {
      expect(stackContent).not.toMatch(/resource\s+"[^"]+"\s+"foo"/);
      expect(stackContent).not.toMatch(/resource\s+"[^"]+"\s+"test"/);
    });

    test("uses depends_on where necessary", () => {
      expect(stackContent).toMatch(/depends_on\s*=/);
    });

    test("uses dynamic blocks or conditional logic appropriately", () => {
      // Dynamic blocks or conditional attribute creation
      const hasDynamic = /dynamic\s+["']\w+["']/.test(stackContent);
      const hasConditionalLogic = /for_each\s*=/.test(stackContent);
      expect(hasDynamic || hasConditionalLogic).toBe(true);
    });

    test("no hardcoded account IDs (uses data source or variables)", () => {
      const hardcodedAccount = stackContent.match(/:\d{12}:/);
      if (hardcodedAccount) {
        // Verify it's in a comment or example, not actual code
        const surroundingContext = stackContent.substring(
          Math.max(0, hardcodedAccount.index! - 50),
          hardcodedAccount.index! + 50
        );
        expect(surroundingContext).toMatch(/(#|\/\/|local\.account_id|var\.source_account_id)/);
      }
    });

    test("sensitive variables are marked", () => {
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });

    test("uses coalesce for optional values", () => {
      expect(stackContent).toMatch(/coalesce\(/);
    });

    test("proper conditional logic for optional resources", () => {
      // Check for ternary operators used for conditional resource creation
      const hasTernary = /\?\s*\S+\s*:\s*\S+/.test(stackContent);
      expect(hasTernary).toBe(true);
    });
  });

  // ============================================================================
  // SECURITY BEST PRACTICES
  // ============================================================================

  describe("Security Best Practices", () => {
    test("S3 buckets block public access", () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 buckets use KMS encryption", () => {
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("DynamoDB tables use encryption", () => {
      expect(stackContent).toMatch(/server_side_encryption\s*\{/);
    });

    test("Aurora uses encryption at rest", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("log groups use encryption", () => {
      const logGroupEncryption = stackContent.match(
        /resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id/
      );
      expect(logGroupEncryption).toBeTruthy();
    });

    test("IAM policies avoid overly permissive wildcards", () => {
      // Should not have both "Action": "*" and "Resource": "*"
      const dangerousWildcards = stackContent.match(/"Action"\s*:\s*"\*"[\s\S]{0,100}"Resource"\s*:\s*"\*"/);
      expect(dangerousWildcards).toBeFalsy();
    });

    test("security group egress is controlled", () => {
      expect(stackContent).toMatch(/egress\s*\{/);
    });
  });

  // ============================================================================
  // FINTECH-SPECIFIC REQUIREMENTS
  // ============================================================================

  describe("Fintech-Specific Requirements", () => {
    test("includes masking rules variable", () => {
      expect(stackContent).toMatch(/variable\s+"masking_rules"/);
    });

    test("masking handler Lambda exists", () => {
      expect(stackContent).toMatch(/masking_handler/);
    });

    test("integration tests handler exists", () => {
      expect(stackContent).toMatch(/integration_tests_handler/);
    });

    test("parity validation handler exists", () => {
      expect(stackContent).toMatch(/parity_validation_handler/);
    });

    test("daily refresh workflow is configured", () => {
      expect(stackContent).toMatch(/daily_refresh/);
    });

    test("weekly parity check is configured", () => {
      expect(stackContent).toMatch(/weekly_parity/);
    });

    test("includes source_account_id for cross-account access", () => {
      expect(stackContent).toMatch(/variable\s+"source_account_id"/);
    });

    test("DynamoDB refresh includes export functionality", () => {
      // Look for the Lambda function content, not just the archive_file data source
      const ddbRefreshContent = stackContent.match(
        /dynamodb_refresh_handler[\s\S]{0,5000}export.*table/i
      );
      expect(ddbRefreshContent).toBeTruthy();
    });

    test("Aurora refresh includes snapshot functionality", () => {
      // Look for the Lambda function content  
      const auroraRefreshContent = stackContent.match(
        /aurora_refresh_handler[\s\S]{0,5000}copy.*snapshot/i
      );
      expect(auroraRefreshContent).toBeTruthy();
    });
  });

  // ============================================================================
  // RESOURCE COUNTS & COVERAGE
  // ============================================================================

  describe("Resource Coverage", () => {
    test("creates at least 50 resources", () => {
      const resourceCount = (stackContent.match(/resource\s+"[^"]+"\s+"[^"]+"/g) || []).length;
      expect(resourceCount).toBeGreaterThan(50);
    });

    test("uses at least 3 data sources", () => {
      const dataSourceCount = (stackContent.match(/data\s+"[^"]+"\s+"[^"]+"/g) || []).length;
      expect(dataSourceCount).toBeGreaterThan(3);
    });

    test("creates at least 15 variables", () => {
      const variableCount = (stackContent.match(/variable\s+"[^"]+"/g) || []).length;
      expect(variableCount).toBeGreaterThan(15);
    });

    test("creates at least 10 outputs", () => {
      const outputCount = (stackContent.match(/output\s+"[^"]+"/g) || []).length;
      expect(outputCount).toBeGreaterThan(10);
    });

    test("file size is substantial (comprehensive infrastructure)", () => {
      expect(stackContent.length).toBeGreaterThan(50000); // At least 50KB
    });
  });
});
