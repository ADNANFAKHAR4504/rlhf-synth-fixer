# monitoring.tf

# SNS topic for alarms
resource "aws_sns_topic" "alarms" {
  provider = aws.primary
  name     = "${var.project_name}-${var.environment_suffix}-alarms"

  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# X-Ray sampling rule
resource "aws_xray_sampling_rule" "api" {
  provider       = aws.primary
  rule_name      = "${var.project_name}-${var.environment_suffix}-sampling"
  priority       = 9999
  version        = 1
  reservoir_size = 1
  fixed_rate     = var.xray_sampling_rate
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  attributes = {
    Environment = "Production"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  provider       = aws.primary
  dashboard_name = "${var.project_name}-${var.environment_suffix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # API Gateway metrics
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", period = 300 }],
            [".", "4XXError", { stat = "Sum", period = 300 }],
            [".", "5XXError", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.primary_region
          title   = "API Gateway Requests"
          yAxis = {
            left = {
              showUnits = false
            }
          }
        }
      },
      # Lambda duration metrics
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", period = 300 }],
            ["...", { stat = "Maximum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.primary_region
          title   = "Lambda Duration"
          yAxis = {
            left = {
              showUnits = false
            }
          }
        }
      },
      # DynamoDB metrics
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum", period = 300 }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum", period = 300 }],
            [".", "UserErrors", { stat = "Sum", period = 300 }],
            [".", "SystemErrors", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.primary_region
          title   = "DynamoDB Performance"
        }
      },
      # WAF metrics
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/WAFV2", "BlockedRequests", { stat = "Sum", period = 300 }],
            [".", "AllowedRequests", { stat = "Sum", period = 300 }],
            [".", "CountedRequests", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "WAF Activity"
        }
      }
    ]
  })
}

# CloudWatch Alarms

# High API error rate
resource "aws_cloudwatch_metric_alarm" "high_4xx_errors" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-${var.environment_suffix}-high-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "This metric monitors 4xx errors"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main_primary.name
    Stage   = "${var.api_stage}-${var.environment_suffix}"
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-${var.environment_suffix}-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors 5xx errors"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main_primary.name
    Stage   = "${var.api_stage}-${var.environment_suffix}"
  }

  tags = var.common_tags
}

# Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.transaction_primary.function_name
  }

  tags = var.common_tags
}

# Lambda throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda throttles"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.transaction_primary.function_name
  }

  tags = var.common_tags
}

# Lambda duration alarm
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "25000" # 25 seconds (Lambda timeout is 30)
  alarm_description   = "This metric monitors lambda duration"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.transaction_primary.function_name
  }

  tags = var.common_tags
}

# CloudFront error rate alarm
resource "aws_cloudwatch_metric_alarm" "cloudfront_error_rate" {
  provider            = aws.global
  alarm_name          = "${var.project_name}-${var.environment_suffix}-cloudfront-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5" # 5% error rate
  alarm_description   = "This metric monitors CloudFront 5xx error rate"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.api.id
  }

  tags = var.common_tags
}

# DynamoDB throttling alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-${var.environment_suffix}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors DynamoDB throttling"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = var.common_tags
}

# API Gateway latency alarm (P99)
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-${var.environment_suffix}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  extended_statistic  = "p99"
  threshold           = "1000" # 1 second
  alarm_description   = "This metric monitors API Gateway P99 latency"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main_primary.name
    Stage   = "${var.api_stage}-${var.environment_suffix}"
  }

  tags = var.common_tags
}

# Lambda concurrent execution alarm
resource "aws_cloudwatch_metric_alarm" "lambda_concurrent_executions" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-concurrent-executions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "800" # 80% of default account limit (1000)
  alarm_description   = "This metric monitors lambda concurrent executions"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.transaction_primary.function_name
  }

  tags = var.common_tags
}

# CloudWatch Log Metric Filter for failed transactions
resource "aws_cloudwatch_log_metric_filter" "failed_transactions" {
  provider       = aws.primary
  name           = "${var.project_name}-${var.environment_suffix}-failed-transactions"
  log_group_name = aws_cloudwatch_log_group.lambda_transaction_primary.name
  pattern        = "[timestamp, request_id, level = ERROR*, msg]"

  metric_transformation {
    name      = "FailedTransactions"
    namespace = "${var.project_name}-${var.environment_suffix}/BusinessMetrics"
    value     = "1"
  }
}

# Alarm for failed transactions
resource "aws_cloudwatch_metric_alarm" "failed_transactions" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-${var.environment_suffix}-failed-transactions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedTransactions"
  namespace           = "${var.project_name}-${var.environment_suffix}/BusinessMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "This metric monitors failed transaction count"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = var.common_tags
}

# Composite alarm for critical path
resource "aws_cloudwatch_composite_alarm" "critical_system_health" {
  provider          = aws.primary
  alarm_name        = "${var.project_name}-${var.environment_suffix}-critical-health"
  alarm_description = "Composite alarm for critical system health"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.alarms.arn]

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.high_5xx_errors.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.lambda_errors.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.dynamodb_throttles.alarm_name})"
  ])

  depends_on = [
    aws_cloudwatch_metric_alarm.high_5xx_errors,
    aws_cloudwatch_metric_alarm.lambda_errors,
    aws_cloudwatch_metric_alarm.dynamodb_throttles
  ]
}