# Lambda IAM Role - Primary
resource "aws_iam_role" "lambda_primary" {
  name = "lambda-payment-processor-primary-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_primary_vpc" {
  role       = aws_iam_role.lambda_primary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_primary_s3" {
  name = "lambda-s3-access"
  role = aws_iam_role.lambda_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      }
    ]
  })
}

# Lambda Function - Primary
resource "aws_lambda_function" "payment_processor_primary" {
  filename         = "${path.module}/lambda/payment_processor.zip"
  function_name    = "payment-processor-primary-${var.environment_suffix}"
  role             = aws_iam_role.lambda_primary.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/payment_processor.zip")
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.primary_private[*].id
    security_group_ids = [aws_security_group.lambda_primary.id]
  }

  environment {
    variables = {
      REGION             = var.primary_region
      S3_BUCKET          = aws_s3_bucket.primary.id
      DB_ENDPOINT        = aws_rds_cluster.primary.endpoint
      DB_NAME            = var.db_name
      DB_SECRET_ARN      = aws_secretsmanager_secret.db_password.arn
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "payment-processor-primary-${var.environment_suffix}"
  }
}

# Lambda IAM Role - DR
resource "aws_iam_role" "lambda_dr" {
  provider = aws.dr
  name     = "lambda-payment-processor-dr-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dr_vpc" {
  provider   = aws.dr
  role       = aws_iam_role.lambda_dr.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dr_s3" {
  provider = aws.dr
  name     = "lambda-s3-access"
  role     = aws_iam_role.lambda_dr.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.dr.arn}/*"
      }
    ]
  })
}

# Lambda Function - DR
resource "aws_lambda_function" "payment_processor_dr" {
  provider         = aws.dr
  filename         = "${path.module}/lambda/payment_processor.zip"
  function_name    = "payment-processor-dr-${var.environment_suffix}"
  role             = aws_iam_role.lambda_dr.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/payment_processor.zip")
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.dr_private[*].id
    security_group_ids = [aws_security_group.lambda_dr.id]
  }

  environment {
    variables = {
      REGION             = var.dr_region
      S3_BUCKET          = aws_s3_bucket.dr.id
      DB_ENDPOINT        = aws_rds_cluster.dr.endpoint
      DB_NAME            = var.db_name
      DB_SECRET_ARN      = aws_secretsmanager_secret.db_password.arn
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "payment-processor-dr-${var.environment_suffix}"
  }
}

# Lambda Permissions for API Gateway - Primary
resource "aws_lambda_permission" "api_gateway_primary" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_processor_primary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.primary.execution_arn}/*/*"
}

# Lambda Permissions for API Gateway - DR
resource "aws_lambda_permission" "api_gateway_dr" {
  provider      = aws.dr
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_processor_dr.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.dr.execution_arn}/*/*"
}