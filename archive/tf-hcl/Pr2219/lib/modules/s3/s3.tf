resource "aws_s3_bucket" "this_bucket" {
  bucket        = var.bucket_name
  force_destroy = true
  tags = {
    Name    = var.bucket_name
    Project = var.project
  }
}

# Server-side encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "this_bucket_sse" {
  bucket = aws_s3_bucket.this_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_id
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "this_bucket_block" {
  bucket                  = aws_s3_bucket.this_bucket.id
  block_public_acls        = true
  block_public_policy      = true
  ignore_public_acls       = true
  restrict_public_buckets  = true
}

# Enable versioning if required
resource "aws_s3_bucket_versioning" "this_bucket_versioning" {
  bucket = aws_s3_bucket.this_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  bucket = aws_s3_bucket.this_bucket.id
  policy = var.bucket_policy
}