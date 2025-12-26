resource "aws_sns_topic" "reconciliation_notifications" {
  name = "reconciliation-notifications-${var.environment_suffix}"

  tags = {
    Name = "reconciliation-notifications-${var.environment_suffix}"
  }
}

resource "aws_sns_topic_subscription" "reconciliation_email" {
  topic_arn = aws_sns_topic.reconciliation_notifications.arn
  protocol  = "email"
  endpoint  = "finance-team@example.com"
}
