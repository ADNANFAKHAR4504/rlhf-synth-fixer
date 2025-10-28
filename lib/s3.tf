# s3.tf - S3 bucket for automated backups with lifecycle policies

# S3 bucket for Aurora backups
resource "aws_s3_bucket" "aurora_backups" {
  bucket = "${var.project_name}-${var.environment_suffix}-aurora-backups-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-backups"
    }
  )
}

# Enable versioning for backup integrity
resource "aws_s3_bucket_versioning" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption for backups
resource "aws_s3_bucket_server_side_encryption_configuration" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.aurora.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block public access to backup bucket
resource "aws_s3_bucket_public_access_block" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for backup retention
resource "aws_s3_bucket_lifecycle_configuration" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  rule {
    id     = "backup-lifecycle"
    status = "Enabled"

    # Transition to cheaper storage after specified days
    transition {
      days          = var.backup_lifecycle_days
      storage_class = "STANDARD_IA"
    }

    # Move to Glacier after 60 days for long-term retention
    transition {
      days          = 60
      storage_class = "GLACIER"
    }

    # Delete old backups after retention period
    expiration {
      days = var.backup_expiration_days
    }

    # Clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  rule {
    id     = "old-version-cleanup"
    status = "Enabled"

    # Transition old versions to cheaper storage (minimum 30 days for STANDARD_IA)
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    # Remove old versions after 60 days (must be greater than transition days)
    noncurrent_version_expiration {
      noncurrent_days = 60
    }
  }
}

# S3 bucket policy for Aurora backup access
resource "aws_s3_bucket_policy" "aurora_backups" {
  bucket = aws_s3_bucket.aurora_backups.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.aurora_backups.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.aurora_backups.arn,
          "${aws_s3_bucket.aurora_backups.arn}/*"
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

# CloudWatch metric for backup monitoring
resource "aws_cloudwatch_metric_alarm" "backup_failed" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-backup-failed"
  alarm_description   = "Alert when Aurora backup fails"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BackupRetentionPeriodStorageUsed"
  namespace           = "AWS/RDS"
  period              = "3600"
  statistic           = "Average"
  threshold           = "0"
  treat_missing_data  = "breaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-backup-failed"
    }
  )
}