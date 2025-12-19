resource "aws_sfn_state_machine" "receipt_processing" {
  name     = "${var.project_name}-${var.environment_suffix}-receipt-processing"
  role_arn = aws_iam_role.step_function_role.arn

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_function_logs.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  definition = jsonencode({
    Comment = "Receipt processing workflow with OCR and categorization"
    StartAt = "ParallelProcessing"
    States = {
      ParallelProcessing = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "ExtractTextWithOCR"
            States = {
              ExtractTextWithOCR = {
                Type     = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.ocr_processor.arn
                  Payload = {
                    "Input.$" = "$"
                  }
                }
                Retry = [
                  {
                    ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
                    IntervalSeconds = 2
                    MaxAttempts     = 6
                    BackoffRate     = 2
                  }
                ]
                Catch = [
                  {
                    ErrorEquals = ["States.ALL"]
                    Next        = "OCRFailed"
                    ResultPath  = "$.error"
                  }
                ]
                ResultPath = "$.ocrResult"
                End        = true
              }
              OCRFailed = {
                Type  = "Fail"
                Cause = "OCR processing failed after retries"
              }
            }
          },
          {
            StartAt = "DetectCategory"
            States = {
              DetectCategory = {
                Type     = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.category_detector.arn
                  Payload = {
                    "Input.$" = "$"
                  }
                }
                Retry = [
                  {
                    ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException"]
                    IntervalSeconds = 2
                    MaxAttempts     = 3
                    BackoffRate     = 2
                  }
                ]
                Catch = [
                  {
                    ErrorEquals = ["States.ALL"]
                    Next        = "CategoryDetectionFailed"
                    ResultPath  = "$.error"
                  }
                ]
                ResultPath = "$.categoryResult"
                End        = true
              }
              CategoryDetectionFailed = {
                Type = "Pass"
                Result = {
                  category   = "Uncategorized"
                  confidence = 0
                }
                ResultPath = "$.categoryResult"
                End        = true
              }
            }
          }
        ]
        Next       = "CombineResults"
        ResultPath = "$.parallelResults"
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ProcessingError"
            ResultPath  = "$.error"
          }
        ]
      }
      CombineResults = {
        Type = "Pass"
        Parameters = {
          "receiptId.$"    = "$.receiptId"
          "userId.$"       = "$.userId"
          "ocrData.$"      = "$.parallelResults[0].ocrResult.Payload"
          "categoryData.$" = "$.parallelResults[1].categoryResult.Payload"
        }
        Next = "SaveExpenseRecord"
      }
      SaveExpenseRecord = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.expense_saver.arn
          Payload = {
            "Input.$" = "$"
          }
        }
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ProcessingError"
            ResultPath  = "$.error"
          }
        ]
        Next       = "SendNotification"
        ResultPath = "$.saveResult"
      }
      SendNotification = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.processing_notifications.arn
          Message = {
            "receiptId.$" = "$.receiptId"
            "userId.$"    = "$.userId"
            "status"      = "completed"
            "message"     = "Receipt processed successfully"
          }
        }
        End = true
      }
      ProcessingError = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.processing_notifications.arn
          Message = {
            "receiptId.$" = "$.receiptId"
            "status"      = "failed"
            "error.$"     = "$.error"
          }
        }
        Next = "FailState"
      }
      FailState = {
        Type  = "Fail"
        Cause = "Receipt processing failed"
      }
    }
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment_suffix}-state-machine"
  })
}