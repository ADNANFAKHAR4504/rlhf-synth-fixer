# S3 bucket for application data storage
# Implements security best practices: encryption, versioning, access logging
resource "aws_s3_bucket" "app_data" {
  bucket = "${var.project_name}-${var.environment}-app-data-${random_id.bucket_suffix.hex}"

  tags = {
    Name       = "${var.project_name}-${var.environment}-app-data"
    Purpose    = "Application data storage"
    Compliance = "SOC2"
  }
}

# S3 bucket for access logs and audit trails
# Separate bucket for security logs to prevent tampering
resource "aws_s3_bucket" "logging" {
  bucket = "${var.project_name}-${var.environment}-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name       = "${var.project_name}-${var.environment}-logs"
    Purpose    = "Access logs and audit trails"
    Compliance = "SOC2"
  }
}

# Random suffix to ensure globally unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Block all public access to application data bucket
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block all public access to logging bucket
resource "aws_s3_bucket_public_access_block" "logging" {
  bucket = aws_s3_bucket.logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning on application data bucket for data protection
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable versioning on logging bucket for audit trail integrity
resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id
  versioning_configuration {
    status = "Enabled"
  }
}

# KMS encryption for application data bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# KMS encryption for logging bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Access logging for application data bucket (logs go to logging bucket)
resource "aws_s3_bucket_logging" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  target_bucket = aws_s3_bucket.logging.id
  target_prefix = "access-logs/app-data/"
}

# Lifecycle policy for application data bucket
# Manages storage costs while maintaining compliance requirements
resource "aws_s3_bucket_lifecycle_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    id     = "app_data_lifecycle"
    status = "Enabled"

    # Transition current objects to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Transition current objects to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete non-current versions after 90 days to manage costs
    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    # Transition non-current versions to IA after 30 days
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
  }
}

# Lifecycle policy for logging bucket
# Longer retention for audit and compliance requirements
resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "logging_lifecycle"
    status = "Enabled"

    # Transition to IA after 90 days (logs accessed less frequently)
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    # Transition to Glacier after 365 days
    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    # Keep non-current versions for 7 years for compliance
    noncurrent_version_expiration {
      noncurrent_days = 2555 # 7 years
    }
  }
}

# Bucket policy for CloudTrail access to logging bucket
resource "aws_s3_bucket_policy" "logging_cloudtrail" {
  bucket = aws_s3_bucket.logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-${var.environment}-cloudtrail"
          }
        }
      }
    ]
  })
}
