resource "aws_sns_topic" "security_alerts" {
  name              = "security-monitoring-alerts-${local.environment_suffix}"
  kms_master_key_id = aws_kms_key.security_key.id

  tags = merge(
    local.common_tags,
    {
      Name = "security-alerts-topic-${local.environment_suffix}"
    }
  )
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_email

  filter_policy = jsonencode({
    severity = ["HIGH", "CRITICAL"]
  })
}

resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "security-alerts-policy"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}