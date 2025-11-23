# lambda-query.tf

# Archive Query Lambda source
data "archive_file" "query" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-query"
  output_path = "${path.module}/.terraform/query.zip"
}

# Transaction Query Lambda Function
resource "aws_lambda_function" "query" {
  function_name    = local.lambda_query_name
  filename         = data.archive_file.query.output_path
  source_code_hash = data.archive_file.query.output_base64sha256
  handler          = "index.lambda_handler"
  runtime          = var.lambda_runtime
  role             = aws_iam_role.query_lambda_role.arn
  architectures    = [var.lambda_architecture]
  memory_size      = var.query_memory_size
  timeout          = var.query_timeout

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.transactions.name
      ENVIRONMENT    = var.environment
    }
  }

  tracing_config {
    mode = var.xray_tracing_enabled ? "Active" : "PassThrough"
  }

  depends_on = [
    aws_cloudwatch_log_group.query
  ]

  tags = merge(
    local.common_tags,
    {
      Name = local.lambda_query_name
    }
  )
}

# Lambda Permission for API Gateway to invoke Query function
resource "aws_lambda_permission" "query_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.query.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}
