# CloudWatch log group for Step Functions
resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/webhook-orchestration-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "webhook-orchestration-logs-${var.environment_suffix}"
  }
}

# Step Functions state machine
resource "aws_sfn_state_machine" "webhook_orchestration" {
  name     = "webhook-orchestration-${var.environment_suffix}"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Webhook processing orchestration workflow"
    StartAt = "ValidateAndTransform"
    States = {
      ValidateAndTransform = {
        Type     = "Task"
        Resource = aws_lambda_function.webhook_processor.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ProcessingFailed"
          }
        ]
        Next = "ProcessingSucceeded"
      }
      ProcessingSucceeded = {
        Type = "Succeed"
      }
      ProcessingFailed = {
        Type  = "Fail"
        Error = "WebhookProcessingFailed"
        Cause = "Failed to process webhook after retries"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = {
    Name = "webhook-orchestration-${var.environment_suffix}"
  }
}
