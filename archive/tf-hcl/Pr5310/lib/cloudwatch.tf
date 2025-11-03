# cloudwatch.tf

# CloudWatch Log Groups for Lambda Functions
resource "aws_cloudwatch_log_group" "stripe_validator" {
  name              = local.log_group_stripe_validator
  retention_in_days = var.log_retention_validators

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "paypal_validator" {
  name              = local.log_group_paypal_validator
  retention_in_days = var.log_retention_validators

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "square_validator" {
  name              = local.log_group_square_validator
  retention_in_days = var.log_retention_validators

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "processor" {
  name              = local.log_group_processor
  retention_in_days = var.log_retention_processor

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "query" {
  name              = local.log_group_query
  retention_in_days = var.log_retention_query

  tags = local.common_tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = local.log_group_api_gateway
  retention_in_days = var.log_retention_api_gateway

  tags = local.common_tags
}

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name = local.sns_topic_name

  tags = local.common_tags
}

# SNS Topic Subscription (Email)
resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_sns_email
}

# CloudWatch Alarms for Lambda Functions

# Stripe Validator Lambda Errors
resource "aws_cloudwatch_metric_alarm" "stripe_validator_errors" {
  alarm_name          = "${local.lambda_stripe_validator_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Stripe validator Lambda function error count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.stripe_validator.function_name
  }

  tags = local.common_tags
}

# Stripe Validator Lambda Throttles
resource "aws_cloudwatch_metric_alarm" "stripe_validator_throttles" {
  alarm_name          = "${local.lambda_stripe_validator_name}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.lambda_throttle_threshold
  alarm_description   = "Stripe validator Lambda function throttle count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.stripe_validator.function_name
  }

  tags = local.common_tags
}

# PayPal Validator Lambda Errors
resource "aws_cloudwatch_metric_alarm" "paypal_validator_errors" {
  alarm_name          = "${local.lambda_paypal_validator_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "PayPal validator Lambda function error count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.paypal_validator.function_name
  }

  tags = local.common_tags
}

# PayPal Validator Lambda Throttles
resource "aws_cloudwatch_metric_alarm" "paypal_validator_throttles" {
  alarm_name          = "${local.lambda_paypal_validator_name}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.lambda_throttle_threshold
  alarm_description   = "PayPal validator Lambda function throttle count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.paypal_validator.function_name
  }

  tags = local.common_tags
}

# Square Validator Lambda Errors
resource "aws_cloudwatch_metric_alarm" "square_validator_errors" {
  alarm_name          = "${local.lambda_square_validator_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Square validator Lambda function error count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.square_validator.function_name
  }

  tags = local.common_tags
}

# Square Validator Lambda Throttles
resource "aws_cloudwatch_metric_alarm" "square_validator_throttles" {
  alarm_name          = "${local.lambda_square_validator_name}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.lambda_throttle_threshold
  alarm_description   = "Square validator Lambda function throttle count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.square_validator.function_name
  }

  tags = local.common_tags
}

# Processor Lambda Errors
resource "aws_cloudwatch_metric_alarm" "processor_errors" {
  alarm_name          = "${local.lambda_processor_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Processor Lambda function error count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  tags = local.common_tags
}

# Processor Lambda Throttles
resource "aws_cloudwatch_metric_alarm" "processor_throttles" {
  alarm_name          = "${local.lambda_processor_name}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.lambda_throttle_threshold
  alarm_description   = "Processor Lambda function throttle count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  tags = local.common_tags
}

# Query Lambda Errors
resource "aws_cloudwatch_metric_alarm" "query_errors" {
  alarm_name          = "${local.lambda_query_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Query Lambda function error count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = aws_lambda_function.query.function_name
  }

  tags = local.common_tags
}

# API Gateway 4xx Error Rate
resource "aws_cloudwatch_metric_alarm" "api_4xx_error_rate" {
  alarm_name          = "${local.api_gateway_name}-4xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  threshold           = var.api_4xx_error_rate_threshold
  alarm_description   = "API Gateway 4xx error rate exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "error_rate"
    expression  = "m1/m2*100"
    label       = "4xx Error Rate"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "4XXError"
      namespace   = "AWS/ApiGateway"
      period      = "300"
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.webhook_api.name
        Stage   = aws_api_gateway_stage.main.stage_name
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = "300"
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.webhook_api.name
        Stage   = aws_api_gateway_stage.main.stage_name
      }
    }
  }

  tags = local.common_tags
}

# API Gateway 5xx Error Rate
resource "aws_cloudwatch_metric_alarm" "api_5xx_error_rate" {
  alarm_name          = "${local.api_gateway_name}-5xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  threshold           = var.api_5xx_error_rate_threshold
  alarm_description   = "API Gateway 5xx error rate exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "error_rate"
    expression  = "m1/m2*100"
    label       = "5xx Error Rate"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "5XXError"
      namespace   = "AWS/ApiGateway"
      period      = "300"
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.webhook_api.name
        Stage   = aws_api_gateway_stage.main.stage_name
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = "300"
      stat        = "Sum"
      dimensions = {
        ApiName = aws_api_gateway_rest_api.webhook_api.name
        Stage   = aws_api_gateway_stage.main.stage_name
      }
    }
  }

  tags = local.common_tags
}

# API Gateway P99 Latency
resource "aws_cloudwatch_metric_alarm" "api_p99_latency" {
  alarm_name          = "${local.api_gateway_name}-p99-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  extended_statistic  = "p99"
  threshold           = var.api_p99_latency_threshold
  alarm_description   = "API Gateway p99 latency exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.webhook_api.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }

  tags = local.common_tags
}

# DLQ Message Count Alarm
resource "aws_cloudwatch_metric_alarm" "dlq_message_count" {
  alarm_name          = "${local.dlq_name}-message-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.dlq_message_count_threshold
  alarm_description   = "Dead letter queue message count exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  tags = local.common_tags
}

# DynamoDB User Errors
resource "aws_cloudwatch_metric_alarm" "dynamodb_user_errors" {
  alarm_name          = "${local.dynamodb_table_name}-user-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "DynamoDB user errors exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = local.common_tags
}

# DynamoDB System Errors
resource "aws_cloudwatch_metric_alarm" "dynamodb_system_errors" {
  alarm_name          = "${local.dynamodb_table_name}-system-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "DynamoDB system errors detected"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = local.common_tags
}

# DynamoDB Throttled Requests
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.dynamodb_table_name}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "DynamoDB write throttle events exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = local.common_tags
}
