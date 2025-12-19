# lambda-validators.tf

# Archive Stripe Validator Lambda source
data "archive_file" "stripe_validator" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-stripe-validator"
  output_path = "${path.module}/.terraform/stripe-validator.zip"
}

# Stripe Webhook Validator Lambda Function
resource "aws_lambda_function" "stripe_validator" {
  function_name    = local.lambda_stripe_validator_name
  filename         = data.archive_file.stripe_validator.output_path
  source_code_hash = data.archive_file.stripe_validator.output_base64sha256
  handler          = "index.lambda_handler"
  runtime          = var.lambda_runtime
  role             = aws_iam_role.validator_lambda_role.arn
  architectures    = [var.lambda_architecture]
  memory_size      = var.validator_memory_size
  timeout          = var.validator_timeout

  environment {
    variables = {
      PROVIDER_NAME          = "stripe"
      PROVIDER_SECRET_ARN    = aws_secretsmanager_secret.stripe_secret.arn
      DYNAMODB_TABLE         = aws_dynamodb_table.transactions.name
      S3_BUCKET              = aws_s3_bucket.raw_payloads.id
      PROCESSOR_FUNCTION_ARN = aws_lambda_function.processor.arn
      ENVIRONMENT            = var.environment
    }
  }

  tracing_config {
    mode = var.xray_tracing_enabled ? "Active" : "PassThrough"
  }

  depends_on = [
    aws_cloudwatch_log_group.stripe_validator
  ]

  tags = merge(
    local.common_tags,
    {
      Name     = local.lambda_stripe_validator_name
      Provider = "stripe"
    }
  )
}

# Lambda Permission for API Gateway to invoke Stripe validator
resource "aws_lambda_permission" "stripe_validator_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stripe_validator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}

# Archive PayPal Validator Lambda source
data "archive_file" "paypal_validator" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-paypal-validator"
  output_path = "${path.module}/.terraform/paypal-validator.zip"
}

# PayPal Webhook Validator Lambda Function
resource "aws_lambda_function" "paypal_validator" {
  function_name    = local.lambda_paypal_validator_name
  filename         = data.archive_file.paypal_validator.output_path
  source_code_hash = data.archive_file.paypal_validator.output_base64sha256
  handler          = "index.lambda_handler"
  runtime          = var.lambda_runtime
  role             = aws_iam_role.validator_lambda_role.arn
  architectures    = [var.lambda_architecture]
  memory_size      = var.validator_memory_size
  timeout          = var.validator_timeout

  environment {
    variables = {
      PROVIDER_NAME          = "paypal"
      PROVIDER_SECRET_ARN    = aws_secretsmanager_secret.paypal_secret.arn
      DYNAMODB_TABLE         = aws_dynamodb_table.transactions.name
      S3_BUCKET              = aws_s3_bucket.raw_payloads.id
      PROCESSOR_FUNCTION_ARN = aws_lambda_function.processor.arn
      ENVIRONMENT            = var.environment
    }
  }

  tracing_config {
    mode = var.xray_tracing_enabled ? "Active" : "PassThrough"
  }

  depends_on = [
    aws_cloudwatch_log_group.paypal_validator
  ]

  tags = merge(
    local.common_tags,
    {
      Name     = local.lambda_paypal_validator_name
      Provider = "paypal"
    }
  )
}

# Lambda Permission for API Gateway to invoke PayPal validator
resource "aws_lambda_permission" "paypal_validator_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.paypal_validator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}

# Archive Square Validator Lambda source
data "archive_file" "square_validator" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-square-validator"
  output_path = "${path.module}/.terraform/square-validator.zip"
}

# Square Webhook Validator Lambda Function
resource "aws_lambda_function" "square_validator" {
  function_name    = local.lambda_square_validator_name
  filename         = data.archive_file.square_validator.output_path
  source_code_hash = data.archive_file.square_validator.output_base64sha256
  handler          = "index.lambda_handler"
  runtime          = var.lambda_runtime
  role             = aws_iam_role.validator_lambda_role.arn
  architectures    = [var.lambda_architecture]
  memory_size      = var.validator_memory_size
  timeout          = var.validator_timeout

  environment {
    variables = {
      PROVIDER_NAME          = "square"
      PROVIDER_SECRET_ARN    = aws_secretsmanager_secret.square_secret.arn
      DYNAMODB_TABLE         = aws_dynamodb_table.transactions.name
      S3_BUCKET              = aws_s3_bucket.raw_payloads.id
      PROCESSOR_FUNCTION_ARN = aws_lambda_function.processor.arn
      ENVIRONMENT            = var.environment
    }
  }

  tracing_config {
    mode = var.xray_tracing_enabled ? "Active" : "PassThrough"
  }

  depends_on = [
    aws_cloudwatch_log_group.square_validator
  ]

  tags = merge(
    local.common_tags,
    {
      Name     = local.lambda_square_validator_name
      Provider = "square"
    }
  )
}

# Lambda Permission for API Gateway to invoke Square validator
resource "aws_lambda_permission" "square_validator_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.square_validator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}
