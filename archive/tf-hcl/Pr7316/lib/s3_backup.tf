# S3 bucket for database exports in primary region
resource "aws_s3_bucket" "primary_backup" {
  bucket = "db-exports-primary-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.common_tags,
    {
      Name   = "db-exports-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_s3_bucket_versioning" "primary_backup" {
  bucket = aws_s3_bucket.primary_backup.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary_backup" {
  bucket = aws_s3_bucket.primary_backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "primary_backup" {
  bucket = aws_s3_bucket.primary_backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "primary_backup" {
  bucket = aws_s3_bucket.primary_backup.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# S3 bucket for database exports in secondary region
resource "aws_s3_bucket" "secondary_backup" {
  provider = aws.secondary
  bucket   = "db-exports-secondary-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.common_tags,
    {
      Name   = "db-exports-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_s3_bucket_versioning" "secondary_backup" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_backup.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary_backup" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "secondary_backup" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Replication IAM role
resource "aws_iam_role" "replication" {
  name = "s3-replication-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "s3-replication-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_policy" "replication" {
  name = "s3-replication-policy-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary_backup.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = [
          "${aws_s3_bucket.primary_backup.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          "${aws_s3_bucket.secondary_backup.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  role       = aws_iam_role.replication.name
  policy_arn = aws_iam_policy.replication.arn
}

# S3 replication configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  depends_on = [aws_s3_bucket_versioning.primary_backup]

  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.primary_backup.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.secondary_backup.arn
      storage_class = "STANDARD"
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }
}
