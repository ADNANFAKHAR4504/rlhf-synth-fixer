# sns.tf - SNS topic with KMS encryption

# SNS topic with KMS encryption (Constraint #2)
resource "aws_sns_topic" "alarms" {
  name              = "transaction-alarms-${var.environment_suffix}"
  display_name      = "Payment Transaction Alarms"
  kms_master_key_id = aws_kms_key.sns.id

  tags = {
    Name = "alarm-topic-${var.environment_suffix}"
  }
}

resource "aws_sns_topic_policy" "alarms" {
  arn = aws_sns_topic.alarms.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alarms.arn
      },
      {
        Sid    = "AllowEventBridgeToPublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alarms.arn
      }
    ]
  })
}

# Email subscription (replace with actual email)
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoint
}
