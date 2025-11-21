variable "bucket_names" {
  description = "List of bucket names (without suffix)"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "enable_versioning" {
  description = "Enable versioning"
  type        = bool
  default     = true
}

variable "force_destroy" {
  description = "Force destroy bucket"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

locals {
  buckets = { for name in var.bucket_names : name => {
    bucket_name = "${var.project_name}-${var.environment}-${name}-${var.environment_suffix}"
  } }
}

resource "aws_s3_bucket" "buckets" {
  for_each = local.buckets

  bucket        = each.value.bucket_name
  force_destroy = var.force_destroy

  tags = merge(var.tags, {
    Name = each.value.bucket_name
    Type = each.key
  })
}

resource "aws_s3_bucket_versioning" "buckets" {
  for_each = var.enable_versioning ? local.buckets : {}

  bucket = aws_s3_bucket.buckets[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "buckets" {
  for_each = local.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "buckets" {
  for_each = local.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "bucket_ids" {
  description = "S3 bucket IDs"
  value       = [for k, v in aws_s3_bucket.buckets : v.id]
}

output "bucket_arns" {
  description = "S3 bucket ARNs"
  value       = [for k, v in aws_s3_bucket.buckets : v.arn]
}

output "bucket_names" {
  description = "S3 bucket names"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.bucket }
}
