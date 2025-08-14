locals {
  # Get environment suffix from env var or use default
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : ""
  # Add suffix to resource names if provided
  suffix_string = local.env_suffix != "" ? "-${local.env_suffix}" : ""

  common_tags = {
    Project           = var.project_name
    Environment       = var.environment
    EnvironmentSuffix = local.env_suffix
    ManagedBy         = "terraform"
    Region            = var.aws_region
  }
}

# Random ID for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3_encryption_key" {
  description             = "KMS key for S3 bucket encryption"
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
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "s3_encryption_key_alias" {
  name          = "alias/${var.bucket_prefix}${local.suffix_string}-s3-key"
  target_key_id = aws_kms_key.s3_encryption_key.key_id
}

# Primary S3 bucket for data storage
resource "aws_s3_bucket" "primary_data_bucket" {
  bucket        = "${var.bucket_prefix}${local.suffix_string}-primary-${random_id.bucket_suffix.hex}"
  force_destroy = true # Allow bucket deletion even with objects
  tags          = merge(local.common_tags, { Purpose = "Primary Data Storage" })
}

# Secondary S3 bucket for backup
resource "aws_s3_bucket" "backup_data_bucket" {
  bucket        = "${var.bucket_prefix}${local.suffix_string}-backup-${random_id.bucket_suffix.hex}"
  force_destroy = true # Allow bucket deletion even with objects
  tags          = merge(local.common_tags, { Purpose = "Backup Data Storage" })
}

# S3 bucket encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "primary_encryption" {
  bucket = aws_s3_bucket.primary_data_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_encryption" {
  bucket = aws_s3_bucket.backup_data_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "primary_versioning" {
  bucket = aws_s3_bucket.primary_data_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "backup_versioning" {
  bucket = aws_s3_bucket.backup_data_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "primary_block_public" {
  bucket                  = aws_s3_bucket.primary_data_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "backup_block_public" {
  bucket                  = aws_s3_bucket.backup_data_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for IP restriction - Using Allow with conditions
resource "aws_s3_bucket_policy" "primary_bucket_policy" {
  bucket = aws_s3_bucket.primary_data_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.primary_data_bucket.arn,
          "${aws_s3_bucket.primary_data_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.primary_block_public,
    aws_s3_bucket_server_side_encryption_configuration.primary_encryption,
    aws_s3_bucket_versioning.primary_versioning
  ]
}

resource "aws_s3_bucket_policy" "backup_bucket_policy" {
  bucket = aws_s3_bucket.backup_data_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.backup_data_bucket.arn,
          "${aws_s3_bucket.backup_data_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.backup_block_public,
    aws_s3_bucket_server_side_encryption_configuration.backup_encryption,
    aws_s3_bucket_versioning.backup_versioning
  ]
}
