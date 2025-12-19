# monitoring.tf - CloudWatch monitoring, alarms, and X-Ray tracing

# SNS Topic for alarm notifications
resource "aws_sns_topic" "api_alarms" {
  name = "${var.environment_suffix}-api-alarms"

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-api-alarms"
    }
  )
}

# SNS Topic subscription
resource "aws_sns_topic_subscription" "api_alarms_email" {
  topic_arn = aws_sns_topic.api_alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment_suffix}-api-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "Requests" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors" }],
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.id
          title  = "API Gateway Requests"
          dimensions = {
            ApiName = aws_api_gateway_rest_api.main.name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", { stat = "Average", label = "Avg Latency" }],
            ["...", { stat = "p99", label = "P99 Latency" }],
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.id
          title  = "API Gateway Latency"
          dimensions = {
            ApiName = aws_api_gateway_rest_api.main.name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Errors" }],
            [".", "Throttles", { stat = "Sum", label = "Throttles" }],
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.id
          title  = "Lambda Invocations"
          dimensions = {
            FunctionName = aws_lambda_function.api_handler.function_name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", label = "Avg Duration" }],
            ["...", { stat = "p99", label = "P99 Duration" }],
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.id
          title  = "Lambda Duration"
          dimensions = {
            FunctionName = aws_lambda_function.api_handler.function_name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "ConcurrentExecutions", { stat = "Maximum", label = "Concurrent" }],
          ]
          period = 300
          stat   = "Maximum"
          region = data.aws_region.current.id
          title  = "Lambda Concurrency"
          dimensions = {
            FunctionName = aws_lambda_function.api_handler.function_name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum", label = "Read Capacity" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum", label = "Write Capacity" }],
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.id
          title  = "DynamoDB Capacity"
          dimensions = {
            TableName = aws_dynamodb_table.user_profiles.name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "UserErrors", { stat = "Sum", label = "User Errors" }],
            [".", "SystemErrors", { stat = "Sum", label = "System Errors" }],
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.id
          title  = "DynamoDB Errors"
          dimensions = {
            TableName = aws_dynamodb_table.user_profiles.name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Cognito", "UserAuthentication", { stat = "Sum", label = "Authentications" }],
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.id
          title  = "Cognito Authentications"
          dimensions = {
            UserPoolId = aws_cognito_user_pool.main.id
          }
        }
      }
    ]
  })
}

# CloudWatch Alarm - API Gateway 5XX Errors
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.environment_suffix}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors API Gateway 5XX errors"
  alarm_actions       = [aws_sns_topic.api_alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-api-5xx-alarm"
    }
  )
}

# CloudWatch Alarm - Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.environment_suffix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors Lambda function errors"
  alarm_actions       = [aws_sns_topic.api_alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-lambda-errors-alarm"
    }
  )
}

# CloudWatch Alarm - Lambda Duration
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${var.environment_suffix}-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 10000 # 10 seconds
  alarm_description   = "This alarm monitors Lambda function duration"
  alarm_actions       = [aws_sns_topic.api_alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-lambda-duration-alarm"
    }
  )
}

# CloudWatch Alarm - DynamoDB User Errors
resource "aws_cloudwatch_metric_alarm" "dynamodb_errors" {
  alarm_name          = "${var.environment_suffix}-dynamodb-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors DynamoDB user errors"
  alarm_actions       = [aws_sns_topic.api_alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.user_profiles.name
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-dynamodb-errors-alarm"
    }
  )
}

# X-Ray Sampling Rule
resource "aws_xray_sampling_rule" "main" {
  rule_name      = "${var.environment_suffix}-api-sampling"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.05
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  attributes = {
    Environment = var.environment
  }
}
