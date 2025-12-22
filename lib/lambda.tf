# Create zip files for lambda functions
data "archive_file" "lambda_zip" {
  for_each = local.lambda_functions

  type        = "zip"
  source_file = "${path.module}/${each.value.filename}"
  output_path = "${path.module}/${each.key}_lambda.zip"

  depends_on = [
    local_file.health_service,
    local_file.user_service,
    local_file.notification_service
  ]
}

# Lambda functions
resource "aws_lambda_function" "microservice_functions" {
  for_each = local.lambda_functions

  filename         = data.archive_file.lambda_zip[each.key].output_path
  function_name    = "${local.resource_prefix}-${each.key}-service"
  role             = aws_iam_role.lambda_role.arn
  handler          = each.value.handler
  source_code_hash = data.archive_file.lambda_zip[each.key].output_base64sha256
  runtime          = "python3.8"
  timeout          = 30

  environment {
    variables = {
      ENVIRONMENT = var.environment
      SECRETS_ARN = aws_secretsmanager_secret.api_keys.arn
    }
  }

  tags = local.common_tags
}

# CloudWatch Log Groups for Lambda functions with enhanced logging
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${aws_lambda_function.microservice_functions[each.key].function_name}"
  retention_in_days = 7
  log_group_class   = "STANDARD"

  tags = local.common_tags
}