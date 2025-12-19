resource "aws_sqs_queue" "webhook_processing" {
  name                       = "${local.resource_prefix}-webhook-processing"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600                # 14 days
  receive_wait_time_seconds  = 20                     # Long polling
  visibility_timeout_seconds = var.lambda_timeout * 6 # 6 times Lambda timeout

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.webhook_dlq.arn
    maxReceiveCount     = 3
  })

  kms_master_key_id                 = "alias/aws/sqs"
  kms_data_key_reuse_period_seconds = 300

  tags = local.common_tags
}

resource "aws_sqs_queue" "webhook_dlq" {
  name                      = "${local.resource_prefix}-webhook-dlq"
  max_message_size          = 262144
  message_retention_seconds = 1209600 # 14 days

  kms_master_key_id                 = "alias/aws/sqs"
  kms_data_key_reuse_period_seconds = 300

  tags = local.common_tags
}

resource "aws_sqs_queue_policy" "webhook_processing" {
  queue_url = aws_sqs_queue.webhook_processing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.webhook_processing.arn
      }
    ]
  })
}