resource "aws_sqs_queue" "lambda_dlq" {
  name                       = "webhook-processor-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 300

  tags = {
    Name = "webhook-processor-dlq-${var.environment_suffix}"
  }
}

resource "aws_sqs_queue_policy" "lambda_dlq" {
  queue_url = aws_sqs_queue.lambda_dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.lambda_dlq.arn
      }
    ]
  })
}
