# main.tf - Complete Terraform configuration for secure S3 buckets and IAM roles

# Variable declarations
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.aws_region))
    error_message = "AWS region must be a valid region identifier."
  }
}

variable "environment" {
  description = "Environment name (e.g., prod, staging, dev)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "Environment must be one of: prod, staging, dev."
  }
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "secure-app"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "bucket_names" {
  description = "List of S3 bucket names to create"
  type        = list(string)
  default     = ["data", "logs", "backups"]

  validation {
    condition     = length(var.bucket_names) > 0
    error_message = "At least one bucket name must be provided."
  }
}

# Local values for consistent naming and tagging
locals {
  # Common tags applied to all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
    Region      = var.aws_region
    CreatedDate = timestamp()
  }

  # Generate unique bucket names with project prefix and random suffix
  bucket_suffix = random_id.bucket_suffix.hex

  # Create bucket configurations with full names
  bucket_configs = {
    for name in var.bucket_names : name => {
      full_name = "${var.project_name}-${name}-${var.environment}-${local.bucket_suffix}"
      purpose   = name
    }
  }
}

# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4

  keepers = {
    project     = var.project_name
    environment = var.environment
  }
}

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# Data source for current AWS partition
data "aws_partition" "current" {}

# S3 Buckets with comprehensive security configuration
resource "aws_s3_bucket" "secure_buckets" {
  for_each = local.bucket_configs

  bucket = each.value.full_name

  tags = merge(local.common_tags, {
    Name    = each.value.full_name
    Purpose = each.value.purpose
  })
}

# S3 Bucket versioning configuration
resource "aws_s3_bucket_versioning" "bucket_versioning" {
  for_each = aws_s3_bucket.secure_buckets

  bucket = each.value.id

  versioning_configuration {
    status = "Enabled"
  }

  depends_on = [aws_s3_bucket.secure_buckets]
}

# S3 Bucket server-side encryption configuration (AES-256/SSE-S3)
resource "aws_s3_bucket_server_side_encryption_configuration" "bucket_encryption" {
  for_each = aws_s3_bucket.secure_buckets

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }

    bucket_key_enabled = true
  }

  depends_on = [aws_s3_bucket.secure_buckets]
}

# S3 Bucket public access block - Prevent all public access
resource "aws_s3_bucket_public_access_block" "bucket_pab" {
  for_each = aws_s3_bucket.secure_buckets

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  depends_on = [aws_s3_bucket.secure_buckets]
}

# S3 Bucket notification configuration for security monitoring
resource "aws_s3_bucket_notification" "bucket_notification" {
  for_each = aws_s3_bucket.secure_buckets

  bucket = each.value.id

  depends_on = [aws_s3_bucket.secure_buckets]
}

# S3 Bucket lifecycle configuration for cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "bucket_lifecycle" {
  for_each = aws_s3_bucket.secure_buckets

  bucket = each.value.id

  rule {
    id     = "transition_to_ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }

  depends_on = [aws_s3_bucket_versioning.bucket_versioning]
}

# S3 Bucket logging configuration
resource "aws_s3_bucket_logging" "bucket_logging" {
  for_each = {
    for k, v in aws_s3_bucket.secure_buckets : k => v
    if k != "logs" # Don't log the logs bucket to itself
  }

  bucket = each.value.id

  target_bucket = aws_s3_bucket.secure_buckets["logs"].id
  target_prefix = "access-logs/${each.key}/"

  depends_on = [aws_s3_bucket.secure_buckets]
}

# IAM Role for S3 access with assume role policy
resource "aws_iam_role" "s3_access_role" {
  for_each = local.bucket_configs

  name = "${var.project_name}-s3-${each.key}-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.project_name}-${each.key}-${var.environment}"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-s3-${each.key}-role-${var.environment}"
    Purpose = "S3 access for ${each.key} bucket"
  })
}

# IAM Policy for S3 bucket access (principle of least privilege)
resource "aws_iam_policy" "s3_bucket_policy" {
  for_each = local.bucket_configs

  name        = "${var.project_name}-s3-${each.key}-policy-${var.environment}"
  description = "Policy for accessing ${each.key} S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning"
        ]
        Resource = aws_s3_bucket.secure_buckets[each.key].arn
      },
      {
        Sid    = "ObjectAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.secure_buckets[each.key].arn}/*"
      },
      {
        Sid    = "EncryptionAccess"
        Effect = "Allow"
        Action = [
          "s3:GetEncryptionConfiguration"
        ]
        Resource = aws_s3_bucket.secure_buckets[each.key].arn
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-s3-${each.key}-policy-${var.environment}"
    Purpose = "S3 policy for ${each.key} bucket"
  })
}

# Attach IAM policy to IAM role
resource "aws_iam_role_policy_attachment" "s3_policy_attachment" {
  for_each = local.bucket_configs

  role       = aws_iam_role.s3_access_role[each.key].name
  policy_arn = aws_iam_policy.s3_bucket_policy[each.key].arn
}

# IAM Role for cross-service access (read-only)
resource "aws_iam_role" "s3_readonly_role" {
  name = "${var.project_name}-s3-readonly-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.project_name}-readonly-${var.environment}"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-s3-readonly-role-${var.environment}"
    Purpose = "Read-only access to all project S3 buckets"
  })
}

# IAM Policy for read-only access to all buckets
resource "aws_iam_policy" "s3_readonly_policy" {
  name        = "${var.project_name}-s3-readonly-policy-${var.environment}"
  description = "Read-only policy for all project S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListAllBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning"
        ]
        Resource = [
          for bucket in aws_s3_bucket.secure_buckets : bucket.arn
        ]
      },
      {
        Sid    = "ReadOnlyObjectAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          for bucket in aws_s3_bucket.secure_buckets : "${bucket.arn}/*"
        ]
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-s3-readonly-policy-${var.environment}"
    Purpose = "Read-only access policy for all S3 buckets"
  })
}

# Attach read-only policy to read-only role
resource "aws_iam_role_policy_attachment" "s3_readonly_policy_attachment" {
  role       = aws_iam_role.s3_readonly_role.name
  policy_arn = aws_iam_policy.s3_readonly_policy.arn
}

# S3 Bucket policies for additional security
resource "aws_s3_bucket_policy" "bucket_policies" {
  for_each = aws_s3_bucket.secure_buckets

  bucket = each.value.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          each.value.arn,
          "${each.value.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${each.value.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "AES256"
          }
        }
      },
      {
        Sid    = "AllowRoleAccess"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.s3_access_role[each.key].arn,
            aws_iam_role.s3_readonly_role.arn
          ]
        }
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Resource = [
          each.value.arn,
          "${each.value.arn}/*"
        ]
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.bucket_pab,
    aws_iam_role.s3_access_role,
    aws_iam_role.s3_readonly_role
  ]
}

# Outputs for integration and visibility
output "s3_bucket_names" {
  description = "Names of created S3 buckets"
  value = {
    for k, v in aws_s3_bucket.secure_buckets : k => v.id
  }
}

output "s3_bucket_arns" {
  description = "ARNs of created S3 buckets"
  value = {
    for k, v in aws_s3_bucket.secure_buckets : k => v.arn
  }
}

output "s3_bucket_domains" {
  description = "Domain names of created S3 buckets"
  value = {
    for k, v in aws_s3_bucket.secure_buckets : k => v.bucket_domain_name
  }
}

output "iam_role_arns" {
  description = "ARNs of created IAM roles for S3 access"
  value = {
    for k, v in aws_iam_role.s3_access_role : k => v.arn
  }
}

output "iam_readonly_role_arn" {
  description = "ARN of the read-only IAM role"
  value       = aws_iam_role.s3_readonly_role.arn
}

output "iam_policy_arns" {
  description = "ARNs of created IAM policies"
  value = {
    for k, v in aws_iam_policy.s3_bucket_policy : k => v.arn
  }
}

output "iam_readonly_policy_arn" {
  description = "ARN of the read-only IAM policy"
  value       = aws_iam_policy.s3_readonly_policy.arn
}

output "bucket_encryption_status" {
  description = "Encryption status of S3 buckets"
  value = {
    for k, v in aws_s3_bucket_server_side_encryption_configuration.bucket_encryption : k => "AES256 enabled"
  }
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    region      = var.aws_region
    environment = var.environment
    project     = var.project_name
    account_id  = data.aws_caller_identity.current.account_id
    created_at  = timestamp()
  }
}