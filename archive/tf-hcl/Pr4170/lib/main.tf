#################
# main code
#################
# Variables
variable "aws_region" {
  description = "The AWS region where resources will be created"
  type        = string
  default     = "us-west-2"
}

# Data Sources
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Locals
locals {
  account_id = data.aws_caller_identity.current.account_id
  
  common_tags = {
    Environment = "production"
    Project     = "media-launch"
  }
}

# Random String for bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  lower   = true
  upper   = false
  numeric = true
  special = false
}

# S3 Bucket
resource "aws_s3_bucket" "media_assets" {
  bucket = "media-assets-${random_string.bucket_suffix.result}"
  
  tags = local.common_tags
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side Encryption Configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Static Website Configuration
resource "aws_s3_bucket_website_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  index_document {
    suffix = "index.html"
  }
  
  error_document {
    key = "error.html"
  }
}

# CORS Configuration
resource "aws_s3_bucket_cors_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  cors_rule {
    allowed_headers = ["Content-Type", "Authorization"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

# Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    filter {}  # Empty filter applies to all objects in the bucket
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# Public Access Block Configuration
resource "aws_s3_bucket_public_access_block" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket Policy for Public Read Access
resource "aws_s3_bucket_policy" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.media_assets.arn}/*"
      }
    ]
  })
  
  depends_on = [aws_s3_bucket_public_access_block.media_assets]
}

# Outputs
output "bucket_name" {
  description = "The name of the S3 bucket hosting the static website"
  value       = aws_s3_bucket.media_assets.id
}

output "website_endpoint" {
  description = "The website endpoint URL for the S3 bucket"
  value       = aws_s3_bucket_website_configuration.media_assets.website_endpoint
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.media_assets.arn
}