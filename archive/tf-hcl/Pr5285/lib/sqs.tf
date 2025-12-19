# Main Event Queue
resource "aws_sqs_queue" "event_queue" {
  name                       = "${local.name_prefix}-event-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600 # 4 days
  receive_wait_time_seconds  = 20
  visibility_timeout_seconds = 300

  # Enable encryption at rest
  sqs_managed_sse_enabled = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags

  depends_on = [aws_sqs_queue.dlq]
}

# Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                      = "${local.name_prefix}-dlq"
  message_retention_seconds = 1209600 # 14 days

  # Enable encryption at rest
  sqs_managed_sse_enabled = true

  tags = local.common_tags
}

# Event Source Mapping for Lambda
resource "aws_lambda_event_source_mapping" "sqs_to_processing" {
  event_source_arn = aws_sqs_queue.event_queue.arn
  function_name    = aws_lambda_function.event_processing.arn

  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  scaling_config {
    maximum_concurrency = 20
  }
}