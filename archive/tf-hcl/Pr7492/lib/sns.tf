# SNS Topic for Critical Alarms
resource "aws_sns_topic" "critical_alarms" {
  name         = "${local.name_prefix}-critical-alarms"
  display_name = "Critical CloudWatch Alarms"

  delivery_policy = jsonencode({
    http = {
      defaultHealthyRetryPolicy = {
        minDelayTarget     = 20
        maxDelayTarget     = 600
        numRetries         = 5
        numMaxDelayRetries = 3
        numNoDelayRetries  = 1
        numMinDelayRetries = 1
        backoffFunction    = "exponential"
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-critical-alarms"
      Severity = "Critical"
    }
  )
}

# SNS Topic for Warning Alarms
resource "aws_sns_topic" "warning_alarms" {
  name         = "${local.name_prefix}-warning-alarms"
  display_name = "Warning CloudWatch Alarms"

  delivery_policy = jsonencode({
    http = {
      defaultHealthyRetryPolicy = {
        minDelayTarget     = 20
        maxDelayTarget     = 600
        numRetries         = 5
        numMaxDelayRetries = 3
        numNoDelayRetries  = 1
        numMinDelayRetries = 1
        backoffFunction    = "exponential"
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-warning-alarms"
      Severity = "Warning"
    }
  )
}

# SNS Topic for Info Alarms
resource "aws_sns_topic" "info_alarms" {
  name         = "${local.name_prefix}-info-alarms"
  display_name = "Info CloudWatch Alarms"

  delivery_policy = jsonencode({
    http = {
      defaultHealthyRetryPolicy = {
        minDelayTarget     = 20
        maxDelayTarget     = 300
        numRetries         = 3
        numMaxDelayRetries = 2
        numNoDelayRetries  = 1
        numMinDelayRetries = 0
        backoffFunction    = "exponential"
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-info-alarms"
      Severity = "Info"
    }
  )
}

# SNS Subscriptions for Critical Alarms
resource "aws_sns_topic_subscription" "critical_email" {
  count     = length(var.alarm_email_endpoints) > 0 ? length(var.alarm_email_endpoints) : 0
  topic_arn = aws_sns_topic.critical_alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoints[count.index]

  filter_policy = jsonencode({
    severity = ["CRITICAL"]
  })
}

# SNS Subscription to Lambda for alarm processing
resource "aws_sns_topic_subscription" "alarm_processor" {
  topic_arn = aws_sns_topic.critical_alarms.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.alarm_processor.arn
}

resource "aws_lambda_permission" "sns_invoke" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alarm_processor.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.critical_alarms.arn
}

# CloudWatch Logs for SNS delivery status
resource "aws_cloudwatch_log_group" "sns_delivery" {
  name              = "/aws/sns/${local.name_prefix}"
  retention_in_days = 7

  tags = local.common_tags
}
