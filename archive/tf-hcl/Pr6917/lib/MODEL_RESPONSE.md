# Multi-Account Security Framework - Terraform Implementation

This implementation provides a comprehensive multi-account security framework with centralized key management for PCI-DSS compliance.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource names to enable parallel deployments"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for multi-region resources"
  type        = string
  default     = "eu-west-1"
}

variable "cloudwatch_log_retention_days" {
  description = "Retention period for CloudWatch Logs"
  type        = number
  default     = 90
}

variable "kms_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
}

variable "security_ou_name" {
  description = "Name for Security Organizational Unit"
  type        = string
  default     = "Security"
}

variable "production_ou_name" {
  description = "Name for Production Organizational Unit"
  type        = string
  default     = "Production"
}

variable "development_ou_name" {
  description = "Name for Development Organizational Unit"
  type        = string
  default     = "Development"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "SecurityFramework"
    ManagedBy   = "Terraform"
    Compliance  = "PCI-DSS"
  }
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Backend configuration should be provided via backend config file
    # Example: terraform init -backend-config=backend.tfvars
    encrypt = true
  }
}

provider "aws" {
  region = var.primary_region

  default_tags {
    tags = var.tags
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = var.tags
  }
}
```

## File: lib/organizations.tf

```hcl
# AWS Organizations
resource "aws_organizations_organization" "main" {
  feature_set = "ALL"

  enabled_policy_types = [
    "SERVICE_CONTROL_POLICY",
    "TAG_POLICY"
  ]

  aws_service_access_principals = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "guardduty.amazonaws.com",
    "securityhub.amazonaws.com"
  ]
}

# Security Organizational Unit
resource "aws_organizations_organizational_unit" "security" {
  name      = "${var.security_ou_name}-${var.environment_suffix}"
  parent_id = aws_organizations_organization.main.roots[0].id
}

# Production Organizational Unit
resource "aws_organizations_organizational_unit" "production" {
  name      = "${var.production_ou_name}-${var.environment_suffix}"
  parent_id = aws_organizations_organization.main.roots[0].id
}

# Development Organizational Unit
resource "aws_organizations_organizational_unit" "development" {
  name      = "${var.development_ou_name}-${var.environment_suffix}"
  parent_id = aws_organizations_organization.main.roots[0].id
}
```

## File: lib/kms.tf

```hcl
# Primary KMS Key in us-east-1
resource "aws_kms_key" "primary" {
  description             = "Primary multi-region KMS key for ${var.environment_suffix}"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true
  multi_region            = true

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
        Sid    = "Allow services to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "logs.amazonaws.com",
            "config.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "primary-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "primary" {
  name          = "alias/primary-key-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

# Replica KMS Key in eu-west-1
resource "aws_kms_replica_key" "secondary" {
  provider = aws.secondary

  description             = "Secondary replica KMS key for ${var.environment_suffix}"
  deletion_window_in_days = var.kms_deletion_window
  primary_key_arn         = aws_kms_key.primary.arn

  tags = {
    Name = "secondary-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "secondary" {
  provider = aws.secondary

  name          = "alias/secondary-key-${var.environment_suffix}"
  target_key_id = aws_kms_replica_key.secondary.key_id
}

# KMS Key for Terraform State
resource "aws_kms_key" "terraform_state" {
  description             = "KMS key for Terraform state encryption ${var.environment_suffix}"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true

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
      }
    ]
  })

  tags = {
    Name = "terraform-state-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "terraform_state" {
  name          = "alias/terraform-state-${var.environment_suffix}"
  target_key_id = aws_kms_key.terraform_state.key_id
}
```

## File: lib/iam.tf

```hcl
# Security Audit Role
resource "aws_iam_role" "security_audit" {
  name = "security-audit-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "security-audit-role-${var.environment_suffix}"
  }
}

# Security Audit Policy - Read-only access
resource "aws_iam_policy" "security_audit" {
  name        = "security-audit-policy-${var.environment_suffix}"
  description = "Read-only security audit policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "s3:Get*",
          "s3:List*",
          "ec2:Describe*",
          "rds:Describe*",
          "iam:Get*",
          "iam:List*",
          "kms:Describe*",
          "kms:List*",
          "logs:Describe*",
          "logs:Get*",
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "organizations:Describe*",
          "organizations:List*",
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "security_audit" {
  role       = aws_iam_role.security_audit.name
  policy_arn = aws_iam_policy.security_audit.arn
}

# Cross-Account Access Role
resource "aws_iam_role" "cross_account_access" {
  name = "cross-account-access-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_organizations_organizational_unit.security.arn,
            aws_organizations_organizational_unit.production.arn,
            aws_organizations_organizational_unit.development.arn
          ]
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "cross-account-access-${var.environment_suffix}"
  }
}

# AWS Config IAM Role
resource "aws_iam_role" "config" {
  name = "aws-config-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "aws-config-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# Additional policy for Config to write to S3
resource "aws_iam_role_policy" "config_s3" {
  name = "config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      }
    ]
  })
}
```

## File: lib/scp.tf

```hcl
# Service Control Policy - Enforce S3 Encryption
resource "aws_organizations_policy" "enforce_s3_encryption" {
  name        = "enforce-s3-encryption-${var.environment_suffix}"
  description = "Enforce encryption for S3 buckets"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedS3Uploads"
        Effect = "Deny"
        Action = [
          "s3:PutObject"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = [
              "AES256",
              "aws:kms"
            ]
          }
        }
      },
      {
        Sid    = "DenyUnencryptedS3BucketCreation"
        Effect = "Deny"
        Action = [
          "s3:CreateBucket"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-bucket-encryption" = "true"
          }
        }
      }
    ]
  })
}

# Service Control Policy - Enforce EBS Encryption
resource "aws_organizations_policy" "enforce_ebs_encryption" {
  name        = "enforce-ebs-encryption-${var.environment_suffix}"
  description = "Enforce encryption for EBS volumes"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedEBSVolumes"
        Effect = "Deny"
        Action = [
          "ec2:CreateVolume",
          "ec2:RunInstances"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "ec2:Encrypted" = "false"
          }
        }
      }
    ]
  })
}

# Service Control Policy - Enforce RDS Encryption
resource "aws_organizations_policy" "enforce_rds_encryption" {
  name        = "enforce-rds-encryption-${var.environment_suffix}"
  description = "Enforce encryption for RDS databases"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedRDSInstances"
        Effect = "Deny"
        Action = [
          "rds:CreateDBInstance",
          "rds:CreateDBCluster"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "rds:StorageEncrypted" = "false"
          }
        }
      }
    ]
  })
}

# Service Control Policy - Prevent CloudWatch Logs Deletion
resource "aws_organizations_policy" "protect_cloudwatch_logs" {
  name        = "protect-cloudwatch-logs-${var.environment_suffix}"
  description = "Prevent disabling or deleting CloudWatch Logs"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyCloudWatchLogsDeletion"
        Effect = "Deny"
        Action = [
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream",
          "logs:PutRetentionPolicy"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:PrincipalArn" = [
              "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/security-audit-role-${var.environment_suffix}"
            ]
          }
        }
      }
    ]
  })
}

# Service Control Policy - Restrict Root User Actions
resource "aws_organizations_policy" "restrict_root_user" {
  name        = "restrict-root-user-${var.environment_suffix}"
  description = "Restrict root user actions"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyRootUserActions"
        Effect = "Deny"
        Action = [
          "iam:*",
          "organizations:*",
          "account:*"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:PrincipalArn" = "arn:aws:iam::*:root"
          }
        }
      }
    ]
  })
}

# Service Control Policy - Enforce Tagging
resource "aws_organizations_policy" "enforce_tagging" {
  name        = "enforce-tagging-${var.environment_suffix}"
  description = "Enforce mandatory resource tagging"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyResourceCreationWithoutTags"
        Effect = "Deny"
        Action = [
          "ec2:RunInstances",
          "rds:CreateDBInstance",
          "s3:CreateBucket"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:RequestTag/Project"    = "true",
            "aws:RequestTag/Environment" = "true"
          }
        }
      }
    ]
  })
}

# Attach SCPs to OUs
resource "aws_organizations_policy_attachment" "security_s3" {
  policy_id = aws_organizations_policy.enforce_s3_encryption.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_s3" {
  policy_id = aws_organizations_policy.enforce_s3_encryption.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_s3" {
  policy_id = aws_organizations_policy.enforce_s3_encryption.id
  target_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_policy_attachment" "security_ebs" {
  policy_id = aws_organizations_policy.enforce_ebs_encryption.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_ebs" {
  policy_id = aws_organizations_policy.enforce_ebs_encryption.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_ebs" {
  policy_id = aws_organizations_policy.enforce_ebs_encryption.id
  target_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_policy_attachment" "security_rds" {
  policy_id = aws_organizations_policy.enforce_rds_encryption.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_rds" {
  policy_id = aws_organizations_policy.enforce_rds_encryption.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_rds" {
  policy_id = aws_organizations_policy.enforce_rds_encryption.id
  target_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_policy_attachment" "security_logs" {
  policy_id = aws_organizations_policy.protect_cloudwatch_logs.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_logs" {
  policy_id = aws_organizations_policy.protect_cloudwatch_logs.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_logs" {
  policy_id = aws_organizations_policy.protect_cloudwatch_logs.id
  target_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_policy_attachment" "security_root" {
  policy_id = aws_organizations_policy.restrict_root_user.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_root" {
  policy_id = aws_organizations_policy.restrict_root_user.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_root" {
  policy_id = aws_organizations_policy.restrict_root_user.id
  target_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_policy_attachment" "security_tagging" {
  policy_id = aws_organizations_policy.enforce_tagging.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_tagging" {
  policy_id = aws_organizations_policy.enforce_tagging.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_tagging" {
  policy_id = aws_organizations_policy.enforce_tagging.id
  target_id = aws_organizations_organizational_unit.development.id
}
```

## File: lib/cloudwatch.tf

```hcl
# CloudWatch Log Group for IAM Activity
resource "aws_cloudwatch_log_group" "iam_activity" {
  name              = "/aws/iam/activity-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = {
    Name = "iam-activity-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Organizations Activity
resource "aws_cloudwatch_log_group" "organizations_activity" {
  name              = "/aws/organizations/activity-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = {
    Name = "organizations-activity-logs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Config Activity
resource "aws_cloudwatch_log_group" "config_activity" {
  name              = "/aws/config/activity-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.primary.arn

  tags = {
    Name = "config-activity-logs-${var.environment_suffix}"
  }
}
```

## File: lib/s3.tf

```hcl
# S3 Bucket for AWS Config
resource "aws_s3_bucket" "config" {
  bucket = "aws-config-bucket-${var.environment_suffix}"

  tags = {
    Name = "aws-config-bucket-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for Config
resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketPutObject"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# S3 Bucket for Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-${var.environment_suffix}"

  tags = {
    Name = "terraform-state-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform_state.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB Table for Terraform State Locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "terraform-state-lock-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.terraform_state.arn
  }

  tags = {
    Name = "terraform-state-lock-${var.environment_suffix}"
  }
}
```

## File: lib/config.tf

```hcl
# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "config-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config.id

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Recorder Status
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Rule - S3 Bucket Encryption
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Rule - EBS Encryption
resource "aws_config_config_rule" "ebs_encryption" {
  name = "ebs-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Rule - RDS Encryption
resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Rule - CloudWatch Log Group Encryption
resource "aws_config_config_rule" "cloudwatch_log_group_encrypted" {
  name = "cloudwatch-log-group-encrypted-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "CLOUDWATCH_LOG_GROUP_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Rule - IAM Password Policy
resource "aws_config_config_rule" "iam_password_policy" {
  name = "iam-password-policy-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  input_parameters = jsonencode({
    RequireUppercaseCharacters = true
    RequireLowercaseCharacters = true
    RequireSymbols             = true
    RequireNumbers             = true
    MinimumPasswordLength      = 14
  })

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Rule - Root MFA Enabled
resource "aws_config_config_rule" "root_mfa_enabled" {
  name = "root-mfa-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}
```

## File: lib/data.tf

```hcl
# Current AWS Account ID
data "aws_caller_identity" "current" {}

# Current AWS Region
data "aws_region" "current" {}
```

## File: lib/outputs.tf

```hcl
output "organization_id" {
  description = "AWS Organization ID"
  value       = aws_organizations_organization.main.id
}

output "organization_arn" {
  description = "AWS Organization ARN"
  value       = aws_organizations_organization.main.arn
}

output "security_ou_id" {
  description = "Security OU ID"
  value       = aws_organizations_organizational_unit.security.id
}

output "production_ou_id" {
  description = "Production OU ID"
  value       = aws_organizations_organizational_unit.production.id
}

output "development_ou_id" {
  description = "Development OU ID"
  value       = aws_organizations_organizational_unit.development.id
}

output "primary_kms_key_id" {
  description = "Primary KMS Key ID"
  value       = aws_kms_key.primary.id
}

output "primary_kms_key_arn" {
  description = "Primary KMS Key ARN"
  value       = aws_kms_key.primary.arn
}

output "secondary_kms_key_id" {
  description = "Secondary KMS Key ID"
  value       = aws_kms_replica_key.secondary.id
}

output "secondary_kms_key_arn" {
  description = "Secondary KMS Key ARN"
  value       = aws_kms_replica_key.secondary.arn
}

output "terraform_state_kms_key_id" {
  description = "Terraform State KMS Key ID"
  value       = aws_kms_key.terraform_state.id
}

output "terraform_state_kms_key_arn" {
  description = "Terraform State KMS Key ARN"
  value       = aws_kms_key.terraform_state.arn
}

output "security_audit_role_arn" {
  description = "Security Audit Role ARN"
  value       = aws_iam_role.security_audit.arn
}

output "cross_account_access_role_arn" {
  description = "Cross-Account Access Role ARN"
  value       = aws_iam_role.cross_account_access.arn
}

output "config_bucket_name" {
  description = "AWS Config S3 Bucket Name"
  value       = aws_s3_bucket.config.id
}

output "terraform_state_bucket_name" {
  description = "Terraform State S3 Bucket Name"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_lock_table_name" {
  description = "Terraform State Lock DynamoDB Table Name"
  value       = aws_dynamodb_table.terraform_state_lock.id
}

output "iam_activity_log_group_name" {
  description = "IAM Activity CloudWatch Log Group Name"
  value       = aws_cloudwatch_log_group.iam_activity.name
}

output "organizations_activity_log_group_name" {
  description = "Organizations Activity CloudWatch Log Group Name"
  value       = aws_cloudwatch_log_group.organizations_activity.name
}

output "config_activity_log_group_name" {
  description = "Config Activity CloudWatch Log Group Name"
  value       = aws_cloudwatch_log_group.config_activity.name
}
```

## Deployment Instructions

### Prerequisites
- AWS Organizations must be enabled in the management account
- Terraform 1.5+ installed
- AWS CLI configured with management account credentials
- Required permissions: Organizations, IAM, KMS, S3, Config, CloudWatch Logs

### Initialize and Deploy

1. **Configure Variables**:
   ```bash
   # Create terraform.tfvars
   echo 'environment_suffix = "prod-12345"' > terraform.tfvars
   ```

2. **Initialize Terraform**:
   ```bash
   terraform init
   ```

3. **Plan and Deploy**:
   ```bash
   terraform plan
   terraform apply
   ```

### Security Considerations
- All KMS keys have automatic rotation enabled
- IAM roles require MFA for assume role operations
- SCPs enforce encryption across all accounts
- CloudWatch Logs retention set to 90 days
- AWS Config monitors compliance continuously
- Security audit role has read-only access only
- Terraform state encrypted with KMS
