############################################################
# main.tf — Single-file Terraform stack (no external modules)
# - Variables, locals, resources, and outputs in one place.
# - Assumes provider(s) are configured in provider.tf and may
#   use var.aws_region and (optionally) provider aliases.
# - Serverless: Lambda + API Gateway + Secrets Manager.
# - Best practices: least-priv IAM, tagging, optional KMS.
############################################################

#################
# Variables
#################
variable "aws_region" {
  description = "Region consumed by provider.tf (keep in sync)"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name like dev|qa|prod"
  type        = string
  default     = "dev"
}

variable "environment_suffix" {
  description = "Short suffix to avoid name collisions (e.g., CI run id)"
  type        = string
  default     = "local"
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 20
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention"
  type        = number
  default     = 7
}

variable "kms_key_arn" {
  description = "Optional KMS key ARN to encrypt Lambda env vars and log group (leave empty to use AWS-managed defaults)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional resource tags"
  type        = map(string)
  default     = {}
}

#################
# Data sources
#################
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

#################
# Locals
#################
locals {
  # Consistent name prefix
  name_prefix = "serverless-api-${var.environment}-${var.environment_suffix}"

  # Common tags (expand as needed)
  common_tags = merge({
    Project     = "serverless-api"
    Environment = var.environment
    Region      = var.aws_region
    Owner       = "iac-generator"
    ManagedBy   = "terraform"
    NamePrefix  = local.name_prefix
  }, var.tags)
}

#################
# Secrets Manager (encrypted at rest by default)
#################
resource "aws_secretsmanager_secret" "config" {
  name                    = "${local.name_prefix}-config"
  description             = "Configuration secret for Lambda"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "config" {
  secret_id     = aws_secretsmanager_secret.config.id
  secret_string = jsonencode({ api_key = "example-key", feature = "enabled" })
}

#################
# IAM — least privilege for Lambda + (optional) API Gateway logs role
#################
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Secrets: strictly limit to the specific secret ARN
resource "aws_iam_role_policy" "lambda_secrets_read" {
  name = "${local.name_prefix}-secrets-read"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["secretsmanager:GetSecretValue"],
      Resource = aws_secretsmanager_secret.config.arn
    }]
  })
}

# API Gateway -> CloudWatch logs role (optional but recommended for access logs)
resource "aws_iam_role" "apigw_logs_role" {
  name = "${local.name_prefix}-apigw-logs-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "apigateway.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "apigw_push_logs" {
  role       = aws_iam_role.apigw_logs_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Wire account-level CloudWatch role for API Gateway
resource "aws_api_gateway_account" "account" {
  cloudwatch_role_arn = aws_iam_role.apigw_logs_role.arn
}

#################
# CloudWatch log group (optional encryption)
#################
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name_prefix}-fn"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags

  # Optional KMS encryption for logs if kms_key_arn is provided
  kms_key_id = var.kms_key_arn != "" ? var.kms_key_arn : null
}

#################
# Lambda function
#################
data "archive_file" "zip" {
  type        = "zip"
  source_file = "${path.module}/handler.py"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "fn" {
  function_name    = "${local.name_prefix}-fn"
  filename         = data.archive_file.zip.output_path
  source_code_hash = data.archive_file.zip.output_base64sha256
  role             = aws_iam_role.lambda_role.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size
  tags             = local.common_tags

  # Optional KMS for environment variable encryption
  kms_key_arn = var.kms_key_arn != "" ? var.kms_key_arn : null
  environment {
    variables = {
      SECRET_ARN = aws_secretsmanager_secret.config.arn
      APP_ENV    = var.environment
      ENV_SUFFIX = var.environment_suffix
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}

#################
# API Gateway (REST) with IAM auth + access logging
#################
resource "aws_api_gateway_rest_api" "api" {
  name = local.name_prefix
  endpoint_configuration { types = ["REGIONAL"] }
  tags = local.common_tags
}

resource "aws_api_gateway_resource" "invoke" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "invoke"
}

resource "aws_api_gateway_method" "any" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.invoke.id
  http_method   = "ANY"
  authorization = "AWS_IAM"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.invoke.id
  http_method = aws_api_gateway_method.any.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.fn.invoke_arn
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fn.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# Access log group for API Gateway stage
resource "aws_cloudwatch_log_group" "apigw_access" {
  name              = "/aws/apigw/${local.name_prefix}-${var.environment}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags

  kms_key_id = var.kms_key_arn != "" ? var.kms_key_arn : null
}

# Deployment only (no stage_name here)
resource "aws_api_gateway_deployment" "deploy" {
  depends_on  = [aws_api_gateway_integration.lambda]
  rest_api_id = aws_api_gateway_rest_api.api.id

  # Optional but recommended: add a trigger that changes when your API config changes,
  # so Terraform knows when to redeploy (adjust to your setup).
  triggers = {
    redeploy = sha1(jsonencode([
      aws_api_gateway_rest_api.api.id,
      aws_api_gateway_integration.lambda.id,
      aws_api_gateway_method.any.id, # if you have this
    ]))
  }

  lifecycle { create_before_destroy = true }
}

# Stage managed separately
resource "aws_api_gateway_stage" "current" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.deploy.id
  stage_name    = var.environment

  # Optional: add settings/logging/etc here
  # variables = { ENV = var.environment }
  # xray_tracing_enabled = true
  # access_log_settings {
  #   destination_arn = aws_cloudwatch_log_group.apigw_access.arn
  #   format          = jsonencode({ requestId = "$context.requestId" })
  # }
}


resource "aws_api_gateway_stage" "stage" {
  stage_name    = "stage_aws_apigtw"
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.deploy.id

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw_access.arn
    format = jsonencode({
      requestId      = "$context.requestId",
      ip             = "$context.identity.sourceIp",
      caller         = "$context.identity.caller",
      user           = "$context.identity.user",
      requestTime    = "$context.requestTime",
      httpMethod     = "$context.httpMethod",
      resourcePath   = "$context.resourcePath",
      status         = "$context.status",
      protocol       = "$context.protocol",
      responseLength = "$context.responseLength"
    })
  }

  tags = local.common_tags
}

#################
# Useful outputs (no secrets)
#################
output "api_gateway_url" {
  value       = "${aws_api_gateway_stage.stage.invoke_url}/invoke"
  description = "Invoke URL for the API Gateway resource"
}

output "lambda_function_name" {
  value       = aws_lambda_function.fn.function_name
  description = "Lambda function name"
}

output "lambda_function_arn" {
  value       = aws_lambda_function.fn.arn
  description = "Lambda function ARN"
}

output "secret_arn" {
  value       = aws_secretsmanager_secret.config.arn
  description = "Secret ARN (no values) for IAM scoping/tests"
}

output "log_group_lambda" {
  value       = aws_cloudwatch_log_group.lambda.name
  description = "Lambda CloudWatch Log Group name"
}

output "apigw_rest_api_id" {
  value       = aws_api_gateway_rest_api.api.id
  description = "REST API ID for integration tests"
}

output "apigw_stage_name" {
  value       = aws_api_gateway_stage.stage.stage_name
  description = "Stage name"
}

output "name_prefix" {
  value       = local.name_prefix
  description = "Computed naming prefix for all resources"
}
