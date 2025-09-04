# Generate secure random password for database
resource "random_password" "database" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

# Store password in SSM Parameter Store for secure access
resource "aws_ssm_parameter" "database_password" {
  name        = "/${var.name_prefix}/database/password"
  description = "Database password for ${var.name_prefix}"
  type        = "SecureString"
  value       = random_password.database.result
  key_id      = aws_kms_key.secrets.arn

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-password-param"
    Type = "ssm-parameter"
  })
}

# Secrets Manager Secret for database credentials
resource "aws_secretsmanager_secret" "database" {
  name        = "${var.name_prefix}-database-credentials"
  description = "Database credentials for ${var.name_prefix}"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-secret"
    Type = "secret"
  })
}

# Secrets Manager Secret Version with generated password
resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = var.database_username
    password = random_password.database.result
    engine   = "mysql"
    host     = var.database_host
    port     = 3306
    dbname   = var.database_name
  })
}

# IAM Policy for Secrets Manager and SSM access
resource "aws_iam_policy" "secrets_access" {
  name        = "${var.name_prefix}-secrets-access-policy"
  description = "Policy for accessing Secrets Manager and SSM"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.database.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = aws_ssm_parameter.database_password.arn
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-secrets-access-policy"
    Type = "iam-policy"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "secrets" {
  description             = "KMS key for Secrets Manager and SSM encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Secrets Manager to use the key"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SSM to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-secrets-kms-key"
    Type = "kms-key"
  })
}

# KMS Alias for easier key management
resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.name_prefix}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

# Data sources for current account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
