# S3 Replication IAM Role
resource "aws_iam_role" "s3_replication" {
  provider = aws.primary
  name     = "s3-replication-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name    = "s3-replication-role-${var.environment_suffix}"
    DR-Role = "both"
  })
}

# S3 Replication IAM Policy
resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.primary
  name     = "s3-replication-policy-${var.environment_suffix}"
  role     = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      }
    ]
  })
}

# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "${var.s3_bucket_prefix}-primary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "${var.s3_bucket_prefix}-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Primary S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Primary S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "primary" {
  provider                = aws.primary
  bucket                  = aws_s3_bucket.primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Secondary S3 Bucket
resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "${var.s3_bucket_prefix}-secondary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "${var.s3_bucket_prefix}-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Secondary S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Secondary S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "secondary" {
  provider                = aws.secondary
  bucket                  = aws_s3_bucket.secondary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Replication Configuration (Primary to Secondary) with RTC
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  role     = aws_iam_role.s3_replication.arn

  rule {
    id     = "replicate-all"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"

      # Replication Time Control (RTC) for predictable replication
      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      # Metrics for monitoring replication
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
    aws_s3_bucket_versioning.secondary
  ]
}
