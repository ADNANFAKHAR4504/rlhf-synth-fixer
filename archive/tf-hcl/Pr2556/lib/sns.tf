# SNS topic for security alerts and notifications
# Provides centralized alerting for security events and system issues

resource "aws_sns_topic" "security_alerts" {
  name              = "${var.project_name}-${var.environment}-security-alerts"
  kms_master_key_id = aws_kms_key.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-security-alerts"
  }
}

# SNS topic policy to allow CloudWatch to publish
resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.security_alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "sns:Subscribe",
          "sns:ListSubscriptionsByTopic",
          "sns:GetTopicAttributes",
          "sns:Publish"
        ]
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

# Email subscription for security alerts (replace with actual email)
resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = "alamutu.d@turing.com" # Replace with actual email address
}

# SNS topic for operational alerts
resource "aws_sns_topic" "operational_alerts" {
  name              = "${var.project_name}-${var.environment}-operational-alerts"
  kms_master_key_id = aws_kms_key.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-operational-alerts"
  }
}

# SNS topic policy for operational alerts
resource "aws_sns_topic_policy" "operational_alerts" {
  arn = aws_sns_topic.operational_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "cloudwatch.amazonaws.com",
            "autoscaling.amazonaws.com"
          ]
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.operational_alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}
