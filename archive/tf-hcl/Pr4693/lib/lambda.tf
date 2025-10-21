# lambda.tf - Lambda function configuration

# CloudWatch Log Group for Lambda function
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.environment_suffix}-api-handler"
  retention_in_days = var.cloudwatch_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-lambda-logs"
    }
  )
}

# Lambda function for API backend
resource "aws_lambda_function" "api_handler" {
  function_name = "${var.environment_suffix}-api-handler"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = var.lambda_runtime

  # Source code from S3
  s3_bucket = aws_s3_bucket.lambda_deployments.id
  s3_key    = aws_s3_object.lambda_package.key

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  # Environment variables
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.user_profiles.name
      AWS_REGION_NAME     = data.aws_region.current.id
      ENVIRONMENT_SUFFIX  = var.environment_suffix
    }
  }

  # X-Ray tracing
  tracing_config {
    mode = var.enable_xray_tracing ? "Active" : "PassThrough"
  }

  # Ensure IAM role and policies are created first
  depends_on = [
    aws_iam_role_policy.lambda_dynamodb,
    aws_iam_role_policy.lambda_logs,
    aws_iam_role_policy_attachment.lambda_xray,
    aws_cloudwatch_log_group.lambda,
    aws_s3_object.lambda_package
  ]

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-api-handler"
    }
  )
}

# Lambda permission for API Gateway to invoke the function
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
