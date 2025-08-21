# Random suffix to prevent naming conflicts
resource "random_id" "suffix" {
  byte_length = 4
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "alerts" {
  name         = "${var.project_name}-${var.environment_suffix}-security-alerts-${random_id.suffix.hex}"
  display_name = "Security Alerts Topic"
  delivery_policy = jsonencode({
    "http" = {
      "defaultHealthyRetryPolicy" = {
        "minDelayTarget"     = 20
        "maxDelayTarget"     = 20
        "numRetries"         = 3
        "numMaxDelayRetries" = 0
        "numMinDelayRetries" = 0
        "numNoDelayRetries"  = 0
        "backoffFunction"    = "linear"
      }
    }
  })
  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
