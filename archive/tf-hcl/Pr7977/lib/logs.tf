# logs.tf - CloudWatch Log Groups and Metric Filters

# CloudWatch Log Groups for each microservice
resource "aws_cloudwatch_log_group" "microservice_logs" {
  for_each = toset(var.microservices)

  name              = "/ecs/${each.value}-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.sns_encryption.arn

  tags = {
    Name        = "log-group-${each.value}-${var.environment_suffix}"
    Service     = each.value
    Environment = var.additional_tags["Environment"]
  }
}

# Metric filters to extract error rates from logs
resource "aws_cloudwatch_log_metric_filter" "error_rate" {
  for_each = toset(var.microservices)

  name           = "error-rate-${each.value}-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.microservice_logs[each.value].name
  pattern        = "[time, request_id, level = ERROR*, ...]"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "CustomMetrics/${each.value}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

# Metric filters for response time tracking
resource "aws_cloudwatch_log_metric_filter" "response_time" {
  for_each = toset(var.microservices)

  name           = "response-time-${each.value}-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.microservice_logs[each.value].name
  pattern        = "[time, request_id, level, message, duration_ms]"

  metric_transformation {
    name          = "ResponseTime"
    namespace     = "CustomMetrics/${each.value}"
    value         = "$duration_ms"
    default_value = "0"
    unit          = "Milliseconds"
  }
}

# Metric filter for critical errors (5xx, exceptions, fatal)
resource "aws_cloudwatch_log_metric_filter" "critical_errors" {
  for_each = toset(var.microservices)

  name           = "critical-errors-${each.value}-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.microservice_logs[each.value].name
  pattern        = "?FATAL ?CRITICAL ?\"5xx\" ?Exception ?\"Internal Server Error\""

  metric_transformation {
    name          = "CriticalErrorCount"
    namespace     = "CustomMetrics/${each.value}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

# Metric filter for request count (for calculating error rates)
resource "aws_cloudwatch_log_metric_filter" "request_count" {
  for_each = toset(var.microservices)

  name           = "request-count-${each.value}-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.microservice_logs[each.value].name
  pattern        = "[time, request_id, ...]"

  metric_transformation {
    name          = "RequestCount"
    namespace     = "CustomMetrics/${each.value}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}
