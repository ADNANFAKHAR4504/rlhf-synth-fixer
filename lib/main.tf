########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "bucket_region" {
  description = "Region for the S3 bucket"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "dev-test-bucket"
}

variable "bucket_tags" {
  description = "Tags to apply to the S3 bucket"
  type        = map(string)
  default = {
    Project     = "ExampleProject"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

########################
# S3 Bucket
########################

resource "aws_s3_bucket" "this" {
  provider = aws.bucket
  bucket   = var.bucket_name
  tags     = var.bucket_tags
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "this" {
  provider                 = aws.bucket
  bucket                   = aws_s3_bucket.this.id
  block_public_acls        = true
  ignore_public_acls       = true
  block_public_policy      = true
  restrict_public_buckets  = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "this" {
  provider = aws.bucket
  bucket   = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

########################
# Outputs
########################

output "bucket_name" {
  value = aws_s3_bucket.this.bucket
}

output "bucket_region" {
  value = var.bucket_region
}

output "bucket_tags" {
  value = aws_s3_bucket.this.tags
}
