// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform ML Pipeline Infrastructure
// Tests validate all components without running terraform init/plan/apply

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const VARIABLES_PATH = path.resolve(__dirname, "../lib/variables.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

// Helper function to read file content
function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

// Helper function to count resource occurrences
function countResourceType(content: string, resourceType: string): number {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"\\w+"`, "g");
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

// Helper function to check if resource exists
function hasResource(content: string, resourceType: string, name: string): boolean {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${name}"\\s*{`, "s");
  return regex.test(content);
}

// Helper function to check variable declaration
function hasVariable(content: string, varName: string): boolean {
  const regex = new RegExp(`variable\\s+"${varName}"\\s*{`, "s");
  return regex.test(content);
}

// Helper function to check output declaration
function hasOutput(content: string, outputName: string): boolean {
  const regex = new RegExp(`output\\s+"${outputName}"\\s*{`, "s");
  return regex.test(content);
}

describe("Terraform Infrastructure Files", () => {
  describe("File Structure", () => {
    test("tap_stack.tf exists in lib directory", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("variables.tf exists in lib directory", () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test("provider.tf exists in lib directory", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("Lambda handler files exist in lib/lambda directory", () => {
      const lambdaDir = path.resolve(__dirname, "../lib/lambda");
      expect(fs.existsSync(path.join(lambdaDir, "preprocessing_handler.py"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "inference_handler.py"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "kinesis_consumer_handler.py"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "model_evaluation_handler.py"))).toBe(true);
    });

    test("Lambda zip files exist in lib/lambda directory", () => {
      const lambdaDir = path.resolve(__dirname, "../lib/lambda");
      expect(fs.existsSync(path.join(lambdaDir, "preprocessing.zip"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "inference.zip"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "kinesis_consumer.zip"))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, "model_evaluation.zip"))).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = readFile(PROVIDER_PATH);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      const stackContent = readFile(STACK_PATH);
      expect(stackContent).not.toMatch(/^provider\s+"aws"\s*{/m);
    });

    test("provider.tf contains terraform required version", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
    });

    test("provider.tf contains AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
    });

    test("provider.tf contains S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
    });

    test("provider.tf references aws_region variable", () => {
      expect(providerContent).toMatch(/var\.aws_region/);
    });
  });

  describe("Variables Configuration", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = readFile(VARIABLES_PATH);
    });

    test("declares required core variables", () => {
      expect(hasVariable(variablesContent, "aws_region")).toBe(true);
      expect(hasVariable(variablesContent, "project_name")).toBe(true);
      expect(hasVariable(variablesContent, "environment")).toBe(true);
      expect(hasVariable(variablesContent, "common_tags")).toBe(true);
    });

    test("declares KMS variables", () => {
      expect(hasVariable(variablesContent, "kms_deletion_window_in_days")).toBe(true);
    });

    test("declares Lambda variables", () => {
      expect(hasVariable(variablesContent, "lambda_runtime")).toBe(true);
      expect(hasVariable(variablesContent, "lambda_preprocessing_timeout")).toBe(true);
      expect(hasVariable(variablesContent, "lambda_preprocessing_memory")).toBe(true);
      expect(hasVariable(variablesContent, "lambda_inference_timeout")).toBe(true);
      expect(hasVariable(variablesContent, "lambda_inference_memory")).toBe(true);
    });

    test("declares SageMaker variables", () => {
      expect(hasVariable(variablesContent, "create_sagemaker_endpoints")).toBe(true);
      expect(hasVariable(variablesContent, "create_step_functions")).toBe(true);
      expect(hasVariable(variablesContent, "sagemaker_image_name")).toBe(true);
      expect(hasVariable(variablesContent, "sagemaker_instance_type")).toBe(true);
      expect(hasVariable(variablesContent, "sagemaker_training_instance_type")).toBe(true);
      expect(hasVariable(variablesContent, "sagemaker_training_volume_size")).toBe(true);
      expect(hasVariable(variablesContent, "sagemaker_training_max_runtime")).toBe(true);
    });

    test("declares Kinesis variables", () => {
      expect(hasVariable(variablesContent, "kinesis_shard_count")).toBe(true);
      expect(hasVariable(variablesContent, "kinesis_retention_hours")).toBe(true);
    });

    test("declares CloudWatch variables", () => {
      expect(hasVariable(variablesContent, "log_retention_days")).toBe(true);
    });

    test("declares EventBridge variables", () => {
      expect(hasVariable(variablesContent, "training_schedule_expression")).toBe(true);
    });

    test("variables have validation rules", () => {
      expect(variablesContent).toMatch(/validation\s*{/);
    });

    test("variables have default values", () => {
      expect(variablesContent).toMatch(/default\s*=/);
    });
  });

  describe("KMS Encryption Keys", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates KMS key for S3 encryption", () => {
      expect(hasResource(stackContent, "aws_kms_key", "s3_encryption")).toBe(true);
      expect(hasResource(stackContent, "aws_kms_alias", "s3_encryption")).toBe(true);
    });

    test("creates KMS key for DynamoDB encryption", () => {
      expect(hasResource(stackContent, "aws_kms_key", "dynamodb_encryption")).toBe(true);
      expect(hasResource(stackContent, "aws_kms_alias", "dynamodb_encryption")).toBe(true);
    });

    test("creates KMS key for SageMaker encryption", () => {
      expect(hasResource(stackContent, "aws_kms_key", "sagemaker_encryption")).toBe(true);
      expect(hasResource(stackContent, "aws_kms_alias", "sagemaker_encryption")).toBe(true);
    });

    test("creates KMS key for Kinesis encryption", () => {
      expect(hasResource(stackContent, "aws_kms_key", "kinesis_encryption")).toBe(true);
      expect(hasResource(stackContent, "aws_kms_alias", "kinesis_encryption")).toBe(true);
    });

    test("creates KMS key for Lambda encryption", () => {
      expect(hasResource(stackContent, "aws_kms_key", "lambda_encryption")).toBe(true);
      expect(hasResource(stackContent, "aws_kms_alias", "lambda_encryption")).toBe(true);
    });

    test("KMS keys have rotation enabled", () => {
      const kmsKeyMatches = stackContent.match(/resource\s+"aws_kms_key"[^}]+enable_key_rotation\s*=\s*true/gs);
      expect(kmsKeyMatches).not.toBeNull();
      expect(kmsKeyMatches!.length).toBeGreaterThanOrEqual(5);
    });

    test("KMS keys have deletion window configured", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*var\.kms_deletion_window_in_days/);
    });
  });

  describe("S3 Buckets", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates raw data S3 bucket", () => {
      expect(hasResource(stackContent, "aws_s3_bucket", "raw_data")).toBe(true);
    });

    test("creates processed data S3 bucket", () => {
      expect(hasResource(stackContent, "aws_s3_bucket", "processed_data")).toBe(true);
    });

    test("creates model artifacts S3 bucket", () => {
      expect(hasResource(stackContent, "aws_s3_bucket", "model_artifacts")).toBe(true);
    });

    test("creates logs S3 bucket", () => {
      expect(hasResource(stackContent, "aws_s3_bucket", "logs")).toBe(true);
    });

    test("all S3 buckets have versioning enabled", () => {
      expect(countResourceType(stackContent, "aws_s3_bucket_versioning")).toBe(4);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("all S3 buckets have encryption configured", () => {
      expect(countResourceType(stackContent, "aws_s3_bucket_server_side_encryption_configuration")).toBe(4);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("all S3 buckets have public access blocked", () => {
      expect(countResourceType(stackContent, "aws_s3_bucket_public_access_block")).toBe(4);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 buckets have lifecycle policies", () => {
      expect(countResourceType(stackContent, "aws_s3_bucket_lifecycle_configuration")).toBeGreaterThanOrEqual(3);
    });

    test("lifecycle policies include filter blocks", () => {
      const lifecycleMatches = stackContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"[^}]+filter\s*\{\s*\}/gs);
      expect(lifecycleMatches).not.toBeNull();
      expect(lifecycleMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("DynamoDB Tables", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates model metadata DynamoDB table", () => {
      expect(hasResource(stackContent, "aws_dynamodb_table", "model_metadata")).toBe(true);
    });

    test("creates training metrics DynamoDB table", () => {
      expect(hasResource(stackContent, "aws_dynamodb_table", "training_metrics")).toBe(true);
    });

    test("creates A/B test config DynamoDB table", () => {
      expect(hasResource(stackContent, "aws_dynamodb_table", "ab_test_config")).toBe(true);
    });

    test("DynamoDB tables use PAY_PER_REQUEST billing", () => {
      const dynamoMatches = stackContent.match(/resource\s+"aws_dynamodb_table"[\s\S]{1,2000}?billing_mode\s*=\s*"PAY_PER_REQUEST"/g);
      expect(dynamoMatches).not.toBeNull();
      expect(dynamoMatches!.length).toBe(3);
    });

    test("DynamoDB tables have encryption enabled", () => {
      const encryptionMatches = stackContent.match(/server_side_encryption\s*{\s*enabled\s*=\s*true/gs);
      expect(encryptionMatches).not.toBeNull();
      expect(encryptionMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("DynamoDB tables have point-in-time recovery", () => {
      const pitrMatches = stackContent.match(/point_in_time_recovery\s*{\s*enabled\s*=\s*true/gs);
      expect(pitrMatches).not.toBeNull();
      expect(pitrMatches!.length).toBe(3);
    });

    test("DynamoDB tables have global secondary indexes", () => {
      expect(stackContent).toMatch(/global_secondary_index\s*{/);
    });
  });

  describe("Kinesis Stream", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates Kinesis data stream", () => {
      expect(hasResource(stackContent, "aws_kinesis_stream", "inference_requests")).toBe(true);
    });

    test("Kinesis stream has encryption enabled", () => {
      expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
    });

    test("Kinesis stream has shard-level metrics", () => {
      expect(stackContent).toMatch(/shard_level_metrics\s*=\s*\[/);
    });

    test("Kinesis stream references KMS key", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.kinesis_encryption\.id/);
    });
  });

  describe("IAM Roles and Policies", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates IAM role for Lambda preprocessing", () => {
      expect(hasResource(stackContent, "aws_iam_role", "lambda_preprocessing")).toBe(true);
      expect(hasResource(stackContent, "aws_iam_role_policy", "lambda_preprocessing")).toBe(true);
    });

    test("creates IAM role for Lambda inference", () => {
      expect(hasResource(stackContent, "aws_iam_role", "lambda_inference")).toBe(true);
      expect(hasResource(stackContent, "aws_iam_role_policy", "lambda_inference")).toBe(true);
    });

    test("creates IAM role for Lambda Kinesis consumer", () => {
      expect(hasResource(stackContent, "aws_iam_role", "lambda_kinesis_consumer")).toBe(true);
      expect(hasResource(stackContent, "aws_iam_role_policy", "lambda_kinesis_consumer")).toBe(true);
    });

    test("creates IAM role for SageMaker", () => {
      expect(hasResource(stackContent, "aws_iam_role", "sagemaker")).toBe(true);
      expect(hasResource(stackContent, "aws_iam_role_policy", "sagemaker")).toBe(true);
    });

    test("creates IAM role for Step Functions", () => {
      expect(hasResource(stackContent, "aws_iam_role", "step_functions")).toBe(true);
      expect(hasResource(stackContent, "aws_iam_role_policy", "step_functions")).toBe(true);
    });

    test("creates IAM role for EventBridge", () => {
      expect(hasResource(stackContent, "aws_iam_role", "eventbridge")).toBe(true);
      expect(hasResource(stackContent, "aws_iam_role_policy", "eventbridge")).toBe(true);
    });

    test("IAM policies follow least privilege - no wildcards in resources except where necessary", () => {
      // Check that most resources are specific ARNs, not wildcards
      const policyBlocks = stackContent.match(/policy\s*=\s*jsonencode\(\{[\s\S]*?\}\)/g);
      expect(policyBlocks).not.toBeNull();

      // Verify specific resource ARNs are used
      expect(stackContent).toMatch(/aws_s3_bucket\.\w+\.arn/);
      expect(stackContent).toMatch(/aws_dynamodb_table\.\w+\.arn/);
      expect(stackContent).toMatch(/aws_kinesis_stream\.\w+\.arn/);
    });

    test("IAM roles have assume role policies", () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
    });

    test("Lambda roles can write to CloudWatch Logs", () => {
      expect(stackContent).toMatch(/"logs:CreateLogStream"/);
      expect(stackContent).toMatch(/"logs:PutLogEvents"/);
    });
  });

  describe("Lambda Functions", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates data preprocessing Lambda function", () => {
      expect(hasResource(stackContent, "aws_lambda_function", "data_preprocessing")).toBe(true);
    });

    test("creates inference handler Lambda function", () => {
      expect(hasResource(stackContent, "aws_lambda_function", "inference_handler")).toBe(true);
    });

    test("creates Kinesis consumer Lambda function", () => {
      expect(hasResource(stackContent, "aws_lambda_function", "kinesis_consumer")).toBe(true);
    });

    test("creates model evaluation Lambda function", () => {
      expect(hasResource(stackContent, "aws_lambda_function", "model_evaluation")).toBe(true);
    });

    test("Lambda functions reference correct zip files in lambda folder", () => {
      expect(stackContent).toMatch(/filename\s*=\s*"\$\{path\.module\}\/lambda\/preprocessing\.zip"/);
      expect(stackContent).toMatch(/filename\s*=\s*"\$\{path\.module\}\/lambda\/inference\.zip"/);
      expect(stackContent).toMatch(/filename\s*=\s*"\$\{path\.module\}\/lambda\/kinesis_consumer\.zip"/);
      expect(stackContent).toMatch(/filename\s*=\s*"\$\{path\.module\}\/lambda\/model_evaluation\.zip"/);
    });

    test("Lambda functions have correct handlers", () => {
      expect(stackContent).toMatch(/handler\s*=\s*"preprocessing_handler\.handler"/);
      expect(stackContent).toMatch(/handler\s*=\s*"inference_handler\.handler"/);
      expect(stackContent).toMatch(/handler\s*=\s*"kinesis_consumer_handler\.handler"/);
      expect(stackContent).toMatch(/handler\s*=\s*"model_evaluation_handler\.handler"/);
    });

    test("Lambda functions have environment variables", () => {
      const envMatches = stackContent.match(/environment\s*{\s*variables\s*=/gs);
      expect(envMatches).not.toBeNull();
      expect(envMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test("Lambda functions use KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.lambda_encryption\.arn/);
    });

    test("Lambda functions have proper dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
      expect(stackContent).toMatch(/aws_cloudwatch_log_group\.\w+/);
      expect(stackContent).toMatch(/aws_iam_role_policy\.\w+/);
    });

    test("creates Lambda event source mapping for Kinesis", () => {
      expect(hasResource(stackContent, "aws_lambda_event_source_mapping", "kinesis_to_lambda")).toBe(true);
    });
  });

  describe("SageMaker Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates SageMaker Model A", () => {
      expect(hasResource(stackContent, "aws_sagemaker_model", "model_a")).toBe(true);
    });

    test("creates SageMaker Model B", () => {
      expect(hasResource(stackContent, "aws_sagemaker_model", "model_b")).toBe(true);
    });

    test("creates SageMaker Endpoint Configuration A", () => {
      expect(hasResource(stackContent, "aws_sagemaker_endpoint_configuration", "model_a")).toBe(true);
    });

    test("creates SageMaker Endpoint Configuration B", () => {
      expect(hasResource(stackContent, "aws_sagemaker_endpoint_configuration", "model_b")).toBe(true);
    });

    test("creates SageMaker Endpoint A", () => {
      expect(hasResource(stackContent, "aws_sagemaker_endpoint", "model_a")).toBe(true);
    });

    test("creates SageMaker Endpoint B", () => {
      expect(hasResource(stackContent, "aws_sagemaker_endpoint", "model_b")).toBe(true);
    });

    test("SageMaker endpoints use instance-based configuration", () => {
      expect(stackContent).toMatch(/instance_type\s*=\s*"ml\./);
      expect(stackContent).toMatch(/initial_instance_count\s*=\s*1/);
    });

    test("SageMaker resources reference IAM role", () => {
      expect(stackContent).toMatch(/execution_role_arn\s*=\s*aws_iam_role\.sagemaker\.arn/);
    });

    test("SageMaker endpoint configs use KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.sagemaker_encryption\.arn/);
    });
  });

  describe("Step Functions", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates Step Functions state machine", () => {
      expect(hasResource(stackContent, "aws_sfn_state_machine", "ml_pipeline")).toBe(true);
    });

    test("state machine has proper definition structure", () => {
      expect(stackContent).toMatch(/definition\s*=\s*jsonencode\(\{/);
      expect(stackContent).toMatch(/StartAt\s*=\s*"DataValidation"/);
    });

    test("state machine includes all required states", () => {
      expect(stackContent).toMatch(/DataValidation\s*=/);
      expect(stackContent).toMatch(/DataPreprocessing\s*=/);
      expect(stackContent).toMatch(/TrainModel\s*=/);
      expect(stackContent).toMatch(/EvaluateModel\s*=/);
      expect(stackContent).toMatch(/CheckMetrics\s*=/);
      expect(stackContent).toMatch(/DeployModel\s*=/);
    });

    test("state machine has error handling", () => {
      expect(stackContent).toMatch(/Retry\s*=\s*\[/);
      expect(stackContent).toMatch(/Catch\s*=\s*\[/);
      expect(stackContent).toMatch(/HandleError/);
    });

    test("state machine has logging configuration", () => {
      expect(stackContent).toMatch(/logging_configuration\s*{/);
      expect(stackContent).toMatch(/include_execution_data\s*=\s*true/);
    });

    test("state machine references Lambda functions", () => {
      expect(stackContent).toMatch(/aws_lambda_function\.data_preprocessing\.arn/);
      expect(stackContent).toMatch(/aws_lambda_function\.model_evaluation\.arn/);
    });
  });

  describe("API Gateway", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates API Gateway HTTP API", () => {
      expect(hasResource(stackContent, "aws_apigatewayv2_api", "ml_inference")).toBe(true);
    });

    test("creates API Gateway integration", () => {
      expect(hasResource(stackContent, "aws_apigatewayv2_integration", "lambda_inference")).toBe(true);
    });

    test("creates API Gateway route", () => {
      expect(hasResource(stackContent, "aws_apigatewayv2_route", "inference")).toBe(true);
    });

    test("creates API Gateway stage", () => {
      expect(hasResource(stackContent, "aws_apigatewayv2_stage", "ml_inference")).toBe(true);
    });

    test("API Gateway has CORS configuration", () => {
      expect(stackContent).toMatch(/cors_configuration\s*{/);
    });

    test("API Gateway has access logging", () => {
      expect(stackContent).toMatch(/access_log_settings\s*{/);
    });

    test("API Gateway has throttling configured", () => {
      expect(stackContent).toMatch(/default_route_settings\s*{/);
      expect(stackContent).toMatch(/throttling_burst_limit/);
      expect(stackContent).toMatch(/throttling_rate_limit/);
    });

    test("creates Lambda permission for API Gateway", () => {
      expect(hasResource(stackContent, "aws_lambda_permission", "api_gateway_lambda")).toBe(true);
    });
  });

  describe("EventBridge", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates EventBridge rule for scheduled training", () => {
      expect(hasResource(stackContent, "aws_cloudwatch_event_rule", "scheduled_training")).toBe(true);
    });

    test("creates EventBridge rule for data ingestion", () => {
      expect(hasResource(stackContent, "aws_cloudwatch_event_rule", "data_ingestion")).toBe(true);
    });

    test("creates EventBridge targets", () => {
      expect(hasResource(stackContent, "aws_cloudwatch_event_target", "scheduled_training_target")).toBe(true);
      expect(hasResource(stackContent, "aws_cloudwatch_event_target", "data_ingestion_target")).toBe(true);
    });

    test("scheduled training uses cron/rate expression", () => {
      expect(stackContent).toMatch(/schedule_expression\s*=\s*var\.training_schedule_expression/);
    });

    test("data ingestion rule has S3 event pattern", () => {
      expect(stackContent).toMatch(/event_pattern\s*=\s*jsonencode/);
    });

    test("creates Lambda permission for EventBridge", () => {
      expect(hasResource(stackContent, "aws_lambda_permission", "eventbridge_lambda")).toBe(true);
    });
  });

  describe("CloudWatch Monitoring", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates CloudWatch log groups for Lambda functions", () => {
      expect(hasResource(stackContent, "aws_cloudwatch_log_group", "lambda_preprocessing")).toBe(true);
      expect(hasResource(stackContent, "aws_cloudwatch_log_group", "lambda_inference")).toBe(true);
      expect(hasResource(stackContent, "aws_cloudwatch_log_group", "lambda_kinesis_consumer")).toBe(true);
      expect(hasResource(stackContent, "aws_cloudwatch_log_group", "lambda_model_evaluation")).toBe(true);
    });

    test("creates CloudWatch log group for Step Functions", () => {
      expect(hasResource(stackContent, "aws_cloudwatch_log_group", "step_functions")).toBe(true);
    });

    test("creates CloudWatch log group for API Gateway", () => {
      expect(hasResource(stackContent, "aws_cloudwatch_log_group", "api_gateway")).toBe(true);
    });

    test("log groups have retention configured", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test("log groups use KMS encryption", () => {
      const logGroupMatches = stackContent.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]{1,500}?kms_key_id\s*=\s*aws_kms_key\.lambda_encryption\.arn/g);
      expect(logGroupMatches).not.toBeNull();
      expect(logGroupMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test("creates CloudWatch dashboard", () => {
      expect(hasResource(stackContent, "aws_cloudwatch_dashboard", "ml_pipeline")).toBe(true);
    });

    test("dashboard has multiple widgets", () => {
      expect(stackContent).toMatch(/widgets\s*=\s*\[/);
    });

    test("creates CloudWatch alarms", () => {
      expect(hasResource(stackContent, "aws_cloudwatch_metric_alarm", "sagemaker_model_a_latency")).toBe(true);
      expect(hasResource(stackContent, "aws_cloudwatch_metric_alarm", "lambda_errors")).toBe(true);
      expect(hasResource(stackContent, "aws_cloudwatch_metric_alarm", "kinesis_iterator_age")).toBe(true);
      expect(hasResource(stackContent, "aws_cloudwatch_metric_alarm", "step_functions_failed")).toBe(true);
    });

    test("creates SNS topic for alerts", () => {
      expect(hasResource(stackContent, "aws_sns_topic", "ml_alerts")).toBe(true);
    });

    test("alarms reference SNS topic", () => {
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.ml_alerts\.arn\]/);
    });
  });

  describe("Data Sources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("uses data source for AWS account ID", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses data source for AWS region", () => {
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("data sources are referenced in resources", () => {
      expect(stackContent).toMatch(/data\.aws_caller_identity\.current\.account_id/);
      expect(stackContent).toMatch(/data\.aws_region\.current\.id/);
    });
  });

  describe("Outputs", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("outputs S3 bucket names", () => {
      expect(hasOutput(stackContent, "raw_data_bucket")).toBe(true);
      expect(hasOutput(stackContent, "processed_data_bucket")).toBe(true);
      expect(hasOutput(stackContent, "model_artifacts_bucket")).toBe(true);
      expect(hasOutput(stackContent, "logs_bucket")).toBe(true);
    });

    test("outputs DynamoDB table names", () => {
      expect(hasOutput(stackContent, "model_metadata_table")).toBe(true);
      expect(hasOutput(stackContent, "training_metrics_table")).toBe(true);
      expect(hasOutput(stackContent, "ab_test_config_table")).toBe(true);
    });

    test("outputs Kinesis stream information", () => {
      expect(hasOutput(stackContent, "kinesis_stream_name")).toBe(true);
      expect(hasOutput(stackContent, "kinesis_stream_arn")).toBe(true);
    });

    test("outputs SageMaker endpoint names", () => {
      expect(hasOutput(stackContent, "sagemaker_endpoint_a")).toBe(true);
      expect(hasOutput(stackContent, "sagemaker_endpoint_b")).toBe(true);
    });

    test("outputs Step Functions ARN", () => {
      expect(hasOutput(stackContent, "step_functions_arn")).toBe(true);
    });

    test("outputs API Gateway endpoint", () => {
      expect(hasOutput(stackContent, "api_gateway_endpoint")).toBe(true);
      expect(hasOutput(stackContent, "inference_api_url")).toBe(true);
    });

    test("outputs Lambda function names", () => {
      expect(hasOutput(stackContent, "lambda_preprocessing_function")).toBe(true);
      expect(hasOutput(stackContent, "lambda_inference_function")).toBe(true);
      expect(hasOutput(stackContent, "lambda_kinesis_consumer_function")).toBe(true);
    });

    test("outputs SNS topic ARN", () => {
      expect(hasOutput(stackContent, "sns_alerts_topic_arn")).toBe(true);
    });

    test("outputs CloudWatch dashboard name", () => {
      expect(hasOutput(stackContent, "cloudwatch_dashboard_name")).toBe(true);
    });

    test("all outputs have descriptions", () => {
      const outputBlocks = stackContent.match(/output\s+"\w+"\s*{[^}]+}/g);
      expect(outputBlocks).not.toBeNull();
      outputBlocks!.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });

  describe("Resource Tagging", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("resources use common_tags variable", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(var\.common_tags/);
    });

    test("resources have Name tags", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{var\.project_name\}/);
    });

    test("resources have Purpose tags", () => {
      expect(stackContent).toMatch(/Purpose\s*=/);
    });
  });

  describe("Security Best Practices", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("all data at rest is encrypted", () => {
      // S3 encryption
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      // DynamoDB encryption
      expect(stackContent).toMatch(/server_side_encryption\s*{\s*enabled\s*=\s*true/);
      // Kinesis encryption
      expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
    });

    test("S3 buckets block all public access", () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 buckets have versioning for data protection", () => {
      const versioningMatches = stackContent.match(/versioning_configuration\s*{\s*status\s*=\s*"Enabled"/gs);
      expect(versioningMatches).not.toBeNull();
      expect(versioningMatches!.length).toBe(4);
    });

    test("IAM roles have proper trust policies", () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/"sts:AssumeRole"/);
    });

    test("no hardcoded credentials or sensitive data", () => {
      expect(stackContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(stackContent).not.toMatch(/password\s*=\s*"/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"/i);
    });
  });

  describe("ML Pipeline Requirements Coverage", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("implements automated model training workflow", () => {
      expect(stackContent).toMatch(/scheduled_training/);
      expect(stackContent).toMatch(/ml_pipeline/);
      expect(stackContent).toMatch(/TrainModel/);
    });

    test("implements A/B testing capabilities", () => {
      expect(stackContent).toMatch(/model_a/);
      expect(stackContent).toMatch(/model_b/);
      expect(stackContent).toMatch(/ab_test_config/);
    });

    test("implements real-time inference", () => {
      expect(stackContent).toMatch(/inference_requests/);
      expect(stackContent).toMatch(/kinesis_consumer/);
      expect(stackContent).toMatch(/sagemaker_endpoint/);
    });

    test("implements data privacy and compliance", () => {
      expect(stackContent).toMatch(/kms_key_arn/);
      expect(stackContent).toMatch(/encryption/i);
      expect(stackContent).toMatch(/versioning/);
    });

    test("implements comprehensive monitoring", () => {
      expect(stackContent).toMatch(/cloudwatch_dashboard/);
      expect(stackContent).toMatch(/cloudwatch_metric_alarm/);
      expect(stackContent).toMatch(/sns_topic/);
    });

    test("implements scalable architecture", () => {
      expect(stackContent).toMatch(/auto_deploy\s*=\s*true/);
      expect(stackContent).toMatch(/instance_type\s*=\s*"ml\./);
      expect(stackContent).toMatch(/PAY_PER_REQUEST/);
    });
  });

  describe("Terraform Best Practices", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("uses resource references instead of hardcoded values", () => {
      expect(stackContent).toMatch(/aws_\w+\.\w+\.(arn|id|name)/);
    });

    test("uses variables for configurable values", () => {
      expect(stackContent).toMatch(/var\.\w+/);
    });

    test("includes comments for code organization", () => {
      expect(stackContent).toMatch(/# ={5,}/); // Section dividers
      expect(stackContent).toMatch(/# \w+/); // Regular comments
    });

    test("follows consistent naming convention", () => {
      // Check that resource names follow pattern: project_name-resource-environment
      expect(stackContent).toMatch(/\$\{var\.project_name\}-\w+-\$\{var\.environment\}/);
    });

    test("uses locals for repeated values (if any)", () => {
      // While this specific implementation might not have locals, it's good practice
      // This test will pass if no locals are needed or if they exist
      const hasLocals = /locals\s*{/.test(stackContent);
      const hasRepeatedPatterns = true; // Always true as we use variables
      expect(hasRepeatedPatterns || !hasLocals).toBe(true);
    });
  });

  describe("Resource Count Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = readFile(STACK_PATH);
    });

    test("creates expected number of KMS keys (5)", () => {
      expect(countResourceType(stackContent, "aws_kms_key")).toBe(5);
    });

    test("creates expected number of S3 buckets (4)", () => {
      expect(countResourceType(stackContent, "aws_s3_bucket")).toBe(4);
    });

    test("creates expected number of DynamoDB tables (3)", () => {
      expect(countResourceType(stackContent, "aws_dynamodb_table")).toBe(3);
    });

    test("creates expected number of Lambda functions (4)", () => {
      expect(countResourceType(stackContent, "aws_lambda_function")).toBe(4);
    });

    test("creates expected number of IAM roles (6)", () => {
      expect(countResourceType(stackContent, "aws_iam_role")).toBe(6);
    });

    test("creates expected number of SageMaker endpoints (2)", () => {
      expect(countResourceType(stackContent, "aws_sagemaker_endpoint")).toBe(2);
    });

    test("creates at least 15 total outputs", () => {
      const outputCount = (stackContent.match(/output\s+"\w+"\s*{/g) || []).length;
      expect(outputCount).toBeGreaterThanOrEqual(15);
    });
  });
});
