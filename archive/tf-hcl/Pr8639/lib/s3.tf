# Input bucket for incoming transaction files
resource "aws_s3_bucket" "input" {
  bucket        = "etl-input-${var.environmentSuffix}"
  force_destroy = true

  tags = {
    Name        = "etl-input-${var.environmentSuffix}"
    Description = "Input bucket for banking transaction files"
  }
}

resource "aws_s3_bucket_versioning" "input" {
  bucket = aws_s3_bucket.input.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "input" {
  bucket = aws_s3_bucket.input.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "input" {
  bucket = aws_s3_bucket.input.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Output bucket for processed transaction data
resource "aws_s3_bucket" "output" {
  bucket        = "etl-output-${var.environmentSuffix}"
  force_destroy = true

  tags = {
    Name        = "etl-output-${var.environmentSuffix}"
    Description = "Output bucket for processed transaction data"
  }
}

resource "aws_s3_bucket_versioning" "output" {
  bucket = aws_s3_bucket.output.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "output" {
  bucket = aws_s3_bucket.output.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "output" {
  bucket = aws_s3_bucket.output.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "output" {
  bucket = aws_s3_bucket.output.id

  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"

    filter {}

    transition {
      days          = 0
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

# Audit bucket for processing logs and metadata
resource "aws_s3_bucket" "audit" {
  bucket        = "etl-audit-${var.environmentSuffix}"
  force_destroy = true

  tags = {
    Name        = "etl-audit-${var.environmentSuffix}"
    Description = "Audit bucket for ETL processing logs"
  }
}

resource "aws_s3_bucket_versioning" "audit" {
  bucket = aws_s3_bucket.audit.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit" {
  bucket = aws_s3_bucket.audit.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Event Notification to EventBridge
resource "aws_s3_bucket_notification" "input_notification" {
  bucket      = aws_s3_bucket.input.id
  eventbridge = true
}
