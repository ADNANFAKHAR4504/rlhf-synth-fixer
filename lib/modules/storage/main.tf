# KMS Key for S3 Encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7

  tags = {
    Name = "SecConfig-S3-KMS-Key-${var.environment}"
  }
}

# KMS Key Alias
resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/secconfig-s3-${var.environment}"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# S3 Bucket with Encryption
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "secconfig-secure-bucket-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name = "SecConfig-Secure-Bucket-${var.environment}"
  }
}

# Random string for unique bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.secure_bucket.arn,
          "${aws_s3_bucket.secure_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# EBS Default Encryption
resource "aws_ebs_default_kms_key" "default" {
  key_arn = aws_kms_key.ebs_encryption.arn
}

resource "aws_ebs_encryption_by_default" "default" {
  enabled = true
}

# KMS Key for EBS Encryption
resource "aws_kms_key" "ebs_encryption" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 7

  tags = {
    Name = "SecConfig-EBS-KMS-Key-${var.environment}"
  }
}

# KMS Key Alias for EBS
resource "aws_kms_alias" "ebs_encryption" {
  name          = "alias/secconfig-ebs-${var.environment}"
  target_key_id = aws_kms_key.ebs_encryption.key_id
}