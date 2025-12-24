# SNS Topic for compliance notifications
resource "aws_sns_topic" "compliance_notifications" {
  count             = var.sns_email_endpoint != "" ? 1 : 0
  name              = "compliance-notifications-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.config_key.id

  tags = {
    Name        = "compliance-notifications-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_sns_topic_subscription" "compliance_email" {
  count     = var.sns_email_endpoint != "" ? 1 : 0
  topic_arn = aws_sns_topic.compliance_notifications[0].arn
  protocol  = "email"
  endpoint  = var.sns_email_endpoint
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "compliance_notifications" {
  count = var.sns_email_endpoint != "" ? 1 : 0
  arn   = aws_sns_topic.compliance_notifications[0].arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowConfigPublish"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.compliance_notifications[0].arn
      },
      {
        Sid    = "AllowLambdaPublish"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.compliance_notifications[0].arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# CloudWatch Dashboard for compliance monitoring
resource "aws_cloudwatch_dashboard" "compliance" {
  dashboard_name = "compliance-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Config", "ComplianceScore", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Overall Compliance Score"
        }
      },
      {
        type = "log"
        properties = {
          query  = "SOURCE '/aws/lambda/compliance-remediation-${var.environment_suffix}' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region = var.aws_region
          title  = "Recent Remediation Actions"
        }
      }
    ]
  })
}
