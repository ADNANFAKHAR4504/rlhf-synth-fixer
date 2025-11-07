# Lambda Function for Data Processing
resource "aws_lambda_function" "processor" {
  filename      = "${path.module}/lambda/processor.zip"
  function_name = "data-processor-${var.environment_suffix}-ab"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DATA_BUCKET    = aws_s3_bucket.data.id
      METADATA_TABLE = aws_dynamodb_table.metadata.name
      SECRET_ARN     = aws_secretsmanager_secret.db_credentials.arn
      ENVIRONMENT    = var.environment_suffix
    }
  }

  tags = merge(var.common_tags, {
    Name = "data-processor-${var.environment_suffix}-ab"
  })

  depends_on = [
    aws_iam_role_policy.lambda,
    aws_cloudwatch_log_group.lambda
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/data-processor-${var.environment_suffix}-ab"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = merge(var.common_tags, {
    Name = "lambda-logs-${var.environment_suffix}-ab"
  })
}
