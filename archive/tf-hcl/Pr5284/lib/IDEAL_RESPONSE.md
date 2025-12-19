# Zero-Trust AWS Security Infrastructure - Ideal Response

This document provides the complete Terraform implementation for a zero-trust AWS security framework meeting
PCI-DSS compliance requirements for a financial services company.

## Architecture Overview

This infrastructure implements comprehensive security controls across multiple AWS accounts including:

- Multi-factor authentication requirements for all role assumptions
- Encryption at rest for all data (S3, RDS, EBS) using KMS with automatic key rotation
- Regional restrictions enforcing us-east-1 and us-west-2 only
- Comprehensive CloudWatch monitoring with security alarms
- AWS Config rules for continuous compliance monitoring
- Systems Manager Session Manager for secure EC2 access without SSH keys
- Tag enforcement policies requiring Environment, Owner, and CostCenter tags
- Cross-account audit role with read-only access
- IAM permission boundaries preventing privilege escalation

## File Structure

```text
lib/
├── provider.tf          # AWS provider and S3 backend configuration
├── main.tf              # Central data sources
├── variables.tf         # Input variables with validation
├── locals.tf            # Naming conventions and reusable values
├── iam.tf               # IAM roles, policies, password policy
├── kms.tf               # KMS keys for S3, RDS, EBS encryption
├── scp.tf               # Service Control Policies
├── cloudwatch.tf        # Monitoring, alarms, dashboards
├── config.tf            # AWS Config compliance rules
├── session-manager.tf   # SSM Session Manager setup
├── tagging.tf           # Tag enforcement and auto-tagging
├── lambda/              # Lambda function directory
│   └── auto-tagging.py  # Auto-tagging Lambda function code
├── audit-role.tf        # Cross-account audit role
└── outputs.tf           # Stack outputs
```

## Complete Terraform Code

### provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

### main.tf

```hcl
# main.tf - Main entry point for zero-trust security infrastructure
# This module implements PCI-DSS compliant security controls for AWS

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current AWS region
data "aws_region" "current" {}

# Data source for AWS Organizations (conditional)
data "aws_organizations_organization" "current" {
  count = var.enable_organization_policies ? 1 : 0
}

# Note: This is a modular Terraform configuration with resources organized across multiple files:
# - provider.tf: AWS provider and backend configuration
# - variables.tf: Input variables and validation rules
# - locals.tf: Local values and naming conventions
# - iam.tf: IAM roles, policies, and permission boundaries
# - kms.tf: KMS keys for encryption (S3, RDS, EBS)
# - scp.tf: Service Control Policies (when organization access available)
# - cloudwatch.tf: CloudWatch monitoring, alarms, and dashboards
# - config.tf: AWS Config rules for compliance monitoring
# - session-manager.tf: Systems Manager Session Manager configuration
# - tagging.tf: Tag enforcement policies and auto-tagging Lambda
# - audit-role.tf: Cross-account audit role for security team
# - outputs.tf: Output values for deployed resources

```

### variables.tf

```hcl
# variables.tf - All input variables with sensible defaults

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = can(regex("^(us|eu|ap|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast|southwest)-[1-9]$", var.aws_region))
    error_message = "Must be a valid AWS region identifier."
  }
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "security-framework"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,28}[a-z0-9]$", var.project_name))
    error_message = "Project name must be lowercase alphanumeric with hyphens, 4-30 characters."
  }
}

variable "allowed_regions" {
  description = "List of allowed AWS regions"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

variable "allowed_environments" {
  description = "List of allowed environment tag values"
  type        = list(string)
  default     = ["dev", "staging", "prod"]
}

variable "cost_centers" {
  description = "List of valid cost center codes"
  type        = list(string)
  default     = ["IT", "Engineering", "Finance", "Operations", "Security"]
}

variable "prohibited_instance_types" {
  description = "List of prohibited EC2 instance types"
  type        = list(string)
  default     = ["*.8xlarge", "*.12xlarge", "*.16xlarge", "*.24xlarge", "*.32xlarge"]
}

variable "security_team_email" {
  description = "Email address for security alerts"
  type        = string
  default     = "security-alerts@example.com"
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.security_team_email))
    error_message = "Must be a valid email address."
  }
}

variable "audit_account_ids" {
  description = "List of AWS account IDs that can assume the audit role"
  type        = list(string)
  default     = []
  validation {
    condition     = alltrue([for id in var.audit_account_ids : can(regex("^\\d{12}$", id))])
    error_message = "All audit account IDs must be 12-digit AWS account IDs."
  }
}

variable "audit_external_id" {
  description = "External ID for secure cross-account audit role assumption"
  type        = string
  default     = "change-me-external-id-minimum-32-characters-required-for-security"
  sensitive   = true
  validation {
    condition     = length(var.audit_external_id) >= 32
    error_message = "External ID must be at least 32 characters for security."
  }
}

variable "target_organizational_units" {
  description = "List of organizational unit IDs to apply SCPs and tag policies"
  type        = list(string)
  default     = []
}

variable "enable_hybrid_activation" {
  description = "Enable SSM activation for hybrid/on-premises servers"
  type        = bool
  default     = false
}

variable "hybrid_activation_limit" {
  description = "Maximum number of on-premises servers that can be registered"
  type        = number
  default     = 10
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
  validation {
    condition     = var.kms_key_deletion_window >= 7 && var.kms_key_deletion_window <= 30
    error_message = "KMS key deletion window must be between 7 and 30 days."
  }
}

variable "cloudtrail_retention_days" {
  description = "CloudTrail log retention in days"
  type        = number
  default     = 365
}

variable "session_timeout_minutes" {
  description = "Session Manager idle timeout in minutes"
  type        = number
  default     = 20
  validation {
    condition     = var.session_timeout_minutes >= 1 && var.session_timeout_minutes <= 60
    error_message = "Session timeout must be between 1 and 60 minutes."
  }
}

variable "enable_auto_tagging" {
  description = "Enable automatic tagging of new resources"
  type        = bool
  default     = true
}

variable "enable_config_rules" {
  description = "Enable AWS Config rules for compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable GuardDuty threat detection"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub"
  type        = bool
  default     = true
}

variable "enable_organization_policies" {
  description = "Enable AWS Organizations policies (SCPs and tag policies). Requires organization admin access."
  type        = bool
  default     = false
}

variable "enable_config_recorder" {
  description = "Enable AWS Config recorder and delivery channel. Set to false if account already has Config enabled."
  type        = bool
  default     = false
}

variable "enable_audit_role" {
  description = "Enable cross-account audit role. Requires audit_account_ids to be specified."
  type        = bool
  default     = false
}```

### locals.tf

```hcl
# locals.tf - Naming conventions and reusable values

locals {
  # Naming prefix for all resources
  name_prefix = "${var.project_name}-${var.environment}"

  # Common mandatory tags
  mandatory_tags = merge(
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Purpose     = "PCI-DSS-Compliance"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    },
    var.additional_tags
  )

  # Account and organization information
  account_id = data.aws_caller_identity.current.account_id
  org_id     = var.enable_organization_policies ? data.aws_organizations_organization.current[0].id : null

  # Region-specific service endpoints
  s3_service_endpoints = [
    for region in var.allowed_regions : "s3.${region}.amazonaws.com"
  ]

  rds_service_endpoints = [
    for region in var.allowed_regions : "rds.${region}.amazonaws.com"
  ]

  ec2_service_endpoints = [
    for region in var.allowed_regions : "ec2.${region}.amazonaws.com"
  ]

  # Compliance standards
  compliance_standards = {
    password_min_length       = 14
    password_max_age          = 90
    password_reuse_prevention = 24
    mfa_max_age_seconds       = 3600
    session_max_duration      = 43200 # 12 hours
    log_retention_days        = 365
  }

  # Resource limits
  resource_limits = {
    max_iam_policies_per_role = 10
    max_tags_per_resource     = 50
    max_kms_key_aliases       = 100
  }

  # Notification settings
  notification_settings = {
    alarm_evaluation_periods  = 1
    alarm_period_seconds      = 300
    alarm_datapoints_to_alarm = 1
  }

  # Service principal mapping
  service_principals = {
    config        = "config.amazonaws.com"
    cloudtrail    = "cloudtrail.amazonaws.com"
    lambda        = "lambda.amazonaws.com"
    events        = "events.amazonaws.com"
    ssm           = "ssm.amazonaws.com"
    ec2           = "ec2.amazonaws.com"
    s3            = "s3.amazonaws.com"
    rds           = "rds.amazonaws.com"
    organizations = "organizations.amazonaws.com"
  }

  # CloudWatch alarm thresholds
  alarm_thresholds = {
    root_usage_count         = 0
    unauthorized_api_count   = 10
    iam_policy_changes_count = 0
    signin_failures_count    = 5
  }

  # Lambda function settings
  lambda_settings = {
    runtime = "python3.9"
    timeout = 60
    memory  = 128
  }

  # S3 bucket naming
  s3_bucket_names = {
    config       = "${local.name_prefix}-config-bucket-${local.account_id}"
    session_logs = "${local.name_prefix}-session-logs-${local.account_id}"
    cloudtrail   = "${local.name_prefix}-cloudtrail-${local.account_id}"
  }

  # CloudWatch log group names
  log_group_names = {
    audit   = "/aws/audit/${local.name_prefix}"
    session = "/aws/ssm/${local.name_prefix}-sessions"
    lambda  = "/aws/lambda/${local.name_prefix}"
  }
}

# Timestamp for resource creation tracking
locals {
  current_timestamp = timestamp()
  current_date      = formatdate("YYYY-MM-DD", local.current_timestamp)
  current_year      = formatdate("YYYY", local.current_timestamp)
}

# Environment-specific settings
locals {
  is_production = var.environment == "prod"

  # Stricter settings for production
  deletion_protection = local.is_production ? true : false
  backup_enabled      = local.is_production ? true : false

  # Environment-specific retention
  retention_days = {
    dev     = 90
    staging = 180
    prod    = 365
  }
}```

### iam.tf

```hcl
# iam.tf - IAM roles, policies, and permission boundaries

# Password policy for the account
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_uppercase_characters   = true
  require_lowercase_characters   = true
  require_numbers                = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 24
  hard_expiry                    = false
}

# Permission boundary for developers
resource "aws_iam_policy" "developer_permission_boundary" {
  name        = "${local.name_prefix}-developer-permission-boundary"
  description = "Permission boundary for developer roles to prevent privilege escalation"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListUsers",
          "iam:ListRoles"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnAccessKeys"
        Effect = "Allow"
        Action = [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:ListAccessKeys",
          "iam:UpdateAccessKey"
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/$${aws:username}"
      },
      {
        Sid    = "DenyAdminActions"
        Effect = "Deny"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicy",
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "organizations:*",
          "account:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyPermissionBoundaryDeletion"
        Effect = "Deny"
        Action = [
          "iam:DeleteRolePermissionsBoundary",
          "iam:DeleteUserPermissionsBoundary"
        ]
        Resource = "*"
      }
    ]
  })
}

# Trust policy for assuming roles with MFA
data "aws_iam_policy_document" "assume_role_with_mfa" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = ["sts:AssumeRole"]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = ["3600"] # MFA must be used within last hour
    }
  }
}

# Developer role
resource "aws_iam_role" "developer" {
  name                 = "${local.name_prefix}-developer-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_with_mfa.json
  permissions_boundary = aws_iam_policy.developer_permission_boundary.arn
  max_session_duration = 14400 # 4 hours

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Developer policy
resource "aws_iam_policy" "developer_policy" {
  name        = "${local.name_prefix}-developer-policy"
  description = "Policy for developer role with restricted permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2ReadOnly"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:List*",
          "ec2:Get*"
        ]
        Resource = "*"
      },
      {
        Sid    = "EC2ManageOwnInstances"
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:TerminateInstances"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion"   = var.allowed_regions
            "ec2:ResourceTag/Owner" = "$${aws:username}"
          }
        }
      },
      {
        Sid    = "S3ListBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging"
        ]
        Resource = "arn:aws:s3:::*"
      },
      {
        Sid    = "S3DevBucketAccess"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "arn:aws:s3:::${local.name_prefix}-dev-*",
          "arn:aws:s3:::${local.name_prefix}-dev-*/*"
        ]
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid      = "RequireEncryption"
        Effect   = "Deny"
        Action   = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/application/${local.name_prefix}-*"
      }
    ]
  })
}

# Attach policy to developer role
resource "aws_iam_role_policy_attachment" "developer_policy" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.developer_policy.arn
}

# Operations role
resource "aws_iam_role" "operations" {
  name                 = "${local.name_prefix}-operations-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_with_mfa.json
  max_session_duration = 28800 # 8 hours

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Operations policy
resource "aws_iam_policy" "operations_policy" {
  name        = "${local.name_prefix}-operations-policy"
  description = "Policy for operations role with production access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2DescribeActions"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:Get*",
          "ec2:List*"
        ]
        Resource = "*"
      },
      {
        Sid    = "EC2InstanceManagement"
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:TerminateInstances",
          "ec2:CreateTags",
          "ec2:DeleteTags",
          "ec2:ModifyInstanceAttribute",
          "ec2:RunInstances"
        ]
        Resource = [
          "arn:aws:ec2:*:${data.aws_caller_identity.current.account_id}:instance/*",
          "arn:aws:ec2:*:${data.aws_caller_identity.current.account_id}:volume/*",
          "arn:aws:ec2:*:${data.aws_caller_identity.current.account_id}:network-interface/*",
          "arn:aws:ec2:*::image/*",
          "arn:aws:ec2:*:${data.aws_caller_identity.current.account_id}:security-group/*",
          "arn:aws:ec2:*:${data.aws_caller_identity.current.account_id}:subnet/*"
        ]
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
        }
      },
      {
        Sid    = "EC2VolumeManagement"
        Effect = "Allow"
        Action = [
          "ec2:CreateVolume",
          "ec2:DeleteVolume",
          "ec2:AttachVolume",
          "ec2:DetachVolume",
          "ec2:CreateSnapshot",
          "ec2:DeleteSnapshot"
        ]
        Resource = [
          "arn:aws:ec2:*:${data.aws_caller_identity.current.account_id}:volume/*",
          "arn:aws:ec2:*:${data.aws_caller_identity.current.account_id}:snapshot/*",
          "arn:aws:ec2:*:${data.aws_caller_identity.current.account_id}:instance/*"
        ]
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
        }
      },
      {
        Sid    = "RDSManagement"
        Effect = "Allow"
        Action = [
          "rds:Describe*",
          "rds:List*",
          "rds:CreateDBSnapshot",
          "rds:RestoreDBInstanceFromDBSnapshot",
          "rds:ModifyDBInstance",
          "rds:RebootDBInstance"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
        }
      },
      {
        Sid    = "S3BucketManagement"
        Effect = "Allow"
        Action = [
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetBucketTagging",
          "s3:PutBucketTagging",
          "s3:PutBucketVersioning",
          "s3:PutBucketLogging",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetBucketPublicAccessBlock",
          "s3:GetBucketAcl",
          "s3:GetBucketPolicy"
        ]
        Resource = "arn:aws:s3:::${local.name_prefix}-*"
      },
      {
        Sid    = "S3ObjectManagement"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:DeleteObjectVersion",
          "s3:GetObjectAcl",
          "s3:PutObjectAcl",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload"
        ]
        Resource = "arn:aws:s3:::${local.name_prefix}-*/*"
      },
      {
        Sid    = "S3GlobalReadAccess"
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets",
          "s3:GetBucketLocation"
        ]
        Resource = "arn:aws:s3:::*"
      },
      {
        Sid      = "DenyUnencryptedUploads"
        Effect   = "Deny"
        Action   = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "CloudWatchAccess"
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:DescribeAlarms",
          "cloudwatch:DescribeAlarmsForMetric",
          "cloudwatch:PutMetricAlarm",
          "cloudwatch:DeleteAlarms",
          "cloudwatch:SetAlarmState"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchLogsAccess"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = [
          "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/*",
          "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/*:log-stream:*"
        ]
      },
      {
        Sid    = "SystemsManagerAccess"
        Effect = "Allow"
        Action = [
          "ssm:StartSession",
          "ssm:TerminateSession",
          "ssm:ResumeSession",
          "ssm:DescribeSessions",
          "ssm:GetConnectionStatus",
          "ssm:DescribeInstanceInformation",
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel",
          "ec2messages:GetMessages",
          "ec2messages:SendReply",
          "ec2messages:AcknowledgeMessage"
        ]
        Resource = "*"
      },
      {
        Sid    = "KMSUsage"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey",
          "kms:ListKeys",
          "kms:ListAliases"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "s3.${var.allowed_regions[0]}.amazonaws.com",
              "s3.${var.allowed_regions[1]}.amazonaws.com",
              "rds.${var.allowed_regions[0]}.amazonaws.com",
              "rds.${var.allowed_regions[1]}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# Attach policy to operations role
resource "aws_iam_role_policy_attachment" "operations_policy" {
  role       = aws_iam_role.operations.name
  policy_arn = aws_iam_policy.operations_policy.arn
}

# Security team role
resource "aws_iam_role" "security" {
  name                 = "${local.name_prefix}-security-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_with_mfa.json
  max_session_duration = 43200 # 12 hours

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Security team policy
resource "aws_iam_policy" "security_policy" {
  name        = "${local.name_prefix}-security-policy"
  description = "Policy for security team with audit and compliance capabilities"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecurityAuditAccess"
        Effect = "Allow"
        Action = [
          "access-analyzer:*",
          "cloudtrail:LookupEvents",
          "cloudtrail:GetTrailStatus",
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetEventSelectors",
          "cloudtrail:ListTags",
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "guardduty:Get*",
          "guardduty:List*",
          "iam:GenerateCredentialReport",
          "iam:GetCredentialReport",
          "iam:List*",
          "iam:GetAccountAuthorizationDetails",
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:GetLoginProfile",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:GetUser",
          "iam:GetUserPolicy",
          "inspector:*",
          "securityhub:*",
          "ssm:GetComplianceSummary",
          "ssm:ListComplianceItems",
          "ssm:ListAssociations",
          "ssm:DescribeInstanceInformation",
          "trustedadvisor:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "KMSKeyManagement"
        Effect = "Allow"
        Action = [
          "kms:CreateGrant",
          "kms:CreateKey",
          "kms:DescribeKey",
          "kms:EnableKeyRotation",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus",
          "kms:ListKeys",
          "kms:ListAliases",
          "kms:ListGrants",
          "kms:ListKeyPolicies",
          "kms:PutKeyPolicy",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion"
        ]
        Resource = "*"
      },
      {
        Sid    = "ConfigRuleManagement"
        Effect = "Allow"
        Action = [
          "config:PutConfigRule",
          "config:DeleteConfigRule",
          "config:PutConfigurationRecorder",
          "config:PutDeliveryChannel"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to security role
resource "aws_iam_role_policy_attachment" "security_policy" {
  role       = aws_iam_role.security.name
  policy_arn = aws_iam_policy.security_policy.arn
}

# Attach AWS managed SecurityAudit policy
resource "aws_iam_role_policy_attachment" "security_audit" {
  role       = aws_iam_role.security.name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}```

### kms.tf

```hcl
# kms.tf - KMS keys with rotation and proper policies

# KMS key for S3 encryption
resource "aws_kms_key" "s3" {
  description             = "${local.name_prefix} S3 encryption key"
  deletion_window_in_days = 30
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
        Action = [
          "kms:Create*",
          "kms:Describe*",
          "kms:Enable*",
          "kms:List*",
          "kms:Put*",
          "kms:Update*",
          "kms:Revoke*",
          "kms:Disable*",
          "kms:Get*",
          "kms:Delete*",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:RetireGrant",
          "kms:RevokeGrant"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 service to use the key"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.mandatory_tags, {
    Purpose = "S3-Encryption"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# KMS key alias for S3
resource "aws_kms_alias" "s3" {
  name          = "alias/${local.name_prefix}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "${local.name_prefix} RDS encryption key"
  deletion_window_in_days = 30
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
        Action = [
          "kms:Create*",
          "kms:Describe*",
          "kms:Enable*",
          "kms:List*",
          "kms:Put*",
          "kms:Update*",
          "kms:Revoke*",
          "kms:Disable*",
          "kms:Get*",
          "kms:Delete*",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:RetireGrant",
          "kms:RevokeGrant"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "rds.${var.allowed_regions[0]}.amazonaws.com",
              "rds.${var.allowed_regions[1]}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })

  tags = merge(local.mandatory_tags, {
    Purpose = "RDS-Encryption"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# KMS key alias for RDS
resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS key for EBS encryption
resource "aws_kms_key" "ebs" {
  description             = "${local.name_prefix} EBS encryption key"
  deletion_window_in_days = 30
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
        Action = [
          "kms:Create*",
          "kms:Describe*",
          "kms:Enable*",
          "kms:List*",
          "kms:Put*",
          "kms:Update*",
          "kms:Revoke*",
          "kms:Disable*",
          "kms:Get*",
          "kms:Delete*",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:RetireGrant",
          "kms:RevokeGrant"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow EC2 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "ec2.${var.allowed_regions[0]}.amazonaws.com",
              "ec2.${var.allowed_regions[1]}.amazonaws.com"
            ]
          }
        }
      },
      {
        Sid    = "Allow attachment of persistent resources"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.developer.arn,
            aws_iam_role.operations.arn
          ]
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      }
    ]
  })

  tags = merge(local.mandatory_tags, {
    Purpose = "EBS-Encryption"
  })

  lifecycle {
    prevent_destroy = false
  }
}

# KMS key alias for EBS
resource "aws_kms_alias" "ebs" {
  name          = "alias/${local.name_prefix}-ebs"
  target_key_id = aws_kms_key.ebs.key_id
}

# Enable EBS encryption by default
resource "aws_ebs_encryption_by_default" "enabled" {
  enabled = true
}

# Set default EBS encryption key
resource "aws_ebs_default_kms_key" "ebs" {
  key_arn = aws_kms_key.ebs.arn
}```

### scp.tf

```hcl
# scp.tf - Service Control Policies for regional restrictions
# Note: These resources require AWS Organizations admin access
# Set var.enable_organization_policies = true to deploy

# SCP to restrict regions
resource "aws_organizations_policy" "region_restriction" {
  count       = var.enable_organization_policies ? 1 : 0
  name        = "${local.name_prefix}-region-restriction"
  description = "Restrict all actions to allowed regions only"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyAllOutsideAllowedRegions"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
        }
      },
      {
        Sid      = "DenyRootAccountUsage"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:PrincipalArn" = "arn:aws:iam::*:root"
          }
        }
      },
      {
        Sid    = "RequireMFAForDeletion"
        Effect = "Deny"
        Action = [
          "ec2:TerminateInstances",
          "rds:DeleteDBInstance",
          "s3:DeleteBucket",
          "dynamodb:DeleteTable"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
      {
        Sid    = "PreventDisablingCloudTrail"
        Effect = "Deny"
        Action = [
          "cloudtrail:StopLogging",
          "cloudtrail:DeleteTrail",
          "cloudtrail:UpdateTrail"
        ]
        Resource = "*"
      },
      {
        Sid    = "PreventDisablingConfig"
        Effect = "Deny"
        Action = [
          "config:DeleteConfigurationRecorder",
          "config:DeleteDeliveryChannel",
          "config:StopConfigurationRecorder"
        ]
        Resource = "*"
      },
      {
        Sid      = "EnforceSecureTransport"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# SCP to enforce encryption
resource "aws_organizations_policy" "encryption_enforcement" {
  count       = var.enable_organization_policies ? 1 : 0
  name        = "${local.name_prefix}-encryption-enforcement"
  description = "Enforce encryption for all data at rest"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyUnencryptedObjectUploads"
        Effect   = "Deny"
        Action   = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = ["aws:kms", "AES256"]
          }
        }
      },
      {
        Sid    = "DenyUnencryptedRDSInstances"
        Effect = "Deny"
        Action = [
          "rds:CreateDBInstance",
          "rds:RestoreDBInstanceFromDBSnapshot",
          "rds:RestoreDBInstanceFromS3"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "rds:StorageEncrypted" = "false"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedEBSVolumes"
        Effect = "Deny"
        Action = [
          "ec2:CreateVolume",
          "ec2:RunInstances"
        ]
        Resource = "arn:aws:ec2:*:*:volume/*"
        Condition = {
          Bool = {
            "ec2:Encrypted" = "false"
          }
        }
      }
    ]
  })
}

# Attach SCPs to organizational units or accounts
# Note: You'll need to specify the target_id based on your org structure
resource "aws_organizations_policy_attachment" "region_restriction" {
  count     = var.enable_organization_policies ? length(var.target_organizational_units) : 0
  policy_id = aws_organizations_policy.region_restriction[0].id
  target_id = var.target_organizational_units[count.index]
}

resource "aws_organizations_policy_attachment" "encryption_enforcement" {
  count     = var.enable_organization_policies ? length(var.target_organizational_units) : 0
  policy_id = aws_organizations_policy.encryption_enforcement[0].id
  target_id = var.target_organizational_units[count.index]
}```

### cloudwatch.tf

```hcl
# cloudwatch.tf - CloudWatch alarms and monitoring setup

# SNS topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts"
  kms_master_key_id = aws_kms_key.s3.id

  tags = local.mandatory_tags
}

# SNS topic subscription
resource "aws_sns_topic_subscription" "security_team" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_email
}

# CloudWatch log group for audit logs
resource "aws_cloudwatch_log_group" "audit_logs" {
  name              = "/aws/audit/${local.name_prefix}"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.s3.arn

  depends_on = [aws_kms_key.s3]

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Metric filter for root account usage
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${local.name_prefix}-root-account-usage"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{ ($.userIdentity.type = \"Root\") && ($.userIdentity.invokedBy NOT EXISTS) && ($.eventType != \"AwsServiceEvent\") }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for root account usage
resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "${local.name_prefix}-root-account-usage"
  alarm_description   = "Alert when root account is used"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# Metric filter for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api" {
  name           = "${local.name_prefix}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_api" {
  alarm_name          = "${local.name_prefix}-unauthorized-api-calls"
  alarm_description   = "Alert on unauthorized API calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# Metric filter for IAM policy changes
resource "aws_cloudwatch_log_metric_filter" "iam_changes" {
  name           = "${local.name_prefix}-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{($.eventName=DeleteGroupPolicy)||($.eventName=DeleteRolePolicy)||($.eventName=DeleteUserPolicy)||($.eventName=PutGroupPolicy)||($.eventName=PutRolePolicy)||($.eventName=PutUserPolicy)||($.eventName=CreatePolicy)||($.eventName=DeletePolicy)||($.eventName=CreatePolicyVersion)||($.eventName=DeletePolicyVersion)||($.eventName=AttachRolePolicy)||($.eventName=DetachRolePolicy)||($.eventName=AttachUserPolicy)||($.eventName=DetachUserPolicy)||($.eventName=AttachGroupPolicy)||($.eventName=DetachGroupPolicy)}"

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for IAM policy changes
resource "aws_cloudwatch_metric_alarm" "iam_changes" {
  alarm_name          = "${local.name_prefix}-iam-policy-changes"
  alarm_description   = "Alert on IAM policy changes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChanges"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# Metric filter for console sign-in failures
resource "aws_cloudwatch_log_metric_filter" "console_signin_failure" {
  name           = "${local.name_prefix}-console-signin-failures"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }"

  metric_transformation {
    name      = "ConsoleSignInFailures"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for console sign-in failures
resource "aws_cloudwatch_metric_alarm" "console_signin_failure" {
  alarm_name          = "${local.name_prefix}-console-signin-failures"
  alarm_description   = "Alert on multiple console sign-in failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsoleSignInFailures"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# CloudWatch dashboard for security monitoring
resource "aws_cloudwatch_dashboard" "security" {
  dashboard_name = "${local.name_prefix}-security-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["${local.name_prefix}/Security", "RootAccountUsage"],
            [".", "UnauthorizedAPICalls"],
            [".", "IAMPolicyChanges"],
            [".", "ConsoleSignInFailures"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.allowed_regions[0]
          title   = "Security Events"
          period  = 300
        }
      }
    ]
  })
}```

### config.tf

```hcl
# config.tf - AWS Config rules for compliance monitoring

# S3 bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "${local.name_prefix}-config-bucket-${data.aws_caller_identity.current.account_id}"

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy
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
        Sid    = "AWSConfigBucketDelivery"
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

# IAM role for Config
resource "aws_iam_role" "config" {
  name = "${local.name_prefix}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# IAM policy for Config
resource "aws_iam_policy" "config" {
  name = "${local.name_prefix}-config-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket",
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "config:Put*",
          "config:Get*",
          "config:List*",
          "config:Describe*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListUsers"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "rds:Describe*",
          "s3:List*",
          "s3:GetBucketPolicy",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetBucketAcl",
          "s3:GetBucketLocation",
          "s3:GetBucketTagging"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to Config role
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = aws_iam_policy.config.arn
}

# Config recorder
resource "aws_config_configuration_recorder" "main" {
  count    = var.enable_config_recorder ? 1 : 0
  name     = "${local.name_prefix}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Config delivery channel
resource "aws_config_delivery_channel" "main" {
  count          = var.enable_config_recorder ? 1 : 0
  name           = "${local.name_prefix}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

# Start Config recorder
resource "aws_config_configuration_recorder_status" "main" {
  count      = var.enable_config_recorder ? 1 : 0
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config rule: MFA enabled for IAM users
resource "aws_config_config_rule" "iam_user_mfa_enabled" {
  name = "${local.name_prefix}-iam-user-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "IAM_USER_MFA_ENABLED"
  }

  tags = local.mandatory_tags
}

# Config rule: Root account MFA enabled
resource "aws_config_config_rule" "root_account_mfa_enabled" {
  name = "${local.name_prefix}-root-account-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  tags = local.mandatory_tags
}

# Config rule: S3 bucket encryption
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "${local.name_prefix}-s3-bucket-encryption"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  tags = local.mandatory_tags
}

# Config rule: RDS encryption enabled
resource "aws_config_config_rule" "rds_encryption_enabled" {
  name = "${local.name_prefix}-rds-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  tags = local.mandatory_tags
}

# Config rule: EBS encryption enabled
resource "aws_config_config_rule" "ebs_encryption_enabled" {
  name = "${local.name_prefix}-ebs-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  tags = local.mandatory_tags
}

# Config rule: Required tags
resource "aws_config_config_rule" "required_tags" {
  name = "${local.name_prefix}-required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "Environment"
    tag2Key = "Owner"
    tag3Key = "CostCenter"
  })

  tags = local.mandatory_tags
}

# Config rule: IAM password policy
resource "aws_config_config_rule" "iam_password_policy" {
  name = "${local.name_prefix}-iam-password-policy"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  input_parameters = jsonencode({
    RequireUppercaseCharacters = "true"
    RequireLowercaseCharacters = "true"
    RequireSymbols             = "true"
    RequireNumbers             = "true"
    MinimumPasswordLength      = "14"
    PasswordReusePrevention    = "24"
    MaxPasswordAge             = "90"
  })

  tags = local.mandatory_tags
}

# Config rule: CloudTrail enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "${local.name_prefix}-cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  tags = local.mandatory_tags
}

# Config rule: EC2 instance type restrictions
resource "aws_config_config_rule" "ec2_instance_type" {
  name = "${local.name_prefix}-ec2-instance-type-restriction"

  source {
    owner             = "AWS"
    source_identifier = "DESIRED_INSTANCE_TYPE"
  }

  input_parameters = jsonencode({
    instanceType = "t2.micro,t2.small,t2.medium,t3.micro,t3.small,t3.medium,t3.large"
  })

  tags = local.mandatory_tags
}```

### session-manager.tf

```hcl
# session-manager.tf - Systems Manager Session Manager configuration

# S3 bucket for session logs
resource "aws_s3_bucket" "session_logs" {
  bucket = "${local.name_prefix}-session-logs-${data.aws_caller_identity.current.account_id}"

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "session_logs" {
  bucket = aws_s3_bucket.session_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "session_logs" {
  bucket = aws_s3_bucket.session_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "session_logs" {
  bucket = aws_s3_bucket.session_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch log group for session logs
resource "aws_cloudwatch_log_group" "session_logs" {
  name              = "/aws/ssm/${local.name_prefix}-sessions"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.s3.arn

  depends_on = [aws_kms_key.s3]

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Session Manager preferences document
resource "aws_ssm_document" "session_manager_prefs" {
  name            = "${local.name_prefix}-SessionManagerRunShell"
  document_type   = "Session"
  document_format = "JSON"

  content = jsonencode({
    schemaVersion = "1.0"
    description   = "Session Manager preferences for ${local.name_prefix}"
    sessionType   = "Standard_Stream"
    inputs = {
      s3BucketName                = aws_s3_bucket.session_logs.id
      s3KeyPrefix                 = "session-logs/"
      s3EncryptionEnabled         = true
      cloudWatchLogGroupName      = aws_cloudwatch_log_group.session_logs.name
      cloudWatchEncryptionEnabled = true
      idleSessionTimeout          = "20"
      maxSessionDuration          = "60"
      runAsEnabled                = false
      runAsDefaultUser            = ""
      kmsKeyId                    = aws_kms_key.s3.arn
      shellProfile = {
        linux = "#!/bin/bash\necho 'Session started at:' $(date)\necho 'User:' $(whoami)\necho 'Instance:' $(ec2-metadata --instance-id | cut -d ' ' -f 2)\nexport HISTTIMEFORMAT='%F %T '"
      }
    }
  })

  tags = local.mandatory_tags
}

# IAM role for EC2 instances to use Session Manager
resource "aws_iam_role" "ssm_instance" {
  name = "${local.name_prefix}-ssm-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Attach SSM managed instance core policy
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ssm_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Additional policy for session logging
resource "aws_iam_policy" "ssm_logging" {
  name        = "${local.name_prefix}-ssm-logging-policy"
  description = "Policy for SSM session logging"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.session_logs.arn,
          "${aws_s3_bucket.session_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.session_logs.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3.arn
      }
    ]
  })
}

# Attach logging policy to instance role
resource "aws_iam_role_policy_attachment" "ssm_logging" {
  role       = aws_iam_role.ssm_instance.name
  policy_arn = aws_iam_policy.ssm_logging.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ssm_instance" {
  name = "${local.name_prefix}-ssm-instance-profile"
  role = aws_iam_role.ssm_instance.name
}

# SSM activation for hybrid/on-premises servers (if needed)
resource "aws_ssm_activation" "hybrid" {
  count              = var.enable_hybrid_activation ? 1 : 0
  name               = "${local.name_prefix}-hybrid-activation"
  iam_role           = aws_iam_role.ssm_instance.id
  registration_limit = var.hybrid_activation_limit
  description        = "Activation for hybrid/on-premises servers"

  tags = local.mandatory_tags
}```

### tagging.tf

```hcl
# tagging.tf - Tag enforcement policies
# Note: Organization tag policies require AWS Organizations admin access

# Tag policy for mandatory tags
resource "aws_organizations_policy" "tagging" {
  count       = var.enable_organization_policies ? 1 : 0
  name        = "${local.name_prefix}-mandatory-tags"
  description = "Enforce mandatory tags on all resources"
  type        = "TAG_POLICY"

  content = jsonencode({
    tags = {
      Environment = {
        tag_key = {
          "@@assign" = "Environment"
        }
        tag_value = {
          "@@assign" = var.allowed_environments
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "ec2:security-group",
            "ec2:snapshot",
            "rds:db",
            "rds:cluster",
            "s3:bucket",
            "dynamodb:table",
            "lambda:function",
            "elasticloadbalancing:loadbalancer",
            "elasticloadbalancing:targetgroup"
          ]
        }
      }
      Owner = {
        tag_key = {
          "@@assign" = "Owner"
        }
        tag_value = {
          "@@assign" = ["*"]
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "ec2:security-group",
            "rds:db",
            "s3:bucket",
            "lambda:function"
          ]
        }
      }
      CostCenter = {
        tag_key = {
          "@@assign" = "CostCenter"
        }
        tag_value = {
          "@@assign" = var.cost_centers
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "rds:db",
            "rds:cluster",
            "s3:bucket",
            "dynamodb:table",
            "lambda:function",
            "elasticloadbalancing:loadbalancer"
          ]
        }
      }
    }
  })
}

# Attach tag policy to organizational units
resource "aws_organizations_policy_attachment" "tagging" {
  count     = var.enable_organization_policies ? length(var.target_organizational_units) : 0
  policy_id = aws_organizations_policy.tagging[0].id
  target_id = var.target_organizational_units[count.index]
}

# Lambda function for auto-tagging resources
resource "aws_iam_role" "auto_tagging_lambda" {
  count = var.enable_auto_tagging ? 1 : 0
  name  = "${local.name_prefix}-auto-tagging-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Lambda execution policy
resource "aws_iam_policy" "auto_tagging_lambda" {
  count       = var.enable_auto_tagging ? 1 : 0
  name        = "${local.name_prefix}-auto-tagging-lambda-policy"
  description = "Policy for auto-tagging Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "ec2:DescribeSecurityGroups",
          "rds:AddTagsToResource",
          "rds:DescribeDBInstances",
          "s3:GetBucketTagging",
          "s3:PutBucketTagging"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to Lambda role
resource "aws_iam_role_policy_attachment" "auto_tagging_lambda" {
  count      = var.enable_auto_tagging ? 1 : 0
  role       = aws_iam_role.auto_tagging_lambda[0].name
  policy_arn = aws_iam_policy.auto_tagging_lambda[0].arn
}

# Lambda function for auto-tagging
resource "aws_lambda_function" "auto_tagging" {
  count         = var.enable_auto_tagging ? 1 : 0
  filename      = data.archive_file.auto_tagging_lambda[0].output_path
  function_name = "${local.name_prefix}-auto-tagging"
  role          = aws_iam_role.auto_tagging_lambda[0].arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 60

  environment {
    variables = {
      DEFAULT_TAGS = jsonencode(local.mandatory_tags)
    }
  }

  tags = local.mandatory_tags
}

# CloudWatch Events rule for auto-tagging
resource "aws_cloudwatch_event_rule" "auto_tagging" {
  count       = var.enable_auto_tagging ? 1 : 0
  name        = "${local.name_prefix}-auto-tagging"
  description = "Trigger auto-tagging Lambda on resource creation"

  event_pattern = jsonencode({
    source      = ["aws.ec2", "aws.rds", "aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "RunInstances",
        "CreateVolume",
        "CreateSecurityGroup",
        "CreateDBInstance",
        "CreateBucket"
      ]
    }
  })

  tags = local.mandatory_tags
}

# CloudWatch Events target
resource "aws_cloudwatch_event_target" "auto_tagging" {
  count     = var.enable_auto_tagging ? 1 : 0
  rule      = aws_cloudwatch_event_rule.auto_tagging[0].name
  target_id = "AutoTaggingLambda"
  arn       = aws_lambda_function.auto_tagging[0].arn
}

# Permission for CloudWatch Events to invoke Lambda
resource "aws_lambda_permission" "auto_tagging" {
  count         = var.enable_auto_tagging ? 1 : 0
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_tagging[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.auto_tagging[0].arn
}

# Archive file for Lambda
data "archive_file" "auto_tagging_lambda" {
  count       = var.enable_auto_tagging ? 1 : 0
  type        = "zip"
  source_file = "${path.module}/lambda/auto-tagging.py"
  output_path = "${path.module}/auto-tagging-lambda.zip"
}```

### lambda/auto-tagging.py

```python
# lambda/auto_tagging.py
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    """
    Auto-tag resources when they are created
    """
    print(f"Event: {json.dumps(event)}")
    
    # Get default tags from environment
    default_tags = json.loads(os.environ.get('DEFAULT_TAGS', '{}'))
    
    # Extract event details
    detail = event.get('detail', {})
    event_name = detail.get('eventName', '')
    region = detail.get('awsRegion', '')
    user_identity = detail.get('userIdentity', {})
    
    # Add dynamic tags
    tags = {
        **default_tags,
        'CreatedBy': user_identity.get('principalId', 'unknown'),
        'CreatedDate': datetime.now().strftime('%Y-%m-%d'),
        'CreatedVia': 'Auto-Tagging'
    }
    
    # Handle different resource types
    if event_name == 'RunInstances':
        tag_ec2_instances(detail, tags, region)
    elif event_name == 'CreateVolume':
        tag_ebs_volumes(detail, tags, region)
    elif event_name == 'CreateSecurityGroup':
        tag_security_groups(detail, tags, region)
    elif event_name == 'CreateDBInstance':
        tag_rds_instances(detail, tags, region)
    elif event_name == 'CreateBucket':
        tag_s3_buckets(detail, tags, region)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Tagging completed successfully')
    }

def tag_ec2_instances(detail, tags, region):
    """Tag EC2 instances"""
    ec2 = boto3.client('ec2', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    instances = response_elements.get('instancesSet', {}).get('items', [])
    
    instance_ids = [i['instanceId'] for i in instances if 'instanceId' in i]
    
    if instance_ids:
        ec2.create_tags(
            Resources=instance_ids,
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged EC2 instances: {instance_ids}")

def tag_ebs_volumes(detail, tags, region):
    """Tag EBS volumes"""
    ec2 = boto3.client('ec2', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    volume_id = response_elements.get('volumeId')
    
    if volume_id:
        ec2.create_tags(
            Resources=[volume_id],
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged EBS volume: {volume_id}")

def tag_security_groups(detail, tags, region):
    """Tag security groups"""
    ec2 = boto3.client('ec2', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    group_id = response_elements.get('groupId')
    
    if group_id:
        ec2.create_tags(
            Resources=[group_id],
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged security group: {group_id}")

def tag_rds_instances(detail, tags, region):
    """Tag RDS instances"""
    rds = boto3.client('rds', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    db_instance = response_elements.get('dBInstance', {})
    db_instance_arn = db_instance.get('dBInstanceArn')
    
    if db_instance_arn:
        rds.add_tags_to_resource(
            ResourceName=db_instance_arn,
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged RDS instance: {db_instance_arn}")

def tag_s3_buckets(detail, tags, region):
    """Tag S3 buckets"""
    s3 = boto3.client('s3')
    
    request_parameters = detail.get('requestParameters', {})
    bucket_name = request_parameters.get('bucketName')
    
    if bucket_name:
        try:
            s3.put_bucket_tagging(
                Bucket=bucket_name,
                Tagging={
                    'TagSet': [{'Key': k, 'Value': v} for k, v in tags.items()]
                }
            )
            print(f"Tagged S3 bucket: {bucket_name}")
        except Exception as e:
            print(f"Error tagging S3 bucket {bucket_name}: {str(e)}")
```

### audit-role.tf

```hcl
# audit-role.tf - Cross-account audit role setup

# Trust policy for cross-account audit role
data "aws_iam_policy_document" "audit_trust_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = var.audit_account_ids
    }

    actions = ["sts:AssumeRole"]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.audit_external_id]
    }
  }
}

# Cross-account audit role
resource "aws_iam_role" "audit" {
  count                = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  name                 = "${local.name_prefix}-audit-role"
  assume_role_policy   = data.aws_iam_policy_document.audit_trust_policy.json
  max_session_duration = 43200 # 12 hours

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Audit policy - read-only access (using AWS managed policy instead of custom)
resource "aws_iam_role_policy_attachment" "audit_viewonly" {
  count      = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  role       = aws_iam_role.audit[0].name
  policy_arn = "arn:aws:iam::aws:policy/ViewOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "audit_security" {
  count      = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  role       = aws_iam_role.audit[0].name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}

# Custom audit policy for additional read-only permissions
resource "aws_iam_policy" "audit" {
  count       = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  name        = "${local.name_prefix}-audit-policy"
  description = "Additional read-only policy for cross-account auditing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AdditionalReadAccess"
        Effect = "Allow"
        Action = [
          "config:Deliver*",
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "datasync:Describe*",
          "datasync:List*",
          "dax:Describe*",
          "dax:ListTags",
          "directconnect:Describe*",
          "dms:Describe*",
          "dms:ListTagsForResource",
          "dynamodb:DescribeBackup",
          "dynamodb:DescribeContinuousBackups",
          "dynamodb:DescribeGlobalTable",
          "dynamodb:DescribeGlobalTableSettings",
          "dynamodb:DescribeLimits",
          "dynamodb:DescribeReservedCapacity",
          "dynamodb:DescribeReservedCapacityOfferings",
          "dynamodb:DescribeStream",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeTimeToLive",
          "dynamodb:ListBackups",
          "dynamodb:ListGlobalTables",
          "dynamodb:ListStreams",
          "dynamodb:ListTables",
          "dynamodb:ListTagsOfResource",
          "ec2:Describe*",
          "ecr:DescribeImageScanFindings",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories",
          "ecr:GetLifecyclePolicy",
          "ecr:GetRepositoryPolicy",
          "ecr:ListImages",
          "ecs:Describe*",
          "ecs:List*",
          "eks:DescribeCluster",
          "eks:ListClusters",
          "elasticache:Describe*",
          "elasticache:ListTagsForResource",
          "elasticbeanstalk:Describe*",
          "elasticfilesystem:DescribeFileSystems",
          "elasticfilesystem:DescribeLifecycleConfiguration",
          "elasticfilesystem:DescribeMountTargets",
          "elasticfilesystem:DescribeMountTargetSecurityGroups",
          "elasticfilesystem:DescribeTags",
          "elasticloadbalancing:Describe*",
          "elasticmapreduce:Describe*",
          "elasticmapreduce:ListBootstrapActions",
          "elasticmapreduce:ListClusters",
          "elasticmapreduce:ListInstances",
          "elasticmapreduce:ListSteps",
          "es:Describe*",
          "es:ListDomainNames",
          "es:ListTags",
          "events:DescribeRule",
          "events:ListRuleNamesByTarget",
          "events:ListRules",
          "events:ListTargetsByRule",
          "firehose:Describe*",
          "firehose:List*",
          "fsx:Describe*",
          "glacier:DescribeVault",
          "glacier:GetVaultAccessPolicy",
          "glacier:ListVaults",
          "glue:GetCatalogImportStatus",
          "glue:GetDatabase",
          "glue:GetDatabases",
          "glue:GetTable",
          "glue:GetTables",
          "glue:GetPartition",
          "glue:GetPartitions",
          "guardduty:Get*",
          "guardduty:List*",
          "iam:Generate*",
          "iam:Get*",
          "iam:List*",
          "iam:SimulateCustomPolicy",
          "iam:SimulatePrincipalPolicy",
          "inspector:Describe*",
          "inspector:Get*",
          "inspector:List*",
          "iot:Describe*",
          "iot:GetPolicy",
          "iot:GetPolicyVersion",
          "iot:List*",
          "kinesis:Describe*",
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:ListStreams",
          "kinesis:ListTagsForStream",
          "kinesisanalytics:Describe*",
          "kinesisanalytics:Discover*",
          "kinesisanalytics:GetApplicationState",
          "kinesisanalytics:ListApplications",
          "kinesisvideo:Describe*",
          "kinesisvideo:GetDataEndpoint",
          "kinesisvideo:GetHLSStreamingSessionURL",
          "kinesisvideo:GetMedia",
          "kinesisvideo:GetMediaForFragmentList",
          "kinesisvideo:ListFragments",
          "kinesisvideo:ListStreams",
          "kms:Describe*",
          "kms:Get*",
          "kms:List*",
          "lambda:Get*",
          "lambda:List*",
          "logs:Describe*",
          "logs:FilterLogEvents",
          "logs:Get*",
          "logs:ListTagsLogGroup",
          "logs:TestMetricFilter",
          "mq:Describe*",
          "mq:List*",
          "organizations:Describe*",
          "organizations:List*",
          "rds:Describe*",
          "rds:List*",
          "redshift:Describe*",
          "redshift:ViewQueriesInConsole",
          "route53:Get*",
          "route53:List*",
          "route53:TestDNSAnswer",
          "route53domains:CheckDomainAvailability",
          "route53domains:GetDomainDetail",
          "route53domains:GetOperationDetail",
          "route53domains:ListDomains",
          "route53domains:ListOperations",
          "route53domains:ListTagsForDomain",
          "s3:GetAccelerateConfiguration",
          "s3:GetAnalyticsConfiguration",
          "s3:GetBucketAcl",
          "s3:GetBucketCORS",
          "s3:GetBucketLocation",
          "s3:GetBucketLogging",
          "s3:GetBucketNotification",
          "s3:GetBucketPolicy",
          "s3:GetBucketPolicyStatus",
          "s3:GetBucketPublicAccessBlock",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketTagging",
          "s3:GetBucketVersioning",
          "s3:GetBucketWebsite",
          "s3:GetEncryptionConfiguration",
          "s3:GetInventoryConfiguration",
          "s3:GetLifecycleConfiguration",
          "s3:GetMetricsConfiguration",
          "s3:GetObjectAcl",
          "s3:GetObjectTagging",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging",
          "s3:GetReplicationConfiguration",
          "s3:ListAllMyBuckets",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListBucketVersions",
          "s3:ListMultipartUploadParts",
          "sagemaker:Describe*",
          "sagemaker:List*",
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetResourcePolicy",
          "secretsmanager:ListSecrets",
          "secretsmanager:ListSecretVersionIds",
          "securityhub:Describe*",
          "securityhub:Get*",
          "securityhub:List*",
          "servicecatalog:Describe*",
          "servicecatalog:List*",
          "servicecatalog:SearchProducts",
          "servicecatalog:ScanProvisionedProducts",
          "ses:Describe*",
          "ses:Get*",
          "ses:List*",
          "shield:Describe*",
          "shield:List*",
          "sns:GetTopicAttributes",
          "sns:ListSubscriptions",
          "sns:ListSubscriptionsByTopic",
          "sns:ListTopics",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ListDeadLetterSourceQueues",
          "sqs:ListQueues",
          "sqs:ListQueueTags",
          "ssm:Describe*",
          "ssm:Get*",
          "ssm:List*",
          "states:DescribeActivity",
          "states:DescribeExecution",
          "states:DescribeStateMachine",
          "states:GetExecutionHistory",
          "states:ListActivities",
          "states:ListExecutions",
          "states:ListStateMachines",
          "storagegateway:Describe*",
          "storagegateway:List*",
          "support:*",
          "tag:GetResources",
          "tag:GetTagKeys",
          "tag:GetTagValues",
          "transfer:Describe*",
          "transfer:List*",
          "trustedadvisor:Describe*",
          "waf:Get*",
          "waf:List*",
          "wafv2:Get*",
          "wafv2:List*",
          "waf-regional:Get*",
          "waf-regional:List*",
          "workspaces:Describe*",
          "xray:BatchGetTraces",
          "xray:GetEncryptionConfig",
          "xray:GetServiceGraph",
          "xray:GetTraceGraph",
          "xray:GetTraceSummaries"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyModifyActions"
        Effect = "Deny"
        Action = [
          "*:Create*",
          "*:Delete*",
          "*:Put*",
          "*:Update*",
          "*:Modify*",
          "*:Attach*",
          "*:Detach*",
          "*:Start*",
          "*:Stop*",
          "*:Terminate*",
          "*:Reboot*",
          "*:Reset*",
          "*:Change*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach audit policy to audit role
resource "aws_iam_role_policy_attachment" "audit" {
  count      = var.enable_audit_role && length(var.audit_account_ids) > 0 ? 1 : 0
  role       = aws_iam_role.audit[0].name
  policy_arn = aws_iam_policy.audit[0].arn
}```

### outputs.tf

```hcl
# outputs.tf - Important outputs like role ARNs, KMS key IDs

# IAM Role ARNs
output "developer_role_arn" {
  description = "ARN of the developer IAM role"
  value       = aws_iam_role.developer.arn
}

output "operations_role_arn" {
  description = "ARN of the operations IAM role"
  value       = aws_iam_role.operations.arn
}

output "security_role_arn" {
  description = "ARN of the security IAM role"
  value       = aws_iam_role.security.arn
}

output "ssm_instance_profile_name" {
  description = "Name of the SSM instance profile for EC2"
  value       = aws_iam_instance_profile.ssm_instance.name
}

# KMS Key Information
output "kms_key_ids" {
  description = "Map of KMS key IDs by purpose"
  value = {
    s3  = aws_kms_key.s3.id
    rds = aws_kms_key.rds.id
    ebs = aws_kms_key.ebs.id
  }
}

output "kms_key_arns" {
  description = "Map of KMS key ARNs by purpose"
  value = {
    s3  = aws_kms_key.s3.arn
    rds = aws_kms_key.rds.arn
    ebs = aws_kms_key.ebs.arn
  }
}

output "kms_key_aliases" {
  description = "Map of KMS key aliases"
  value = {
    s3  = aws_kms_alias.s3.name
    rds = aws_kms_alias.rds.name
    ebs = aws_kms_alias.ebs.name
  }
}

# S3 Bucket Information
output "config_bucket_name" {
  description = "Name of the AWS Config S3 bucket"
  value       = aws_s3_bucket.config.id
}

output "config_bucket_arn" {
  description = "ARN of the AWS Config S3 bucket"
  value       = aws_s3_bucket.config.arn
}

output "session_logs_bucket_name" {
  description = "Name of the Session Manager logs S3 bucket"
  value       = aws_s3_bucket.session_logs.id
}

output "session_logs_bucket_arn" {
  description = "ARN of the Session Manager logs S3 bucket"
  value       = aws_s3_bucket.session_logs.arn
}

# CloudWatch Resources
output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "audit_log_group_name" {
  description = "Name of the CloudWatch log group for audit logs"
  value       = aws_cloudwatch_log_group.audit_logs.name
}

output "session_log_group_name" {
  description = "Name of the CloudWatch log group for session logs"
  value       = aws_cloudwatch_log_group.session_logs.name
}

# Session Manager
output "session_manager_document_name" {
  description = "Name of the Session Manager preferences document"
  value       = aws_ssm_document.session_manager_prefs.name
}

output "hybrid_activation_id" {
  description = "ID of the SSM hybrid activation (if enabled)"
  value       = var.enable_hybrid_activation ? aws_ssm_activation.hybrid[0].id : null
}

output "hybrid_activation_code" {
  description = "Activation code for hybrid servers (if enabled)"
  value       = var.enable_hybrid_activation ? aws_ssm_activation.hybrid[0].activation_code : null
  sensitive   = true
}

# Config Rules
output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = var.enable_config_recorder ? aws_config_configuration_recorder.main[0].name : null
}

output "config_rules" {
  description = "List of enabled AWS Config rules"
  value = [
    aws_config_config_rule.iam_user_mfa_enabled.name,
    aws_config_config_rule.root_account_mfa_enabled.name,
    aws_config_config_rule.s3_bucket_encryption.name,
    aws_config_config_rule.rds_encryption_enabled.name,
    aws_config_config_rule.ebs_encryption_enabled.name,
    aws_config_config_rule.required_tags.name,
    aws_config_config_rule.iam_password_policy.name,
    aws_config_config_rule.cloudtrail_enabled.name,
    aws_config_config_rule.ec2_instance_type.name
  ]
}

# Organization Policies (when enabled)
output "scp_policy_ids" {
  description = "IDs of Service Control Policies"
  value = var.enable_organization_policies ? {
    region_restriction     = aws_organizations_policy.region_restriction[0].id
    encryption_enforcement = aws_organizations_policy.encryption_enforcement[0].id
  } : null
}

output "tag_policy_id" {
  description = "ID of the tag enforcement policy"
  value       = var.enable_organization_policies ? aws_organizations_policy.tagging[0].id : null
}

# Lambda Functions (when enabled)
output "auto_tagging_lambda_arn" {
  description = "ARN of the auto-tagging Lambda function"
  value       = var.enable_auto_tagging ? aws_lambda_function.auto_tagging[0].arn : null
}

# Audit Role (when enabled)
output "audit_role_arn" {
  description = "ARN of the cross-account audit role"
  value       = var.enable_audit_role && length(var.audit_account_ids) > 0 ? aws_iam_role.audit[0].arn : null
}

# Summary Information
output "deployment_summary" {
  description = "Summary of the security deployment"
  value = {
    environment          = var.environment
    project_name         = var.project_name
    allowed_regions      = join(", ", var.allowed_regions)
    kms_rotation_enabled = true
    log_retention_days   = var.cloudtrail_retention_days
    mfa_required         = true
    encryption_enforced  = true
  }
}```

## Deployment Instructions

### Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- S3 bucket for Terraform state backend

### Basic Deployment

```bash
# Initialize Terraform
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=security-framework/terraform.tfstate" \
  -backend-config="region=us-east-1"

# Review plan
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### Optional Features

Enable organization policies (requires AWS Organizations admin access):

```bash
terraform apply -var="enable_organization_policies=true" \
  -var="target_organizational_units=[\"ou-xxxx-xxxxxxxx\"]"
```

Enable cross-account audit role:

```bash
terraform apply -var="enable_audit_role=true" \
  -var="audit_account_ids=[\"123456789012\"]" \
  -var="audit_external_id=your-secure-32-char-external-id"
```

Enable hybrid server management:

```bash
terraform apply -var="enable_hybrid_activation=true" \
  -var="hybrid_activation_limit=10"
```

### Cleanup

```bash
terraform destroy -auto-approve
```

## Key Security Features

### MFA Enforcement

All IAM roles require MFA for assumption. No exceptions for developer, operations, or security roles.

### Encryption at Rest

Separate KMS keys for different purposes:

- S3 encryption key
- RDS encryption key
- EBS encryption key

All keys have automatic rotation enabled.

### Regional Restrictions

Service Control Policies prevent resource creation outside us-east-1 and us-west-2.

### Compliance Monitoring

AWS Config rules continuously monitor:

- IAM user MFA enabled
- Root account MFA enabled
- S3 bucket encryption
- RDS encryption enabled
- EBS encryption enabled
- Required tags on resources
- IAM password policy compliance
- CloudTrail enabled
- EC2 instance type restrictions

### Session Manager

Secure EC2 access without SSH keys. All sessions logged to S3 and CloudWatch.

### Permission Boundaries

Developers cannot escalate privileges beyond defined boundaries.

### Audit Trail

All logs encrypted and retained for 365 days for compliance.

### Lifecycle Protection

All critical resources include lifecycle blocks with prevent_destroy set to false for flexibility in test
environments. For production deployments, consider changing prevent_destroy to true for:

- KMS encryption keys (S3, RDS, EBS)
- S3 buckets (Config, Session logs)
- CloudWatch log groups (Audit, Session logs)
- IAM roles (Developer, Operations, Security, Config, SSM, Audit, Auto-tagging)
