# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${local.name_prefix}"
  retention_in_days = var.metric_retention_days

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-app-logs"
    }
  )
}

# CloudWatch Log Group for Firehose
resource "aws_cloudwatch_log_group" "firehose" {
  name              = "/aws/kinesisfirehose/${local.name_prefix}"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_stream" "firehose" {
  name           = "metric-stream"
  log_group_name = aws_cloudwatch_log_group.firehose.name
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_processor" {
  name              = "/aws/lambda/${local.name_prefix}-metric-processor"
  retention_in_days = 30

  tags = local.common_tags
}

# Metric Filter 1: Extract error count
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${local.name_prefix}-error-count"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level=ERROR*, ...]"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "CustomMetrics/${local.name_prefix}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

# Metric Filter 2: Extract response time
resource "aws_cloudwatch_log_metric_filter" "response_time" {
  name           = "${local.name_prefix}-response-time"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level, method, path, status, duration]"

  metric_transformation {
    name      = "ResponseTime"
    namespace = "CustomMetrics/${local.name_prefix}"
    value     = "$duration"
    unit      = "Milliseconds"
  }
}

# Metric Filter 3: Extract 5xx errors
resource "aws_cloudwatch_log_metric_filter" "server_errors" {
  name           = "${local.name_prefix}-5xx-errors"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level, method, path, status=5*, ...]"

  metric_transformation {
    name          = "ServerErrorCount"
    namespace     = "CustomMetrics/${local.name_prefix}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

# Metric Filter 4: Extract memory usage
resource "aws_cloudwatch_log_metric_filter" "memory_usage" {
  name           = "${local.name_prefix}-memory-usage"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level, metric=MEMORY, value, unit=MB]"

  metric_transformation {
    name      = "MemoryUsage"
    namespace = "CustomMetrics/${local.name_prefix}"
    value     = "$value"
    unit      = "Megabytes"
  }
}
