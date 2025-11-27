resource "aws_cloudwatch_log_group" "webhook_receiver_logs" {
  name              = "/aws/lambda/${aws_lambda_function.webhook_receiver.function_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "payload_validator_logs" {
  name              = "/aws/lambda/${aws_lambda_function.payload_validator.function_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "transaction_processor_logs" {
  name              = "/aws/lambda/${aws_lambda_function.transaction_processor.function_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

# Metric-math alarm for Lambda error percentage > 1%
resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  alarm_name          = "${var.project}-${var.environment}-lambda-error-rate-${local.suffix}"
  alarm_description   = "Alarm when Lambda error rate across functions exceeds 1%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  alarm_actions       = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  ok_actions          = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []

  metric_query {
    id          = "m1"
    label       = "Errors"
    return_data = false
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.webhook_receiver.function_name
      }
      period = 60
    }
  }

  metric_query {
    id          = "m2"
    label       = "Invocations"
    return_data = false
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.webhook_receiver.function_name
      }
      period = 60
    }
  }

  metric_query {
    id          = "e1"
    expression  = "IF(m2 > 0, 100 * m1 / m2, 0)"
    label       = "ErrorPercent"
    return_data = true
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_error_rate_validator" {
  alarm_name          = "${var.project}-${var.environment}-payload-validator-error-rate-${local.suffix}"
  alarm_description   = "Alarm when payload validator error rate exceeds 1%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  alarm_actions       = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  ok_actions          = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  tags                = local.common_tags

  metric_query {
    id          = "m1"
    label       = "Errors"
    return_data = false
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions  = { FunctionName = aws_lambda_function.payload_validator.function_name }
      period      = 60
    }
  }

  metric_query {
    id          = "m2"
    label       = "Invocations"
    return_data = false
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions  = { FunctionName = aws_lambda_function.payload_validator.function_name }
      period      = 60
    }
  }

  metric_query {
    id          = "e1"
    expression  = "IF(m2 > 0, 100 * m1 / m2, 0)"
    label       = "ErrorPercent"
    return_data = true
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_error_rate_processor" {
  alarm_name          = "${var.project}-${var.environment}-transaction-processor-error-rate-${local.suffix}"
  alarm_description   = "Alarm when transaction processor error rate exceeds 1%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  alarm_actions       = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  ok_actions          = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  tags                = local.common_tags

  metric_query {
    id          = "m1"
    label       = "Errors"
    return_data = false
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions  = { FunctionName = aws_lambda_function.transaction_processor.function_name }
      period      = 60
    }
  }

  metric_query {
    id          = "m2"
    label       = "Invocations"
    return_data = false
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions  = { FunctionName = aws_lambda_function.transaction_processor.function_name }
      period      = 60
    }
  }

  metric_query {
    id          = "e1"
    expression  = "IF(m2 > 0, 100 * m1 / m2, 0)"
    label       = "ErrorPercent"
    return_data = true
  }
}

# DLQ messages alarm
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project}-${var.environment}-dlq-messages-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 10
  alarm_description   = "Alert when DLQ messages exceed 10"

  dimensions = {
    QueueName = aws_sqs_queue.webhook_dlq.name
  }

  tags          = local.common_tags
  alarm_actions = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
}

