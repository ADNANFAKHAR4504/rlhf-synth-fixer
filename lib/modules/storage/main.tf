# modules/storage/main.tf

locals {
  bucket_name = "${var.project_name}-${var.environment}-transaction-logs-${data.aws_caller_identity.current.account_id}"
}

data "aws_caller_identity" "current" {}

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption - ${var.environment}"
  deletion_window_in_days = 10
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-s3-kms-key"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${var.project_name}-${var.environment}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# S3 Bucket for Transaction Logs
resource "aws_s3_bucket" "transaction_logs" {
  bucket = local.bucket_name
  
  tags = merge(var.tags, {
    Name = local.bucket_name
  })
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id
  
  rule {
    id     = "transition-and-expire"
    status = "Enabled"
    
    transition {
      days          = var.lifecycle_days
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = var.lifecycle_days * 2
      storage_class = "GLACIER"
    }
    
    expiration {
      days = var.lifecycle_days * 4
    }
    
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Block Public Access
resource "aws_s3_bucket_public_access_block" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
