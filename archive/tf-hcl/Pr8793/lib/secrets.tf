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

# Security group for Lambda rotation function - Primary
resource "aws_security_group" "lambda_primary" {
  provider    = aws.primary
  name        = "lambda-rotation-sg-primary-${var.environment_suffix}"
  description = "Security group for Lambda rotation function"
  vpc_id      = aws_vpc.primary.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "sg-lambda-rotation-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Lambda rotation function for primary
resource "aws_lambda_function" "rotation_primary" {
  provider                       = aws.primary
  filename                       = "${path.module}/lambda/rotation.zip"
  function_name                  = "secrets-rotation-primary-${var.environment_suffix}"
  role                           = aws_iam_role.rotation_lambda_primary.arn
  handler                        = "index.handler"
  runtime                        = "python3.11"
  timeout                        = 120
  reserved_concurrent_executions = 1

  vpc_config {
    subnet_ids         = aws_subnet.primary_private[*].id
    security_group_ids = [aws_security_group.lambda_primary.id]
  }

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
        Resource = "arn:aws:logs:${var.primary_region}:*:log-group:/aws/lambda/secrets-rotation-primary-${var.environment_suffix}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeNetworkInterfaces"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda permission for Secrets Manager - Primary
resource "aws_lambda_permission" "secrets_manager_primary" {
  provider      = aws.primary
  statement_id  = "AllowSecretsManagerInvocation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rotation_primary.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# Secrets Manager rotation schedule - Primary
resource "aws_secretsmanager_secret_rotation" "db_password_primary" {
  provider            = aws.primary
  secret_id           = aws_secretsmanager_secret.db_password_primary.id
  rotation_lambda_arn = aws_lambda_function.rotation_primary.arn

  rotation_rules {
    automatically_after_days = 30
  }
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

# Security group for Lambda rotation function - Secondary
resource "aws_security_group" "lambda_secondary" {
  provider    = aws.secondary
  name        = "lambda-rotation-sg-secondary-${var.environment_suffix}"
  description = "Security group for Lambda rotation function"
  vpc_id      = aws_vpc.secondary.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "sg-lambda-rotation-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Lambda rotation function for secondary
resource "aws_lambda_function" "rotation_secondary" {
  provider                       = aws.secondary
  filename                       = "${path.module}/lambda/rotation.zip"
  function_name                  = "secrets-rotation-secondary-${var.environment_suffix}"
  role                           = aws_iam_role.rotation_lambda_secondary.arn
  handler                        = "index.handler"
  runtime                        = "python3.11"
  timeout                        = 120
  reserved_concurrent_executions = 1

  vpc_config {
    subnet_ids         = aws_subnet.secondary_private[*].id
    security_group_ids = [aws_security_group.lambda_secondary.id]
  }

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.secondary_region}.amazonaws.com"
    }
  }

  tags = {
    Name        = "lambda-rotation-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# IAM role for rotation Lambda - Secondary
resource "aws_iam_role" "rotation_lambda_secondary" {
  provider = aws.secondary
  name     = "lambda-rotation-role-secondary-${var.environment_suffix}"

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
    Name        = "iam-role-lambda-rotation-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_iam_role_policy" "rotation_lambda_secondary" {
  provider = aws.secondary
  name     = "lambda-rotation-policy-secondary-${var.environment_suffix}"
  role     = aws_iam_role.rotation_lambda_secondary.id

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
        Resource = aws_secretsmanager_secret.db_password_secondary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.secondary_region}:*:log-group:/aws/lambda/secrets-rotation-secondary-${var.environment_suffix}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeNetworkInterfaces"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda permission for Secrets Manager - Secondary
resource "aws_lambda_permission" "secrets_manager_secondary" {
  provider      = aws.secondary
  statement_id  = "AllowSecretsManagerInvocation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rotation_secondary.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# Secrets Manager rotation schedule - Secondary
resource "aws_secretsmanager_secret_rotation" "db_password_secondary" {
  provider            = aws.secondary
  secret_id           = aws_secretsmanager_secret.db_password_secondary.id
  rotation_lambda_arn = aws_lambda_function.rotation_secondary.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
