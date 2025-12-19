# lambda-processor.tf

# Archive Processor Lambda source
data "archive_file" "processor" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-processor"
  output_path = "${path.module}/.terraform/processor.zip"
}

# Webhook Processor Lambda Function
resource "aws_lambda_function" "processor" {
  function_name                  = local.lambda_processor_name
  filename                       = data.archive_file.processor.output_path
  source_code_hash               = data.archive_file.processor.output_base64sha256
  handler                        = "index.lambda_handler"
  runtime                        = var.lambda_runtime
  role                           = aws_iam_role.processor_lambda_role.arn
  architectures                  = [var.lambda_architecture]
  memory_size                    = var.processor_memory_size
  timeout                        = var.processor_timeout
  reserved_concurrent_executions = var.processor_reserved_concurrency

  environment {
    variables = {
      DYNAMODB_TABLE      = aws_dynamodb_table.transactions.name
      S3_PROCESSED_BUCKET = aws_s3_bucket.processed_logs.id
      ENVIRONMENT         = var.environment
      DLQ_URL             = aws_sqs_queue.dlq.url
    }
  }

  tracing_config {
    mode = var.xray_tracing_enabled ? "Active" : "PassThrough"
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.processor
  ]

  tags = merge(
    local.common_tags,
    {
      Name = local.lambda_processor_name
    }
  )
}
