# secrets.tf - AWS Secrets Manager for Aurora database credentials

# AWS Secrets Manager will automatically manage the password when manage_master_user_password is true
# RDS will create the secret automatically with the naming convention: rds-db-credentials/cluster-<cluster-identifier>/<random-suffix>

# IAM policy to allow Aurora to access the auto-generated secret
resource "aws_iam_policy" "aurora_secrets_manager" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-secrets-manager"
  description = "Policy for Aurora to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:PutSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:rds-db-credentials/cluster-${var.project_name}-${var.environment_suffix}-aurora-cluster-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.aurora.arn
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-secrets-manager"
    }
  )
}

