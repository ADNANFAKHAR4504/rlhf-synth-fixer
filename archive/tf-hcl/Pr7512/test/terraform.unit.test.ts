// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const VARIABLES_REL = "../lib/variables.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  let stackContent: string;
  let variablesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    if (fs.existsSync(variablesPath)) {
      variablesContent = fs.readFileSync(variablesPath, "utf8");
    }
  });

  // ============================================================================
  // FILE EXISTENCE AND STRUCTURE
  // ============================================================================

  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  // ============================================================================
  // TERRAFORM BLOCK CONFIGURATION
  // ============================================================================

  test("has terraform block with required_version", () => {
    expect(stackContent).toMatch(/terraform\s*{/);
    expect(stackContent).toMatch(/required_version\s*=/);
  });

  test("has required_providers block", () => {
    expect(stackContent).toMatch(/required_providers\s*{/);
  });

  test("declares AWS provider with correct source", () => {
    expect(stackContent).toMatch(/aws\s*=\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*["']hashicorp\/aws["']/);
  });

  test("declares archive provider", () => {
    expect(stackContent).toMatch(/archive\s*=\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*["']hashicorp\/archive["']/);
  });

  test("declares random provider", () => {
    expect(stackContent).toMatch(/random\s*=\s*{/);
    expect(stackContent).toMatch(/source\s*=\s*["']hashicorp\/random["']/);
  });

  test("has S3 backend configuration", () => {
    expect(stackContent).toMatch(/backend\s+"s3"\s*{/);
  });

  // ============================================================================
  // VARIABLE DEFINITIONS
  // ============================================================================

  test("defines env variable with validation", () => {
    expect(stackContent).toMatch(/variable\s+"env"\s*{/);
    expect(stackContent).toMatch(/validation\s*{/);
    expect(stackContent).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\],\s*var\.env\)/);
  });

  test("defines project_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("defines vpc_cidr variable", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("defines aws_region variable (in variables.tf or tap_stack.tf)", () => {
    const allContent = stackContent + (variablesContent || "");
    expect(allContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("defines pr_number variable (in variables.tf or tap_stack.tf)", () => {
    const allContent = stackContent + (variablesContent || "");
    expect(allContent).toMatch(/variable\s+"pr_number"\s*{/);
  });

  // ============================================================================
  // LOCALS DEFINITIONS
  // ============================================================================

  test("defines locals block", () => {
    expect(stackContent).toMatch(/locals\s*{/);
  });

  test("defines name_prefix local", () => {
    expect(stackContent).toMatch(/name_prefix\s*=/);
    expect(stackContent).toMatch(/\$\{var\.project_name\}/);
    expect(stackContent).toMatch(/\$\{var\.env\}/);
    expect(stackContent).toMatch(/\$\{var\.pr_number\}/);
  });

  test("defines tags local with merge function", () => {
    expect(stackContent).toMatch(/tags\s*=\s*merge\(/);
    expect(stackContent).toMatch(/Environment\s*=\s*var\.env/);
    expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
    expect(stackContent).toMatch(/ManagedBy\s*=\s*["']terraform["']/);
  });

  test("defines capacity_map local for environments", () => {
    expect(stackContent).toMatch(/capacity_map\s*=\s*{/);
    expect(stackContent).toMatch(/dev\s*=\s*{/);
    expect(stackContent).toMatch(/staging\s*=\s*{/);
    expect(stackContent).toMatch(/prod\s*=\s*{/);
  });

  // ============================================================================
  // DATA SOURCES
  // ============================================================================

  test("defines aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("defines aws_availability_zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
  });

  // ============================================================================
  // KMS KEYS
  // ============================================================================

  test("defines KMS key resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("defines KMS key alias", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
  });

  test("defines KMS key policy", () => {
    expect(stackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"kms_key_policy"\s*{/);
  });

  // ============================================================================
  // VPC AND NETWORKING
  // ============================================================================

  test("defines VPC resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("defines Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("defines public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
  });

  test("defines private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
  });

  test("defines NAT Gateway (conditional)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*var\.enable_nat/);
  });

  test("defines route tables", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
  });

  test("defines security groups", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"redis"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora"\s*{/);
  });

  test("defines VPC endpoints", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kinesis"\s*{/);
  });

  // ============================================================================
  // S3 BUCKETS
  // ============================================================================

  test("defines S3 buckets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"telemetry"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"analytics"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"athena_results"\s*{/);
  });

  test("S3 buckets have encryption enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"telemetry"\s*{/);
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*["']aws:kms["']/);
  });

  test("S3 buckets have versioning", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"telemetry"\s*{/);
    expect(stackContent).toMatch(/status\s*=\s*["']Enabled["']/);
  });

  // ============================================================================
  // DYNAMODB TABLES
  // ============================================================================

  test("defines DynamoDB tables", () => {
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"vehicle_positions"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"delivery_status"\s*{/);
  });

  test("DynamoDB tables have encryption enabled", () => {
    expect(stackContent).toMatch(/server_side_encryption\s*{/);
    expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.main\.arn/);
  });

  test("vehicle_positions table has GSI", () => {
    expect(stackContent).toMatch(/global_secondary_index\s*{/);
    expect(stackContent).toMatch(/name\s*=\s*["']geohash-index["']/);
  });

  test("delivery_status table has TTL enabled", () => {
    expect(stackContent).toMatch(/ttl\s*{/);
    expect(stackContent).toMatch(/enabled\s*=\s*true/);
  });

  // ============================================================================
  // KINESIS DATA STREAM
  // ============================================================================

  test("defines Kinesis stream", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"gps"\s*{/);
    expect(stackContent).toMatch(/encryption_type\s*=\s*["']KMS["']/);
  });

  // ============================================================================
  // ELASTICACHE REDIS
  // ============================================================================

  test("defines ElastiCache Redis", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*{/);
    expect(stackContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
    expect(stackContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
  });

  // ============================================================================
  // AURORA POSTGRESQL
  // ============================================================================

  test("defines Aurora cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"\s*{/);
    expect(stackContent).toMatch(/engine\s*=\s*["']aurora-postgresql["']/);
    expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("defines Aurora instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*{/);
  });

  test("defines Secrets Manager secret for Aurora", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora"\s*{/);
  });

  // ============================================================================
  // SNS TOPICS
  // ============================================================================

  test("defines SNS topics", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"geofence_violations"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"customer_notifications"\s*{/);
  });

  // ============================================================================
  // SQS QUEUES
  // ============================================================================

  test("defines SQS queues", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"warehouse"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"customer"\s*{/);
  });

  test("SQS queues have DLQs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"warehouse_dlq"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"customer_dlq"\s*{/);
  });

  test("SQS queues have redrive policies", () => {
    expect(stackContent).toMatch(/redrive_policy\s*=\s*jsonencode\(/);
  });

  // ============================================================================
  // LAMBDA FUNCTIONS
  // ============================================================================

  test("defines Lambda functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"location_processor"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"geofence_checker"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"warehouse_updater"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"customer_notifier"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"telemetry_analyzer"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"route_optimizer"\s*{/);
  });

  test("defines Lambda IAM roles", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"location_processor"\s*{/);
    expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode\(/);
    expect(stackContent).toMatch(/Service\s*=\s*["']lambda\.amazonaws\.com["']/);
  });

  test("defines Lambda IAM policies", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"location_processor"\s*{/);
  });

  test("defines CloudWatch log groups for Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"location_processor"\s*{/);
  });

  test("defines Lambda event source mappings", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_location_processor"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_to_geofence_checker"\s*{/);
  });

  // ============================================================================
  // STEP FUNCTIONS
  // ============================================================================

  test("defines Step Functions state machine", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"route_optimization"\s*{/);
  });

  // ============================================================================
  // EVENTBRIDGE
  // ============================================================================

  test("defines EventBridge rule", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"route_optimization_schedule"\s*{/);
    expect(stackContent).toMatch(/schedule_expression\s*=/);
  });

  // ============================================================================
  // ATHENA
  // ============================================================================

  test("defines Athena workgroup", () => {
    expect(stackContent).toMatch(/resource\s+"aws_athena_workgroup"\s+"analytics"\s*{/);
  });

  // ============================================================================
  // CLOUDWATCH ALARMS
  // ============================================================================

  test("defines CloudWatch alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"kinesis_latency"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_concurrent_executions"\s*{/);
  });

  // ============================================================================
  // OUTPUTS
  // ============================================================================

  test("defines outputs", () => {
    expect(stackContent).toMatch(/output\s+"kinesis_stream_arn"\s*{/);
    expect(stackContent).toMatch(/output\s+"dynamodb_positions_table"\s*{/);
    expect(stackContent).toMatch(/output\s+"s3_buckets"\s*{/);
    expect(stackContent).toMatch(/output\s+"vpc_details"\s*{/);
  });

  // ============================================================================
  // SECURITY AND BEST PRACTICES
  // ============================================================================

  test("resources use name_prefix for naming", () => {
    // Check that key resources reference name_prefix
    expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}/);
  });

  test("resources use tags local", () => {
    // Check that resources use tags = merge(local.tags, ...)
    expect(stackContent).toMatch(/tags\s*=\s*merge\(\s*local\.tags/);
  });

  test("uses KMS encryption where required", () => {
    // DynamoDB encryption
    expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.main\.arn/);
    // S3 encryption
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main/);
  });

  test("prod environment has deletion protection", () => {
    expect(stackContent).toMatch(/deletion_protection\s*=\s*var\.env\s*==\s*["']prod["']\s*\?\s*true\s*:\s*false/);
  });

  test("prod environment has point-in-time recovery for DynamoDB", () => {
    expect(stackContent).toMatch(/point_in_time_recovery\s*{/);
    expect(stackContent).toMatch(/enabled\s*=\s*var\.env\s*==\s*["']prod["']/);
  });

  // ============================================================================
  // CODE QUALITY CHECKS
  // ============================================================================

  test("uses consistent resource naming pattern", () => {
    // All resource names should follow the pattern
    const resourceMatches = stackContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g);
    expect(resourceMatches).not.toBeNull();
    expect(resourceMatches!.length).toBeGreaterThan(0);
  });

  test("has proper variable references", () => {
    // Variables should be referenced with var. prefix
    expect(stackContent).toMatch(/var\.env/);
    expect(stackContent).toMatch(/var\.project_name/);
  });

  test("has proper data source references", () => {
    // Data sources should be referenced with data. prefix
    expect(stackContent).toMatch(/data\.aws_caller_identity\.current/);
  });

  test("uses locals for common values", () => {
    // Should use local.name_prefix and local.tags
    expect(stackContent).toMatch(/local\.name_prefix/);
    expect(stackContent).toMatch(/local\.tags/);
  });
});
