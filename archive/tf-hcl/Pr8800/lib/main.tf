terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# DynamoDB Table for Market Data Storage
resource "aws_dynamodb_table" "market_data" {
  name           = "market-data-${var.environment_suffix}"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "event_id"
  range_key      = "timestamp"
  stream_enabled = false

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "exchange"
    type = "S"
  }

  attribute {
    name = "symbol"
    type = "S"
  }

  global_secondary_index {
    name            = "ExchangeIndex"
    hash_key        = "exchange"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "SymbolIndex"
    hash_key        = "symbol"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiration_time"
    enabled        = true
  }

  tags = {
    Name = "market-data-${var.environment_suffix}"
  }
}

# DynamoDB Table for Audit Trail
resource "aws_dynamodb_table" "audit_trail" {
  name           = "audit-trail-${var.environment_suffix}"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "audit_id"
  range_key      = "timestamp"
  stream_enabled = false

  attribute {
    name = "audit_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "event_type"
    type = "S"
  }

  global_secondary_index {
    name            = "EventTypeIndex"
    hash_key        = "event_type"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "audit-trail-${var.environment_suffix}"
  }
}

# EventBridge Event Bus
resource "aws_cloudwatch_event_bus" "market_data" {
  name = "market-data-bus-${var.environment_suffix}"

  tags = {
    Name = "market-data-bus-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "market_processor" {
  name              = "/aws/lambda/market-processor-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "market-processor-logs-${var.environment_suffix}"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_execution" {
  name = "market-processor-lambda-role-${var.environment_suffix}"

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
    Name = "market-processor-lambda-role-${var.environment_suffix}"
  }
}

# IAM Policy for Lambda DynamoDB Access
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "lambda-dynamodb-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.market_data.arn,
          "${aws_dynamodb_table.market_data.arn}/index/*",
          aws_dynamodb_table.audit_trail.arn,
          "${aws_dynamodb_table.audit_trail.arn}/index/*"
        ]
      }
    ]
  })
}

# IAM Policy for Lambda CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logging" {
  name = "lambda-logging-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_execution.id

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
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/market-processor-${var.environment_suffix}:*"
      }
    ]
  })
}

# SQS Dead Letter Queue for Failed Events
resource "aws_sqs_queue" "dlq" {
  name                      = "market-processor-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name = "market-processor-dlq-${var.environment_suffix}"
  }
}

# Lambda Function Package
data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda_package.zip"
}

# Lambda Function
resource "aws_lambda_function" "market_processor" {
  filename         = data.archive_file.lambda_package.output_path
  function_name    = "market-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "handler.lambda_handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory

  environment {
    variables = {
      MARKET_DATA_TABLE = aws_dynamodb_table.market_data.name
      AUDIT_TRAIL_TABLE = aws_dynamodb_table.audit_trail.name
      ENVIRONMENT       = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.market_processor,
    aws_iam_role_policy.lambda_dynamodb,
    aws_iam_role_policy.lambda_logging
  ]

  tags = {
    Name = "market-processor-${var.environment_suffix}"
  }
}

# IAM Policy for Lambda to Send to DLQ
resource "aws_iam_role_policy" "lambda_dlq" {
  name = "lambda-dlq-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}

# EventBridge Rule for Trade Events
resource "aws_cloudwatch_event_rule" "trade_events" {
  name           = "trade-events-rule-${var.environment_suffix}"
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  description    = "Route trade execution events to Lambda processor"

  event_pattern = jsonencode({
    source      = ["market.data"]
    detail-type = ["Trade Execution", "Trade Update"]
  })

  tags = {
    Name = "trade-events-rule-${var.environment_suffix}"
  }
}

# EventBridge Rule for Quote Events
resource "aws_cloudwatch_event_rule" "quote_events" {
  name           = "quote-events-rule-${var.environment_suffix}"
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  description    = "Route market quote events to Lambda processor"

  event_pattern = jsonencode({
    source      = ["market.data"]
    detail-type = ["Market Quote", "Price Update"]
  })

  tags = {
    Name = "quote-events-rule-${var.environment_suffix}"
  }
}

# EventBridge Target for Trade Events
resource "aws_cloudwatch_event_target" "trade_lambda" {
  rule           = aws_cloudwatch_event_rule.trade_events.name
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  target_id      = "trade-lambda-target"
  arn            = aws_lambda_function.market_processor.arn

  retry_policy {
    maximum_retry_attempts = 2
  }

  dead_letter_config {
    arn = aws_sqs_queue.dlq.arn
  }
}

# EventBridge Target for Quote Events
resource "aws_cloudwatch_event_target" "quote_lambda" {
  rule           = aws_cloudwatch_event_rule.quote_events.name
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  target_id      = "quote-lambda-target"
  arn            = aws_lambda_function.market_processor.arn

  retry_policy {
    maximum_retry_attempts = 2
  }

  dead_letter_config {
    arn = aws_sqs_queue.dlq.arn
  }
}

# Lambda Permission for EventBridge Trade Events
resource "aws_lambda_permission" "eventbridge_trade" {
  statement_id  = "AllowEventBridgeTradeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.market_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.trade_events.arn
}

# Lambda Permission for EventBridge Quote Events
resource "aws_lambda_permission" "eventbridge_quote" {
  statement_id  = "AllowEventBridgeQuoteInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.market_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.quote_events.arn
}

# CloudWatch Alarm for Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "market-processor-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda function has more than 5 errors in 1 minute"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.market_processor.function_name
  }

  tags = {
    Name = "market-processor-errors-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Lambda Duration
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "market-processor-duration-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 5000
  alarm_description   = "Alert when Lambda function average duration exceeds 5 seconds"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.market_processor.function_name
  }

  tags = {
    Name = "market-processor-duration-${var.environment_suffix}"
  }
}
