# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "cloudwatch_alarms" {
  name = "payment-cloudwatch-alarms-${var.environment_suffix}"

  tags = {
    Name = "payment-cloudwatch-alarms-${var.environment_suffix}"
  }
}

resource "aws_sns_topic" "cloudwatch_alarms_dr" {
  provider = aws.dr
  name     = "payment-cloudwatch-alarms-dr-${var.environment_suffix}"

  tags = {
    Name = "payment-cloudwatch-alarms-dr-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Aurora Replication Lag - Primary
resource "aws_cloudwatch_metric_alarm" "aurora_replication_lag_primary" {
  alarm_name          = "aurora-replication-lag-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = var.replication_lag_threshold
  alarm_description   = "This metric monitors Aurora Global Database replication lag"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = {
    Name = "aurora-replication-lag-primary-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Aurora Replication Lag - DR
resource "aws_cloudwatch_metric_alarm" "aurora_replication_lag_dr" {
  provider            = aws.dr
  alarm_name          = "aurora-replication-lag-dr-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = var.replication_lag_threshold
  alarm_description   = "This metric monitors Aurora Global Database replication lag in DR region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_dr.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.dr.cluster_identifier
  }

  tags = {
    Name = "aurora-replication-lag-dr-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for API Gateway Errors - Primary
resource "aws_cloudwatch_metric_alarm" "api_gateway_errors_primary" {
  alarm_name          = "api-gateway-errors-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5XX errors in primary region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.primary.name
  }

  tags = {
    Name = "api-gateway-errors-primary-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for API Gateway Errors - DR
resource "aws_cloudwatch_metric_alarm" "api_gateway_errors_dr" {
  provider            = aws.dr
  alarm_name          = "api-gateway-errors-dr-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5XX errors in DR region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_dr.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.dr.name
  }

  tags = {
    Name = "api-gateway-errors-dr-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Lambda Errors - Primary
resource "aws_cloudwatch_metric_alarm" "lambda_errors_primary" {
  alarm_name          = "lambda-errors-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors in primary region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.payment_processor_primary.function_name
  }

  tags = {
    Name = "lambda-errors-primary-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Lambda Errors - DR
resource "aws_cloudwatch_metric_alarm" "lambda_errors_dr" {
  provider            = aws.dr
  alarm_name          = "lambda-errors-dr-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors in DR region"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms_dr.arn]

  dimensions = {
    FunctionName = aws_lambda_function.payment_processor_dr.function_name
  }

  tags = {
    Name = "lambda-errors-dr-${var.environment_suffix}"
  }
}