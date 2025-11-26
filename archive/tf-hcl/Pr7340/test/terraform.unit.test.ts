// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap-stack.tf
// Checks presence and basic structure of all required resources

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap-stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap-stack.tf", () => {
  let content: string;

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`Stack file not found at: ${stackPath}`);
    }
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap-stack.tf exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("does NOT declare provider in tap-stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  // KMS Keys
  test("declares KMS keys for encryption", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"lambda_key"/);
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"dynamodb_key"/);
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3_key"/);
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"sqs_key"/);
  });

  // VPC and Networking
  test("declares VPC and subnets", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"fraud_detection_vpc"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_subnet_a"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_subnet_b"/);
  });

  test("declares VPC endpoints", () => {
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sqs"/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"cloudwatch"/);
  });

  test("declares security groups", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"lambda_sg"/);
  });

  // DynamoDB
  test("declares DynamoDB table", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"transactions"/);
    expect(content).toMatch(/hash_key\s*=\s*"transaction_id"/);
    expect(content).toMatch(/range_key\s*=\s*"timestamp"/);
  });

  // S3
  test("declares S3 bucket and configurations", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"transaction_archive"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"transaction_archive"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"transaction_archive"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"transaction_archive"/);
  });

  // SQS
  test("declares SQS queues", () => {
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"notification_dlq"/);
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"notification_queue"/);
  });

  // CloudWatch Log Groups
  test("declares CloudWatch log groups", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"validation_lambda_logs"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"fraud_scoring_lambda_logs"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"notification_lambda_logs"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"authorizer_lambda_logs"/);
  });

  // IAM
  test("declares IAM role and policy", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_inline_policy"/);
  });

  // Lambda Functions
  test("declares Lambda functions", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"token_authorizer"/);
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"transaction_validation"/);
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"fraud_scoring"/);
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"notification_processing"/);
  });

  // API Gateway
  test("declares API Gateway resources", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"fraud_detection_api"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_authorizer"\s+"token_authorizer"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"transactions"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"transaction_id"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"post_transaction"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"get_transaction"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"post_transaction"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"get_transaction"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"api_deployment"/);
  });

  // EventBridge
  test("declares EventBridge rule and target", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"high_risk_transaction"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"notification_lambda"/);
  });

  // SQS Trigger
  test("declares Lambda event source mapping for SQS", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"sqs_trigger"/);
  });

  // CloudWatch Alarms
  test("declares CloudWatch alarms", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"validation_lambda_errors"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"fraud_scoring_lambda_errors"/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"notification_lambda_errors"/);
  });

  // SNS
  test("declares SNS topic for alarms", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alarm_notification"/);
  });

  // CloudWatch Dashboard
  test("declares CloudWatch dashboard", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"fraud_detection"/);
  });

  // Lambda Permissions
  test("declares Lambda permissions", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_validation"/);
    expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_authorizer"/);
    expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
  });

  // Outputs
  test("declares required outputs", () => {
    expect(content).toMatch(/output\s+"api_gateway_url"/);
    expect(content).toMatch(/output\s+"cloudwatch_dashboard_url"/);
  });

  // Variables (though defined in variables.tf, check if used)
  test("uses required variables", () => {
    expect(content).toMatch(/var\.aws_region/);
    expect(content).toMatch(/var\.environment_suffix/);
  });

  // Security checks
  test("includes encryption configurations", () => {
    expect(content).toMatch(/server_side_encryption/);
    expect(content).toMatch(/kms_master_key_id/);
  });

  test("includes VPC configurations for Lambda", () => {
    expect(content).toMatch(/vpc_config\s*{/);
  });

  test("includes reserved concurrency", () => {
    expect(content).toMatch(/reserved_concurrent_executions/);
  });

  test("includes proper IAM deny policies", () => {
    expect(content).toMatch(/Effect\s*=\s*"Deny"/);
  });
});
