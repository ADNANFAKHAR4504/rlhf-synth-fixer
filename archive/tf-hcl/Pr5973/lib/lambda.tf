# Archive Lambda functions
data "archive_file" "validator_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/validator.py"
  output_path = "${path.module}/lambda/validator.zip"
}

data "archive_file" "processor_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/processor.py"
  output_path = "${path.module}/lambda/processor.zip"
}

data "archive_file" "notifier_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/notifier.py"
  output_path = "${path.module}/lambda/notifier.zip"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "validator_logs" {
  name              = "/aws/lambda/webhook-validator-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "webhook-validator-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_log_group" "processor_logs" {
  name              = "/aws/lambda/webhook-processor-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "webhook-processor-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_log_group" "notifier_logs" {
  name              = "/aws/lambda/webhook-notifier-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "webhook-notifier-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Lambda Functions
resource "aws_lambda_function" "validator" {
  filename                       = data.archive_file.validator_lambda.output_path
  function_name                  = "webhook-validator-${var.environment_suffix}"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "validator.lambda_handler"
  source_code_hash               = data.archive_file.validator_lambda.output_base64sha256
  runtime                        = "python3.9"
  memory_size                    = var.lambda_memory
  timeout                        = var.lambda_timeout
  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      PROCESSING_QUEUE_URL = aws_sqs_queue.processing_queue.url
    }
  }

  tracing_config {
    mode = var.enable_xray ? "Active" : "PassThrough"
  }

  depends_on = [
    aws_cloudwatch_log_group.validator_logs,
    aws_iam_role_policy.lambda_logs_policy,
    aws_iam_role_policy.lambda_sqs_policy
  ]

  tags = {
    Name        = "webhook-validator-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Validate incoming webhooks"
  }
}

resource "aws_lambda_function" "processor" {
  filename                       = data.archive_file.processor_lambda.output_path
  function_name                  = "webhook-processor-${var.environment_suffix}"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "processor.lambda_handler"
  source_code_hash               = data.archive_file.processor_lambda.output_base64sha256
  runtime                        = "python3.9"
  memory_size                    = var.lambda_memory
  timeout                        = var.lambda_timeout
  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      NOTIFICATION_QUEUE_URL = aws_sqs_queue.notification_queue.url
    }
  }

  tracing_config {
    mode = var.enable_xray ? "Active" : "PassThrough"
  }

  depends_on = [
    aws_cloudwatch_log_group.processor_logs,
    aws_iam_role_policy.lambda_logs_policy,
    aws_iam_role_policy.lambda_sqs_policy
  ]

  tags = {
    Name        = "webhook-processor-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Process validated webhooks"
  }
}

resource "aws_lambda_function" "notifier" {
  filename                       = data.archive_file.notifier_lambda.output_path
  function_name                  = "webhook-notifier-${var.environment_suffix}"
  role                           = aws_iam_role.lambda_role.arn
  handler                        = "notifier.lambda_handler"
  source_code_hash               = data.archive_file.notifier_lambda.output_base64sha256
  runtime                        = "python3.9"
  memory_size                    = var.lambda_memory
  timeout                        = var.lambda_timeout
  reserved_concurrent_executions = var.lambda_reserved_concurrency

  tracing_config {
    mode = var.enable_xray ? "Active" : "PassThrough"
  }

  depends_on = [
    aws_cloudwatch_log_group.notifier_logs,
    aws_iam_role_policy.lambda_logs_policy,
    aws_iam_role_policy.lambda_sqs_policy
  ]

  tags = {
    Name        = "webhook-notifier-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Send notifications for processed webhooks"
  }
}

# Event Source Mappings
resource "aws_lambda_event_source_mapping" "validator_trigger" {
  event_source_arn = aws_sqs_queue.validation_queue.arn
  function_name    = aws_lambda_function.validator.arn
  batch_size       = 10
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "processor_trigger" {
  event_source_arn = aws_sqs_queue.processing_queue.arn
  function_name    = aws_lambda_function.processor.arn
  batch_size       = 10
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "notifier_trigger" {
  event_source_arn = aws_sqs_queue.notification_queue.arn
  function_name    = aws_lambda_function.notifier.arn
  batch_size       = 10
  enabled          = true
}
