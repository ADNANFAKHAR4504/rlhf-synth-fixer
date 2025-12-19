resource "aws_sns_topic" "alerts" {
  name              = "${var.project_name}-alerts-${var.environment}"
  display_name      = "${var.project_name} ${var.environment} Alerts"
  kms_master_key_id = var.kms_key_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-SNS-${var.region}-${var.environment}"
  })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.email_endpoint
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "${var.project_name}-alerts-policy-${var.environment}"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}