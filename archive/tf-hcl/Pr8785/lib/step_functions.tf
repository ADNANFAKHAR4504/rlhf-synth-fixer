resource "aws_sfn_state_machine" "reconciliation_workflow" {
  name     = "reconciliation-workflow-${var.environment_suffix}"
  role_arn = aws_iam_role.step_functions_role.arn

  definition = jsonencode({
    Comment = "Transaction Reconciliation Workflow"
    StartAt = "ParseFile"
    States = {
      ParseFile = {
        Type     = "Task"
        Resource = aws_lambda_function.file_parser.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed", "States.Timeout", "Lambda.ServiceException", "Lambda.TooManyRequestsException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
            ResultPath  = "$.error"
          }
        ]
        Next = "ValidateTransactions"
      }
      ValidateTransactions = {
        Type     = "Task"
        Resource = aws_lambda_function.transaction_validator.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed", "States.Timeout", "Lambda.ServiceException", "Lambda.TooManyRequestsException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
            ResultPath  = "$.error"
          }
        ]
        Next = "GenerateReport"
      }
      GenerateReport = {
        Type     = "Task"
        Resource = aws_lambda_function.report_generator.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed", "States.Timeout", "Lambda.ServiceException", "Lambda.TooManyRequestsException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
            ResultPath  = "$.error"
          }
        ]
        Next = "NotifySuccess"
      }
      NotifySuccess = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.reconciliation_notifications.arn
          Message = {
            "status" : "SUCCESS",
            "message" : "Transaction reconciliation completed successfully",
            "input.$" : "$"
          }
        }
        End = true
      }
      NotifyFailure = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.reconciliation_notifications.arn
          Message = {
            "status" : "FAILURE",
            "message" : "Transaction reconciliation failed",
            "error.$" : "$.error"
          }
        }
        End = true
      }
    }
  })

  tags = {
    Name = "reconciliation-workflow-${var.environment_suffix}"
  }
}
