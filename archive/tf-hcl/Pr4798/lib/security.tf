# KMS Key for Primary S3 Bucket Encryption
resource "aws_kms_key" "primary" {
  description             = "KMS key for encrypting legal documents in primary S3 bucket"
  deletion_window_in_days = 30
  enable_key_rotation     = var.kms_key_rotation_enabled
  multi_region            = false

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.name_prefix}-primary-kms-key"
      Purpose = "S3 Primary Bucket Encryption"
    }
  )
}

resource "aws_kms_alias" "primary" {
  name          = local.primary_kms_key_alias
  target_key_id = aws_kms_key.primary.key_id
}

# KMS Key Policy for Primary Key
resource "aws_kms_key_policy" "primary" {
  key_id = aws_kms_key.primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
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
        Sid    = "Allow Lambda to use the key"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.compliance_lambda.arn,
            aws_iam_role.reporting_lambda.arn
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS Key for Audit Logs (if separate key is enabled)
resource "aws_kms_key" "audit" {
  count = var.enable_separate_audit_kms_key ? 1 : 0

  description             = "KMS key for encrypting audit logs and CloudTrail"
  deletion_window_in_days = 30
  enable_key_rotation     = var.kms_key_rotation_enabled
  multi_region            = false

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.name_prefix}-audit-kms-key"
      Purpose = "Audit Logs Encryption"
    }
  )
}

resource "aws_kms_alias" "audit" {
  count = var.enable_separate_audit_kms_key ? 1 : 0

  name          = local.audit_kms_key_alias
  target_key_id = aws_kms_key.audit[0].key_id
}

# KMS Key Policy for Audit Key
resource "aws_kms_key_policy" "audit" {
  count = var.enable_separate_audit_kms_key ? 1 : 0

  key_id = aws_kms_key.audit[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:${data.aws_partition.current.partition}:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to describe key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "kms:DescribeKey"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key for audit bucket"
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
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })
}

# Determine which KMS key to use for audit bucket
locals {
  audit_kms_key_id  = var.enable_separate_audit_kms_key ? aws_kms_key.audit[0].id : aws_kms_key.primary.id
  audit_kms_key_arn = var.enable_separate_audit_kms_key ? aws_kms_key.audit[0].arn : aws_kms_key.primary.arn
}
