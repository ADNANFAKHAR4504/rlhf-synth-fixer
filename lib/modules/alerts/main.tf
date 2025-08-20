# SNS Topic for Security Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment_suffix}-security-alerts"
  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
