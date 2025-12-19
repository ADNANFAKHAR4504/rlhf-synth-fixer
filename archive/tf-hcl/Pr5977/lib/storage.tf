# S3 Bucket for Transaction Logs
resource "aws_s3_bucket" "transaction_logs" {
  bucket = "transaction-logs-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "transaction-logs-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_versioning" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555
    }
  }
}

# S3 Bucket for Customer Documents
resource "aws_s3_bucket" "customer_documents" {
  bucket = "customer-documents-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "customer-documents-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_versioning" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "customer_documents" {
  bucket = aws_s3_bucket.customer_documents.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# Cross-Region Replication for Production
resource "aws_s3_bucket" "customer_documents_replica" {
  count    = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  provider = aws.replication
  bucket   = "customer-documents-replica-${var.environment}-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "customer-documents-replica-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_versioning" "customer_documents_replica" {
  count    = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  provider = aws.replication
  bucket   = aws_s3_bucket.customer_documents_replica[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_iam_role" "replication" {
  count = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  name  = "s3-replication-role-${var.environment}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "replication" {
  count = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  name  = "s3-replication-policy-${var.environment}-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.customer_documents.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${aws_s3_bucket.customer_documents.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = "${aws_s3_bucket.customer_documents_replica[0].arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  count      = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0
  role       = aws_iam_role.replication[0].name
  policy_arn = aws_iam_policy.replication[0].arn
}

resource "aws_s3_bucket_replication_configuration" "customer_documents" {
  count = var.environment == "prod" && var.enable_cross_region_replication ? 1 : 0

  depends_on = [aws_s3_bucket_versioning.customer_documents]

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.customer_documents.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.customer_documents_replica[0].arn
      storage_class = "STANDARD"
    }
  }
}