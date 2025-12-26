# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "rds-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 10
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
          Service = "logs.${var.region}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "cloudwatch-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/cloudwatch-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# KMS Key for ECS
resource "aws_kms_key" "ecs" {
  description             = "KMS key for ECS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "ecs-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "ecs" {
  name          = "alias/ecs-${var.environment_suffix}"
  target_key_id = aws_kms_key.ecs.key_id
}

data "aws_caller_identity" "current" {}
