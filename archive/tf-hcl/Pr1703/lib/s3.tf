# Data source for current AWS account
data "aws_caller_identity" "current" {}

# S3 buckets with KMS encryption
resource "aws_s3_bucket" "secure_buckets" {
  count         = length(var.bucket_names)
  bucket        = "${var.application_name}-${var.bucket_names[count.index]}-${var.environment}-${var.environment_suffix}"
  force_destroy = true # Allow bucket deletion even if not empty

  tags = {
    Name        = "${var.application_name}-${var.bucket_names[count.index]}-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Application = var.application_name
    Suffix      = var.environment_suffix
  }
}

# S3 bucket server-side encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "bucket_encryption" {
  count  = length(aws_s3_bucket.secure_buckets)
  bucket = aws_s3_bucket.secure_buckets[count.index].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "bucket_pab" {
  count  = length(aws_s3_bucket.secure_buckets)
  bucket = aws_s3_bucket.secure_buckets[count.index].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "bucket_versioning" {
  count  = length(aws_s3_bucket.secure_buckets)
  bucket = aws_s3_bucket.secure_buckets[count.index].id

  versioning_configuration {
    status = "Enabled"
  }
}