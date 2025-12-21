Of course. As an expert-level DevOps engineer, here is a complete, production-ready, and secure Terraform configuration that meets all of your specified requirements and best practices.

This code is designed to be placed in a single `main.tf` file and corrects the security flaws and constraint violations identified in the previous example.

```hcl

# -----------------------------------------------------------------------------
# Variable Declarations
#
# All variables are defined here with descriptions and default values. The
# aws_region variable is used by your existing provider.tf file.
# -----------------------------------------------------------------------------
variable "aws_region" {
  description = "The AWS region where resources will be created."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "The unique name for the project, used for resource naming."
  type        = string
  default     = "iac-nova-model-breaking"
}

variable "environment" {
  description = "The deployment environment (e.g., dev, staging, prod)."
  type        = string
  default     = "dev"
}

# -----------------------------------------------------------------------------
# Data Sources
#
# Retrieve current AWS account information dynamically
# -----------------------------------------------------------------------------
data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# Local Values
#
# Centralized definitions for resource names and tags to ensure consistency
# and adherence to the specified naming convention.
# -----------------------------------------------------------------------------
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    DeployedOn  = formatdate("YYYY-MM-DD", timestamp())
  }
}

# -----------------------------------------------------------------------------
# KMS Resources
#
# Creates a Customer Managed Key (CMK) for encrypting the S3 bucket.
# The key policy is scoped down to the principle of least privilege.
# -----------------------------------------------------------------------------
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for ${local.name_prefix} S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  # This policy follows the principle of least privilege.
  # 1. It allows the root user of the account to manage the key, which enables IAM policies.
  # 2. It allows the S3 service to use the key ONLY on behalf of the specific S3 bucket created below.
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service to use the key for the specific bucket"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            # This condition is critical: it restricts the S3 service to use this key
            # only for operations related to our specific bucket.
            "aws:SourceArn" = "arn:aws:s3:::${local.name_prefix}-storage"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-key"
  })
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/${local.name_prefix}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

# -----------------------------------------------------------------------------
# S3 Bucket Resources
#
# Creates a private, versioned, and encrypted S3 bucket.
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "storage_bucket" {
  # Bucket names must be globally unique. The name_prefix helps ensure this.
  bucket = "${local.name_prefix}-storage"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-storage"
  })
}

resource "aws_s3_bucket_versioning" "storage_bucket_versioning" {
  bucket = aws_s3_bucket.storage_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "storage_bucket_pab" {
  bucket = aws_s3_bucket.storage_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage_bucket_encryption" {
  bucket = aws_s3_bucket.storage_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_key.arn
    }
    # Enabling bucket key significantly reduces KMS API call costs.
    bucket_key_enabled = true
  }
}

# -----------------------------------------------------------------------------
# IAM Resources
#
# Creates an IAM role for EC2 with a least-privilege policy granting
# read-only access to the S3 bucket and decrypt permissions for the KMS key.
# -----------------------------------------------------------------------------
resource "aws_iam_role" "ec2_s3_readonly_role" {
  name = "${local.name_prefix}-ec2-s3-readonly-role"

  # Trust policy allowing the EC2 service to assume this role.
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-s3-readonly-role"
  })
}

resource "aws_iam_policy" "s3_readonly_policy" {
  name        = "${local.name_prefix}-s3-readonly-policy"
  description = "Allows read-only access to the ${aws_s3_bucket.storage_bucket.bucket} S3 bucket."

  # This policy provides the minimum permissions required to list the bucket and read its objects.
  # It also grants the necessary permissions to decrypt objects using the specific KMS key.
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListBucket"
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.storage_bucket.arn
      },
      {
        Sid      = "ReadObjects"
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.storage_bucket.arn}/*"
      },
      {
        Sid    = "KmsDecrypt"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.s3_key.arn
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-readonly-policy"
  })
}

resource "aws_iam_role_policy_attachment" "s3_readonly_attachment" {
  role       = aws_iam_role.ec2_s3_readonly_role.name
  policy_arn = aws_iam_policy.s3_readonly_policy.arn
}

# -----------------------------------------------------------------------------
# Outputs
#
# Provides the names and ARNs of the created resources for easy access.
# -----------------------------------------------------------------------------
output "s3_bucket_name" {
  description = "The name of the secure S3 bucket."
  value       = aws_s3_bucket.storage_bucket.id
}

output "kms_key_arn" {
  description = "The ARN of the customer-managed KMS key for S3 encryption."
  value       = aws_kms_key.s3_key.arn
}

output "kms_key_alias" {
  description = "The alias of the KMS key."
  value       = aws_kms_alias.s3_key_alias.name
}

output "iam_role_arn" {
  description = "The ARN of the IAM role for EC2 read-only access to S3."
  value       = aws_iam_role.ec2_s3_readonly_role.arn
}
```
