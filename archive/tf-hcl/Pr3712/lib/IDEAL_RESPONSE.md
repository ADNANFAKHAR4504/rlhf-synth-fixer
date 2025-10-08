# Ideal S3 Static Website Hosting Solution

This is the correct implementation for the S3 static website hosting requirements specified in PROMPT.md.

## main.tf

```hcl
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
```

## provider.tf

```hcl
terraform {
  required_version = ">= 1.2.0"

  backend "s3" {
    # Backend configuration will be provided via -backend-config flags
    # This ensures the backend block exists to avoid warnings
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "random" {}
```

## Key Features Implemented

### ✅ S3 Static Website Hosting

- **Unique bucket naming** using random suffix to prevent conflicts
- **Static website configuration** with index.html and error.html
- **Public read access** policy for website assets
- **CORS configuration** for cross-origin requests

### ✅ Data Management

- **Versioning enabled** for asset version control
- **Lifecycle rules** for cost optimization (transition to Standard-IA after 30 days)
- **Server-side encryption** using AES256 for data protection

### ✅ Security & Access Control

- **Public access block configuration** properly configured for website hosting
- **Bucket policy** allows public read access to objects only
- **Proper resource dependencies** to ensure correct deployment order

### ✅ Operational Excellence

- **Comprehensive outputs** for integration with other systems
- **Detailed inline comments** for maintainability
- **Resource tagging** for cost tracking and organization
- **Modular configuration** with variables for flexibility

## Implementation Notes

### Bucket Naming Strategy

- Uses `media-assets-` prefix with 8-character random suffix
- Ensures global uniqueness while maintaining readable naming
- Random suffix prevents deployment conflicts across environments

### Website Configuration

- **Index document**: `index.html` for main page
- **Error document**: `error.html` for 404 errors
- **CORS enabled** for modern web application compatibility

### Security Considerations

- **Public read access** limited to GetObject only
- **No public write access** - secure by default
- **Encryption at rest** using AWS managed keys
- **Versioning enabled** for data protection and rollback capability

### Cost Optimization

- **Lifecycle rule** transitions objects to Standard-IA after 30 days
- **On-demand provisioning** without upfront costs
- **Efficient resource allocation** without over-provisioning

This implementation correctly addresses all requirements from PROMPT.md for S3 static website hosting while following Terraform and AWS best practices.
