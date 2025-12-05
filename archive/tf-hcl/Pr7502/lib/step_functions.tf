# Step Functions Express workflow for event processing
resource "aws_sfn_state_machine" "event_processing" {
  name     = "${var.project_name}-workflow-${var.environment_suffix}"
  role_arn = aws_iam_role.step_functions.arn
  type     = "EXPRESS"

  definition = jsonencode({
    Comment = "Event processing workflow for payment transactions"
    StartAt = "ValidateEvent"
    States = {
      ValidateEvent = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.validator.arn
          Payload = {
            "event.$" = "$"
          }
        }
        ResultPath = "$.validationResult"
        Retry = [
          {
            ErrorEquals = [
              "Lambda.ServiceException",
              "Lambda.AWSLambdaException",
              "Lambda.SdkClientException"
            ]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ValidationFailed"
          }
        ]
        Next = "ProcessEvent"
      }
      ProcessEvent = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.processor.arn
          Payload = {
            "event.$"            = "$.validationResult.Payload"
            "validationStatus.$" = "$.validationResult.StatusCode"
          }
        }
        ResultPath = "$.processingResult"
        Retry = [
          {
            ErrorEquals = [
              "Lambda.ServiceException",
              "Lambda.AWSLambdaException",
              "Lambda.SdkClientException"
            ]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ProcessingFailed"
          }
        ]
        Next = "EnrichEvent"
      }
      EnrichEvent = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.enricher.arn
          Payload = {
            "event.$"          = "$.processingResult.Payload"
            "processingData.$" = "$.processingResult"
            "validationData.$" = "$.validationResult"
          }
        }
        ResultPath = "$.enrichmentResult"
        Retry = [
          {
            ErrorEquals = [
              "Lambda.ServiceException",
              "Lambda.AWSLambdaException",
              "Lambda.SdkClientException"
            ]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "EnrichmentFailed"
          }
        ]
        Next = "Success"
      }
      Success = {
        Type = "Succeed"
      }
      ValidationFailed = {
        Type  = "Fail"
        Error = "ValidationError"
        Cause = "Event validation failed"
      }
      ProcessingFailed = {
        Type  = "Fail"
        Error = "ProcessingError"
        Cause = "Event processing failed"
      }
      EnrichmentFailed = {
        Type  = "Fail"
        Error = "EnrichmentError"
        Cause = "Event enrichment failed"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = {
    Name = "${var.project_name}-workflow-${var.environment_suffix}"
  }
}
