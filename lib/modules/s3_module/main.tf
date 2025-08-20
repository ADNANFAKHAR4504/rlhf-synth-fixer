# Random string for S3 bucket uniqueness - Primary Region
resource "random_string" "bucket_suffix_primary" {
  length  = 8
  special = false
  upper   = false
}

# Random string for S3 bucket uniqueness - Secondary Region
resource "random_string" "bucket_suffix_secondary" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket for Audit Logs - Primary Region
resource "aws_s3_bucket" "audit_logs_primary" {
  bucket = "${var.name_prefix}-audit-logs-primary-${random_string.bucket_suffix_primary.result}"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-audit-logs-primary"
  })
}

# S3 Bucket for Audit Logs - Secondary Region
resource "aws_s3_bucket" "audit_logs_secondary" {
  provider = aws.eu_west_1
  bucket   = "${var.name_prefix}-audit-logs-secondary-${random_string.bucket_suffix_secondary.result}"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-audit-logs-secondary"
  })
}

# S3 Bucket Encryption - Primary Region
resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs_primary" {
  bucket = aws_s3_bucket.audit_logs_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Encryption - Secondary Region
resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs_secondary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.audit_logs_secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block - Primary Region
resource "aws_s3_bucket_public_access_block" "audit_logs_primary" {
  bucket                  = aws_s3_bucket.audit_logs_primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Public Access Block - Secondary Region
resource "aws_s3_bucket_public_access_block" "audit_logs_secondary" {
  provider                = aws.eu_west_1
  bucket                  = aws_s3_bucket.audit_logs_secondary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for TLS-only access - Primary Region
data "aws_iam_policy_document" "s3_tls_only_primary" {
  statement {
    sid    = "DenyInsecureConnections"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.audit_logs_primary.arn,
      "${aws_s3_bucket.audit_logs_primary.arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# S3 Bucket Policy for TLS-only access - Secondary Region
data "aws_iam_policy_document" "s3_tls_only_secondary" {
  statement {
    sid    = "DenyInsecureConnections"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.audit_logs_secondary.arn,
      "${aws_s3_bucket.audit_logs_secondary.arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "audit_logs_tls_only_primary" {
  bucket = aws_s3_bucket.audit_logs_primary.id
  policy = data.aws_iam_policy_document.s3_tls_only_primary.json
}

resource "aws_s3_bucket_policy" "audit_logs_tls_only_secondary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.audit_logs_secondary.id
  policy   = data.aws_iam_policy_document.s3_tls_only_secondary.json
}