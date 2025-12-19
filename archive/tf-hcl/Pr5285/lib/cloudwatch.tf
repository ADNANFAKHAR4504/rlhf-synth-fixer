# Log Groups
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_authorizer" {
  name              = "/aws/lambda/${local.name_prefix}-auth-v2"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_ingestion" {
  name              = "/aws/lambda/${local.name_prefix}-ingest-v2"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_processing" {
  name              = "/aws/lambda/${local.name_prefix}-process-v2"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_storage" {
  name              = "/aws/lambda/${local.name_prefix}-store-v2"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# Custom Metrics
resource "aws_cloudwatch_log_metric_filter" "event_processing_errors" {
  name           = "${local.name_prefix}-processing-errors"
  log_group_name = aws_cloudwatch_log_group.lambda_processing.name
  pattern        = "[ERROR]"

  metric_transformation {
    name      = "ProcessingErrors"
    namespace = "${local.name_prefix}/Events"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "event_processing_latency" {
  name           = "${local.name_prefix}-processing-latency"
  log_group_name = aws_cloudwatch_log_group.lambda_processing.name
  pattern        = "[LATENCY, latency_value]"

  metric_transformation {
    name      = "ProcessingLatency"
    namespace = "${local.name_prefix}/Events"
    value     = "$latency_value"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", period = 300 }],
            [".", "Errors", { stat = "Sum", period = 300 }],
            [".", "Duration", { stat = "Average", period = 300 }]
          ]
          region = "us-east-1"
          title  = "Lambda Metrics"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", aws_sqs_queue.event_queue.name],
            [".", "NumberOfMessagesDeleted", ".", "."],
            [".", "ApproximateNumberOfMessagesVisible", ".", "."]
          ]
          region = "us-east-1"
          title  = "SQS Metrics"
          view   = "timeSeries"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.name_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    FunctionName = aws_lambda_function.event_processing.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${local.name_prefix}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Alert when messages appear in DLQ"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  tags = local.common_tags
}