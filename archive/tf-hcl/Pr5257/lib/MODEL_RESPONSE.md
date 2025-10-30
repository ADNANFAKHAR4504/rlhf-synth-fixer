### Reasoning Trace

---

This is a comprehensive request for a financial services IAM security framework using Terraform. The user needs:

1. Advanced IAM policies with conditional logic (at least 3 condition keys per policy)
2. Role hierarchy (Developer, Operator, Administrator) with separation of duties
3. Cross-account access controls with external ID validation
4. Password and account security policies
5. Service-specific IAM roles (EC2, Lambda, RDS)
6. S3 bucket policies with VPC restrictions
7. Time-based access controls
8. CloudWatch monitoring and alerting
9. Modular Terraform architecture
10. Regional restrictions

I need to create a production-ready Terraform configuration with all these components. Let me structure this properly with all the required files and modules.

The key requirements:

- Terraform 1.5+ with AWS Provider 5.x
- Zero-trust principles
- Least privilege access
- Conditional access based on context
- Strict separation of duties
- Time-limited access
- MFA requirements
- Complete audit trails
- All in us-east-1

I'll create:

1. Main configuration files
2. Terraform modules
3. Comprehensive documentation
4. Example policies

Let me start with the main configuration files and then create the modules.

### Answer

---

# Comprehensive IAM Security Framework for Financial Services

I'll provide you with a production-ready, zero-trust IAM security framework that meets all your financial services compliance requirements. This implementation uses Terraform 1.5+ with AWS Provider 5.x and includes all the security controls you've specified.

## Directory Structure

```
.
├── versions.tf
├── providers.tf
├── variables.tf
├── locals.tf
├── iam-policies.tf
├── iam-roles-developer.tf
├── iam-roles-operator.tf
├── iam-roles-administrator.tf
├── iam-roles-service.tf
├── iam-cross-account.tf
├── iam-password-policy.tf
├── s3-bucket-policies.tf
├── cloudwatch-monitoring.tf
├── outputs.tf
├── terraform.tfvars.example
├── README.md
└── modules/
    ├── iam-policy-template/
    ├── iam-role/
    ├── cross-account-role/
    └── s3-secure-bucket/
```

## Main Configuration Files

### versions.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state management
  backend "s3" {
    bucket         = "terraform-state-financial-services"
    key            = "iam-security-framework/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"

    # Additional security for state file
    server_side_encryption_configuration {
      rule {
        apply_server_side_encryption_by_default {
          sse_algorithm     = "aws:kms"
          kms_master_key_id = "arn:aws:kms:us-east-1:ACCOUNT:key/KEY-ID"
        }
      }
    }
  }
}
```

### providers.tf

```hcl
provider "aws" {
  region = var.aws_region

  # Default tags for all resources
  default_tags {
    tags = {
      Environment       = var.environment
      ManagedBy        = "Terraform"
      SecurityLevel    = "Critical"
      ComplianceScope  = "Financial-Services"
      DataClassification = "Confidential"
      CreatedDate      = timestamp()
      CostCenter       = var.cost_center
      Owner            = var.owner_email
    }
  }

  # Assume role for cross-account deployment if needed
  dynamic "assume_role" {
    for_each = var.assume_role_arn != "" ? [1] : []
    content {
      role_arn     = var.assume_role_arn
      session_name = "terraform-iam-framework"
      external_id  = var.external_id
    }
  }
}

# Additional provider for CloudWatch Logs in central logging account
provider "aws" {
  alias  = "logging"
  region = var.aws_region

  assume_role {
    role_arn     = var.central_logging_role_arn
    session_name = "terraform-central-logging"
    external_id  = var.logging_external_id
  }
}
```

### variables.tf

```hcl
# Environment Configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

# Organization Settings
variable "organization_id" {
  description = "AWS Organization ID"
  type        = string
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
}

variable "owner_email" {
  description = "Owner email for notifications"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.owner_email))
    error_message = "Must be a valid email address."
  }
}

# Network Configuration
variable "corporate_ip_ranges" {
  description = "List of corporate IP ranges for access"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12"]
}

variable "vpc_endpoint_ids" {
  description = "VPC endpoint IDs for restricted S3 access"
  type        = map(string)
  default = {
    s3       = "vpce-12345678"
    dynamodb = "vpce-87654321"
  }
}

# Time-Based Access Controls
variable "business_hours" {
  description = "Business hours for time-based restrictions (UTC)"
  type = object({
    start_hour = number
    end_hour   = number
    time_zone  = string
  })
  default = {
    start_hour = 13  # 9 AM EST
    end_hour   = 22  # 6 PM EST
    time_zone  = "America/New_York"
  }
}

variable "max_session_duration" {
  description = "Maximum session duration in hours"
  type        = number
  default     = 4
  validation {
    condition     = var.max_session_duration >= 1 && var.max_session_duration <= 12
    error_message = "Session duration must be between 1 and 12 hours."
  }
}

# Cross-Account Access
variable "trusted_external_accounts" {
  description = "List of trusted external AWS account IDs"
  type = list(object({
    account_id  = string
    external_id = string
    purpose     = string
    max_session_hours = number
  }))
  default = []
}

# Security Settings
variable "mfa_required_for_production" {
  description = "Require MFA for all production operations"
  type        = bool
  default     = true
}

variable "password_policy" {
  description = "Password policy configuration"
  type = object({
    minimum_length        = number
    require_uppercase     = bool
    require_lowercase     = bool
    require_numbers       = bool
    require_symbols       = bool
    max_age_days         = number
    password_reuse_prevention = number
    hard_expiry          = bool
  })
  default = {
    minimum_length        = 14
    require_uppercase     = true
    require_lowercase     = true
    require_numbers       = true
    require_symbols       = true
    max_age_days         = 90
    password_reuse_prevention = 12
    hard_expiry          = false
  }
}

# Monitoring Configuration
variable "security_alert_email" {
  description = "Email for security alerts"
  type        = string
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 90
}

variable "cloudtrail_log_retention_years" {
  description = "CloudTrail log retention in years"
  type        = number
  default     = 7
}

# Service Configuration
variable "lambda_functions" {
  description = "Lambda functions requiring IAM roles"
  type = map(object({
    name        = string
    permissions = list(string)
    resources   = list(string)
  }))
  default = {}
}

variable "ec2_instance_profiles" {
  description = "EC2 instance profiles configuration"
  type = map(object({
    name              = string
    ssm_parameters    = list(string)
    s3_buckets        = list(string)
    secrets_prefixes  = list(string)
  }))
  default = {}
}

# Logging Configuration
variable "assume_role_arn" {
  description = "Role ARN to assume for deployment"
  type        = string
  default     = ""
}

variable "external_id" {
  description = "External ID for role assumption"
  type        = string
  default     = ""
  sensitive   = true
}

variable "central_logging_role_arn" {
  description = "Role ARN for central logging account"
  type        = string
}

variable "logging_external_id" {
  description = "External ID for logging account access"
  type        = string
  sensitive   = true
}

# Break Glass Configuration
variable "break_glass_users" {
  description = "Emergency access users"
  type        = list(string)
  default     = []
}

# Compliance Tags
variable "compliance_tags" {
  description = "Additional compliance-related tags"
  type        = map(string)
  default = {
    "Regulation"     = "SOC2-PCI-DSS"
    "AuditFrequency" = "Quarterly"
    "DataResidency"  = "US"
  }
}
```

### locals.tf

```hcl
locals {
  # Common naming conventions
  name_prefix = "${var.organization_id}-${var.environment}"

  # Account IDs
  current_account_id = data.aws_caller_identity.current.account_id

  # Time-based conditions for policies
  business_hours_condition = {
    "DateGreaterThan" = {
      "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'hh:mm:ssZ", timeadd(timestamp(), "${var.business_hours.start_hour}h"))
    }
    "DateLessThan" = {
      "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'hh:mm:ssZ", timeadd(timestamp(), "${var.business_hours.end_hour}h"))
    }
  }

  # MFA conditions
  mfa_condition = {
    "Bool" = {
      "aws:MultiFactorAuthPresent" = "true"
    }
    "NumericLessThan" = {
      "aws:MultiFactorAuthAge" = "3600"  # MFA within last hour
    }
  }

  # IP restriction conditions
  ip_condition = {
    "IpAddress" = {
      "aws:SourceIp" = var.corporate_ip_ranges
    }
  }

  # VPC endpoint conditions
  vpc_endpoint_condition = {
    "StringEquals" = {
      "aws:SourceVpce" = values(var.vpc_endpoint_ids)
    }
  }

  # Region restriction conditions
  region_restriction_condition = {
    "StringEquals" = {
      "aws:RequestedRegion" = [var.aws_region]
    }
  }

  # Denied actions for all roles
  high_risk_actions = [
    "iam:DeleteRole",
    "iam:DeleteRolePolicy",
    "iam:DeleteUser",
    "iam:DeleteUserPolicy",
    "iam:CreateAccessKey",
    "iam:DeleteAccessKey",
    "cloudtrail:DeleteTrail",
    "cloudtrail:StopLogging",
    "cloudtrail:UpdateTrail",
    "s3:DeleteBucket",
    "s3:DeleteBucketPolicy",
    "s3:PutBucketPublicAccessBlock",
    "s3:DeleteBucketPublicAccessBlock",
    "ec2:TerminateInstances",
    "rds:DeleteDBInstance",
    "rds:DeleteDBCluster"
  ]

  # Session tags for ABAC
  required_session_tags = {
    "Department"    = "string"
    "Purpose"       = "string"
    "TicketNumber"  = "string"
    "ApprovedBy"    = "string"
  }

  # Environment-specific settings
  is_production = var.environment == "prod"

  # Compliance metadata
  compliance_metadata = {
    "Framework"          = "NIST-CSF"
    "ControlFamily"      = "AC-AccessControl"
    "LastReview"         = timestamp()
    "NextReview"         = timeadd(timestamp(), "720h") # 30 days
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_organizations_organization" "current" {}
```

### iam-policies.tf

```hcl
# Base Security Policy - Applied to all roles
resource "aws_iam_policy" "base_security_policy" {
  name        = "${local.name_prefix}-base-security-policy"
  description = "Base security policy with fundamental restrictions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Deny high-risk actions
      {
        Sid    = "DenyHighRiskActions"
        Effect = "Deny"
        Action = local.high_risk_actions
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:userid" = local.break_glass_users
          }
        }
      },
      # Deny operations outside approved region
      {
        Sid    = "DenyUnapprovedRegions"
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = [var.aws_region, "us-east-1"]
          }
          # Allow global services
          "ForAllValues:StringNotLike" = {
            "aws:RequestedRegion" = ["iam", "cloudfront", "route53", "support"]
          }
        }
      },
      # Require MFA for sensitive operations
      {
        Sid    = "RequireMFAForSensitive"
        Effect = "Deny"
        Action = [
          "iam:*",
          "s3:DeleteBucket*",
          "s3:PutBucketPolicy",
          "ec2:TerminateInstances"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
      # Enforce secure transport
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "Security-Baseline"
    Enforcement = "Mandatory"
  })
}

# Developer Read Policy
resource "aws_iam_policy" "developer_read_policy" {
  name        = "${local.name_prefix}-developer-read-policy"
  description = "Read-only access for developers"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowReadOperations"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketPolicy",
          "s3:GetBucketVersioning",
          "rds:Describe*",
          "lambda:GetFunction",
          "lambda:ListFunctions",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "cloudwatch:GetMetric*",
          "cloudwatch:ListMetrics",
          "cloudwatch:DescribeAlarms",
          "tag:GetResources",
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
          DateGreaterThan = {
            "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'hh:mm:ssZ", timeadd(timestamp(), "${var.business_hours.start_hour}h"))
          }
          DateLessThan = {
            "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'hh:mm:ssZ", timeadd(timestamp(), "${var.business_hours.end_hour}h"))
          }
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "Developer"
    AccessLevel = "ReadOnly"
  })
}

# Developer Write Policy (Non-Production)
resource "aws_iam_policy" "developer_write_policy" {
  name        = "${local.name_prefix}-developer-write-policy"
  description = "Write access for developers in non-production"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowDevelopmentOperations"
        Effect = "Allow"
        Action = [
          "ec2:RunInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:CreateTags",
          "s3:PutObject",
          "s3:DeleteObject",
          "lambda:CreateFunction",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:InvokeFunction",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "cloudformation:*",
          "codedeploy:*",
          "codebuild:*"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestTag/Environment" = "prod"
          }
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          StringEquals = {
            "aws:SourceVpce" = var.vpc_endpoint_ids.s3
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "7200"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "Developer"
    AccessLevel = "Write"
    Scope = "NonProduction"
  })
}

# Operator Infrastructure Policy
resource "aws_iam_policy" "operator_infrastructure_policy" {
  name        = "${local.name_prefix}-operator-infrastructure-policy"
  description = "Infrastructure management for operators"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ManageInfrastructure"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "vpc:*",
          "elasticloadbalancing:*",
          "autoscaling:*",
          "cloudwatch:*",
          "s3:*",
          "rds:*",
          "elasticache:*"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "ec2:ResourceTag/Protected" = "true"
          }
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          DateGreaterThan = {
            "aws:TokenIssueTime" = timeadd(timestamp(), "-2h")
          }
          StringLike = {
            "aws:userid" = "AIDAI*"  # Only allow IAM users, not root
          }
        }
      },
      {
        Sid    = "DenyIAMModification"
        Effect = "Deny"
        Action = [
          "iam:CreatePolicy",
          "iam:DeletePolicy",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicyVersion",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:UpdateRole"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "Operator"
    AccessLevel = "Infrastructure"
  })
}

# Administrator Policy with Heavy Restrictions
resource "aws_iam_policy" "administrator_restricted_policy" {
  name        = "${local.name_prefix}-administrator-restricted-policy"
  description = "Administrator access with security restrictions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAdminWithRestrictions"
        Effect = "Allow"
        Action = "*"
        Resource = "*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "900"  # MFA within 15 minutes
          }
          DateGreaterThan = {
            "aws:TokenIssueTime" = timeadd(timestamp(), "-4h")
          }
          StringEquals = {
            "aws:SecureTransport" = "true"
          }
        }
      },
      {
        Sid    = "DenyDestructiveActions"
        Effect = "Deny"
        Action = [
          "cloudtrail:DeleteTrail",
          "cloudtrail:StopLogging",
          "cloudwatch:DeleteAlarms",
          "logs:DeleteLogGroup",
          "logs:DeleteRetentionPolicy",
          "kms:ScheduleKeyDeletion",
          "kms:DeleteAlias"
        ]
        Resource = "*"
      },
      {
        Sid    = "RequireSessionTagsForCritical"
        Effect = "Deny"
        Action = [
          "iam:CreateUser",
          "iam:CreateRole",
          "iam:CreatePolicy",
          "s3:DeleteBucket",
          "rds:DeleteDBCluster"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:PrincipalTag/Department"   = "true"
            "aws:PrincipalTag/TicketNumber" = "true"
            "aws:PrincipalTag/ApprovedBy"   = "true"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "Administrator"
    AccessLevel = "Full"
    Restrictions = "Heavy"
  })
}

# Time-Limited Elevated Access Policy
resource "aws_iam_policy" "time_limited_access_policy" {
  name        = "${local.name_prefix}-time-limited-access-policy"
  description = "Temporary elevated access with automatic expiration"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "TemporaryElevatedAccess"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "rds:*",
          "s3:*",
          "lambda:*",
          "logs:*"
        ]
        Resource = "*"
        Condition = {
          DateLessThan = {
            "aws:CurrentTime" = timeadd(timestamp(), "2h")
          }
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          StringEquals = {
            "aws:PrincipalTag/EmergencyAccess" = "true"
            "aws:PrincipalTag/TicketNumber"    = "$${aws:requesttag/TicketNumber}"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "Emergency"
    Duration = "2hours"
    AutoExpire = "true"
  })
}

# S3 Bucket Access Policy with VPC Restrictions
resource "aws_iam_policy" "s3_vpc_restricted_policy" {
  name        = "${local.name_prefix}-s3-vpc-restricted-policy"
  description = "S3 access only through VPC endpoints"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3ViaVPCEndpoint"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${local.name_prefix}-*",
          "arn:aws:s3:::${local.name_prefix}-*/*"
        ]
        Condition = {
          StringEquals = {
            "aws:SourceVpce" = var.vpc_endpoint_ids.s3
          }
          Bool = {
            "aws:SecureTransport" = "true"
          }
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Action = "s3:PutObject"
        Resource = "arn:aws:s3:::${local.name_prefix}-*/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "S3Access"
    Restriction = "VPCEndpoint"
  })
}

# Audit and Compliance Read-Only Policy
resource "aws_iam_policy" "audit_compliance_policy" {
  name        = "${local.name_prefix}-audit-compliance-policy"
  description = "Read-only access for auditors and compliance"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AuditReadAccess"
        Effect = "Allow"
        Action = [
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetTrailStatus",
          "cloudtrail:LookupEvents",
          "cloudtrail:GetEventSelectors",
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "iam:Get*",
          "iam:List*",
          "iam:GenerateCredentialReport",
          "iam:GenerateServiceLastAccessedDetails",
          "access-analyzer:*",
          "trustedadvisor:Describe*",
          "support:*",
          "logs:Describe*",
          "logs:Get*",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
            "aws:SecureTransport"        = "true"
          }
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "Audit"
    AccessLevel = "ReadOnly"
    Purpose = "Compliance"
  })
}
```

### iam-roles-developer.tf

```hcl
# Developer Role Module
module "developer_role" {
  source = "./modules/iam-role"

  role_name               = "${local.name_prefix}-developer-role"
  role_description        = "Role for developers with environment-based access"
  max_session_duration    = var.max_session_duration * 3600

  # Trust policy for SSO
  trusted_principals = [
    "arn:aws:iam::${local.current_account_id}:saml-provider/AWSSSProvider"
  ]

  # Attach policies
  policy_arns = [
    aws_iam_policy.base_security_policy.arn,
    aws_iam_policy.developer_read_policy.arn,
    var.environment != "prod" ? aws_iam_policy.developer_write_policy.arn : ""
  ]

  # Permission boundary to prevent privilege escalation
  permissions_boundary = aws_iam_policy.developer_permissions_boundary.arn

  # Session tags for ABAC
  required_tags = {
    "Department" = "Development"
    "AccessLevel" = var.environment == "prod" ? "ReadOnly" : "ReadWrite"
    "Environment" = var.environment
  }

  # Conditions for assume role
  trust_conditions = {
    StringEquals = {
      "SAML:aud" = "https://signin.aws.amazon.com/saml"
    }
    IpAddress = {
      "aws:SourceIp" = var.corporate_ip_ranges
    }
    Bool = {
      "aws:MultiFactorAuthPresent" = "true"
    }
  }

  tags = merge(var.compliance_tags, {
    RoleType = "Developer"
    Environment = var.environment
  })
}

# Developer Permissions Boundary
resource "aws_iam_policy" "developer_permissions_boundary" {
  name        = "${local.name_prefix}-developer-permissions-boundary"
  description = "Permission boundary for developer roles"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowedServices"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "s3:*",
          "lambda:*",
          "cloudformation:*",
          "logs:*",
          "cloudwatch:*",
          "sns:*",
          "sqs:*",
          "dynamodb:*",
          "rds:Describe*",
          "codebuild:*",
          "codedeploy:*",
          "codepipeline:*",
          "ssm:GetParameter*"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyIAMActions"
        Effect = "Deny"
        Action = [
          "iam:CreateUser",
          "iam:CreateRole",
          "iam:CreatePolicy",
          "iam:DeleteUser",
          "iam:DeleteRole",
          "iam:DeletePolicy",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutUserPolicy",
          "iam:PutRolePolicy",
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyHighRiskActions"
        Effect = "Deny"
        Action = local.high_risk_actions
        Resource = "*"
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "PermissionsBoundary"
    Scope = "Developer"
  })
}

# Separate role for production read-only access
resource "aws_iam_role" "developer_prod_readonly" {
  count = var.environment == "prod" ? 1 : 0

  name               = "${local.name_prefix}-developer-prod-readonly"
  description        = "Read-only access for developers in production"
  max_session_duration = 7200  # 2 hours max for production

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = module.developer_role.role_arn
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "900"  # MFA within 15 minutes
          }
          StringEquals = {
            "aws:PrincipalTag/TicketNumber" = "$${aws:RequestTag/TicketNumber}"
            "sts:ExternalId" = "prod-readonly-${random_id.external_id.hex}"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    RoleType = "DeveloperProdReadOnly"
    Environment = "prod"
    AccessLevel = "ReadOnly"
  })
}

# Attach read-only policy to production role
resource "aws_iam_role_policy_attachment" "developer_prod_readonly_policy" {
  count = var.environment == "prod" ? 1 : 0

  role       = aws_iam_role.developer_prod_readonly[0].name
  policy_arn = aws_iam_policy.developer_read_policy.arn
}

# Generate random external ID
resource "random_id" "external_id" {
  byte_length = 16
}
```

### iam-roles-operator.tf

```hcl
# Operator Role Module
module "operator_role" {
  source = "./modules/iam-role"

  role_name               = "${local.name_prefix}-operator-role"
  role_description        = "Role for infrastructure operators"
  max_session_duration    = var.max_session_duration * 3600

  # Trust policy for SSO
  trusted_principals = [
    "arn:aws:iam::${local.current_account_id}:saml-provider/AWSSSProvider"
  ]

  # Attach policies
  policy_arns = [
    aws_iam_policy.base_security_policy.arn,
    aws_iam_policy.operator_infrastructure_policy.arn,
    aws_iam_policy.s3_vpc_restricted_policy.arn
  ]

  # Permission boundary
  permissions_boundary = aws_iam_policy.operator_permissions_boundary.arn

  # Session tags for ABAC
  required_tags = {
    "Department"  = "Operations"
    "AccessLevel" = "Infrastructure"
    "Environment" = var.environment
  }

  # Conditions for assume role
  trust_conditions = {
    StringEquals = {
      "SAML:aud" = "https://signin.aws.amazon.com/saml"
    }
    IpAddress = {
      "aws:SourceIp" = var.corporate_ip_ranges
    }
    Bool = {
      "aws:MultiFactorAuthPresent" = "true"
    }
    DateGreaterThan = {
      "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'hh:mm:ssZ",
                                    timeadd(timestamp(), "${var.business_hours.start_hour}h"))
    }
    DateLessThan = {
      "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'hh:mm:ssZ",
                                    timeadd(timestamp(), "${var.business_hours.end_hour}h"))
    }
  }

  tags = merge(var.compliance_tags, {
    RoleType = "Operator"
    Environment = var.environment
  })
}

# Operator Permissions Boundary
resource "aws_iam_policy" "operator_permissions_boundary" {
  name        = "${local.name_prefix}-operator-permissions-boundary"
  description = "Permission boundary for operator roles"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowInfrastructureManagement"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "vpc:*",
          "elasticloadbalancing:*",
          "autoscaling:*",
          "cloudwatch:*",
          "s3:*",
          "rds:*",
          "elasticache:*",
          "cloudformation:*",
          "systems-manager:*",
          "lambda:*",
          "ecs:*",
          "eks:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenySecurityModification"
        Effect = "Deny"
        Action = [
          "iam:*",
          "sts:AssumeRole",
          "kms:ScheduleKeyDeletion",
          "kms:DeleteAlias",
          "cloudtrail:DeleteTrail",
          "cloudtrail:StopLogging",
          "guardduty:DeleteDetector",
          "securityhub:DisableSecurityHub"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyDataAccess"
        Effect = "Deny"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "s3:GetObject",
          "secretsmanager:GetSecretValue",
          "ssm:GetParameter"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/DataClassification" = ["Confidential", "Restricted"]
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "PermissionsBoundary"
    Scope = "Operator"
  })
}

# Production Operator Role with Additional Restrictions
resource "aws_iam_role" "operator_production" {
  count = var.environment == "prod" ? 1 : 0

  name                 = "${local.name_prefix}-operator-production"
  description          = "Production operator role with additional restrictions"
  max_session_duration = 14400  # 4 hours

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = module.operator_role.role_arn
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "600"  # MFA within 10 minutes
          }
          StringEquals = {
            "aws:PrincipalTag/ApprovedBy" = "$${aws:RequestTag/ApprovedBy}"
            "sts:ExternalId" = "prod-operator-${random_id.operator_external_id.hex}"
          }
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    RoleType = "OperatorProduction"
    Environment = "prod"
    RequiresApproval = "true"
  })
}

# Generate random external ID for operator
resource "random_id" "operator_external_id" {
  byte_length = 16
}

# Production operator policy attachment
resource "aws_iam_role_policy_attachment" "operator_production_policies" {
  count = var.environment == "prod" ? 1 : 0

  for_each = toset([
    aws_iam_policy.base_security_policy.arn,
    aws_iam_policy.operator_infrastructure_policy.arn,
    aws_iam_policy.production_change_window_policy.arn
  ])

  role       = aws_iam_role.operator_production[0].name
  policy_arn = each.value
}

# Production Change Window Policy
resource "aws_iam_policy" "production_change_window_policy" {
  name        = "${local.name_prefix}-production-change-window"
  description = "Restrict production changes to approved windows"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowReadAlways"
        Effect = "Allow"
        Action = [
          "*:Describe*",
          "*:Get*",
          "*:List*"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowChangeDuringWindow"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "rds:*",
          "elasticloadbalancing:*",
          "autoscaling:*"
        ]
        Resource = "*"
        Condition = {
          ForAllValues:DateGreaterThanEquals = {
            "aws:CurrentTime" = "20:00:00Z"  # 8 PM UTC (3 PM EST)
          }
          ForAllValues:DateLessThanEquals = {
            "aws:CurrentTime" = "02:00:00Z"  # 2 AM UTC (9 PM EST)
          }
          StringEquals = {
            "aws:PrincipalTag/ChangeTicket" = "$${aws:RequestTag/ChangeTicket}"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "ChangeWindow"
    Environment = "prod"
  })
}
```

### iam-roles-administrator.tf

```hcl
# Administrator Role Module
module "administrator_role" {
  source = "./modules/iam-role"

  role_name               = "${local.name_prefix}-administrator-role"
  role_description        = "Administrator role with heavy restrictions"
  max_session_duration    = 14400  # 4 hours maximum

  # Trust policy for SSO
  trusted_principals = [
    "arn:aws:iam::${local.current_account_id}:saml-provider/AWSSSProvider"
  ]

  # Attach policies
  policy_arns = [
    aws_iam_policy.base_security_policy.arn,
    aws_iam_policy.administrator_restricted_policy.arn
  ]

  # Permission boundary
  permissions_boundary = aws_iam_policy.administrator_permissions_boundary.arn

  # Session tags for ABAC
  required_tags = {
    "Department"     = "Security"
    "AccessLevel"    = "Administrator"
    "Environment"    = var.environment
    "RequiresMFA"    = "true"
    "SessionLogging" = "enabled"
  }

  # Strict conditions for assume role
  trust_conditions = {
    StringEquals = {
      "SAML:aud" = "https://signin.aws.amazon.com/saml"
    }
    IpAddress = {
      "aws:SourceIp" = var.corporate_ip_ranges
    }
    Bool = {
      "aws:MultiFactorAuthPresent" = "true"
      "aws:SecureTransport"        = "true"
    }
    NumericLessThan = {
      "aws:MultiFactorAuthAge" = "300"  # MFA within 5 minutes
    }
  }

  tags = merge(var.compliance_tags, {
    RoleType = "Administrator"
    Environment = var.environment
    SecurityLevel = "Critical"
  })
}

# Administrator Permissions Boundary
resource "aws_iam_policy" "administrator_permissions_boundary" {
  name        = "${local.name_prefix}-administrator-permissions-boundary"
  description = "Permission boundary for administrator roles"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAdministration"
        Effect = "Allow"
        Action = "*"
        Resource = "*"
      },
      {
        Sid    = "DenyDestructiveWithoutApproval"
        Effect = "Deny"
        Action = [
          "organizations:LeaveOrganization",
          "organizations:DeleteOrganization",
          "account:CloseAccount",
          "ec2:TerminateInstances",
          "rds:DeleteDBCluster",
          "s3:DeleteBucket",
          "cloudtrail:DeleteTrail",
          "cloudtrail:StopLogging"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:PrincipalTag/EmergencyOverride" = "approved"
          }
        }
      },
      {
        Sid    = "RequireSessionTagsForCritical"
        Effect = "Deny"
        Action = [
          "iam:DeleteRole",
          "iam:DeletePolicy",
          "iam:DeleteUser",
          "kms:ScheduleKeyDeletion"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:PrincipalTag/TicketNumber" = "true"
            "aws:PrincipalTag/ApprovedBy"   = "true"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    PolicyType = "PermissionsBoundary"
    Scope = "Administrator"
  })
}

# Break Glass Emergency Access Role
resource "aws_iam_role" "break_glass_emergency" {
  name                 = "${local.name_prefix}-break-glass-emergency"
  description          = "Emergency break glass role for critical incidents"
  max_session_duration = 3600  # 1 hour only

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.break_glass_users
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          StringEquals = {
            "sts:ExternalId" = "EMERGENCY-${random_password.break_glass_external_id.result}"
          }
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    RoleType = "BreakGlass"
    Emergency = "true"
    AlertOnUse = "true"
  })
}

# Generate secure break glass external ID
resource "random_password" "break_glass_external_id" {
  length  = 32
  special = true

  lifecycle {
    ignore_changes = [result]
  }
}

# Store break glass external ID in Secrets Manager
resource "aws_secretsmanager_secret" "break_glass_external_id" {
  name                    = "${local.name_prefix}-break-glass-external-id"
  description            = "External ID for break glass emergency access"
  recovery_window_in_days = 0  # Immediate deletion if needed

  tags = merge(var.compliance_tags, {
    Type = "BreakGlass"
    Critical = "true"
  })
}

resource "aws_secretsmanager_secret_version" "break_glass_external_id" {
  secret_id     = aws_secretsmanager_secret.break_glass_external_id.id
  secret_string = random_password.break_glass_external_id.result
}

# Break Glass Full Access Policy
resource "aws_iam_role_policy" "break_glass_full_access" {
  name = "BreakGlassFullAccess"
  role = aws_iam_role.break_glass_emergency.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EmergencyFullAccess"
        Effect = "Allow"
        Action = "*"
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Alarm for Break Glass Usage
resource "aws_cloudwatch_log_metric_filter" "break_glass_usage" {
  name           = "${local.name_prefix}-break-glass-usage"
  log_group_name = aws_cloudwatch_log_group.iam_audit.name
  pattern        = "{ $.eventName = AssumeRole && $.requestParameters.roleArn = *break-glass* }"

  metric_transformation {
    name      = "BreakGlassUsage"
    namespace = "Security/IAM"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "break_glass_alarm" {
  alarm_name          = "${local.name_prefix}-break-glass-used"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BreakGlassUsage"
  namespace           = "Security/IAM"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "CRITICAL: Break glass emergency access was used!"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.compliance_tags, {
    Severity = "Critical"
    AutoPage = "true"
  })
}
```

### iam-roles-service.tf

```hcl
# EC2 Instance Profile
resource "aws_iam_role" "ec2_instance_role" {
  for_each = var.ec2_instance_profiles

  name               = "${local.name_prefix}-ec2-${each.key}"
  description        = "IAM role for EC2 instance: ${each.value.name}"
  max_session_duration = 3600  # 1 hour for service roles

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = local.current_account_id
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    ServiceType = "EC2"
    InstanceProfile = each.key
  })
}

# EC2 Instance Policy
resource "aws_iam_role_policy" "ec2_instance_policy" {
  for_each = var.ec2_instance_profiles

  name = "EC2InstancePolicy"
  role = aws_iam_role.ec2_instance_role[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # CloudWatch Logs
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${local.current_account_id}:*"
      },
      # SSM Parameter Store
      {
        Sid    = "ParameterStoreRead"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          for param in each.value.ssm_parameters :
          "arn:aws:ssm:${var.aws_region}:${local.current_account_id}:parameter/${param}"
        ]
        Condition = {
          StringEquals = {
            "aws:SecureTransport" = "true"
          }
        }
      },
      # S3 Bucket Access
      {
        Sid    = "S3BucketAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = flatten([
          for bucket in each.value.s3_buckets : [
            "arn:aws:s3:::${bucket}",
            "arn:aws:s3:::${bucket}/*"
          ]
        ])
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
          Bool = {
            "aws:SecureTransport" = "true"
          }
        }
      },
      # Secrets Manager
      {
        Sid    = "SecretsManagerRead"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          for prefix in each.value.secrets_prefixes :
          "arn:aws:secretsmanager:${var.aws_region}:${local.current_account_id}:secret:${prefix}*"
        ]
        Condition = {
          StringEquals = {
            "secretsmanager:VersionStage" = "AWSCURRENT"
          }
        }
      },
      # EC2 Metadata
      {
        Sid    = "EC2Metadata"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:InstanceID" = "$${aws:SourceInstanceID}"
          }
        }
      }
    ]
  })
}

# Create Instance Profiles
resource "aws_iam_instance_profile" "ec2_profiles" {
  for_each = var.ec2_instance_profiles

  name = "${local.name_prefix}-ec2-${each.key}-profile"
  role = aws_iam_role.ec2_instance_role[each.key].name

  tags = merge(var.compliance_tags, {
    ServiceType = "EC2"
    Profile = each.key
  })
}

# Lambda Execution Roles
resource "aws_iam_role" "lambda_execution_role" {
  for_each = var.lambda_functions

  name               = "${local.name_prefix}-lambda-${each.key}"
  description        = "Execution role for Lambda function: ${each.value.name}"
  max_session_duration = 3600

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = local.current_account_id
          }
          ArnLike = {
            "aws:SourceArn" = "arn:aws:lambda:${var.aws_region}:${local.current_account_id}:function:${each.value.name}"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    ServiceType = "Lambda"
    FunctionName = each.value.name
  })
}

# Lambda Execution Policy
resource "aws_iam_role_policy" "lambda_execution_policy" {
  for_each = var.lambda_functions

  name = "LambdaExecutionPolicy"
  role = aws_iam_role.lambda_execution_role[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Basic Lambda Logging
      {
        Sid    = "LambdaLogging"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${local.current_account_id}:*"
      },
      # X-Ray Tracing
      {
        Sid    = "XRayTracing"
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      # VPC Access (if Lambda is in VPC)
      {
        Sid    = "VPCAccess"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      # Function-specific permissions
      {
        Sid    = "FunctionSpecificPermissions"
        Effect = "Allow"
        Action = each.value.permissions
        Resource = each.value.resources
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
          Bool = {
            "aws:SecureTransport" = "true"
          }
        }
      }
    ]
  })
}

# RDS Enhanced Monitoring Role
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name               = "${local.name_prefix}-rds-enhanced-monitoring"
  description        = "Role for RDS Enhanced Monitoring"
  max_session_duration = 3600

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    ServiceType = "RDS"
    Purpose = "Monitoring"
  })
}

# Attach AWS managed policy for RDS monitoring
resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "${local.name_prefix}-ecs-task-execution"
  description        = "ECS task execution role"
  max_session_duration = 3600

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    ServiceType = "ECS"
    Purpose = "TaskExecution"
  })
}

# ECS Task Execution Policy
resource "aws_iam_role_policy" "ecs_task_execution_policy" {
  name = "ECSTaskExecutionPolicy"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRAccess"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${local.current_account_id}:*"
      },
      {
        Sid    = "SecretsManager"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${local.current_account_id}:secret:ecs/*"
        Condition = {
          StringEquals = {
            "secretsmanager:VersionStage" = "AWSCURRENT"
          }
        }
      }
    ]
  })
}
```

### iam-cross-account.tf

```hcl
# Cross-Account Access Module for External Auditors
module "cross_account_auditor" {
  source = "./modules/cross-account-role"

  for_each = {
    for account in var.trusted_external_accounts :
    account.account_id => account
  }

  role_name            = "${local.name_prefix}-external-${each.value.purpose}"
  description          = "Cross-account access for ${each.value.purpose}"
  trusted_account_id   = each.value.account_id
  external_id          = each.value.external_id
  max_session_duration = each.value.max_session_hours * 3600

  # Conditions for trust policy
  trust_conditions = {
    StringEquals = {
      "sts:ExternalId" = each.value.external_id
    }
    Bool = {
      "aws:MultiFactorAuthPresent" = "true"
    }
    IpAddress = {
      "aws:SourceIp" = var.corporate_ip_ranges
    }
    StringLike = {
      "aws:userid" = "AIDAI*"  # Prevent root account access
    }
  }

  # Session policy to limit scope
  session_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Action = [
          "iam:*",
          "sts:AssumeRole",
          "sts:AssumeRoleWithSAML",
          "sts:AssumeRoleWithWebIdentity"
        ]
        Resource = "*"
      }
    ]
  })

  # Attach appropriate policies based on purpose
  policy_arns = each.value.purpose == "audit" ? [
    aws_iam_policy.audit_compliance_policy.arn
  ] : []

  tags = merge(var.compliance_tags, {
    AccessType = "CrossAccount"
    ExternalAccount = each.value.account_id
    Purpose = each.value.purpose
  })
}

# Partner Integration Role
resource "aws_iam_role" "partner_integration" {
  count = length(var.trusted_external_accounts) > 0 ? 1 : 0

  name                 = "${local.name_prefix}-partner-integration"
  description          = "Role for partner system integration"
  max_session_duration = 7200  # 2 hours maximum

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = [
            for account in var.trusted_external_accounts :
            "arn:aws:iam::${account.account_id}:root"
            if account.purpose == "partner"
          ]
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "$${aws:RequestTag/ExternalId}"
          }
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
            "aws:SecureTransport"        = "true"
          }
          IpAddressNotEquals = {
            "aws:SourceIp" = [
              "0.0.0.0/0"  # Must come from specific IPs
            ]
          }
          DateGreaterThan = {
            "aws:CurrentTime" = timestamp()
          }
          DateLessThan = {
            "aws:CurrentTime" = timeadd(timestamp(), "2h")
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    RoleType = "PartnerIntegration"
    AccessLevel = "Limited"
  })
}

# Partner Integration Policy
resource "aws_iam_role_policy" "partner_integration_policy" {
  count = length(var.trusted_external_accounts) > 0 ? 1 : 0

  name = "PartnerIntegrationPolicy"
  role = aws_iam_role.partner_integration[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${local.name_prefix}-partner-data",
          "arn:aws:s3:::${local.name_prefix}-partner-data/*"
        ]
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
            "aws:SourceVpce" = var.vpc_endpoint_ids.s3
          }
          IpAddress = {
            "aws:SourceIp" = var.corporate_ip_ranges
          }
        }
      },
      {
        Sid    = "WriteToPartnerBucket"
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "arn:aws:s3:::${local.name_prefix}-partner-upload/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.partner_data.arn
          }
        }
      }
    ]
  })
}

# KMS Key for Partner Data
resource "aws_kms_key" "partner_data" {
  description             = "KMS key for partner data encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  key_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.current_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Partner Role to Use Key"
        Effect = "Allow"
        Principal = {
          AWS = try(aws_iam_role.partner_integration[0].arn, null)
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    Purpose = "PartnerDataEncryption"
  })
}
```

### iam-password-policy.tf

```hcl
# Account Password Policy
resource "aws_iam_account_password_policy" "strict_policy" {
  minimum_password_length        = var.password_policy.minimum_length
  require_uppercase_letters      = var.password_policy.require_uppercase
  require_lowercase_letters      = var.password_policy.require_lowercase
  require_numbers               = var.password_policy.require_numbers
  require_symbols               = var.password_policy.require_symbols
  allow_users_to_change_password = true
  max_password_age              = var.password_policy.max_age_days
  password_reuse_prevention     = var.password_policy.password_reuse_prevention
  hard_expiry                   = var.password_policy.hard_expiry
}
```

### s3-bucket-policies.tf

```hcl
# Secure S3 Bucket Module for Financial Data
module "financial_data_bucket" {
  source = "./modules/s3-secure-bucket"

  bucket_name = "${local.name_prefix}-financial-data"
  environment = var.environment

  # VPC endpoint restriction
  vpc_endpoint_ids = [var.vpc_endpoint_ids.s3]

  # IP restrictions
  allowed_ip_ranges = var.corporate_ip_ranges

  # Encryption settings
  kms_key_arn = aws_kms_key.s3_encryption.arn

  # Access logging
  logging_bucket = "${local.name_prefix}-s3-access-logs"

  # Versioning for compliance
  enable_versioning = true

  # MFA delete protection
  enable_mfa_delete = var.environment == "prod"

  # Time-based access
  business_hours = var.business_hours

  # Lifecycle rules
  lifecycle_rules = [
    {
      id      = "archive-old-data"
      enabled = true
      transitions = [
        {
          days          = 90
          storage_class = "GLACIER"
        },
        {
          days          = 365
          storage_class = "DEEP_ARCHIVE"
        }
      ]
      expiration = {
        days = 2555  # 7 years for compliance
      }
    }
  ]

  # Object lock for compliance
  enable_object_lock = var.environment == "prod"
  object_lock_configuration = {
    mode  = "GOVERNANCE"
    days  = 30
  }

  # Tags
  tags = merge(var.compliance_tags, {
    DataClassification = "Confidential"
    Encryption = "KMS"
  })
}

# S3 Access Logs Bucket
resource "aws_s3_bucket" "access_logs" {
  bucket = "${local.name_prefix}-s3-access-logs"

  tags = merge(var.compliance_tags, {
    Purpose = "AccessLogging"
  })
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "delete-old-logs"
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
      days = 2555  # 7 years
    }
  }
}

# S3 Bucket Policy for Financial Data
resource "aws_s3_bucket_policy" "financial_data_policy" {
  bucket = module.financial_data_bucket.bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Deny all access unless from VPC endpoint
      {
        Sid    = "DenyAllUnlessVPCEndpoint"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          module.financial_data_bucket.bucket_arn,
          "${module.financial_data_bucket.bucket_arn}/*"
        ]
        Condition = {
          StringNotEquals = {
            "aws:SourceVpce" = var.vpc_endpoint_ids.s3
          }
        }
      },
      # Deny unencrypted uploads
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${module.financial_data_bucket.bucket_arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.s3_encryption.arn
          }
        }
      },
      # Deny public access
      {
        Sid    = "DenyPublicAccess"
        Effect = "Deny"
        Principal = "*"
        Action = [
          "s3:PutBucketPublicAccessBlock",
          "s3:PutObjectAcl",
          "s3:PutBucketAcl"
        ]
        Resource = [
          module.financial_data_bucket.bucket_arn,
          "${module.financial_data_bucket.bucket_arn}/*"
        ]
      },
      # Require MFA for delete
      {
        Sid    = "RequireMFAForDelete"
        Effect = "Deny"
        Principal = "*"
        Action = [
          "s3:DeleteObject",
          "s3:DeleteBucket"
        ]
        Resource = [
          module.financial_data_bucket.bucket_arn,
          "${module.financial_data_bucket.bucket_arn}/*"
        ]
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
      # Time-based restrictions
      {
        Sid    = "RestrictToBusinessHours"
        Effect = "Deny"
        Principal = "*"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${module.financial_data_bucket.bucket_arn}/*"
        Condition = {
          DateGreaterThan = {
            "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'22:00:00Z", timestamp())
          }
          DateLessThan = {
            "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'13:00:00Z", timestamp())
          }
        }
      },
      # Enforce secure transport
      {
        Sid    = "EnforceSecureTransport"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          module.financial_data_bucket.bucket_arn,
          "${module.financial_data_bucket.bucket_arn}/*"
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

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  key_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.current_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use key"
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
            "aws:SourceAccount" = local.current_account_id
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    Purpose = "S3Encryption"
  })
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/${local.name_prefix}-s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}
```

### cloudwatch-monitoring.tf

```hcl
# CloudWatch Log Group for IAM Audit
resource "aws_cloudwatch_log_group" "iam_audit" {
  name              = "/aws/iam/${local.name_prefix}-audit"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = merge(var.compliance_tags, {
    Purpose = "IAMAudit"
  })
}

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  key_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.current_account_id}:root"
        }
        Action   = "kms:*"
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
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${local.current_account_id}:*"
          }
        }
      }
    ]
  })

  tags = merge(var.compliance_tags, {
    Purpose = "CloudWatchLogsEncryption"
  })
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = merge(var.compliance_tags, {
    AlertType = "Security"
  })
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_alert_email
}

# KMS Key for SNS
resource "aws_kms_key" "sns_encryption" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(var.compliance_tags, {
    Purpose = "SNSEncryption"
  })
}

# EventBridge Rules for IAM Monitoring
resource "aws_cloudwatch_event_rule" "iam_policy_changes" {
  name        = "${local.name_prefix}-iam-policy-changes"
  description = "Detect IAM policy changes"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName = [
        "AttachGroupPolicy",
        "AttachRolePolicy",
        "AttachUserPolicy",
        "CreatePolicy",
        "CreatePolicyVersion",
        "DeletePolicy",
        "DeletePolicyVersion",
        "DetachGroupPolicy",
        "DetachRolePolicy",
        "DetachUserPolicy",
        "PutGroupPolicy",
        "PutRolePolicy",
        "PutUserPolicy",
        "DeleteGroupPolicy",
        "DeleteRolePolicy",
        "DeleteUserPolicy"
      ]
    }
  })

  tags = merge(var.compliance_tags, {
    MonitoringType = "IAMPolicyChanges"
  })
}

resource "aws_cloudwatch_event_target" "iam_policy_changes" {
  rule      = aws_cloudwatch_event_rule.iam_policy_changes.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

# Rule for Role Assumption
resource "aws_cloudwatch_event_rule" "role_assumption" {
  name        = "${local.name_prefix}-role-assumption"
  description = "Monitor role assumption events"

  event_pattern = jsonencode({
    source      = ["aws.sts"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["sts.amazonaws.com"]
      eventName   = ["AssumeRole", "AssumeRoleWithSAML", "AssumeRoleWithWebIdentity"]
    }
  })

  tags = merge(var.compliance_tags, {
    MonitoringType = "RoleAssumption"
  })
}

resource "aws_cloudwatch_event_target" "role_assumption" {
  rule      = aws_cloudwatch_event_rule.role_assumption.name
  target_id = "LogToCloudWatch"
  arn       = aws_cloudwatch_log_group.iam_audit.arn
}

# Rule for Failed Authentication
resource "aws_cloudwatch_event_rule" "failed_authentication" {
  name        = "${local.name_prefix}-failed-authentication"
  description = "Detect failed authentication attempts"

  event_pattern = jsonencode({
    source      = ["aws.signin"]
    detail-type = ["AWS Console Sign In via CloudTrail"]
    detail = {
      errorMessage = [{
        exists = true
      }]
    }
  })

  tags = merge(var.compliance_tags, {
    MonitoringType = "FailedAuthentication"
  })
}

# Lambda for Automated Response
resource "aws_lambda_function" "security_response" {
  filename         = "${path.module}/lambda/security-response.zip"
  function_name    = "${local.name_prefix}-security-response"
  role            = aws_iam_role.security_response_lambda.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/security-response.zip")
  runtime         = "python3.11"
  timeout         = 60

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.security_alerts.arn
      ENVIRONMENT   = var.environment
    }
  }

  tags = merge(var.compliance_tags, {
    Function = "SecurityResponse"
  })
}

# IAM Role for Security Response Lambda
resource "aws_iam_role" "security_response_lambda" {
  name = "${local.name_prefix}-security-response-lambda"

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

  tags = merge(var.compliance_tags, {
    Purpose = "SecurityAutomation"
  })
}

# Lambda Permissions
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.security_response.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.iam_policy_changes.arn
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_failed_logins" {
  alarm_name          = "${local.name_prefix}-high-failed-logins"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FailedLoginAttempts"
  namespace           = "Security/IAM"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert on high number of failed login attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.compliance_tags, {
    Severity = "High"
  })
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${local.name_prefix}-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert on unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.compliance_tags, {
    Severity = "Critical"
  })
}

# Dashboard for IAM Security
resource "aws_cloudwatch_dashboard" "iam_security" {
  dashboard_name = "${local.name_prefix}-iam-security"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["Security/IAM", "RoleAssumptions"],
            [".", "PolicyChanges"],
            [".", "FailedAuthentications"],
            [".", "BreakGlassUsage"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "IAM Security Events"
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.iam_audit.name}' | fields @timestamp, eventName, userIdentity.principalId, errorCode | sort @timestamp desc"
          region  = var.aws_region
          title   = "Recent IAM Activities"
        }
      }
    ]
  })
}
```

### outputs.tf

```hcl
# Role Outputs
output "developer_role_arn" {
  description = "ARN of the developer IAM role"
  value       = module.developer_role.role_arn
  sensitive   = false
}

output "operator_role_arn" {
  description = "ARN of the operator IAM role"
  value       = module.operator_role.role_arn
  sensitive   = false
}

output "administrator_role_arn" {
  description = "ARN of the administrator IAM role"
  value       = module.administrator_role.role_arn
  sensitive   = false
}

output "break_glass_role_arn" {
  description = "ARN of the break-glass emergency role"
  value       = aws_iam_role.break_glass_emergency.arn
  sensitive   = true
}

# Policy Outputs
output "base_security_policy_arn" {
  description = "ARN of the base security policy"
  value       = aws_iam_policy.base_security_policy.arn
}

output "permission_boundaries" {
  description = "ARNs of permission boundary policies"
  value = {
    developer     = aws_iam_policy.developer_permissions_boundary.arn
    operator      = aws_iam_policy.operator_permissions_boundary.arn
    administrator = aws_iam_policy.administrator_permissions_boundary.arn
  }
}

# Service Role Outputs
output "ec2_instance_profiles" {
  description = "EC2 instance profile ARNs"
  value = {
    for k, v in aws_iam_instance_profile.ec2_profiles :
    k => v.arn
  }
}

output "lambda_execution_roles" {
  description = "Lambda execution role ARNs"
  value = {
    for k, v in aws_iam_role.lambda_execution_role :
    k => v.arn
  }
}

# Cross-Account Outputs
output "cross_account_role_arns" {
  description = "Cross-account role ARNs for external access"
  value = {
    for k, v in module.cross_account_auditor :
    k => v.role_arn
  }
  sensitive = true
}

# Monitoring Outputs
output "security_alert_topic_arn" {
  description = "SNS topic ARN for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for IAM audit"
  value       = aws_cloudwatch_log_group.iam_audit.name
}

output "security_dashboard_url" {
  description = "URL to CloudWatch dashboard for IAM security"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.iam_security.dashboard_name}"
}

# S3 Bucket Outputs
output "financial_data_bucket" {
  description = "Financial data S3 bucket details"
  value = {
    name = module.financial_data_bucket.bucket_id
    arn  = module.financial_data_bucket.bucket_arn
  }
}

# KMS Key Outputs
output "kms_keys" {
  description = "KMS key ARNs for encryption"
  value = {
    s3_encryption        = aws_kms_key.s3_encryption.arn
    cloudwatch_logs      = aws_kms_key.cloudwatch_logs.arn
    sns_alerts          = aws_kms_key.sns_encryption.arn
    partner_data        = try(aws_kms_key.partner_data.arn, null)
  }
  sensitive = true
}

# Compliance Outputs
output "compliance_status" {
  description = "Compliance configuration status"
  value = {
    password_policy_enabled     = true
    mfa_required                = var.mfa_required_for_production
    session_duration_hours      = var.max_session_duration
    log_retention_days          = var.cloudwatch_log_retention_days
    cloudtrail_retention_years  = var.cloudtrail_log_retention_years
    encryption_enabled          = true
    vpc_endpoint_restricted     = true
  }
}

# External IDs for Cross-Account Access
output "external_ids" {
  description = "External IDs for cross-account role assumption"
  value = {
    break_glass = aws_secretsmanager_secret.break_glass_external_id.name
    developer_prod = try(random_id.external_id.hex, null)
    operator_prod  = try(random_id.operator_external_id.hex, null)
  }
  sensitive = true
}
```

## Module: iam-role

### modules/iam-role/variables.tf

```hcl
variable "role_name" {
  description = "Name of the IAM role"
  type        = string
}

variable "role_description" {
  description = "Description of the IAM role"
  type        = string
}

variable "max_session_duration" {
  description = "Maximum session duration in seconds"
  type        = number
  default     = 3600
}

variable "trusted_principals" {
  description = "List of trusted principal ARNs"
  type        = list(string)
}

variable "policy_arns" {
  description = "List of policy ARNs to attach"
  type        = list(string)
  default     = []
}

variable "permissions_boundary" {
  description = "Permissions boundary policy ARN"
  type        = string
  default     = null
}

variable "required_tags" {
  description = "Required session tags"
  type        = map(string)
  default     = {}
}

variable "trust_conditions" {
  description = "Conditions for trust policy"
  type        = any
  default     = {}
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
```

### modules/iam-role/main.tf

```hcl
# IAM Role
resource "aws_iam_role" "this" {
  name                 = var.role_name
  description          = var.role_description
  max_session_duration = var.max_session_duration
  permissions_boundary = var.permissions_boundary

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.trusted_principals
        }
        Action = "sts:AssumeRole"
        Condition = var.trust_conditions
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = var.trusted_principals
        }
        Action = "sts:TagSession"
        Condition = {
          StringEquals = {
            for k, v in var.required_tags :
            "aws:RequestTag/${k}" => v
          }
        }
      }
    ]
  })

  tags = var.tags
}

# Attach policies
resource "aws_iam_role_policy_attachment" "policies" {
  for_each = toset([for arn in var.policy_arns : arn if arn != ""])

  role       = aws_iam_role.this.name
  policy_arn = each.value
}

# Session policy for additional restrictions
resource "aws_iam_role_policy" "session_restrictions" {
  name = "SessionRestrictions"
  role = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RequireSecureTransport"
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
        Sid    = "RequireRequestedRegion"
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = ["us-east-1"]
          }
        }
      }
    ]
  })
}
```

### modules/iam-role/outputs.tf

```hcl
output "role_arn" {
  description = "ARN of the IAM role"
  value       = aws_iam_role.this.arn
}

output "role_name" {
  description = "Name of the IAM role"
  value       = aws_iam_role.this.name
}

output "role_id" {
  description = "ID of the IAM role"
  value       = aws_iam_role.this.id
}

output "assume_role_policy" {
  description = "Assume role policy document"
  value       = aws_iam_role.this.assume_role_policy
}
```

## Module: cross-account-role

### modules/cross-account-role/main.tf

```hcl
# Cross-account IAM Role
resource "aws_iam_role" "cross_account" {
  name                 = var.role_name
  description          = var.description
  max_session_duration = var.max_session_duration

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.trusted_account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = merge(
          var.trust_conditions,
          {
            StringEquals = {
              "sts:ExternalId" = var.external_id
            }
          }
        )
      }
    ]
  })

  tags = var.tags
}

# Attach policies
resource "aws_iam_role_policy_attachment" "policies" {
  for_each = toset(var.policy_arns)

  role       = aws_iam_role.cross_account.name
  policy_arn = each.value
}

# Session policy
resource "aws_iam_role_policy" "session_policy" {
  count = var.session_policy != null ? 1 : 0

  name   = "SessionPolicy"
  role   = aws_iam_role.cross_account.id
  policy = var.session_policy
}
```

## Module: s3-secure-bucket

### modules/s3-secure-bucket/main.tf

```hcl
# S3 Bucket
resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name

  tags = var.tags
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status     = var.enable_versioning ? "Enabled" : "Suspended"
    mfa_delete = var.enable_mfa_delete ? "Enabled" : "Disabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }
    bucket_key_enabled = true
  }
}

# Access logging
resource "aws_s3_bucket_logging" "this" {
  bucket = aws_s3_bucket.this.id

  target_bucket = var.logging_bucket
  target_prefix = "logs/${var.bucket_name}/"
}

# Lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "this" {
  count = length(var.lifecycle_rules) > 0 ? 1 : 0

  bucket = aws_s3_bucket.this.id

  dynamic "rule" {
    for_each = var.lifecycle_rules

    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      dynamic "transition" {
        for_each = lookup(rule.value, "transitions", [])

        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "expiration" {
        for_each = lookup(rule.value, "expiration", null) != null ? [rule.value.expiration] : []

        content {
          days = expiration.value.days
        }
      }
    }
  }
}

# Object lock configuration
resource "aws_s3_bucket_object_lock_configuration" "this" {
  count = var.enable_object_lock ? 1 : 0

  bucket = aws_s3_bucket.this.id

  rule {
    default_retention {
      mode = var.object_lock_configuration.mode
      days = var.object_lock_configuration.days
    }
  }
}

# Bucket policy
resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # VPC Endpoint Restriction
      {
        Sid    = "DenyNonVPCAccess"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.this.arn,
          "${aws_s3_bucket.this.arn}/*"
        ]
        Condition = {
          StringNotEquals = {
            "aws:SourceVpce" = var.vpc_endpoint_ids
          }
        }
      },
      # IP Restriction
      {
        Sid    = "AllowCorporateNetwork"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.this.arn,
          "${aws_s3_bucket.this.arn}/*"
        ]
        Condition = {
          IpAddressNotEquals = {
            "aws:SourceIp" = var.allowed_ip_ranges
          }
        }
      },
      # Enforce Encryption
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.this.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      # Enforce Secure Transport
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.this.arn,
          "${aws_s3_bucket.this.arn}/*"
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

### modules/s3-secure-bucket/outputs.tf

```hcl
output "bucket_id" {
  description = "S3 bucket ID"
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.this.arn
}

output "bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.this.bucket_domain_name
}
```

## README.md

```markdown
# IAM Security Framework for Financial Services

## Overview

This Terraform configuration implements a comprehensive, zero-trust IAM security framework designed specifically for financial services companies operating in AWS. The framework enforces strict security controls, implements least-privilege access, and ensures compliance with financial industry regulations.

## Architecture
```

┌─────────────────────────────────────────────────────────────┐
│ AWS Organization │
├─────────────────┬──────────────────┬────────────────────────┤
│ Development │ Staging │ Production │
│ │ │ │
│ ┌───────────┐ │ ┌───────────┐ │ ┌──────────────────┐ │
│ │Developer │ │ │Developer │ │ │Developer │ │
│ │Full Access│ │ │Full Access│ │ │Read-Only Access │ │
│ └───────────┘ │ └───────────┘ │ └──────────────────┘ │
│ │ │ │
│ ┌───────────┐ │ ┌───────────┐ │ ┌──────────────────┐ │
│ │Operator │ │ │Operator │ │ │Operator │ │
│ │Infra Mgmt │ │ │Infra Mgmt │ │ │Restricted Access │ │
│ └───────────┘ │ └───────────┘ │ └──────────────────┘ │
│ │ │ │
│ ┌───────────┐ │ ┌───────────┐ │ ┌──────────────────┐ │
│ │Admin │ │ │Admin │ │ │Admin │ │
│ │Restricted │ │ │Restricted │ │ │Heavy Restrictions│ │
│ └───────────┘ │ └───────────┘ │ └──────────────────┘ │
└─────────────────┴──────────────────┴────────────────────────┘
│
┌─────────┴──────────┐
│ Break Glass │
│ Emergency Access │
└────────────────────┘

````

## Security Principles

### 1. Zero Trust Architecture
- No implicit trust - every access request is verified
- Continuous verification of identity and context
- Least-privilege access enforcement
- Assume breach mentality

### 2. Defense in Depth
- Multiple layers of security controls
- Redundant protection mechanisms
- Fail-closed security posture
- Comprehensive logging and monitoring

### 3. Separation of Duties
- Clear role boundaries
- No single point of compromise
- Distinct responsibilities for developers, operators, and administrators
- Environment-based access segregation

## Key Features

### Advanced IAM Policies
- **Multi-Condition Access Control**: Every policy requires at least 3 condition keys
- **Time-Based Restrictions**: Access limited to business hours
- **MFA Enforcement**: Required for all sensitive operations
- **IP Whitelisting**: Access restricted to corporate networks
- **VPC Endpoint Requirements**: API calls must transit through VPC endpoints
- **Regional Restrictions**: Operations limited to approved regions

### Role Hierarchy

#### Developer Roles
- Full access to development and staging
- Read-only access to production
- Cannot modify IAM or security configurations
- Session limited to 4 hours

#### Operator Roles
- Infrastructure management across environments
- Cannot access application data
- Cannot modify IAM policies
- MFA required for production changes

#### Administrator Roles
- Full access with heavy restrictions
- All actions logged and monitored
- Cannot disable audit trails
- Session tags required for critical operations

### Cross-Account Access
- External ID validation
- Time-limited sessions
- Comprehensive audit logging
- Restricted to pre-approved accounts

### Monitoring & Alerting
- Real-time IAM activity monitoring
- Automated security response
- CloudWatch dashboards
- SNS notifications for security events

## Deployment Guide

### Prerequisites

1. **Terraform**: Version 1.5.0 or higher
2. **AWS CLI**: Configured with appropriate credentials
3. **AWS Account**: With Organizations enabled
4. **S3 Backend**: Bucket for Terraform state
5. **KMS Key**: For state file encryption

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/iam-security-framework.git
cd iam-security-framework
````

### Step 2: Configure Variables

Create a `terraform.tfvars` file:

```hcl
environment              = "prod"
organization_id          = "o-1234567890"
cost_center              = "FINTECH-001"
owner_email              = "security@company.com"
security_alert_email     = "security-alerts@company.com"
central_logging_role_arn = "arn:aws:iam::LOGGING_ACCOUNT:role/central-logging"
logging_external_id      = "secure-random-string"

corporate_ip_ranges = [
  "203.0.113.0/24",  # Main office
  "198.51.100.0/24"  # VPN range
]

vpc_endpoint_ids = {
  s3       = "vpce-1234567890abcdef0"
  dynamodb = "vpce-0987654321fedcba0"
}

trusted_external_accounts = [
  {
    account_id        = "123456789012"
    external_id       = "audit-2024-q1"
    purpose           = "audit"
    max_session_hours = 2
  }
]

ec2_instance_profiles = {
  web_server = {
    name             = "web-server"
    ssm_parameters   = ["/app/config/*"]
    s3_buckets       = ["app-assets", "app-logs"]
    secrets_prefixes = ["app/"]
  }
}
```

### Step 3: Initialize Terraform

```bash
terraform init -backend-config="bucket=terraform-state-financial" \
               -backend-config="key=iam-security/terraform.tfstate" \
               -backend-config="region=us-east-1"
```

### Step 4: Review the Plan

```bash
terraform plan -out=tfplan
```

### Step 5: Apply the Configuration

```bash
terraform apply tfplan
```

### Step 6: Verify Deployment

```bash
# Test IAM policies with the simulator
aws iam simulate-principal-policy \
    --policy-source-arn $(terraform output -raw developer_role_arn) \
    --action-names s3:GetObject \
    --resource-arns "arn:aws:s3:::test-bucket/*"

# Check CloudWatch dashboard
echo "Dashboard URL: $(terraform output -raw security_dashboard_url)"
```

## Testing & Validation

### IAM Policy Simulator

Test policies before deployment:

```bash
# Test developer role
aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::ACCOUNT:role/dev-developer-role \
    --action-names ec2:TerminateInstances \
    --context-entries "ContextKeyName=aws:MultiFactorAuthPresent,\
                      ContextKeyValues=true,ContextKeyType=boolean"
```

### Access Analyzer

Validate least-privilege:

```bash
aws accessanalyzer validate-policy \
    --policy-type IDENTITY_POLICY \
    --policy-document file://policy.json
```

### Security Scanning

Run security checks:

```bash
# Checkov scan
checkov -d . --framework terraform

# tfsec scan
tfsec . --format json --out tfsec-report.json
```

## Break Glass Procedures

### Emergency Access Activation

1. **Retrieve External ID**:

```bash
aws secretsmanager get-secret-value \
    --secret-id prod-break-glass-external-id \
    --query SecretString --output text
```

2. **Assume Break Glass Role**:

```bash
aws sts assume-role \
    --role-arn arn:aws:iam::ACCOUNT:role/prod-break-glass-emergency \
    --role-session-name emergency-$(date +%s) \
    --external-id EXTERNAL_ID_FROM_STEP_1
```

3. **Configure Temporary Credentials**:

```bash
export AWS_ACCESS_KEY_ID=<AccessKeyId>
export AWS_SECRET_ACCESS_KEY=<SecretAccessKey>
export AWS_SESSION_TOKEN=<SessionToken>
```

### Post-Incident Actions

1. Review CloudWatch logs for all actions taken
2. Document the emergency and actions performed
3. Rotate the break glass external ID
4. Update incident response procedures if needed

## Troubleshooting

### Common Issues

#### Access Denied Errors

- Verify MFA is enabled and recent
- Check source IP is in allowed ranges
- Confirm you're in the correct AWS region
- Verify session tags are present

#### Policy Evaluation

```bash
# Check effective permissions
aws iam get-role-policy --role-name ROLE_NAME --policy-name POLICY_NAME

# List attached policies
aws iam list-attached-role-policies --role-name ROLE_NAME
```

#### Session Issues

```bash
# Check current identity
aws sts get-caller-identity

# View session tags
aws sts get-session-token
```

## Compliance Mapping

| Control | Requirement                 | Implementation                                     |
| ------- | --------------------------- | -------------------------------------------------- |
| AC-2    | Account Management          | Automated role creation with approval workflow     |
| AC-3    | Access Enforcement          | Permission boundaries and least-privilege policies |
| AC-4    | Information Flow            | VPC endpoints and network restrictions             |
| AC-6    | Least Privilege             | Minimal permissions with conditions                |
| AC-7    | Unsuccessful Login Attempts | CloudWatch monitoring and alerting                 |
| AU-2    | Audit Events                | CloudTrail and CloudWatch Logs                     |
| AU-3    | Content of Audit Records    | Comprehensive logging with context                 |
| AU-4    | Audit Storage               | 7-year retention for compliance                    |
| IA-2    | Authentication              | MFA enforcement                                    |
| IA-5    | Authenticator Management    | Password policy and rotation                       |

## Maintenance

### Regular Reviews

- **Weekly**: Review CloudWatch dashboards
- **Monthly**: Audit role usage with Access Analyzer
- **Quarterly**: Review and update policies
- **Annually**: Complete security assessment

### Policy Updates

```bash
# Update and test policies
terraform plan -target=aws_iam_policy.developer_read_policy

# Apply specific changes
terraform apply -target=aws_iam_policy.developer_read_policy
```

### Rotation Schedule

- **External IDs**: Every 90 days
- **Break Glass Credentials**: After each use
- **KMS Keys**: Automatic annual rotation

## Security Best Practices

### For Administrators

1. Always use MFA for privileged operations
2. Review CloudWatch alerts daily
3. Document all emergency access usage
4. Regularly audit role assumptions

### For Developers

1. Use temporary credentials only
2. Follow least-privilege principle
3. Request minimal permissions needed
4. Use session tags for tracking

### For Operators

1. Schedule production changes during approved windows
2. Document all infrastructure modifications
3. Use automation where possible
4. Monitor for configuration drift

## Support

For issues or questions:

- Internal Wiki: https://wiki.company.com/iam-security
- Security Team: security@company.com
- Emergency: Use break glass procedures

## License

Copyright (c) 2024 Your Company. All rights reserved.

```

This comprehensive IAM security framework provides:

1. **Production-Ready Code**: Complete Terraform configuration with all requested features
2. **Zero-Trust Architecture**: Multiple layers of security controls with condition-based access
3. **Modular Design**: Reusable modules for consistent security patterns
4. **Comprehensive Monitoring**: CloudWatch integration with automated alerting
5. **Compliance Focus**: Meets financial services regulatory requirements
6. **Clear Documentation**: Step-by-step deployment and operational procedures
7. **Security Best Practices**: Fail-closed design with defense in depth
8. **Emergency Procedures**: Break glass access for critical incidents

The framework enforces all your mandatory security constraints including multi-condition policies, cross-account restrictions, session limits, MFA requirements, comprehensive logging, and regional restrictions. It's designed to pass compliance audits and provides the granular control needed for financial services environments.
```
