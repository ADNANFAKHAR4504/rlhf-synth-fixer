variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "enable_replication" {
  description = "Enable S3 replication"
  type        = bool
}

variable "replication_destinations" {
  description = "Replication destination regions"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
}

# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-${var.region}-data-log-${var.environment}"

  tags = var.common_tags
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "archive-old-objects"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# IAM Role for Replication
resource "aws_iam_role" "replication" {
  count = var.enable_replication ? 1 : 0

  name = "${var.project_name}-${var.region}-s3-replication-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# IAM Policy for Replication
resource "aws_iam_role_policy" "replication" {
  count = var.enable_replication ? 1 : 0

  role = aws_iam_role.replication[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          for region in var.replication_destinations :
          "arn:aws:s3:::${var.project_name}-${region}-data-*/*"
        ]
      }
    ]
  })
}

# S3 Bucket Replication Configuration
resource "aws_s3_bucket_replication_configuration" "main" {
  count = var.enable_replication && length(var.replication_destinations) > 0 ? 1 : 0

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.main.id

  dynamic "rule" {
    for_each = var.replication_destinations
    content {
      id     = "replicate-to-${rule.value}"
      status = "Enabled"

      filter {}

      destination {
        bucket        = "arn:aws:s3:::${var.project_name}-${rule.value}-data-staging"
        storage_class = "STANDARD_IA"
      }

      delete_marker_replication {
        status = "Enabled"
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}

# Outputs
output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "bucket_region" {
  description = "S3 bucket region"
  value       = aws_s3_bucket.main.region
}

output "bucket_hosted_zone_id" {
  description = "S3 bucket hosted zone ID"
  value       = aws_s3_bucket.main.hosted_zone_id
}

output "bucket_tags" {
  description = "S3 bucket tags"
  value       = aws_s3_bucket.main.tags_all
}

output "versioning_configuration" {
  description = "S3 bucket versioning configuration"
  value = {
    status = aws_s3_bucket_versioning.main.versioning_configuration[0].status
  }
}

output "encryption_configuration" {
  description = "S3 bucket server-side encryption configuration"
  value = {
    sse_algorithm = tolist(aws_s3_bucket_server_side_encryption_configuration.main.rule)[0].apply_server_side_encryption_by_default[0].sse_algorithm
  }
}

output "replication_enabled" {
  description = "Whether S3 bucket replication is enabled"
  value       = var.enable_replication
}

output "replication_destinations" {
  description = "S3 bucket replication destinations"
  value       = var.replication_destinations
}

output "replication_role_arn" {
  description = "ARN of the IAM role used for S3 replication"
  value       = var.enable_replication ? aws_iam_role.replication[0].arn : null
}

output "replication_role_name" {
  description = "Name of the IAM role used for S3 replication"
  value       = var.enable_replication ? aws_iam_role.replication[0].name : null
}

output "replication_configuration_status" {
  description = "S3 bucket replication configuration status"
  value = var.enable_replication && length(var.replication_destinations) > 0 ? {
    enabled           = true
    destination_count = length(var.replication_destinations)
    destinations      = var.replication_destinations
    } : {
    enabled           = false
    destination_count = 0
    destinations      = []
  }
}

output "lifecycle_configuration" {
  description = "S3 bucket lifecycle configuration"
  value = {
    lifecycle_rules = aws_s3_bucket_lifecycle_configuration.main.rule[*]
  }
}

output "public_access_block" {
  description = "S3 bucket public access block configuration"
  value = {
    block_public_acls       = aws_s3_bucket_public_access_block.main.block_public_acls
    block_public_policy     = aws_s3_bucket_public_access_block.main.block_public_policy
    ignore_public_acls      = aws_s3_bucket_public_access_block.main.ignore_public_acls
    restrict_public_buckets = aws_s3_bucket_public_access_block.main.restrict_public_buckets
  }
}
