resource "aws_cloudwatch_log_group" "validation_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.webhook_validation.function_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = "alias/aws/logs"

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "routing_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.webhook_routing.function_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = "alias/aws/logs"

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.webhook_api.name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = "alias/aws/logs"

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "webhook_errors" {
  alarm_name          = "${local.resource_prefix}-webhook-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors webhook processing errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.webhook_validation.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${local.resource_prefix}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Alert when messages are in DLQ"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.webhook_dlq.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "${local.resource_prefix}-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "Alert on high 4XX errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.webhook_api.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_sns_topic" "alerts" {
  name = "${local.resource_prefix}-alerts"

  kms_master_key_id = "alias/aws/sns"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alert_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "alerts@example.com" # Replace with actual email
}