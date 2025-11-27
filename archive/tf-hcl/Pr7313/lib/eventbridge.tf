# EventBridge Rule for Nightly Batch Processing
resource "aws_cloudwatch_event_rule" "nightly_batch" {
  name                = "loan-proc-nightly-batch-${local.env_suffix}"
  description         = "Trigger nightly batch processing for loan applications"
  schedule_expression = "cron(0 2 * * ? *)" # 2 AM UTC daily

  tags = {
    Name = "loan-processing-nightly-batch-rule-${local.env_suffix}"
  }
}

# EventBridge Target - CloudWatch Log Group (placeholder)
resource "aws_cloudwatch_log_group" "batch_processing" {
  name              = "/aws/events/loan-processing-batch-${local.env_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "loan-processing-batch-log-group-${local.env_suffix}"
  }
}

# Note: In production, this would trigger a Lambda function or Step Functions workflow
# For now, we'll log the event
resource "aws_cloudwatch_event_target" "nightly_batch_log" {
  rule      = aws_cloudwatch_event_rule.nightly_batch.name
  target_id = "LogTarget"
  arn       = aws_cloudwatch_log_group.batch_processing.arn
}

# EventBridge Rule for Business Hours Monitoring
resource "aws_cloudwatch_event_rule" "business_hours_monitor" {
  name                = "loan-proc-biz-hours-${local.env_suffix}"
  description         = "Monitor during business hours for enhanced alerting"
  schedule_expression = "cron(0 9-17 ? * MON-FRI *)" # 9 AM - 5 PM UTC, Mon-Fri

  tags = {
    Name = "loan-processing-business-hours-rule-${local.env_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "business_hours_log" {
  rule      = aws_cloudwatch_event_rule.business_hours_monitor.name
  target_id = "LogTarget"
  arn       = aws_cloudwatch_log_group.batch_processing.arn
}
