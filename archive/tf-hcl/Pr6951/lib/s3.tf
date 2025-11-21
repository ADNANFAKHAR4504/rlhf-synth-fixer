# S3 Buckets for Document Storage (Requirements 1, 4, 9)

# Source region S3 bucket (us-east-1)
resource "aws_s3_bucket" "source_documents" {
  provider      = aws.source
  bucket        = "doc-proc-${var.source_region}-s3-documents-${var.environment_suffix}"
  force_destroy = true # Allow bucket destruction for testing/demo

  tags = {
    Name           = "doc-proc-${var.source_region}-s3-documents-${var.environment_suffix}"
    Region         = var.source_region
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Enable versioning on source bucket (Requirement 1)
resource "aws_s3_bucket_versioning" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable SSE-S3 encryption with bucket keys (Constraint 1)
resource "aws_s3_bucket_server_side_encryption_configuration" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Target region S3 bucket (eu-west-1)
resource "aws_s3_bucket" "target_documents" {
  provider      = aws.target
  bucket        = "doc-proc-${var.target_region}-s3-documents-${var.environment_suffix}"
  force_destroy = true # Allow bucket destruction for testing/demo

  tags = {
    Name           = "doc-proc-${var.target_region}-s3-documents-${var.environment_suffix}"
    Region         = var.target_region
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Enable versioning on target bucket (Requirement 1)
resource "aws_s3_bucket_versioning" "target_documents" {
  provider = aws.target
  bucket   = aws_s3_bucket.target_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable SSE-S3 encryption with bucket keys on target (Constraint 1)
resource "aws_s3_bucket_server_side_encryption_configuration" "target_documents" {
  provider = aws.target
  bucket   = aws_s3_bucket.target_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 replication configuration (Requirement 4)
resource "aws_s3_bucket_replication_configuration" "source_to_target" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id
  role     = aws_iam_role.s3_replication.arn

  rule {
    id     = "replicate-all-documents"
    status = "Enabled"

    # Replicate existing objects (Requirement 4)
    filter {}

    delete_marker_replication {
      status = "Enabled"
    }

    destination {
      bucket        = aws_s3_bucket.target_documents.arn
      storage_class = "STANDARD"

      # Enable replication time control for predictable replication
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
  }

  depends_on = [
    aws_s3_bucket_versioning.source_documents,
    aws_s3_bucket_versioning.target_documents
  ]
}

# Lifecycle policy for gradual migration (Requirement 9)
resource "aws_s3_bucket_lifecycle_configuration" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  rule {
    id     = "migration-lifecycle"
    status = "Enabled"

    filter {}

    # Transition to Intelligent-Tiering after migration phase
    transition {
      days          = var.document_retention_days
      storage_class = "INTELLIGENT_TIERING"
    }

    # Non-current versions cleanup
    noncurrent_version_expiration {
      noncurrent_days = var.document_retention_days * 2
    }
  }
}

# Lifecycle policy for target bucket
resource "aws_s3_bucket_lifecycle_configuration" "target_documents" {
  provider = aws.target
  bucket   = aws_s3_bucket.target_documents.id

  rule {
    id     = "archive-lifecycle"
    status = "Enabled"

    filter {}

    # Transition to Glacier for long-term storage
    transition {
      days          = var.document_retention_days
      storage_class = "GLACIER"
    }
  }
}

# Block public access on source bucket
resource "aws_s3_bucket_public_access_block" "source_documents" {
  provider = aws.source
  bucket   = aws_s3_bucket.source_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block public access on target bucket
resource "aws_s3_bucket_public_access_block" "target_documents" {
  provider = aws.target
  bucket   = aws_s3_bucket.target_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
