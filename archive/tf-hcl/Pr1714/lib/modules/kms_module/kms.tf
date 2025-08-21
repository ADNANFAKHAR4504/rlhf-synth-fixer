# KMS key for encrypting all data storage services
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} environment encryption"
  deletion_window_in_days = var.deletion_window_in_days
  enable_key_rotation     = true

  # Key policy allowing root account access and service usage
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

# KMS key alias for easier reference
resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-${var.service}-${var.resource}-kms"
  target_key_id = aws_kms_key.main.key_id
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}