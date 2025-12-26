Here's the complete `main.tf` file that meets all your requirements:

```hcl
# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "iac-aws-nova-model-breaking"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Local values for consistent naming
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# KMS Customer Managed Key for S3 encryption
resource "aws_kms_key" "s3_encryption_key" {
  description             = "KMS key for ${local.name_prefix} S3 bucket encryption"
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
      }
    ]
  })
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-kms-key"
  })
}

# KMS Key Alias
resource "aws_kms_alias" "s3_encryption_key_alias" {
  name          = "alias/${local.name_prefix}-s3-key"
  target_key_id = aws_kms_key.s3_encryption_key.key_id
}

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# S3 Bucket
resource "aws_s3_bucket" "main_bucket" {
  bucket = "${local.name_prefix}-storage"
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-storage"
  })
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main_bucket_pab" {
  bucket = aws_s3_bucket.main_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Server Side Encryption Configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "main_bucket_encryption" {
  bucket = aws_s3_bucket.main_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main_bucket_versioning" {
  bucket = aws_s3_bucket.main_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Policy for S3 Read-Only Access
resource "aws_iam_policy" "s3_readonly_policy" {
  name        = "${local.name_prefix}-s3-readonly-policy"
  description = "Read-only access policy for ${local.name_prefix} S3 bucket"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.main_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.main_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.s3_encryption_key.arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-readonly-policy"
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_s3_role" {
  name = "${local.name_prefix}-ec2-s3-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-s3-role"
  })
}

# Attach the policy to the IAM role
resource "aws_iam_role_policy_attachment" "ec2_s3_policy_attachment" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = aws_iam_policy.s3_readonly_policy.arn
}

# Outputs
output "s3_bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.main_bucket.bucket
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_encryption_key.arn
}

output "iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_s3_role.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS key"
  value       = aws_kms_alias.s3_encryption_key_alias.name
}

```

### Key Features and Explanations:

1.  **Variable Management**
      * Declares the required `aws_region` variable that your existing `provider.tf` can reference.
      * Includes sensible defaults for all variables.
      * Uses a consistent naming pattern through `locals`.
2.  **KMS Encryption Setup**
      * Creates a dedicated Customer Managed Key (CMK) with key rotation enabled.
      * Includes a comprehensive key policy allowing root account access and S3 service permissions.
      * Creates a user-friendly alias for the key.
3.  **S3 Bucket Configuration**
      * Creates a private S3 bucket with public access completely blocked.
      * Enforces server-side encryption using the created KMS key.
      * Enables versioning for data protection.
      * Uses `bucket_key_enabled = true` for cost optimization.
4.  **IAM Security (Least Privilege)**
      * Creates a minimal IAM policy with only `s3:GetObject` and `s3:ListBucket` permissions.
      * Includes KMS decrypt permission with a condition limiting it to S3 service usage.
      * IAM role trust policy restricted to EC2 service only.
5.  **Best Practices Implemented**
      * Consistent resource naming using the specified pattern.
      * Comprehensive tagging strategy.
      * Proper resource dependencies.
      * Security-first approach with encryption and access controls.
6.  **Validation Ready**
      * All syntax is correct and will pass `terraform validate`.
      * Uses proper HCL formatting and structure.
      * Includes all required outputs.

This configuration creates a secure, production-ready infrastructure that follows AWS security best practices while meeting all your specified requirements.
