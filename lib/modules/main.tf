# Generate a random string for unique bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Generate unique bucket name if not provided
locals {
  bucket_name = var.bucket_name != null ? var.bucket_name : "${var.project_name}-${var.environment}-${random_string.bucket_suffix.result}"
}

resource "aws_s3_bucket" "bucket" {
  bucket = local.bucket_name

  tags = merge(var.tags, {
    Name        = local.bucket_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = var.project_name
  })
}

# Enable versioning for the bucket
resource "aws_s3_bucket_versioning" "bucket" {
  bucket = aws_s3_bucket.bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configure server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "bucket" {
  bucket = aws_s3_bucket.bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "bucket" {
  bucket = aws_s3_bucket.bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
