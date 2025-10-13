# SNS Module - Notification Topics

resource "aws_sns_topic" "failover_notifications" {
  name              = "${var.name_prefix}-failover-notifications"
  display_name      = "Failover Automation Notifications"
  kms_master_key_id = "alias/aws/sns"

  tags = merge(
    var.tags,
    {
      Name    = "${var.name_prefix}-failover-notifications"
      Purpose = "Alert notifications"
    }
  )
}

resource "aws_sns_topic_policy" "failover_notifications" {
  arn = aws_sns_topic.failover_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.failover_notifications.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.account_id
          }
        }
      },
      {
        Sid    = "AllowLambdaPublish"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.failover_notifications.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.account_id
          }
        }
      }
    ]
  })
}

# Optional email subscription
resource "aws_sns_topic_subscription" "email" {
  count     = var.email_endpoint != "" ? 1 : 0
  topic_arn = aws_sns_topic.failover_notifications.arn
  protocol  = "email"
  endpoint  = var.email_endpoint
}

