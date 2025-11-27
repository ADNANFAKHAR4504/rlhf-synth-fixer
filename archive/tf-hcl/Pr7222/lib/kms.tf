# kms.tf - KMS Keys for Encryption at Rest

# KMS Key for Aurora Encryption
resource "aws_kms_key" "aurora" {
  description             = "KMS key for Aurora PostgreSQL encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "payment-aurora-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/payment-aurora-${var.environment_suffix}"
  target_key_id = aws_kms_key.aurora.key_id
}

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch Logs encryption"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "payment-cloudwatch-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/payment-cloudwatch-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# Data source for AWS Account ID
data "aws_caller_identity" "current" {}
