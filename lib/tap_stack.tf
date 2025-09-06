# tap_stack.tf - AWS Security Hardening: S3 Bucket Security & IAM Role Hardening

# Variables
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "eu-central-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = null
}

# Local values for consistency and reusability
locals {
  environment_suffix = var.environment_suffix != null ? var.environment_suffix : "dev"
  bucket_name        = "secure-data-bucket-${local.environment_suffix}"

  # Common tags applied to all resources for governance and cost tracking
  common_tags = {
    Environment   = "production"
    Owner         = "security-team"
    SecurityLevel = "high"
  }
}

# S3 Bucket - Primary secure data storage
resource "aws_s3_bucket" "secure_data" {
  bucket = local.bucket_name
  tags   = local.common_tags
}

# Server-side encryption configuration - AES-256 (SSE-S3) for data at rest protection
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256" # SSE-S3 using AES-256 encryption
    }
  }
}

# Versioning - Enables object version history for data recovery and compliance
resource "aws_s3_bucket_versioning" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Block Public Access - Prevents accidental public exposure of bucket contents
resource "aws_s3_bucket_public_access_block" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket Policy - Enforces security controls at the bucket level
resource "aws_s3_bucket_policy" "secure_data" {
  bucket = aws_s3_bucket.secure_data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Security Control: Deny all non-TLS requests to prevent data in transit exposure
        Sid       = "DenyNonTLSAccess"
        Effect    = "Deny"
        Principal = "*"    # Wildcard justified: applies to all principals for security enforcement
        Action    = "s3:*" # Wildcard justified: blocks all actions over non-encrypted connections
        Resource = [
          aws_s3_bucket.secure_data.arn,
          "${aws_s3_bucket.secure_data.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        # Security Control: Deny PutObject without server-side encryption
        Sid       = "DenyPutObjectWithoutEncryption"
        Effect    = "Deny"
        Principal = "*" # Wildcard justified: applies to all principals for security enforcement
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.secure_data.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "AES256"
          }
        }
      },
      {
        # Security Control: Lock encryption configuration to prevent disabling
        Sid       = "DenyEncryptionConfigChanges"
        Effect    = "Deny"
        Principal = "*" # Wildcard justified: prevents any principal from disabling encryption
        Action    = "s3:PutEncryptionConfiguration"
        Resource  = aws_s3_bucket.secure_data.arn
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.secure_data]
}

# Analytics Reader IAM Role - Read-only access to analytics data with TLS enforcement
resource "aws_iam_role" "analytics_reader" {
  name = "analytics-reader-role-${local.environment_suffix}"

  # Trust policy: Only EC2 instances can assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Analytics Reader Policy - Least privilege access to analytics prefix only
resource "aws_iam_role_policy" "analytics_reader" {
  name = "analytics-reader-policy-${local.environment_suffix}"
  role = aws_iam_role.analytics_reader.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "s3:GetObject"                                 # Minimal permission: read-only access
        Resource = "${aws_s3_bucket.secure_data.arn}/analytics/*" # Scoped to analytics prefix only
        Condition = {
          Bool = {
            "aws:SecureTransport" = "true" # Enforce TLS for all requests
          }
        }
      }
    ]
  })
}

# Instance profile for analytics reader role - Required for EC2 role assumption
resource "aws_iam_instance_profile" "analytics_reader" {
  name = "analytics-reader-profile-${local.environment_suffix}"
  role = aws_iam_role.analytics_reader.name
  tags = local.common_tags
}

# Uploader IAM Role - Write-only access to uploads data with encryption enforcement
resource "aws_iam_role" "uploader" {
  name = "uploader-role-${local.environment_suffix}"

  # Trust policy: Only EC2 instances can assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Uploader Policy - Least privilege access to uploads prefix only with encryption requirement
resource "aws_iam_role_policy" "uploader" {
  name = "uploader-policy-${local.environment_suffix}"
  role = aws_iam_role.uploader.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "s3:PutObject"                               # Minimal permission: write-only access
        Resource = "${aws_s3_bucket.secure_data.arn}/uploads/*" # Scoped to uploads prefix only
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "AES256" # Enforce AES256 encryption on uploads
          }
        }
      }
    ]
  })
}

# Instance profile for uploader role - Required for EC2 role assumption
resource "aws_iam_instance_profile" "uploader" {
  name = "uploader-profile-${local.environment_suffix}"
  role = aws_iam_role.uploader.name
  tags = local.common_tags
}

# Outputs for testing and compliance validation
output "bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.secure_data.bucket
}

output "bucket_arn" {
  description = "ARN of the secure S3 bucket"
  value       = aws_s3_bucket.secure_data.arn
}

output "analytics_reader_role_arn" {
  description = "ARN of the analytics reader role"
  value       = aws_iam_role.analytics_reader.arn
}

output "uploader_role_arn" {
  description = "ARN of the uploader role"
  value       = aws_iam_role.uploader.arn
}

output "analytics_reader_policy_json" {
  description = "Analytics reader policy as JSON for compliance validation"
  value       = aws_iam_role_policy.analytics_reader.policy
}

output "uploader_policy_json" {
  description = "Uploader policy as JSON for compliance validation"
  value       = aws_iam_role_policy.uploader.policy
}

output "bucket_policy_json" {
  description = "S3 bucket policy as JSON for compliance validation"
  value       = aws_s3_bucket_policy.secure_data.policy
}