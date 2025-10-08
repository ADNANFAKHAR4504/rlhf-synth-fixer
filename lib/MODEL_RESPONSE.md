# S3 Static Website Hosting - Terraform Implementation

## provider.tf

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = "us-west-2"
}
```

## main.tf

```hcl

# Random suffix for bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Resource
resource "aws_s3_bucket" "media_assets" {
  bucket = "media-assets-${random_string.bucket_suffix.result}"

  tags = {
    Environment = "production"
    Project     = "media-launch"
  }
}

# Bucket Versioning Configuration
resource "aws_s3_bucket_versioning" "media_assets_versioning" {
  bucket = aws_s3_bucket.media_assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Static Website Hosting Configuration
resource "aws_s3_bucket_website_configuration" "media_assets_website" {
  bucket = aws_s3_bucket.media_assets.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# Server-side Encryption Configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "media_assets_encryption" {
  bucket = aws_s3_bucket.media_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle Rule Configuration
resource "aws_s3_bucket_lifecycle_configuration" "media_assets_lifecycle" {
  bucket = aws_s3_bucket.media_assets.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# CORS Configuration
resource "aws_s3_bucket_cors_configuration" "media_assets_cors" {
  bucket = aws_s3_bucket.media_assets.id

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    allowed_headers = ["Content-Type", "Authorization"]
    max_age_seconds = 3600
  }
}

# Bucket Policy for Public Read Access
resource "aws_s3_bucket_policy" "media_assets_policy" {
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
}

# Public Access Block Configuration (Allow Public Access)
resource "aws_s3_bucket_public_access_block" "media_assets_pab" {
  bucket = aws_s3_bucket.media_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Outputs
output "bucket_name" {
  description = "Name of the S3 bucket for pipeline integration"
  value       = aws_s3_bucket.media_assets.id
}

output "website_endpoint_url" {
  description = "Website endpoint URL"
  value       = aws_s3_bucket_website_configuration.media_assets_website.website_endpoint
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.media_assets.arn
}
```

output "website_endpoint_url" {
description = "Website endpoint URL for DNS configuration"
value = aws_s3_bucket_website_configuration.media_assets_website.website_endpoint
}

output "bucket_arn" {
description = "ARN of the S3 bucket for cross-service references"
value = aws_s3_bucket.media_assets.arn
}
