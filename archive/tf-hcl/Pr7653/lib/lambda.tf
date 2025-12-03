# Security group for Lambda
resource "aws_security_group" "lambda" {
  provider    = aws.primary
  name_prefix = "${local.resource_prefix}-lambda-"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-sg-${local.current_region}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Lambda function for payment processing
resource "aws_lambda_function" "payment_processor" {
  provider         = aws.primary
  filename         = "${path.module}/lambda/payment_processor.zip"
  function_name    = "${local.resource_prefix}-payment-processor-${local.current_region}"
  role             = data.aws_iam_role.lambda_execution.arn
  handler          = "payment_processor.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/payment_processor.zip")
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      REGION             = local.current_region
      DYNAMODB_TABLE     = aws_dynamodb_table.transactions.name
      DYNAMODB_ENDPOINT  = "https://dynamodb.${local.current_region}.amazonaws.com"
      RDS_HOST           = aws_db_instance.postgres.address
      RDS_PORT           = aws_db_instance.postgres.port
      RDS_DATABASE       = aws_db_instance.postgres.db_name
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-payment-processor-${local.current_region}"
    }
  )
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.payment_processor.function_name}"
  retention_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-logs-${local.current_region}"
    }
  )
}
