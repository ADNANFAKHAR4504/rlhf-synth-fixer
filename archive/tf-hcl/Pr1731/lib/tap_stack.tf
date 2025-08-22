# Add random suffix for unique resource names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}
variable "name_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "secure-env"
}

variable "environment" {
  description = "Environment suffix for resource names (must start with a letter, use only letters and numbers)"
  type        = string
  default     = "dev"
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9]*$", var.environment))
    error_message = "Environment must start with a letter and contain only letters and numbers."
  }
}

########################
# ...existing code...
########################
# Variables as shown above
########################

# Buckets for encrypted data
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "${var.name_prefix}-${var.environment}-primary-s3-bucket-${random_id.bucket_suffix.hex}"
  tags = {
    Project     = "secure-env"
    Environment = var.environment
    ManagedBy   = "terraform"
    Region      = var.aws_region
  }
}

resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "${var.name_prefix}-${var.environment}-secondary-s3-bucket-${random_id.bucket_suffix.hex}"
  tags = {
    Project     = "secure-env"
    Environment = var.environment
    ManagedBy   = "terraform"
    Region      = var.secondary_region
  }
}

# If you need a CloudTrail bucket, keep this:
resource "aws_s3_bucket" "this" {
  provider = aws.primary
  bucket   = "${var.name_prefix}-${var.environment}-s3-bucket-${random_id.bucket_suffix.hex}"
  tags = {
    Project     = "secure-env"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  provider                = aws.primary
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "this" {
  provider = aws.primary
  bucket   = aws_s3_bucket.this.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_1" {
  bucket = aws_s3_bucket.this.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "AWSCloudTrailAclCheck20150319",
        Effect   = "Allow",
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        },
        Action   = "s3:GetBucketAcl",
        Resource = "arn:aws:s3:::${aws_s3_bucket.this.id}"
      },
      {
        Sid      = "AWSCloudTrailWrite20150319",
        Effect   = "Allow",
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        },
        Action   = "s3:PutObject",
        Resource = "arn:aws:s3:::${aws_s3_bucket.this.id}/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

########################
# Outputs
########################

output "primary_bucket_name" {
  value = aws_s3_bucket.primary.bucket
}

output "secondary_bucket_name" {
  value = aws_s3_bucket.secondary.bucket
}

output "bucket_name" {
  value = aws_s3_bucket.this.bucket
}

output "bucket_tags" {
  value = aws_s3_bucket.this.tags
}
