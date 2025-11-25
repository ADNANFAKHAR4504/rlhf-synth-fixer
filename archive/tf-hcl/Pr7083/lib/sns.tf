resource "aws_sns_topic" "alerts" {
  name = "${var.project}-${var.environment}-alerts-${local.suffix}"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "emails" {
  for_each = { for addr in var.notification_emails : addr => addr }

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}
