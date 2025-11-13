# Random passwords for database credentials
resource "random_password" "db_password" {
  for_each = var.secrets_config
  
  length  = 16
  special = true
}

# Random API keys
resource "random_password" "api_key" {
  for_each = var.secrets_config
  
  length  = 32
  special = false
}

# Random service tokens
resource "random_password" "service_token" {
  for_each = var.secrets_config
  
  length  = 24
  special = false
}

# Create secrets in AWS Secrets Manager
resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.secrets_config
  
  name                    = each.key
  description            = each.value.description
  recovery_window_in_days = 7
  
  tags = var.common_tags
}

# Store secret values with dynamic passwords
resource "aws_secretsmanager_secret_version" "secret_versions" {
  for_each = var.secrets_config
  
  secret_id = aws_secretsmanager_secret.secrets[each.key].id
  
  secret_string = jsonencode({
    username      = "admin"
    password      = random_password.db_password[each.key].result
    api_key       = random_password.api_key[each.key].result
    service_token = random_password.service_token[each.key].result
    host          = each.key == "prod/database" ? "prod-db.internal" : "api.service.internal"
    port          = each.key == "prod/database" ? "5432" : "443"
  })
}

# Data source for current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# IAM policy for accessing specific secrets (attached to EC2 role)
resource "aws_iam_policy" "secrets_access" {
  name        = "secrets-manager-access-policy"
  description = "Policy for accessing production secrets"
  
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
          for secret in aws_secretsmanager_secret.secrets :
          secret.arn
        ]
        Condition = {
          StringEquals = {
            "secretsmanager:ResourceTag/Environment" = "Production"
          }
        }
      }
    ]
  })
  
  tags = var.common_tags
}