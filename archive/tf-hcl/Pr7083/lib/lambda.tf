data "archive_file" "webhook_receiver_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambdas/webhook_receiver"
  output_path = "${path.module}/lambdas/webhook_receiver.zip"
}

data "archive_file" "payload_validator_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambdas/payload_validator"
  output_path = "${path.module}/lambdas/payload_validator.zip"
}

data "archive_file" "transaction_processor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambdas/transaction_processor"
  output_path = "${path.module}/lambdas/transaction_processor.zip"
}

resource "aws_lambda_function" "webhook_receiver" {
  function_name    = "${var.project}-${var.environment}-webhook-receiver-${local.suffix}"
  filename         = data.archive_file.webhook_receiver_zip.output_path
  source_code_hash = data.archive_file.webhook_receiver_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = "python3.11"
  architectures    = ["arm64"]
  role             = aws_iam_role.lambda_role.arn
  memory_size      = var.lambda_configs.webhook_receiver.memory_size
  timeout          = var.lambda_configs.webhook_receiver.timeout

  tracing_config { mode = "Active" }

  environment {
    variables = {
      PROCESSING_QUEUE_URL = aws_sqs_queue.webhook_processing_queue.id
      PAYLOAD_BUCKET       = aws_s3_bucket.webhook_payloads.id
      # Pass SSM parameter names; Lambdas will fetch values at runtime
      API_KEY_PARAM = "${var.ssm_prefix}/api_key"
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "payload_validator" {
  function_name    = "${var.project}-${var.environment}-payload-validator-${local.suffix}"
  filename         = data.archive_file.payload_validator_zip.output_path
  source_code_hash = data.archive_file.payload_validator_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = "python3.11"
  architectures    = ["arm64"]
  role             = aws_iam_role.lambda_role.arn
  memory_size      = var.lambda_configs.payload_validator.memory_size
  timeout          = var.lambda_configs.payload_validator.timeout

  tracing_config { mode = "Active" }

  environment {
    variables = {
      VALIDATED_QUEUE_URL    = aws_sqs_queue.validated_queue.id
      DLQ_URL                = aws_sqs_queue.webhook_dlq.id
      VALIDATION_RULES_PARAM = "${var.ssm_prefix}/validation_rules"
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "transaction_processor" {
  function_name    = "${var.project}-${var.environment}-transaction-processor-${local.suffix}"
  filename         = data.archive_file.transaction_processor_zip.output_path
  source_code_hash = data.archive_file.transaction_processor_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = "python3.11"
  architectures    = ["arm64"]
  role             = aws_iam_role.lambda_role.arn
  memory_size      = var.lambda_configs.transaction_processor.memory_size
  timeout          = var.lambda_configs.transaction_processor.timeout

  tracing_config { mode = "Active" }

  environment {
    variables = {
      TRANSACTIONS_TABLE   = aws_dynamodb_table.transactions.name
      ARCHIVE_BUCKET       = aws_s3_bucket.failed_messages.id
      DB_CREDENTIALS_PARAM = "${var.ssm_prefix}/db_credentials"
    }
  }

  tags = local.common_tags
}

# Permissions and event source mappings
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_receiver.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}

resource "aws_lambda_event_source_mapping" "validator_sqs" {
  event_source_arn = aws_sqs_queue.webhook_processing_queue.arn
  function_name    = aws_lambda_function.payload_validator.arn
  batch_size       = 10
}

resource "aws_lambda_event_source_mapping" "processor_sqs" {
  event_source_arn = aws_sqs_queue.validated_queue.arn
  function_name    = aws_lambda_function.transaction_processor.arn
  batch_size       = 10
}
