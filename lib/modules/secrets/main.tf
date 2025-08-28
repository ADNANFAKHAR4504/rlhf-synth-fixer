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