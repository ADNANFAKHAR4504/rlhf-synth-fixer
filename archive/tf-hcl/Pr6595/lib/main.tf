# KMS Keys for Encryption
resource "aws_kms_key" "dynamodb_encryption" {
  description             = "KMS key for DynamoDB table encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow DynamoDB to use the key"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "dynamodb_encryption" {
  name          = "alias/dynamodb-transactions-${var.environment}"
  target_key_id = aws_kms_key.dynamodb_encryption.key_id
}

resource "aws_kms_key" "sns_encryption" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_kms_alias" "sns_encryption" {
  name          = "alias/sns-payment-notifications-${var.environment}"
  target_key_id = aws_kms_key.sns_encryption.key_id
}

resource "aws_kms_key" "cloudwatch_encryption" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda to use the key"
        Effect = "Allow"
        Principal = {
          Service = "lambda.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "cloudwatch_encryption" {
  name          = "alias/cloudwatch-logs-${var.environment}"
  target_key_id = aws_kms_key.cloudwatch_encryption.key_id
}

# DynamoDB Table
resource "aws_dynamodb_table" "transactions" {
  name                        = "dynamodb-transactions-${var.environment}"
  billing_mode                = "PAY_PER_REQUEST"
  deletion_protection_enabled = false

  hash_key = "transaction_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_encryption.arn
  }

  point_in_time_recovery {
    enabled = true
  }
}

# SQS Queue for Lambda Dead Letter Queue
resource "aws_sqs_queue" "payment_dlq" {
  name                       = "payment-dlq-${var.environment}"
  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 60

  tags = {
    Name = "payment-dlq-${var.environment}"
  }
}



# SNS Topic
resource "aws_sns_topic" "payment_notifications" {
  name              = "sns-payment-notifications-${var.environment}"
  kms_master_key_id = aws_kms_key.sns_encryption.id
}

resource "aws_sns_topic_policy" "payment_notifications" {
  arn = aws_sns_topic.payment_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowStepFunctionsPublish"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.step_functions_execution.arn
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.payment_notifications.arn
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "validation_lambda" {
  name              = "/aws/lambda/lambda-payment-validation-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
}

resource "aws_cloudwatch_log_group" "processing_lambda" {
  name              = "/aws/lambda/lambda-payment-processing-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/sfn-payment-workflow-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "step_functions_failures" {
  alarm_name          = "alarm-sfn-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = "300"
  statistic           = "Sum"
  threshold           = "2"
  alarm_description   = "Alert when Step Functions executions fail"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.payment_workflow.arn
  }
}

resource "aws_cloudwatch_metric_alarm" "validation_lambda_errors" {
  alarm_name          = "alarm-lambda-validation-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert when validation Lambda has errors"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.validation.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "validation_lambda_throttles" {
  alarm_name          = "alarm-lambda-validation-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alert when validation Lambda is throttled"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.validation.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_lambda_errors" {
  alarm_name          = "alarm-lambda-processing-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert when processing Lambda has errors"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.processing.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_lambda_throttles" {
  alarm_name          = "alarm-lambda-processing-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alert when processing Lambda is throttled"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.processing.function_name
  }
}

resource "aws_cloudwatch_log_metric_filter" "payment_duration" {
  name           = "metric-filter-payment-duration-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.step_functions.name
  pattern        = "[time, request_id, event_type, duration]"

  metric_transformation {
    name      = "PaymentProcessingDuration"
    namespace = "PaymentWorkflow"
    value     = "$duration"
  }
}

resource "aws_cloudwatch_metric_alarm" "payment_duration" {
  alarm_name          = "alarm-payment-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "PaymentProcessingDuration"
  namespace           = "PaymentWorkflow"
  period              = "300"
  statistic           = "Average"
  threshold           = "120"
  alarm_description   = "Alert when payment processing takes too long"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]
  treat_missing_data  = "notBreaching"
}

# IAM Roles and Policies
data "aws_iam_policy_document" "step_functions_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "step_functions_execution" {
  name               = "role-sfn-payment-workflow-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.step_functions_assume_role.json
}

data "aws_iam_policy_document" "step_functions_execution" {
  statement {
    sid    = "InvokeLambdaFunctions"
    effect = "Allow"
    actions = [
      "lambda:InvokeFunction"
    ]
    resources = [
      aws_lambda_function.validation.arn,
      aws_lambda_function.processing.arn
    ]
  }

  statement {
    sid    = "PublishToSNS"
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [
      aws_sns_topic.payment_notifications.arn
    ]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogDelivery",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutLogEvents",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
      "logs:DescribeLogGroups"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "step_functions_execution" {
  name   = "policy-sfn-payment-workflow-${var.environment}"
  role   = aws_iam_role.step_functions_execution.id
  policy = data.aws_iam_policy_document.step_functions_execution.json
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "validation_lambda" {
  name               = "role-lambda-validation-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role" "processing_lambda" {
  name               = "role-lambda-processing-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "validation_lambda" {
  statement {
    sid    = "DynamoDBAccess"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem"
    ]
    resources = [
      aws_dynamodb_table.transactions.arn
    ]
  }

  statement {
    sid    = "KMSDecrypt"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = [
      aws_kms_key.dynamodb_encryption.arn
    ]
  }

  statement {
    sid    = "SQSAccess"
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]
    resources = [
      aws_sqs_queue.payment_dlq.arn
    ]
  }
}

data "aws_iam_policy_document" "processing_lambda" {
  statement {
    sid    = "DynamoDBAccess"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem"
    ]
    resources = [
      aws_dynamodb_table.transactions.arn
    ]
  }

  statement {
    sid    = "KMSDecrypt"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = [
      aws_kms_key.dynamodb_encryption.arn
    ]
  }

  statement {
    sid    = "SNSPublish"
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [
      aws_sns_topic.payment_notifications.arn
    ]
  }

  statement {
    sid    = "SQSAccess"
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]
    resources = [
      aws_sqs_queue.payment_dlq.arn
    ]
  }
}

resource "aws_iam_role_policy" "validation_lambda" {
  name   = "policy-lambda-validation-${var.environment}"
  role   = aws_iam_role.validation_lambda.id
  policy = data.aws_iam_policy_document.validation_lambda.json
}

resource "aws_iam_role_policy" "processing_lambda" {
  name   = "policy-lambda-processing-${var.environment}"
  role   = aws_iam_role.processing_lambda.id
  policy = data.aws_iam_policy_document.processing_lambda.json
}

resource "aws_iam_role_policy_attachment" "validation_lambda_basic" {
  role       = aws_iam_role.validation_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "processing_lambda_basic" {
  role       = aws_iam_role.processing_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function Archives
data "archive_file" "validation_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda_validation.py"
  output_path = "${path.module}/validation_lambda.zip"
}

data "archive_file" "processing_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda_processing.py"
  output_path = "${path.module}/processing_lambda.zip"
}

# Lambda Functions
resource "aws_lambda_function" "validation" {
  filename         = data.archive_file.validation_lambda.output_path
  function_name    = "lambda-payment-validation-${var.environment}"
  role             = aws_iam_role.validation_lambda.arn
  handler          = "lambda_validation.lambda_handler"
  source_code_hash = data.archive_file.validation_lambda.output_base64sha256
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 300

  dead_letter_config {
    target_arn = aws_sqs_queue.payment_dlq.arn
  }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name
      SNS_TOPIC_ARN       = aws_sns_topic.payment_notifications.arn
    }
  }

  depends_on = [
    aws_iam_role.validation_lambda,
    aws_iam_role_policy_attachment.validation_lambda_basic,
    aws_iam_role_policy.validation_lambda,
    aws_cloudwatch_log_group.validation_lambda
  ]
}

resource "aws_lambda_function" "processing" {
  filename         = data.archive_file.processing_lambda.output_path
  function_name    = "lambda-payment-processing-${var.environment}"
  role             = aws_iam_role.processing_lambda.arn
  handler          = "lambda_processing.lambda_handler"
  source_code_hash = data.archive_file.processing_lambda.output_base64sha256
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 300

  dead_letter_config {
    target_arn = aws_sqs_queue.payment_dlq.arn
  }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name
      SNS_TOPIC_ARN       = aws_sns_topic.payment_notifications.arn
    }
  }

  depends_on = [
    aws_iam_role.processing_lambda,
    aws_iam_role_policy_attachment.processing_lambda_basic,
    aws_iam_role_policy.processing_lambda,
    aws_cloudwatch_log_group.processing_lambda
  ]
}

# Step Functions State Machine
resource "aws_sfn_state_machine" "payment_workflow" {
  name     = "sfn-payment-workflow-${var.environment}"
  role_arn = aws_iam_role.step_functions_execution.arn
  type     = "STANDARD"

  definition = jsonencode({
    Comment        = "Payment Processing Workflow"
    StartAt        = "ValidatePayment"
    TimeoutSeconds = 600
    States = {
      ValidatePayment = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.validation.arn
          Payload = {
            "transaction_id.$" = "$.transaction_id"
            "payment_amount.$" = "$.payment_amount"
            "payment_method.$" = "$.payment_method"
            "customer_id.$"    = "$.customer_id"
          }
        }
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
          }
        ]
        Next = "ProcessPayment"
      }
      ProcessPayment = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.processing.arn
          Payload = {
            "transaction_id.$"    = "$.transaction_id"
            "payment_amount.$"    = "$.payment_amount"
            "payment_method.$"    = "$.payment_method"
            "customer_id.$"       = "$.customer_id"
            "validation_result.$" = "$.Payload"
          }
        }
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
          }
        ]
        Next = "PaymentComplete"
      }
      PaymentComplete = {
        Type = "Pass"
        Result = {
          status  = "SUCCESS"
          message = "Payment processed successfully"
        }
        End = true
      }
      NotifyFailure = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.payment_notifications.arn
          Message = {
            "error.$"          = "$.Error"
            "transaction_id.$" = "$.transaction_id"
            "timestamp.$"      = "$$.State.EnteredTime"
            "execution_arn.$"  = "$$.Execution.Id"
          }
        }
        End = true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  depends_on = [
    aws_iam_role_policy.step_functions_execution
  ]
}

# Outputs
output "step_functions_state_machine_arn" {
  value = aws_sfn_state_machine.payment_workflow.arn
}

output "step_functions_state_machine_name" {
  value = aws_sfn_state_machine.payment_workflow.name
}

output "step_functions_state_machine_id" {
  value = aws_sfn_state_machine.payment_workflow.id
}

output "step_functions_role_arn" {
  value = aws_iam_role.step_functions_execution.arn
}

output "lambda_validation_function_name" {
  value = aws_lambda_function.validation.function_name
}

output "lambda_validation_function_arn" {
  value = aws_lambda_function.validation.arn
}

output "lambda_validation_invoke_arn" {
  value = aws_lambda_function.validation.invoke_arn
}

output "lambda_validation_role_arn" {
  value = aws_iam_role.validation_lambda.arn
}

output "lambda_processing_function_name" {
  value = aws_lambda_function.processing.function_name
}

output "lambda_processing_function_arn" {
  value = aws_lambda_function.processing.arn
}

output "lambda_processing_invoke_arn" {
  value = aws_lambda_function.processing.invoke_arn
}

output "lambda_processing_role_arn" {
  value = aws_iam_role.processing_lambda.arn
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.transactions.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.transactions.arn
}

output "dynamodb_table_id" {
  value = aws_dynamodb_table.transactions.id
}

output "sns_topic_arn" {
  value = aws_sns_topic.payment_notifications.arn
}

output "sns_topic_name" {
  value = aws_sns_topic.payment_notifications.name
}

output "cloudwatch_log_group_validation_name" {
  value = aws_cloudwatch_log_group.validation_lambda.name
}

output "cloudwatch_log_group_validation_arn" {
  value = aws_cloudwatch_log_group.validation_lambda.arn
}

output "cloudwatch_log_group_processing_name" {
  value = aws_cloudwatch_log_group.processing_lambda.name
}

output "cloudwatch_log_group_processing_arn" {
  value = aws_cloudwatch_log_group.processing_lambda.arn
}

output "cloudwatch_log_group_stepfunctions_name" {
  value = aws_cloudwatch_log_group.step_functions.name
}

output "cloudwatch_log_group_stepfunctions_arn" {
  value = aws_cloudwatch_log_group.step_functions.arn
}

output "cloudwatch_alarm_sfn_failures_name" {
  value = aws_cloudwatch_metric_alarm.step_functions_failures.alarm_name
}

output "cloudwatch_alarm_sfn_failures_arn" {
  value = aws_cloudwatch_metric_alarm.step_functions_failures.arn
}

output "cloudwatch_alarm_validation_errors_name" {
  value = aws_cloudwatch_metric_alarm.validation_lambda_errors.alarm_name
}

output "cloudwatch_alarm_validation_errors_arn" {
  value = aws_cloudwatch_metric_alarm.validation_lambda_errors.arn
}

output "cloudwatch_alarm_validation_throttles_name" {
  value = aws_cloudwatch_metric_alarm.validation_lambda_throttles.alarm_name
}

output "cloudwatch_alarm_validation_throttles_arn" {
  value = aws_cloudwatch_metric_alarm.validation_lambda_throttles.arn
}

output "cloudwatch_alarm_processing_errors_name" {
  value = aws_cloudwatch_metric_alarm.processing_lambda_errors.alarm_name
}

output "cloudwatch_alarm_processing_errors_arn" {
  value = aws_cloudwatch_metric_alarm.processing_lambda_errors.arn
}

output "cloudwatch_alarm_processing_throttles_name" {
  value = aws_cloudwatch_metric_alarm.processing_lambda_throttles.alarm_name
}

output "cloudwatch_alarm_processing_throttles_arn" {
  value = aws_cloudwatch_metric_alarm.processing_lambda_throttles.arn
}

output "cloudwatch_alarm_payment_duration_name" {
  value = aws_cloudwatch_metric_alarm.payment_duration.alarm_name
}

output "cloudwatch_alarm_payment_duration_arn" {
  value = aws_cloudwatch_metric_alarm.payment_duration.arn
}

output "kms_key_dynamodb_id" {
  value = aws_kms_key.dynamodb_encryption.id
}

output "kms_key_dynamodb_arn" {
  value = aws_kms_key.dynamodb_encryption.arn
}

output "kms_key_sns_id" {
  value = aws_kms_key.sns_encryption.id
}

output "kms_key_sns_arn" {
  value = aws_kms_key.sns_encryption.arn
}

output "kms_key_cloudwatch_id" {
  value = aws_kms_key.cloudwatch_encryption.id
}

output "kms_key_cloudwatch_arn" {
  value = aws_kms_key.cloudwatch_encryption.arn
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "region" {
  value = data.aws_region.current.name
}
