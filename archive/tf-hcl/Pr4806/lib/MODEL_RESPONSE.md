### Reasoning Trace

---

This is a comprehensive request for a cross-account S3 data sharing system. Let me break down what's needed:

1. Primary storage S3 bucket with versioning, lifecycle policies, encryption
2. Cross-account access with IAM roles in 20 consumer accounts
3. KMS encryption with cross-account access
4. DynamoDB tables for access control and audit logs
5. CloudTrail for auditing
6. Lambda functions for various purposes (validation, logging, governance, expiration)
7. EventBridge rules and CloudWatch alarms for monitoring
8. Optional self-service API with Step Functions
9. Cost tracking with S3 Storage Lens
10. Comprehensive Terraform modules and Lambda code

This is a large project, so I'll need to create multiple files with proper organization. Let me start with the Terraform files and then the Lambda code.

### Answer

---

I'll create a comprehensive cross-account S3 data sharing system with all the requested features. This is a production-ready solution with security best practices throughout.

## Directory Structure

```
terraform-s3-cross-account/
├── terraform/
│   ├── versions.tf
│   ├── providers.tf
│   ├── variables.tf
│   ├── s3-primary.tf
│   ├── s3-audit.tf
│   ├── iam-cross-account.tf
│   ├── s3-bucket-policy.tf
│   ├── kms.tf
│   ├── dynamodb-access-control.tf
│   ├── dynamodb-audit-logs.tf
│   ├── cloudtrail.tf
│   ├── lambda-access-validator.tf
│   ├── lambda-access-logger.tf
│   ├── lambda-governance.tf
│   ├── lambda-expiration.tf
│   ├── eventbridge.tf
│   ├── cloudwatch.tf
│   ├── monitoring-dashboard.tf
│   ├── storage-lens.tf
│   ├── api-gateway.tf
│   ├── step-functions.tf
│   └── outputs.tf
├── lambda/
│   ├── access_validator.py
│   ├── access_logger.py
│   ├── governance_check.py
│   ├── expiration_enforcer.py
│   ├── access_request.py
│   └── approval_processor.py
└── README.md
```

## Terraform Files

### versions.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  backend "s3" {
    # Configure your backend
    # bucket = "your-terraform-state-bucket"
    # key    = "cross-account-s3/terraform.tfstate"
    # region = "us-east-1"
    # encrypt = true
    # dynamodb_table = "terraform-state-lock"
  }
}
```

### providers.tf

```hcl
provider "aws" {
  alias  = "primary"
  region = var.primary_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Dynamic provider aliases for consumer accounts
# In practice, you might use assume_role for each
provider "aws" {
  alias  = "consumer"
  region = var.primary_region

  # For cross-account access, typically you'd use:
  # assume_role {
  #   role_arn = "arn:aws:iam::${var.consumer_account_id}:role/TerraformRole"
  # }
}
```

### variables.tf

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "cross-account-s3-sharing"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "primary_account_id" {
  description = "AWS account ID of the primary account"
  type        = string
}

variable "consumer_accounts" {
  description = "Map of consumer accounts with their configurations"
  type = map(object({
    account_id       = string
    allowed_prefixes = list(string)
    access_level     = string # "read-only" or "read-write"
    external_id      = string
  }))

  validation {
    condition = alltrue([
      for k, v in var.consumer_accounts :
      contains(["read-only", "read-write"], v.access_level)
    ])
    error_message = "Access level must be either 'read-only' or 'read-write'."
  }
}

variable "lifecycle_transition_days" {
  description = "Days for lifecycle transitions"
  type = object({
    intelligent_tiering = number
    glacier            = number
  })
  default = {
    intelligent_tiering = 30
    glacier            = 90
  }
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for disaster recovery"
  type        = bool
  default     = false
}

variable "replication_region" {
  description = "Region for cross-region replication"
  type        = string
  default     = "us-west-2"
}

variable "audit_log_retention_years" {
  description = "Retention period for audit logs in years"
  type        = number
  default     = 7
}

variable "access_log_retention_days" {
  description = "Retention period for access logs in DynamoDB (days)"
  type        = number
  default     = 365
}

variable "alert_thresholds" {
  description = "Thresholds for various alerts"
  type = object({
    request_rate_per_5min    = number
    failed_auth_per_5min     = number
    data_egress_gb_per_hour  = number
    large_transfer_threshold_gb = number
  })
  default = {
    request_rate_per_5min    = 1000
    failed_auth_per_5min     = 10
    data_egress_gb_per_hour  = 100
    large_transfer_threshold_gb = 10
  }
}

variable "business_hours" {
  description = "Business hours for monitoring (24-hour format)"
  type = object({
    start    = number
    end      = number
    timezone = string
  })
  default = {
    start    = 9
    end      = 18
    timezone = "UTC"
  }
}

variable "notification_email" {
  description = "Email address for notifications"
  type        = string
}

variable "enable_self_service_api" {
  description = "Enable self-service API for access requests"
  type        = bool
  default     = false
}

variable "approver_emails" {
  description = "List of approver email addresses for self-service requests"
  type        = list(string)
  default     = []
}

variable "lambda_runtime" {
  description = "Runtime for Lambda functions"
  type        = string
  default     = "python3.11"
}

variable "lambda_timeout" {
  description = "Default timeout for Lambda functions (seconds)"
  type        = number
  default     = 300
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### s3-primary.tf

```hcl
# Primary S3 bucket for shared data
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "${var.project_name}-${var.environment}-primary-${data.aws_caller_identity.primary.account_id}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-primary-bucket"
    Type = "SharedData"
  })
}

# Enable versioning
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption with KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
    bucket_key_enabled = true
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  rule {
    id     = "intelligent-tiering"
    status = "Enabled"

    transition {
      days          = var.lifecycle_transition_days.intelligent_tiering
      storage_class = "INTELLIGENT_TIERING"
    }
  }

  rule {
    id     = "glacier-archive"
    status = "Enabled"

    transition {
      days          = var.lifecycle_transition_days.glacier
      storage_class = "GLACIER"
    }
  }

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 180
    }
  }
}

# Logging configuration
resource "aws_s3_bucket_logging" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  target_bucket = aws_s3_bucket.audit.id
  target_prefix = "s3-access-logs/"
}

# Cross-region replication (optional)
resource "aws_s3_bucket_replication_configuration" "primary" {
  provider = aws.primary
  count    = var.enable_cross_region_replication ? 1 : 0

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.replica[0].arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.replica[0].arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.primary]
}

# Replication IAM role (if enabled)
resource "aws_iam_role" "replication" {
  provider = aws.primary
  count    = var.enable_cross_region_replication ? 1 : 0

  name = "${var.project_name}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "replication" {
  provider = aws.primary
  count    = var.enable_cross_region_replication ? 1 : 0

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
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.replica[0].arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.replica[0].arn
      }
    ]
  })
}

# Data source for account ID
data "aws_caller_identity" "primary" {
  provider = aws.primary
}
```

### s3-audit.tf

```hcl
# Audit bucket for CloudTrail and access logs
resource "aws_s3_bucket" "audit" {
  provider = aws.primary
  bucket   = "${var.project_name}-${var.environment}-audit-${data.aws_caller_identity.primary.account_id}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-audit-bucket"
    Type = "AuditLogs"
  })
}

# Enable versioning for audit bucket
resource "aws_s3_bucket_versioning" "audit" {
  provider = aws.primary
  bucket   = aws_s3_bucket.audit.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for audit bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  provider = aws.primary
  bucket   = aws_s3_bucket.audit.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access for audit bucket
resource "aws_s3_bucket_public_access_block" "audit" {
  provider = aws.primary
  bucket   = aws_s3_bucket.audit.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle configuration for audit logs
resource "aws_s3_bucket_lifecycle_configuration" "audit" {
  provider = aws.primary
  bucket   = aws_s3_bucket.audit.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = var.audit_log_retention_years * 365
    }
  }
}

# Bucket policy for CloudTrail and S3 access logs
resource "aws_s3_bucket_policy" "audit" {
  provider = aws.primary
  bucket   = aws_s3_bucket.audit.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit.arn
      },
      {
        Sid    = "CloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit.arn}/cloudtrail/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "AES256"
          }
        }
      },
      {
        Sid    = "S3LogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit.arn}/s3-access-logs/*"
      },
      {
        Sid    = "S3LogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit.arn
      }
    ]
  })
}

# Object lock configuration for compliance
resource "aws_s3_bucket_object_lock_configuration" "audit" {
  provider = aws.primary
  bucket   = aws_s3_bucket.audit.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 30
    }
  }
}
```

### iam-cross-account.tf

```hcl
# IAM roles for cross-account access
resource "aws_iam_role" "consumer_access" {
  provider = aws.primary
  for_each = var.consumer_accounts

  name = "${var.project_name}-consumer-${each.key}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${each.value.account_id}:root"
      }
      Action = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "sts:ExternalId" = each.value.external_id
        }
        StringLike = {
          "aws:userid" = "AIDAI*:*"  # Require IAM user/role, not root
        }
        IpAddress = {
          "aws:SourceIp" = var.allowed_ip_ranges
        }
        DateGreaterThan = {
          "aws:CurrentTime" = timestamp()
        }
      }
    }]
  })

  tags = merge(var.tags, {
    Name         = "${var.project_name}-consumer-${each.key}-role"
    ConsumerAccount = each.value.account_id
  })
}

# IAM policy for consumer access
resource "aws_iam_policy" "consumer_access" {
  provider = aws.primary
  for_each = var.consumer_accounts

  name        = "${var.project_name}-consumer-${each.key}-policy"
  description = "Policy for consumer account ${each.key} to access S3 data"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Effect = "Allow"
          Action = [
            "s3:ListBucket",
            "s3:GetBucketLocation",
            "s3:GetBucketVersioning"
          ]
          Resource = aws_s3_bucket.primary.arn
          Condition = {
            StringLike = {
              "s3:prefix" = each.value.allowed_prefixes
            }
          }
        }
      ],
      each.value.access_level == "read-only" ? [
        {
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:GetObjectMetadata",
            "s3:GetObjectVersionMetadata"
          ]
          Resource = [
            for prefix in each.value.allowed_prefixes :
            "${aws_s3_bucket.primary.arn}/${prefix}*"
          ]
        }
      ] : [
        {
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:GetObjectMetadata",
            "s3:GetObjectVersionMetadata",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:DeleteObjectVersion"
          ]
          Resource = [
            for prefix in each.value.allowed_prefixes :
            "${aws_s3_bucket.primary.arn}/${prefix}*"
          ]
        }
      ],
      [
        {
          Effect = "Allow"
          Action = [
            "kms:Decrypt",
            "kms:DescribeKey"
          ]
          Resource = aws_kms_key.primary.arn
          Condition = {
            StringEquals = {
              "kms:ViaService" = "s3.${var.primary_region}.amazonaws.com"
            }
          }
        }
      ],
      each.value.access_level == "read-write" ? [
        {
          Effect = "Allow"
          Action = [
            "kms:GenerateDataKey",
            "kms:Encrypt"
          ]
          Resource = aws_kms_key.primary.arn
          Condition = {
            StringEquals = {
              "kms:ViaService" = "s3.${var.primary_region}.amazonaws.com"
            }
          }
        }
      ] : []
    )
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "consumer_access" {
  provider   = aws.primary
  for_each   = var.consumer_accounts

  role       = aws_iam_role.consumer_access[each.key].name
  policy_arn = aws_iam_policy.consumer_access[each.key].arn
}

# Session policy for additional restrictions
resource "aws_iam_policy" "session_restrictions" {
  provider = aws.primary
  name     = "${var.project_name}-session-restrictions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "s3:DeleteBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:PutBucketAcl",
          "s3:PutObjectAcl"
        ]
        Resource = "*"
      }
    ]
  })
}

variable "allowed_ip_ranges" {
  description = "Allowed IP ranges for cross-account access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Update with your corporate IP ranges
}
```

### s3-bucket-policy.tf

```hcl
# S3 bucket policy for cross-account access
resource "aws_s3_bucket_policy" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "DenyInsecureConnections"
          Effect = "Deny"
          Principal = "*"
          Action = "s3:*"
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
          Sid    = "DenyUnencryptedObjectUploads"
          Effect = "Deny"
          Principal = "*"
          Action = "s3:PutObject"
          Resource = "${aws_s3_bucket.primary.arn}/*"
          Condition = {
            StringNotEquals = {
              "s3:x-amz-server-side-encryption" = "aws:kms"
            }
          }
        },
        {
          Sid    = "DenyWrongKMSKey"
          Effect = "Deny"
          Principal = "*"
          Action = "s3:PutObject"
          Resource = "${aws_s3_bucket.primary.arn}/*"
          Condition = {
            StringNotEquals = {
              "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.primary.arn
            }
          }
        }
      ],
      flatten([
        for account_key, account in var.consumer_accounts : [
          {
            Sid    = "CrossAccountListBucket${replace(title(account_key), "-", "")}"
            Effect = "Allow"
            Principal = {
              AWS = aws_iam_role.consumer_access[account_key].arn
            }
            Action = [
              "s3:ListBucket",
              "s3:GetBucketLocation"
            ]
            Resource = aws_s3_bucket.primary.arn
            Condition = {
              StringLike = {
                "s3:prefix" = account.allowed_prefixes
              }
              StringEquals = {
                "aws:PrincipalTag/Environment" = var.environment
              }
            }
          },
          account.access_level == "read-only" ? {
            Sid    = "CrossAccountReadObjects${replace(title(account_key), "-", "")}"
            Effect = "Allow"
            Principal = {
              AWS = aws_iam_role.consumer_access[account_key].arn
            }
            Action = [
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:GetObjectMetadata",
              "s3:GetObjectVersionMetadata",
              "s3:GetObjectTagging",
              "s3:GetObjectVersionTagging"
            ]
            Resource = [
              for prefix in account.allowed_prefixes :
              "${aws_s3_bucket.primary.arn}/${prefix}*"
            ]
          } : {
            Sid    = "CrossAccountReadWriteObjects${replace(title(account_key), "-", "")}"
            Effect = "Allow"
            Principal = {
              AWS = aws_iam_role.consumer_access[account_key].arn
            }
            Action = [
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:GetObjectMetadata",
              "s3:GetObjectVersionMetadata",
              "s3:GetObjectTagging",
              "s3:GetObjectVersionTagging",
              "s3:PutObject",
              "s3:PutObjectTagging",
              "s3:DeleteObject",
              "s3:DeleteObjectVersion"
            ]
            Resource = [
              for prefix in account.allowed_prefixes :
              "${aws_s3_bucket.primary.arn}/${prefix}*"
            ]
            Condition = {
              StringEquals = {
                "s3:x-amz-server-side-encryption" = "aws:kms"
                "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.primary.arn
              }
            }
          }
        ]
      ])
    )
  })
}

# Additional bucket policy for Lambda access
resource "aws_s3_bucket_policy_attachment" "lambda_access" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "LambdaValidatorAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_access_validator.arn
        }
        Action = [
          "s3:GetBucketPolicy",
          "s3:GetBucketAcl"
        ]
        Resource = aws_s3_bucket.primary.arn
      }
    ]
  })
}
```

### kms.tf

```hcl
# Customer-managed KMS key for S3 encryption
resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "KMS key for ${var.project_name} S3 encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-primary-kms-key"
  })
}

# KMS key alias
resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/${var.project_name}-primary"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key policy
resource "aws_kms_key_policy" "primary" {
  provider = aws.primary
  key_id   = aws_kms_key.primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "Enable IAM User Permissions"
          Effect = "Allow"
          Principal = {
            AWS = "arn:aws:iam::${data.aws_caller_identity.primary.account_id}:root"
          }
          Action   = "kms:*"
          Resource = "*"
        },
        {
          Sid    = "Allow S3 to use the key"
          Effect = "Allow"
          Principal = {
            Service = "s3.amazonaws.com"
          }
          Action = [
            "kms:Decrypt",
            "kms:GenerateDataKey"
          ]
          Resource = "*"
          Condition = {
            StringEquals = {
              "kms:ViaService" = "s3.${var.primary_region}.amazonaws.com"
            }
          }
        },
        {
          Sid    = "Allow CloudTrail to encrypt logs"
          Effect = "Allow"
          Principal = {
            Service = "cloudtrail.amazonaws.com"
          }
          Action = [
            "kms:GenerateDataKey",
            "kms:DescribeKey"
          ]
          Resource = "*"
        },
        {
          Sid    = "Allow Lambda functions to use the key"
          Effect = "Allow"
          Principal = {
            AWS = [
              aws_iam_role.lambda_access_validator.arn,
              aws_iam_role.lambda_access_logger.arn,
              aws_iam_role.lambda_governance.arn
            ]
          }
          Action = [
            "kms:Decrypt",
            "kms:DescribeKey"
          ]
          Resource = "*"
        }
      ],
      [
        for account_key, account in var.consumer_accounts : {
          Sid    = "AllowCrossAccountDecrypt${replace(title(account_key), "-", "")}"
          Effect = "Allow"
          Principal = {
            AWS = aws_iam_role.consumer_access[account_key].arn
          }
          Action = [
            "kms:Decrypt",
            "kms:DescribeKey"
          ]
          Resource = "*"
          Condition = {
            StringEquals = {
              "kms:ViaService" = "s3.${var.primary_region}.amazonaws.com"
            }
          }
        }
      ],
      [
        for account_key, account in var.consumer_accounts : {
          Sid    = "AllowCrossAccountEncrypt${replace(title(account_key), "-", "")}"
          Effect = account.access_level == "read-write" ? "Allow" : "Deny"
          Principal = {
            AWS = aws_iam_role.consumer_access[account_key].arn
          }
          Action = [
            "kms:Encrypt",
            "kms:GenerateDataKey"
          ]
          Resource = "*"
          Condition = {
            StringEquals = {
              "kms:ViaService" = "s3.${var.primary_region}.amazonaws.com"
            }
          }
        }
      ]
    )
  })
}

# KMS grants for cross-account access
resource "aws_kms_grant" "consumer_access" {
  provider          = aws.primary
  for_each          = var.consumer_accounts

  key_id            = aws_kms_key.primary.id
  grantee_principal = aws_iam_role.consumer_access[each.key].arn

  operations = each.value.access_level == "read-only" ? [
    "Decrypt",
    "DescribeKey"
  ] : [
    "Decrypt",
    "DescribeKey",
    "GenerateDataKey",
    "Encrypt"
  ]

  constraints {
    encryption_context_equals = {
      Department = each.key
    }
  }

  name = "${var.project_name}-grant-${each.key}"
}

# Replica KMS key (if cross-region replication is enabled)
resource "aws_kms_key" "replica" {
  provider                = aws.replica
  count                   = var.enable_cross_region_replication ? 1 : 0

  description             = "Replica KMS key for ${var.project_name}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-replica-kms-key"
  })
}

resource "aws_kms_alias" "replica" {
  provider      = aws.replica
  count         = var.enable_cross_region_replication ? 1 : 0

  name          = "alias/${var.project_name}-replica"
  target_key_id = aws_kms_key.replica[0].key_id
}

# Replica bucket (if cross-region replication is enabled)
resource "aws_s3_bucket" "replica" {
  provider = aws.replica
  count    = var.enable_cross_region_replication ? 1 : 0

  bucket = "${var.project_name}-${var.environment}-replica-${data.aws_caller_identity.primary.account_id}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-replica-bucket"
    Type = "ReplicaData"
  })
}

provider "aws" {
  alias  = "replica"
  region = var.replication_region
}
```

### dynamodb-access-control.tf

```hcl
# DynamoDB table for access control registry
resource "aws_dynamodb_table" "access_control" {
  provider         = aws.primary
  name             = "${var.project_name}-access-control"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "account_id"
  range_key        = "prefix"

  attribute {
    name = "account_id"
    type = "S"
  }

  attribute {
    name = "prefix"
    type = "S"
  }

  attribute {
    name = "expiration_date"
    type = "N"
  }

  global_secondary_index {
    name            = "expiration-index"
    hash_key        = "expiration_date"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl_timestamp"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-access-control"
  })
}

# Initialize access control table with consumer accounts
resource "aws_dynamodb_table_item" "access_control_items" {
  provider   = aws.primary
  for_each   = { for idx, item in local.access_control_items : "${item.account_id}-${item.prefix}" => item }

  table_name = aws_dynamodb_table.access_control.name
  hash_key   = aws_dynamodb_table.access_control.hash_key
  range_key  = aws_dynamodb_table.access_control.range_key

  item = jsonencode({
    account_id       = { S = each.value.account_id }
    prefix           = { S = each.value.prefix }
    access_level     = { S = each.value.access_level }
    expiration_date  = { N = tostring(each.value.expiration_date) }
    created_by       = { S = "terraform" }
    created_at       = { N = tostring(timestamp()) }
    allowed_actions  = { SS = each.value.allowed_actions }
    external_id      = { S = each.value.external_id }
    ttl_timestamp    = { N = tostring(each.value.expiration_date + 86400) } # Expire 1 day after expiration_date
  })
}

locals {
  access_control_items = flatten([
    for account_key, account in var.consumer_accounts : [
      for prefix in account.allowed_prefixes : {
        account_id      = account.account_id
        prefix          = prefix
        access_level    = account.access_level
        expiration_date = timeadd(timestamp(), "8760h") # 1 year from now
        external_id     = account.external_id
        allowed_actions = account.access_level == "read-only" ?
          ["s3:GetObject", "s3:ListBucket"] :
          ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
      }
    ]
  ])
}
```

### dynamodb-audit-logs.tf

```hcl
# DynamoDB table for detailed access logs
resource "aws_dynamodb_table" "audit_logs" {
  provider         = aws.primary
  name             = "${var.project_name}-audit-logs"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "timestamp"
  range_key        = "request_id"

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "request_id"
    type = "S"
  }

  attribute {
    name = "account_id"
    type = "S"
  }

  attribute {
    name = "action"
    type = "S"
  }

  global_secondary_index {
    name            = "account-index"
    hash_key        = "account_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "action-index"
    hash_key        = "action"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = merge(var.tags, {
    Name = "${var.project_name}-audit-logs"
  })
}

# CloudWatch metric for audit log entries
resource "aws_cloudwatch_log_metric_filter" "audit_log_count" {
  provider       = aws.primary
  name           = "${var.project_name}-audit-log-count"
  log_group_name = aws_cloudwatch_log_group.lambda_access_logger.name
  pattern        = "[timestamp, request_id, account_id, action, ...]"

  metric_transformation {
    name      = "AuditLogCount"
    namespace = "${var.project_name}/AuditLogs"
    value     = "1"

    dimensions = {
      AccountId = "$account_id"
      Action    = "$action"
    }
  }
}
```

### cloudtrail.tf

```hcl
# CloudTrail for auditing
resource "aws_cloudtrail" "main" {
  provider                      = aws.primary
  name                          = "${var.project_name}-trail"
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

  event_selector {
    read_write_type           = "All"
    include_management_events = false

    data_resource {
      type   = "AWS::DynamoDB::Table"
      values = [
        aws_dynamodb_table.access_control.arn,
        aws_dynamodb_table.audit_logs.arn
      ]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  advanced_event_selector {
    name = "Log all S3 data events for primary bucket"

    field_selector {
      field  = "resources.type"
      equals = ["AWS::S3::Object"]
    }

    field_selector {
      field  = "resources.ARN"
      starts_with = [aws_s3_bucket.primary.arn]
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-trail"
  })
}

# CloudWatch log group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  provider          = aws.primary
  name              = "/aws/cloudtrail/${var.project_name}"
  retention_in_days = 90

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudtrail-logs"
  })
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail" {
  provider = aws.primary
  name     = "${var.project_name}-cloudtrail-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudtrail.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudtrail-role"
  })
}

resource "aws_iam_role_policy" "cloudtrail" {
  provider = aws.primary
  role     = aws_iam_role.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
    }]
  })
}

# CloudWatch log stream for CloudTrail
resource "aws_cloudwatch_log_stream" "cloudtrail" {
  provider       = aws.primary
  name           = "${var.primary_account_id}-cloudtrail-stream"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
}

# Attach CloudWatch Logs to CloudTrail
resource "aws_cloudtrail_event_data_store" "main" {
  provider = aws.primary
  name     = "${var.project_name}-event-store"

  advanced_event_selector {
    name = "S3 cross-account access"

    field_selector {
      field  = "resources.type"
      equals = ["AWS::S3::Object"]
    }

    field_selector {
      field  = "resources.ARN"
      starts_with = [aws_s3_bucket.primary.arn]
    }

    field_selector {
      field  = "readOnly"
      equals = ["false"]
    }
  }

  retention_period = var.audit_log_retention_years * 365

  tags = merge(var.tags, {
    Name = "${var.project_name}-event-store"
  })
}
```

### lambda-access-validator.tf

```hcl
# Lambda function for access validation
resource "aws_iam_role" "lambda_access_validator" {
  provider = aws.primary
  name     = "${var.project_name}-lambda-access-validator-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_access_validator_basic" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_access_validator.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_access_validator" {
  provider = aws.primary
  role     = aws_iam_role.lambda_access_validator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.access_control.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketPolicy",
          "s3:GetBucketAcl"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.primary.account_id}:*"
      }
    ]
  })
}

# Package Lambda function
data "archive_file" "lambda_access_validator" {
  type        = "zip"
  source_file = "${path.module}/../lambda/access_validator.py"
  output_path = "${path.module}/../.terraform/lambda_packages/access_validator.zip"
}

resource "aws_lambda_function" "access_validator" {
  provider         = aws.primary
  filename         = data.archive_file.lambda_access_validator.output_path
  function_name    = "${var.project_name}-access-validator"
  role            = aws_iam_role.lambda_access_validator.arn
  handler         = "access_validator.lambda_handler"
  source_code_hash = data.archive_file.lambda_access_validator.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = 256

  environment {
    variables = {
      ACCESS_CONTROL_TABLE = aws_dynamodb_table.access_control.name
      PRIMARY_BUCKET       = aws_s3_bucket.primary.id
      LOG_LEVEL           = "INFO"
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-access-validator"
  })
}

# CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "lambda_access_validator" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.access_validator.function_name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-access-validator-logs"
  })
}

# Lambda permission for S3 to invoke
resource "aws_lambda_permission" "access_validator_s3" {
  provider      = aws.primary
  statement_id  = "AllowS3Invocation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.access_validator.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.primary.arn
}
```

### lambda-access-logger.tf

```hcl
# Lambda function for access logging
resource "aws_iam_role" "lambda_access_logger" {
  provider = aws.primary
  name     = "${var.project_name}-lambda-access-logger-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_access_logger_basic" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_access_logger.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_access_logger" {
  provider = aws.primary
  role     = aws_iam_role.lambda_access_logger.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = aws_dynamodb_table.audit_logs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:LookupEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.audit.arn}/cloudtrail/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.lambda_dlq.arn
      }
    ]
  })
}

# Package Lambda function
data "archive_file" "lambda_access_logger" {
  type        = "zip"
  source_file = "${path.module}/../lambda/access_logger.py"
  output_path = "${path.module}/../.terraform/lambda_packages/access_logger.zip"
}

resource "aws_lambda_function" "access_logger" {
  provider         = aws.primary
  filename         = data.archive_file.lambda_access_logger.output_path
  function_name    = "${var.project_name}-access-logger"
  role            = aws_iam_role.lambda_access_logger.arn
  handler         = "access_logger.lambda_handler"
  source_code_hash = data.archive_file.lambda_access_logger.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = 512
  reserved_concurrent_executions = 10

  environment {
    variables = {
      AUDIT_TABLE          = aws_dynamodb_table.audit_logs.name
      ACCESS_LOG_RETENTION = tostring(var.access_log_retention_days)
      BATCH_SIZE          = "25"
      LOG_LEVEL           = "INFO"
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-access-logger"
  })
}

# CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "lambda_access_logger" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.access_logger.function_name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-access-logger-logs"
  })
}

# EventBridge rule to trigger on CloudTrail events
resource "aws_cloudwatch_event_rule" "cloudtrail_s3_access" {
  provider    = aws.primary
  name        = "${var.project_name}-cloudtrail-s3-access"
  description = "Capture S3 access events from CloudTrail"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      requestParameters = {
        bucketName = [aws_s3_bucket.primary.id]
      }
    }
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudtrail-s3-access-rule"
  })
}

resource "aws_cloudwatch_event_target" "lambda_access_logger" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.cloudtrail_s3_access.name
  target_id = "LambdaAccessLogger"
  arn       = aws_lambda_function.access_logger.arn
}

resource "aws_lambda_permission" "access_logger_eventbridge" {
  provider      = aws.primary
  statement_id  = "AllowEventBridgeInvocation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.access_logger.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cloudtrail_s3_access.arn
}
```

### lambda-governance.tf

```hcl
# Lambda function for governance checks
resource "aws_iam_role" "lambda_governance" {
  provider = aws.primary
  name     = "${var.project_name}-lambda-governance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_governance_basic" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_governance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_governance" {
  provider = aws.primary
  role     = aws_iam_role.lambda_governance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies"
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.primary.account_id}:role/${var.project_name}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketPolicy",
          "s3:GetBucketAcl",
          "s3:GetBucketVersioning",
          "s3:GetBucketEncryption"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:ListGrants"
        ]
        Resource = aws_kms_key.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.access_control.arn
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

# Package Lambda function
data "archive_file" "lambda_governance" {
  type        = "zip"
  source_file = "${path.module}/../lambda/governance_check.py"
  output_path = "${path.module}/../.terraform/lambda_packages/governance_check.zip"
}

resource "aws_lambda_function" "governance" {
  provider         = aws.primary
  filename         = data.archive_file.lambda_governance.output_path
  function_name    = "${var.project_name}-governance-check"
  role            = aws_iam_role.lambda_governance.arn
  handler         = "governance_check.lambda_handler"
  source_code_hash = data.archive_file.lambda_governance.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = 512

  environment {
    variables = {
      ACCESS_CONTROL_TABLE = aws_dynamodb_table.access_control.name
      PRIMARY_BUCKET       = aws_s3_bucket.primary.id
      KMS_KEY_ID          = aws_kms_key.primary.id
      SNS_TOPIC_ARN       = aws_sns_topic.alerts.arn
      PROJECT_NAME        = var.project_name
      CONSUMER_ACCOUNTS   = jsonencode(var.consumer_accounts)
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-governance-check"
  })
}

# CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "lambda_governance" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.governance.function_name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-governance-logs"
  })
}

# EventBridge rule for daily execution
resource "aws_cloudwatch_event_rule" "governance_schedule" {
  provider            = aws.primary
  name                = "${var.project_name}-governance-schedule"
  description         = "Trigger governance checks daily"
  schedule_expression = "cron(0 2 * * ? *)"  # 2 AM UTC daily

  tags = merge(var.tags, {
    Name = "${var.project_name}-governance-schedule"
  })
}

resource "aws_cloudwatch_event_target" "lambda_governance" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.governance_schedule.name
  target_id = "LambdaGovernance"
  arn       = aws_lambda_function.governance.arn
}

resource "aws_lambda_permission" "governance_eventbridge" {
  provider      = aws.primary
  statement_id  = "AllowEventBridgeInvocation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.governance.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.governance_schedule.arn
}
```

### lambda-expiration.tf

```hcl
# Lambda function for access expiration enforcement
resource "aws_iam_role" "lambda_expiration" {
  provider = aws.primary
  name     = "${var.project_name}-lambda-expiration-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_expiration_basic" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_expiration.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_expiration" {
  provider = aws.primary
  role     = aws_iam_role.lambda_expiration.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect =
```
