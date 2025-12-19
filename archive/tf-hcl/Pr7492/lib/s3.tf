# S3 bucket for CloudWatch Metric Streams
resource "aws_s3_bucket" "metric_streams" {
  bucket = "${local.name_prefix}-metric-streams"

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.name_prefix}-metric-streams"
      Purpose = "CloudWatch Metric Streams Storage"
    }
  )
}

# Block public access
resource "aws_s3_bucket_public_access_block" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy for 15-month retention
resource "aws_s3_bucket_lifecycle_configuration" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  rule {
    id     = "metric-retention-policy"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER_IR"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = var.metric_retention_days
    }
  }
}

# Versioning for data protection
resource "aws_s3_bucket_versioning" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket policy for CloudWatch Metric Streams
resource "aws_s3_bucket_policy" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchMetricStreams"
        Effect = "Allow"
        Principal = {
          Service = "streams.metrics.cloudwatch.amazonaws.com"
        }
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.metric_streams.arn}/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# S3 bucket for Synthetics canary artifacts
resource "aws_s3_bucket" "synthetics_artifacts" {
  bucket = "${local.name_prefix}-synthetics-artifacts"

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.name_prefix}-synthetics-artifacts"
      Purpose = "CloudWatch Synthetics Artifacts"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "synthetics_artifacts" {
  bucket = aws_s3_bucket.synthetics_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "synthetics_artifacts" {
  bucket = aws_s3_bucket.synthetics_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Secondary region bucket for cross-region replication
resource "aws_s3_bucket" "metric_streams_replica" {
  provider = aws.secondary
  bucket   = "${local.name_prefix}-metric-streams-replica"

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.name_prefix}-metric-streams-replica"
      Purpose = "CloudWatch Metric Streams Replica"
    }
  )
}

resource "aws_s3_bucket_versioning" "metric_streams_replica" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.metric_streams_replica.id

  versioning_configuration {
    status = "Enabled"
  }
}
