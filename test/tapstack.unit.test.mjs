/**
 * Unit tests for Terraform webhook processing infrastructure
 * Tests validate resource configurations without deployment
 */

const fs = require('fs');
const path = require('path');

const libPath = path.join(__dirname, '..', 'lib');

describe('Terraform Configuration - Main', () => {
  test('should have terraform block with required version', () => {
    const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    expect(content).toContain('terraform {');
    expect(content).toContain('required_version');
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
  });

  test('should require AWS provider version ~> 5.0', () => {
    const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    expect(content).toContain('source  = "hashicorp/aws"');
    expect(content).toContain('version = "~> 5.0"');
  });

  test('should require archive provider for Lambda packaging', () => {
    const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    expect(content).toContain('source  = "hashicorp/archive"');
    expect(content).toContain('version = "~> 2.4"');
  });

  test('should configure AWS provider with region variable', () => {
    const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    expect(content).toContain('provider "aws"');
    expect(content).toContain('region = var.aws_region');
  });

  test('should include default tags with environment suffix', () => {
    const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    expect(content).toContain('default_tags');
    expect(content).toContain('Environment = var.environment_suffix');
  });

  test('should have data sources for caller identity and partition', () => {
    const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    expect(content).toContain('data "aws_caller_identity" "current"');
    expect(content).toContain('data "aws_partition" "current"');
  });
});

describe('Terraform Configuration - Variables', () => {
  test('should define required environment_suffix variable', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toContain('variable "environment_suffix"');
    expect(content).toMatch(/type\s*=\s*string/);
  });

  test('should define aws_region variable with us-east-1 default', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toContain('variable "aws_region"');
    expect(content).toContain('default     = "us-east-1"');
  });

  test('should define Lambda configuration variables', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toContain('variable "lambda_runtime"');
    expect(content).toContain('variable "lambda_architecture"');
    expect(content).toContain('variable "lambda_reserved_concurrency"');
  });

  test('should default Lambda architecture to arm64', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toMatch(/variable\s+"lambda_architecture"[\s\S]*?default\s*=\s*"arm64"/);
  });

  test('should define API Gateway throttling variables', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toContain('variable "api_throttle_rate_limit"');
    expect(content).toContain('variable "api_throttle_burst_limit"');
  });

  test('should define CloudWatch and alarm configuration variables', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toContain('variable "cloudwatch_log_retention_days"');
    expect(content).toContain('variable "alarm_error_rate_threshold"');
    expect(content).toContain('variable "alarm_evaluation_periods"');
  });
});

describe('KMS Keys', () => {
  test('should create KMS key for Lambda environment variables', () => {
    const content = fs.readFileSync(path.join(libPath, 'kms.tf'), 'utf8');
    expect(content).toContain('resource "aws_kms_key" "lambda_env"');
    expect(content).toContain('enable_key_rotation     = true');
  });

  test('should create KMS alias for Lambda environment key', () => {
    const content = fs.readFileSync(path.join(libPath, 'kms.tf'), 'utf8');
    expect(content).toContain('resource "aws_kms_alias" "lambda_env"');
    expect(content).toMatch(/name\s*=\s*"alias\/lambda-env-\$\{var\.environment_suffix\}"/);
  });

  test('should create KMS key for CloudWatch Logs', () => {
    const content = fs.readFileSync(path.join(libPath, 'kms.tf'), 'utf8');
    expect(content).toContain('resource "aws_kms_key" "cloudwatch_logs"');
    expect(content).toContain('enable_key_rotation     = true');
  });

  test('KMS key for CloudWatch should have proper policy for logs service', () => {
    const content = fs.readFileSync(path.join(libPath, 'kms.tf'), 'utf8');
    expect(content).toContain('Service = "logs.${var.aws_region}.amazonaws.com"');
    expect(content).toContain('kms:Encrypt');
    expect(content).toContain('kms:Decrypt');
    expect(content).toContain('kms:GenerateDataKey');
  });

  test('should include environment suffix in all KMS resource names', () => {
    const content = fs.readFileSync(path.join(libPath, 'kms.tf'), 'utf8');
    expect(content).toMatch(/lambda-env-key-\$\{var\.environment_suffix\}/);
    expect(content).toMatch(/cloudwatch-logs-key-\$\{var\.environment_suffix\}/);
  });
});

describe('DynamoDB Table', () => {
  test('should create DynamoDB table with environment suffix', () => {
    const content = fs.readFileSync(path.join(libPath, 'dynamodb.tf'), 'utf8');
    expect(content).toContain('resource "aws_dynamodb_table" "webhooks"');
    expect(content).toMatch(/name\s*=\s*"webhooks-\$\{var\.environment_suffix\}"/);
  });

  test('should use PAY_PER_REQUEST billing mode', () => {
    const content = fs.readFileSync(path.join(libPath, 'dynamodb.tf'), 'utf8');
    expect(content).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
  });

  test('should have transaction_id as partition key', () => {
    const content = fs.readFileSync(path.join(libPath, 'dynamodb.tf'), 'utf8');
    expect(content).toMatch(/hash_key\s*=\s*"transaction_id"/);
    expect(content).toMatch(/attribute\s*\{[\s\S]*?name\s*=\s*"transaction_id"[\s\S]*?type\s*=\s*"S"/);
  });

  test('should have timestamp as sort key', () => {
    const content = fs.readFileSync(path.join(libPath, 'dynamodb.tf'), 'utf8');
    expect(content).toMatch(/range_key\s*=\s*"timestamp"/);
    expect(content).toMatch(/attribute\s*\{[\s\S]*?name\s*=\s*"timestamp"[\s\S]*?type\s*=\s*"N"/);
  });

  test('should enable point-in-time recovery', () => {
    const content = fs.readFileSync(path.join(libPath, 'dynamodb.tf'), 'utf8');
    expect(content).toMatch(/point_in_time_recovery\s*\{[\s\S]*?enabled\s*=\s*true/);
  });

  test('should enable server-side encryption', () => {
    const content = fs.readFileSync(path.join(libPath, 'dynamodb.tf'), 'utf8');
    expect(content).toMatch(/server_side_encryption\s*\{[\s\S]*?enabled\s*=\s*true/);
  });
});

describe('SQS Dead Letter Queue', () => {
  test('should create SQS queue with environment suffix', () => {
    const content = fs.readFileSync(path.join(libPath, 'sqs.tf'), 'utf8');
    expect(content).toContain('resource "aws_sqs_queue" "lambda_dlq"');
    expect(content).toMatch(/name\s*=\s*"webhook-processor-dlq-\$\{var\.environment_suffix\}"/);
  });

  test('should set message retention to 14 days', () => {
    const content = fs.readFileSync(path.join(libPath, 'sqs.tf'), 'utf8');
    expect(content).toContain('message_retention_seconds  = 1209600');
  });

  test('should have queue policy allowing Lambda to send messages', () => {
    const content = fs.readFileSync(path.join(libPath, 'sqs.tf'), 'utf8');
    expect(content).toContain('resource "aws_sqs_queue_policy" "lambda_dlq"');
    expect(content).toContain('Service = "lambda.amazonaws.com"');
    expect(content).toContain('sqs:SendMessage');
  });
});

describe('IAM Roles and Policies', () => {
  test('should create Lambda execution role', () => {
    const content = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
    expect(content).toContain('resource "aws_iam_role" "lambda_execution"');
    expect(content).toMatch(/name\s*=\s*"webhook-processor-lambda-role-\$\{var\.environment_suffix\}"/);
  });

  test('Lambda role should allow Lambda service to assume it', () => {
    const content = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
    expect(content).toMatch(
      /aws_iam_role.*lambda_execution[\s\S]*?Service\s*=\s*"lambda\.amazonaws\.com"/
    );
  });

  test('should attach Lambda basic execution policy', () => {
    const content = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
    expect(content).toContain('resource "aws_iam_role_policy_attachment" "lambda_basic_execution"');
    expect(content).toContain('AWSLambdaBasicExecutionRole');
  });

  test('should create custom policy for DynamoDB, SQS, and KMS', () => {
    const content = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
    expect(content).toContain('resource "aws_iam_role_policy" "lambda_custom"');
    expect(content).toContain('dynamodb:PutItem');
    expect(content).toContain('sqs:SendMessage');
    expect(content).toContain('kms:Decrypt');
  });

  test('should create Step Functions execution role', () => {
    const content = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
    expect(content).toContain('resource "aws_iam_role" "step_functions"');
    expect(content).toContain('Service = "states.amazonaws.com"');
  });

  test('Step Functions role should allow invoking Lambda', () => {
    const content = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
    expect(content).toContain('resource "aws_iam_role_policy" "step_functions_lambda"');
    expect(content).toContain('lambda:InvokeFunction');
  });

  test('should create API Gateway CloudWatch logging role', () => {
    const content = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf8');
    expect(content).toContain('resource "aws_iam_role" "api_gateway_cloudwatch"');
    expect(content).toContain('Service = "apigateway.amazonaws.com"');
  });
});

describe('Lambda Function', () => {
  test('should create CloudWatch log group with KMS encryption', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toContain('resource "aws_cloudwatch_log_group" "lambda"');
    expect(content).toMatch(/name\s*=\s*"\/aws\/lambda\/webhook-processor-\$\{var\.environment_suffix\}"/);
    expect(content).toContain('kms_key_id        = aws_kms_key.cloudwatch_logs.arn');
  });

  test('should create Lambda deployment package from source', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toContain('data "archive_file" "lambda"');
    expect(content).toContain('type        = "zip"');
    expect(content).toContain('webhook_processor.py');
  });

  test('should create Lambda function with environment suffix', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toContain('resource "aws_lambda_function" "webhook_processor"');
    expect(content).toMatch(/function_name\s*=\s*"webhook-processor-\$\{var\.environment_suffix\}"/);
  });

  test('Lambda should use ARM64 architecture', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toContain('architectures    = [var.lambda_architecture]');
  });

  test('Lambda should have reserved concurrent executions', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toContain('reserved_concurrent_executions = var.lambda_reserved_concurrency');
  });

  test('Lambda should configure dead letter queue', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toMatch(/dead_letter_config\s*\{[\s\S]*?target_arn\s*=\s*aws_sqs_queue\.lambda_dlq\.arn/);
  });

  test('Lambda environment variables should be encrypted with KMS', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toContain('kms_key_arn = aws_kms_key.lambda_env.arn');
  });

  test('Lambda should have environment variables for DynamoDB table', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toMatch(/environment\s*\{[\s\S]*?DYNAMODB_TABLE_NAME\s*=\s*aws_dynamodb_table\.webhooks\.name/);
  });

  test('should create Lambda permission for API Gateway', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toContain('resource "aws_lambda_permission" "api_gateway"');
    expect(content).toContain('principal     = "apigateway.amazonaws.com"');
  });

  test('Lambda source code should exist', () => {
    const lambdaPath = path.join(libPath, 'lambda', 'webhook_processor.py');
    expect(fs.existsSync(lambdaPath)).toBe(true);
  });
});

describe('Lambda Source Code', () => {
  let lambdaCode;

  beforeAll(() => {
    lambdaCode = fs.readFileSync(
      path.join(libPath, 'lambda', 'webhook_processor.py'),
      'utf8'
    );
  });

  test('should define lambda_handler function', () => {
    expect(lambdaCode).toContain('def lambda_handler(event, context):');
  });

  test('should import required libraries', () => {
    expect(lambdaCode).toContain('import json');
    expect(lambdaCode).toContain('import os');
    expect(lambdaCode).toContain('import boto3');
  });

  test('should read DynamoDB table name from environment', () => {
    expect(lambdaCode).toContain("os.environ['DYNAMODB_TABLE_NAME']");
  });

  test('should extract provider from path parameters', () => {
    expect(lambdaCode).toContain("event.get('pathParameters', {}).get('provider'");
  });

  test('should have transform_webhook function', () => {
    expect(lambdaCode).toContain('def transform_webhook(provider, data):');
  });

  test('should support multiple payment providers', () => {
    expect(lambdaCode).toContain('stripe');
    expect(lambdaCode).toContain('paypal');
    expect(lambdaCode).toContain('square');
  });

  test('should have transformer functions for each provider', () => {
    expect(lambdaCode).toContain('def transform_stripe(data):');
    expect(lambdaCode).toContain('def transform_paypal(data):');
    expect(lambdaCode).toContain('def transform_square(data):');
    expect(lambdaCode).toContain('def transform_generic(data):');
  });

  test('should store data in DynamoDB', () => {
    expect(lambdaCode).toContain('table.put_item(Item=item)');
  });

  test('should return proper response format', () => {
    expect(lambdaCode).toContain('statusCode');
    expect(lambdaCode).toContain('body');
  });

  test('should handle errors', () => {
    expect(lambdaCode).toContain('try:');
    expect(lambdaCode).toContain('except');
  });
});

describe('API Gateway', () => {
  test('should create REST API with environment suffix', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_rest_api" "webhook_api"');
    expect(content).toMatch(/name\s*=\s*"webhook-api-\$\{var\.environment_suffix\}"/);
  });

  test('should use REGIONAL endpoint configuration', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toMatch(/endpoint_configuration\s*\{[\s\S]*?types\s*=\s*\["REGIONAL"\]/);
  });

  test('should create CloudWatch log group for API Gateway', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_cloudwatch_log_group" "api_gateway"');
    expect(content).toContain('kms_key_id        = aws_kms_key.cloudwatch_logs.arn');
  });

  test('should configure API Gateway account settings', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_account" "main"');
  });

  test('should create /webhook resource', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_resource" "webhook"');
    expect(content).toContain('path_part   = "webhook"');
  });

  test('should create /{provider} resource', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_resource" "provider"');
    expect(content).toContain('path_part   = "{provider}"');
  });

  test('should create request validator', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_request_validator" "webhook"');
    expect(content).toContain('validate_request_body       = true');
  });

  test('should create POST method with validation', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_method" "post_webhook"');
    expect(content).toContain('http_method   = "POST"');
    expect(content).toContain('request_validator_id');
  });

  test('should create request model for JSON schema validation', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_model" "webhook_request"');
    expect(content).toContain('content_type = "application/json"');
  });

  test('should integrate with Lambda using AWS_PROXY', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_integration" "lambda"');
    expect(content).toContain('type                    = "AWS_PROXY"');
  });

  test('should create deployment', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_deployment" "webhook"');
  });

  test('should create prod stage', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_stage" "prod"');
    expect(content).toContain('stage_name    = "prod"');
  });

  test('should configure stage access logging', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toMatch(/access_log_settings\s*\{[\s\S]*?destination_arn/);
  });

  test('should configure method settings with throttling', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('resource "aws_api_gateway_method_settings" "all"');
    expect(content).toContain('throttling_rate_limit');
    expect(content).toContain('throttling_burst_limit');
  });

  test('should enable metrics and logging in method settings', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('metrics_enabled        = true');
    expect(content).toContain('logging_level          = "INFO"');
  });
});

describe('Step Functions', () => {
  test('should create CloudWatch log group for Step Functions', () => {
    const content = fs.readFileSync(path.join(libPath, 'step_functions.tf'), 'utf8');
    expect(content).toContain('resource "aws_cloudwatch_log_group" "step_functions"');
    expect(content).toContain('kms_key_id        = aws_kms_key.cloudwatch_logs.arn');
  });

  test('should create state machine with environment suffix', () => {
    const content = fs.readFileSync(path.join(libPath, 'step_functions.tf'), 'utf8');
    expect(content).toContain('resource "aws_sfn_state_machine" "webhook_orchestration"');
    expect(content).toMatch(/name\s*=\s*"webhook-orchestration-\$\{var\.environment_suffix\}"/);
  });

  test('state machine should have ValidateAndTransform state', () => {
    const content = fs.readFileSync(path.join(libPath, 'step_functions.tf'), 'utf8');
    expect(content).toContain('ValidateAndTransform');
  });

  test('state machine should configure retry logic', () => {
    const content = fs.readFileSync(path.join(libPath, 'step_functions.tf'), 'utf8');
    expect(content).toContain('Retry');
    expect(content).toContain('MaxAttempts');
    expect(content).toContain('BackoffRate');
  });

  test('state machine should handle errors with catch block', () => {
    const content = fs.readFileSync(path.join(libPath, 'step_functions.tf'), 'utf8');
    expect(content).toContain('Catch');
    expect(content).toContain('ProcessingFailed');
  });

  test('state machine should have success and fail states', () => {
    const content = fs.readFileSync(path.join(libPath, 'step_functions.tf'), 'utf8');
    expect(content).toContain('ProcessingSucceeded');
    expect(content).toContain('ProcessingFailed');
  });

  test('should enable execution logging', () => {
    const content = fs.readFileSync(path.join(libPath, 'step_functions.tf'), 'utf8');
    expect(content).toContain('logging_configuration');
    expect(content).toContain('include_execution_data = true');
  });
});

describe('CloudWatch Monitoring', () => {
  test('should create dashboard with environment suffix', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toContain('resource "aws_cloudwatch_dashboard" "webhook_monitoring"');
    expect(content).toMatch(/dashboard_name\s*=\s*"webhook-monitoring-\$\{var\.environment_suffix\}"/);
  });

  test('dashboard should monitor API Gateway latency', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toContain('AWS/ApiGateway');
    expect(content).toContain('Latency');
  });

  test('dashboard should monitor Lambda errors', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toContain('AWS/Lambda');
    expect(content).toContain('Errors');
    expect(content).toContain('Invocations');
  });

  test('dashboard should monitor DynamoDB metrics', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toContain('AWS/DynamoDB');
    expect(content).toContain('UserErrors');
    expect(content).toContain('WriteThrottleEvents');
  });

  test('dashboard should monitor Step Functions executions', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toContain('AWS/States');
    expect(content).toContain('ExecutionsFailed');
    expect(content).toContain('ExecutionsSucceeded');
  });

  test('should create alarm for Lambda error rate', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "lambda_error_rate"');
    expect(content).toContain('comparison_operator = "GreaterThanThreshold"');
  });

  test('Lambda alarm should use metric math', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toMatch(/lambda_error_rate[\s\S]*?metric_query[\s\S]*?expression\s*=\s*"\(errors\s*\/\s*invocations\)\s*\*\s*100"/);
  });

  test('should create alarm for DynamoDB throttles', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles"');
    expect(content).toContain('WriteThrottleEvents');
  });

  test('should create alarm for API Gateway errors', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "api_gateway_errors"');
    expect(content).toContain('5XXError');
  });
});

describe('Outputs', () => {
  test('should output API Gateway URL', () => {
    const content = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    expect(content).toContain('output "api_gateway_url"');
    expect(content).toContain('invoke_url');
  });

  test('should output Lambda function name and ARN', () => {
    const content = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    expect(content).toContain('output "lambda_function_name"');
    expect(content).toContain('output "lambda_function_arn"');
  });

  test('should output DynamoDB table name and ARN', () => {
    const content = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    expect(content).toContain('output "dynamodb_table_name"');
    expect(content).toContain('output "dynamodb_table_arn"');
  });

  test('should output Step Functions ARN', () => {
    const content = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    expect(content).toContain('output "step_functions_arn"');
  });

  test('should output DLQ URL and ARN', () => {
    const content = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    expect(content).toContain('output "dlq_url"');
    expect(content).toContain('output "dlq_arn"');
  });

  test('should output CloudWatch dashboard name', () => {
    const content = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    expect(content).toContain('output "cloudwatch_dashboard_name"');
  });

  test('should output KMS key IDs', () => {
    const content = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    expect(content).toContain('output "kms_key_lambda_env_id"');
    expect(content).toContain('output "kms_key_cloudwatch_logs_id"');
  });
});

describe('Resource Naming Convention', () => {
  const allFiles = [
    'kms.tf',
    'dynamodb.tf',
    'sqs.tf',
    'iam.tf',
    'lambda.tf',
    'api_gateway.tf',
    'step_functions.tf',
    'cloudwatch.tf',
  ];

  test('all resources should include environment_suffix in their names', () => {
    allFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(libPath, file), 'utf8');
      const resourceNameMatches = content.match(/name\s*=\s*"[^"]*"/g) || [];
      const suffixMatches = resourceNameMatches.filter((match) =>
        match.includes('${var.environment_suffix}')
      );

      // Expect at least one resource name to include environment_suffix
      expect(suffixMatches.length).toBeGreaterThan(0);
    });
  });

  test('no hardcoded environment names should exist', () => {
    allFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(libPath, file), 'utf8');

      // Check for hardcoded environment names (excluding stage names and comments)
      const lines = content.split('\n');
      lines.forEach((line) => {
        // Skip comments and actual stage names
        if (line.trim().startsWith('#') || line.includes('stage_name')) {
          return;
        }

        // Look for hardcoded env names in resource names
        if (line.includes('name') && line.includes('=')) {
          expect(line).not.toMatch(/-dev[^a-z]/);
          expect(line).not.toMatch(/-staging[^a-z]/);
          expect(line).not.toMatch(/-production[^a-z]/);
        }
      });
    });
  });
});

describe('Security Configuration', () => {
  test('all log groups should have retention configured', () => {
    const files = ['lambda.tf', 'api_gateway.tf', 'step_functions.tf'];
    files.forEach((file) => {
      const content = fs.readFileSync(path.join(libPath, file), 'utf8');
      if (content.includes('aws_cloudwatch_log_group')) {
        expect(content).toContain('retention_in_days');
      }
    });
  });

  test('all log groups should use KMS encryption', () => {
    const files = ['lambda.tf', 'api_gateway.tf', 'step_functions.tf'];
    files.forEach((file) => {
      const content = fs.readFileSync(path.join(libPath, file), 'utf8');
      if (content.includes('aws_cloudwatch_log_group')) {
        expect(content).toContain('kms_key_id');
      }
    });
  });

  test('no hardcoded credentials should exist', () => {
    const allFiles = fs.readdirSync(libPath).filter((f) => f.endsWith('.tf'));
    allFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(libPath, file), 'utf8');
      expect(content.toLowerCase()).not.toMatch(/password\s*=\s*"[^$]/);
      expect(content.toLowerCase()).not.toMatch(/secret\s*=\s*"[^$]/);
      expect(content.toLowerCase()).not.toMatch(/api[_-]?key\s*=\s*"[^$]/);
    });
  });

  test('no resources should have retain policies', () => {
    const allFiles = fs.readdirSync(libPath).filter((f) => f.endsWith('.tf'));
    allFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(libPath, file), 'utf8');
      expect(content.toLowerCase()).not.toContain('prevent_destroy = true');
      expect(content.toLowerCase()).not.toContain('deletion_protection = true');
    });
  });
});

describe('Terraform Validation', () => {
  test('all Terraform files should have valid HCL syntax', () => {
    const allFiles = fs.readdirSync(libPath).filter((f) => f.endsWith('.tf'));
    allFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(libPath, file), 'utf8');

      // Basic syntax checks
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Check for common syntax errors
      expect(content).not.toMatch(/=\s*=\s*[^=]/); // Double equals
      expect(content).not.toMatch(/\}\s*\{/); // Missing separator
    });
  });

  test('resource references should be properly formatted', () => {
    const allFiles = fs.readdirSync(libPath).filter((f) => f.endsWith('.tf'));
    allFiles.forEach((file) => {
      const content = fs.readFileSync(path.join(libPath, file), 'utf8');
      const references = content.match(/aws_[a-z_]+\.[a-z_]+\.[a-z_]+/g) || [];

      references.forEach((ref) => {
        // Should follow pattern: resource_type.resource_name.attribute
        expect(ref.split('.').length).toBe(3);
      });
    });
  });
});

describe('Integration Points', () => {
  test('Lambda should reference correct IAM role', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toContain('role             = aws_iam_role.lambda_execution.arn');
  });

  test('Lambda should reference correct DLQ', () => {
    const content = fs.readFileSync(path.join(libPath, 'lambda.tf'), 'utf8');
    expect(content).toContain('target_arn = aws_sqs_queue.lambda_dlq.arn');
  });

  test('API Gateway should reference Lambda function', () => {
    const content = fs.readFileSync(path.join(libPath, 'api_gateway.tf'), 'utf8');
    expect(content).toContain('uri                     = aws_lambda_function.webhook_processor.invoke_arn');
  });

  test('Step Functions should reference Lambda function', () => {
    const content = fs.readFileSync(path.join(libPath, 'step_functions.tf'), 'utf8');
    expect(content).toContain('aws_lambda_function.webhook_processor.arn');
  });

  test('CloudWatch alarms should reference correct resources', () => {
    const content = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf8');
    expect(content).toContain('aws_lambda_function.webhook_processor.function_name');
    expect(content).toContain('aws_dynamodb_table.webhooks.name');
    expect(content).toContain('aws_api_gateway_rest_api.webhook_api.name');
  });
});
