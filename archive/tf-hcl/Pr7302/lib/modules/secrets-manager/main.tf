# Secrets Manager Module - Store application secrets securely

# Secret for Frontend microservices
resource "aws_secretsmanager_secret" "frontend" {
  name                    = "frontend-secrets-${var.environment_suffix}"
  description             = "Secrets for frontend microservices"
  recovery_window_in_days = 0 # Force delete without recovery period for testing

  tags = merge(var.tags, {
    Name     = "frontend-secrets-${var.environment_suffix}"
    Workload = "frontend"
  })
}

# Secret version for Frontend
resource "aws_secretsmanager_secret_version" "frontend" {
  secret_id = aws_secretsmanager_secret.frontend.id
  secret_string = jsonencode({
    api_key     = "placeholder-frontend-api-key"
    jwt_secret  = "placeholder-frontend-jwt-secret"
    environment = var.environment_suffix
  })
}

# Secret for Backend microservices
resource "aws_secretsmanager_secret" "backend" {
  name                    = "backend-secrets-${var.environment_suffix}"
  description             = "Secrets for backend microservices"
  recovery_window_in_days = 0 # Force delete without recovery period for testing

  tags = merge(var.tags, {
    Name     = "backend-secrets-${var.environment_suffix}"
    Workload = "backend"
  })
}

# Secret version for Backend
resource "aws_secretsmanager_secret_version" "backend" {
  secret_id = aws_secretsmanager_secret.backend.id
  secret_string = jsonencode({
    database_password = "placeholder-database-password"
    api_key           = "placeholder-backend-api-key"
    jwt_secret        = "placeholder-backend-jwt-secret"
    redis_password    = "placeholder-redis-password"
    environment       = var.environment_suffix
  })
}

# Secret for Data Processing microservices
resource "aws_secretsmanager_secret" "data_processing" {
  name                    = "data-processing-secrets-${var.environment_suffix}"
  description             = "Secrets for data processing microservices"
  recovery_window_in_days = 0 # Force delete without recovery period for testing

  tags = merge(var.tags, {
    Name     = "data-processing-secrets-${var.environment_suffix}"
    Workload = "data-processing"
  })
}

# Secret version for Data Processing
resource "aws_secretsmanager_secret_version" "data_processing" {
  secret_id = aws_secretsmanager_secret.data_processing.id
  secret_string = jsonencode({
    s3_access_key  = "placeholder-s3-access-key"
    s3_secret_key  = "placeholder-s3-secret-key"
    kafka_password = "placeholder-kafka-password"
    environment    = var.environment_suffix
  })
}

# IAM Policy for accessing secrets
resource "aws_iam_policy" "secrets_access" {
  name        = "secrets-access-policy-${var.environment_suffix}"
  description = "Policy to allow access to application secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.frontend.arn,
          aws_secretsmanager_secret.backend.arn,
          aws_secretsmanager_secret.data_processing.arn
        ]
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "secrets-access-policy-${var.environment_suffix}"
  })
}
