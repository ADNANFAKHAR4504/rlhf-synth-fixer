resource "aws_cloudwatch_event_rule" "verification" {
  name        = "${var.name_prefix}-verification"
  description = "Trigger verification workflow"

  event_pattern = jsonencode({
    source      = ["aws.dynamodb"]
    detail-type = ["DynamoDB Stream Record"]
    detail = {
      eventName = ["INSERT", "MODIFY"]
    }
  })

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "step_function" {
  rule      = aws_cloudwatch_event_rule.verification.name
  target_id = "StepFunctionTarget"
  arn       = aws_sfn_state_machine.verification.arn
  role_arn  = aws_iam_role.eventbridge.arn
}

resource "aws_sfn_state_machine" "verification" {
  name     = "${var.name_prefix}-verification"
  role_arn = aws_iam_role.step_function.arn

  definition = jsonencode({
    Comment = "Verification workflow for feature flags"
    StartAt = "QueryCloudWatch"
    States = {
      QueryCloudWatch = {
        Type     = "Task"
        Resource = "arn:aws:states:::aws-sdk:cloudwatchlogs:startQuery"
        Parameters = {
          "LogGroupName" = "/aws/lambda/${var.name_prefix}"
          "StartTime.$"  = "$$.Execution.StartTime"
          "EndTime.$"    = "$$.Execution.Input.timestamp"
          "QueryString"  = "fields @timestamp, service_id, flag_id, flag_value | stats count() by service_id"
        }
        TimeoutSeconds = 15
        Next           = "WaitForResults"
      }
      WaitForResults = {
        Type    = "Wait"
        Seconds = 2
        Next    = "GetQueryResults"
      }
      GetQueryResults = {
        Type     = "Task"
        Resource = "arn:aws:states:::aws-sdk:cloudwatchlogs:getQueryResults"
        Parameters = {
          "QueryId.$" = "$.QueryId"
        }
        Next = "CheckConsistency"
      }
      CheckConsistency = {
        Type           = "Task"
        Resource       = var.consistency_checker_arn
        TimeoutSeconds = 5
        Next           = "ConsistencyDecision"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "TriggerRollback"
        }]
      }
      ConsistencyDecision = {
        Type = "Choice"
        Choices = [{
          Variable      = "$.isConsistent"
          BooleanEquals = false
          Next          = "TriggerRollback"
        }]
        Default = "Success"
      }
      TriggerRollback = {
        Type           = "Task"
        Resource       = var.rollback_arn
        TimeoutSeconds = 8
        Next           = "NotifyRollback"
      }
      NotifyRollback = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = var.sns_alert_topic_arn
          Message = {
            "alert"    = "Feature flag rollback triggered"
            "flagId.$" = "$.flagId"
            "reason.$" = "$.reason"
          }
        }
        End = true
      }
      Success = {
        Type = "Succeed"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_function.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tracing_configuration {
    enabled = true
  }

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "step_function" {
  name              = "/aws/states/${var.name_prefix}-verification"
  retention_in_days = var.retention_days
  kms_key_id        = var.kms_key_arn

  tags = var.tags
}

resource "aws_iam_role" "eventbridge" {
  name_prefix = "${var.name_prefix}-eventbridge-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "eventbridge" {
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.verification.arn
      }
    ]
  })
}

resource "aws_iam_role" "step_function" {
  name_prefix = "${var.name_prefix}-sfn-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "states.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "step_function" {
  role = aws_iam_role.step_function.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          var.consistency_checker_arn,
          var.rollback_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:StartQuery",
          "logs:GetQueryResults"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/${var.name_prefix}*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_alert_topic_arn
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}
