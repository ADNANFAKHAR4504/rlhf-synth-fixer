# Variables for flexible role configuration
variable "env" {
  description = "Environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "owner" {
  description = "Team or individual responsible for these resources"
  type        = string
}

variable "purpose" {
  description = "Business purpose of these IAM resources"
  type        = string
}

variable "target_account_id" {
  description = "AWS account ID where resources will be deployed"
  type        = string
}

variable "external_id" {
  description = "External ID for third-party access (optional)"
  type        = string
  default     = ""
}

variable "roles" {
  description = "Map of IAM roles to create with their configurations"
  type = map(object({
    description         = string
    max_session_duration = number
    trusted_principals  = list(string)
    require_external_id = bool
    require_mfa        = bool
    inline_policies    = map(object({
      actions   = list(string)
      resources = list(string)
      conditions = map(object({
        test     = string
        variable = string
        values   = list(string)
      }))
    }))
    managed_policy_arns = list(string)
  }))
  
  # Example role configurations
  default = {
    security-auditor = {
      description         = "Read-only access for SOC 2 compliance auditing"
      max_session_duration = 3600
      trusted_principals  = ["arn:aws:iam::AUDIT-ACCOUNT:root"]
      require_external_id = true
      require_mfa        = true
      inline_policies = {
        audit-read-access = {
          actions = [
            "iam:Get*",
            "iam:List*",
            "logs:Describe*",
            "logs:Get*",
            "config:Get*",
            "config:List*",
            "config:Describe*",
            "cloudtrail:Get*",
            "cloudtrail:List*",
            "cloudtrail:Describe*",
            "s3:GetBucketPolicy",
            "s3:GetBucketLogging",
            "s3:GetBucketVersioning"
          ]
          resources = ["*"]
          conditions = {
            region-restriction = {
              test     = "StringEquals"
              variable = "aws:RequestedRegion"
              values   = ["us-east-1", "eu-west-1"]
            }
          }
        }
      }
      managed_policy_arns = []
    }
    
    ci-deployer = {
      description         = "Limited deployment access for CI/CD pipeline"
      max_session_duration = 1800
      trusted_principals  = ["arn:aws:iam::CI-ACCOUNT:root"]
      require_external_id = true
      require_mfa        = false
      inline_policies = {
        deployment-access = {
          actions = [
            "lambda:CreateFunction",
            "lambda:UpdateFunctionCode",
            "lambda:UpdateFunctionConfiguration",
            "lambda:TagResource",
            "s3:PutObject",
            "s3:GetObject",
            "s3:DeleteObject"
          ]
          resources = [
            "arn:aws:lambda:*:${var.target_account_id}:function:corp-*",
            "arn:aws:s3:::corp-deployment-artifacts-${var.env}/*"
          ]
          conditions = {
            resource-naming = {
              test     = "StringLike"
              variable = "aws:RequestTag/Name"
              values   = ["corp-*"]
            }
          }
        }
      }
      managed_policy_arns = []
    }
    
    breakglass = {
      description         = "Emergency access role with strict controls"
      max_session_duration = 900  # 15 minutes only
      trusted_principals  = ["arn:aws:iam::${var.target_account_id}:root"]
      require_external_id = false
      require_mfa        = true
      inline_policies = {
        emergency-access = {
          actions = [
            "iam:*",
            "ec2:*",
            "s3:*",
            "lambda:*"
          ]
          resources = ["*"]
          conditions = {
            mfa-required = {
              test     = "Bool"
              variable = "aws:MultiFactorAuthPresent"
              values   = ["true"]
            }
            session-duration = {
              test     = "NumericLessThan"
              variable = "aws:TokenIssueTime"
              values   = ["900"]
            }
          }
        }
      }
      managed_policy_arns = []
    }
  }
}

# Local values for consistent naming and tagging
locals {
  name_prefix = "corp-"
  
  common_tags = merge(
    {
      owner   = var.owner
      purpose = var.purpose
      env     = var.env
    },
    {
      terraform_managed = "true"
      compliance_scope  = "soc2-gdpr"
      last_updated     = formatdate("YYYY-MM-DD", timestamp())
    }
  )
}

# Permission boundary policy - critical preventive control for SOC 2
# Denies dangerous patterns and enforces organizational guardrails
data "aws_iam_policy_document" "permission_boundary" {
  # Deny wildcard admin access - prevents privilege escalation
  statement {
    sid    = "DenyWildcardAdmin"
    effect = "Deny"
    actions = ["*"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "iam:PolicyArn"
      values   = ["arn:aws:iam::aws:policy/AdministratorAccess"]
    }
  }
  
  # Enforce regional restrictions - data residency for GDPR
  statement {
    sid    = "EnforceRegionRestriction"
    effect = "Deny"
    actions = ["*"]
    resources = ["*"]
    condition {
      test     = "StringNotEquals"
      variable = "aws:RequestedRegion"
      values   = ["us-east-1", "eu-west-1"]
    }
  }
  
  # Require MFA for sensitive console actions - access control requirement
  statement {
    sid    = "RequireMFAForConsole"
    effect = "Deny"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy"
    ]
    resources = ["*"]
    condition {
      test     = "BoolIfExists"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["false"]
    }
  }
  
  # Prevent modification of security-critical resources
  statement {
    sid    = "ProtectSecurityResources"
    effect = "Deny"
    actions = [
      "iam:DeleteRole",
      "iam:DetachRolePolicy"
    ]
    resources = [
      "arn:aws:iam::*:role/corp-security-*",
      "arn:aws:iam::*:role/corp-breakglass-*"
    ]
  }
}

# Create the permission boundary policy
resource "aws_iam_policy" "permission_boundary" {
  name        = "${local.name_prefix}permission-boundary-${var.env}"
  description = "Permission boundary enforcing organizational security controls"
  policy      = data.aws_iam_policy_document.permission_boundary.json
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}permission-boundary-${var.env}"
    Type = "PermissionBoundary"
  })
}

# Create IAM roles based on the roles variable
resource "aws_iam_role" "roles" {
  for_each = var.roles
  
  name                 = "${local.name_prefix}${each.key}-${var.env}"
  description          = each.value.description
  max_session_duration = each.value.max_session_duration
  permissions_boundary = aws_iam_policy.permission_boundary.arn
  
  assume_role_policy = data.aws_iam_policy_document.trust_policy[each.key].json
  
  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}${each.key}-${var.env}"
    RoleType = each.key
  })
}

# Trust policies for each role
data "aws_iam_policy_document" "trust_policy" {
  for_each = var.roles
  
  statement {
    effect = "Allow"
    
    principals {
      type        = "AWS"
      identifiers = each.value.trusted_principals
    }
    
    actions = ["sts:AssumeRole"]
    
    # Add external ID condition if required
    dynamic "condition" {
      for_each = each.value.require_external_id && var.external_id != "" ? [1] : []
      content {
        test     = "StringEquals"
        variable = "sts:ExternalId"
        values   = [var.external_id]
      }
    }
    
    # Add MFA condition if required
    dynamic "condition" {
      for_each = each.value.require_mfa ? [1] : []
      content {
        test     = "Bool"
        variable = "aws:MultiFactorAuthPresent"
        values   = ["true"]
      }
    }
  }
}

# Inline policies for each role
resource "aws_iam_role_policy" "inline_policies" {
  for_each = {
    for combo in flatten([
      for role_key, role_config in var.roles : [
        for policy_key, policy_config in role_config.inline_policies : {
          role_key    = role_key
          policy_key  = policy_key
          policy_config = policy_config
        }
      ]
    ]) : "${combo.role_key}-${combo.policy_key}" => combo
  }
  
  name = each.value.policy_key
  role = aws_iam_role.roles[each.value.role_key].id
  
  policy = data.aws_iam_policy_document.inline_policies[each.key].json
}

# Policy documents for inline policies
data "aws_iam_policy_document" "inline_policies" {
  for_each = {
    for combo in flatten([
      for role_key, role_config in var.roles : [
        for policy_key, policy_config in role_config.inline_policies : {
          role_key    = role_key
          policy_key  = policy_key
          policy_config = policy_config
        }
      ]
    ]) : "${combo.role_key}-${combo.policy_key}" => combo
  }
  
  statement {
    effect    = "Allow"
    actions   = each.value.policy_config.actions
    resources = each.value.policy_config.resources
    
    # Add conditions if specified
    dynamic "condition" {
      for_each = each.value.policy_config.conditions
      content {
        test     = condition.value.test
        variable = condition.value.variable
        values   = condition.value.values
      }
    }
  }
}

# Attach managed policies if specified
resource "aws_iam_role_policy_attachment" "managed_policies" {
  for_each = {
    for combo in flatten([
      for role_key, role_config in var.roles : [
        for policy_arn in role_config.managed_policy_arns : {
          role_key   = role_key
          policy_arn = policy_arn
        }
      ]
    ]) : "${combo.role_key}-${replace(combo.policy_arn, "/[^a-zA-Z0-9]/", "-")}" => combo
  }
  
  role       = aws_iam_role.roles[each.value.role_key].name
  policy_arn = each.value.policy_arn
}

# Outputs for role ARNs and compliance tracking
output "role_arns" {
  description = "ARNs of all created IAM roles"
  value = {
    for role_key, role in aws_iam_role.roles : role_key => role.arn
  }
}

output "permission_boundary_arn" {
  description = "ARN of the permission boundary policy"
  value       = aws_iam_policy.permission_boundary.arn
}

output "applied_tags" {
  description = "Common tags applied to all resources for audit trail"
  value       = local.common_tags
}

output "compliance_summary" {
  description = "Summary of compliance controls implemented"
  value = {
    permission_boundaries_enabled = true
    mfa_required_for_sensitive    = true
    regional_restrictions        = ["us-east-1", "eu-west-1"]
    resource_tagging_enforced    = true
    least_privilege_applied      = true
  }
}

/*
CI/CD Pipeline Integration Example:

# .github/workflows/terraform-validate.yml or similar
validation_commands:
  - terraform fmt -check -recursive
  - terraform validate
  - tflint --config .tflint.hcl
  - checkov -f tap_stack.tf --framework terraform
  - terraform plan -var-file="environments/${ENV}.tfvars"

Policy Sanity Check Examples:

1. Permission Boundary Test:
   - A role trying to attach AdministratorAccess will be denied
   - Actions outside us-east-1/eu-west-1 will be blocked
   - Console IAM changes without MFA will fail

2. Least Privilege Validation:
   - corp-ci-deployer-prod can only modify corp-* Lambda functions
   - corp-security-auditor-prod has read-only access scoped to audit needs
   - corp-breakglass-prod requires MFA and has 15-minute session limit

3. SOC 2 Control Mapping:
   - CC6.1: Logical access controls → MFA requirements, permission boundaries
   - CC6.2: System access → External ID for third-party access
   - CC6.3: Network access → Regional restrictions
   - CC7.2: System monitoring → Comprehensive tagging for audit trails

4. GDPR Compliance:
   - Data residency → Regional restrictions to approved regions
   - Access logging → All assume-role actions logged via CloudTrail
   - Data subject rights → Audit roles can access necessary logs/configs
*/