# KMS Key for DynamoDB and SQS encryption
resource "aws_kms_key" "webhook_kms" {
  description             = "KMS key for webhook system encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "webhook-kms-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_kms_alias" "webhook_kms_alias" {
  name          = "alias/webhook-kms-${var.environment_suffix}"
  target_key_id = aws_kms_key.webhook_kms.key_id
}

# DynamoDB Table for webhook storage
resource "aws_dynamodb_table" "webhooks" {
  name         = "webhooks-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "webhook_id"

  attribute {
    name = "webhook_id"
    type = "S"
  }

  ttl {
    attribute_name = "expiry_time"
    enabled        = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.webhook_kms.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "webhooks-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Dead Letter Queue for SQS FIFO
resource "aws_sqs_queue" "webhook_dlq" {
  name                              = "webhook-dlq-${var.environment_suffix}.fifo"
  fifo_queue                        = true
  content_based_deduplication       = true
  kms_master_key_id                 = aws_kms_key.webhook_kms.id
  kms_data_key_reuse_period_seconds = 300

  tags = {
    Name        = "webhook-dlq-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# SQS FIFO Queue for webhook processing
resource "aws_sqs_queue" "webhook_queue" {
  name                              = "webhook-queue-${var.environment_suffix}.fifo"
  fifo_queue                        = true
  content_based_deduplication       = true
  visibility_timeout_seconds        = 300
  kms_master_key_id                 = aws_kms_key.webhook_kms.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.webhook_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "webhook-queue-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# SNS Topic for notifications
resource "aws_sns_topic" "webhook_notifications" {
  name              = "webhook-notifications-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.webhook_kms.id

  tags = {
    Name        = "webhook-notifications-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Log Group for validation Lambda
resource "aws_cloudwatch_log_group" "validation_lambda_logs" {
  name              = "/aws/lambda/webhook-validation-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "webhook-validation-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Log Group for processing Lambda
resource "aws_cloudwatch_log_group" "processing_lambda_logs" {
  name              = "/aws/lambda/webhook-processing-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "webhook-processing-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Role for validation Lambda
resource "aws_iam_role" "validation_lambda_role" {
  name = "webhook-validation-lambda-${var.environment_suffix}"

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
    Name        = "webhook-validation-lambda-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Policy for validation Lambda
resource "aws_iam_role_policy" "validation_lambda_policy" {
  name = "webhook-validation-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.validation_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.webhooks.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.webhook_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.webhook_kms.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.validation_lambda_logs.arn}:*"
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

# Dead Letter Queue for processing Lambda
resource "aws_sqs_queue" "processing_lambda_dlq" {
  name                              = "processing-lambda-dlq-${var.environment_suffix}"
  kms_master_key_id                 = aws_kms_key.webhook_kms.id
  kms_data_key_reuse_period_seconds = 300

  tags = {
    Name        = "processing-lambda-dlq-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Role for processing Lambda
resource "aws_iam_role" "processing_lambda_role" {
  name = "webhook-processing-lambda-${var.environment_suffix}"

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
    Name        = "webhook-processing-lambda-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Policy for processing Lambda
resource "aws_iam_role_policy" "processing_lambda_policy" {
  name = "webhook-processing-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.processing_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.webhook_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.webhook_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.webhook_kms.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.processing_lambda_logs.arn}:*"
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

# Validation Lambda Function
resource "aws_lambda_function" "webhook_validation" {
  filename         = "${path.module}/lambda/validation.zip"
  function_name    = "webhook-validation-${var.environment_suffix}"
  role             = aws_iam_role.validation_lambda_role.arn
  handler          = "validation.lambda_handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/validation.zip")
  runtime          = "python3.9"
  memory_size      = 512
  timeout          = 30

  reserved_concurrent_executions = 100

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.webhooks.name
      SQS_QUEUE_URL  = aws_sqs_queue.webhook_queue.id
    }
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.validation_lambda_logs]

  tags = {
    Name        = "webhook-validation-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Processing Lambda Function
resource "aws_lambda_function" "webhook_processing" {
  filename         = "${path.module}/lambda/processing.zip"
  function_name    = "webhook-processing-${var.environment_suffix}"
  role             = aws_iam_role.processing_lambda_role.arn
  handler          = "processing.lambda_handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/processing.zip")
  runtime          = "python3.9"
  memory_size      = 512
  timeout          = 60

  reserved_concurrent_executions = 100

  dead_letter_config {
    target_arn = aws_sqs_queue.processing_lambda_dlq.arn
  }

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.webhook_notifications.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.processing_lambda_logs]

  tags = {
    Name        = "webhook-processing-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Lambda Event Source Mapping for SQS
resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn = aws_sqs_queue.webhook_queue.arn
  function_name    = aws_lambda_function.webhook_processing.arn
  batch_size       = 10
  enabled          = true
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/webhook-api-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "webhook-api-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "webhook_api" {
  name        = "webhook-api-${var.environment_suffix}"
  description = "Webhook processing API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "webhook-api-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# API Gateway Resource (/webhooks)
resource "aws_api_gateway_resource" "webhooks" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_rest_api.webhook_api.root_resource_id
  path_part   = "webhooks"
}

# API Gateway Method (POST)
resource "aws_api_gateway_method" "post_webhook" {
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  resource_id   = aws_api_gateway_resource.webhooks.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration with Lambda
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.webhooks.id
  http_method             = aws_api_gateway_method.post_webhook.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.webhook_validation.invoke_arn
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_validation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "webhook_deployment" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id

  depends_on = [
    aws_api_gateway_integration.lambda_integration
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "webhook_stage" {
  deployment_id = aws_api_gateway_deployment.webhook_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  stage_name    = "prod"

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
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
    Name        = "webhook-api-stage-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# API Gateway Custom Domain
resource "aws_api_gateway_domain_name" "webhook_domain" {
  domain_name              = var.custom_domain_name
  regional_certificate_arn = var.acm_certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "webhook-domain-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# API Gateway Base Path Mapping
resource "aws_api_gateway_base_path_mapping" "webhook_mapping" {
  api_id      = aws_api_gateway_rest_api.webhook_api.id
  stage_name  = aws_api_gateway_stage.webhook_stage.stage_name
  domain_name = aws_api_gateway_domain_name.webhook_domain.domain_name
}

# CloudWatch Alarm for DLQ
resource "aws_cloudwatch_metric_alarm" "dlq_alarm" {
  alarm_name          = "webhook-dlq-messages-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when messages appear in DLQ"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.webhook_dlq.name
  }

  tags = {
    Name        = "webhook-dlq-alarm-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
