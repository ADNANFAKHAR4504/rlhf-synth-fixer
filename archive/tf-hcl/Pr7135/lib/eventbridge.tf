# EventBridge Rule for Batch Processing
resource "aws_cloudwatch_event_rule" "batch_processing" {
  name                = "fraud-detection-batch-processing-${var.environment_suffix}"
  description         = "Trigger Lambda every 5 minutes for batch fraud pattern analysis"
  schedule_expression = var.eventbridge_schedule

  tags = {
    Name = "fraud-detection-batch-processing-${var.environment_suffix}"
  }
}

# EventBridge Target - Lambda Function
resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.batch_processing.name
  target_id = "fraud-detector-lambda-${var.environment_suffix}"
  arn       = aws_lambda_function.fraud_detector.arn
  role_arn  = aws_iam_role.eventbridge.arn

  input = jsonencode({
    source = "eventbridge-batch-processing"
    action = "analyze-patterns"
  })

  retry_policy {
    maximum_retry_attempts       = 2
    maximum_event_age_in_seconds = 3600
  }

  dead_letter_config {
    arn = aws_sqs_queue.fraud_detection_dlq.arn
  }
}
