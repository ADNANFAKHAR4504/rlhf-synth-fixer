# notifications.tf - SNS Topics for alert routing

resource "aws_sns_topic" "critical_alerts" {
  name              = "monitoring-critical-alerts-${var.environment_suffix}"
  display_name      = "Critical Alerts - ${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "critical-alerts-${var.environment_suffix}"
    Severity = "critical"
  }
}

resource "aws_sns_topic" "warning_alerts" {
  name              = "monitoring-warning-alerts-${var.environment_suffix}"
  display_name      = "Warning Alerts - ${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "warning-alerts-${var.environment_suffix}"
    Severity = "warning"
  }
}

# Email subscriptions
resource "aws_sns_topic_subscription" "critical_email" {
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_subscription" "warning_email" {
  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Webhook subscriptions (conditional on webhook URL being provided)
resource "aws_sns_topic_subscription" "critical_webhook" {
  count = var.alert_webhook_url != "" ? 1 : 0

  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "https"
  endpoint  = var.alert_webhook_url
}

resource "aws_sns_topic_subscription" "warning_webhook" {
  count = var.alert_webhook_url != "" ? 1 : 0

  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "https"
  endpoint  = var.alert_webhook_url
}
