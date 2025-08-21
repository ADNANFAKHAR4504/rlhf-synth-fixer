# S3 bucket with private access and KMS encryption
resource "aws_s3_bucket" "main" {
  bucket = "${var.environment}${var.service}${var.resource}"
  force_destroy = true
  tags   = var.tags
}

# Block all public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for data protection
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configure default KMS encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

module "dir" {
  source  = "hashicorp/dir/template"
  version = "1.0.2"
  base_dir = "${path.module}/staticfiles_turing"
}

# Upload static files to s3 bucket
resource "aws_s3_object" "crc_objects" {
    for_each = module.dir.files
    bucket = aws_s3_bucket.main.bucket
    key = each.key
    content_type = each.value.content_type
    source = each.value.source_path
    etag = each.value.digests.md5
}

# 1. Create the Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "turingblacree_oai" {
  comment = "OAI for Turing CloudFront distribution"
}


# Bucket policy for explicit access control
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          "${aws_s3_bucket.main.arn}",
          "${aws_s3_bucket.main.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.turingblacree_oai.id}"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.main.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.main]
}

#-------------------------------------------------------------


# Separate bucket for access logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.environment}${var.service}accesslogs"
  force_destroy = true
  tags   = var.tags
}

# 2) Enable ACLs for this bucket (CloudFront logging requires ACLs)
resource "aws_s3_bucket_ownership_controls" "cf_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# 3) Grant the CloudFront log delivery group write + read-acp via canned ACL
resource "aws_s3_bucket_acl" "cf_logs" {
  bucket     = aws_s3_bucket.access_logs.bucket
  acl        = "log-delivery-write"

  depends_on = [aws_s3_bucket_ownership_controls.cf_logs]
}

# Enable access logging
resource "aws_s3_bucket_logging" "main" {
  bucket = aws_s3_bucket.main.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "access-logs/"
}

# Block public access for access logs bucket
resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}


# Lifecycle configuration for access logs
resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"

    # Match all objects in the bucket
    filter {}

    expiration {
      days = 90
    }
  }
}


data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "AllowAccountPrincipalsBucketAcl"
        Effect   = "Allow"
        Principal = { AWS = "*" }
        Action   = ["s3:GetBucketAcl", "s3:PutBucketAcl"]
        Resource = aws_s3_bucket.access_logs.arn
        Condition = {
          StringEquals = {
            "aws:PrincipalAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid       = "AllowCloudFrontWriteLogs"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = ["s3:PutObject"]
        Resource  = "${aws_s3_bucket.access_logs.arn}/*"
        Condition = {
          StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" }
        }
      }
    ]
  })
}
