resource "aws_sns_topic" "deployment_notifications" {
  name = "${var.project_name}-${var.environment_suffix}-deployment-notifications"

  kms_master_key_id = aws_kms_key.pipeline_key.arn

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-deployment-notifications"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.deployment_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_sns_topic_policy" "deployment_notifications" {
  arn = aws_sns_topic.deployment_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = ["codepipeline.amazonaws.com", "codebuild.amazonaws.com"]
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.deployment_notifications.arn
      }
    ]
  })
}