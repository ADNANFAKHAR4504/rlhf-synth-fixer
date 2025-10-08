# ============================================================================
# Variables
# ============================================================================
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

# ============================================================================
# Random String for Unique Bucket Naming
# ============================================================================
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# ============================================================================
# S3 Bucket for Static Website Hosting
# ============================================================================
resource "aws_s3_bucket" "media_assets" {
  bucket = "media-assets-${random_string.bucket_suffix.result}"

  tags = {
    Environment = "production"
    Project     = "media-launch"
  }
}

# ============================================================================
# S3 Bucket Versioning Configuration
# ============================================================================
resource "aws_s3_bucket_versioning" "media_assets_versioning" {
  bucket = aws_s3_bucket.media_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

# ============================================================================
# S3 Bucket Server-Side Encryption Configuration
# ============================================================================
resource "aws_s3_bucket_server_side_encryption_configuration" "media_assets_encryption" {
  bucket = aws_s3_bucket.media_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ============================================================================
# S3 Bucket Static Website Hosting Configuration
# ============================================================================
resource "aws_s3_bucket_website_configuration" "media_assets_website" {
  bucket = aws_s3_bucket.media_assets.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# ============================================================================
# S3 Bucket Public Access Block
# ============================================================================
resource "aws_s3_bucket_public_access_block" "media_assets_pab" {
  bucket = aws_s3_bucket.media_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# ============================================================================
# S3 Bucket Policy for Public Read Access
# ============================================================================
resource "aws_s3_bucket_policy" "media_assets_policy" {
  bucket = aws_s3_bucket.media_assets.id

  depends_on = [aws_s3_bucket_public_access_block.media_assets_pab]

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

# ============================================================================
# S3 Bucket Lifecycle Configuration
# ============================================================================
resource "aws_s3_bucket_lifecycle_configuration" "media_assets_lifecycle" {
  bucket = aws_s3_bucket.media_assets.id

  rule {
    id     = "transition_to_standard_ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    filter {
      prefix = ""
    }
  }
}

# ============================================================================
# S3 Bucket CORS Configuration
# ============================================================================
resource "aws_s3_bucket_cors_configuration" "media_assets_cors" {
  bucket = aws_s3_bucket.media_assets.id

  cors_rule {
    allowed_headers = ["Content-Type", "Authorization"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

# ============================================================================
# Outputs
# ============================================================================
output "bucket_name" {
  description = "Name of the S3 bucket for pipeline integration"
  value       = aws_s3_bucket.media_assets.id
}

output "website_endpoint_url" {
  description = "Website endpoint URL for DNS configuration"
  value       = aws_s3_bucket_website_configuration.media_assets_website.website_endpoint
}

output "bucket_arn" {
  description = "ARN of the S3 bucket for cross-service references"
  value       = aws_s3_bucket.media_assets.arn
}
