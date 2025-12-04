# CloudWatch Alarm for RDS replication lag monitoring
resource "aws_cloudwatch_metric_alarm" "rds_replication_lag" {
  provider            = aws.primary
  count               = local.is_primary ? 1 : 0
  alarm_name          = "${local.resource_prefix}-rds-replication-lag-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "This metric monitors RDS replication lag"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-rds-replication-lag-alarm"
    }
  )
}

# CloudWatch Alarm for RDS CPU utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-rds-cpu-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-rds-cpu-alarm"
    }
  )
}

# CloudWatch Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-lambda-errors-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors Lambda function errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.payment_processor.function_name
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-errors-alarm"
    }
  )
}

# CloudWatch Alarm for API Gateway 5XX errors
resource "aws_cloudwatch_metric_alarm" "apigateway_5xx" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-api-5xx-errors-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.payment_api.name
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-api-5xx-errors-alarm"
    }
  )
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "payment_processing" {
  provider       = aws.primary
  dashboard_name = "${local.resource_prefix}-dashboard-${local.current_region}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Lambda Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Duration", { stat = "Average", label = "Lambda Duration" }]
          ]
          period = 300
          stat   = "Average"
          region = local.current_region
          title  = "Lambda Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "API Requests" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors" }]
          ]
          period = 300
          stat   = "Average"
          region = local.current_region
          title  = "API Gateway Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            [".", "DatabaseConnections", { stat = "Average", label = "DB Connections" }],
            [".", "ReplicaLag", { stat = "Average", label = "Replication Lag" }]
          ]
          period = 300
          stat   = "Average"
          region = local.current_region
          title  = "RDS Metrics"
        }
      }
    ]
  })
}
