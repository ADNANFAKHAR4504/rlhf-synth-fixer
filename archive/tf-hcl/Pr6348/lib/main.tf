# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# IAM Roles for Lambda Functions
resource "aws_iam_role" "transaction_validator_role" {
  name = "transaction-validator-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role" "fraud_detector_role" {
  name = "fraud-detector-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role" "notification_dispatcher_role" {
  name = "notification-dispatcher-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Role Policies for Lambda Functions
resource "aws_iam_role_policy" "transaction_validator_policy" {
  name = "transaction-validator-policy"
  role = aws_iam_role.transaction_validator_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.transaction_validation.arn
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem"]
        Resource = aws_dynamodb_table.payment_transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.transaction_validator.arn}:*"
      }
    ]
  })

  depends_on = [
    aws_sqs_queue.transaction_validation,
    aws_dynamodb_table.payment_transactions
  ]
}

resource "aws_iam_role_policy" "fraud_detector_policy" {
  name = "fraud-detector-policy"
  role = aws_iam_role.fraud_detector_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.fraud_detection.arn
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:UpdateItem"]
        Resource = aws_dynamodb_table.payment_transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.fraud_detector.arn}:*"
      }
    ]
  })

  depends_on = [
    aws_sqs_queue.fraud_detection,
    aws_dynamodb_table.payment_transactions
  ]
}

resource "aws_iam_role_policy" "notification_dispatcher_policy" {
  name = "notification-dispatcher-policy"
  role = aws_iam_role.notification_dispatcher_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.payment_notification.arn
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem"]
        Resource = aws_dynamodb_table.payment_transactions.arn
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.payment_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.notification_dispatcher.arn}:*"
      }
    ]
  })

  depends_on = [
    aws_sqs_queue.payment_notification,
    aws_dynamodb_table.payment_transactions,
    aws_sns_topic.payment_notifications
  ]
}

# SQS FIFO Queues - Primary
resource "aws_sqs_queue" "transaction_validation" {
  name                        = "transaction-validation.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  max_message_size            = 262144 # 256 KB
  visibility_timeout_seconds  = 300
  message_retention_seconds   = 604800 # 7 days
  sqs_managed_sse_enabled     = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.transaction_validation_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    QueueType = "Primary"
    Purpose   = "TransactionValidation"
  }
}

resource "aws_sqs_queue" "fraud_detection" {
  name                        = "fraud-detection.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  max_message_size            = 262144
  visibility_timeout_seconds  = 300
  message_retention_seconds   = 604800
  sqs_managed_sse_enabled     = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.fraud_detection_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    QueueType = "Primary"
    Purpose   = "FraudDetection"
  }
}

resource "aws_sqs_queue" "payment_notification" {
  name                        = "payment-notification.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  max_message_size            = 262144
  visibility_timeout_seconds  = 300
  message_retention_seconds   = 604800
  sqs_managed_sse_enabled     = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_notification_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    QueueType = "Primary"
    Purpose   = "PaymentNotification"
  }
}

# SQS FIFO Queues - Dead Letter Queues
resource "aws_sqs_queue" "transaction_validation_dlq" {
  name                        = "transaction-validation-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  max_message_size            = 262144
  message_retention_seconds   = 604800
  sqs_managed_sse_enabled     = true

  tags = {
    QueueType = "DeadLetter"
    Purpose   = "TransactionValidation"
  }
}

resource "aws_sqs_queue" "fraud_detection_dlq" {
  name                        = "fraud-detection-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  max_message_size            = 262144
  message_retention_seconds   = 604800
  sqs_managed_sse_enabled     = true

  tags = {
    QueueType = "DeadLetter"
    Purpose   = "FraudDetection"
  }
}

resource "aws_sqs_queue" "payment_notification_dlq" {
  name                        = "payment-notification-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  max_message_size            = 262144
  message_retention_seconds   = 604800
  sqs_managed_sse_enabled     = true

  tags = {
    QueueType = "DeadLetter"
    Purpose   = "PaymentNotification"
  }
}

# SQS Queue Policies
resource "aws_sqs_queue_policy" "transaction_validation_policy" {
  queue_url = aws_sqs_queue.transaction_validation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RootAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "sqs:*"
        Resource = aws_sqs_queue.transaction_validation.arn
      },
      {
        Sid    = "LambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.transaction_validator_role.arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.transaction_validation.arn
      },
      {
        Sid    = "PipeAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.validation_to_fraud_pipe_role.arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.transaction_validation.arn
      }
    ]
  })

  depends_on = [
    aws_sqs_queue.transaction_validation,
    aws_iam_role.validation_to_fraud_pipe_role
  ]
}

resource "aws_sqs_queue_policy" "fraud_detection_policy" {
  queue_url = aws_sqs_queue.fraud_detection.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RootAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "sqs:*"
        Resource = aws_sqs_queue.fraud_detection.arn
      },
      {
        Sid    = "LambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.fraud_detector_role.arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.fraud_detection.arn
      },
      {
        Sid    = "PipeSendAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.validation_to_fraud_pipe_role.arn
        }
        Action   = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.fraud_detection.arn
      },
      {
        Sid    = "PipeReceiveAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.fraud_to_notification_pipe_role.arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.fraud_detection.arn
      }
    ]
  })

  depends_on = [
    aws_sqs_queue.fraud_detection,
    aws_iam_role.validation_to_fraud_pipe_role,
    aws_iam_role.fraud_to_notification_pipe_role
  ]
}

resource "aws_sqs_queue_policy" "payment_notification_policy" {
  queue_url = aws_sqs_queue.payment_notification.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RootAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "sqs:*"
        Resource = aws_sqs_queue.payment_notification.arn
      },
      {
        Sid    = "LambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.notification_dispatcher_role.arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.payment_notification.arn
      },
      {
        Sid    = "PipeAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.fraud_to_notification_pipe_role.arn
        }
        Action   = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.payment_notification.arn
      }
    ]
  })

  depends_on = [
    aws_sqs_queue.payment_notification,
    aws_iam_role.fraud_to_notification_pipe_role
  ]
}

# EventBridge Pipes IAM Roles
resource "aws_iam_role" "validation_to_fraud_pipe_role" {
  name = "validation-to-fraud-pipe-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "pipes.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "validation_to_fraud_pipe_policy" {
  name = "validation-to-fraud-pipe-policy"
  role = aws_iam_role.validation_to_fraud_pipe_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.transaction_validation.arn
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.fraud_detection.arn
      }
    ]
  })
}

resource "aws_iam_role" "fraud_to_notification_pipe_role" {
  name = "fraud-to-notification-pipe-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "pipes.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "fraud_to_notification_pipe_policy" {
  name = "fraud-to-notification-pipe-policy"
  role = aws_iam_role.fraud_to_notification_pipe_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.fraud_detection.arn
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.payment_notification.arn
      }
    ]
  })
}

# EventBridge Pipes
resource "aws_pipes_pipe" "validation_to_fraud" {
  name     = "validation-to-fraud"
  role_arn = aws_iam_role.validation_to_fraud_pipe_role.arn
  source   = aws_sqs_queue.transaction_validation.arn
  target   = aws_sqs_queue.fraud_detection.arn

  source_parameters {
    sqs_queue_parameters {
      batch_size                         = 1
      maximum_batching_window_in_seconds = 0
    }
  }

  target_parameters {
    sqs_queue_parameters {
      message_group_id = "$.messageGroupId"
    }
  }

  depends_on = [
    aws_sqs_queue.transaction_validation,
    aws_sqs_queue.fraud_detection,
    aws_iam_role_policy.validation_to_fraud_pipe_policy
  ]
}

resource "aws_pipes_pipe" "fraud_to_notification" {
  name     = "fraud-to-notification"
  role_arn = aws_iam_role.fraud_to_notification_pipe_role.arn
  source   = aws_sqs_queue.fraud_detection.arn
  target   = aws_sqs_queue.payment_notification.arn

  source_parameters {
    sqs_queue_parameters {
      batch_size                         = 1
      maximum_batching_window_in_seconds = 0
    }
  }

  target_parameters {
    sqs_queue_parameters {
      message_group_id = "$.messageGroupId"
    }
  }

  depends_on = [
    aws_sqs_queue.fraud_detection,
    aws_sqs_queue.payment_notification,
    aws_iam_role_policy.fraud_to_notification_pipe_policy
  ]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "transaction_validator" {
  name              = "/aws/lambda/transaction-validator"
  retention_in_days = var.cloudwatch_retention_days
}

resource "aws_cloudwatch_log_group" "fraud_detector" {
  name              = "/aws/lambda/fraud-detector"
  retention_in_days = var.cloudwatch_retention_days
}

resource "aws_cloudwatch_log_group" "notification_dispatcher" {
  name              = "/aws/lambda/notification-dispatcher"
  retention_in_days = var.cloudwatch_retention_days
}

# Archive Data Sources for Lambda Code
# Archive Data Sources for Lambda Code
data "archive_file" "transaction_validator_zip" {
  type        = "zip"
  source_file = "${path.module}/transaction_validator.py"
  output_path = "${path.module}/transaction_validator.zip"
}

data "archive_file" "fraud_detector_zip" {
  type        = "zip"
  source_file = "${path.module}/fraud_detector.py"
  output_path = "${path.module}/fraud_detector.zip"
}

data "archive_file" "notification_dispatcher_zip" {
  type        = "zip"
  source_file = "${path.module}/notification_dispatcher.py"
  output_path = "${path.module}/notification_dispatcher.zip"
}

# Lambda Functions
resource "aws_lambda_function" "transaction_validator" {
  function_name = "transaction-validator"
  role          = aws_iam_role.transaction_validator_role.arn
  handler       = "transaction_validator.lambda_handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 300

  filename         = data.archive_file.transaction_validator_zip.output_path
  source_code_hash = data.archive_file.transaction_validator_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.payment_transactions.name
    }
  }

  tags = {
    FunctionPurpose = "TransactionValidation"
  }

  depends_on = [
    aws_iam_role_policy.transaction_validator_policy,
    aws_cloudwatch_log_group.transaction_validator
  ]
}

resource "aws_lambda_function" "fraud_detector" {
  function_name = "fraud-detector"
  role          = aws_iam_role.fraud_detector_role.arn
  handler       = "fraud_detector.lambda_handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 300

  filename         = data.archive_file.fraud_detector_zip.output_path
  source_code_hash = data.archive_file.fraud_detector_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.payment_transactions.name
    }
  }

  tags = {
    FunctionPurpose = "FraudDetection"
  }

  depends_on = [
    aws_iam_role_policy.fraud_detector_policy,
    aws_cloudwatch_log_group.fraud_detector
  ]
}

resource "aws_lambda_function" "notification_dispatcher" {
  function_name = "notification-dispatcher"
  role          = aws_iam_role.notification_dispatcher_role.arn
  handler       = "notification_dispatcher.lambda_handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 300

  filename         = data.archive_file.notification_dispatcher_zip.output_path
  source_code_hash = data.archive_file.notification_dispatcher_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.payment_transactions.name
      SNS_TOPIC_ARN  = aws_sns_topic.payment_notifications.arn
    }
  }

  tags = {
    FunctionPurpose = "NotificationDispatch"
  }

  depends_on = [
    aws_iam_role_policy.notification_dispatcher_policy,
    aws_cloudwatch_log_group.notification_dispatcher
  ]
}

# Lambda Event Source Mappings
resource "aws_lambda_event_source_mapping" "transaction_validator_sqs" {
  event_source_arn                   = aws_sqs_queue.transaction_validation.arn
  function_name                      = aws_lambda_function.transaction_validator.arn
  batch_size                         = 1
  maximum_batching_window_in_seconds = 0
  function_response_types            = ["ReportBatchItemFailures"]

  depends_on = [
    aws_lambda_function.transaction_validator,
    aws_sqs_queue.transaction_validation
  ]
}

resource "aws_lambda_event_source_mapping" "fraud_detector_sqs" {
  event_source_arn                   = aws_sqs_queue.fraud_detection.arn
  function_name                      = aws_lambda_function.fraud_detector.arn
  batch_size                         = 1
  maximum_batching_window_in_seconds = 0
  function_response_types            = ["ReportBatchItemFailures"]

  depends_on = [
    aws_lambda_function.fraud_detector,
    aws_sqs_queue.fraud_detection
  ]
}

resource "aws_lambda_event_source_mapping" "notification_dispatcher_sqs" {
  event_source_arn                   = aws_sqs_queue.payment_notification.arn
  function_name                      = aws_lambda_function.notification_dispatcher.arn
  batch_size                         = 1
  maximum_batching_window_in_seconds = 0
  function_response_types            = ["ReportBatchItemFailures"]

  depends_on = [
    aws_lambda_function.notification_dispatcher,
    aws_sqs_queue.payment_notification
  ]
}

# DynamoDB Table
resource "aws_dynamodb_table" "payment_transactions" {
  name         = "payment-transactions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  global_secondary_index {
    name            = "customer-id-index"
    hash_key        = "customer_id"
    projection_type = "ALL"
  }

  ttl {
    enabled        = true
    attribute_name = "ttl"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    TablePurpose = "PaymentTransactions"
  }
}

# SNS Topic
resource "aws_sns_topic" "payment_notifications" {
  name         = "payment-notifications"
  display_name = "Payment Processing Notifications"

  kms_master_key_id = "alias/aws/sns"

  tags = {
    TopicPurpose = "PaymentNotifications"
  }
}

resource "aws_sns_topic_policy" "payment_notifications_policy" {
  arn = aws_sns_topic.payment_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RootAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "SNS:GetTopicAttributes",
          "SNS:SetTopicAttributes",
          "SNS:AddPermission",
          "SNS:RemovePermission",
          "SNS:DeleteTopic",
          "SNS:Subscribe",
          "SNS:ListSubscriptionsByTopic",
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.payment_notifications.arn
      },
      {
        Sid    = "LambdaPublishAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.notification_dispatcher_role.arn
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.payment_notifications.arn
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "email_notification" {
  topic_arn = aws_sns_topic.payment_notifications.arn
  protocol  = "email"
  endpoint  = var.email_address
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "transaction_validation_depth" {
  alarm_name          = "transaction-validation-queue-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Alarm when transaction validation queue depth exceeds 1000"

  dimensions = {
    QueueName = aws_sqs_queue.transaction_validation.name
  }
}

resource "aws_cloudwatch_metric_alarm" "fraud_detection_depth" {
  alarm_name          = "fraud-detection-queue-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Alarm when fraud detection queue depth exceeds 1000"

  dimensions = {
    QueueName = aws_sqs_queue.fraud_detection.name
  }
}

resource "aws_cloudwatch_metric_alarm" "payment_notification_depth" {
  alarm_name          = "payment-notification-queue-depth-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Alarm when payment notification queue depth exceeds 1000"

  dimensions = {
    QueueName = aws_sqs_queue.payment_notification.name
  }
}

resource "aws_cloudwatch_metric_alarm" "transaction_validation_dlq" {
  alarm_name          = "transaction-validation-dlq-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alarm when messages appear in transaction validation DLQ"

  dimensions = {
    QueueName = aws_sqs_queue.transaction_validation_dlq.name
  }
}

resource "aws_cloudwatch_metric_alarm" "fraud_detection_dlq" {
  alarm_name          = "fraud-detection-dlq-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alarm when messages appear in fraud detection DLQ"

  dimensions = {
    QueueName = aws_sqs_queue.fraud_detection_dlq.name
  }
}

resource "aws_cloudwatch_metric_alarm" "payment_notification_dlq" {
  alarm_name          = "payment-notification-dlq-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alarm when messages appear in payment notification DLQ"

  dimensions = {
    QueueName = aws_sqs_queue.payment_notification_dlq.name
  }
}

# SSM Parameters
resource "aws_ssm_parameter" "transaction_validation_queue_url" {
  name        = "/payment-pipeline/transaction-validation-queue-url"
  description = "URL of the transaction validation SQS queue"
  type        = "String"
  value       = aws_sqs_queue.transaction_validation.url

  depends_on = [aws_sqs_queue.transaction_validation]
}

resource "aws_ssm_parameter" "fraud_detection_queue_url" {
  name        = "/payment-pipeline/fraud-detection-queue-url"
  description = "URL of the fraud detection SQS queue"
  type        = "String"
  value       = aws_sqs_queue.fraud_detection.url

  depends_on = [aws_sqs_queue.fraud_detection]
}

resource "aws_ssm_parameter" "payment_notification_queue_url" {
  name        = "/payment-pipeline/payment-notification-queue-url"
  description = "URL of the payment notification SQS queue"
  type        = "String"
  value       = aws_sqs_queue.payment_notification.url

  depends_on = [aws_sqs_queue.payment_notification]
}

# Outputs
output "transaction_validation_queue_url" {
  description = "URL of the transaction validation queue"
  value       = aws_sqs_queue.transaction_validation.url
  sensitive   = true
}

output "transaction_validation_queue_arn" {
  description = "ARN of the transaction validation queue"
  value       = aws_sqs_queue.transaction_validation.arn
}

output "transaction_validation_dlq_url" {
  description = "URL of the transaction validation DLQ"
  value       = aws_sqs_queue.transaction_validation_dlq.url
  sensitive   = true
}

output "transaction_validation_dlq_arn" {
  description = "ARN of the transaction validation DLQ"
  value       = aws_sqs_queue.transaction_validation_dlq.arn
}

output "fraud_detection_queue_url" {
  description = "URL of the fraud detection queue"
  value       = aws_sqs_queue.fraud_detection.url
  sensitive   = true
}

output "fraud_detection_queue_arn" {
  description = "ARN of the fraud detection queue"
  value       = aws_sqs_queue.fraud_detection.arn
}

output "fraud_detection_dlq_url" {
  description = "URL of the fraud detection DLQ"
  value       = aws_sqs_queue.fraud_detection_dlq.url
  sensitive   = true
}

output "fraud_detection_dlq_arn" {
  description = "ARN of the fraud detection DLQ"
  value       = aws_sqs_queue.fraud_detection_dlq.arn
}

output "payment_notification_queue_url" {
  description = "URL of the payment notification queue"
  value       = aws_sqs_queue.payment_notification.url
  sensitive   = true
}

output "payment_notification_queue_arn" {
  description = "ARN of the payment notification queue"
  value       = aws_sqs_queue.payment_notification.arn
}

output "payment_notification_dlq_url" {
  description = "URL of the payment notification DLQ"
  value       = aws_sqs_queue.payment_notification_dlq.url
  sensitive   = true
}

output "payment_notification_dlq_arn" {
  description = "ARN of the payment notification DLQ"
  value       = aws_sqs_queue.payment_notification_dlq.arn
}

output "transaction_validator_function_name" {
  description = "Name of the transaction validator Lambda function"
  value       = aws_lambda_function.transaction_validator.function_name
}

output "transaction_validator_function_arn" {
  description = "ARN of the transaction validator Lambda function"
  value       = aws_lambda_function.transaction_validator.arn
}

output "transaction_validator_role_arn" {
  description = "ARN of the transaction validator IAM role"
  value       = aws_iam_role.transaction_validator_role.arn
}

output "fraud_detector_function_name" {
  description = "Name of the fraud detector Lambda function"
  value       = aws_lambda_function.fraud_detector.function_name
}

output "fraud_detector_function_arn" {
  description = "ARN of the fraud detector Lambda function"
  value       = aws_lambda_function.fraud_detector.arn
}

output "fraud_detector_role_arn" {
  description = "ARN of the fraud detector IAM role"
  value       = aws_iam_role.fraud_detector_role.arn
}

output "notification_dispatcher_function_name" {
  description = "Name of the notification dispatcher Lambda function"
  value       = aws_lambda_function.notification_dispatcher.function_name
}

output "notification_dispatcher_function_arn" {
  description = "ARN of the notification dispatcher Lambda function"
  value       = aws_lambda_function.notification_dispatcher.arn
}

output "notification_dispatcher_role_arn" {
  description = "ARN of the notification dispatcher IAM role"
  value       = aws_iam_role.notification_dispatcher_role.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB payments table"
  value       = aws_dynamodb_table.payment_transactions.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB payments table"
  value       = aws_dynamodb_table.payment_transactions.arn
}

output "dynamodb_gsi_name" {
  description = "Name of the customer ID GSI"
  value       = "customer-id-index"
}

output "sns_topic_arn" {
  description = "ARN of the SNS payment notifications topic"
  value       = aws_sns_topic.payment_notifications.arn
}

output "sns_subscription_arn" {
  description = "ARN of the email subscription"
  value       = aws_sns_topic_subscription.email_notification.arn
  sensitive   = true
}

output "validation_to_fraud_pipe_arn" {
  description = "ARN of the validation to fraud EventBridge pipe"
  value       = aws_pipes_pipe.validation_to_fraud.arn
}

output "fraud_to_notification_pipe_arn" {
  description = "ARN of the fraud to notification EventBridge pipe"
  value       = aws_pipes_pipe.fraud_to_notification.arn
}

output "log_group_names" {
  description = "List of CloudWatch log group names"
  value = [
    aws_cloudwatch_log_group.transaction_validator.name,
    aws_cloudwatch_log_group.fraud_detector.name,
    aws_cloudwatch_log_group.notification_dispatcher.name
  ]
}

output "queue_depth_alarm_names" {
  description = "List of queue depth alarm names"
  value = [
    aws_cloudwatch_metric_alarm.transaction_validation_depth.alarm_name,
    aws_cloudwatch_metric_alarm.fraud_detection_depth.alarm_name,
    aws_cloudwatch_metric_alarm.payment_notification_depth.alarm_name
  ]
}

output "dlq_alarm_names" {
  description = "List of DLQ alarm names"
  value = [
    aws_cloudwatch_metric_alarm.transaction_validation_dlq.alarm_name,
    aws_cloudwatch_metric_alarm.fraud_detection_dlq.alarm_name,
    aws_cloudwatch_metric_alarm.payment_notification_dlq.alarm_name
  ]
}

output "ssm_parameter_names" {
  description = "List of SSM parameter names"
  value = [
    aws_ssm_parameter.transaction_validation_queue_url.name,
    aws_ssm_parameter.fraud_detection_queue_url.name,
    aws_ssm_parameter.payment_notification_queue_url.name
  ]
}

output "ssm_parameter_arns" {
  description = "List of SSM parameter ARNs"
  value = [
    aws_ssm_parameter.transaction_validation_queue_url.arn,
    aws_ssm_parameter.fraud_detection_queue_url.arn,
    aws_ssm_parameter.payment_notification_queue_url.arn
  ]
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}

output "account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}