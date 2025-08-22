# Create placeholder zip files for Lambda functions
data "archive_file" "lambda_placeholder" {
  for_each = toset(["user", "order", "notification"])

  type        = "zip"
  output_path = "${path.module}/${each.key}-lambda-placeholder.zip"

  source {
    content = templatefile("${path.module}/lambda_function.py.tpl", {
      service_name = each.key
    })
    filename = "lambda_function.py"
  }
}

# Lambda functions
resource "aws_lambda_function" "services" {
  for_each = toset(["user", "order", "notification"])

  function_name = "${var.project_name}-${var.environment_suffix}-${each.key}-service"
  role          = aws_iam_role.lambda_execution[each.key].arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30

  filename         = data.archive_file.lambda_placeholder[each.key].output_path
  source_code_hash = data.archive_file.lambda_placeholder[each.key].output_base64sha256

  environment {
    variables = {
      ENVIRONMENT         = var.environment
      SERVICE_NAME        = each.key
      USERS_TABLE         = aws_dynamodb_table.users.name
      ORDERS_TABLE        = aws_dynamodb_table.orders.name
      NOTIFICATIONS_TABLE = aws_dynamodb_table.notifications.name
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-${each.key}-service"
    Environment = var.environment
  }

  depends_on = [aws_cloudwatch_log_group.lambda_logs]
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = aws_lambda_function.services

  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}