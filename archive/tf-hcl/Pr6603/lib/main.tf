# Data Sources
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "archive_file" "payment_api" {
  type        = "zip"
  source_file = "${path.module}/payment_api.py"
  output_path = "${path.module}/payment_api.zip"
}

data "archive_file" "fraud_detection" {
  type        = "zip"
  source_file = "${path.module}/fraud_detection.py"
  output_path = "${path.module}/fraud_detection.zip"
}

data "archive_file" "notification_service" {
  type        = "zip"
  source_file = "${path.module}/notification_service.py"
  output_path = "${path.module}/notification_service.zip"
}

# KMS Keys for Encryption
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7

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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/cloudwatch-logs-encryption-${var.environment}"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}

resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS topic encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7

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
        Sid    = "Allow SNS"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "sns" {
  name          = "alias/sns-encryption-${var.environment}"
  target_key_id = aws_kms_key.sns.key_id
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "payment_api" {
  name              = "/aws/lambda/payment-api-${var.environment}"
  retention_in_days = 1

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]
}

resource "aws_cloudwatch_log_group" "fraud_detection" {
  name              = "/aws/lambda/fraud-detection-${var.environment}"
  retention_in_days = 1

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]
}

resource "aws_cloudwatch_log_group" "notification_service" {
  name              = "/aws/lambda/notification-service-${var.environment}"
  retention_in_days = 1

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]
}

# IAM Roles and Policies for Lambda Functions
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Payment API Lambda IAM
resource "aws_iam_role" "payment_api" {
  name               = "lambda-payment-api-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "payment_api_logs" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.payment_api.arn}:*"
    ]
  }
}

resource "aws_iam_policy" "payment_api_logs" {
  name   = "payment-api-logs-policy-${var.environment}"
  policy = data.aws_iam_policy_document.payment_api_logs.json
}

resource "aws_iam_role_policy_attachment" "payment_api_logs" {
  role       = aws_iam_role.payment_api.name
  policy_arn = aws_iam_policy.payment_api_logs.arn
}

resource "aws_iam_role_policy_attachment" "payment_api_basic" {
  role       = aws_iam_role.payment_api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Fraud Detection Lambda IAM
resource "aws_iam_role" "fraud_detection" {
  name               = "lambda-fraud-detection-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "fraud_detection_logs" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.fraud_detection.arn}:*"
    ]
  }
}

resource "aws_iam_policy" "fraud_detection_logs" {
  name   = "fraud-detection-logs-policy-${var.environment}"
  policy = data.aws_iam_policy_document.fraud_detection_logs.json
}

resource "aws_iam_role_policy_attachment" "fraud_detection_logs" {
  role       = aws_iam_role.fraud_detection.name
  policy_arn = aws_iam_policy.fraud_detection_logs.arn
}

resource "aws_iam_role_policy_attachment" "fraud_detection_basic" {
  role       = aws_iam_role.fraud_detection.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Notification Service Lambda IAM
resource "aws_iam_role" "notification_service" {
  name               = "lambda-notification-service-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "notification_service_logs" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.notification_service.arn}:*"
    ]
  }
}

resource "aws_iam_policy" "notification_service_logs" {
  name   = "notification-service-logs-policy-${var.environment}"
  policy = data.aws_iam_policy_document.notification_service_logs.json
}

resource "aws_iam_role_policy_attachment" "notification_service_logs" {
  role       = aws_iam_role.notification_service.name
  policy_arn = aws_iam_policy.notification_service_logs.arn
}

resource "aws_iam_role_policy_attachment" "notification_service_basic" {
  role       = aws_iam_role.notification_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Functions
resource "aws_lambda_function" "payment_api" {
  function_name    = "lambda-payment-api-${var.environment}"
  role             = aws_iam_role.payment_api.arn
  handler          = "payment_api.lambda_handler"
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 60
  filename         = data.archive_file.payment_api.output_path
  source_code_hash = data.archive_file.payment_api.output_base64sha256

  depends_on = [
    aws_iam_role_policy_attachment.payment_api_logs,
    aws_iam_role_policy_attachment.payment_api_basic
  ]
}

resource "aws_lambda_function" "fraud_detection" {
  function_name    = "lambda-fraud-detection-${var.environment}"
  role             = aws_iam_role.fraud_detection.arn
  handler          = "fraud_detection.lambda_handler"
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 60
  filename         = data.archive_file.fraud_detection.output_path
  source_code_hash = data.archive_file.fraud_detection.output_base64sha256

  depends_on = [
    aws_iam_role_policy_attachment.fraud_detection_logs,
    aws_iam_role_policy_attachment.fraud_detection_basic
  ]
}

resource "aws_lambda_function" "notification_service" {
  function_name    = "lambda-notification-service-${var.environment}"
  role             = aws_iam_role.notification_service.arn
  handler          = "notification_service.lambda_handler"
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 60
  filename         = data.archive_file.notification_service.output_path
  source_code_hash = data.archive_file.notification_service.output_base64sha256

  depends_on = [
    aws_iam_role_policy_attachment.notification_service_logs,
    aws_iam_role_policy_attachment.notification_service_basic
  ]
}

# EventBridge Rules
resource "aws_cloudwatch_event_rule" "payment_api" {
  name                = "eventbridge-payment-api-trigger-${var.environment}"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "payment_api" {
  rule      = aws_cloudwatch_event_rule.payment_api.name
  target_id = "payment-api-target"
  arn       = aws_lambda_function.payment_api.arn
}

resource "aws_lambda_permission" "payment_api_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_api.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.payment_api.arn
}

resource "aws_cloudwatch_event_rule" "fraud_detection" {
  name                = "eventbridge-fraud-detection-trigger-${var.environment}"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "fraud_detection" {
  rule      = aws_cloudwatch_event_rule.fraud_detection.name
  target_id = "fraud-detection-target"
  arn       = aws_lambda_function.fraud_detection.arn
}

resource "aws_lambda_permission" "fraud_detection_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fraud_detection.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.fraud_detection.arn
}

resource "aws_cloudwatch_event_rule" "notification_service" {
  name                = "eventbridge-notification-trigger-${var.environment}"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "notification_service" {
  rule      = aws_cloudwatch_event_rule.notification_service.name
  target_id = "notification-service-target"
  arn       = aws_lambda_function.notification_service.arn
}

resource "aws_lambda_permission" "notification_service_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notification_service.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.notification_service.arn
}

# Metric Filters - Payment API
resource "aws_cloudwatch_log_metric_filter" "payment_api_error_rate" {
  name           = "payment-api-error-rate-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "{ $.status_code >= 400 }"

  metric_transformation {
    namespace     = "PaymentPlatform"
    name          = "payment_api_error_rate"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "payment_api_response_time" {
  name           = "payment-api-response-time-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "{ $.response_time_ms = * }"

  metric_transformation {
    namespace     = "PaymentPlatform"
    name          = "payment_api_response_time"
    value         = "$.response_time_ms"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "payment_api_transaction_volume" {
  name           = "payment-api-transaction-volume-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "{ $.transaction_id = * }"

  metric_transformation {
    namespace     = "PaymentPlatform"
    name          = "payment_api_transaction_volume"
    value         = "1"
    default_value = "0"
  }
}

# Metric Filters - Fraud Detection
resource "aws_cloudwatch_log_metric_filter" "fraud_high_risk_count" {
  name           = "fraud-high-risk-count-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.fraud_detection.name
  pattern        = "{ $.risk_score > 80 }"

  metric_transformation {
    namespace     = "PaymentPlatform"
    name          = "fraud_high_risk_transaction_count"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "fraud_rejection_rate" {
  name           = "fraud-rejection-rate-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.fraud_detection.name
  pattern        = "{ $.decision = \"reject\" }"

  metric_transformation {
    namespace     = "PaymentPlatform"
    name          = "fraud_rejection_rate"
    value         = "1"
    default_value = "0"
  }
}

# Metric Filters - Notification Service
resource "aws_cloudwatch_log_metric_filter" "notification_delivery_failure_rate" {
  name           = "notification-delivery-failure-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.notification_service.name
  pattern        = "{ $.delivery_status = \"failed\" }"

  metric_transformation {
    namespace     = "PaymentPlatform"
    name          = "notification_delivery_failure_rate"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "notification_retry_count" {
  name           = "notification-retry-count-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.notification_service.name
  pattern        = "{ $.retry_count = * }"

  metric_transformation {
    namespace     = "PaymentPlatform"
    name          = "notification_retry_count_total"
    value         = "$.retry_count"
    default_value = "0"
  }
}

# SNS Topics
resource "aws_sns_topic" "critical_alerts" {
  name              = "sns-payment-alerts-critical-${var.environment}"
  kms_master_key_id = aws_kms_key.sns.id
}

resource "aws_sns_topic" "warning_alerts" {
  name              = "sns-payment-alerts-warnings-${var.environment}"
  kms_master_key_id = aws_kms_key.sns.id
}

resource "aws_sns_topic_policy" "critical_alerts" {
  arn = aws_sns_topic.critical_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Allow CloudWatch Alarms"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.critical_alerts.arn
      }
    ]
  })
}

resource "aws_sns_topic_policy" "warning_alerts" {
  arn = aws_sns_topic.warning_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Allow CloudWatch Alarms"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.warning_alerts.arn
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "critical_email" {
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.critical_alert_email
}

resource "aws_sns_topic_subscription" "warning_email" {
  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.warnings_alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "payment_api_latency" {
  alarm_name          = "alarm-api-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "payment_api_response_time"
  namespace           = "PaymentPlatform"
  period              = "60"
  statistic           = "Average"
  threshold           = "500"
  alarm_description   = "Payment API response time exceeds 500ms"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.critical_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "payment_api_error_rate" {
  alarm_name          = "alarm-api-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "5"
  metric_name         = "payment_api_error_rate"
  namespace           = "PaymentPlatform"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Payment API error rate above 1%"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.critical_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "payment_transaction_failure" {
  alarm_name          = "alarm-transaction-failure-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "payment_api_error_rate"
  namespace           = "PaymentPlatform"
  period              = "60"
  statistic           = "Average"
  threshold           = "0.5"
  alarm_description   = "Transaction failure rate exceeds 0.5%"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.warning_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "fraud_high_risk_spike" {
  alarm_name          = "alarm-high-risk-spike-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "fraud_high_risk_transaction_count"
  namespace           = "PaymentPlatform"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "High-risk transaction spike detected"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.warning_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "fraud_rejection_rate" {
  alarm_name          = "alarm-rejection-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "fraud_rejection_rate"
  namespace           = "PaymentPlatform"
  period              = "300"
  statistic           = "Average"
  threshold           = "15"
  alarm_description   = "Fraud rejection rate exceeds 15%"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.warning_alerts.arn]
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "payment_platform" {
  dashboard_name = "payment-platform-monitoring-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["PaymentPlatform", "payment_api_response_time", { stat = "Average", label = "Avg Response Time" }],
            [".", "payment_api_error_rate", { stat = "Sum", label = "Error Count" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Payment API Performance"
          yAxis = {
            left = {
              label = "Milliseconds / Count"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["PaymentPlatform", "payment_api_transaction_volume", { stat = "Sum", label = "Total Transactions" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Transaction Volume"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["PaymentPlatform", "fraud_high_risk_transaction_count", { stat = "Sum", label = "High Risk Transactions" }],
            [".", "fraud_rejection_rate", { stat = "Average", label = "Rejection Rate" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Fraud Detection Metrics"
          yAxis = {
            left = {
              label = "Count / Percentage"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["PaymentPlatform", "notification_delivery_failure_rate", { stat = "Sum", label = "Delivery Failures" }],
            [".", "notification_retry_count_total", { stat = "Sum", label = "Total Retries" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Notification Service Metrics"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.payment_api.function_name, { stat = "Average" }],
            ["...", aws_lambda_function.fraud_detection.function_name, { stat = "Average" }],
            ["...", aws_lambda_function.notification_service.function_name, { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Lambda Duration by Function"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.payment_api.function_name, { stat = "Sum" }],
            ["...", aws_lambda_function.fraud_detection.function_name, { stat = "Sum" }],
            ["...", aws_lambda_function.notification_service.function_name, { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Lambda Errors by Function"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.payment_api.function_name, { stat = "Sum" }],
            ["...", aws_lambda_function.fraud_detection.function_name, { stat = "Sum" }],
            ["...", aws_lambda_function.notification_service.function_name, { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Lambda Invocations by Function"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      }
    ]
  })
}

# CloudWatch Logs Insights Saved Queries
resource "aws_cloudwatch_query_definition" "high_value_failed_transactions" {
  name = "high-value-failed-transactions"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name
  ]

  query_string = <<EOF
fields @timestamp, transaction_id, amount, status_code, error_message
| filter amount > 1000 and status_code >= 400
| sort @timestamp desc
EOF
}

resource "aws_cloudwatch_query_definition" "fraud_detection_rejections" {
  name = "fraud-detection-rejections"

  log_group_names = [
    aws_cloudwatch_log_group.fraud_detection.name
  ]

  query_string = <<EOF
fields @timestamp, transaction_id, risk_score, decision
| filter decision = "reject"
| sort risk_score desc
EOF
}

resource "aws_cloudwatch_query_definition" "notification_delivery_failures" {
  name = "notification-delivery-failures"

  log_group_names = [
    aws_cloudwatch_log_group.notification_service.name
  ]

  query_string = <<EOF
fields @timestamp, notification_type, recipient, delivery_status, retry_count
| filter delivery_status = "failed"
| sort retry_count desc
EOF
}

resource "aws_cloudwatch_query_definition" "slow_api_responses" {
  name = "slow-api-responses"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name
  ]

  query_string = <<EOF
fields @timestamp, transaction_id, response_time_ms
| filter response_time_ms > 500
| sort response_time_ms desc
EOF
}

# S3 Bucket for Log Archival (Optional)
resource "aws_s3_bucket" "log_archive" {
  bucket        = "s3-cloudwatch-logs-archive-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "log_archive" {
  bucket = aws_s3_bucket.log_archive.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "log_archive" {
  bucket = aws_s3_bucket.log_archive.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_archive" {
  bucket = aws_s3_bucket.log_archive.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudwatch_logs.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_policy" "log_archive" {
  bucket = aws_s3_bucket.log_archive.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.log_archive.arn,
          "${aws_s3_bucket.log_archive.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "log_archive" {
  bucket = aws_s3_bucket.log_archive.id

  rule {
    id     = "archive-logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
  }
}

# Outputs
output "kms_logs_key_id" {
  description = "CloudWatch Logs KMS key ID"
  value       = aws_kms_key.cloudwatch_logs.key_id
}

output "kms_logs_key_arn" {
  description = "CloudWatch Logs KMS key ARN"
  value       = aws_kms_key.cloudwatch_logs.arn
}

output "kms_sns_key_id" {
  description = "SNS KMS key ID"
  value       = aws_kms_key.sns.key_id
}

output "kms_sns_key_arn" {
  description = "SNS KMS key ARN"
  value       = aws_kms_key.sns.arn
}

output "kms_logs_alias_name" {
  description = "CloudWatch Logs KMS key alias name"
  value       = aws_kms_alias.cloudwatch_logs.name
}

output "kms_sns_alias_name" {
  description = "SNS KMS key alias name"
  value       = aws_kms_alias.sns.name
}

output "log_group_payment_api_name" {
  description = "Payment API log group name"
  value       = aws_cloudwatch_log_group.payment_api.name
}

output "log_group_payment_api_arn" {
  description = "Payment API log group ARN"
  value       = aws_cloudwatch_log_group.payment_api.arn
}

output "log_group_fraud_detection_name" {
  description = "Fraud detection log group name"
  value       = aws_cloudwatch_log_group.fraud_detection.name
}

output "log_group_fraud_detection_arn" {
  description = "Fraud detection log group ARN"
  value       = aws_cloudwatch_log_group.fraud_detection.arn
}

output "log_group_notification_service_name" {
  description = "Notification service log group name"
  value       = aws_cloudwatch_log_group.notification_service.name
}

output "log_group_notification_service_arn" {
  description = "Notification service log group ARN"
  value       = aws_cloudwatch_log_group.notification_service.arn
}

output "lambda_payment_api_name" {
  description = "Payment API Lambda function name"
  value       = aws_lambda_function.payment_api.function_name
}

output "lambda_payment_api_arn" {
  description = "Payment API Lambda function ARN"
  value       = aws_lambda_function.payment_api.arn
}

output "lambda_payment_api_role_arn" {
  description = "Payment API Lambda IAM role ARN"
  value       = aws_iam_role.payment_api.arn
}

output "lambda_fraud_detection_name" {
  description = "Fraud detection Lambda function name"
  value       = aws_lambda_function.fraud_detection.function_name
}

output "lambda_fraud_detection_arn" {
  description = "Fraud detection Lambda function ARN"
  value       = aws_lambda_function.fraud_detection.arn
}

output "lambda_fraud_detection_role_arn" {
  description = "Fraud detection Lambda IAM role ARN"
  value       = aws_iam_role.fraud_detection.arn
}

output "lambda_notification_service_name" {
  description = "Notification service Lambda function name"
  value       = aws_lambda_function.notification_service.function_name
}

output "lambda_notification_service_arn" {
  description = "Notification service Lambda function ARN"
  value       = aws_lambda_function.notification_service.arn
}

output "lambda_notification_service_role_arn" {
  description = "Notification service Lambda IAM role ARN"
  value       = aws_iam_role.notification_service.arn
}

output "eventbridge_payment_api_rule_name" {
  description = "Payment API EventBridge rule name"
  value       = aws_cloudwatch_event_rule.payment_api.name
}

output "eventbridge_payment_api_rule_arn" {
  description = "Payment API EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.payment_api.arn
}

output "eventbridge_fraud_detection_rule_name" {
  description = "Fraud detection EventBridge rule name"
  value       = aws_cloudwatch_event_rule.fraud_detection.name
}

output "eventbridge_fraud_detection_rule_arn" {
  description = "Fraud detection EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.fraud_detection.arn
}

output "eventbridge_notification_service_rule_name" {
  description = "Notification service EventBridge rule name"
  value       = aws_cloudwatch_event_rule.notification_service.name
}

output "eventbridge_notification_service_rule_arn" {
  description = "Notification service EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.notification_service.arn
}

output "metric_filter_payment_api_error_rate" {
  description = "Payment API error rate metric filter name"
  value       = aws_cloudwatch_log_metric_filter.payment_api_error_rate.name
}

output "metric_filter_payment_api_response_time" {
  description = "Payment API response time metric filter name"
  value       = aws_cloudwatch_log_metric_filter.payment_api_response_time.name
}

output "metric_filter_payment_api_transaction_volume" {
  description = "Payment API transaction volume metric filter name"
  value       = aws_cloudwatch_log_metric_filter.payment_api_transaction_volume.name
}

output "metric_filter_fraud_high_risk_count" {
  description = "Fraud high risk count metric filter name"
  value       = aws_cloudwatch_log_metric_filter.fraud_high_risk_count.name
}

output "metric_filter_fraud_rejection_rate" {
  description = "Fraud rejection rate metric filter name"
  value       = aws_cloudwatch_log_metric_filter.fraud_rejection_rate.name
}

output "metric_filter_notification_delivery_failure_rate" {
  description = "Notification delivery failure rate metric filter name"
  value       = aws_cloudwatch_log_metric_filter.notification_delivery_failure_rate.name
}

output "metric_filter_notification_retry_count" {
  description = "Notification retry count metric filter name"
  value       = aws_cloudwatch_log_metric_filter.notification_retry_count.name
}

output "alarm_payment_api_latency_name" {
  description = "Payment API latency alarm name"
  value       = aws_cloudwatch_metric_alarm.payment_api_latency.alarm_name
}

output "alarm_payment_api_latency_arn" {
  description = "Payment API latency alarm ARN"
  value       = aws_cloudwatch_metric_alarm.payment_api_latency.arn
}

output "alarm_payment_api_error_rate_name" {
  description = "Payment API error rate alarm name"
  value       = aws_cloudwatch_metric_alarm.payment_api_error_rate.alarm_name
}

output "alarm_payment_api_error_rate_arn" {
  description = "Payment API error rate alarm ARN"
  value       = aws_cloudwatch_metric_alarm.payment_api_error_rate.arn
}

output "alarm_payment_transaction_failure_name" {
  description = "Payment transaction failure alarm name"
  value       = aws_cloudwatch_metric_alarm.payment_transaction_failure.alarm_name
}

output "alarm_payment_transaction_failure_arn" {
  description = "Payment transaction failure alarm ARN"
  value       = aws_cloudwatch_metric_alarm.payment_transaction_failure.arn
}

output "alarm_fraud_high_risk_spike_name" {
  description = "Fraud high risk spike alarm name"
  value       = aws_cloudwatch_metric_alarm.fraud_high_risk_spike.alarm_name
}

output "alarm_fraud_high_risk_spike_arn" {
  description = "Fraud high risk spike alarm ARN"
  value       = aws_cloudwatch_metric_alarm.fraud_high_risk_spike.arn
}

output "alarm_fraud_rejection_rate_name" {
  description = "Fraud rejection rate alarm name"
  value       = aws_cloudwatch_metric_alarm.fraud_rejection_rate.alarm_name
}

output "alarm_fraud_rejection_rate_arn" {
  description = "Fraud rejection rate alarm ARN"
  value       = aws_cloudwatch_metric_alarm.fraud_rejection_rate.arn
}

output "sns_critical_topic_name" {
  description = "Critical alerts SNS topic name"
  value       = aws_sns_topic.critical_alerts.name
}

output "sns_critical_topic_arn" {
  description = "Critical alerts SNS topic ARN"
  value       = aws_sns_topic.critical_alerts.arn
  sensitive   = true
}

output "sns_warning_topic_name" {
  description = "Warning alerts SNS topic name"
  value       = aws_sns_topic.warning_alerts.name
}

output "sns_warning_topic_arn" {
  description = "Warning alerts SNS topic ARN"
  value       = aws_sns_topic.warning_alerts.arn
  sensitive   = true
}

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.payment_platform.dashboard_name
}

output "dashboard_arn" {
  description = "CloudWatch dashboard ARN"
  value       = aws_cloudwatch_dashboard.payment_platform.dashboard_arn
}

output "query_high_value_failed_transactions_id" {
  description = "High value failed transactions query ID"
  value       = aws_cloudwatch_query_definition.high_value_failed_transactions.query_definition_id
}

output "query_high_value_failed_transactions_name" {
  description = "High value failed transactions query name"
  value       = aws_cloudwatch_query_definition.high_value_failed_transactions.name
}

output "query_fraud_detection_rejections_id" {
  description = "Fraud detection rejections query ID"
  value       = aws_cloudwatch_query_definition.fraud_detection_rejections.query_definition_id
}

output "query_fraud_detection_rejections_name" {
  description = "Fraud detection rejections query name"
  value       = aws_cloudwatch_query_definition.fraud_detection_rejections.name
}

output "query_notification_delivery_failures_id" {
  description = "Notification delivery failures query ID"
  value       = aws_cloudwatch_query_definition.notification_delivery_failures.query_definition_id
}

output "query_notification_delivery_failures_name" {
  description = "Notification delivery failures query name"
  value       = aws_cloudwatch_query_definition.notification_delivery_failures.name
}

output "query_slow_api_responses_id" {
  description = "Slow API responses query ID"
  value       = aws_cloudwatch_query_definition.slow_api_responses.query_definition_id
}

output "query_slow_api_responses_name" {
  description = "Slow API responses query name"
  value       = aws_cloudwatch_query_definition.slow_api_responses.name
}

output "s3_log_archive_bucket_name" {
  description = "S3 log archive bucket name"
  value       = aws_s3_bucket.log_archive.bucket
}

output "s3_log_archive_bucket_arn" {
  description = "S3 log archive bucket ARN"
  value       = aws_s3_bucket.log_archive.arn
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.name
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}