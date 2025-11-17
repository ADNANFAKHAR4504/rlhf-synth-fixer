data "aws_caller_identity" "current" {}

# KMS key policy for application data - allows specific roles to encrypt/decrypt
resource "aws_kms_key_policy" "application_data" {
  key_id = aws_kms_key.application_data.id

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
        Sid    = "Allow SecurityAdmin and DevOps roles to use the key"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.security_admin.arn,
            aws_iam_role.devops.arn
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Auditor role to describe key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.auditor.arn
        }
        Action = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS key policy for infrastructure secrets - restricted to SecurityAdmin only
resource "aws_kms_key_policy" "infrastructure_secrets" {
  key_id = aws_kms_key.infrastructure_secrets.id

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
        Sid    = "Allow SecurityAdmin role to use the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.security_admin.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Auditor role to describe key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.auditor.arn
        }
        Action = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
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
}
