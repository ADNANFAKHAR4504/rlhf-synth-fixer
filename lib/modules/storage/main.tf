# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid = "Enable IAM User Permissions",
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${var.account_id}:root"
        },
        Action = "kms:*",
        Resource = "*"
      },
      {
        Sid = "Allow CloudTrail to encrypt logs",
        Effect = "Allow",
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        },
        Action = "kms:GenerateDataKey*",
        Resource = "*",
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${var.account_id}:trail/${var.project_name}-trail"
          }
        }
      }
    ]
  })
}

data "aws_kms_alias" "main" {
  name = "alias/${var.project_name}-key"
}


# VPC S3 Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.private_route_table_ids

  tags = {
    Name        = "${var.project_name}-s3-endpoint"
    Project     = var.project_name
    Environment = var.environment
  }
}

# S3 Data Bucket
resource "aws_s3_bucket" "data" {
  bucket = "${lower(var.project_name)}-data-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-data-bucket"
    Type        = "Data"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "DenyIncorrectEncryptionHeader",
        Effect    = "Deny",
        Principal = "*",
        Action    = "s3:PutObject",
        Resource  = "${aws_s3_bucket.data.arn}/*",
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyUnEncryptedObjectUploads",
        Effect    = "Deny",
        Principal = "*",
        Action    = "s3:PutObject",
        Resource  = "${aws_s3_bucket.data.arn}/*",
        Condition = {
          Null = {
            "s3:x-amz-server-side-encryption" = "true"
          }
        }
      }
    ]
  })
}


resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}
