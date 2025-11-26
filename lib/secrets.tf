# Random password generation
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Secrets Manager secret for database password (primary)
resource "aws_secretsmanager_secret" "db_password_primary" {
  provider                = aws.primary
  name                    = "aurora-db-password-primary-${var.environment_suffix}"
  recovery_window_in_days = 0

  tags = {
    Name        = "secret-db-password-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_secretsmanager_secret_version" "db_password_primary" {
  provider  = aws.primary
  secret_id = aws_secretsmanager_secret.db_password_primary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.primary.endpoint
    port     = 5432
    dbname   = var.database_name
  })
}

# Lambda rotation function for primary (placeholder - would need full implementation)
resource "aws_lambda_function" "rotation_primary" {
  provider      = aws.primary
  filename      = "${path.module}/lambda/rotation.zip"
  function_name = "secrets-rotation-primary-${var.environment_suffix}"
  role          = aws_iam_role.rotation_lambda_primary.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.primary_region}.amazonaws.com"
    }
  }

  tags = {
    Name        = "lambda-rotation-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# IAM role for rotation Lambda - Primary
resource "aws_iam_role" "rotation_lambda_primary" {
  provider = aws.primary
  name     = "lambda-rotation-role-primary-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "iam-role-lambda-rotation-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_iam_role_policy" "rotation_lambda_primary" {
  provider = aws.primary
  name     = "lambda-rotation-policy-primary-${var.environment_suffix}"
  role     = aws_iam_role.rotation_lambda_primary.id

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
        Resource = aws_secretsmanager_secret.db_password_primary.arn
      },
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

# Secrets Manager secret for database password (secondary)
resource "aws_secretsmanager_secret" "db_password_secondary" {
  provider                = aws.secondary
  name                    = "aurora-db-password-secondary-${var.environment_suffix}"
  recovery_window_in_days = 0

  tags = {
    Name        = "secret-db-password-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_secretsmanager_secret_version" "db_password_secondary" {
  provider  = aws.secondary
  secret_id = aws_secretsmanager_secret.db_password_secondary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.secondary.endpoint
    port     = 5432
    dbname   = var.database_name
  })
}