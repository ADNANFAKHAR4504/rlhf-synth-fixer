resource "aws_s3_bucket" "webhook_payloads" {
  bucket = lower("${var.project}-${var.environment}-webhook-payloads-${local.suffix}")

  force_destroy = true # allow destroy when cleaning up/failing

  tags = local.common_tags
}

resource "aws_s3_bucket_acl" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "webhook_payloads" {
  bucket                  = aws_s3_bucket.webhook_payloads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id

  rule {
    id     = "archive-old-payloads"
    status = "Enabled"
    filter { prefix = "" }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# failed messages bucket
resource "aws_s3_bucket" "failed_messages" {
  bucket = lower("${var.project}-${var.environment}-failed-messages-${local.suffix}")

  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_acl" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "failed_messages" {
  bucket                  = aws_s3_bucket.failed_messages.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id

  rule {
    id     = "cleanup-failed-messages"
    status = "Enabled"
    filter { prefix = "" }

    transition {
      # AWS requires STANDARD_IA transitions to be >= 30 days
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 90
    }
  }
}
 