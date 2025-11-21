resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts-${var.environment_suffix}"

  tags = {
    Name        = "${var.name_prefix}-alerts-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email" {
  count = length(var.email_addresses)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.email_addresses[count.index]
}
