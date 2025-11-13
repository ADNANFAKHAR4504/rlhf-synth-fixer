# Dead Letter Queues
resource "aws_sqs_queue" "validation_dlq" {
  name                      = "webhook-validation-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "webhook-validation-dlq-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "DLQ for validation queue"
  }
}

resource "aws_sqs_queue" "processing_dlq" {
  name                      = "webhook-processing-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "webhook-processing-dlq-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "DLQ for processing queue"
  }
}

resource "aws_sqs_queue" "notification_dlq" {
  name                      = "webhook-notification-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "webhook-notification-dlq-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "DLQ for notification queue"
  }
}

# Main Queues
resource "aws_sqs_queue" "validation_queue" {
  name                       = "webhook-validation-queue-${var.environment_suffix}"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.validation_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = {
    Name        = "webhook-validation-queue-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Main queue for webhook validation"
  }
}

resource "aws_sqs_queue" "processing_queue" {
  name                       = "webhook-processing-queue-${var.environment_suffix}"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.processing_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = {
    Name        = "webhook-processing-queue-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Main queue for webhook processing"
  }
}

resource "aws_sqs_queue" "notification_queue" {
  name                       = "webhook-notification-queue-${var.environment_suffix}"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notification_dlq.arn
    maxReceiveCount     = var.sqs_max_receive_count
  })

  tags = {
    Name        = "webhook-notification-queue-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Main queue for webhook notifications"
  }
}
