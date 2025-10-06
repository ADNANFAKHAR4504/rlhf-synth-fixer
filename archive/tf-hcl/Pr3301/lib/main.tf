# main.tf

locals {
  suffix = var.environment_suffix != "" ? "-${var.environment_suffix}" : ""
  common_tags = {
    Environment = var.environment
    Service     = var.service_name
    ManagedBy   = "Terraform"
  }
}

# Data source for Lambda deployment package
data "archive_file" "lambda_package" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_deployment.zip"
}

# DynamoDB Table for order status tracking
resource "aws_dynamodb_table" "order_status" {
  name         = "order-processing-status${local.suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "order_id"

  attribute {
    name = "order_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "order-processing-status${local.suffix}"
  })
}

# Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                      = "order-processing-dlq${local.suffix}"
  message_retention_seconds = var.dlq_message_retention_days * 24 * 60 * 60

  tags = merge(local.common_tags, {
    Name = "order-processing-dlq${local.suffix}"
    Type = "DeadLetterQueue"
  })
}

# Main SQS Queue
resource "aws_sqs_queue" "order_queue" {
  name                       = "order-processing-queue${local.suffix}"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = var.sqs_message_retention_days * 24 * 60 * 60

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(local.common_tags, {
    Name = "order-processing-queue${local.suffix}"
    Type = "StandardQueue"
  })
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "order-processing-lambda-role${local.suffix}"

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

# IAM Policy for Lambda
resource "aws_iam_policy" "lambda_policy" {
  name        = "order-processing-lambda-policy${local.suffix}"
  description = "Policy for order processing Lambda function"

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
        Resource = aws_sqs_queue.order_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.order_status.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Attach AWS managed policy for basic Lambda execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/order-processing${local.suffix}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "order-processing-lambda-logs${local.suffix}"
  })
}

# Lambda Function
resource "aws_lambda_function" "order_processor" {
  filename                       = data.archive_file.lambda_package.output_path
  function_name                  = "order-processing-function${local.suffix}"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "lambda_function.lambda_handler"
  source_code_hash               = data.archive_file.lambda_package.output_base64sha256
  runtime                        = "python3.10"
  memory_size                    = var.lambda_memory_size
  timeout                        = var.lambda_timeout
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.order_status.name
      DLQ_URL             = aws_sqs_queue.dlq.url
      REGION              = var.aws_region
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = merge(local.common_tags, {
    Name = "order-processing-function${local.suffix}"
  })
}

# SQS to Lambda Event Source Mapping
resource "aws_lambda_event_source_mapping" "sqs_lambda_trigger" {
  event_source_arn = aws_sqs_queue.order_queue.arn
  function_name    = aws_lambda_function.order_processor.arn
  batch_size       = var.sqs_batch_size
  enabled          = true

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment
  ]
}

# CloudWatch Metric Alarm for DLQ
resource "aws_cloudwatch_metric_alarm" "dlq_alarm" {
  alarm_name          = "order-processing-dlq-messages${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.dlq_alarm_threshold
  alarm_description   = "Alert when DLQ has more than ${var.dlq_alarm_threshold} messages"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  tags = merge(local.common_tags, {
    Name = "order-processing-dlq-alarm${local.suffix}"
  })
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "order_processing" {
  dashboard_name = "order-processing-dashboard${local.suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { stat = "Average", label = "Messages in Queue" }],
            [".", "NumberOfMessagesReceived", { stat = "Sum", label = "Messages Received" }],
            [".", "NumberOfMessagesDeleted", { stat = "Sum", label = "Messages Processed" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Order Queue Metrics"
          dimensions = {
            QueueName = aws_sqs_queue.order_queue.name
          }
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Errors" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration (ms)" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Metrics"
          dimensions = {
            FunctionName = aws_lambda_function.order_processor.function_name
          }
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { stat = "Average", label = "Messages in DLQ" }]
          ]
          view   = "singleValue"
          region = var.aws_region
          title  = "Dead Letter Queue"
          dimensions = {
            QueueName = aws_sqs_queue.dlq.name
          }
          period = 300
        }
      },
      {
        type = "log"
        properties = {
          query  = "SOURCE '${aws_cloudwatch_log_group.lambda_logs.name}' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region = var.aws_region
          title  = "Recent Lambda Logs"
        }
      }
    ]
  })
}

# Enable CloudWatch Insights for Lambda logs
resource "aws_cloudwatch_query_definition" "order_processing_insights" {
  name = "order-processing-insights${local.suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.lambda_logs.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream, @log
    | filter @message like /ERROR|WARNING|PROCESSED/
    | stats count() by bin(5m)
  QUERY
}