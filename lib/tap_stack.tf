# tap_stack.tf
variable "bucket_name" {
  description = "Name of the secure S3 bucket"
  type        = string
  default     = "secure-tap-bucket"
}

variable "owner" {
  description = "Owner tag value"
  type        = string
  default     = "Security-Team"
}

variable "security_level" {
  description = "Security level tag value"
  type        = string
  default     = "High"
}

variable "vpc_id" {
  description = "VPC ID for compliance metadata"
  type        = string
  default     = "vpc-12345678"
}

locals {
  common_tags = {
    Environment   = "Production"
    Owner         = var.owner
    SecurityLevel = var.security_level
  }

  bucket_arn = aws_s3_bucket.secure_bucket.arn
}

# Random ID for unique resource naming
resource "random_id" "role_suffix" {
  byte_length = 4
}

# S3 Bucket with security hardening
resource "aws_s3_bucket" "secure_bucket" {
  bucket = var.bucket_name
  tags   = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket_encryption" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "secure_bucket_versioning" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "secure_bucket_pab" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy enforcing TLS and encryption requirements
resource "aws_s3_bucket_policy" "secure_bucket_policy" {
  bucket = aws_s3_bucket.secure_bucket.id
  policy = data.aws_iam_policy_document.secure_bucket_policy.json
}

data "aws_iam_policy_document" "secure_bucket_policy" {
  # Deny non-TLS access
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = ["${local.bucket_arn}/*", local.bucket_arn]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Deny unencrypted object uploads
  statement {
    sid    = "DenyUnencryptedUploads"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${local.bucket_arn}/*"]
    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["AES256"]
    }
  }

  # Deny disabling encryption
  statement {
    sid    = "DenyDisablingEncryption"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = [
      "s3:PutBucketEncryption",
      "s3:DeleteBucketEncryption"
    ]
    resources = [local.bucket_arn]
  }
}

# Analytics Reader IAM Role
resource "aws_iam_role" "analytics_reader_role" {
  name               = "analytics-reader-role-${random_id.role_suffix.hex}"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role_policy.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "analytics_reader_policy" {
  name   = "analytics-reader-policy"
  role   = aws_iam_role.analytics_reader_role.id
  policy = data.aws_iam_policy_document.analytics_reader_policy.json
}

data "aws_iam_policy_document" "analytics_reader_policy" {
  statement {
    sid    = "AnalyticsReadAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    resources = ["${local.bucket_arn}/analytics/*"]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["true"]
    }
  }
}

resource "aws_iam_instance_profile" "analytics_reader_profile" {
  name = "analytics-reader-profile-${random_id.role_suffix.hex}"
  role = aws_iam_role.analytics_reader_role.name
  tags = local.common_tags
}

# Uploader IAM Role
resource "aws_iam_role" "uploader_role" {
  name               = "uploader-role-${random_id.role_suffix.hex}"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role_policy.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "uploader_policy" {
  name   = "uploader-policy"
  role   = aws_iam_role.uploader_role.id
  policy = data.aws_iam_policy_document.uploader_policy.json
}

data "aws_iam_policy_document" "uploader_policy" {
  statement {
    sid    = "UploaderWriteAccess"
    effect = "Allow"
    actions = [
      "s3:PutObject"
    ]
    resources = ["${local.bucket_arn}/uploads/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["AES256"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["true"]
    }
  }
}

resource "aws_iam_instance_profile" "uploader_profile" {
  name = "uploader-profile-${random_id.role_suffix.hex}"
  role = aws_iam_role.uploader_role.name
  tags = local.common_tags
}

# Shared EC2 assume role policy
data "aws_iam_policy_document" "ec2_assume_role_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Outputs
output "bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.id
}

output "bucket_arn" {
  description = "ARN of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.arn
}

output "analytics_reader_role_arn" {
  description = "ARN of the analytics reader role"
  value       = aws_iam_role.analytics_reader_role.arn
}

output "uploader_role_arn" {
  description = "ARN of the uploader role"
  value       = aws_iam_role.uploader_role.arn
}

output "bucket_policy_json" {
  description = "S3 bucket policy JSON"
  value       = data.aws_iam_policy_document.secure_bucket_policy.json
}

output "analytics_reader_policy_json" {
  description = "Analytics reader policy JSON"
  value       = data.aws_iam_policy_document.analytics_reader_policy.json
}

output "uploader_policy_json" {
  description = "Uploader policy JSON"
  value       = data.aws_iam_policy_document.uploader_policy.json
}