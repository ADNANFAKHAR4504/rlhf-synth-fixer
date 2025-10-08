resource "aws_sfn_state_machine" "renewal_workflow" {
  name     = "${var.project_name}-renewal-workflow-${local.env_suffix}"
  role_arn = aws_iam_role.stepfunctions_execution.arn
  type     = "EXPRESS"

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.stepfunctions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  definition = jsonencode({
    Comment = "Subscription renewal workflow with retry logic"
    StartAt = "ProcessPayment"
    States = {
      ProcessPayment = {
        Type     = "Task"
        Resource = aws_lambda_function.process_payment.arn
        Retry = [
          {
            ErrorEquals = [
              "PaymentError",
              "States.TaskFailed"
            ]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "PaymentFailed"
          }
        ]
        Next = "GenerateReceipt"
      }
      GenerateReceipt = {
        Type     = "Task"
        Resource = aws_lambda_function.generate_receipt.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 1
            MaxAttempts     = 2
            BackoffRate     = 1.5
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ReceiptFailed"
          }
        ]
        Next = "SendEmail"
      }
      SendEmail = {
        Type     = "Task"
        Resource = aws_lambda_function.send_email.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 1
            MaxAttempts     = 2
            BackoffRate     = 1.5
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "EmailFailed"
          }
        ]
        Next = "Success"
      }
      Success = {
        Type = "Succeed"
      }
      PaymentFailed = {
        Type  = "Fail"
        Error = "PaymentProcessingFailed"
        Cause = "Unable to process payment after retries"
      }
      ReceiptFailed = {
        Type  = "Fail"
        Error = "ReceiptGenerationFailed"
        Cause = "Unable to generate receipt"
      }
      EmailFailed = {
        Type  = "Fail"
        Error = "EmailSendingFailed"
        Cause = "Unable to send email notification"
      }
    }
  })

  tags = {
    Name        = "${var.project_name}-renewal-workflow"
    Environment = local.env_suffix
  }
}
