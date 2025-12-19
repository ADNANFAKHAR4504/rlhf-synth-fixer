# Primary S3 Bucket for Legal Documents
resource "aws_s3_bucket" "primary" {
  bucket = local.primary_bucket_name

  # Object Lock requires versioning and can only be enabled at bucket creation
  object_lock_enabled = var.enable_object_lock

  tags = merge(
    local.common_tags,
    {
      Name = local.primary_bucket_name
      Type = "Primary Document Storage"
    }
  )
}

# Versioning (required for Object Lock)
resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id

  versioning_configuration {
    status     = "Enabled"
    mfa_delete = var.enable_mfa_delete ? "Enabled" : "Disabled"
  }
}

# Object Lock Configuration
resource "aws_s3_bucket_object_lock_configuration" "primary" {
  count = var.enable_object_lock ? 1 : 0

  bucket = aws_s3_bucket.primary.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.object_lock_retention_days
    }
  }

  depends_on = [aws_s3_bucket_versioning.primary]
}

# Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
    bucket_key_enabled = true
  }
}

# S3 Transfer Acceleration
resource "aws_s3_bucket_accelerate_configuration" "primary" {
  count = var.enable_transfer_acceleration ? 1 : 0

  bucket = aws_s3_bucket.primary.id
  status = "Enabled"
}

# Public Access Block
resource "aws_s3_bucket_public_access_block" "primary" {
  bucket = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  # Transition current versions to Intelligent-Tiering
  rule {
    id     = "transition-current-to-intelligent-tiering"
    status = "Enabled"

    filter {}

    transition {
      days          = var.transition_to_intelligent_tiering_days
      storage_class = "INTELLIGENT_TIERING"
    }
  }

  # Transition noncurrent versions to Glacier
  rule {
    id     = "transition-noncurrent-to-glacier"
    status = "Enabled"

    filter {}

    noncurrent_version_transition {
      noncurrent_days = var.transition_noncurrent_to_glacier_days
      storage_class   = "GLACIER"
    }

    # Delete noncurrent versions after legal retention period
    noncurrent_version_expiration {
      noncurrent_days = local.noncurrent_delete_days
    }
  }

  # Abort incomplete multipart uploads
  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = var.abort_incomplete_uploads_days
    }
  }

  # Remove expired delete markers
  rule {
    id     = "remove-expired-delete-markers"
    status = "Enabled"

    filter {}

    expiration {
      expired_object_delete_marker = true
    }
  }

  depends_on = [aws_s3_bucket_versioning.primary]
}

# Bucket Policy
resource "aws_s3_bucket_policy" "primary" {
  bucket = aws_s3_bucket.primary.id
  policy = data.aws_iam_policy_document.primary_bucket_policy.json

  depends_on = [aws_s3_bucket_public_access_block.primary]
}

# S3 Access Logging Configuration
resource "aws_s3_bucket_logging" "primary" {
  count = var.enable_s3_access_logging ? 1 : 0

  bucket = aws_s3_bucket.primary.id

  target_bucket = aws_s3_bucket.audit.id
  target_prefix = "s3-access-logs/primary/"
}

# S3 Inventory Configuration
resource "aws_s3_bucket_inventory" "primary" {
  count = var.enable_s3_inventory ? 1 : 0

  bucket = aws_s3_bucket.primary.id
  name   = "complete-inventory"

  included_object_versions = "All"

  schedule {
    frequency = var.s3_inventory_schedule
  }

  destination {
    bucket {
      format     = "CSV"
      bucket_arn = aws_s3_bucket.reporting.arn
      prefix     = local.inventory_prefix

      encryption {
        sse_kms {
          key_id = aws_kms_key.primary.arn
        }
      }
    }
  }

  optional_fields = [
    "Size",
    "LastModifiedDate",
    "StorageClass",
    "ETag",
    "IsMultipartUploaded",
    "ReplicationStatus",
    "EncryptionStatus",
    "ObjectLockRetainUntilDate",
    "ObjectLockMode",
    "ObjectLockLegalHoldStatus"
  ]
}

# Cross-Region Replication Bucket (Destination)
resource "aws_s3_bucket" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replication
  bucket   = "${local.primary_bucket_name}-replication"

  object_lock_enabled = var.enable_object_lock

  tags = merge(
    local.common_tags,
    {
      Name = "${local.primary_bucket_name}-replication"
      Type = "Cross-Region Replication"
    }
  )
}

# Replication Bucket Versioning
resource "aws_s3_bucket_versioning" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replication
  bucket   = aws_s3_bucket.replication[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

# Replication Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replication
  bucket   = aws_s3_bucket.replication[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Replication Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0

  provider = aws.replication
  bucket   = aws_s3_bucket.replication[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Replication Configuration
resource "aws_s3_bucket_replication_configuration" "primary" {
  count = var.enable_cross_region_replication ? 1 : 0

  bucket = aws_s3_bucket.primary.id
  role   = aws_iam_role.replication[0].arn

  rule {
    id     = "replicate-all-objects"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.replication[0].arn
      storage_class = "STANDARD_IA"

      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }

  depends_on = [
    aws_s3_bucket_versioning.primary,
    aws_s3_bucket_versioning.replication
  ]
}

# Audit S3 Bucket for CloudTrail and S3 Access Logs
resource "aws_s3_bucket" "audit" {
  bucket = local.audit_bucket_name

  tags = merge(
    local.common_tags,
    {
      Name = local.audit_bucket_name
      Type = "Audit Logs Storage"
    }
  )
}

# Audit Bucket Versioning
resource "aws_s3_bucket_versioning" "audit" {
  bucket = aws_s3_bucket.audit.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Audit Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = local.audit_kms_key_id
    }
    bucket_key_enabled = true
  }
}

# Audit Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "audit" {
  bucket = aws_s3_bucket.audit.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Audit Bucket Lifecycle - Delete old logs after retention period
resource "aws_s3_bucket_lifecycle_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    id     = "delete-old-audit-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = local.legal_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  depends_on = [aws_s3_bucket_versioning.audit]
}

# Audit Bucket Policy
resource "aws_s3_bucket_policy" "audit" {
  bucket = aws_s3_bucket.audit.id
  policy = data.aws_iam_policy_document.audit_bucket_policy.json

  depends_on = [aws_s3_bucket_public_access_block.audit]
}

# Reporting S3 Bucket for Monthly Reports and Inventory
resource "aws_s3_bucket" "reporting" {
  bucket = local.reporting_bucket_name

  tags = merge(
    local.common_tags,
    {
      Name = local.reporting_bucket_name
      Type = "Reports and Inventory Storage"
    }
  )
}

# Reporting Bucket Versioning
resource "aws_s3_bucket_versioning" "reporting" {
  bucket = aws_s3_bucket.reporting.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Reporting Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "reporting" {
  bucket = aws_s3_bucket.reporting.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
    bucket_key_enabled = true
  }
}

# Reporting Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "reporting" {
  bucket = aws_s3_bucket.reporting.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Reporting Bucket Lifecycle - Delete old reports
resource "aws_s3_bucket_lifecycle_configuration" "reporting" {
  bucket = aws_s3_bucket.reporting.id

  rule {
    id     = "delete-old-reports"
    status = "Enabled"

    filter {
      prefix = "monthly-reports/"
    }

    expiration {
      days = 365 # Keep reports for 1 year
    }
  }

  rule {
    id     = "transition-inventory-to-glacier"
    status = "Enabled"

    filter {
      prefix = local.inventory_prefix
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = local.legal_retention_days
    }
  }

  depends_on = [aws_s3_bucket_versioning.reporting]
}

# Reporting Bucket Policy
resource "aws_s3_bucket_policy" "reporting" {
  bucket = aws_s3_bucket.reporting.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3Inventory"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.reporting.arn}/${local.inventory_prefix}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
          ArnLike = {
            "aws:SourceArn" = aws_s3_bucket.primary.arn
          }
        }
      },
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.reporting.arn,
          "${aws_s3_bucket.reporting.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.reporting]
}
