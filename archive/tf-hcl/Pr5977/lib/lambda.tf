# CloudWatch Log Group for Payment Validation Lambda
resource "aws_cloudwatch_log_group" "payment_validation" {
  name              = "/aws/lambda/payment-validation-${var.environment}-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "payment-validation-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Lambda Function - Payment Validation
resource "aws_lambda_function" "payment_validation" {
  filename         = "${path.module}/lambda/payment_validation.zip"
  function_name    = "payment-validation-${var.environment}-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/payment_validation.zip")
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT             = var.environment
      DB_SECRET_ARN           = aws_secretsmanager_secret.db_password.arn
      TRANSACTION_LOGS_BUCKET = aws_s3_bucket.transaction_logs.id
      REGION                  = var.region
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.payment_validation,
    aws_iam_role_policy_attachment.lambda_logging,
    aws_iam_role_policy_attachment.lambda_vpc
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "payment-validation-${var.environment}-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for Transaction Processing Lambda
resource "aws_cloudwatch_log_group" "transaction_processing" {
  name              = "/aws/lambda/transaction-processing-${var.environment}-${var.environment_suffix}"
  retention_in_days = 30

  tags = merge(
    local.common_tags,
    {
      Name = "transaction-processing-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Lambda Function - Transaction Processing
resource "aws_lambda_function" "transaction_processing" {
  filename         = "${path.module}/lambda/transaction_processing.zip"
  function_name    = "transaction-processing-${var.environment}-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/transaction_processing.zip")
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 1024

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT             = var.environment
      DB_SECRET_ARN           = aws_secretsmanager_secret.db_password.arn
      TRANSACTION_LOGS_BUCKET = aws_s3_bucket.transaction_logs.id
      CUSTOMER_DOCS_BUCKET    = aws_s3_bucket.customer_documents.id
      SNS_TOPIC_ARN           = aws_sns_topic.transaction_alerts.arn
      REGION                  = var.region
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.transaction_processing,
    aws_iam_role_policy_attachment.lambda_logging,
    aws_iam_role_policy_attachment.lambda_vpc
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "transaction-processing-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Lambda Permission for API Gateway - Payment Validation
resource "aws_lambda_permission" "payment_validation_api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_validation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Lambda Permission for API Gateway - Transaction Processing
resource "aws_lambda_permission" "transaction_processing_api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_processing.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}