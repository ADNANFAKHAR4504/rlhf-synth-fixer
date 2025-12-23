# Package Lambda function
data "archive_file" "lambda_monitoring" {
  type        = "zip"
  source_file = "${path.module}/lambda/monitor_replication.py"
  output_path = "${path.module}/lambda/monitor_replication.zip"
}

# Lambda function for replication monitoring
resource "aws_lambda_function" "monitoring" {
  provider         = aws.primary
  filename         = data.archive_file.lambda_monitoring.output_path
  function_name    = "rds-replication-monitor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_monitoring.arn
  handler          = "monitor_replication.lambda_handler"
  source_code_hash = data.archive_file.lambda_monitoring.output_base64sha256
  runtime          = "python3.9"
  timeout          = 60

  environment {
    variables = {
      DR_DB_IDENTIFIER          = aws_db_instance.dr.identifier
      REPLICATION_LAG_THRESHOLD = "60"
    }
  }

  tags = {
    Name              = "lambda-replication-monitor-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# CloudWatch Event Rule to trigger Lambda every minute
resource "aws_cloudwatch_event_rule" "monitoring_schedule" {
  provider            = aws.primary
  name                = "rds-monitoring-schedule-${var.environment_suffix}"
  description         = "Trigger Lambda function to monitor RDS replication"
  schedule_expression = "rate(1 minute)"

  tags = {
    Name              = "event-rule-monitoring-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# CloudWatch Event Target
resource "aws_cloudwatch_event_target" "monitoring_lambda" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.monitoring_schedule.name
  target_id = "MonitoringLambda"
  arn       = aws_lambda_function.monitoring.arn
}

# Lambda permission for CloudWatch Events
resource "aws_lambda_permission" "allow_cloudwatch" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monitoring.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.monitoring_schedule.arn
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_monitoring" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.monitoring.function_name}"
  retention_in_days = 7

  tags = {
    Name              = "log-group-lambda-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}
