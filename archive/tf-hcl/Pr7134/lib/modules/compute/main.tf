# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "lambda-sg-${var.environment_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "lambda-sg-${var.environment_suffix}"
    }
  )
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "lambda-execution-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "lambda-execution-role-${var.environment_suffix}"
    }
  )
}

# IAM Policy for Lambda - VPC Access
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# IAM Policy for Lambda - DynamoDB Access
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "lambda-dynamodb-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*"
        ]
      }
    ]
  })
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logs" {
  name = "lambda-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/app-function-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(
    var.tags,
    {
      Name = "lambda-logs-${var.environment_suffix}"
    }
  )
}

# Lambda Function
resource "aws_lambda_function" "main" {
  filename         = "${path.module}/lambda/function.zip"
  function_name    = "app-function-${var.environment_suffix}"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  source_code_hash = filebase64sha256("${path.module}/lambda/function.zip")

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT    = var.environment_suffix
      DYNAMODB_TABLE = var.dynamodb_table_name
      LOG_LEVEL      = "INFO"
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "app-function-${var.environment_suffix}"
    }
  )

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.lambda_logs,
    aws_iam_role_policy.lambda_dynamodb,
    aws_iam_role_policy_attachment.lambda_vpc
  ]
}

# Lambda Function URL (for easy testing)
resource "aws_lambda_function_url" "main" {
  function_name      = aws_lambda_function.main.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST"]
    allow_headers = ["*"]
    max_age       = 300
  }
}
