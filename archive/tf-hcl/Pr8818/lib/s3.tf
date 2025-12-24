# S3 bucket in current region
resource "aws_s3_bucket" "documents" {
  provider = aws.primary
  bucket   = "${local.resource_prefix}-documents-${local.current_region}"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-documents-${local.current_region}"
    }
  )
}

# Enable versioning for replication
resource "aws_s3_bucket_versioning" "documents" {
  provider = aws.primary
  bucket   = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  provider = aws.primary
  bucket   = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

# Public access block
resource "aws_s3_bucket_public_access_block" "documents" {
  provider = aws.primary
  bucket   = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Secondary region S3 bucket (for replication destination)
resource "aws_s3_bucket" "documents_secondary" {
  provider = aws.secondary
  bucket   = "${local.resource_prefix}-documents-${local.other_region}"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-documents-${local.other_region}"
    }
  )
}

# Enable versioning on secondary bucket
resource "aws_s3_bucket_versioning" "documents_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.documents_secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption configuration for secondary bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "documents_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.documents_secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_secondary.arn
    }
    bucket_key_enabled = true
  }
}

# Public access block for secondary bucket
resource "aws_s3_bucket_public_access_block" "documents_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.documents_secondary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cross-region replication (only from primary to secondary)
resource "aws_s3_bucket_replication_configuration" "documents" {
  provider = aws.primary
  count    = local.is_primary ? 1 : 0

  depends_on = [
    aws_s3_bucket_versioning.documents,
    aws_s3_bucket_versioning.documents_secondary
  ]

  role   = data.aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.documents_secondary.arn
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.s3_secondary.arn
      }
    }
  }
}

# Data source for current account
data "aws_caller_identity" "current" {
  provider = aws.primary
}
