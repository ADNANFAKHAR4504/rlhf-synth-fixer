# S3 Buckets with Cross-Region Replication and RTC

resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "data-primary-${var.environment_suffix}"

  tags = {
    Name = "data-primary-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "data-secondary-${var.environment_suffix}"

  tags = {
    Name = "data-secondary-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM Role for Replication
resource "aws_iam_role" "replication" {
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

  tags = {
    Name = "s3-replication-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "replication" {
  provider = aws.primary
  name     = "s3-replication-policy-${var.environment_suffix}"
  role     = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["s3:GetReplicationConfiguration", "s3:ListBucket"]
        Effect   = "Allow"
        Resource = [aws_s3_bucket.primary.arn]
      },
      {
        Action   = ["s3:GetObjectVersionForReplication", "s3:GetObjectVersionAcl"]
        Effect   = "Allow"
        Resource = ["${aws_s3_bucket.primary.arn}/*"]
      },
      {
        Action   = ["s3:ReplicateObject", "s3:ReplicateDelete"]
        Effect   = "Allow"
        Resource = ["${aws_s3_bucket.secondary.arn}/*"]
      }
    ]
  })
}

# S3 Replication with RTC
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider = aws.primary
  role     = aws_iam_role.replication.arn
  bucket   = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all-${var.environment_suffix}"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"

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
    aws_s3_bucket_versioning.primary,
    aws_s3_bucket_versioning.secondary
  ]
}
