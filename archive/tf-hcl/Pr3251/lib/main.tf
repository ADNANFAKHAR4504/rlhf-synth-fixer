terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# SQS FIFO Queue for quiz submissions
resource "aws_sqs_queue" "quiz_submissions_fifo" {
  name                        = "quiz-submissions-${var.environment_suffix}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "queue"
  fifo_throughput_limit       = "perQueue"
  message_retention_seconds   = 345600 # 4 days
  visibility_timeout_seconds  = 70     # Lambda timeout + buffer
  receive_wait_time_seconds   = 20     # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.quiz_submissions_dlq.arn
    maxReceiveCount     = 3
  })

  tags = var.tags
}

# Dead Letter Queue for failed submissions
resource "aws_sqs_queue" "quiz_submissions_dlq" {
  name                      = "quiz-submissions-dlq-${var.environment_suffix}.fifo"
  fifo_queue                = true
  message_retention_seconds = 1209600 # 14 days

  tags = var.tags
}

# DynamoDB table for quiz results
resource "aws_dynamodb_table" "quiz_results" {
  name         = "quiz-results-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "student_id"
  range_key    = "submission_timestamp"

  attribute {
    name = "student_id"
    type = "S"
  }

  attribute {
    name = "submission_timestamp"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.tags
}

# IAM role for Lambda function
resource "aws_iam_role" "lambda_execution_role" {
  name = "quiz-processor-lambda-role-${var.environment_suffix}"

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

  tags = var.tags
}

# IAM policy for Lambda function
resource "aws_iam_policy" "lambda_policy" {
  name = "quiz-processor-lambda-policy-${var.environment_suffix}"

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
        Resource = aws_sqs_queue.quiz_submissions_fifo.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.quiz_results.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
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

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Lambda function for quiz processing
resource "aws_lambda_function" "quiz_processor" {
  filename         = "lambda_function.zip"
  function_name    = "quiz-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "quiz_processor.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE_NAME   = aws_dynamodb_table.quiz_results.name
      AWS_XRAY_TRACING_NAME = "quiz-processor"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = var.tags
}

# Archive Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "quiz_processor.py"
  output_path = "lambda_function.zip"
}

# SQS to Lambda event source mapping
resource "aws_lambda_event_source_mapping" "sqs_lambda_trigger" {
  event_source_arn                   = aws_sqs_queue.quiz_submissions_fifo.arn
  function_name                      = aws_lambda_function.quiz_processor.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  scaling_config {
    maximum_concurrency = 5
  }
}

# CloudWatch alarm for queue depth
resource "aws_cloudwatch_metric_alarm" "queue_depth_alarm" {
  alarm_name          = "quiz-queue-depth-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Triggers when quiz queue depth exceeds 100 messages"

  dimensions = {
    QueueName = aws_sqs_queue.quiz_submissions_fifo.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "quiz-processing-alerts-${var.environment_suffix}"

  tags = var.tags
}

# IAM role for EventBridge Scheduler
resource "aws_iam_role" "scheduler_role" {
  name = "quiz-health-check-scheduler-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM policy for EventBridge Scheduler
resource "aws_iam_policy" "scheduler_policy" {
  name = "quiz-health-check-scheduler-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.health_check.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "scheduler_policy_attachment" {
  role       = aws_iam_role.scheduler_role.name
  policy_arn = aws_iam_policy.scheduler_policy.arn
}

# Lambda function for health checks
resource "aws_lambda_function" "health_check" {
  filename         = "health_check.zip"
  function_name    = "quiz-queue-health-check-${var.environment_suffix}"
  role             = aws_iam_role.health_check_role.arn
  handler          = "health_check.lambda_handler"
  source_code_hash = data.archive_file.health_check_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      QUEUE_URL     = aws_sqs_queue.quiz_submissions_fifo.id
      DLQ_URL       = aws_sqs_queue.quiz_submissions_dlq.id
      SNS_TOPIC_ARN = aws_sns_topic.alerts.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = var.tags
}

# Archive health check Lambda function code
data "archive_file" "health_check_zip" {
  type        = "zip"
  source_file = "health_check.py"
  output_path = "health_check.zip"
}

# IAM role for health check Lambda
resource "aws_iam_role" "health_check_role" {
  name = "quiz-health-check-lambda-role-${var.environment_suffix}"

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

  tags = var.tags
}

# IAM policy for health check Lambda
resource "aws_iam_policy" "health_check_policy" {
  name = "quiz-health-check-lambda-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.quiz_submissions_fifo.arn,
          aws_sqs_queue.quiz_submissions_dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
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

resource "aws_iam_role_policy_attachment" "health_check_policy_attachment" {
  role       = aws_iam_role.health_check_role.name
  policy_arn = aws_iam_policy.health_check_policy.arn
}

# EventBridge Scheduler for periodic health checks
resource "aws_scheduler_schedule" "health_check_schedule" {
  name       = "quiz-queue-health-check-schedule-${var.environment_suffix}"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(5 minutes)"

  target {
    arn      = aws_lambda_function.health_check.arn
    role_arn = aws_iam_role.scheduler_role.arn

    retry_policy {
      maximum_event_age_in_seconds = 3600
      maximum_retry_attempts       = 3
    }
  }
}