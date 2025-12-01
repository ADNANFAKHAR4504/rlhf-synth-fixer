# CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "webhook_monitoring" {
  dashboard_name = "webhook-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", { stat = "Average", label = "API Latency (avg)" }],
            ["...", { stat = "p99", label = "API Latency (p99)" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "API Gateway Latency"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Invocations", { stat = "Sum", label = "Lambda Invocations" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Errors and Invocations"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "UserErrors", { stat = "Sum", label = "DynamoDB User Errors" }],
            [".", "SystemErrors", { stat = "Sum", label = "DynamoDB System Errors" }],
            [".", "ConditionalCheckFailedRequests", { stat = "Sum", label = "Conditional Check Failed" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Errors"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "WriteThrottleEvents", { stat = "Sum", label = "Write Throttles" }],
            [".", "ReadThrottleEvents", { stat = "Sum", label = "Read Throttles" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Throttles"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/States", "ExecutionsFailed", { stat = "Sum", label = "Failed Executions" }],
            [".", "ExecutionsSucceeded", { stat = "Sum", label = "Successful Executions" }],
            [".", "ExecutionsTimedOut", { stat = "Sum", label = "Timed Out Executions" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Step Functions Executions"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      }
    ]
  })
}

# CloudWatch alarm for Lambda error rate
resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  alarm_name          = "webhook-lambda-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  threshold           = var.alarm_error_rate_threshold
  alarm_description   = "Alert when Lambda error rate exceeds ${var.alarm_error_rate_threshold}% over ${var.alarm_period_seconds} seconds"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / invocations) * 100"
    label       = "Lambda Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.webhook_processor.function_name
      }
    }
  }

  metric_query {
    id = "invocations"
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.webhook_processor.function_name
      }
    }
  }

  tags = {
    Name = "webhook-lambda-error-rate-alarm-${var.environment_suffix}"
  }
}

# CloudWatch alarm for DynamoDB throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "webhook-dynamodb-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when DynamoDB write throttles exceed 10 over 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.webhooks.name
  }

  tags = {
    Name = "webhook-dynamodb-throttles-alarm-${var.environment_suffix}"
  }
}

# CloudWatch alarm for API Gateway 5XX errors
resource "aws_cloudwatch_metric_alarm" "api_gateway_errors" {
  alarm_name          = "webhook-api-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when API Gateway 5XX errors exceed 10 over 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.webhook_api.name
  }

  tags = {
    Name = "webhook-api-5xx-errors-alarm-${var.environment_suffix}"
  }
}
