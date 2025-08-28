# Create secrets in AWS Secrets Manager
resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.secrets_config
  
  name                    = each.key
  description            = each.value.description
  recovery_window_in_days = 7
  
  tags = var.common_tags
}

# Store secret values
resource "aws_secretsmanager_secret_version" "secret_versions" {
  for_each = var.secrets_config
  
  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = jsonencode(each.value.secret_data)
}

# Create a policy for accessing secrets
resource "aws_secretsmanager_resource_policy" "secret_policy" {
  for_each = var.secrets_config
  
  secret_arn = aws_secretsmanager_secret.secrets[each.key].arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "secretsmanager:GetSecretValue"
        Resource = "*"
        Condition = {
          StringEquals = {
            "secretsmanager:ResourceTag/Environment" = "Production"
          }
        }
      }
    ]
  })
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}