### Reasoning Trace
---

Let me break down what the user is asking for:

1. Two files: `provider.tf` and `tap_stack.tf`
2. S3 bucket with strong security settings
3. Two IAM roles with least privilege
4. No external modules
5. Production-ready code that passes terraform validate
6. Both files must use `var.aws_region` variable (declared in both)

Let me structure this:

provider.tf:
- terraform block with required versions
- aws_region variable
- aws provider with default tags

tap_stack.tf:
- Variables for aws_region, bucket_name, owner, security_level, vpc_id
- Locals for tags and computed ARNs
- S3 bucket with encryption, versioning, BPA
- Bucket policy with TLS and encryption requirements
- Two IAM roles (analytics reader, uploader) with trust policies
- IAM policies with least privilege
- Policy attachments
- Instance profiles
- Outputs

Let me make sure I follow all requirements:
- AES-256 encryption (SSE-S3)
- Versioning enabled
- Block public access
- Bucket policy denies non-TLS and unencrypted uploads
- Two specific IAM roles with EC2 trust
- Analytics reader: s3:GetObject on analytics/* prefix
- Uploader: s3:PutObject on uploads/* prefix
- Instance profiles for both
- Proper conditions for TLS and encryption
- Tags on all resources
- Outputs for bucket and roles
### Answer 
---

```hcl
# provider.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.0"
    }
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment   = "Production"
      Owner         = "Security-Team"
      SecurityLevel = "High"
    }
  }
}
```

```hcl
# tap_stack.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

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
    actions   = ["s3:*"]
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
  name               = "analytics-reader-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role_policy.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "analytics_reader_policy" {
  name = "analytics-reader-policy"
  role = aws_iam_role.analytics_reader_role.id
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
  name = "analytics-reader-profile"
  role = aws_iam_role.analytics_reader_role.name
  tags = local.common_tags
}

# Uploader IAM Role
resource "aws_iam_role" "uploader_role" {
  name               = "uploader-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role_policy.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy" "uploader_policy" {
  name = "uploader-policy"
  role = aws_iam_role.uploader_role.id
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
  name = "uploader-profile"
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
```
