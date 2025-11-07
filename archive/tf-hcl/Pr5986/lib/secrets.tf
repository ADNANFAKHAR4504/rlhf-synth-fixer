# Secrets Manager Secret for Database Credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "db-credentials-${var.environment_suffix}-ab"
  description             = "Database credentials for data processing"
  recovery_window_in_days = 0

  tags = merge(var.common_tags, {
    Name = "db-credentials-${var.environment_suffix}-ab"
  })
}

# Secrets Manager Secret Version
resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = "ChangeMe123!"
    engine   = "postgresql"
    host     = "database.internal"
    port     = 5432
    dbname   = "production"
  })
}

# Secrets Manager Rotation Configuration
resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# IAM Role for Secrets Rotation Lambda
resource "aws_iam_role" "secrets_rotation" {
  name = "secrets-rotation-role-${var.environment_suffix}-ab"

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

  tags = merge(var.common_tags, {
    Name = "secrets-rotation-role-${var.environment_suffix}-ab"
  })
}

# IAM Policy for Secrets Rotation Lambda
resource "aws_iam_role_policy" "secrets_rotation" {
  name = "secrets-rotation-policy-${var.environment_suffix}"
  role = aws_iam_role.secrets_rotation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      }
    ]
  })
}

# Lambda Function for Secrets Rotation
resource "aws_lambda_function" "secrets_rotation" {
  filename      = "${path.module}/lambda/rotation.zip"
  function_name = "secrets-rotation-${var.environment_suffix}-ab"
  role          = aws_iam_role.secrets_rotation.arn
  handler       = "rotation.handler"
  runtime       = "python3.11"
  timeout       = 30

  environment {
    variables = {
      ENVIRONMENT = var.environment_suffix
    }
  }

  tags = merge(var.common_tags, {
    Name = "secrets-rotation-${var.environment_suffix}-ab"
  })
}

# Lambda Permission for Secrets Manager
resource "aws_lambda_permission" "secrets_manager" {
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}
