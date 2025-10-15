# provider.tf

```
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"
}
```

### main.tf

```
# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}

# ============================================
# Locals
# ============================================
locals {
  account_id = data.aws_caller_identity.current.account_id
  
  common_tags = {
    Project = "Media CMS"
    Owner   = "Media Team"
  }
  
  cors_configuration = {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://example.com"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ============================================
# Random Suffix for Unique Bucket Names
# ============================================
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# ============================================
# CloudFront Origin Access Identity
# ============================================
resource "aws_cloudfront_origin_access_identity" "media_oai" {
  comment = "OAI for media assets production bucket"
}

# ============================================
# S3 Bucket - Centralized Logs
# ============================================
resource "aws_s3_bucket" "logs" {
  bucket = "media-assets-logs-${random_string.bucket_suffix.result}"
  
  tags = merge(
    local.common_tags,
    {
      Environment = "Shared"
      Purpose     = "Centralized S3 Access Logs"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"
    filter {}

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ServerAccessLogsPolicy"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = local.account_id
          }
        }
      }
    ]
  })
}

# ============================================
# S3 Bucket - Development Environment
# ============================================
resource "aws_s3_bucket" "dev" {
  bucket = "media-assets-dev-${random_string.bucket_suffix.result}"
  
  tags = merge(
    local.common_tags,
    {
      Environment = "Development"
      Purpose     = "Development Media Assets Storage"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "dev" {
  bucket = aws_s3_bucket.dev.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "dev" {
  bucket = aws_s3_bucket.dev.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "dev" {
  bucket = aws_s3_bucket.dev.id

  cors_rule {
    allowed_headers = local.cors_configuration.allowed_headers
    allowed_methods = local.cors_configuration.allowed_methods
    allowed_origins = local.cors_configuration.allowed_origins
    expose_headers  = local.cors_configuration.expose_headers
    max_age_seconds = local.cors_configuration.max_age_seconds
  }
}

resource "aws_s3_bucket_logging" "dev" {
  bucket = aws_s3_bucket.dev.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "dev/"
}

resource "aws_s3_bucket_lifecycle_configuration" "dev" {
  bucket = aws_s3_bucket.dev.id

  rule {
    id     = "delete-old-dev-objects"
    status = "Enabled"
    filter {}

    expiration {
      days = 30
    }
  }
}

# ============================================
# S3 Bucket - Production Environment
# ============================================
resource "aws_s3_bucket" "prod" {
  bucket = "media-assets-prod-${random_string.bucket_suffix.result}"
  
  tags = merge(
    local.common_tags,
    {
      Environment = "Production"
      Purpose     = "Production Media Assets Storage"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "prod" {
  bucket = aws_s3_bucket.prod.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "prod" {
  bucket = aws_s3_bucket.prod.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "prod" {
  bucket = aws_s3_bucket.prod.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "prod" {
  bucket = aws_s3_bucket.prod.id

  cors_rule {
    allowed_headers = local.cors_configuration.allowed_headers
    allowed_methods = local.cors_configuration.allowed_methods
    allowed_origins = local.cors_configuration.allowed_origins
    expose_headers  = local.cors_configuration.expose_headers
    max_age_seconds = local.cors_configuration.max_age_seconds
  }
}

resource "aws_s3_bucket_logging" "prod" {
  bucket = aws_s3_bucket.prod.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "prod/"
}

resource "aws_s3_bucket_lifecycle_configuration" "prod" {
  bucket = aws_s3_bucket.prod.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"
    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_policy" "prod" {
  bucket = aws_s3_bucket.prod.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAIAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.media_oai.iam_arn
        }
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.prod.arn}/*"
      },
      {
        Sid    = "AllowCloudFrontListBucket"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.media_oai.iam_arn
        }
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.prod.arn
      }
    ]
  })
}

# ============================================
# Outputs
# ============================================
output "dev_bucket_name" {
  description = "Name of the development S3 bucket"
  value       = aws_s3_bucket.dev.id
}

output "dev_bucket_arn" {
  description = "ARN of the development S3 bucket"
  value       = aws_s3_bucket.dev.arn
}

output "prod_bucket_name" {
  description = "Name of the production S3 bucket"
  value       = aws_s3_bucket.prod.id
}

output "prod_bucket_arn" {
  description = "ARN of the production S3 bucket"
  value       = aws_s3_bucket.prod.arn
}

output "logs_bucket_name" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = aws_s3_bucket.logs.arn
}

output "prod_bucket_domain_name" {
  description = "Domain name of the production bucket for CloudFront origin"
  value       = aws_s3_bucket.prod.bucket_regional_domain_name
}

output "dev_bucket_domain_name" {
  description = "Domain name of the development bucket"
  value       = aws_s3_bucket.dev.bucket_regional_domain_name
}

output "cloudfront_oai_id" {
  description = "ID of the CloudFront Origin Access Identity"
  value       = aws_cloudfront_origin_access_identity.media_oai.id
}

output "cloudfront_oai_arn" {
  description = "ARN of the CloudFront Origin Access Identity"
  value       = aws_cloudfront_origin_access_identity.media_oai.iam_arn
}
```