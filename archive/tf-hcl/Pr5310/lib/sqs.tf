# sqs.tf

# Dead Letter Queue for Failed Webhook Processing
resource "aws_sqs_queue" "dlq" {
  name                       = local.dlq_name
  message_retention_seconds  = var.dlq_message_retention_seconds
  visibility_timeout_seconds = var.dlq_visibility_timeout_seconds

  # Server-side encryption
  sqs_managed_sse_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name    = local.dlq_name
      Purpose = "Dead letter queue for failed webhook processing"
    }
  )
}
