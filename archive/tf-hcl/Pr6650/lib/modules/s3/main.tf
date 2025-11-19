terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary, aws.secondary]
    }
  }
}

# IAM Role for S3 Replication
resource "aws_iam_role" "replication" {
  provider = aws.primary

  name_prefix = "s3-replication-${var.environment_suffix}"

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
    Name = "role-s3-replication-${var.environment_suffix}"
  }
}

# IAM Policy for S3 Replication
resource "aws_iam_role_policy" "replication" {
  provider = aws.primary

  name_prefix = "s3-replication-policy"
  role        = aws_iam_role.replication.id

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
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = var.primary_kms_key_arn
        Condition = {
          StringLike = {
            "kms:ViaService" = "s3.*.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt"
        ]
        Resource = var.secondary_kms_key_arn
        Condition = {
          StringLike = {
            "kms:ViaService" = "s3.*.amazonaws.com"
          }
        }
      }
    ]
  })
}

# Primary S3 Bucket
resource "aws_s3_bucket" "primary" {
  provider = aws.primary

  bucket = "dr-primary-${var.environment_suffix}"

  tags = {
    Name    = "s3-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}

# Primary Bucket Versioning
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary

  bucket = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Primary Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.primary

  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.primary_kms_key_arn
    }
    bucket_key_enabled = true
  }
}

# Secondary S3 Bucket
resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary

  bucket = "dr-secondary-${var.environment_suffix}"

  tags = {
    Name    = "s3-secondary-${var.environment_suffix}"
    DR-Role = "secondary"
  }
}

# Secondary Bucket Versioning
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary

  bucket = aws_s3_bucket.secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Secondary Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.secondary

  bucket = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.secondary_kms_key_arn
    }
    bucket_key_enabled = true
  }
}

# S3 Replication Configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider = aws.primary

  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = var.secondary_kms_key_arn
      }
    }
  }
}

# Bucket Public Access Block - Primary
resource "aws_s3_bucket_public_access_block" "primary" {
  provider = aws.primary

  bucket = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket Public Access Block - Secondary
resource "aws_s3_bucket_public_access_block" "secondary" {
  provider = aws.secondary

  bucket = aws_s3_bucket.secondary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle Policy for Primary Bucket
resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  provider = aws.primary

  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "transition-old-versions"
    status = "Enabled"

    # Apply to all objects
    filter {}

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}
