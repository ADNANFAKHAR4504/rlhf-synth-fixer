# main.tf

```hcl
# ===========================
# Data Sources
# ===========================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ===========================
# Variables
# ===========================
variable "project_name" {
  description = "Project name for tagging and naming resources"
  type        = string
  default     = "static-assets"
}

variable "environment" {
  description = "Environment name (e.g., prod, staging, dev)"
  type        = string
  default     = "production"
}

# ===========================
# Locals
# ===========================

locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
  }
  
  bucket_prefix = "${var.project_name}-${var.environment}"
  account_id    = data.aws_caller_identity.current.account_id
  region        = data.aws_region.current.id
}

# ===========================
# Random String for Unique Naming
# ===========================

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
  numeric = true
}

# ===========================
# Logging Bucket
# ===========================

resource "aws_s3_bucket" "logging" {
  bucket = "${local.bucket_prefix}-logs-${random_string.bucket_suffix.result}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "logging" {
  bucket = aws_s3_bucket.logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = 90
    }
  }
}

# Grant log delivery permissions
resource "aws_s3_bucket_acl" "logging" {
  bucket     = aws_s3_bucket.logging.id
  acl        = "log-delivery-write"
  depends_on = [aws_s3_bucket_ownership_controls.logging]
}

resource "aws_s3_bucket_ownership_controls" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# ===========================
# Main Static Assets Bucket
# ===========================

resource "aws_s3_bucket" "static_assets" {
  bucket = "${local.bucket_prefix}-assets-${random_string.bucket_suffix.result}"
  tags   = local.common_tags
}

# ===========================
# Bucket Versioning
# ===========================

resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ===========================
# Bucket Encryption
# ===========================

resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ===========================
# Website Configuration
# ===========================

resource "aws_s3_bucket_website_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# ===========================
# Public Access Block Configuration
# ===========================

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# ===========================
# Bucket Policy for Public Access to 'public/' Prefix
# ===========================

resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PublicReadForPublicFolder"
        Effect = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.static_assets.arn}/public/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.static_assets]
}

# ===========================
# CORS Configuration
# ===========================

resource "aws_s3_bucket_cors_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  cors_rule {
    allowed_origins = ["https://example.com"]
    allowed_methods = ["GET"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# ===========================
# Lifecycle Configuration
# ===========================

resource "aws_s3_bucket_lifecycle_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }

  rule {
    id     = "cleanup-multipart"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# ===========================
# Logging Configuration
# ===========================

resource "aws_s3_bucket_logging" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  target_bucket = aws_s3_bucket.logging.id
  target_prefix = "access-logs/"
}

# ===========================
# IAM Role for EC2 Instances
# ===========================

resource "aws_iam_role" "ec2_s3_upload" {
  name = "${local.bucket_prefix}-ec2-s3-upload-role-${random_string.bucket_suffix.result}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

# ===========================
# IAM Policy for S3 Upload Access
# ===========================

resource "aws_iam_policy" "s3_upload" {
  name        = "${local.bucket_prefix}-s3-upload-policy-${random_string.bucket_suffix.result}"
  description = "Policy to allow EC2 instances to upload objects to the static assets bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning"
        ]
        Resource = aws_s3_bucket.static_assets.arn
      },
      {
        Sid    = "UploadObjects"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion",
          "s3:DeleteObjectVersion"
        ]
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
      }
    ]
  })

  tags = local.common_tags
}

# ===========================
# Attach Policy to Role
# ===========================

resource "aws_iam_role_policy_attachment" "ec2_s3_upload" {
  role       = aws_iam_role.ec2_s3_upload.name
  policy_arn = aws_iam_policy.s3_upload.arn
}

# ===========================
# Instance Profile for EC2
# ===========================

resource "aws_iam_instance_profile" "ec2_s3_upload" {
  name = "${local.bucket_prefix}-ec2-instance-profile-${random_string.bucket_suffix.result}"
  role = aws_iam_role.ec2_s3_upload.name

  tags = local.common_tags
}

# ===========================
# Outputs
# ===========================

output "bucket_name" {
  description = "Name of the static assets S3 bucket"
  value       = aws_s3_bucket.static_assets.id
}

output "bucket_website_endpoint" {
  description = "Website endpoint URL for the static assets bucket"
  value       = aws_s3_bucket_website_configuration.static_assets.website_endpoint
}

output "ec2_instance_profile_name" {
  description = "Name of the IAM instance profile for EC2 instances"
  value       = aws_iam_instance_profile.ec2_s3_upload.name
}

output "logging_bucket_name" {
  description = "Name of the logging bucket"
  value       = aws_s3_bucket.logging.id
}
```