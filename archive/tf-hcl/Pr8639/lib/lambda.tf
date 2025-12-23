# Archive Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda_function.zip"
}

# Lambda function for ETL processing
resource "aws_lambda_function" "processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "etl-processor-${var.environmentSuffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "processor.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      OUTPUT_BUCKET      = aws_s3_bucket.output.bucket
      AUDIT_BUCKET       = aws_s3_bucket.audit.bucket
      DLQ_URL            = aws_sqs_queue.dlq.url
      ENVIRONMENT_SUFFIX = var.environmentSuffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = {
    Name        = "etl-processor-${var.environmentSuffix}"
    Description = "Lambda function for processing banking transactions"
  }

  depends_on = [
    aws_iam_role_policy.lambda_logging,
    aws_iam_role_policy.lambda_s3_access,
    aws_iam_role_policy.lambda_sqs_access
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/etl-processor-${var.environmentSuffix}"
  retention_in_days = 30

  tags = {
    Name = "etl-lambda-logs-${var.environmentSuffix}"
  }
}

# Lambda permission for EventBridge to invoke
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_object_created.arn
}
