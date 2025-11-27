# kms.tf - KMS keys for encryption at rest

resource "aws_kms_key" "database" {
  description             = "KMS key for database encryption - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name       = "payment-db-kms-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_kms_alias" "database" {
  name          = "alias/payment-db-${var.environment_suffix}"
  target_key_id = aws_kms_key.database.key_id
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name       = "payment-s3-kms-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_kms_alias" "s3" {
  name          = "alias/payment-s3-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3.key_id
}

resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch Logs encryption - ${var.environment_suffix}"
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
    Name       = "payment-logs-kms-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/payment-logs-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

data "aws_caller_identity" "current" {}
