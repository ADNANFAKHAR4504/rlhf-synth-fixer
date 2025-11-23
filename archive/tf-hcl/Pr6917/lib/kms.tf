# Primary KMS Key in us-east-1
resource "aws_kms_key" "primary" {
  description             = "Primary multi-region KMS key for ${var.environment_suffix}"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true
  multi_region            = true

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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      },
      {
        Sid    = "Allow services to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "config.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "primary-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "primary" {
  name          = "alias/primary-key-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

# Replica KMS Key in eu-west-1
resource "aws_kms_replica_key" "secondary" {
  provider = aws.secondary

  description             = "Secondary replica KMS key for ${var.environment_suffix}"
  deletion_window_in_days = var.kms_deletion_window
  primary_key_arn         = aws_kms_key.primary.arn

  tags = {
    Name = "secondary-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "secondary" {
  provider = aws.secondary

  name          = "alias/secondary-key-${var.environment_suffix}"
  target_key_id = aws_kms_replica_key.secondary.key_id
}

# KMS Key for Terraform State
resource "aws_kms_key" "terraform_state" {
  provider = aws.secondary

  description             = "KMS key for Terraform state encryption ${var.environment_suffix}"
  deletion_window_in_days = var.kms_deletion_window
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
        Sid    = "Allow DynamoDB to use the key"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "terraform-state-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "terraform_state" {
  provider = aws.secondary

  name          = "alias/terraform-state-${var.environment_suffix}"
  target_key_id = aws_kms_key.terraform_state.key_id
}
