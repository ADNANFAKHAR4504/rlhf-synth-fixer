# Serverless Payment Webhook Processing System
# Terraform configuration for a complete serverless payment processing API

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  common_tags = {
    Project     = "ServerlessPaymentAPI"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# ================================
# KMS Key for Encryption
# ================================

resource "aws_kms_key" "payment_system" {
  description             = "KMS key for payment system encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda Functions"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow DynamoDB"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "payment-system-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "payment_system" {
  name          = "alias/payment-system-${var.environment_suffix}"
  target_key_id = aws_kms_key.payment_system.key_id
}

# ================================
# DynamoDB Table
# ================================

resource "aws_dynamodb_table" "payment_transactions" {
  name             = "payment_transactions"
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

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.payment_system.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "payment-transactions-${var.environment_suffix}"
  })
}

# ================================
# SQS Queues
# ================================

# Main notification queue
resource "aws_sqs_queue" "notification_queue" {
  name                       = "payment-notifications-${var.environment_suffix}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 20      # Long polling

  kms_master_key_id = aws_kms_key.payment_system.arn

  tags = merge(local.common_tags, {
    Name = "payment-notifications-${var.environment_suffix}"
  })
}

# Dead Letter Queues
resource "aws_sqs_queue" "webhook_processor_dlq" {
  name                      = "webhook-processor-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.payment_system.arn

  tags = merge(local.common_tags, {
    Name = "webhook-processor-dlq-${var.environment_suffix}"
  })
}

resource "aws_sqs_queue" "transaction_reader_dlq" {
  name                      = "transaction-reader-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.payment_system.arn

  tags = merge(local.common_tags, {
    Name = "transaction-reader-dlq-${var.environment_suffix}"
  })
}

resource "aws_sqs_queue" "notification_sender_dlq" {
  name                      = "notification-sender-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.payment_system.arn

  tags = merge(local.common_tags, {
    Name = "notification-sender-dlq-${var.environment_suffix}"
  })
}

# ================================
# SNS Topic
# ================================

resource "aws_sns_topic" "email_notifications" {
  name              = "payment-email-notifications-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.payment_system.arn

  tags = merge(local.common_tags, {
    Name = "payment-email-notifications-${var.environment_suffix}"
  })
}

# ================================
# CloudWatch Log Groups
# ================================

resource "aws_cloudwatch_log_group" "webhook_processor" {
  name              = "/aws/lambda/webhook-processor-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.payment_system.arn

  tags = merge(local.common_tags, {
    Name = "webhook-processor-logs-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_group" "transaction_reader" {
  name              = "/aws/lambda/transaction-reader-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.payment_system.arn

  tags = merge(local.common_tags, {
    Name = "transaction-reader-logs-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_group" "notification_sender" {
  name              = "/aws/lambda/notification-sender-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.payment_system.arn

  tags = merge(local.common_tags, {
    Name = "notification-sender-logs-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/payment-api-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.payment_system.arn

  tags = merge(local.common_tags, {
    Name = "api-gateway-logs-${var.environment_suffix}"
  })
}

# ================================
# IAM Roles and Policies
# ================================

# Webhook Processor Lambda Role
resource "aws_iam_role" "webhook_processor_role" {
  name = "webhook-processor-role-${var.environment_suffix}"

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

resource "aws_iam_role_policy" "webhook_processor_policy" {
  name = "webhook-processor-policy-${var.environment_suffix}"
  role = aws_iam_role.webhook_processor_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.webhook_processor.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.payment_transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.notification_queue.arn,
          aws_sqs_queue.webhook_processor_dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.payment_system.arn
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# Transaction Reader Lambda Role
resource "aws_iam_role" "transaction_reader_role" {
  name = "transaction-reader-role-${var.environment_suffix}"

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

resource "aws_iam_role_policy" "transaction_reader_policy" {
  name = "transaction-reader-policy-${var.environment_suffix}"
  role = aws_iam_role.transaction_reader_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.transaction_reader.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.payment_transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.transaction_reader_dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.payment_system.arn
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# Notification Sender Lambda Role
resource "aws_iam_role" "notification_sender_role" {
  name = "notification-sender-role-${var.environment_suffix}"

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

resource "aws_iam_role_policy" "notification_sender_policy" {
  name = "notification-sender-policy-${var.environment_suffix}"
  role = aws_iam_role.notification_sender_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.notification_sender.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.payment_transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.email_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.notification_sender_dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.payment_system.arn
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# ================================
# Lambda Functions
# ================================

# Webhook Processor Lambda
resource "aws_lambda_function" "webhook_processor" {
  filename      = "webhook_processor.zip"
  function_name = "webhook-processor-${var.environment_suffix}"
  role          = aws_iam_role.webhook_processor_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 30

  reserved_concurrent_executions = 100

  dead_letter_config {
    target_arn = aws_sqs_queue.webhook_processor_dlq.arn
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.payment_transactions.name
      SQS_QUEUE_URL  = aws_sqs_queue.notification_queue.url
      KMS_KEY_ID     = aws_kms_key.payment_system.key_id
    }
  }

  kms_key_arn = aws_kms_key.payment_system.arn

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.webhook_processor]

  tags = merge(local.common_tags, {
    Name = "webhook-processor-${var.environment_suffix}"
  })
}

# Transaction Reader Lambda
resource "aws_lambda_function" "transaction_reader" {
  filename      = "transaction_reader.zip"
  function_name = "transaction-reader-${var.environment_suffix}"
  role          = aws_iam_role.transaction_reader_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 30

  reserved_concurrent_executions = 50

  dead_letter_config {
    target_arn = aws_sqs_queue.transaction_reader_dlq.arn
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.payment_transactions.name
      KMS_KEY_ID     = aws_kms_key.payment_system.key_id
    }
  }

  kms_key_arn = aws_kms_key.payment_system.arn

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.transaction_reader]

  tags = merge(local.common_tags, {
    Name = "transaction-reader-${var.environment_suffix}"
  })
}

# Notification Sender Lambda
resource "aws_lambda_function" "notification_sender" {
  filename      = "notification_sender.zip"
  function_name = "notification-sender-${var.environment_suffix}"
  role          = aws_iam_role.notification_sender_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 30

  reserved_concurrent_executions = 50

  dead_letter_config {
    target_arn = aws_sqs_queue.notification_sender_dlq.arn
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.payment_transactions.name
      SNS_TOPIC_ARN  = aws_sns_topic.email_notifications.arn
      KMS_KEY_ID     = aws_kms_key.payment_system.key_id
    }
  }

  kms_key_arn = aws_kms_key.payment_system.arn

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.notification_sender]

  tags = merge(local.common_tags, {
    Name = "notification-sender-${var.environment_suffix}"
  })
}

# ================================
# API Gateway
# ================================

# IAM role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch_role" {
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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_logs" {
  role       = aws_iam_role.api_gateway_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# API Gateway account settings
resource "aws_api_gateway_account" "api_gateway_account" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}

resource "aws_api_gateway_rest_api" "payment_api" {
  name        = "payment-api-${var.environment_suffix}"
  description = "Serverless Payment Webhook Processing API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "payment-api-${var.environment_suffix}"
  })
}

# API Gateway Request Validators
resource "aws_api_gateway_request_validator" "payment_validator" {
  name                        = "payment-validator"
  rest_api_id                 = aws_api_gateway_rest_api.payment_api.id
  validate_request_body       = true
  validate_request_parameters = true
}

# API Gateway Models for Request Validation
resource "aws_api_gateway_model" "webhook_payment_model" {
  rest_api_id  = aws_api_gateway_rest_api.payment_api.id
  name         = "WebhookPaymentModel"
  content_type = "application/json"

  schema = jsonencode({
    type     = "object"
    required = ["transaction_id", "amount", "currency", "status"]
    properties = {
      transaction_id = {
        type    = "string"
        pattern = "^[a-zA-Z0-9_-]+$"
      }
      amount = {
        type    = "number"
        minimum = 0
      }
      currency = {
        type = "string"
        enum = ["USD", "EUR", "GBP"]
      }
      status = {
        type = "string"
        enum = ["pending", "completed", "failed"]
      }
      timestamp = {
        type   = "string"
        format = "date-time"
      }
    }
  })
}

resource "aws_api_gateway_model" "notification_model" {
  rest_api_id  = aws_api_gateway_rest_api.payment_api.id
  name         = "NotificationModel"
  content_type = "application/json"

  schema = jsonencode({
    type     = "object"
    required = ["email", "template"]
    properties = {
      email = {
        type   = "string"
        format = "email"
      }
      template = {
        type = "string"
        enum = ["payment_confirmation", "payment_failed", "payment_pending"]
      }
      custom_message = {
        type      = "string"
        maxLength = 500
      }
    }
  })
}

# Resources and Methods

# /webhooks resource
resource "aws_api_gateway_resource" "webhooks" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "webhooks"
}

# /webhooks/payment resource
resource "aws_api_gateway_resource" "payment" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_resource.webhooks.id
  path_part   = "payment"
}

# /transactions resource
resource "aws_api_gateway_resource" "transactions" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "transactions"
}

# /transactions/{id} resource
resource "aws_api_gateway_resource" "transaction_id" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_resource.transactions.id
  path_part   = "{id}"
}

# /transactions/{id}/notify resource
resource "aws_api_gateway_resource" "notify" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_resource.transaction_id.id
  path_part   = "notify"
}

# POST /webhooks/payment method
resource "aws_api_gateway_method" "webhook_payment_post" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.payment.id
  http_method   = "POST"
  authorization = "AWS_IAM"

  request_validator_id = aws_api_gateway_request_validator.payment_validator.id
  request_models = {
    "application/json" = aws_api_gateway_model.webhook_payment_model.name
  }
}

# GET /transactions/{id} method
resource "aws_api_gateway_method" "transaction_get" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.transaction_id.id
  http_method   = "GET"
  authorization = "AWS_IAM"

  request_parameters = {
    "method.request.path.id" = true
  }
}

# POST /transactions/{id}/notify method
resource "aws_api_gateway_method" "notification_post" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.notify.id
  http_method   = "POST"
  authorization = "AWS_IAM"

  request_validator_id = aws_api_gateway_request_validator.payment_validator.id
  request_models = {
    "application/json" = aws_api_gateway_model.notification_model.name
  }
  request_parameters = {
    "method.request.path.id" = true
  }
}

# Lambda Integrations
resource "aws_api_gateway_integration" "webhook_payment_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.payment.id
  http_method             = aws_api_gateway_method.webhook_payment_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.webhook_processor.invoke_arn
}

resource "aws_api_gateway_integration" "transaction_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.transaction_id.id
  http_method             = aws_api_gateway_method.transaction_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transaction_reader.invoke_arn
}

resource "aws_api_gateway_integration" "notification_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.notify.id
  http_method             = aws_api_gateway_method.notification_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.notification_sender.invoke_arn
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "webhook_processor_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "transaction_reader_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_reader.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "notification_sender_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification_sender.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "payment_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id

  depends_on = [
    aws_api_gateway_method.webhook_payment_post,
    aws_api_gateway_method.transaction_get,
    aws_api_gateway_method.notification_post,
    aws_api_gateway_integration.webhook_payment_integration,
    aws_api_gateway_integration.transaction_integration,
    aws_api_gateway_integration.notification_integration
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.payment_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  stage_name    = "prod"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      error          = "$context.error.message"
      errorType      = "$context.error.messageString"
    })
  }

  depends_on = [aws_api_gateway_account.api_gateway_account]

  tags = merge(local.common_tags, {
    Name = "payment-api-prod-${var.environment_suffix}"
  })
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled    = true
    logging_level      = "INFO"
    data_trace_enabled = true
  }
}

# ================================
# Outputs
# ================================

output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.payment_transactions.name
}

output "sqs_queue_url" {
  description = "SQS queue URL"
  value       = aws_sqs_queue.notification_queue.url
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.payment_system.key_id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for email notifications"
  value       = aws_sns_topic.email_notifications.arn
}