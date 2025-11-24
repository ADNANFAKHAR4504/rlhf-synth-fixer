# SNS topic for compliance notifications
resource "aws_sns_topic" "compliance_notifications" {
  provider = aws.primary
  name     = "config-compliance-notifications-${var.environment_suffix}"

  tags = {
    Name        = "compliance-notifications-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# SNS topic policy
resource "aws_sns_topic_policy" "compliance_notifications" {
  provider = aws.primary
  arn      = aws_sns_topic.compliance_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowConfigPublish"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.compliance_notifications.arn
      },
      {
        Sid    = "AllowLambdaPublish"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.compliance_notifications.arn
      }
    ]
  })
}

# Email subscription (only created if notification_email is provided)
resource "aws_sns_topic_subscription" "compliance_email" {
  count     = var.notification_email != null ? 1 : 0
  provider  = aws.primary
  topic_arn = aws_sns_topic.compliance_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
