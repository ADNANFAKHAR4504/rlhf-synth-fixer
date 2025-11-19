# Dead Letter Queue for failed Lambda executions
resource "aws_sqs_queue" "dlq" {
  name                       = "etl-dlq-${var.environmentSuffix}"
  message_retention_seconds  = 1209600 # 14 days
  visibility_timeout_seconds = 300

  tags = {
    Name        = "etl-dlq-${var.environmentSuffix}"
    Description = "Dead letter queue for failed ETL processing"
  }
}

resource "aws_sqs_queue_policy" "dlq" {
  queue_url = aws_sqs_queue.dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}
