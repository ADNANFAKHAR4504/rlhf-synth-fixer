# monitoring.tf
# CloudWatch dashboards, alarms, and metric configurations

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment_suffix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # API Gateway Metrics
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.main.name, { stat = "Sum", label = "API Requests" }],
            [".", "4XXError", ".", ".", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", ".", ".", { stat = "Sum", label = "5XX Errors" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Request Count and Errors"
          period  = 300
          yAxis = {
            left = {
              min = 0
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
            ["AWS/ApiGateway", "Latency", "ApiName", aws_api_gateway_rest_api.main.name, { stat = "Average", label = "Average Latency" }],
            ["...", { stat = "p99", label = "P99 Latency" }],
            ["...", { stat = "p95", label = "P95 Latency" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Latency"
          period  = 300
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Lambda Metrics
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.api_handler.function_name, { stat = "Sum" }],
            [".", "Errors", ".", ".", { stat = "Sum" }],
            [".", "Throttles", ".", ".", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Metrics"
          period  = 300
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
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.api_handler.function_name, { stat = "Average" }],
            ["...", { stat = "p99" }],
            ["...", { stat = "Maximum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Duration"
          period  = 300
        }
      },
      # RDS Metrics
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.identifier, { stat = "Average" }],
            [".", "DatabaseConnections", ".", ".", { stat = "Average" }],
            [".", "FreeableMemory", ".", ".", { stat = "Average", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS Performance Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ReadLatency", "DBInstanceIdentifier", aws_db_instance.main.identifier, { stat = "Average" }],
            [".", "WriteLatency", ".", ".", { stat = "Average" }],
            [".", "ReadThroughput", ".", ".", { stat = "Average", yAxis = "right" }],
            [".", "WriteThroughput", ".", ".", { stat = "Average", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS I/O Metrics"
          period  = 300
        }
      }
    ]
  })
}

# API Gateway Alarms
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.api_latency_threshold
  alarm_description   = "API Gateway latency is above ${var.api_latency_threshold}ms"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-high-latency"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-api-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  threshold           = var.api_error_rate_threshold
  alarm_description   = "API Gateway error rate is above ${var.api_error_rate_threshold}%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "e1"
    expression  = "(m2+m3)/m1*100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.main.name
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "4XXError"
      namespace   = "AWS/ApiGateway"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.main.name
      }
    }
  }

  metric_query {
    id = "m3"
    metric {
      metric_name = "5XXError"
      namespace   = "AWS/ApiGateway"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.main.name
      }
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-api-high-error-rate"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

# Lambda Alarms - API Handler
resource "aws_cloudwatch_metric_alarm" "lambda_api_handler_errors" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Lambda function errors exceed ${var.lambda_error_threshold}"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-lambda-api-errors"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "lambda_api_handler_duration" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-api-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.lambda_duration_threshold
  alarm_description   = "Lambda function duration exceeds ${var.lambda_duration_threshold}ms"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-lambda-api-duration"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

# Lambda Alarms - Metric Aggregator
resource "aws_cloudwatch_metric_alarm" "lambda_aggregator_errors" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-lambda-agg-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Metric aggregator Lambda errors exceed ${var.lambda_error_threshold}"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.metric_aggregator.function_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-lambda-agg-errors"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

# RDS Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_description   = "RDS CPU utilization is above ${var.rds_cpu_threshold}%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-rds-high-cpu"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.rds_connection_threshold
  alarm_description   = "RDS connections exceed ${var.rds_connection_threshold}"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-rds-high-connections"
  })

  depends_on = [aws_sns_topic.cloudwatch_alerts]
}

# Metric Filters for Custom Metrics
resource "aws_cloudwatch_log_metric_filter" "api_gateway_errors" {
  name           = "${var.project_name}-${var.environment_suffix}-api-errors"
  log_group_name = aws_cloudwatch_log_group.api_gateway.name
  pattern        = "[timestamp, request_id, event_type=ERROR*, ...]"

  metric_transformation {
    name          = "APIGatewayErrors"
    namespace     = "${var.project_name}-${var.environment_suffix}/APIGateway"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "lambda_cold_starts" {
  name           = "${var.project_name}-${var.environment_suffix}-lambda-cold-starts"
  log_group_name = aws_cloudwatch_log_group.lambda_api_handler.name
  pattern        = "[..., init_duration_label=Init, init_duration_value, init_duration_unit=ms]"

  metric_transformation {
    name          = "LambdaColdStarts"
    namespace     = "${var.project_name}-${var.environment_suffix}/Lambda"
    value         = "1"
    default_value = "0"
  }
}
