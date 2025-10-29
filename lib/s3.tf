# s3.tf

# S3 Bucket for Raw Webhook Payloads
resource "aws_s3_bucket" "raw_payloads" {
  bucket = local.raw_payloads_bucket_name

  tags = merge(
    local.common_tags,
    {
      Name    = local.raw_payloads_bucket_name
      Purpose = "Raw webhook payloads storage"
    }
  )
}

# Block public access for raw payloads bucket
resource "aws_s3_bucket_public_access_block" "raw_payloads" {
  bucket = aws_s3_bucket.raw_payloads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption for raw payloads bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "raw_payloads" {
  bucket = aws_s3_bucket.raw_payloads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = var.s3_encryption_type
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policy for raw payloads bucket
resource "aws_s3_bucket_lifecycle_configuration" "raw_payloads" {
  bucket = aws_s3_bucket.raw_payloads.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = var.raw_payload_glacier_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.raw_payload_retention_days
    }
  }

  rule {
    id     = "intelligent-tiering"
    status = "Enabled"

    filter {}

    transition {
      days          = 0
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

# Versioning disabled for raw payloads (no need)
resource "aws_s3_bucket_versioning" "raw_payloads" {
  bucket = aws_s3_bucket.raw_payloads.id

  versioning_configuration {
    status = "Disabled"
  }
}

# S3 Bucket for Processed Transaction Logs
resource "aws_s3_bucket" "processed_logs" {
  bucket = local.processed_logs_bucket_name

  tags = merge(
    local.common_tags,
    {
      Name    = local.processed_logs_bucket_name
      Purpose = "Processed transaction logs storage"
    }
  )
}

# Block public access for processed logs bucket
resource "aws_s3_bucket_public_access_block" "processed_logs" {
  bucket = aws_s3_bucket.processed_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption for processed logs bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "processed_logs" {
  bucket = aws_s3_bucket.processed_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = var.s3_encryption_type
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policy for processed logs bucket
resource "aws_s3_bucket_lifecycle_configuration" "processed_logs" {
  bucket = aws_s3_bucket.processed_logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = var.processed_logs_glacier_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.processed_logs_retention_days
    }
  }

  rule {
    id     = "intelligent-tiering"
    status = "Enabled"

    filter {}

    transition {
      days          = 0
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

# Versioning enabled for processed logs (recovery purposes)
resource "aws_s3_bucket_versioning" "processed_logs" {
  bucket = aws_s3_bucket.processed_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}
