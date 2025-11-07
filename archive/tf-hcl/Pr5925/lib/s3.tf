# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  bucket = "payment-transactions-primary-${var.environment_suffix}"

  tags = {
    Name = "payment-transactions-primary-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# DR S3 Bucket
resource "aws_s3_bucket" "dr" {
  provider = aws.dr
  bucket   = "payment-transactions-dr-${var.environment_suffix}"

  tags = {
    Name = "payment-transactions-dr-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Cross-Region Replication
resource "aws_s3_bucket_replication_configuration" "primary_to_dr" {
  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.dr.arn
      storage_class = "STANDARD"
    }
  }
}