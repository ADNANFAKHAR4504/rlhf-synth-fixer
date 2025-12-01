# SNS topic for incoming payment events
resource "aws_sns_topic" "payment_events" {
  name              = "${var.project_name}-topic-${var.environment_suffix}"
  display_name      = "Payment Events Topic"
  kms_master_key_id = "alias/aws/sns"
}

resource "aws_sns_topic_policy" "payment_events" {
  arn = aws_sns_topic.payment_events.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.payment_events.arn
      },
      {
        Sid    = "AllowAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "sns:Subscribe",
          "sns:Receive",
          "sns:Publish"
        ]
        Resource = aws_sns_topic.payment_events.arn
      }
    ]
  })
}

# SNS subscription to trigger Step Functions via EventBridge
resource "aws_sns_topic_subscription" "payment_events_to_eventbridge" {
  topic_arn = aws_sns_topic.payment_events.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.event_trigger.arn
}
