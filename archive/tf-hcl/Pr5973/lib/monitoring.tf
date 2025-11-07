# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  count = var.enable_alarms ? 1 : 0
  name  = "webhook-alarms-${var.environment_suffix}"

  tags = {
    Name        = "webhook-alarms-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "CloudWatch alarm notifications"
  }
}

# Optional Email Subscription
resource "aws_sns_topic_subscription" "alarm_email" {
  count     = var.enable_alarms && var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ============================================================================
# Lambda Function Alarms - Validator
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "validator_errors" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-validator-errors-${var.environment_suffix}"
  alarm_description   = "Validator Lambda error rate exceeds 5%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / invocations) * 100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.validator.function_name
      }
    }
  }

  metric_query {
    id = "invocations"
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.validator.function_name
      }
    }
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-validator-errors-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "validator_throttles" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-validator-throttles-${var.environment_suffix}"
  alarm_description   = "Validator Lambda is being throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.validator.function_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-validator-throttles-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "validator_duration" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-validator-duration-${var.environment_suffix}"
  alarm_description   = "Validator Lambda duration exceeds 80% of timeout"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = var.lambda_timeout * 1000 * 0.8 # Convert to ms and 80%
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.validator.function_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-validator-duration-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "validator_concurrent_executions" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-validator-concurrent-${var.environment_suffix}"
  alarm_description   = "Validator Lambda concurrent executions exceed 90"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Maximum"
  threshold           = 90
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.validator.function_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-validator-concurrent-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# ============================================================================
# Lambda Function Alarms - Processor
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "processor_errors" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-processor-errors-${var.environment_suffix}"
  alarm_description   = "Processor Lambda error rate exceeds 5%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / invocations) * 100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.processor.function_name
      }
    }
  }

  metric_query {
    id = "invocations"
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.processor.function_name
      }
    }
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-processor-errors-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "processor_throttles" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-processor-throttles-${var.environment_suffix}"
  alarm_description   = "Processor Lambda is being throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-processor-throttles-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "processor_duration" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-processor-duration-${var.environment_suffix}"
  alarm_description   = "Processor Lambda duration exceeds 80% of timeout"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = var.lambda_timeout * 1000 * 0.8
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-processor-duration-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "processor_concurrent_executions" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-processor-concurrent-${var.environment_suffix}"
  alarm_description   = "Processor Lambda concurrent executions exceed 90"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Maximum"
  threshold           = 90
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-processor-concurrent-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# ============================================================================
# Lambda Function Alarms - Notifier
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "notifier_errors" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-notifier-errors-${var.environment_suffix}"
  alarm_description   = "Notifier Lambda error rate exceeds 5%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / invocations) * 100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.notifier.function_name
      }
    }
  }

  metric_query {
    id = "invocations"
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.notifier.function_name
      }
    }
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-notifier-errors-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "notifier_throttles" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-notifier-throttles-${var.environment_suffix}"
  alarm_description   = "Notifier Lambda is being throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.notifier.function_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-notifier-throttles-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "notifier_duration" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-notifier-duration-${var.environment_suffix}"
  alarm_description   = "Notifier Lambda duration exceeds 80% of timeout"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = var.lambda_timeout * 1000 * 0.8
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.notifier.function_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-notifier-duration-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "notifier_concurrent_executions" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "lambda-notifier-concurrent-${var.environment_suffix}"
  alarm_description   = "Notifier Lambda concurrent executions exceed 90"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Maximum"
  threshold           = 90
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.notifier.function_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "lambda-notifier-concurrent-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# ============================================================================
# SQS Main Queue Alarms
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "validation_queue_age" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "sqs-validation-queue-age-${var.environment_suffix}"
  alarm_description   = "Validation queue oldest message exceeds 300 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 300
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.validation_queue.name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "sqs-validation-queue-age-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "validation_queue_depth" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "sqs-validation-queue-depth-${var.environment_suffix}"
  alarm_description   = "Validation queue depth exceeds 100 messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.validation_queue.name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "sqs-validation-queue-depth-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_queue_age" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "sqs-processing-queue-age-${var.environment_suffix}"
  alarm_description   = "Processing queue oldest message exceeds 300 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 300
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.processing_queue.name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "sqs-processing-queue-age-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_queue_depth" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "sqs-processing-queue-depth-${var.environment_suffix}"
  alarm_description   = "Processing queue depth exceeds 100 messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.processing_queue.name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "sqs-processing-queue-depth-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "notification_queue_age" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "sqs-notification-queue-age-${var.environment_suffix}"
  alarm_description   = "Notification queue oldest message exceeds 300 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = 300
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.notification_queue.name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "sqs-notification-queue-age-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "notification_queue_depth" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "sqs-notification-queue-depth-${var.environment_suffix}"
  alarm_description   = "Notification queue depth exceeds 100 messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.notification_queue.name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "sqs-notification-queue-depth-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# ============================================================================
# DLQ Alarms
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "validation_dlq_messages" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "sqs-validation-dlq-messages-${var.environment_suffix}"
  alarm_description   = "Messages in validation DLQ indicate failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.validation_dlq.name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "sqs-validation-dlq-messages-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_dlq_messages" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "sqs-processing-dlq-messages-${var.environment_suffix}"
  alarm_description   = "Messages in processing DLQ indicate failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.processing_dlq.name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "sqs-processing-dlq-messages-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "notification_dlq_messages" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "sqs-notification-dlq-messages-${var.environment_suffix}"
  alarm_description   = "Messages in notification DLQ indicate failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.notification_dlq.name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "sqs-notification-dlq-messages-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# ============================================================================
# API Gateway Alarms
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "api_gateway_4xx_errors" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "apigateway-4xx-errors-${var.environment_suffix}"
  alarm_description   = "API Gateway 4xx error rate exceeds 10%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 10
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / requests) * 100"
    label       = "4XX Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "4XXError"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.webhook_api.name
        Stage   = aws_api_gateway_stage.production.stage_name
      }
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.webhook_api.name
        Stage   = aws_api_gateway_stage.production.stage_name
      }
    }
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "apigateway-4xx-errors-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "apigateway-5xx-errors-${var.environment_suffix}"
  alarm_description   = "API Gateway 5xx error rate exceeds 1%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / requests) * 100"
    label       = "5XX Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "5XXError"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.webhook_api.name
        Stage   = aws_api_gateway_stage.production.stage_name
      }
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.webhook_api.name
        Stage   = aws_api_gateway_stage.production.stage_name
      }
    }
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "apigateway-5xx-errors-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_latency" {
  count               = var.enable_alarms ? 1 : 0
  alarm_name          = "apigateway-latency-${var.environment_suffix}"
  alarm_description   = "API Gateway p99 latency exceeds 1000ms"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p99"
  threshold           = 1000
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.webhook_api.name
    Stage   = aws_api_gateway_stage.production.stage_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Name        = "apigateway-latency-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
