# KMS key for CloudWatch Logs encryption
resource "aws_kms_key" "cloudwatch" {
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
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "cloudwatch-logs-key-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/cloudwatch-logs-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "payment_api" {
  name              = "/aws/payment-api-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name        = "payment-api-logs-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "transaction_processor" {
  name              = "/aws/transaction-processor-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name        = "transaction-processor-logs-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "fraud_detector" {
  name              = "/aws/fraud-detector-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name        = "fraud-detector-logs-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# Metric Filters for Error Rates
resource "aws_cloudwatch_log_metric_filter" "payment_api_errors" {
  name           = "payment-api-error-rate-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "FinTech/PaymentAPI/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "transaction_processor_errors" {
  name           = "transaction-processor-error-rate-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "FinTech/TransactionProcessor/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "fraud_detector_errors" {
  name           = "fraud-detector-error-rate-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.fraud_detector.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "FinTech/FraudDetector/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

# Metric Filters for Response Times
resource "aws_cloudwatch_log_metric_filter" "payment_api_response_time" {
  name           = "payment-api-response-time-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "{ $.responseTime = * }"

  metric_transformation {
    name      = "ResponseTime"
    namespace = "FinTech/PaymentAPI/${var.environment}"
    value     = "$.responseTime"
    unit      = "Milliseconds"
  }
}

# Metric Filters for Transaction Amounts
resource "aws_cloudwatch_log_metric_filter" "transaction_amounts" {
  name           = "transaction-amounts-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.transactionAmount = * }"

  metric_transformation {
    name      = "TransactionAmount"
    namespace = "FinTech/TransactionProcessor/${var.environment}"
    value     = "$.transactionAmount"
    unit      = "None"
  }
}

# Metric Filters for Failed Transactions
resource "aws_cloudwatch_log_metric_filter" "failed_transactions" {
  name           = "failed-transactions-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.status = \"FAILED\" }"

  metric_transformation {
    name      = "FailedTransactions"
    namespace = "FinTech/TransactionProcessor/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

# Metric Filter for Lambda Cold Starts
resource "aws_cloudwatch_log_metric_filter" "lambda_cold_starts" {
  name           = "lambda-cold-starts-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "[report_label=\"REPORT\", request_id_label=\"RequestId:\", request_id, duration_label=\"Duration:\", duration, duration_unit=\"ms\", billed_duration_label=\"Billed Duration:\", billed_duration, billed_duration_unit=\"ms\", memory_label=\"Memory Size:\", memory_size, memory_unit=\"MB\", max_memory_label=\"Max Memory Used:\", max_memory_used, max_memory_unit=\"MB\", init_duration_label=\"Init Duration:\", init_duration, init_duration_unit=\"ms\"]"

  metric_transformation {
    name      = "ColdStart"
    namespace = "FinTech/Lambda/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

# Metric Filter for Lambda Duration
resource "aws_cloudwatch_log_metric_filter" "lambda_duration" {
  name           = "lambda-duration-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "[report_label=\"REPORT\", request_id_label=\"RequestId:\", request_id, duration_label=\"Duration:\", duration, ...]"

  metric_transformation {
    name      = "Duration"
    namespace = "FinTech/Lambda/${var.environment}"
    value     = "$duration"
    unit      = "Milliseconds"
  }
}

# SNS Topic for Notifications
resource "aws_sns_topic" "alerts" {
  name              = "payment-monitoring-alerts-${var.environment_suffix}"
  display_name      = "Payment Processing Monitoring Alerts"
  kms_master_key_id = aws_kms_key.cloudwatch.id

  tags = {
    Name        = "monitoring-alerts-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "payment-api-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/PaymentAPI/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when payment API error rate exceeds 1%"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "api-error-alarm-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "api_response_time" {
  alarm_name          = "payment-api-response-time-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ResponseTime"
  namespace           = "FinTech/PaymentAPI/${var.environment}"
  period              = 60
  statistic           = "Average"
  threshold           = 500
  alarm_description   = "Alert when payment API response time exceeds 500ms"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "api-response-time-alarm-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "failed_transactions" {
  alarm_name          = "failed-transactions-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedTransactions"
  namespace           = "FinTech/TransactionProcessor/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when failed transactions exceed 5 per minute"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "failed-transactions-alarm-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "transaction_processor_errors" {
  alarm_name          = "transaction-processor-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/TransactionProcessor/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when transaction processor errors occur"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "transaction-processor-errors-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "fraud_detector_errors" {
  alarm_name          = "fraud-detector-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/FraudDetector/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when fraud detector errors occur"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "fraud-detector-errors-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# Composite Alarm
resource "aws_cloudwatch_composite_alarm" "multi_service_failure" {
  alarm_name        = "multi-service-failure-${var.environment_suffix}"
  alarm_description = "Alert when 2 or more services are experiencing issues"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.alerts.arn]
  ok_actions        = [aws_sns_topic.alerts.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.api_error_rate.alarm_name}) AND (ALARM(${aws_cloudwatch_metric_alarm.transaction_processor_errors.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.fraud_detector_errors.alarm_name}))"

  tags = {
    Name        = "multi-service-failure-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# CloudWatch Alarm for High Load
# Note: Auto Scaling integration can be added when ASG is available
resource "aws_cloudwatch_metric_alarm" "high_load" {
  alarm_name          = "payment-high-load-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/PaymentAPI/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when high load detected (>10 errors/min)"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "high-load-alarm-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "payment_monitoring" {
  dashboard_name = "payment-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      # Row 1: Service Health (3 columns)
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Payment API Error Rate"
          region = var.aws_region
          metrics = [
            ["FinTech/PaymentAPI/${var.environment}", "ErrorCount", { stat = "Sum", period = 60 }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Transaction Processor Health"
          region = var.aws_region
          metrics = [
            ["FinTech/TransactionProcessor/${var.environment}", "ErrorCount", { stat = "Sum", period = 60, label = "Errors" }],
            [".", "FailedTransactions", { stat = "Sum", period = 60, label = "Failed Transactions" }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Fraud Detector Status"
          region = var.aws_region
          metrics = [
            ["FinTech/FraudDetector/${var.environment}", "ErrorCount", { stat = "Sum", period = 60 }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      # Row 2: Transaction Volume and Performance (3 columns)
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "Transaction Volume Trends"
          region = var.aws_region
          metrics = [
            ["FinTech/TransactionProcessor/${var.environment}", "TransactionAmount", { stat = "SampleCount", period = 300, label = "Total Transactions" }],
            ["...", { stat = "Sum", period = 300, label = "Transaction Volume" }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "API Response Time"
          region = var.aws_region
          metrics = [
            ["FinTech/PaymentAPI/${var.environment}", "ResponseTime", { stat = "Average", period = 60, label = "Avg Response Time" }],
            ["...", { stat = "Maximum", period = 60, label = "Max Response Time" }]
          ]
          view    = "timeSeries"
          stacked = false
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "Error Distribution"
          region = var.aws_region
          metrics = [
            ["FinTech/PaymentAPI/${var.environment}", "ErrorCount", { stat = "Sum", period = 300, label = "API Errors" }],
            ["FinTech/TransactionProcessor/${var.environment}", "ErrorCount", { stat = "Sum", period = 300, label = "Processor Errors" }],
            ["FinTech/FraudDetector/${var.environment}", "ErrorCount", { stat = "Sum", period = 300, label = "Fraud Detector Errors" }]
          ]
          view    = "timeSeries"
          stacked = true
        }
      },
      # Row 3: Business KPIs and Lambda Metrics (3 columns)
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Successful Payments Per Minute"
          region = var.aws_region
          metrics = [
            [
              {
                expression = "m1 - m2"
                label      = "Successful Payments"
                id         = "e1"
              }
            ],
            ["FinTech/TransactionProcessor/${var.environment}", "TransactionAmount", { id = "m1", stat = "SampleCount", period = 60, visible = false }],
            [".", "FailedTransactions", { id = "m2", stat = "Sum", period = 60, visible = false }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Average Transaction Value"
          region = var.aws_region
          metrics = [
            ["FinTech/TransactionProcessor/${var.environment}", "TransactionAmount", { stat = "Average", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          yAxis = {
            left = {
              label = "USD"
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
          title  = "Lambda Performance"
          region = var.aws_region
          metrics = [
            ["FinTech/Lambda/${var.environment}", "ColdStart", { stat = "Sum", period = 300, label = "Cold Starts" }],
            [".", "Duration", { stat = "Average", period = 300, label = "Avg Duration", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      }
    ]
  })
}

# CloudWatch Log Insights Query for Cross-Service Investigation
resource "aws_cloudwatch_query_definition" "error_investigation" {
  name = "payment-error-investigation-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name,
    aws_cloudwatch_log_group.transaction_processor.name,
    aws_cloudwatch_log_group.fraud_detector.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream
    | filter @message like /ERROR/
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "transaction_flow_analysis" {
  name = "transaction-flow-analysis-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name,
    aws_cloudwatch_log_group.transaction_processor.name,
    aws_cloudwatch_log_group.fraud_detector.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, transactionId, status, amount
    | filter ispresent(transactionId)
    | sort @timestamp desc
    | limit 50
  QUERY
}

resource "aws_cloudwatch_query_definition" "performance_analysis" {
  name = "performance-analysis-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name
  ]

  query_string = <<-QUERY
    fields @timestamp, responseTime, endpoint, statusCode
    | filter ispresent(responseTime)
    | stats avg(responseTime) as avgResponseTime, max(responseTime) as maxResponseTime, count() as requestCount by endpoint
    | sort avgResponseTime desc
  QUERY
}
