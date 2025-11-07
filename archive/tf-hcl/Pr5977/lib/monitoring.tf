# SNS Topic for Transaction Alerts
resource "aws_sns_topic" "transaction_alerts" {
  name = "transaction-alerts-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "transaction-alerts-${var.environment}-${var.environment_suffix}"
    }
  )
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "transaction_alerts_email" {
  topic_arn = aws_sns_topic.transaction_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# SNS Topic for System Errors
resource "aws_sns_topic" "system_errors" {
  name = "system-errors-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "system-errors-${var.environment}-${var.environment_suffix}"
    }
  )
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "system_errors_email" {
  topic_arn = aws_sns_topic.system_errors.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# IAM Policy for Lambda to publish to SNS
resource "aws_iam_policy" "lambda_sns" {
  name        = "lambda-sns-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda SNS publishing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.transaction_alerts.arn,
          aws_sns_topic.system_errors.arn
        ]
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_sns" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_sns.arn
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "payment-processing-${var.environment}-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", { stat = "Average", period = 300 }],
            ["...", { stat = "p99", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "API Gateway Latency"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Sum", period = 300 }],
            [".", "Throttles", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "Lambda Errors and Throttles"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", period = 300 }],
            [".", "CPUUtilization", { stat = "Average", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "RDS Connection and CPU Metrics"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", period = 300 }],
            [".", "4XXError", { stat = "Sum", period = 300 }],
            [".", "5XXError", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "API Gateway Request Count and Errors"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarm - API Gateway 5XX Errors
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "api-gateway-5xx-errors-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when API Gateway 5XX errors exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }

  tags = local.common_tags
}

# CloudWatch Alarm - Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "lambda-errors-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda errors exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]

  tags = local.common_tags
}

# CloudWatch Alarm - RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "rds-cpu-utilization-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when RDS CPU utilization exceeds 80%"
  alarm_actions       = [aws_sns_topic.system_errors.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = local.common_tags
}

# CloudWatch Alarm - RDS Database Connections
resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "rds-database-connections-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Alert when RDS database connections exceed threshold"
  alarm_actions       = [aws_sns_topic.system_errors.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }

  tags = local.common_tags
}