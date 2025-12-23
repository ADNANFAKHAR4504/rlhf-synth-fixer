# SQS Dead Letter Queue for Lambda failures
resource "aws_sqs_queue" "lambda_dlq" {
  name = "compliance-lambda-dlq-${var.environment_suffix}"

  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 300

  tags = {
    Name        = "compliance-lambda-dlq-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Lambda function for automated remediation
resource "aws_lambda_function" "remediation" {
  filename         = "${path.module}/lambda/remediation.zip"
  function_name    = "compliance-remediation-${var.environment_suffix}"
  role             = aws_iam_role.lambda_remediation.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = var.lambda_timeout
  source_code_hash = filebase64sha256("${path.module}/lambda/remediation.zip")

  # Reserved concurrent executions to prevent throttling
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions

  # Dead letter queue for failed invocations
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
      CONFIG_BUCKET      = aws_s3_bucket.config_bucket.id
      KMS_KEY_ID         = aws_kms_key.config_key.id
      SNS_TOPIC_ARN      = var.sns_email_endpoint != "" ? aws_sns_topic.compliance_notifications[0].arn : ""
      FAILURE_MODE       = var.config_recorder_failure_mode
    }
  }

  tags = {
    Name        = "compliance-remediation-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  depends_on = [aws_cloudwatch_log_group.lambda_remediation]
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_remediation" {
  name = "compliance-lambda-remediation-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "compliance-lambda-remediation-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

locals {
  lambda_base_policy_statements = [
    {
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "arn:aws:logs:*:*:*"
    },
    {
      Effect = "Allow"
      Action = [
        "sqs:SendMessage",
        "sqs:GetQueueAttributes"
      ]
      Resource = aws_sqs_queue.lambda_dlq.arn
    },
    {
      Effect = "Allow"
      Action = [
        "s3:PutBucketPublicAccessBlock",
        "s3:PutEncryptionConfiguration",
        "s3:PutBucketVersioning"
      ]
      Resource = "arn:aws:s3:::*"
    },
    # Config can flag any EC2 or EBS resource, so remediation needs account-wide scope.
    {
      Effect = "Allow"
      Action = [
        "ec2:ModifyInstanceAttribute",
        "ec2:ModifyVolume",
        "ec2:CreateTags"
      ]
      Resource = "*"
    },
    # RDS remediation only tags resources and must work for any instance returned by Config.
    {
      Effect = "Allow"
      Action = [
        "rds:ModifyDBInstance",
        "rds:AddTagsToResource"
      ]
      Resource = "*"
    },
    {
      Effect = "Allow"
      Action = [
        "config:PutEvaluations",
        "config:GetComplianceDetailsByResource"
      ]
      Resource = "*"
    },
    {
      Effect = "Allow"
      Action = [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ]
      Resource = aws_kms_key.config_key.arn
    }
  ]

  lambda_sns_statement = var.sns_email_endpoint != "" ? [
    {
      Effect = "Allow"
      Action = [
        "sns:Publish"
      ]
      Resource = aws_sns_topic.compliance_notifications[0].arn
    }
  ] : []

  lambda_policy_statements = concat(local.lambda_base_policy_statements, local.lambda_sns_statement)
}

resource "aws_iam_role_policy" "lambda_remediation_policy" {
  name = "compliance-lambda-remediation-policy"
  role = aws_iam_role.lambda_remediation.id

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = local.lambda_policy_statements
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_remediation" {
  name              = "/aws/lambda/compliance-remediation-${var.environment_suffix}"
  retention_in_days = 14

  tags = {
    Name        = "compliance-remediation-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# EventBridge Rule for Config Compliance Changes
resource "aws_cloudwatch_event_rule" "config_compliance_change" {
  name        = "compliance-config-change-${var.environment_suffix}"
  description = "Trigger remediation on Config compliance changes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
      newEvaluationResult = {
        complianceType = ["NON_COMPLIANT"]
      }
    }
  })

  tags = {
    Name        = "compliance-config-change-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "lambda_remediation" {
  count = var.enable_auto_remediation ? 1 : 0
  rule  = aws_cloudwatch_event_rule.config_compliance_change.name
  arn   = aws_lambda_function.remediation.arn

  # Retry policy for failed invocations
  retry_policy {
    maximum_retry_attempts       = var.eventbridge_retry_attempts
    maximum_event_age_in_seconds = var.eventbridge_maximum_event_age
  }

  # Dead letter queue for events that fail all retries
  dead_letter_config {
    arn = aws_sqs_queue.eventbridge_dlq.arn
  }
}

# SQS Dead Letter Queue for EventBridge failures
resource "aws_sqs_queue" "eventbridge_dlq" {
  name = "compliance-eventbridge-dlq-${var.environment_suffix}"

  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 300

  tags = {
    Name        = "compliance-eventbridge-dlq-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_lambda_permission" "allow_eventbridge" {
  count         = var.enable_auto_remediation ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.config_compliance_change.arn
}

# CloudWatch Alarms for monitoring Lambda function
# Commented out for LocalStack compatibility - CloudWatch Metric Alarms have serialization issues in LocalStack
# resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
#   alarm_name          = "compliance-lambda-errors-${var.environment_suffix}"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = "2"
#   metric_name         = "Errors"
#   namespace           = "AWS/Lambda"
#   period              = "60"
#   statistic           = "Sum"
#   threshold           = "5"
#   alarm_description   = "This metric monitors lambda errors"
#   treat_missing_data  = "notBreaching"
#
#   dimensions = {
#     FunctionName = aws_lambda_function.remediation.function_name
#   }
#
#   alarm_actions = var.sns_email_endpoint != "" ? [aws_sns_topic.compliance_notifications[0].arn] : []
#
#   tags = {
#     Name        = "compliance-lambda-errors-${var.environment_suffix}"
#     Environment = var.environment_suffix
#   }
# }

# resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
#   alarm_name          = "compliance-lambda-throttles-${var.environment_suffix}"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = "1"
#   metric_name         = "Throttles"
#   namespace           = "AWS/Lambda"
#   period              = "60"
#   statistic           = "Sum"
#   threshold           = "10"
#   alarm_description   = "This metric monitors lambda throttling"
#   treat_missing_data  = "notBreaching"
#
#   dimensions = {
#     FunctionName = aws_lambda_function.remediation.function_name
#   }
#
#   alarm_actions = var.sns_email_endpoint != "" ? [aws_sns_topic.compliance_notifications[0].arn] : []
#
#   tags = {
#     Name        = "compliance-lambda-throttles-${var.environment_suffix}"
#     Environment = var.environment_suffix
#   }
# }
#
# resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
#   alarm_name          = "compliance-lambda-duration-${var.environment_suffix}"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = "2"
#   metric_name         = "Duration"
#   namespace           = "AWS/Lambda"
#   period              = "60"
#   statistic           = "Average"
#   threshold           = var.lambda_timeout * 0.8 * 1000 # 80% of timeout in milliseconds
#   alarm_description   = "This metric monitors lambda duration approaching timeout"
#   treat_missing_data  = "notBreaching"
#
#   dimensions = {
#     FunctionName = aws_lambda_function.remediation.function_name
#   }
#
#   alarm_actions = var.sns_email_endpoint != "" ? [aws_sns_topic.compliance_notifications[0].arn] : []
#
#   tags = {
#     Name        = "compliance-lambda-duration-${var.environment_suffix}"
#     Environment = var.environment_suffix
#   }
# }
#
# # Alarm for Dead Letter Queue messages
# resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
#   alarm_name          = "compliance-dlq-messages-${var.environment_suffix}"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = "1"
#   metric_name         = "ApproximateNumberOfMessagesVisible"
#   namespace           = "AWS/SQS"
#   period              = "300"
#   statistic           = "Sum"
#   threshold           = "1"
#   alarm_description   = "Messages in DLQ indicate failed Lambda executions"
#   treat_missing_data  = "notBreaching"
#
#   dimensions = {
#     QueueName = aws_sqs_queue.lambda_dlq.name
#   }
#
#   alarm_actions = var.sns_email_endpoint != "" ? [aws_sns_topic.compliance_notifications[0].arn] : []
#
#   tags = {
#     Name        = "compliance-dlq-messages-${var.environment_suffix}"
#     Environment = var.environment_suffix
#   }
# }
