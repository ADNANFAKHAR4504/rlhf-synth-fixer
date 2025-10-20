### Reasoning Trace

---

This is a comprehensive request for a Terraform infrastructure setup for a legal document storage system. I need to create a complete solution that includes:

1. S3 buckets with versioning, Object Lock, encryption, and lifecycle policies
2. IAM roles with appropriate permissions
3. CloudTrail for audit logging
4. CloudWatch alarms and monitoring
5. Lambda functions for compliance checks and monthly reports
6. Various optional features like S3 Inventory, EventBridge rules, SNS topics, and CloudWatch dashboards

Let me break this down into separate Terraform files as requested:

1. `versions.tf` - Provider and version configurations
2. `variables.tf` - All configurable variables
3. `s3-primary.tf` - Primary document storage bucket
4. `s3-audit.tf` - Audit logging bucket
5. `s3-reporting.tf` - Optional reporting bucket
6. `kms.tf` - KMS keys and policies
7. `iam.tf` - IAM roles and policies
8. `cloudtrail.tf` - CloudTrail configuration
9. `cloudwatch.tf` - CloudWatch alarms and metric filters
10. `lambda-compliance.tf` - Compliance check Lambda
11. `lambda-reporting.tf` - Monthly reporting Lambda
12. `eventbridge.tf` - EventBridge rules
13. `sns.tf` - SNS topics for alerts
14. `inventory.tf` - Optional S3 Inventory
15. `dashboard.tf` - Optional CloudWatch dashboard
16. `outputs.tf` - Output values
17. `README.md` - Comprehensive documentation

I'll make sure to include:

- Proper error handling
- Security best practices
- Clear comments
- Validation where appropriate
- Modular and reusable code
- Production-ready configurations

### Answer

---

I'll create a comprehensive Terraform configuration for your legal document storage system. This will be a production-ready solution with all the features you've requested.

## Project Structure

```
legal-document-storage/
├── versions.tf
├── variables.tf
├── s3-primary.tf
├── s3-audit.tf
├── s3-reporting.tf
├── kms.tf
├── iam.tf
├── cloudtrail.tf
├── cloudwatch.tf
├── lambda-compliance.tf
├── lambda-reporting.tf
├── eventbridge.tf
├── sns.tf
├── inventory.tf
├── dashboard.tf
├── outputs.tf
├── lambda/
│   ├── compliance-check.py
│   └── monthly-report.py
└── README.md
```

Let me create each file:

## versions.tf

```hcl
# Provider and version configurations
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  # Region will be set via AWS_DEFAULT_REGION or terraform variable
}
```

## variables.tf

```hcl
# Core configuration variables
variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
  default     = "legal-docs"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.project_name))
    error_message = "Project name must start with a letter and contain only lowercase letters, numbers, and hyphens"
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

# S3 bucket names
variable "primary_bucket_name" {
  description = "Name for the primary document storage bucket"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.primary_bucket_name))
    error_message = "Bucket name must be valid S3 bucket name"
  }
}

variable "audit_bucket_name" {
  description = "Name for the audit logs bucket"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$", var.audit_bucket_name))
    error_message = "Bucket name must be valid S3 bucket name"
  }
}

variable "reporting_bucket_name" {
  description = "Name for the reporting bucket (optional)"
  type        = string
  default     = ""
}

# Retention and lifecycle settings
variable "object_lock_retention_days" {
  description = "Default retention period for Object Lock in days"
  type        = number
  default     = 90

  validation {
    condition     = var.object_lock_retention_days >= 1 && var.object_lock_retention_days <= 36500
    error_message = "Retention days must be between 1 and 36500 (100 years)"
  }
}

variable "legal_retention_days" {
  description = "Legal retention period for old versions in days"
  type        = number
  default     = 2555  # 7 years

  validation {
    condition     = var.legal_retention_days >= 1 && var.legal_retention_days <= 36500
    error_message = "Legal retention days must be between 1 and 36500"
  }
}

variable "intelligent_tiering_days" {
  description = "Days before moving to Intelligent-Tiering"
  type        = number
  default     = 30
}

variable "glacier_transition_days" {
  description = "Days before moving old versions to Glacier"
  type        = number
  default     = 90
}

# Security settings
variable "enable_mfa_delete" {
  description = "Enable MFA Delete protection (requires root account setup)"
  type        = bool
  default     = false
}

variable "require_mfa_for_admin" {
  description = "Require MFA for admin role operations"
  type        = bool
  default     = true
}

variable "trusted_partner_accounts" {
  description = "List of AWS account IDs to grant cross-account access"
  type        = list(string)
  default     = []
}

variable "vpc_endpoint_ids" {
  description = "List of VPC endpoint IDs to restrict access"
  type        = list(string)
  default     = []
}

# Optional features
variable "enable_inventory" {
  description = "Enable S3 Inventory for detailed object reports"
  type        = bool
  default     = false
}

variable "enable_cloudwatch_logs" {
  description = "Enable CloudTrail integration with CloudWatch Logs"
  type        = bool
  default     = true
}

variable "enable_dashboard" {
  description = "Create CloudWatch dashboard for monitoring"
  type        = bool
  default     = true
}

variable "enable_reporting" {
  description = "Enable monthly reporting Lambda and bucket"
  type        = bool
  default     = true
}

variable "enable_ses_email" {
  description = "Enable SES email for monthly reports"
  type        = bool
  default     = false
}

variable "report_email_recipients" {
  description = "Email addresses to receive monthly reports"
  type        = list(string)
  default     = []
}

# Monitoring thresholds
variable "failed_requests_threshold" {
  description = "Threshold for failed requests alarm"
  type        = number
  default     = 50
}

variable "delete_operations_threshold" {
  description = "Threshold for unexpected delete operations"
  type        = number
  default     = 10
}

variable "download_volume_threshold_gb" {
  description = "Threshold for high download volume alarm (GB)"
  type        = number
  default     = 100
}

variable "upload_failure_threshold" {
  description = "Threshold for upload failures alarm"
  type        = number
  default     = 20
}

# Tags
variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# KMS settings
variable "enable_audit_kms_key" {
  description = "Create separate KMS key for audit logs"
  type        = bool
  default     = false
}

# Lambda settings
variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 300
}

variable "lambda_memory" {
  description = "Memory allocation for Lambda functions in MB"
  type        = number
  default     = 512
}
```

## s3-primary.tf

```hcl
# Primary document storage bucket with Object Lock and versioning
resource "aws_s3_bucket" "primary" {
  bucket = var.primary_bucket_name

  # Object Lock must be enabled at bucket creation
  object_lock_enabled = true

  tags = merge(var.tags, {
    Name        = var.primary_bucket_name
    Environment = var.environment
    Type        = "DocumentStorage"
    Compliance  = "Required"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# Enable versioning (required for Object Lock)
resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
    # MFA Delete requires root account configuration
    # mfa_delete = var.enable_mfa_delete ? "Enabled" : "Disabled"
  }
}

# Configure Object Lock with compliance mode
resource "aws_s3_bucket_object_lock_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.object_lock_retention_days
    }
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "primary" {
  bucket = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption with KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
    bucket_key_enabled = true
  }
}

# Lifecycle rules for storage optimization and retention
resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  # Move current documents to Intelligent-Tiering after 30 days
  rule {
    id     = "intelligent-tiering"
    status = "Enabled"

    transition {
      days          = var.intelligent_tiering_days
      storage_class = "INTELLIGENT_TIERING"
    }
  }

  # Move old versions to Glacier after 90 days
  rule {
    id     = "glacier-old-versions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = var.glacier_transition_days
      storage_class   = "GLACIER"
    }

    # Delete old versions after 7 years
    noncurrent_version_expiration {
      noncurrent_days = var.legal_retention_days
    }
  }

  # Clean up incomplete multipart uploads after 7 days
  rule {
    id     = "cleanup-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # Remove expired delete markers
  rule {
    id     = "remove-expired-delete-markers"
    status = "Enabled"

    expiration {
      expired_object_delete_marker = true
    }
  }
}

# Enable access logging
resource "aws_s3_bucket_logging" "primary" {
  bucket        = aws_s3_bucket.primary.id
  target_bucket = aws_s3_bucket.audit.id
  target_prefix = "access-logs/${var.primary_bucket_name}/"
}

# Bucket policy to enforce SSL and encryption
resource "aws_s3_bucket_policy" "primary" {
  bucket = aws_s3_bucket.primary.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.primary.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyIncorrectEncryptionKey"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.primary.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.primary.arn
          }
        }
      }
    ]
  })
}

# Optional VPC endpoint restriction
resource "aws_s3_bucket_policy" "vpc_restriction" {
  count  = length(var.vpc_endpoint_ids) > 0 ? 1 : 0
  bucket = aws_s3_bucket.primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "RestrictToVPCEndpoints"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
        Condition = {
          StringNotEquals = {
            "aws:SourceVpce" = var.vpc_endpoint_ids
          }
        }
      }
    ]
  })
}
```

## s3-audit.tf

```hcl
# Audit logs bucket with its own retention and encryption
resource "aws_s3_bucket" "audit" {
  bucket = var.audit_bucket_name

  tags = merge(var.tags, {
    Name        = var.audit_bucket_name
    Environment = var.environment
    Type        = "AuditLogs"
    Compliance  = "Required"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# Enable versioning for audit bucket
resource "aws_s3_bucket_versioning" "audit" {
  bucket = aws_s3_bucket.audit.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access for audit bucket
resource "aws_s3_bucket_public_access_block" "audit" {
  bucket = aws_s3_bucket.audit.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption for audit bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.enable_audit_kms_key ? aws_kms_key.audit[0].arn : aws_kms_key.primary.arn
    }
    bucket_key_enabled = true
  }
}

# Lifecycle rules for audit logs
resource "aws_s3_bucket_lifecycle_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  # Move audit logs to Glacier after 1 year
  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    # Keep audit logs for 10 years
    expiration {
      days = 3650
    }
  }

  # Clean up incomplete uploads
  rule {
    id     = "cleanup-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Bucket policy for CloudTrail and S3 access logging
resource "aws_s3_bucket_policy" "audit" {
  bucket = aws_s3_bucket.audit.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit.arn}/cloudtrail/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "S3ServerAccessLogsPolicy"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.audit.arn}/access-logs/*"
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.audit.arn,
          "${aws_s3_bucket.audit.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}
```

## s3-reporting.tf

```hcl
# Optional reporting bucket for monthly reports
resource "aws_s3_bucket" "reporting" {
  count  = var.enable_reporting ? 1 : 0
  bucket = var.reporting_bucket_name != "" ? var.reporting_bucket_name : "${var.project_name}-${var.environment}-reports"

  tags = merge(var.tags, {
    Name        = var.reporting_bucket_name != "" ? var.reporting_bucket_name : "${var.project_name}-${var.environment}-reports"
    Environment = var.environment
    Type        = "Reports"
  })
}

# Enable versioning for reporting bucket
resource "aws_s3_bucket_versioning" "reporting" {
  count  = var.enable_reporting ? 1 : 0
  bucket = aws_s3_bucket.reporting[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access for reporting bucket
resource "aws_s3_bucket_public_access_block" "reporting" {
  count  = var.enable_reporting ? 1 : 0
  bucket = aws_s3_bucket.reporting[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption for reporting bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "reporting" {
  count  = var.enable_reporting ? 1 : 0
  bucket = aws_s3_bucket.reporting[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
    bucket_key_enabled = true
  }
}

# Lifecycle rule for reports
resource "aws_s3_bucket_lifecycle_configuration" "reporting" {
  count  = var.enable_reporting ? 1 : 0
  bucket = aws_s3_bucket.reporting[0].id

  rule {
    id     = "archive-old-reports"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 730  # Keep reports for 2 years
    }
  }
}
```

## kms.tf

```hcl
# Primary KMS key for document encryption
resource "aws_kms_key" "primary" {
  description             = "${var.project_name}-${var.environment}-primary-key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-primary-key"
    Environment = var.environment
    Type        = "Encryption"
  })
}

resource "aws_kms_alias" "primary" {
  name          = "alias/${var.project_name}-${var.environment}-primary"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key policy for primary key
resource "aws_kms_key_policy" "primary" {
  key_id = aws_kms_key.primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key for S3"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda functions to use the key"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# Optional separate KMS key for audit logs
resource "aws_kms_key" "audit" {
  count                   = var.enable_audit_kms_key ? 1 : 0
  description             = "${var.project_name}-${var.environment}-audit-key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-audit-key"
    Environment = var.environment
    Type        = "AuditEncryption"
  })
}

resource "aws_kms_alias" "audit" {
  count         = var.enable_audit_kms_key ? 1 : 0
  name          = "alias/${var.project_name}-${var.environment}-audit"
  target_key_id = aws_kms_key.audit[0].key_id
}

# Data source for current account
data "aws_caller_identity" "current" {}
```

## iam.tf

```hcl
# Uploader role - can only add documents, no delete permissions
resource "aws_iam_role" "uploader" {
  name               = "${var.project_name}-${var.environment}-uploader"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-uploader"
    Environment = var.environment
    Type        = "IAMRole"
  })
}

resource "aws_iam_role_policy" "uploader" {
  name = "${var.project_name}-${var.environment}-uploader-policy"
  role = aws_iam_role.uploader.id

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
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Sid    = "UploadObjects"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Sid    = "KMSPermissions"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.primary.arn
      }
    ]
  })
}

# Auditor role - read-only access to documents and logs
resource "aws_iam_role" "auditor" {
  name               = "${var.project_name}-${var.environment}-auditor"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-auditor"
    Environment = var.environment
    Type        = "IAMRole"
  })
}

resource "aws_iam_role_policy" "auditor" {
  name = "${var.project_name}-${var.environment}-auditor-policy"
  role = aws_iam_role.auditor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning",
          "s3:ListBucketVersions"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          aws_s3_bucket.audit.arn
        ]
      },
      {
        Sid    = "ReadObjects"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionTagging",
          "s3:GetObjectRetention",
          "s3:GetObjectLegalHold"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.audit.arn}/*"
        ]
      },
      {
        Sid    = "KMSPermissions"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.primary.arn,
          var.enable_audit_kms_key ? aws_kms_key.audit[0].arn : aws_kms_key.primary.arn
        ]
      },
      {
        Sid    = "CloudTrailAccess"
        Effect = "Allow"
        Action = [
          "cloudtrail:LookupEvents",
          "cloudtrail:GetTrailStatus"
        ]
        Resource = "*"
      }
    ]
  })
}

# Admin role - full access but requires MFA for deleting versions
resource "aws_iam_role" "admin" {
  name               = "${var.project_name}-${var.environment}-admin"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = var.require_mfa_for_admin ? {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        } : {}
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-admin"
    Environment = var.environment
    Type        = "IAMRole"
  })
}

resource "aws_iam_role_policy" "admin" {
  name = "${var.project_name}-${var.environment}-admin-policy"
  role = aws_iam_role.admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "FullS3Access"
        Effect = "Allow"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*",
          aws_s3_bucket.audit.arn,
          "${aws_s3_bucket.audit.arn}/*"
        ]
      },
      {
        Sid    = "DeleteVersionsWithMFA"
        Effect = "Deny"
        Action = [
          "s3:DeleteObjectVersion",
          "s3:DeleteBucket"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
        Condition = var.require_mfa_for_admin ? {
          Bool = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        } : {
          StringLike = {
            "s3:versionId" = "*"
          }
        }
      },
      {
        Sid    = "KMSFullAccess"
        Effect = "Allow"
        Action = "kms:*"
        Resource = [
          aws_kms_key.primary.arn,
          var.enable_audit_kms_key ? aws_kms_key.audit[0].arn : aws_kms_key.primary.arn
        ]
      },
      {
        Sid    = "CloudTrailFullAccess"
        Effect = "Allow"
        Action = "cloudtrail:*"
        Resource = "*"
      }
    ]
  })
}

# Lambda execution role for compliance checks
resource "aws_iam_role" "lambda_compliance" {
  name               = "${var.project_name}-${var.environment}-lambda-compliance"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-lambda-compliance"
    Environment = var.environment
    Type        = "IAMRole"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_compliance_basic" {
  role       = aws_iam_role.lambda_compliance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_compliance" {
  name = "${var.project_name}-${var.environment}-lambda-compliance-policy"
  role = aws_iam_role.lambda_compliance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:GetBucketObjectLockConfiguration",
          "s3:GetBucketEncryption",
          "s3:GetBucketPublicAccessBlock",
          "s3:GetBucketLifecycleConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:GetTrailStatus",
          "cloudtrail:DescribeTrails"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# Lambda execution role for monthly reporting
resource "aws_iam_role" "lambda_reporting" {
  count = var.enable_reporting ? 1 : 0
  name  = "${var.project_name}-${var.environment}-lambda-reporting"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-lambda-reporting"
    Environment = var.environment
    Type        = "IAMRole"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_reporting_basic" {
  count      = var.enable_reporting ? 1 : 0
  role       = aws_iam_role.lambda_reporting[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_reporting" {
  count = var.enable_reporting ? 1 : 0
  name  = "${var.project_name}-${var.environment}-lambda-reporting-policy"
  role  = aws_iam_role.lambda_reporting[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:ListBucketVersions",
          "s3:GetBucketLocation"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.reporting[0].arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = "noreply@${var.project_name}.com"
          }
        }
      }
    ]
  })
}
```

## cloudtrail.tf

```hcl
# CloudTrail for comprehensive audit logging
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-${var.environment}-trail"
  s3_bucket_name                = aws_s3_bucket.audit.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.primary.arn}/*"]
    }
  }

  # Optional CloudWatch Logs integration
  dynamic "cloud_watch_logs_group_arn" {
    for_each = var.enable_cloudwatch_logs ? [1] : []
    content {
      cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail[0].arn}:*"
    }
  }

  dynamic "cloud_watch_logs_role_arn" {
    for_each = var.enable_cloudwatch_logs ? [1] : []
    content {
      cloud_watch_logs_role_arn = aws_iam_role.cloudtrail_cloudwatch[0].arn
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-trail"
    Environment = var.environment
    Type        = "AuditTrail"
  })

  depends_on = [aws_s3_bucket_policy.audit]
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  count             = var.enable_cloudwatch_logs ? 1 : 0
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment}"
  retention_in_days = 90
  kms_key_id        = var.enable_audit_kms_key ? aws_kms_key.audit[0].arn : aws_kms_key.primary.arn

  tags = merge(var.tags, {
    Name        = "/aws/cloudtrail/${var.project_name}-${var.environment}"
    Environment = var.environment
    Type        = "LogGroup"
  })
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  count = var.enable_cloudwatch_logs ? 1 : 0
  name  = "${var.project_name}-${var.environment}-cloudtrail-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-cloudtrail-cloudwatch"
    Environment = var.environment
    Type        = "IAMRole"
  })
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  count = var.enable_cloudwatch_logs ? 1 : 0
  name  = "${var.project_name}-${var.environment}-cloudtrail-cloudwatch-policy"
  role  = aws_iam_role.cloudtrail_cloudwatch[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail[0].arn}:*"
      }
    ]
  })
}
```

## cloudwatch.tf

```hcl
# CloudWatch alarms for monitoring suspicious activities

# Alarm for too many failed requests
resource "aws_cloudwatch_metric_alarm" "failed_requests" {
  alarm_name          = "${var.project_name}-${var.environment}-failed-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.failed_requests_threshold
  alarm_description   = "This metric monitors failed requests to the primary bucket"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.primary.id
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-failed-requests"
    Environment = var.environment
    Type        = "Alarm"
  })
}

# Alarm for unexpected delete operations
resource "aws_cloudwatch_log_metric_filter" "delete_operations" {
  count          = var.enable_cloudwatch_logs ? 1 : 0
  name           = "${var.project_name}-${var.environment}-delete-operations"
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name

  pattern = "{ ($.eventName = DeleteObject) || ($.eventName = DeleteObjectVersion) || ($.eventName = DeleteBucket) }"

  metric_transformation {
    name      = "DeleteOperationsCount"
    namespace = "${var.project_name}/Compliance"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "delete_operations" {
  count               = var.enable_cloudwatch_logs ? 1 : 0
  alarm_name          = "${var.project_name}-${var.environment}-delete-operations"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DeleteOperationsCount"
  namespace           = "${var.project_name}/Compliance"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.delete_operations_threshold
  alarm_description   = "Alert on unexpected delete operations"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-delete-operations"
    Environment = var.environment
    Type        = "Alarm"
  })
}

# Alarm for high download volumes
resource "aws_cloudwatch_metric_alarm" "high_download_volume" {
  alarm_name          = "${var.project_name}-${var.environment}-high-download-volume"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BytesDownloaded"
  namespace           = "AWS/S3"
  period              = "3600"
  statistic           = "Sum"
  threshold           = var.download_volume_threshold_gb * 1073741824  # Convert GB to bytes
  alarm_description   = "Alert on high download volumes (potential data leak)"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.primary.id
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-high-download-volume"
    Environment = var.environment
    Type        = "Alarm"
  })
}

# Alarm for upload failures
resource "aws_cloudwatch_metric_alarm" "upload_failures" {
  alarm_name          = "${var.project_name}-${var.environment}-upload-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.upload_failure_threshold
  alarm_description   = "Alert on high number of upload failures"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.primary.id
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-upload-failures"
    Environment = var.environment
    Type        = "Alarm"
  })
}

# Metric filters for suspicious activity
resource "aws_cloudwatch_log_metric_filter" "access_denied" {
  count          = var.enable_cloudwatch_logs ? 1 : 0
  name           = "${var.project_name}-${var.environment}-access-denied"
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name

  pattern = "{ ($.errorCode = *UnauthorizedAccess) || ($.errorCode = AccessDenied) }"

  metric_transformation {
    name      = "AccessDeniedCount"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "versioning_disabled" {
  count          = var.enable_cloudwatch_logs ? 1 : 0
  name           = "${var.project_name}-${var.environment}-versioning-disabled"
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name

  pattern = "{ ($.eventName = PutBucketVersioning) && ($.requestParameters.VersioningConfiguration.Status = Suspended) }"

  metric_transformation {
    name      = "VersioningDisabledCount"
    namespace = "${var.project_name}/Compliance"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "versioning_disabled" {
  count               = var.enable_cloudwatch_logs ? 1 : 0
  alarm_name          = "${var.project_name}-${var.environment}-versioning-disabled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "VersioningDisabledCount"
  namespace           = "${var.project_name}/Compliance"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Critical: Versioning has been disabled on the primary bucket"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-versioning-disabled"
    Environment = var.environment
    Type        = "Alarm"
    Severity    = "Critical"
  })
}
```

## lambda-compliance.tf

```hcl
# Lambda function for daily compliance checks
data "archive_file" "compliance_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/compliance-check.py"
  output_path = "${path.module}/.terraform/compliance-lambda.zip"
}

resource "aws_lambda_function" "compliance_check" {
  filename         = data.archive_file.compliance_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-compliance-check"
  role            = aws_iam_role.lambda_compliance.arn
  handler         = "compliance-check.lambda_handler"
  source_code_hash = data.archive_file.compliance_lambda.output_base64sha256
  runtime         = "python3.9"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory

  environment {
    variables = {
      PRIMARY_BUCKET_NAME = aws_s3_bucket.primary.id
      SNS_TOPIC_ARN      = aws_sns_topic.alerts.arn
      ENVIRONMENT        = var.environment
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-compliance-check"
    Environment = var.environment
    Type        = "Lambda"
  })
}

# EventBridge rule to trigger compliance check daily
resource "aws_cloudwatch_event_rule" "compliance_schedule" {
  name                = "${var.project_name}-${var.environment}-compliance-schedule"
  description         = "Trigger daily compliance checks"
  schedule_expression = "cron(0 8 * * ? *)"  # 8 AM UTC daily

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-compliance-schedule"
    Environment = var.environment
    Type        = "EventRule"
  })
}

resource "aws_cloudwatch_event_target" "compliance_lambda" {
  rule      = aws_cloudwatch_event_rule.compliance_schedule.name
  target_id = "ComplianceLambdaTarget"
  arn       = aws_lambda_function.compliance_check.arn
}

resource "aws_lambda_permission" "allow_eventbridge_compliance" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_check.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_schedule.arn
}
```

## lambda-reporting.tf

```hcl
# Lambda function for monthly reporting
data "archive_file" "reporting_lambda" {
  count       = var.enable_reporting ? 1 : 0
  type        = "zip"
  source_file = "${path.module}/lambda/monthly-report.py"
  output_path = "${path.module}/.terraform/reporting-lambda.zip"
}

resource "aws_lambda_function" "monthly_report" {
  count            = var.enable_reporting ? 1 : 0
  filename         = data.archive_file.reporting_lambda[0].output_path
  function_name    = "${var.project_name}-${var.environment}-monthly-report"
  role            = aws_iam_role.lambda_reporting[0].arn
  handler         = "monthly-report.lambda_handler"
  source_code_hash = data.archive_file.reporting_lambda[0].output_base64sha256
  runtime         = "python3.9"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory

  environment {
    variables = {
      PRIMARY_BUCKET_NAME   = aws_s3_bucket.primary.id
      REPORTING_BUCKET_NAME = aws_s3_bucket.reporting[0].id
      ENVIRONMENT          = var.environment
      ENABLE_EMAIL         = var.enable_ses_email
      EMAIL_RECIPIENTS     = join(",", var.report_email_recipients)
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-monthly-report"
    Environment = var.environment
    Type        = "Lambda"
  })
}

# EventBridge rule to trigger monthly reporting
resource "aws_cloudwatch_event_rule" "monthly_report_schedule" {
  count               = var.enable_reporting ? 1 : 0
  name                = "${var.project_name}-${var.environment}-monthly-report-schedule"
  description         = "Trigger monthly storage reports"
  schedule_expression = "cron(0 9 1 * ? *)"  # 9 AM UTC on the 1st of each month

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-monthly-report-schedule"
    Environment = var.environment
    Type        = "EventRule"
  })
}

resource "aws_cloudwatch_event_target" "reporting_lambda" {
  count     = var.enable_reporting ? 1 : 0
  rule      = aws_cloudwatch_event_rule.monthly_report_schedule[0].name
  target_id = "ReportingLambdaTarget"
  arn       = aws_lambda_function.monthly_report[0].arn
}

resource "aws_lambda_permission" "allow_eventbridge_reporting" {
  count         = var.enable_reporting ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monthly_report[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.monthly_report_schedule[0].arn
}
```

## eventbridge.tf

```hcl
# EventBridge rules to monitor configuration changes

# Rule for S3 configuration changes
resource "aws_cloudwatch_event_rule" "s3_config_changes" {
  name        = "${var.project_name}-${var.environment}-s3-config-changes"
  description = "Monitor S3 bucket configuration changes"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      eventName = [
        "PutBucketVersioning",
        "PutBucketPolicy",
        "DeleteBucketPolicy",
        "PutBucketAcl",
        "PutBucketPublicAccessBlock",
        "DeleteBucketPublicAccessBlock",
        "PutBucketEncryption",
        "DeleteBucketEncryption",
        "PutObjectLockConfiguration"
      ]
      requestParameters = {
        bucketName = [aws_s3_bucket.primary.id]
      }
    }
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-s3-config-changes"
    Environment = var.environment
    Type        = "EventRule"
  })
}

resource "aws_cloudwatch_event_target" "s3_config_sns" {
  rule      = aws_cloudwatch_event_rule.s3_config_changes.name
  target_id = "S3ConfigSNSTarget"
  arn       = aws_sns_topic.alerts.arn
}

# Rule for CloudTrail configuration changes
resource "aws_cloudwatch_event_rule" "cloudtrail_changes" {
  name        = "${var.project_name}-${var.environment}-cloudtrail-changes"
  description = "Monitor CloudTrail configuration changes"

  event_pattern = jsonencode({
    source      = ["aws.cloudtrail"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["cloudtrail.amazonaws.com"]
      eventName = [
        "StopLogging",
        "DeleteTrail",
        "UpdateTrail"
      ]
    }
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-cloudtrail-changes"
    Environment = var.environment
    Type        = "EventRule"
  })
}

resource "aws_cloudwatch_event_target" "cloudtrail_sns" {
  rule      = aws_cloudwatch_event_rule.cloudtrail_changes.name
  target_id = "CloudTrailSNSTarget"
  arn       = aws_sns_topic.alerts.arn
}

# Rule for KMS key changes
resource "aws_cloudwatch_event_rule" "kms_changes" {
  name        = "${var.project_name}-${var.environment}-kms-changes"
  description = "Monitor KMS key configuration changes"

  event_pattern = jsonencode({
    source      = ["aws.kms"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["kms.amazonaws.com"]
      eventName = [
        "DisableKey",
        "ScheduleKeyDeletion",
        "PutKeyPolicy"
      ]
      requestParameters = {
        keyId = [
          aws_kms_key.primary.id,
          var.enable_audit_kms_key ? aws_kms_key.audit[0].id : aws_kms_key.primary.id
        ]
      }
    }
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-kms-changes"
    Environment = var.environment
    Type        = "EventRule"
  })
}

resource "aws_cloudwatch_event_target" "kms_sns" {
  rule      = aws_cloudwatch_event_rule.kms_changes.name
  target_id = "KMSSNSTarget"
  arn       = aws_sns_topic.alerts.arn
}
```

## sns.tf

```hcl
# SNS topic for all alerts
resource "aws_sns_topic" "alerts" {
  name              = "${var.project_name}-${var.environment}-alerts"
  kms_master_key_id = aws_kms_key.primary.id

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-alerts"
    Environment = var.environment
    Type        = "SNSTopic"
  })
}

resource "aws_sns_topic_subscription" "alert_emails" {
  for_each = toset(var.report_email_recipients)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# SNS topic policy to allow EventBridge and CloudWatch
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "events.amazonaws.com",
            "cloudwatch.amazonaws.com"
          ]
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}
```

## inventory.tf

```hcl
# Optional S3 Inventory configuration for detailed object reports
resource "aws_s3_bucket_inventory" "primary" {
  count  = var.enable_inventory ? 1 : 0
  bucket = aws_s3_bucket.primary.id
  name   = "EntireBucketDaily"

  included_object_versions = "All"

  schedule {
    frequency = "Daily"
  }

  destination {
    bucket {
      format     = "CSV"
      bucket_arn = aws_s3_bucket.audit.arn
      prefix     = "inventory"

      encryption {
        sse_kms {
          key_id = var.enable_audit_kms_key ? aws_kms_key.audit[0].arn : aws_kms_key.primary.arn
        }
      }
    }
  }

  optional_fields = [
    "Size",
    "LastModifiedDate",
    "StorageClass",
    "ETag",
    "IsMultipartUploaded",
    "ReplicationStatus",
    "EncryptionStatus",
    "ObjectLockRetainUntilDate",
    "ObjectLockMode",
    "ObjectLockLegalHoldStatus",
    "IntelligentTieringAccessTier"
  ]
}
```

## dashboard.tf

```hcl
# Optional
```
