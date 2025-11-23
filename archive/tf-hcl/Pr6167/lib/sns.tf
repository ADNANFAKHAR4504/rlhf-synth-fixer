# SNS Topic for Migration Alerts
resource "aws_sns_topic" "migration_alerts" {
  name = "migration-alerts-${var.environment_suffix}"

  tags = {
    Name = "migration-alerts-${var.environment_suffix}"
  }
}

# SNS Topic for Status Notifications
resource "aws_sns_topic" "migration_status" {
  name = "migration-status-${var.environment_suffix}"

  tags = {
    Name = "migration-status-${var.environment_suffix}"
  }
}

# SNS Topic Subscription (Email - placeholder)
resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.migration_alerts.arn
  protocol  = "email"
  endpoint  = "alerts@example.com"

  lifecycle {
    ignore_changes = [endpoint]
  }
}

resource "aws_sns_topic_subscription" "status_email" {
  topic_arn = aws_sns_topic.migration_status.arn
  protocol  = "email"
  endpoint  = "status@example.com"

  lifecycle {
    ignore_changes = [endpoint]
  }
}

# SNS Topic Policy for CloudWatch Alarms
resource "aws_sns_topic_policy" "migration_alerts" {
  arn = aws_sns_topic.migration_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.migration_alerts.arn
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.migration_alerts.arn
      }
    ]
  })
}