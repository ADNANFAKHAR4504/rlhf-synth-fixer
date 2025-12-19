# s3.tf - S3 Buckets for Migration Logs

# S3 Bucket for Migration Logs
resource "aws_s3_bucket" "migration_logs" {
  bucket = "migration-logs-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "migration-logs-${var.environment_suffix}"
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "migration_logs" {
  bucket = aws_s3_bucket.migration_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "migration_logs" {
  bucket = aws_s3_bucket.migration_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "migration_logs" {
  bucket = aws_s3_bucket.migration_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "migration_logs" {
  bucket = aws_s3_bucket.migration_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.s3_logs_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER_IR"
    }
  }

  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"

    filter {
      prefix = ""
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 Bucket Policy for DMS and Lambda Access
resource "aws_s3_bucket_policy" "migration_logs" {
  bucket = aws_s3_bucket.migration_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.migration_logs.arn,
          "${aws_s3_bucket.migration_logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowDMSAccess"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.migration_logs.arn,
          "${aws_s3_bucket.migration_logs.arn}/*"
        ]
      }
    ]
  })
}

# CloudWatch Alarm for S3 Bucket Size
resource "aws_cloudwatch_metric_alarm" "s3_bucket_size" {
  alarm_name          = "s3-bucket-size-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BucketSizeBytes"
  namespace           = "AWS/S3"
  period              = 86400
  statistic           = "Average"
  threshold           = 1000000000000 # 1TB
  alarm_description   = "This metric monitors S3 bucket size"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    BucketName  = aws_s3_bucket.migration_logs.id
    StorageType = "StandardStorage"
  }

  tags = {
    Name = "s3-bucket-size-alarm-${var.environment_suffix}"
  }
}
