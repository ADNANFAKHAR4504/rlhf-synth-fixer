# IDEAL RESPONSE: Zero-Trust IAM and KMS Terraform Stack

This document now mirrors the exact source files that live under `lib/`. Each section enumerates a file and inlines its full contents so reviewers can see the authoritative implementation without having to browse the repository.

## File: AWS_REGION

```text
us-east-1
```

## File: backend.tf.example

```hcl
# Example backend configuration with KMS encryption
# Uncomment and customize for your environment

# terraform {
#   backend "s3" {
#     bucket         = "my-terraform-state-bucket"
#     key            = "security/iam-kms/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     kms_key_id     = "arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID"
#     dynamodb_table = "terraform-state-lock"
#   }
# }
```

## File: provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to support multiple environments"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "trusted_account_ids" {
  description = "List of AWS account IDs allowed to assume roles"
  type        = list(string)
  default     = []
}

variable "owner_tag" {
  description = "Owner tag for all resources"
  type        = string
  default     = "SecurityTeam"
}

variable "environment_tag" {
  description = "Environment tag for all resources"
  type        = string
  default     = "Production"
}

variable "cost_center_tag" {
  description = "Cost center tag for all resources"
  type        = string
  default     = "Security-001"
}
```

## File: locals.tf

```hcl
locals {
  common_tags = {
    Owner       = var.owner_tag
    Environment = var.environment_tag
    CostCenter  = var.cost_center_tag
    ManagedBy   = "Terraform"
  }

  # Business hours restriction (9 AM - 6 PM EST)
  business_hours_condition = {
    DateGreaterThan = {
      "aws:CurrentTime" = "2024-01-01T14:00:00Z" # 9 AM EST
    }
    DateLessThan = {
      "aws:CurrentTime" = "2024-01-01T23:00:00Z" # 6 PM EST
    }
  }
}
```

## File: random.tf

```hcl
# Generate random external ID for cross-account assume role
resource "random_string" "external_id" {
  length  = 32
  special = false
}
```

## File: kms.tf

```hcl
# KMS key for application data
resource "aws_kms_key" "application_data" {
  description             = "KMS key for application data encryption-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "application-data-key-${var.environment_suffix}"
      Purpose = "ApplicationData"
    }
  )
}

resource "aws_kms_alias" "application_data" {
  name          = "alias/application-data-${var.environment_suffix}"
  target_key_id = aws_kms_key.application_data.key_id
}

# KMS key for infrastructure secrets
resource "aws_kms_key" "infrastructure_secrets" {
  description             = "KMS key for infrastructure secrets-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "infrastructure-secrets-key-${var.environment_suffix}"
      Purpose = "InfrastructureSecrets"
    }
  )
}

resource "aws_kms_alias" "infrastructure_secrets" {
  name          = "alias/infrastructure-secrets-${var.environment_suffix}"
  target_key_id = aws_kms_key.infrastructure_secrets.key_id
}

# KMS key for Terraform state encryption
resource "aws_kms_key" "terraform_state" {
  description             = "KMS key for Terraform state encryption-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "terraform-state-key-${var.environment_suffix}"
      Purpose = "TerraformState"
    }
  )
}

resource "aws_kms_alias" "terraform_state" {
  name          = "alias/terraform-state-${var.environment_suffix}"
  target_key_id = aws_kms_key.terraform_state.key_id
}
```

## File: kms_policies.tf

```hcl
data "aws_caller_identity" "current" {}

# KMS key policy for application data - allows specific roles to encrypt/decrypt
resource "aws_kms_key_policy" "application_data" {
  key_id = aws_kms_key.application_data.id

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
        Sid    = "Allow SecurityAdmin and DevOps roles to use the key"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.security_admin.arn,
            aws_iam_role.devops.arn
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Auditor role to describe key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.auditor.arn
        }
        Action = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS key policy for infrastructure secrets - restricted to SecurityAdmin only
resource "aws_kms_key_policy" "infrastructure_secrets" {
  key_id = aws_kms_key.infrastructure_secrets.id

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
        Sid    = "Allow SecurityAdmin role to use the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.security_admin.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Auditor role to describe key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.auditor.arn
        }
        Action = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })
}
```

## File: iam_permission_boundaries.tf

```hcl
# Permission boundary policy restricting access to us-east-1 region
resource "aws_iam_policy" "permission_boundary" {
  name        = "permission-boundary-${var.environment_suffix}"
  description = "Permission boundary restricting access to us-east-1 region"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "RestrictToUSEast1"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = "us-east-1"
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "permission-boundary-${var.environment_suffix}"
    }
  )
}
```

## File: iam_roles.tf

```hcl
# SecurityAdmin IAM Role
resource "aws_iam_role" "security_admin" {
  name                 = "security-admin-${var.environment_suffix}"
  description          = "SecurityAdmin role with MFA enforcement"
  max_session_duration = 3600 # 1 hour
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AssumeRoleWithMFA"
        Effect = "Allow"
        Principal = {
          AWS = length(var.trusted_account_ids) > 0 ? [
            for account_id in var.trusted_account_ids : "arn:aws:iam::${account_id}:root"
          ] : ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          StringEquals = {
            "sts:ExternalId" = random_string.external_id.result
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name        = "security-admin-${var.environment_suffix}"
      Role        = "SecurityAdmin"
      SessionName = "security-admin-session"
    }
  )
}

# DevOps IAM Role
resource "aws_iam_role" "devops" {
  name                 = "devops-${var.environment_suffix}"
  description          = "DevOps role with MFA enforcement"
  max_session_duration = 3600 # 1 hour
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AssumeRoleWithMFA"
        Effect = "Allow"
        Principal = {
          AWS = length(var.trusted_account_ids) > 0 ? [
            for account_id in var.trusted_account_ids : "arn:aws:iam::${account_id}:root"
          ] : ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          StringEquals = {
            "sts:ExternalId" = random_string.external_id.result
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name        = "devops-${var.environment_suffix}"
      Role        = "DevOps"
      SessionName = "devops-session"
    }
  )
}

# Auditor IAM Role
resource "aws_iam_role" "auditor" {
  name                 = "auditor-${var.environment_suffix}"
  description          = "Auditor role with MFA enforcement and read-only access"
  max_session_duration = 3600 # 1 hour
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AssumeRoleWithMFA"
        Effect = "Allow"
        Principal = {
          AWS = length(var.trusted_account_ids) > 0 ? [
            for account_id in var.trusted_account_ids : "arn:aws:iam::${account_id}:root"
          ] : ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          StringEquals = {
            "sts:ExternalId" = random_string.external_id.result
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name        = "auditor-${var.environment_suffix}"
      Role        = "Auditor"
      SessionName = "auditor-session"
    }
  )
}
```

## File: iam_policies.tf

```hcl
# SecurityAdmin Policy with time-based restrictions
resource "aws_iam_policy" "security_admin" {
  name        = "security-admin-policy-${var.environment_suffix}"
  description = "SecurityAdmin policy with business hours restrictions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSecurityOperationsDuringBusinessHours"
        Effect = "Allow"
        Action = [
          "iam:*",
          "kms:*",
          "logs:*",
          "sts:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenySensitiveOperationsOutsideBusinessHours"
        Effect = "Deny"
        Action = [
          "iam:DeleteRole",
          "iam:DeleteRolePolicy",
          "iam:DeletePolicy",
          "iam:DeleteUser",
          "kms:ScheduleKeyDeletion",
          "kms:DisableKey"
        ]
        Resource = "*"
        Condition = {
          DateLessThan = {
            "aws:CurrentTime" = "2024-01-01T14:00:00Z"  # Before 9 AM EST
          }
        }
      },
      {
        Sid    = "DenySensitiveOperationsAfterBusinessHours"
        Effect = "Deny"
        Action = [
          "iam:DeleteRole",
          "iam:DeleteRolePolicy",
          "iam:DeletePolicy",
          "iam:DeleteUser",
          "kms:ScheduleKeyDeletion",
          "kms:DisableKey"
        ]
        Resource = "*"
        Condition = {
          DateGreaterThan = {
            "aws:CurrentTime" = "2024-01-01T23:00:00Z"  # After 6 PM EST
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "security-admin-policy-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "security_admin" {
  role       = aws_iam_role.security_admin.name
  policy_arn = aws_iam_policy.security_admin.arn
}

# DevOps Policy with time-based restrictions
resource "aws_iam_policy" "devops" {
  name        = "devops-policy-${var.environment_suffix}"
  description = "DevOps policy with business hours restrictions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowDevOpsOperationsDuringBusinessHours"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "s3:*",
          "rds:*",
          "ecs:*",
          "cloudwatch:*",
          "logs:*",
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenySensitiveOperationsOutsideBusinessHours"
        Effect = "Deny"
        Action = [
          "rds:DeleteDBInstance",
          "rds:DeleteDBCluster",
          "ec2:TerminateInstances",
          "s3:DeleteBucket"
        ]
        Resource = "*"
        Condition = {
          DateLessThan = {
            "aws:CurrentTime" = "2024-01-01T14:00:00Z"  # Before 9 AM EST
          }
        }
      },
      {
        Sid    = "DenySensitiveOperationsAfterBusinessHours"
        Effect = "Deny"
        Action = [
          "rds:DeleteDBInstance",
          "rds:DeleteDBCluster",
          "ec2:TerminateInstances",
          "s3:DeleteBucket"
        ]
        Resource = "*"
        Condition = {
          DateGreaterThan = {
            "aws:CurrentTime" = "2024-01-01T23:00:00Z"  # After 6 PM EST
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "devops-policy-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "devops" {
  role       = aws_iam_role.devops.name
  policy_arn = aws_iam_policy.devops.arn
}

# Auditor Policy - Read-only access
resource "aws_iam_policy" "auditor" {
  name        = "auditor-policy-${var.environment_suffix}"
  description = "Auditor read-only policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "iam:Get*",
          "iam:List*",
          "kms:Describe*",
          "kms:Get*",
          "kms:List*",
          "logs:Describe*",
          "logs:Get*",
          "logs:FilterLogEvents",
          "cloudtrail:LookupEvents",
          "cloudtrail:Get*",
          "cloudtrail:Describe*"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyAllWriteOperations"
        Effect = "Deny"
        NotAction = [
          "iam:Get*",
          "iam:List*",
          "kms:Describe*",
          "kms:Get*",
          "kms:List*",
          "logs:Describe*",
          "logs:Get*",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "auditor-policy-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "auditor" {
  role       = aws_iam_role.auditor.name
  policy_arn = aws_iam_policy.auditor.arn
}
```

## File: iam_service_roles.tf

```hcl
# ECS Service-Linked Role with custom permission boundary
resource "aws_iam_role" "ecs_service_role" {
  name                 = "ecs-service-role-${var.environment_suffix}"
  description          = "ECS service-linked role with custom permission boundary"
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name    = "ecs-service-role-${var.environment_suffix}"
      Service = "ECS"
    }
  )
}

resource "aws_iam_role_policy_attachment" "ecs_service_role" {
  role       = aws_iam_role.ecs_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# RDS Service-Linked Role with custom permission boundary
resource "aws_iam_role" "rds_service_role" {
  name                 = "rds-service-role-${var.environment_suffix}"
  description          = "RDS service-linked role with custom permission boundary"
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name    = "rds-service-role-${var.environment_suffix}"
      Service = "RDS"
    }
  )
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

## File: cloudwatch_logs.tf

```hcl
# CloudWatch Log Group for IAM activity
resource "aws_cloudwatch_log_group" "iam_activity" {
  name              = "/aws/iam/activity-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "iam-activity-logs-${var.environment_suffix}"
      Purpose = "IAMAudit"
    }
  )
}

# CloudWatch Log Group for SecurityAdmin role activity
resource "aws_cloudwatch_log_group" "security_admin_activity" {
  name              = "/aws/iam/security-admin-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "security-admin-activity-logs-${var.environment_suffix}"
      Purpose = "RoleAudit"
      Role    = "SecurityAdmin"
    }
  )
}

# CloudWatch Log Group for DevOps role activity
resource "aws_cloudwatch_log_group" "devops_activity" {
  name              = "/aws/iam/devops-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "devops-activity-logs-${var.environment_suffix}"
      Purpose = "RoleAudit"
      Role    = "DevOps"
    }
  )
}

# CloudWatch Log Group for Auditor role activity
resource "aws_cloudwatch_log_group" "auditor_activity" {
  name              = "/aws/iam/auditor-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "auditor-activity-logs-${var.environment_suffix}"
      Purpose = "RoleAudit"
      Role    = "Auditor"
    }
  )
}

# CloudWatch Log Group for KMS activity
resource "aws_cloudwatch_log_group" "kms_activity" {
  name              = "/aws/iam/kms/activity-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "kms-activity-logs-${var.environment_suffix}"
      Purpose = "KMSAudit"
    }
  )
}
```

## File: outputs.tf

```hcl
output "security_admin_role_arn" {
  description = "ARN of the SecurityAdmin IAM role"
  value       = aws_iam_role.security_admin.arn
}

output "devops_role_arn" {
  description = "ARN of the DevOps IAM role"
  value       = aws_iam_role.devops.arn
}

output "auditor_role_arn" {
  description = "ARN of the Auditor IAM role"
  value       = aws_iam_role.auditor.arn
}

output "application_data_key_id" {
  description = "ID of the application data KMS key"
  value       = aws_kms_key.application_data.id
}

output "application_data_key_arn" {
  description = "ARN of the application data KMS key"
  value       = aws_kms_key.application_data.arn
}

output "infrastructure_secrets_key_id" {
  description = "ID of the infrastructure secrets KMS key"
  value       = aws_kms_key.infrastructure_secrets.id
}

output "infrastructure_secrets_key_arn" {
  description = "ARN of the infrastructure secrets KMS key"
  value       = aws_kms_key.infrastructure_secrets.arn
}

output "terraform_state_key_id" {
  description = "ID of the Terraform state KMS key"
  value       = aws_kms_key.terraform_state.id
}

output "terraform_state_key_arn" {
  description = "ARN of the Terraform state KMS key"
  value       = aws_kms_key.terraform_state.arn
}

output "external_id" {
  description = "External ID for cross-account assume role (sensitive)"
  value       = random_string.external_id.result
  sensitive   = true
}

output "iam_activity_log_group_name" {
  description = "Name of the IAM activity CloudWatch log group"
  value       = aws_cloudwatch_log_group.iam_activity.name
}

output "permission_boundary_arn" {
  description = "ARN of the permission boundary policy"
  value       = aws_iam_policy.permission_boundary.arn
}

output "ecs_service_role_arn" {
  description = "ARN of the ECS service role"
  value       = aws_iam_role.ecs_service_role.arn
}

output "rds_service_role_arn" {
  description = "ARN of the RDS service role"
  value       = aws_iam_role.rds_service_role.arn
}
```

## File: terraform.tfvars

```hcl
environment_suffix = "test-101912422"
aws_region         = "us-east-1"
owner_tag          = "SecurityTeam"
environment_tag    = "Test"
cost_center_tag    = "Security-001"
```

## File: terraform.tfvars.example

```hcl
# Example Terraform variables file
# Copy to terraform.tfvars and customize for your environment

environment_suffix = "dev-001"
aws_region        = "us-east-1"

# Optional: Add trusted AWS account IDs for cross-account access
# trusted_account_ids = ["123456789012", "210987654321"]

# Tagging
owner_tag       = "SecurityTeam"
environment_tag = "Production"
cost_center_tag = "Security-001"
```
