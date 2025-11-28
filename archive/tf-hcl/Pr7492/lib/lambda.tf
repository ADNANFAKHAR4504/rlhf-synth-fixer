# Lambda function for custom metric processing (ARM Graviton2)
resource "aws_lambda_function" "metric_processor" {
  filename      = data.archive_file.lambda_processor.output_path
  function_name = "${local.name_prefix}-metric-processor"
  role          = aws_iam_role.lambda_metric_processor.arn
  handler       = "index.handler"
  runtime       = "python3.11"

  # ARM Graviton2 processor for cost optimization
  architectures = ["arm64"]

  memory_size = 256
  timeout     = 60

  environment {
    variables = {
      ENVIRONMENT      = var.environment
      METRIC_NAMESPACE = "CustomMetrics/${local.name_prefix}"
      LOG_LEVEL        = "INFO"
      RETENTION_DAYS   = tostring(var.metric_retention_days)
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-metric-processor"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_processor]
}

# Archive Lambda function code
data "archive_file" "lambda_processor" {
  type        = "zip"
  output_path = "${path.module}/lambda_processor.zip"

  source {
    content  = file("${path.module}/lambda/metric_processor.py")
    filename = "index.py"
  }
}

# Lambda function for alarm notification processing
resource "aws_lambda_function" "alarm_processor" {
  filename      = data.archive_file.lambda_alarm_processor.output_path
  function_name = "${local.name_prefix}-alarm-processor"
  role          = aws_iam_role.lambda_metric_processor.arn
  handler       = "index.handler"
  runtime       = "python3.11"

  # ARM Graviton2 processor
  architectures = ["arm64"]

  memory_size = 128
  timeout     = 30

  environment {
    variables = {
      ENVIRONMENT         = var.environment
      SNS_CRITICAL_ARN    = aws_sns_topic.critical_alarms.arn
      SNS_WARNING_ARN     = aws_sns_topic.warning_alarms.arn
      SNS_INFO_ARN        = aws_sns_topic.info_alarms.arn
      MAX_RETRY_ATTEMPTS  = "5"
      INITIAL_RETRY_DELAY = "1000"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alarm-processor"
    }
  )
}

data "archive_file" "lambda_alarm_processor" {
  type        = "zip"
  output_path = "${path.module}/lambda_alarm_processor.zip"

  source {
    content  = file("${path.module}/lambda/alarm_processor.py")
    filename = "index.py"
  }
}

# CloudWatch Event Rule to trigger Lambda periodically
resource "aws_cloudwatch_event_rule" "metric_processor" {
  name                = "${local.name_prefix}-metric-processor-schedule"
  description         = "Trigger metric processor Lambda function"
  schedule_expression = "rate(5 minutes)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "metric_processor" {
  rule      = aws_cloudwatch_event_rule.metric_processor.name
  target_id = "MetricProcessorLambda"
  arn       = aws_lambda_function.metric_processor.arn

  retry_policy {
    maximum_retry_attempts = 5
  }
}

resource "aws_lambda_permission" "metric_processor" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.metric_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.metric_processor.arn
}
