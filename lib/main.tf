# ============================================================================# ============================================================================

# Variables# Variables

# ============================================================================# ============================================================================

variable "aws_region" {variable "aws_region" {

  description = "AWS region for resources"  description = "AWS region for resources"

  type        = string  type        = string

  default     = "us-west-2"  default     = "us-west-2"

}}



# ============================================================================# ============================================================================

# Random String for Unique Bucket Naming# Random String for Unique Bucket Naming

# ============================================================================# ============================================================================

resource "random_string" "bucket_suffix" {resource "random_string" "bucket_suffix" {

  length  = 8  length  = 8

  special = false  special = false

  upper   = false  upper   = false

}}



# ============================================================================# ============================================================================

# S3 Bucket for Static Website Hosting# S3 Bucket for Static Website Hosting

# ============================================================================# ============================================================================

resource "aws_s3_bucket" "media_assets" {resource "aws_s3_bucket" "media_assets" {

  bucket = "media-assets-${random_string.bucket_suffix.result}"  bucket = "media-assets-${random_string.bucket_suffix.result}"



  tags = {  tags = {

    Environment = "production"    Environment = "production"

    Project     = "media-launch"    Project     = "media-launch"

  }  }

}}



# ============================================================================# ============================================================================

# S3 Bucket Versioning Configuration# S3 Bucket Versioning Configuration

# ============================================================================# ============================================================================

resource "aws_s3_bucket_versioning" "media_assets_versioning" {resource "aws_s3_bucket_versioning" "media_assets_versioning" {

  bucket = aws_s3_bucket.media_assets.id  bucket = aws_s3_bucket.media_assets.id

  versioning_configuration {  versioning_configuration {

    status = "Enabled"    status = "Enabled"

  }  }

}}



# ============================================================================# ============================================================================

# S3 Bucket Server-Side Encryption Configuration# S3 Bucket Server-Side Encryption Configuration

# ============================================================================# ============================================================================

resource "aws_s3_bucket_server_side_encryption_configuration" "media_assets_encryption" {resource "aws_s3_bucket_server_side_encryption_configuration" "media_assets_encryption" {

  bucket = aws_s3_bucket.media_assets.id  bucket = aws_s3_bucket.media_assets.id



  rule {  rule {

    apply_server_side_encryption_by_default {    apply_server_side_encryption_by_default {

      sse_algorithm = "AES256"      sse_algorithm = "AES256"

    }    }

  }  }

}}



# ============================================================================# ============================================================================

# S3 Bucket Website Configuration# S3 Bucket Static Website Hosting Configuration

# ============================================================================# ============================================================================

resource "aws_s3_bucket_website_configuration" "media_assets_website" {resource "aws_s3_bucket_website_configuration" "media_assets_website" {

  bucket = aws_s3_bucket.media_assets.id  bucket = aws_s3_bucket.media_assets.id



  index_document {  index_document {

    suffix = "index.html"    suffix = "index.html"

  }  }



  error_document {  error_document {

    key = "error.html"    key = "error.html"

  }  }

}}



# ============================================================================# ============================================================================

# S3 Bucket Public Access Block Configuration# S3 Bucket Public Access Block (Allow public read access)

# ============================================================================# ============================================================================

resource "aws_s3_bucket_public_access_block" "media_assets_pab" {resource "aws_s3_bucket_public_access_block" "media_assets_pab" {

  bucket = aws_s3_bucket.media_assets.id  bucket = aws_s3_bucket.media_assets.id



  block_public_acls       = false  block_public_acls       = false

  block_public_policy     = false  block_public_policy     = false

  ignore_public_acls      = false  ignore_public_acls      = false

  restrict_public_buckets = false  restrict_public_buckets = false

}}



# ============================================================================# ============================================================================

# S3 Bucket Policy for Public Read Access# S3 Bucket Policy for Public Read Access

# ============================================================================# ============================================================================

resource "aws_s3_bucket_policy" "media_assets_policy" {resource "aws_s3_bucket_policy" "media_assets_policy" {

  bucket = aws_s3_bucket.media_assets.id  bucket     = aws_s3_bucket.media_assets.id

  depends_on = [aws_s3_bucket_public_access_block.media_assets_pab]

  depends_on = [aws_s3_bucket_public_access_block.media_assets_pab]

  policy = jsonencode({

  policy = jsonencode({    Version = "2012-10-17"

    Version = "2012-10-17"    Statement = [

    Statement = [      {

      {        Sid       = "PublicReadGetObject"

        Sid       = "PublicReadGetObject"        Effect    = "Allow"

        Effect    = "Allow"        Principal = "*"

        Principal = "*"        Action    = "s3:GetObject"

        Action    = "s3:GetObject"        Resource  = "${aws_s3_bucket.media_assets.arn}/*"

        Resource  = "${aws_s3_bucket.media_assets.arn}/*"      }

      }    ]

    ]  })

  })}

}

# ============================================================================

# ============================================================================# S3 Bucket Lifecycle Configuration

# S3 Bucket Lifecycle Configuration# ============================================================================

# ============================================================================resource "aws_s3_bucket_lifecycle_configuration" "media_assets_lifecycle" {

resource "aws_s3_bucket_lifecycle_configuration" "media_assets_lifecycle" {  bucket = aws_s3_bucket.media_assets.id

  bucket = aws_s3_bucket.media_assets.id

  rule {

  rule {    id     = "transition_to_standard_ia"

    id     = "transition_to_standard_ia"    status = "Enabled"

    status = "Enabled"

    transition {

    transition {      days          = 30

      days          = 30      storage_class = "STANDARD_IA"

      storage_class = "STANDARD_IA"    }

    }

    filter {

    filter {      prefix = ""

      prefix = ""    }

    }  }

  }}

}

# ============================================================================

# ============================================================================# S3 Bucket CORS Configuration

# S3 Bucket CORS Configuration# ============================================================================

# ============================================================================resource "aws_s3_bucket_cors_configuration" "media_assets_cors" {

resource "aws_s3_bucket_cors_configuration" "media_assets_cors" {  bucket = aws_s3_bucket.media_assets.id

  bucket = aws_s3_bucket.media_assets.id

  cors_rule {

  cors_rule {    allowed_headers = ["Content-Type", "Authorization"]

    allowed_headers = ["Content-Type", "Authorization"]    allowed_methods = ["GET"]

    allowed_methods = ["GET"]    allowed_origins = ["*"]

    allowed_origins = ["*"]    max_age_seconds = 3600

    max_age_seconds = 3600  }

  }}

}

# ============================================================================

# ============================================================================# Outputs

# Outputs# ============================================================================

# ============================================================================output "bucket_name" {

output "bucket_name" {  description = "Name of the S3 bucket for pipeline integration"

  description = "Name of the S3 bucket for pipeline integration"  value       = aws_s3_bucket.media_assets.id

  value       = aws_s3_bucket.media_assets.id}

}

output "website_endpoint_url" {

output "website_endpoint_url" {  description = "Website endpoint URL for DNS configuration"

  description = "Website endpoint URL for DNS configuration"  value       = aws_s3_bucket_website_configuration.media_assets_website.website_endpoint

  value       = aws_s3_bucket_website_configuration.media_assets_website.website_endpoint}

}

#Empty Commit

output "bucket_arn" {output "bucket_arn" {

  description = "ARN of the S3 bucket for cross-service references"  description = "ARN of the S3 bucket for cross-service references"

  value       = aws_s3_bucket.media_assets.arn  value       = aws_s3_bucket.media_assets.arn

}}