########################
# Lambda Functions (Logging, KMS Encryption)
########################

# CloudWatch Log Group for Lambda - Primary
resource "aws_cloudwatch_log_group" "lambda_logs_primary" {
  provider          = aws.primary
  name              = "/aws/lambda/${var.name_prefix}-${var.environment}-function-primary"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.primary.arn
  tags = {
    Name = "${var.name_prefix}-${var.environment}-lambda-logs-primary"
  }
  depends_on        = [aws_kms_key.primary] # Ensures KMS key exists first
}

# CloudWatch Log Group for Lambda - Secondary
resource "aws_cloudwatch_log_group" "lambda_logs_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/${var.name_prefix}-${var.environment}-function-secondary"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.secondary.arn
  tags = {
    Name = "${var.name_prefix}-${var.environment}-lambda-logs-secondary"
  }
  depends_on        = [aws_kms_key.secondary]
}


# Package the actual lambda_function.py file
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}


resource "aws_lambda_function" "primary" {
  provider         = aws.primary
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.name_prefix}-${var.environment}-function-primary"
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  memory_size      = 128
  timeout          = 10
  vpc_config {
    subnet_ids         = [aws_subnet.private_primary_1.id, aws_subnet.private_primary_2.id]
    security_group_ids = [aws_security_group.lambda_primary.id]
  }
  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }
  tags = {
    Name = "${var.name_prefix}-${var.environment}-function-primary"
  }
}


resource "aws_lambda_function" "secondary" {
  provider         = aws.secondary
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.name_prefix}-${var.environment}-function-secondary"
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  memory_size      = 128
  timeout          = 10
  vpc_config {
    subnet_ids         = [aws_subnet.private_secondary_1.id, aws_subnet.private_secondary_2.id]
    security_group_ids = [aws_security_group.lambda_secondary.id]
  }
  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }
  tags = {
    Name = "${var.name_prefix}-${var.environment}-function-secondary"
  }
}

output "lambda_primary_name" {
  value = aws_lambda_function.primary.function_name
}
output "lambda_secondary_name" {
  value = aws_lambda_function.secondary.function_name
}