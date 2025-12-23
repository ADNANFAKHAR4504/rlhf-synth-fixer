# cloudwatch.tf - CloudWatch log groups and alarms with KMS encryption

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/payment-processor-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "lambda-log-group-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}-${substr(random_id.suffix.hex, 0, 8)}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "vpc-flow-logs-group-${var.environment_suffix}-${substr(random_id.suffix.hex, 0, 8)}"
  }
}

# CloudWatch Log Group for RDS
resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/instance/payment-db-${var.environment_suffix}/postgresql"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "rds-log-group-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for RDS Connection Failures
resource "aws_cloudwatch_metric_alarm" "rds_connection_failures" {
  alarm_name          = "rds-connection-failures-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Monitors RDS connection failures"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  tags = {
    Name = "rds-connection-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "lambda-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Monitors Lambda function errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.payment_processor.function_name
  }

  tags = {
    Name = "lambda-error-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Failed Authentication (Lambda Invocations)
resource "aws_cloudwatch_metric_alarm" "failed_auth" {
  alarm_name          = "failed-authentication-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Monitors failed authentication attempts via Lambda throttling"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.payment_processor.function_name
  }

  tags = {
    Name = "failed-auth-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Metric Filter for Encryption Violations
resource "aws_cloudwatch_log_metric_filter" "encryption_violations" {
  name           = "encryption-violations-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.lambda.name
  pattern        = "[time, request_id, event_type = *ENCRYPTION*, ...]"

  metric_transformation {
    name      = "EncryptionViolations"
    namespace = "PaymentSecurity"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "encryption_violations" {
  alarm_name          = "encryption-violations-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "EncryptionViolations"
  namespace           = "PaymentSecurity"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Monitors encryption violations in logs"
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "encryption-violation-alarm-${var.environment_suffix}"
  }
}
