########################
# ...existing code...
########################
# Variables
########################
variable "aws_region" {
  description = "Primary AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS provider region"
  type        = string
  default     = "us-west-2"
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

variable "name_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "secure-env"
}

variable "bucket_name" {
  description = "Name of the S3 bucket (should include environment suffix)"
  type        = string
  default     = "secure-env-devs3-bucket"
}

variable "bucket_tags" {
  description = "Tags to apply to the S3 bucket"
  type        = map(string)
  default = {
    Project     = "secure-env"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

########################
# S3 Bucket (example, uses environment suffix and proper naming)
########################

resource "aws_s3_bucket" "this" {
  provider = aws.primary
  bucket   = "${var.name_prefix}-${var.environment}-s3-bucket"
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

resource "aws_s3_bucket_policy" "cloudtrail" {
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

output "bucket_name" {
  value = aws_s3_bucket.this.bucket
}

output "bucket_tags" {
  value = aws_s3_bucket.this.tags
}