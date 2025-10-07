# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 Bucket for receipt uploads
resource "aws_s3_bucket" "receipts" {
  bucket = "${var.project_name}-${var.environment_suffix}-receipts-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-receipts"
  })
}

resource "aws_s3_bucket_versioning" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  rule {
    id     = "transition-old-receipts"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }

    noncurrent_version_expiration {
      noncurrent_days = 180
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

resource "aws_s3_bucket_notification" "receipt_upload" {
  bucket = aws_s3_bucket.receipts.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.process_trigger.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ""
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# DynamoDB table for expense records
resource "aws_dynamodb_table" "expenses" {
  name         = "${var.project_name}-${var.environment_suffix}-expenses"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "expense_id"
  range_key    = "user_id"

  attribute {
    name = "expense_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "expense_date"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  global_secondary_index {
    name            = "user-date-index"
    hash_key        = "user_id"
    range_key       = "expense_date"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "category-date-index"
    hash_key        = "category"
    range_key       = "expense_date"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-expenses"
  })
}

# SNS Topic for notifications
resource "aws_sns_topic" "processing_notifications" {
  name = "${var.project_name}-${var.environment_suffix}-processing-notifications"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-notifications"
  })
}

resource "aws_sns_topic_subscription" "email_notification" {
  topic_arn = aws_sns_topic.processing_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# SQS Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project_name}-${var.environment_suffix}-processing-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-dlq"
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-ocr-processor"
  retention_in_days = 14

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-lambda-logs"
  })
}

resource "aws_cloudwatch_log_group" "step_function_logs" {
  name              = "/aws/stepfunctions/${var.project_name}-${var.environment_suffix}-processing"
  retention_in_days = 14

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-stepfunction-logs"
  })
}

# CloudWatch Metrics and Alarms
resource "aws_cloudwatch_metric_alarm" "processing_errors" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-processing-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors step function execution failures"
  alarm_actions       = [aws_sns_topic.processing_notifications.arn]

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.receipt_processing.arn
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda function errors"
  alarm_actions       = [aws_sns_topic.processing_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.ocr_processor.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "5"
  alarm_description   = "Alert when messages are in DLQ"
  alarm_actions       = [aws_sns_topic.processing_notifications.arn]

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }
}