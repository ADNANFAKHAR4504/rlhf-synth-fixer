# SNS Topic for Pipeline Notifications
resource "aws_sns_topic" "pipeline_notifications" {
  name         = "pipeline-notifications-${var.environment_suffix}"
  display_name = "CodePipeline Notifications - ${var.environment_suffix}"

  tags = {
    Name = "pipeline-notifications-${var.environment_suffix}"
  }
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "pipeline_notifications" {
  arn = aws_sns_topic.pipeline_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.pipeline_notifications.arn
      }
    ]
  })
}

# SNS Email Subscription (optional)
resource "aws_sns_topic_subscription" "pipeline_email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.pipeline_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
