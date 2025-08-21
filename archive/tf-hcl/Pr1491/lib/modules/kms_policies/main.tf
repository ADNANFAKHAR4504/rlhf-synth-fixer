// KMS key policies module: attaches least-privilege policies to provided keys

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "primary_key_id" {
  type        = string
  description = "Key ID of the primary KMS key"
}

variable "primary_key_arn" {
  type        = string
  description = "ARN of the primary KMS key"
}

variable "secondary_key_id" {
  type        = string
  description = "Key ID of the secondary KMS key"
}

variable "secondary_key_arn" {
  type        = string
  description = "ARN of the secondary KMS key"
}

data "aws_caller_identity" "current" {}

resource "aws_kms_key_policy" "primary" {
  key_id = var.primary_key_id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus",
          "kms:List*",
          "kms:CreateAlias",
          "kms:PutKeyPolicy",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion",
          "kms:UpdateKeyDescription",
          "kms:TagResource",
          "kms:UntagResource"
        ]
        Resource = var.primary_key_arn
      },
      {
        Sid       = "Allow CloudTrail to use the key"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:Decrypt"
        ]
        Resource = var.primary_key_arn
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_key_policy" "secondary" {
  provider = aws.eu_central_1
  key_id   = var.secondary_key_id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus",
          "kms:List*",
          "kms:CreateAlias",
          "kms:PutKeyPolicy",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion",
          "kms:UpdateKeyDescription",
          "kms:TagResource",
          "kms:UntagResource"
        ]
        Resource = var.secondary_key_arn
      },
      {
        Sid       = "Allow CloudTrail to use the key"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:Decrypt"
        ]
        Resource = var.secondary_key_arn
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      }
    ]
  })
}
