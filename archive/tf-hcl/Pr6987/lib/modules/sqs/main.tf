# modules/sqs/main.tf - SQS Queues and Policies Module

# ================================
# SQS FIFO QUEUES - Transaction Processing Pipeline
# ================================

# Transaction Validation Queue (FIFO)
resource "aws_sqs_queue" "transaction_validation" {
  name                        = var.transaction_validation_queue_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.message_retention_seconds
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  max_message_size            = var.max_message_size

  # Server-side encryption with AWS managed keys
  sqs_managed_sse_enabled = true

  # Dead letter queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.transaction_validation_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(var.common_tags, {
    Name            = var.transaction_validation_queue_name
    Purpose         = "FIFO queue for transaction validation processing"
    QueueType       = "Primary"
    ProcessingStage = "Validation"
  })
}

# Transaction Validation Dead Letter Queue
resource "aws_sqs_queue" "transaction_validation_dlq" {
  name                        = var.transaction_validation_dlq_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.dlq_message_retention_seconds

  sqs_managed_sse_enabled = true

  tags = merge(var.common_tags, {
    Name            = var.transaction_validation_dlq_name
    Purpose         = "Dead letter queue for failed transaction validations"
    QueueType       = "DLQ"
    ProcessingStage = "Validation"
  })
}

# Fraud Detection Queue (FIFO)
resource "aws_sqs_queue" "fraud_detection" {
  name                        = var.fraud_detection_queue_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.message_retention_seconds
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  max_message_size            = var.max_message_size

  sqs_managed_sse_enabled = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.fraud_detection_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(var.common_tags, {
    Name            = var.fraud_detection_queue_name
    Purpose         = "FIFO queue for fraud detection processing"
    QueueType       = "Primary"
    ProcessingStage = "FraudDetection"
  })
}

# Fraud Detection Dead Letter Queue
resource "aws_sqs_queue" "fraud_detection_dlq" {
  name                        = var.fraud_detection_dlq_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.dlq_message_retention_seconds

  sqs_managed_sse_enabled = true

  tags = merge(var.common_tags, {
    Name            = var.fraud_detection_dlq_name
    Purpose         = "Dead letter queue for failed fraud detection"
    QueueType       = "DLQ"
    ProcessingStage = "FraudDetection"
  })
}

# Payment Notification Queue (FIFO)
resource "aws_sqs_queue" "payment_notification" {
  name                        = var.payment_notification_queue_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.message_retention_seconds
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  max_message_size            = var.max_message_size

  sqs_managed_sse_enabled = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_notification_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(var.common_tags, {
    Name            = var.payment_notification_queue_name
    Purpose         = "FIFO queue for payment notification processing"
    QueueType       = "Primary"
    ProcessingStage = "Notification"
  })
}

# Payment Notification Dead Letter Queue
resource "aws_sqs_queue" "payment_notification_dlq" {
  name                        = var.payment_notification_dlq_name
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = var.dlq_message_retention_seconds

  sqs_managed_sse_enabled = true

  tags = merge(var.common_tags, {
    Name            = var.payment_notification_dlq_name
    Purpose         = "Dead letter queue for failed payment notifications"
    QueueType       = "DLQ"
    ProcessingStage = "Notification"
  })
}

# ================================
# SQS QUEUE POLICIES - Least Privilege Access
# ================================

# Transaction Validation Queue Policy
resource "aws_sqs_queue_policy" "transaction_validation" {
  queue_url = aws_sqs_queue.transaction_validation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowValidationLambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.lambda_validation_role_arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.transaction_validation.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.account_id
          }
        }
      }
    ]
  })
}

# Fraud Detection Queue Policy
resource "aws_sqs_queue_policy" "fraud_detection" {
  queue_url = aws_sqs_queue.fraud_detection.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowFraudLambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.lambda_fraud_role_arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.fraud_detection.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.account_id
          }
        }
      },
      {
        Sid    = "AllowEventBridgePipeAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.eventbridge_role_arn
        }
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.fraud_detection.arn
      }
    ]
  })
}

# Payment Notification Queue Policy
resource "aws_sqs_queue_policy" "payment_notification" {
  queue_url = aws_sqs_queue.payment_notification.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowNotificationLambdaAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.lambda_notification_role_arn
        }
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.payment_notification.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.account_id
          }
        }
      },
      {
        Sid    = "AllowEventBridgePipeAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.eventbridge_role_arn
        }
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.payment_notification.arn
      }
    ]
  })
}

# ================================
# DYNAMODB TABLE - Transaction State Management
# ================================

resource "aws_dynamodb_table" "transaction_state" {
  name         = var.transaction_state_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"
  range_key    = "merchant_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "merchant_id"
    type = "S"
  }

  attribute {
    name = "processing_stage"
    type = "S"
  }

  attribute {
    name = "created_timestamp"
    type = "S"
  }

  global_secondary_index {
    name            = "ProcessingStageIndex"
    hash_key        = "processing_stage"
    range_key       = "created_timestamp"
    projection_type = "ALL"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # TTL for automatic cleanup of old records
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = merge(var.common_tags, {
    Name    = var.transaction_state_table_name
    Purpose = "Transaction state management across processing stages"
    Service = "DynamoDB"
  })
}

# ================================
# SSM PARAMETERS - Queue URLs for Lambda Configuration
# ================================

# SSM Parameter for Transaction Validation Queue URL
resource "aws_ssm_parameter" "validation_queue_url" {
  name  = var.ssm_validation_queue_url
  type  = "String"
  value = aws_sqs_queue.transaction_validation.url

  description = "SQS Queue URL for transaction validation processing"

  tags = merge(var.common_tags, {
    Name    = "ValidationQueueURL"
    Purpose = "Store queue URL for Lambda configuration"
    Service = "SSM"
  })
}

# SSM Parameter for Fraud Detection Queue URL
resource "aws_ssm_parameter" "fraud_queue_url" {
  name  = var.ssm_fraud_queue_url
  type  = "String"
  value = aws_sqs_queue.fraud_detection.url

  description = "SQS Queue URL for fraud detection processing"

  tags = merge(var.common_tags, {
    Name    = "FraudQueueURL"
    Purpose = "Store queue URL for Lambda configuration"
    Service = "SSM"
  })
}

# SSM Parameter for Payment Notification Queue URL
resource "aws_ssm_parameter" "notification_queue_url" {
  name  = var.ssm_notification_queue_url
  type  = "String"
  value = aws_sqs_queue.payment_notification.url

  description = "SQS Queue URL for payment notification processing"

  tags = merge(var.common_tags, {
    Name    = "NotificationQueueURL"
    Purpose = "Store queue URL for Lambda configuration"
    Service = "SSM"
  })
}