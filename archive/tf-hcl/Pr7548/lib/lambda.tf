# CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/webhook-processor-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "webhook-processor-logs-${var.environment_suffix}"
  }
}

# Lambda function code package
data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = file("${path.module}/lambda/webhook_processor.py")
    filename = "webhook_processor.py"
  }
}

# Lambda function
resource "aws_lambda_function" "webhook_processor" {
  filename         = data.archive_file.lambda.output_path
  function_name    = "webhook-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "webhook_processor.lambda_handler"
  source_code_hash = data.archive_file.lambda.output_base64sha256
  runtime          = var.lambda_runtime
  architectures    = [var.lambda_architecture]
  timeout          = 30
  memory_size      = 512

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.webhooks.name
      ENVIRONMENT         = var.environment_suffix
    }
  }

  kms_key_arn = aws_kms_key.lambda_env.arn

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy.lambda_custom
  ]

  tags = {
    Name = "webhook-processor-${var.environment_suffix}"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}
