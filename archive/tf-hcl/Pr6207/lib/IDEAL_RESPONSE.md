## tap_stack.tf

```hcl
# Serverless Fraud Detection Pipeline - Main Stack
# Based on requirements from PROMPT.md

# Data sources for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values for resource naming and configuration
locals {
  project_name = "fraud-detection"
  environment  = var.environment_suffix
  name_prefix  = "${local.project_name}-${local.environment}"

  # Common tags for all resources
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
    Purpose     = "fraud-detection-pipeline"
  }
}

# DynamoDB table for transaction storage
resource "aws_dynamodb_table" "transactions" {
  name             = "${local.name_prefix}-transactions"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "transaction_id"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  # Point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = local.common_tags
}

# SQS queue for suspicious transactions requiring manual review
resource "aws_sqs_queue" "suspicious_transactions" {
  name                       = "${local.name_prefix}-suspicious-transactions"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 0
  visibility_timeout_seconds = 300

  # Redrive policy for dead letter queue
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.suspicious_transactions_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags
}

# Dead letter queue for suspicious transactions
resource "aws_sqs_queue" "suspicious_transactions_dlq" {
  name                      = "${local.name_prefix}-suspicious-transactions-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = local.common_tags
}

# Dead letter queue for transaction processor Lambda
resource "aws_sqs_queue" "transaction_processor_dlq" {
  name                      = "${local.name_prefix}-transaction-processor-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = local.common_tags
}

# Dead letter queue for fraud detector Lambda
resource "aws_sqs_queue" "fraud_detector_dlq" {
  name                      = "${local.name_prefix}-fraud-detector-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = local.common_tags
}

# IAM role for transaction processor Lambda
resource "aws_iam_role" "transaction_processor_role" {
  name = "${local.name_prefix}-transaction-processor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for transaction processor Lambda
resource "aws_iam_role_policy" "transaction_processor_policy" {
  name = "${local.name_prefix}-transaction-processor-policy"
  role = aws_iam_role.transaction_processor_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.transaction_processor_dlq.arn
      }
    ]
  })
}

# IAM role for fraud detector Lambda
resource "aws_iam_role" "fraud_detector_role" {
  name = "${local.name_prefix}-fraud-detector-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for fraud detector Lambda
resource "aws_iam_role_policy" "fraud_detector_policy" {
  name = "${local.name_prefix}-fraud-detector-policy"
  role = aws_iam_role.fraud_detector_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "${aws_dynamodb_table.transactions.arn}/stream/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.suspicious_transactions.arn,
          aws_sqs_queue.fraud_detector_dlq.arn
        ]
      }
    ]
  })
}

# IAM role for API Gateway
resource "aws_iam_role" "api_gateway_role" {
  name = "${local.name_prefix}-api-gateway-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for API Gateway to invoke Lambda
resource "aws_iam_role_policy" "api_gateway_policy" {
  name = "${local.name_prefix}-api-gateway-policy"
  role = aws_iam_role.api_gateway_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.transaction_processor.arn
      }
    ]
  })
}

# CloudWatch Log Group for transaction processor Lambda
resource "aws_cloudwatch_log_group" "transaction_processor_logs" {
  name              = "/aws/lambda/${local.name_prefix}-transaction-processor"
  retention_in_days = 7

  tags = local.common_tags
}

# CloudWatch Log Group for fraud detector Lambda
resource "aws_cloudwatch_log_group" "fraud_detector_logs" {
  name              = "/aws/lambda/${local.name_prefix}-fraud-detector"
  retention_in_days = 7

  tags = local.common_tags
}

# Transaction processor Lambda function
resource "aws_lambda_function" "transaction_processor" {
  filename      = "transaction_processor.zip"
  function_name = "${local.name_prefix}-transaction-processor"
  role          = aws_iam_role.transaction_processor_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  architectures = ["arm64"] # Graviton2 ARM processor
  timeout       = 30
  memory_size   = 256

  # Dead letter queue configuration
  dead_letter_config {
    target_arn = aws_sqs_queue.transaction_processor_dlq.arn
  }

  # Environment variables
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name
      REGION              = data.aws_region.current.name
    }
  }

  depends_on = [
    aws_iam_role_policy.transaction_processor_policy,
    aws_cloudwatch_log_group.transaction_processor_logs,
  ]

  tags = local.common_tags
}

# Fraud detector Lambda function
resource "aws_lambda_function" "fraud_detector" {
  filename      = "fraud_detector.zip"
  function_name = "${local.name_prefix}-fraud-detector"
  role          = aws_iam_role.fraud_detector_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  architectures = ["arm64"] # Graviton2 ARM processor
  timeout       = 60
  memory_size   = 512

  # Dead letter queue configuration
  dead_letter_config {
    target_arn = aws_sqs_queue.fraud_detector_dlq.arn
  }

  # Environment variables
  environment {
    variables = {
      SQS_QUEUE_URL = aws_sqs_queue.suspicious_transactions.url
      REGION        = data.aws_region.current.name
    }
  }

  depends_on = [
    aws_iam_role_policy.fraud_detector_policy,
    aws_cloudwatch_log_group.fraud_detector_logs,
  ]

  tags = local.common_tags
}

# Event source mapping for DynamoDB stream to fraud detector Lambda
resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn                   = aws_dynamodb_table.transactions.stream_arn
  function_name                      = aws_lambda_function.fraud_detector.arn
  starting_position                  = "LATEST"
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  # Error handling
  maximum_retry_attempts = 3
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "fraud_detection_api" {
  name        = "${local.name_prefix}-api"
  description = "Fraud Detection API for processing transactions"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# API Gateway resource for /transactions
resource "aws_api_gateway_resource" "transactions" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id
  parent_id   = aws_api_gateway_rest_api.fraud_detection_api.root_resource_id
  path_part   = "transactions"
}

# API Gateway request validator
resource "aws_api_gateway_request_validator" "transaction_validator" {
  name                        = "${local.name_prefix}-transaction-validator"
  rest_api_id                 = aws_api_gateway_rest_api.fraud_detection_api.id
  validate_request_body       = true
  validate_request_parameters = true
}

# API Gateway model for request validation
resource "aws_api_gateway_model" "transaction_model" {
  rest_api_id  = aws_api_gateway_rest_api.fraud_detection_api.id
  name         = "TransactionModel"
  content_type = "application/json"

  schema = jsonencode({
    "$schema" : "http://json-schema.org/draft-04/schema#",
    "title" : "Transaction Schema",
    "type" : "object",
    "properties" : {
      "transaction_id" : {
        "type" : "string",
        "minLength" : 1,
        "maxLength" : 100
      },
      "amount" : {
        "type" : "number",
        "minimum" : 0.01
      },
      "currency" : {
        "type" : "string",
        "pattern" : "^[A-Z]{3}$"
      },
      "merchant_id" : {
        "type" : "string",
        "minLength" : 1,
        "maxLength" : 50
      },
      "timestamp" : {
        "type" : "string",
        "format" : "date-time"
      }
    },
    "required" : ["transaction_id", "amount", "currency", "merchant_id", "timestamp"],
    "additionalProperties" : false
  })
}

# API Gateway method for POST /transactions
resource "aws_api_gateway_method" "post_transactions" {
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection_api.id
  resource_id   = aws_api_gateway_resource.transactions.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.transaction_validator.id

  request_models = {
    "application/json" = aws_api_gateway_model.transaction_model.name
  }
}

# API Gateway integration with Lambda
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id
  resource_id = aws_api_gateway_resource.transactions.id
  http_method = aws_api_gateway_method.post_transactions.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transaction_processor.invoke_arn
}

# API Gateway method response
resource "aws_api_gateway_method_response" "post_transactions_response" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id
  resource_id = aws_api_gateway_resource.transactions.id
  http_method = aws_api_gateway_method.post_transactions.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_processor.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.fraud_detection_api.execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_method.post_transactions,
    aws_api_gateway_integration.lambda_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.transactions.id,
      aws_api_gateway_method.post_transactions.id,
      aws_api_gateway_integration.lambda_integration.id,
    ]))
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection_api.id
  stage_name    = "prod"
}

# CloudWatch alarms for Lambda error monitoring
resource "aws_cloudwatch_metric_alarm" "transaction_processor_errors" {
  alarm_name          = "${local.name_prefix}-transaction-processor-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ErrorRate"
  namespace           = "AWS/Lambda"
  period              = "300" # 5 minutes
  statistic           = "Average"
  threshold           = "0.01" # 1% error rate
  alarm_description   = "This metric monitors transaction processor lambda error rate"
  alarm_actions       = [] # Add SNS topic ARN here for notifications

  dimensions = {
    FunctionName = aws_lambda_function.transaction_processor.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "fraud_detector_errors" {
  alarm_name          = "${local.name_prefix}-fraud-detector-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ErrorRate"
  namespace           = "AWS/Lambda"
  period              = "300" # 5 minutes
  statistic           = "Average"
  threshold           = "0.01" # 1% error rate
  alarm_description   = "This metric monitors fraud detector lambda error rate"
  alarm_actions       = [] # Add SNS topic ARN here for notifications

  dimensions = {
    FunctionName = aws_lambda_function.fraud_detector.function_name
  }

  tags = local.common_tags
}

# Outputs
output "api_gateway_url" {
  description = "API Gateway invoke URL for transaction submissions"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/transactions"
}

output "sqs_queue_url" {
  description = "SQS queue URL for suspicious transaction processing"
  value       = aws_sqs_queue.suspicious_transactions.url
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for transactions"
  value       = aws_dynamodb_table.transactions.name
}

output "lambda_function_names" {
  description = "Names of the Lambda functions"
  value = {
    transaction_processor = aws_lambda_function.transaction_processor.function_name
    fraud_detector        = aws_lambda_function.fraud_detector.function_name
  }
}
```

## provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

## variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}
```