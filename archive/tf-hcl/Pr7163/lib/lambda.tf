# Archive Lambda function code
data "archive_file" "lambda_failover" {
  type        = "zip"
  source_file = "${path.module}/lambda/failover_monitor.py"
  output_path = "${path.module}/lambda_failover_monitor.zip"
}

# Lambda function for failover monitoring
resource "aws_lambda_function" "failover_monitor" {
  filename         = data.archive_file.lambda_failover.output_path
  function_name    = "rds-failover-monitor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_failover.arn
  handler          = "failover_monitor.lambda_handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.lambda_failover.output_base64sha256

  environment {
    variables = {
      REPLICATION_LAG_THRESHOLD = var.replication_lag_threshold
      DR_REPLICA_ID             = aws_db_instance.dr_replica.identifier
      DR_REGION                 = var.dr_region
    }
  }

  timeout = 60

  tags = merge(
    local.common_tags,
    {
      Name = "rds-failover-monitor-${var.environment_suffix}"
    }
  )
}

# CloudWatch Event Rule to trigger Lambda every 5 minutes
resource "aws_cloudwatch_event_rule" "failover_check" {
  name                = "rds-failover-check-${var.environment_suffix}"
  description         = "Trigger RDS failover check every 5 minutes"
  schedule_expression = "rate(5 minutes)"

  tags = merge(
    local.common_tags,
    {
      Name = "rds-failover-check-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_event_target" "failover_check" {
  rule      = aws_cloudwatch_event_rule.failover_check.name
  target_id = "lambda"
  arn       = aws_lambda_function.failover_monitor.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_monitor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.failover_check.arn
}
