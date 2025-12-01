# Terraform Infrastructure for Serverless Webhook Processing System

This solution implements a production-ready serverless webhook processing system using Terraform and HCL.

## Architecture Overview

- API Gateway REST API with `/webhook/{provider}` endpoint
- Lambda function for webhook validation and transformation
- DynamoDB table for storing processed webhook data
- Step Functions state machine for orchestration
- SQS dead letter queue for failed processing
- CloudWatch dashboard and alarms for monitoring
- KMS keys for encryption

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming across deployments"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "lambda_architecture" {
  description = "Lambda architecture"
  type        = string
  default     = "arm64"
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for Lambda"
  type        = number
  default     = 10
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit (requests per minute)"
  type        = number
  default     = 1000
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 2000
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch logs retention period in days"
  type        = number
  default     = 30
}

variable "alarm_error_rate_threshold" {
  description = "Lambda error rate threshold for alarms (percentage)"
  type        = number
  default     = 1
}

variable "alarm_evaluation_periods" {
  description = "Number of periods to evaluate for alarms"
  type        = number
  default     = 1
}

variable "alarm_period_seconds" {
  description = "Period in seconds for alarm evaluation"
  type        = number
  default     = 300
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # S3 backend configuration
  # Backend values are provided via -backend-config flags during terraform init
  # This allows the bootstrap script to dynamically set bucket, key, and region
  backend "s3" {
    # Values are provided via -backend-config during terraform init
    # bucket, key, region, and encrypt are set by the bootstrap script
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Project     = "webhook-processing"
      ManagedBy   = "Terraform"
    }
  }
}
```

## File: lib/main.tf

```hcl
# Data sources and main infrastructure resources

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
```

## File: lib/kms.tf

```hcl
# KMS key for Lambda environment variables
resource "aws_kms_key" "lambda_env" {
  description             = "KMS key for Lambda environment variables encryption - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "lambda-env-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "lambda_env" {
  name          = "alias/lambda-env-${var.environment_suffix}"
  target_key_id = aws_kms_key.lambda_env.key_id
}

# KMS key for CloudWatch Logs
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "cloudwatch-logs-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/cloudwatch-logs-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}
```

## File: lib/dynamodb.tf

```hcl
resource "aws_dynamodb_table" "webhooks" {
  name           = "webhooks-${var.environment_suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "transaction_id"
  range_key      = "timestamp"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "webhooks-table-${var.environment_suffix}"
  }
}
```

## File: lib/sqs.tf

```hcl
resource "aws_sqs_queue" "lambda_dlq" {
  name                       = "webhook-processor-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600  # 14 days
  visibility_timeout_seconds = 300

  tags = {
    Name = "webhook-processor-dlq-${var.environment_suffix}"
  }
}

resource "aws_sqs_queue_policy" "lambda_dlq" {
  queue_url = aws_sqs_queue.lambda_dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.lambda_dlq.arn
      }
    ]
  })
}
```

## File: lib/iam.tf

```hcl
# IAM role for Lambda function
resource "aws_iam_role" "lambda_execution" {
  name = "webhook-processor-lambda-role-${var.environment_suffix}"

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

  tags = {
    Name = "webhook-processor-lambda-role-${var.environment_suffix}"
  }
}

# Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda custom policy for DynamoDB, SQS, and KMS
resource "aws_iam_role_policy" "lambda_custom" {
  name = "webhook-processor-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.webhooks.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.lambda_dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.lambda_env.arn
      }
    ]
  })
}

# IAM role for Step Functions
resource "aws_iam_role" "step_functions" {
  name = "webhook-step-functions-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "webhook-step-functions-role-${var.environment_suffix}"
  }
}

# Step Functions policy to invoke Lambda and write to CloudWatch Logs
resource "aws_iam_role_policy" "step_functions_lambda" {
  name = "webhook-step-functions-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.webhook_processor.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "api-gateway-cloudwatch-role-${var.environment_suffix}"

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

  tags = {
    Name = "api-gateway-cloudwatch-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}
```

## File: lib/lambda.tf

```hcl
# CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/webhook-processor-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "webhook-processor-logs-${var.environment_suffix}"
  }
}

# Lambda function code package
data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = file("${path.module}/lambda/webhook_processor.py")
    filename = "webhook_processor.py"
  }
}

# Lambda function
resource "aws_lambda_function" "webhook_processor" {
  filename         = data.archive_file.lambda.output_path
  function_name    = "webhook-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "webhook_processor.lambda_handler"
  source_code_hash = data.archive_file.lambda.output_base64sha256
  runtime          = var.lambda_runtime
  architectures    = [var.lambda_architecture]
  timeout          = 30
  memory_size      = 512

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.webhooks.name
      ENVIRONMENT         = var.environment_suffix
    }
  }

  kms_key_arn = aws_kms_key.lambda_env.arn

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy.lambda_custom
  ]

  tags = {
    Name = "webhook-processor-${var.environment_suffix}"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}
```

## File: lib/lambda/webhook_processor.py

```python
import json
import os
import time
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Process webhook events from different providers.
    Validates the webhook, transforms data, and stores in DynamoDB.
    """
    try:
        # Extract provider from path parameters
        provider = event.get('pathParameters', {}).get('provider', 'unknown')

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate webhook data
        if not body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Empty request body'})
            }

        # Transform data based on provider
        transformed_data = transform_webhook(provider, body)

        # Generate transaction ID and timestamp
        transaction_id = transformed_data.get('transaction_id') or f"{provider}-{int(time.time() * 1000)}"
        timestamp = int(time.time() * 1000)

        # Store in DynamoDB
        item = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'provider': provider,
            'raw_data': json.dumps(body),
            'transformed_data': json.dumps(transformed_data),
            'status': 'processed'
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'transaction_id': transaction_id,
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def transform_webhook(provider, data):
    """
    Transform webhook data based on provider-specific format.
    """
    transformers = {
        'stripe': transform_stripe,
        'paypal': transform_paypal,
        'square': transform_square
    }

    transformer = transformers.get(provider.lower(), transform_generic)
    return transformer(data)

def transform_stripe(data):
    """Transform Stripe webhook format."""
    return {
        'transaction_id': data.get('id'),
        'amount': data.get('amount'),
        'currency': data.get('currency'),
        'customer_id': data.get('customer'),
        'event_type': data.get('type')
    }

def transform_paypal(data):
    """Transform PayPal webhook format."""
    return {
        'transaction_id': data.get('id'),
        'amount': data.get('purchase_units', [{}])[0].get('amount', {}).get('value'),
        'currency': data.get('purchase_units', [{}])[0].get('amount', {}).get('currency_code'),
        'customer_id': data.get('payer', {}).get('payer_id'),
        'event_type': data.get('event_type')
    }

def transform_square(data):
    """Transform Square webhook format."""
    return {
        'transaction_id': data.get('id'),
        'amount': data.get('amount_money', {}).get('amount'),
        'currency': data.get('amount_money', {}).get('currency'),
        'customer_id': data.get('customer_id'),
        'event_type': data.get('type')
    }

def transform_generic(data):
    """Generic transformation for unknown providers."""
    return {
        'transaction_id': data.get('id') or data.get('transaction_id'),
        'amount': data.get('amount'),
        'currency': data.get('currency'),
        'customer_id': data.get('customer_id'),
        'event_type': data.get('event_type') or data.get('type')
    }
```

## File: lib/api_gateway.tf

```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "webhook_api" {
  name        = "webhook-api-${var.environment_suffix}"
  description = "API Gateway for webhook processing - ${var.environment_suffix}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "webhook-api-${var.environment_suffix}"
  }
}

# API Gateway CloudWatch log group
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/webhook-api-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "webhook-api-logs-${var.environment_suffix}"
  }
}

# API Gateway account settings for CloudWatch logging
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# /webhook resource
resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_rest_api.webhook_api.root_resource_id
  path_part   = "webhook"
}

# /{provider} resource
resource "aws_api_gateway_resource" "provider" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_resource.webhook.id
  path_part   = "{provider}"
}

# Request validator for JSON schema validation
resource "aws_api_gateway_request_validator" "webhook" {
  name                        = "webhook-validator-${var.environment_suffix}"
  rest_api_id                 = aws_api_gateway_rest_api.webhook_api.id
  validate_request_body       = true
  validate_request_parameters = true
}

# POST method with request validation
resource "aws_api_gateway_method" "post_webhook" {
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  resource_id   = aws_api_gateway_resource.provider.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.webhook.id

  request_parameters = {
    "method.request.path.provider" = true
  }

  request_models = {
    "application/json" = aws_api_gateway_model.webhook_request.name
  }
}

# Request model for JSON schema validation
resource "aws_api_gateway_model" "webhook_request" {
  rest_api_id  = aws_api_gateway_rest_api.webhook_api.id
  name         = "WebhookRequest"
  description  = "Webhook request validation model"
  content_type = "application/json"

  schema = jsonencode({
    "$schema" = "http://json-schema.org/draft-04/schema#"
    title     = "WebhookRequest"
    type      = "object"
    properties = {
      id = {
        type = "string"
      }
      type = {
        type = "string"
      }
    }
  })
}

# Lambda integration
resource "aws_api_gateway_integration" "lambda" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.provider.id
  http_method             = aws_api_gateway_method.post_webhook.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.webhook_processor.invoke_arn
}

# Deployment
resource "aws_api_gateway_deployment" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.webhook.id,
      aws_api_gateway_resource.provider.id,
      aws_api_gateway_method.post_webhook.id,
      aws_api_gateway_integration.lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.lambda
  ]
}

# Stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.webhook.id
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  stage_name    = "prod"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name = "webhook-api-${var.environment_suffix}"
  }

  depends_on = [aws_api_gateway_account.main]
}

# Method settings for throttling
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = var.api_throttle_rate_limit / 60  # Convert to requests per second
    throttling_burst_limit = var.api_throttle_burst_limit
    logging_level          = "INFO"
    data_trace_enabled     = true
    metrics_enabled        = true
  }
}
```

## File: lib/step_functions.tf

```hcl
# CloudWatch log group for Step Functions
resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/webhook-orchestration-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "webhook-orchestration-logs-${var.environment_suffix}"
  }
}

# Step Functions state machine
resource "aws_sfn_state_machine" "webhook_orchestration" {
  name     = "webhook-orchestration-${var.environment_suffix}"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Webhook processing orchestration workflow"
    StartAt = "ValidateAndTransform"
    States = {
      ValidateAndTransform = {
        Type     = "Task"
        Resource = aws_lambda_function.webhook_processor.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ProcessingFailed"
          }
        ]
        Next = "ProcessingSucceeded"
      }
      ProcessingSucceeded = {
        Type = "Succeed"
      }
      ProcessingFailed = {
        Type = "Fail"
        Error = "WebhookProcessingFailed"
        Cause = "Failed to process webhook after retries"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = {
    Name = "webhook-orchestration-${var.environment_suffix}"
  }
}
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "webhook_monitoring" {
  dashboard_name = "webhook-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", { stat = "Average", label = "API Latency (avg)" }],
            ["...", { stat = "p99", label = "API Latency (p99)" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "API Gateway Latency"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Invocations", { stat = "Sum", label = "Lambda Invocations" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Errors and Invocations"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "UserErrors", { stat = "Sum", label = "DynamoDB User Errors" }],
            [".", "SystemErrors", { stat = "Sum", label = "DynamoDB System Errors" }],
            [".", "ConditionalCheckFailedRequests", { stat = "Sum", label = "Conditional Check Failed" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Errors"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "WriteThrottleEvents", { stat = "Sum", label = "Write Throttles" }],
            [".", "ReadThrottleEvents", { stat = "Sum", label = "Read Throttles" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Throttles"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/States", "ExecutionsFailed", { stat = "Sum", label = "Failed Executions" }],
            [".", "ExecutionsSucceeded", { stat = "Sum", label = "Successful Executions" }],
            [".", "ExecutionsTimedOut", { stat = "Sum", label = "Timed Out Executions" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Step Functions Executions"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      }
    ]
  })
}

# CloudWatch alarm for Lambda error rate
resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  alarm_name          = "webhook-lambda-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  threshold           = var.alarm_error_rate_threshold
  alarm_description   = "Alert when Lambda error rate exceeds ${var.alarm_error_rate_threshold}% over ${var.alarm_period_seconds} seconds"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / invocations) * 100"
    label       = "Lambda Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.webhook_processor.function_name
      }
    }
  }

  metric_query {
    id = "invocations"
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.webhook_processor.function_name
      }
    }
  }

  tags = {
    Name = "webhook-lambda-error-rate-alarm-${var.environment_suffix}"
  }
}

# CloudWatch alarm for DynamoDB throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "webhook-dynamodb-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when DynamoDB write throttles exceed 10 over 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.webhooks.name
  }

  tags = {
    Name = "webhook-dynamodb-throttles-alarm-${var.environment_suffix}"
  }
}

# CloudWatch alarm for API Gateway 5XX errors
resource "aws_cloudwatch_metric_alarm" "api_gateway_errors" {
  alarm_name          = "webhook-api-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when API Gateway 5XX errors exceed 10 over 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.webhook_api.name
  }

  tags = {
    Name = "webhook-api-5xx-errors-alarm-${var.environment_suffix}"
  }
}
```

## File: lib/outputs.tf

```hcl
output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/webhook/{provider}"
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.webhook_api.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.webhook_processor.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.webhook_processor.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.webhooks.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.webhooks.arn
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.webhook_orchestration.arn
}

output "dlq_url" {
  description = "Dead Letter Queue URL"
  value       = aws_sqs_queue.lambda_dlq.url
}

output "dlq_arn" {
  description = "Dead Letter Queue ARN"
  value       = aws_sqs_queue.lambda_dlq.arn
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.webhook_monitoring.dashboard_name
}

output "kms_key_lambda_env_id" {
  description = "KMS key ID for Lambda environment variables"
  value       = aws_kms_key.lambda_env.id
}

output "kms_key_cloudwatch_logs_id" {
  description = "KMS key ID for CloudWatch Logs"
  value       = aws_kms_key.cloudwatch_logs.id
}
```
