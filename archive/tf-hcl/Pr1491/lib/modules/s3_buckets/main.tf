resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Primary bucket
resource "aws_s3_bucket" "primary" {
  bucket = "${var.primary_bucket_prefix}-${random_string.bucket_suffix.result}"

  tags = merge(var.tags, {
    Name        = "primary-bucket"
    Environment = lookup(var.tags, "Environment", null)
    Region      = "us-west-1"
  })
}

# Secondary bucket
resource "aws_s3_bucket" "secondary" {
  provider = aws.eu_central_1
  bucket   = "${var.secondary_bucket_prefix}-${random_string.bucket_suffix.result}"

  tags = merge(var.tags, {
    Name        = "secondary-bucket"
    Environment = lookup(var.tags, "Environment", null)
    Region      = "eu-central-1"
  })
}

# Logging bucket
resource "aws_s3_bucket" "logging" {
  bucket = "${var.logging_bucket_prefix}-${random_string.bucket_suffix.result}"

  tags = merge(var.tags, {
    Name        = "logging-bucket"
    Environment = lookup(var.tags, "Environment", null)
    Purpose     = "CloudTrail logs"
  })
}

# SSE configs
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.primary_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.eu_central_1
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.secondary_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.primary_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Versioning
resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.eu_central_1
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle for logging bucket
resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
