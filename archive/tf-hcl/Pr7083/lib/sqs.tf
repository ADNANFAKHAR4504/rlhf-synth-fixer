resource "aws_sqs_queue" "webhook_dlq" {
  name                      = "${var.project}-${var.environment}-webhook-dlq-${local.suffix}"
  message_retention_seconds = 1209600

  tags = local.common_tags
}

resource "aws_sqs_queue" "webhook_processing_queue" {
  name                       = "${var.project}-${var.environment}-webhook-processing-${local.suffix}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.webhook_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags
}

resource "aws_sqs_queue" "validated_queue" {
  name                       = "${var.project}-${var.environment}-validated-${local.suffix}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.webhook_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags
}
