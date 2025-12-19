# KMS key for S3 bucket encryption
resource "aws_kms_key" "logging" {
  description             = "KMS key for logging S3 bucket encryption"
  deletion_window_in_days = 7

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow VPC Flow Logs"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-logging-kms"
  }
}

resource "aws_kms_alias" "logging" {
  name          = "alias/${var.project_name}-${var.environment}-logging"
  target_key_id = aws_kms_key.logging.key_id
}

# Central logging S3 bucket
resource "aws_s3_bucket" "central_logging" {
  bucket = "${var.project_name}-${var.environment}-central-logging-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.project_name}-${var.environment}-central-logging"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

data "aws_caller_identity" "current" {}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "central_logging" {
  bucket = aws_s3_bucket.central_logging.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logging.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "central_logging" {
  bucket = aws_s3_bucket.central_logging.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "central_logging" {
  bucket = aws_s3_bucket.central_logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "central_logging" {
  bucket = aws_s3_bucket.central_logging.id

  rule {
    id     = "log_retention"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# S3 bucket policy for VPC Flow Logs
resource "aws_s3_bucket_policy" "central_logging" {
  bucket = aws_s3_bucket.central_logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.central_logging.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.central_logging.arn
      },
      {
        Sid    = "VPCFlowLogsDeliveryRolePolicy"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.central_logging.arn,
          "${aws_s3_bucket.central_logging.arn}/*"
        ]
      }
    ]
  })
}

# CloudTrail for API logging
resource "aws_cloudtrail" "main" {
  name           = "${var.project_name}-${var.environment}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.central_logging.bucket
  s3_key_prefix  = "cloudtrail-logs"

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  depends_on = [aws_s3_bucket_policy.central_logging]

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudtrail"
  }
}