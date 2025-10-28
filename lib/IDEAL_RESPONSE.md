# Zero-Trust IAM Security Framework for Financial Services - Complete Implementation

## Overview

This document contains the complete implementation of a zero-trust IAM security framework for a regulated financial services company using Terraform HCL.

## Architecture

### Components

- **IAM Roles:** Developer, Operator, Administrator, Break-Glass, Service Roles (EC2, Lambda, RDS)
- **IAM Policies:** Advanced conditional policies with 3+ condition keys each
- **S3 Security:** KMS encryption, versioning, VPC endpoint restrictions, MFA delete support
- **Monitoring:** CloudWatch, EventBridge, SNS alerts, metric filters
- **Automation:** Lambda function for time-based access expiration
- **Security:** Password policies, permission boundaries, cross-account access controls

## Complete Terraform Code

### data.tf

```hcl
# Data Sources

# Current AWS account information
data "aws_caller_identity" "current" {}

# Current AWS region
data "aws_region" "current" {}

# Available AWS availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# AWS partition for constructing ARNs
data "aws_partition" "current" {}

```

### iam-cross-account.tf

```hcl
# Cross-Account Access Roles

# Cross-Account Auditor Role
data "aws_iam_policy_document" "cross_account_auditor_trust" {
  count = length(var.external_account_ids) > 0 ? 1 : 0

  statement {
    sid     = "AllowCrossAccountAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = [for account_id in var.external_account_ids : "arn:${local.partition}:iam::${account_id}:root"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.external_id]
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
  }
}

resource "aws_iam_role" "cross_account_auditor" {
  count = length(var.external_account_ids) > 0 ? 1 : 0

  name                 = "${local.name_prefix}-cross-account-auditor-${local.name_suffix}"
  description          = "Cross-account auditor role for external partners"
  assume_role_policy   = data.aws_iam_policy_document.cross_account_auditor_trust[0].json
  max_session_duration = var.external_session_duration

  tags = merge(local.common_tags, {
    RoleType = "CrossAccount-Auditor"
  })
}

# Cross-Account Auditor Policy - Read-only access
data "aws_iam_policy_document" "cross_account_auditor_policy" {
  count = length(var.external_account_ids) > 0 ? 1 : 0

  # Read-only access for auditing
  statement {
    sid    = "ReadOnlyAuditAccess"
    effect = "Allow"
    actions = [
      "s3:GetBucketPolicy",
      "s3:GetBucketVersioning",
      "s3:GetBucketLogging",
      "s3:GetEncryptionConfiguration",
      "s3:ListBucket",
      "iam:GetRole",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:ListPolicies",
      "iam:ListRoles",
      "cloudtrail:DescribeTrails",
      "cloudtrail:GetTrailStatus",
      "cloudtrail:LookupEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "kms:DescribeKey",
      "kms:GetKeyPolicy",
      "kms:GetKeyRotationStatus",
      "config:DescribeConfigRules",
      "config:GetComplianceDetailsByConfigRule"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = var.allowed_regions
    }
  }

  # Deny any modification actions
  statement {
    sid    = "DenyAllModifications"
    effect = "Deny"
    actions = [
      "*:Create*",
      "*:Update*",
      "*:Delete*",
      "*:Put*",
      "*:Modify*"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "cross_account_auditor" {
  count = length(var.external_account_ids) > 0 ? 1 : 0

  name        = "${local.name_prefix}-cross-account-auditor-policy-${local.name_suffix}"
  description = "Cross-account auditor policy with read-only access"
  policy      = data.aws_iam_policy_document.cross_account_auditor_policy[0].json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cross_account_auditor" {
  count = length(var.external_account_ids) > 0 ? 1 : 0

  role       = aws_iam_role.cross_account_auditor[0].name
  policy_arn = aws_iam_policy.cross_account_auditor[0].arn
}

# Cross-Account Support Role (with more limited access)
data "aws_iam_policy_document" "cross_account_support_trust" {
  count = length(var.external_account_ids) > 0 ? 1 : 0

  statement {
    sid     = "AllowSupportAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = [for account_id in var.external_account_ids : "arn:${local.partition}:iam::${account_id}:root"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.external_id]
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    # Session tagging for tracking
    condition {
      test     = "StringLike"
      variable = "sts:RequestTag/Purpose"
      values   = ["Support", "Troubleshooting"]
    }
  }
}

resource "aws_iam_role" "cross_account_support" {
  count = length(var.external_account_ids) > 0 ? 1 : 0

  name                 = "${local.name_prefix}-cross-account-support-${local.name_suffix}"
  description          = "Cross-account support role for external partners"
  assume_role_policy   = data.aws_iam_policy_document.cross_account_support_trust[0].json
  max_session_duration = var.external_session_duration

  tags = merge(local.common_tags, {
    RoleType = "CrossAccount-Support"
  })
}

# Attach AWS managed ReadOnlyAccess policy
resource "aws_iam_role_policy_attachment" "cross_account_support_readonly" {
  count = length(var.external_account_ids) > 0 ? 1 : 0

  role       = aws_iam_role.cross_account_support[0].name
  policy_arn = "arn:${local.partition}:iam::aws:policy/ReadOnlyAccess"
}

```

### iam-password-policy.tf

```hcl
# IAM Account Password Policy

resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = var.password_min_length
  require_uppercase_characters   = true
  require_lowercase_characters   = true
  require_numbers                = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = var.password_max_age
  password_reuse_prevention      = var.password_reuse_prevention
  hard_expiry                    = false
}

```

### iam-policies.tf

```hcl
# Advanced IAM Policies with Conditional Logic

# Developer Policy - Read access to production with restrictions
data "aws_iam_policy_document" "developer_policy" {
  # Allow read access to production resources with IP and MFA restrictions
  statement {
    sid    = "ProductionReadAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket",
      "rds:DescribeDBInstances",
      "ec2:Describe*",
      "logs:GetLogEvents",
      "logs:FilterLogEvents"
    ]
    resources = ["*"]

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = var.allowed_regions
    }
  }

  # Deny modification of IAM policies
  statement {
    sid    = "DenyIAMModifications"
    effect = "Deny"
    actions = [
      "iam:CreatePolicy",
      "iam:DeletePolicy",
      "iam:CreatePolicyVersion",
      "iam:DeletePolicyVersion",
      "iam:SetDefaultPolicyVersion",
      "iam:AttachUserPolicy",
      "iam:DetachUserPolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:AttachGroupPolicy",
      "iam:DetachGroupPolicy"
    ]
    resources = ["*"]
  }

  # Deny direct database access
  statement {
    sid    = "DenyDirectDatabaseAccess"
    effect = "Deny"
    actions = [
      "rds:ModifyDBInstance",
      "rds:DeleteDBInstance",
      "rds-db:connect"
    ]
    resources = ["*"]
  }

  # Deny operations in unauthorized regions
  statement {
    sid       = "DenyUnauthorizedRegions"
    effect    = "Deny"
    actions   = ["*"]
    resources = ["*"]

    condition {
      test     = "StringNotEquals"
      variable = "aws:RequestedRegion"
      values   = var.allowed_regions
    }

    condition {
      test     = "StringNotEquals"
      variable = "iam:PolicyARN"
      values   = ["arn:aws:iam::*:policy/*"]
    }
  }
}

resource "aws_iam_policy" "developer" {
  name        = "${local.name_prefix}-developer-policy-${local.name_suffix}"
  description = "Developer policy with read access to production and conditional restrictions"
  policy      = data.aws_iam_policy_document.developer_policy.json

  tags = local.common_tags
}

# Operator Policy - Infrastructure management with MFA and time restrictions
data "aws_iam_policy_document" "operator_policy" {
  # Allow infrastructure management with multiple conditions
  statement {
    sid    = "InfrastructureManagement"
    effect = "Allow"
    actions = [
      "ec2:*",
      "rds:*",
      "s3:*",
      "lambda:*",
      "cloudwatch:*",
      "logs:*"
    ]
    resources = ["*"]

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = [tostring(var.mfa_max_age)]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = var.allowed_regions
    }
  }

  # Deny IAM modifications
  statement {
    sid    = "DenyIAMChanges"
    effect = "Deny"
    actions = [
      "iam:*"
    ]
    resources = ["*"]
  }

  # Deny CloudTrail modifications
  statement {
    sid    = "DenyAuditTrailChanges"
    effect = "Deny"
    actions = [
      "cloudtrail:StopLogging",
      "cloudtrail:DeleteTrail",
      "cloudtrail:UpdateTrail"
    ]
    resources = ["*"]
  }

  # Deny making S3 buckets public
  statement {
    sid    = "DenyS3PublicAccess"
    effect = "Deny"
    actions = [
      "s3:PutBucketPublicAccessBlock",
      "s3:PutBucketPolicy",
      "s3:PutBucketAcl"
    ]
    resources = ["*"]

    condition {
      test     = "Bool"
      variable = "s3:x-amz-acl"
      values   = ["public-read", "public-read-write"]
    }
  }
}

resource "aws_iam_policy" "operator" {
  name        = "${local.name_prefix}-operator-policy-${local.name_suffix}"
  description = "Operator policy with infrastructure management and strict security controls"
  policy      = data.aws_iam_policy_document.operator_policy.json

  tags = local.common_tags
}

# Administrator Policy - Full access with heavy restrictions
data "aws_iam_policy_document" "administrator_policy" {
  # Allow all actions with stringent conditions
  statement {
    sid       = "AdministratorAccess"
    effect    = "Allow"
    actions   = ["*"]
    resources = ["*"]

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = [tostring(var.mfa_max_age)]
    }
  }

  # Explicitly deny disabling logging
  statement {
    sid    = "DenyDisablingLogging"
    effect = "Deny"
    actions = [
      "cloudtrail:StopLogging",
      "cloudtrail:DeleteTrail",
      "logs:DeleteLogGroup",
      "s3:PutBucketLogging"
    ]
    resources = ["*"]

    condition {
      test     = "StringLike"
      variable = "s3:PutBucketLogging"
      values   = [""]
    }
  }

  # Deny disabling encryption
  statement {
    sid    = "DenyDisablingEncryption"
    effect = "Deny"
    actions = [
      "s3:PutEncryptionConfiguration",
      "rds:ModifyDBInstance",
      "kms:DisableKey",
      "kms:ScheduleKeyDeletion"
    ]
    resources = ["*"]

    condition {
      test     = "Bool"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["false"]
    }
  }

  # Deny operations outside allowed regions
  statement {
    sid       = "DenyUnauthorizedRegions"
    effect    = "Deny"
    actions   = ["*"]
    resources = ["*"]

    condition {
      test     = "StringNotEquals"
      variable = "aws:RequestedRegion"
      values   = var.allowed_regions
    }
  }
}

resource "aws_iam_policy" "administrator" {
  name        = "${local.name_prefix}-administrator-policy-${local.name_suffix}"
  description = "Administrator policy with full access and maximum security controls"
  policy      = data.aws_iam_policy_document.administrator_policy.json

  tags = local.common_tags
}

# S3 Access Policy with VPC Endpoint Restriction
data "aws_iam_policy_document" "s3_access_policy" {
  # Allow S3 access only through VPC endpoint with encryption
  statement {
    sid    = "S3AccessThroughVPCEndpoint"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:${local.partition}:s3:::${local.financial_data_bucket}",
      "arn:${local.partition}:s3:::${local.financial_data_bucket}/*"
    ]

    dynamic "condition" {
      for_each = var.vpc_endpoint_id != "" ? [1] : []
      content {
        test     = "StringEquals"
        variable = "aws:SourceVpce"
        values   = [var.vpc_endpoint_id]
      }
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["true"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }
  }
}

resource "aws_iam_policy" "s3_access" {
  name        = "${local.name_prefix}-s3-access-policy-${local.name_suffix}"
  description = "S3 access policy with VPC endpoint and encryption requirements"
  policy      = data.aws_iam_policy_document.s3_access_policy.json

  tags = local.common_tags
}

# Regional Restriction Policy
data "aws_iam_policy_document" "regional_restriction" {
  statement {
    sid       = "DenyAllOutsideAllowedRegions"
    effect    = "Deny"
    actions   = ["*"]
    resources = ["*"]

    condition {
      test     = "StringNotEquals"
      variable = "aws:RequestedRegion"
      values   = var.allowed_regions
    }

    # Allow global services
    condition {
      test     = "StringNotLike"
      variable = "aws:PrincipalArn"
      values   = ["arn:${local.partition}:iam::${local.account_id}:*"]
    }
  }

  # Allow IAM, CloudFront, Route53, and other global services
  statement {
    sid    = "AllowGlobalServices"
    effect = "Allow"
    actions = [
      "iam:*",
      "cloudfront:*",
      "route53:*",
      "waf:*",
      "shield:*"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "regional_restriction" {
  name        = "${local.name_prefix}-regional-restriction-policy-${local.name_suffix}"
  description = "Policy that restricts operations to allowed regions only"
  policy      = data.aws_iam_policy_document.regional_restriction.json

  tags = local.common_tags
}

# Permission Boundary - Prevents privilege escalation
data "aws_iam_policy_document" "permission_boundary" {
  # Allow all actions within the boundary
  statement {
    sid       = "BoundaryPermissions"
    effect    = "Allow"
    actions   = ["*"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = var.allowed_regions
    }
  }

  # Prevent IAM role/user creation without permission boundary
  statement {
    sid    = "RequirePermissionBoundary"
    effect = "Deny"
    actions = [
      "iam:CreateUser",
      "iam:CreateRole"
    ]
    resources = ["*"]

    condition {
      test     = "StringNotEquals"
      variable = "iam:PermissionsBoundary"
      values   = ["arn:${local.partition}:iam::${local.account_id}:policy/${local.name_prefix}-permission-boundary-${local.name_suffix}"]
    }
  }

  # Prevent removing permission boundary
  statement {
    sid    = "PreventBoundaryRemoval"
    effect = "Deny"
    actions = [
      "iam:DeleteUserPermissionsBoundary",
      "iam:DeleteRolePermissionsBoundary"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "permission_boundary" {
  name        = "${local.name_prefix}-permission-boundary-${local.name_suffix}"
  description = "Permission boundary to prevent privilege escalation"
  policy      = data.aws_iam_policy_document.permission_boundary.json

  tags = local.common_tags
}

```

### iam-roles-administrator.tf

```hcl
# Administrator IAM Roles

# Administrator Trust Policy - Strictest MFA and IP requirements
data "aws_iam_policy_document" "administrator_trust" {
  statement {
    sid     = "AllowAssumeRoleWithStrictMFA"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = ["900"]
    }

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }
  }
}

# Administrator Role
resource "aws_iam_role" "administrator" {
  name                 = "${local.name_prefix}-administrator-role-${local.name_suffix}"
  description          = "Administrator role with full access and maximum security controls"
  assume_role_policy   = data.aws_iam_policy_document.administrator_trust.json
  max_session_duration = var.max_session_duration
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  tags = merge(local.common_tags, {
    RoleType = "Administrator"
  })
}

# Attach administrator policy
resource "aws_iam_role_policy_attachment" "administrator_main" {
  role       = aws_iam_role.administrator.name
  policy_arn = aws_iam_policy.administrator.arn
}

# Attach regional restriction policy
resource "aws_iam_role_policy_attachment" "administrator_regional" {
  role       = aws_iam_role.administrator.name
  policy_arn = aws_iam_policy.regional_restriction.arn
}

# Administrator audit policy - Enhanced logging
data "aws_iam_policy_document" "administrator_audit_policy" {
  statement {
    sid    = "AuditAllActions"
    effect = "Allow"
    actions = [
      "cloudtrail:LookupEvents",
      "cloudtrail:GetTrailStatus",
      "cloudtrail:DescribeTrails",
      "cloudtrail:GetEventSelectors",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
      "config:GetComplianceDetailsByConfigRule",
      "config:DescribeConfigRules",
      "access-analyzer:ListFindings",
      "guardduty:ListFindings"
    ]
    resources = ["*"]

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
  }
}

resource "aws_iam_policy" "administrator_audit" {
  name        = "${local.name_prefix}-administrator-audit-policy-${local.name_suffix}"
  description = "Administrator audit and compliance policy"
  policy      = data.aws_iam_policy_document.administrator_audit_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "administrator_audit" {
  role       = aws_iam_role.administrator.name
  policy_arn = aws_iam_policy.administrator_audit.arn
}

# Break Glass Role - Emergency access with minimal conditions
data "aws_iam_policy_document" "break_glass_trust" {
  statement {
    sid     = "EmergencyAccess"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
  }
}

# Break Glass Role - For absolute emergencies only
resource "aws_iam_role" "break_glass" {
  name                 = "${local.name_prefix}-break-glass-role-${local.name_suffix}"
  description          = "Emergency break-glass role with full access (use only in critical situations)"
  assume_role_policy   = data.aws_iam_policy_document.break_glass_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    RoleType = "BreakGlass"
    Critical = "true"
  })
}

# Attach AdministratorAccess for break glass
resource "aws_iam_role_policy_attachment" "break_glass_admin" {
  role       = aws_iam_role.break_glass.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/AdministratorAccess"
}

```

### iam-roles-developer.tf

```hcl
# Developer IAM Roles

# Developer Trust Policy - Allow assumption from IAM users with MFA
data "aws_iam_policy_document" "developer_trust" {
  statement {
    sid     = "AllowAssumeRoleWithMFA"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }
  }
}

# Developer Role
resource "aws_iam_role" "developer" {
  name                 = "${local.name_prefix}-developer-role-${local.name_suffix}"
  description          = "Developer role with read access to production and full access to dev/staging"
  assume_role_policy   = data.aws_iam_policy_document.developer_trust.json
  max_session_duration = var.max_session_duration
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  tags = merge(local.common_tags, {
    RoleType = "Developer"
  })
}

# Attach developer policy
resource "aws_iam_role_policy_attachment" "developer_main" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.developer.arn
}

# Attach regional restriction policy
resource "aws_iam_role_policy_attachment" "developer_regional" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.regional_restriction.arn
}

# Developer Dev Environment Policy - Full access to dev resources
data "aws_iam_policy_document" "developer_dev_policy" {
  statement {
    sid    = "FullDevAccess"
    effect = "Allow"
    actions = [
      "ec2:*",
      "rds:*",
      "s3:*",
      "lambda:*",
      "dynamodb:*",
      "sqs:*",
      "sns:*",
      "cloudwatch:*",
      "logs:*"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:PrincipalTag/Environment"
      values   = ["dev", "staging"]
    }

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = var.allowed_regions
    }
  }

  # Allow deployment through CI/CD
  statement {
    sid    = "AllowCICDDeployment"
    effect = "Allow"
    actions = [
      "lambda:UpdateFunctionCode",
      "lambda:PublishVersion",
      "ecs:UpdateService",
      "ecs:RegisterTaskDefinition"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:PrincipalTag/Environment"
      values   = ["dev", "staging", "production"]
    }
  }

  # Deny production database modifications
  statement {
    sid    = "DenyProductionDBModifications"
    effect = "Deny"
    actions = [
      "rds:ModifyDBInstance",
      "rds:DeleteDBInstance",
      "rds:CreateDBSnapshot",
      "rds:DeleteDBSnapshot"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Environment"
      values   = ["production"]
    }
  }
}

resource "aws_iam_policy" "developer_dev" {
  name        = "${local.name_prefix}-developer-dev-policy-${local.name_suffix}"
  description = "Developer policy for dev and staging environments"
  policy      = data.aws_iam_policy_document.developer_dev_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "developer_dev" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.developer_dev.arn
}

# CloudWatch Logs read policy for developers
data "aws_iam_policy_document" "developer_logs_policy" {
  statement {
    sid    = "ReadCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
      "logs:StartQuery",
      "logs:StopQuery",
      "logs:GetQueryResults"
    ]
    resources = [
      "arn:${local.partition}:logs:${local.region}:${local.account_id}:log-group:*"
    ]

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }
  }
}

resource "aws_iam_policy" "developer_logs" {
  name        = "${local.name_prefix}-developer-logs-policy-${local.name_suffix}"
  description = "Developer policy for reading CloudWatch Logs"
  policy      = data.aws_iam_policy_document.developer_logs_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "developer_logs" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.developer_logs.arn
}

```

### iam-roles-operator.tf

```hcl
# Operator IAM Roles

# Operator Trust Policy - Require MFA and recent authentication
data "aws_iam_policy_document" "operator_trust" {
  statement {
    sid     = "AllowAssumeRoleWithRecentMFA"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = [tostring(var.mfa_max_age)]
    }

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }
  }
}

# Operator Role
resource "aws_iam_role" "operator" {
  name                 = "${local.name_prefix}-operator-role-${local.name_suffix}"
  description          = "Operator role with infrastructure management permissions"
  assume_role_policy   = data.aws_iam_policy_document.operator_trust.json
  max_session_duration = var.max_session_duration
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  tags = merge(local.common_tags, {
    RoleType = "Operator"
  })
}

# Attach operator policy
resource "aws_iam_role_policy_attachment" "operator_main" {
  role       = aws_iam_role.operator.name
  policy_arn = aws_iam_policy.operator.arn
}

# Attach regional restriction policy
resource "aws_iam_role_policy_attachment" "operator_regional" {
  role       = aws_iam_role.operator.name
  policy_arn = aws_iam_policy.regional_restriction.arn
}

# Operator Production Access Policy - Requires time-based access
data "aws_iam_policy_document" "operator_production_policy" {
  statement {
    sid    = "ProductionInfrastructureAccess"
    effect = "Allow"
    actions = [
      "ec2:StartInstances",
      "ec2:StopInstances",
      "ec2:RebootInstances",
      "ec2:ModifyInstanceAttribute",
      "rds:StartDBInstance",
      "rds:StopDBInstance",
      "rds:RebootDBInstance",
      "rds:ModifyDBInstance",
      "lambda:UpdateFunctionConfiguration",
      "ecs:UpdateService",
      "ecs:RestartTask"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Environment"
      values   = ["production"]
    }

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = [tostring(var.mfa_max_age)]
    }

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }
  }

  # Deny deletion of production resources
  statement {
    sid    = "DenyProductionDeletion"
    effect = "Deny"
    actions = [
      "ec2:TerminateInstances",
      "rds:DeleteDBInstance",
      "s3:DeleteBucket",
      "lambda:DeleteFunction",
      "dynamodb:DeleteTable"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Environment"
      values   = ["production"]
    }
  }
}

resource "aws_iam_policy" "operator_production" {
  name        = "${local.name_prefix}-operator-production-policy-${local.name_suffix}"
  description = "Operator policy for production infrastructure management"
  policy      = data.aws_iam_policy_document.operator_production_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "operator_production" {
  role       = aws_iam_role.operator.name
  policy_arn = aws_iam_policy.operator_production.arn
}

# Operator monitoring policy
data "aws_iam_policy_document" "operator_monitoring_policy" {
  statement {
    sid    = "MonitoringAccess"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData",
      "cloudwatch:GetMetricData",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:ListMetrics",
      "cloudwatch:PutMetricAlarm",
      "cloudwatch:DeleteAlarms",
      "cloudwatch:DescribeAlarms",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = ["*"]

    condition {
      test     = "IpAddress"
      variable = "aws:SourceIp"
      values   = var.allowed_ip_ranges
    }
  }
}

resource "aws_iam_policy" "operator_monitoring" {
  name        = "${local.name_prefix}-operator-monitoring-policy-${local.name_suffix}"
  description = "Operator policy for CloudWatch monitoring"
  policy      = data.aws_iam_policy_document.operator_monitoring_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "operator_monitoring" {
  role       = aws_iam_role.operator.name
  policy_arn = aws_iam_policy.operator_monitoring.arn
}

```

### iam-roles-service.tf

```hcl
# Service IAM Roles

# EC2 Instance Role
data "aws_iam_policy_document" "ec2_trust" {
  statement {
    sid     = "AllowEC2AssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2_instance" {
  count = var.enable_ec2_instance_role ? 1 : 0

  name                 = "${local.name_prefix}-ec2-instance-role-${local.name_suffix}"
  description          = "EC2 instance role with minimal required permissions"
  assume_role_policy   = data.aws_iam_policy_document.ec2_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    RoleType = "Service-EC2"
  })
}

# EC2 Instance Policy
data "aws_iam_policy_document" "ec2_instance_policy" {
  # Allow reading from Systems Manager Parameter Store
  statement {
    sid    = "ReadParameterStore"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath"
    ]
    resources = [
      "arn:${local.partition}:ssm:${local.region}:${local.account_id}:parameter/${var.project_name}/*"
    ]
  }

  # Allow writing logs to CloudWatch
  statement {
    sid    = "WriteCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:${local.partition}:logs:${local.region}:${local.account_id}:log-group:/aws/ec2/*"
    ]
  }

  # Allow reading from specific S3 buckets
  statement {
    sid    = "ReadS3Configuration"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:${local.partition}:s3:::${local.name_prefix}-config-*",
      "arn:${local.partition}:s3:::${local.name_prefix}-config-*/*"
    ]
  }

  # Allow RDS connection
  statement {
    sid    = "RDSConnect"
    effect = "Allow"
    actions = [
      "rds-db:connect"
    ]
    resources = [
      "arn:${local.partition}:rds-db:${local.region}:${local.account_id}:dbuser:*/${var.project_name}*"
    ]
  }
}

resource "aws_iam_policy" "ec2_instance" {
  count = var.enable_ec2_instance_role ? 1 : 0

  name        = "${local.name_prefix}-ec2-instance-policy-${local.name_suffix}"
  description = "EC2 instance policy with least privilege access"
  policy      = data.aws_iam_policy_document.ec2_instance_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_instance" {
  count = var.enable_ec2_instance_role ? 1 : 0

  role       = aws_iam_role.ec2_instance[0].name
  policy_arn = aws_iam_policy.ec2_instance[0].arn
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  count = var.enable_ec2_instance_role ? 1 : 0

  name = "${local.name_prefix}-ec2-instance-profile-${local.name_suffix}"
  role = aws_iam_role.ec2_instance[0].name

  tags = local.common_tags
}

# Lambda Execution Role
data "aws_iam_policy_document" "lambda_trust" {
  statement {
    sid     = "AllowLambdaAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execution" {
  count = var.enable_lambda_execution_role ? 1 : 0

  name                 = "${local.name_prefix}-lambda-execution-role-${local.name_suffix}"
  description          = "Lambda execution role with scoped permissions"
  assume_role_policy   = data.aws_iam_policy_document.lambda_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    RoleType = "Service-Lambda"
  })
}

# Lambda Execution Policy
data "aws_iam_policy_document" "lambda_execution_policy" {
  # CloudWatch Logs permissions
  statement {
    sid    = "WriteLambdaLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "arn:${local.partition}:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/*"
    ]
  }

  # X-Ray tracing permissions
  statement {
    sid    = "XRayTracing"
    effect = "Allow"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords"
    ]
    resources = ["*"]
  }

  # VPC network interface permissions (if Lambda needs VPC access)
  statement {
    sid    = "VPCNetworkAccess"
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "lambda_execution" {
  count = var.enable_lambda_execution_role ? 1 : 0

  name        = "${local.name_prefix}-lambda-execution-policy-${local.name_suffix}"
  description = "Lambda execution policy with necessary permissions"
  policy      = data.aws_iam_policy_document.lambda_execution_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_execution" {
  count = var.enable_lambda_execution_role ? 1 : 0

  role       = aws_iam_role.lambda_execution[0].name
  policy_arn = aws_iam_policy.lambda_execution[0].arn
}

# RDS Enhanced Monitoring Role
data "aws_iam_policy_document" "rds_monitoring_trust" {
  statement {
    sid     = "AllowRDSMonitoring"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "rds_monitoring" {
  count = var.enable_rds_monitoring_role ? 1 : 0

  name                 = "${local.name_prefix}-rds-monitoring-role-${local.name_suffix}"
  description          = "RDS Enhanced Monitoring role"
  assume_role_policy   = data.aws_iam_policy_document.rds_monitoring_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    RoleType = "Service-RDS"
  })
}

# Attach AWS managed policy for RDS monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.enable_rds_monitoring_role ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

```

### lambda.tf

```hcl
# Lambda Function for Time-Based Access Expiration

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "access_expiration" {
  count = var.enable_time_based_access ? 1 : 0

  name              = local.access_expiration_log_group
  retention_in_days = var.log_retention_days
  kms_key_id        = var.s3_encryption_enabled ? aws_kms_key.s3[0].arn : null

  tags = local.common_tags

  depends_on = [aws_kms_key.s3]
}

# Lambda IAM Role
data "aws_iam_policy_document" "access_expiration_lambda_trust" {
  statement {
    sid     = "AllowLambdaAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  name                 = "${local.name_prefix}-access-expiration-lambda-${local.name_suffix}"
  description          = "Lambda role for time-based access expiration"
  assume_role_policy   = data.aws_iam_policy_document.access_expiration_lambda_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    RoleType = "Lambda-AccessExpiration"
  })
}

# Lambda Execution Policy
data "aws_iam_policy_document" "access_expiration_lambda_policy" {
  # CloudWatch Logs permissions
  statement {
    sid    = "WriteCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.access_expiration[0].arn}:*"
    ]
  }

  # IAM permissions to list and detach policies
  statement {
    sid    = "ManageIAMPolicies"
    effect = "Allow"
    actions = [
      "iam:ListPolicies",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:ListEntitiesForPolicy",
      "iam:DetachUserPolicy",
      "iam:DetachGroupPolicy",
      "iam:DetachRolePolicy"
    ]
    resources = ["*"]
  }

  # CloudWatch metrics permissions
  statement {
    sid    = "PublishMetrics"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData"
    ]
    resources = ["*"]
  }

  # SNS permissions for notifications
  statement {
    sid    = "PublishToSNS"
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = var.enable_iam_monitoring ? [aws_sns_topic.security_alerts[0].arn] : []
  }
}

resource "aws_iam_policy" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  name        = "${local.name_prefix}-access-expiration-lambda-policy-${local.name_suffix}"
  description = "Lambda policy for access expiration function"
  policy      = data.aws_iam_policy_document.access_expiration_lambda_policy.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  role       = aws_iam_role.access_expiration_lambda[0].name
  policy_arn = aws_iam_policy.access_expiration_lambda[0].arn
}

# Archive Lambda function code
data "archive_file" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  type        = "zip"
  source_dir  = "${path.module}/lambda-access-expiration"
  output_path = "${path.module}/.terraform/lambda-access-expiration.zip"
}

# Lambda Function
resource "aws_lambda_function" "access_expiration" {
  count = var.enable_time_based_access ? 1 : 0

  filename         = data.archive_file.access_expiration_lambda[0].output_path
  function_name    = local.access_expiration_lambda
  role             = aws_iam_role.access_expiration_lambda[0].arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.access_expiration_lambda[0].output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 256

  environment {
    variables = {
      SNS_TOPIC_ARN = var.enable_iam_monitoring ? aws_sns_topic.security_alerts[0].arn : ""
      PROJECT_NAME  = var.project_name
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = local.common_tags

  depends_on = [
    aws_cloudwatch_log_group.access_expiration,
    aws_iam_role_policy_attachment.access_expiration_lambda
  ]
}

# EventBridge Rule to trigger Lambda on schedule
resource "aws_cloudwatch_event_rule" "access_expiration_schedule" {
  count = var.enable_time_based_access ? 1 : 0

  name                = "${local.name_prefix}-access-expiration-schedule-${local.name_suffix}"
  description         = "Trigger access expiration check every ${var.access_check_interval} minutes"
  schedule_expression = "rate(${var.access_check_interval} minutes)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "access_expiration_lambda" {
  count = var.enable_time_based_access ? 1 : 0

  rule      = aws_cloudwatch_event_rule.access_expiration_schedule[0].name
  target_id = "AccessExpirationLambda"
  arn       = aws_lambda_function.access_expiration[0].arn
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "access_expiration_eventbridge" {
  count = var.enable_time_based_access ? 1 : 0

  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.access_expiration[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.access_expiration_schedule[0].arn
}

```

### locals.tf

```hcl
# Random suffix for unique resource naming (fallback when environment_suffix not provided)
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Local Values
locals {
  # Resource naming
  name_prefix = "${var.project_name}-${var.environment}"

  # Use environment_suffix if provided (from ENVIRONMENT_SUFFIX env var), otherwise use random suffix
  name_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.suffix.result

  # AWS Account and Region
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.id
  partition  = data.aws_partition.current.partition

  # Common tags for all resources
  common_tags = {
    Project        = var.project_name
    Environment    = var.environment
    Owner          = var.owner
    ManagedBy      = "Terraform"
    ComplianceType = "FinancialServices"
    SecurityLevel  = "High"
  }

  # IAM policy conditions
  ip_condition = {
    IpAddress = {
      "aws:SourceIp" = var.allowed_ip_ranges
    }
  }

  mfa_condition = {
    Bool = {
      "aws:MultiFactorAuthPresent" = "true"
    }
    NumericLessThan = {
      "aws:MultiFactorAuthAge" = var.mfa_max_age
    }
  }

  region_condition = {
    StringEquals = {
      "aws:RequestedRegion" = var.allowed_regions
    }
  }

  vpc_endpoint_condition = var.vpc_endpoint_id != "" ? {
    StringEquals = {
      "aws:SourceVpce" = var.vpc_endpoint_id
    }
  } : {}

  # Time-based access condition
  time_condition = {
    DateGreaterThan = {
      "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'${var.business_hours_start}Z", timestamp())
    }
    DateLessThan = {
      "aws:CurrentTime" = formatdate("YYYY-MM-DD'T'${var.business_hours_end}Z", timestamp())
    }
  }

  # S3 bucket names
  financial_data_bucket = "${local.name_prefix}-${var.financial_data_bucket_name}-${local.name_suffix}"
  access_logs_bucket    = "${local.name_prefix}-access-logs-${local.name_suffix}"

  # SNS topic name
  security_alerts_topic = "${local.name_prefix}-security-alerts-${local.name_suffix}"

  # Lambda function names
  access_expiration_lambda = "${local.name_prefix}-access-expiration-${local.name_suffix}"

  # CloudWatch log group names
  iam_events_log_group        = "/aws/iam/${local.name_prefix}-events-${local.name_suffix}"
  access_expiration_log_group = "/aws/lambda/${local.access_expiration_lambda}"
  cloudtrail_log_group        = "/aws/cloudtrail/${local.name_prefix}-${local.name_suffix}"

  # KMS key alias
  kms_key_alias = "alias/${local.name_prefix}-${local.name_suffix}"
}

```

### monitoring.tf

```hcl
# CloudWatch Monitoring and Alerting for IAM Security

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  count = var.enable_iam_monitoring ? 1 : 0

  name              = local.security_alerts_topic
  kms_master_key_id = var.s3_encryption_enabled ? aws_kms_key.s3[0].arn : null

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  count = var.enable_iam_monitoring ? 1 : 0

  topic_arn = aws_sns_topic.security_alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Log Group for IAM Events
resource "aws_cloudwatch_log_group" "iam_events" {
  count = var.enable_iam_monitoring ? 1 : 0

  name              = local.iam_events_log_group
  retention_in_days = var.log_retention_days
  kms_key_id        = var.s3_encryption_enabled ? aws_kms_key.s3[0].arn : null

  tags = local.common_tags
}

# EventBridge Rule - IAM Policy Changes
resource "aws_cloudwatch_event_rule" "iam_policy_changes" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-iam-policy-changes-${local.name_suffix}"
  description = "Capture IAM policy modification events"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName = [
        "CreatePolicy",
        "DeletePolicy",
        "CreatePolicyVersion",
        "DeletePolicyVersion",
        "SetDefaultPolicyVersion",
        "AttachUserPolicy",
        "DetachUserPolicy",
        "AttachRolePolicy",
        "DetachRolePolicy",
        "AttachGroupPolicy",
        "DetachGroupPolicy",
        "PutUserPolicy",
        "PutRolePolicy",
        "PutGroupPolicy"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "iam_policy_changes_sns" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.iam_policy_changes[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts[0].arn

  input_transformer {
    input_paths = {
      eventName = "$.detail.eventName"
      userName  = "$.detail.userIdentity.principalId"
      sourceIP  = "$.detail.sourceIPAddress"
      time      = "$.time"
      policyArn = "$.detail.requestParameters.policyArn"
    }
    input_template = "\"IAM Policy Change Detected: <eventName> by <userName> from IP <sourceIP> at <time>. Policy ARN: <policyArn>\""
  }
}

# EventBridge Rule - Role Assumption
resource "aws_cloudwatch_event_rule" "role_assumption" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-role-assumption-${local.name_suffix}"
  description = "Capture IAM role assumption events"

  event_pattern = jsonencode({
    source      = ["aws.sts"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["sts.amazonaws.com"]
      eventName   = ["AssumeRole"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "role_assumption_log" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.role_assumption[0].name
  target_id = "SendToLogGroup"
  arn       = aws_cloudwatch_log_group.iam_events[0].arn
}

# EventBridge Rule - Failed Authentication Attempts
resource "aws_cloudwatch_event_rule" "failed_auth" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-failed-auth-${local.name_suffix}"
  description = "Capture failed authentication attempts"

  event_pattern = jsonencode({
    source      = ["aws.signin"]
    detail-type = ["AWS Console Sign In via CloudTrail"]
    detail = {
      eventName = ["ConsoleLogin"]
      errorCode = ["Failed authentication"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "failed_auth_sns" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.failed_auth[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts[0].arn

  input_transformer {
    input_paths = {
      userName = "$.detail.userIdentity.principalId"
      sourceIP = "$.detail.sourceIPAddress"
      time     = "$.time"
    }
    input_template = "\"Failed Authentication Attempt: User <userName> from IP <sourceIP> at <time>\""
  }
}

# EventBridge Rule - IAM User/Role Creation
resource "aws_cloudwatch_event_rule" "iam_user_role_creation" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-iam-user-role-creation-${local.name_suffix}"
  description = "Capture IAM user and role creation events"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName   = ["CreateUser", "CreateRole", "DeleteUser", "DeleteRole"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "iam_user_role_creation_sns" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.iam_user_role_creation[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts[0].arn

  input_transformer {
    input_paths = {
      eventName = "$.detail.eventName"
      userName  = "$.detail.userIdentity.principalId"
      sourceIP  = "$.detail.sourceIPAddress"
      time      = "$.time"
    }
    input_template = "\"IAM Identity Change: <eventName> by <userName> from IP <sourceIP> at <time>\""
  }
}

# EventBridge Rule - Administrative Actions in Production
resource "aws_cloudwatch_event_rule" "admin_actions" {
  count = var.enable_iam_monitoring ? 1 : 0

  name        = "${local.name_prefix}-admin-actions-${local.name_suffix}"
  description = "Capture administrative actions requiring audit"

  event_pattern = jsonencode({
    source      = ["aws.iam", "aws.s3", "aws.kms", "aws.cloudtrail"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "PutBucketPolicy",
        "DeleteBucket",
        "DisableKey",
        "ScheduleKeyDeletion",
        "StopLogging",
        "DeleteTrail"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "admin_actions_sns" {
  count = var.enable_iam_monitoring ? 1 : 0

  rule      = aws_cloudwatch_event_rule.admin_actions[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts[0].arn

  input_transformer {
    input_paths = {
      eventName = "$.detail.eventName"
      userName  = "$.detail.userIdentity.principalId"
      sourceIP  = "$.detail.sourceIPAddress"
      time      = "$.time"
    }
    input_template = "\"CRITICAL: Administrative Action Detected - <eventName> by <userName> from IP <sourceIP> at <time>\""
  }
}

# CloudWatch Metric Filter - Unauthorized API Calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  count = var.enable_iam_monitoring ? 1 : 0

  name           = "${local.name_prefix}-unauthorized-api-calls-${local.name_suffix}"
  log_group_name = aws_cloudwatch_log_group.iam_events[0].name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.iam_events]
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  count = var.enable_iam_monitoring ? 1 : 0

  alarm_name          = "${local.name_prefix}-unauthorized-api-calls-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project_name}/Security"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert on multiple unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alerts[0].arn]
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

# CloudWatch Metric Filter - MFA Bypass Attempts
resource "aws_cloudwatch_log_metric_filter" "no_mfa_console_login" {
  count = var.enable_iam_monitoring ? 1 : 0

  name           = "${local.name_prefix}-no-mfa-console-login-${local.name_suffix}"
  log_group_name = aws_cloudwatch_log_group.iam_events[0].name
  pattern        = "{ ($.eventName = \"ConsoleLogin\") && ($.additionalEventData.MFAUsed != \"Yes\") }"

  metric_transformation {
    name      = "ConsoleLoginWithoutMFA"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.iam_events]
}

resource "aws_cloudwatch_metric_alarm" "no_mfa_console_login" {
  count = var.enable_iam_monitoring ? 1 : 0

  alarm_name          = "${local.name_prefix}-no-mfa-console-login-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsoleLoginWithoutMFA"
  namespace           = "${var.project_name}/Security"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alert on console login without MFA"
  alarm_actions       = [aws_sns_topic.security_alerts[0].arn]
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

# SNS Topic Policy to allow EventBridge and CloudWatch to publish
data "aws_iam_policy_document" "security_alerts_topic_policy" {
  count = var.enable_iam_monitoring ? 1 : 0

  statement {
    sid    = "AllowEventBridgePublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.security_alerts[0].arn]
  }

  statement {
    sid    = "AllowCloudWatchPublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.security_alerts[0].arn]
  }
}

resource "aws_sns_topic_policy" "security_alerts" {
  count = var.enable_iam_monitoring ? 1 : 0

  arn    = aws_sns_topic.security_alerts[0].arn
  policy = data.aws_iam_policy_document.security_alerts_topic_policy[0].json
}

# CloudWatch Log Resource Policy for EventBridge
resource "aws_cloudwatch_log_resource_policy" "eventbridge_logs" {
  count = var.enable_iam_monitoring ? 1 : 0

  policy_name = "${local.name_prefix}-eventbridge-logs-${local.name_suffix}"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgeToCreateLogStreams"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.iam_events[0].arn}:*"
      }
    ]
  })
}

```

### outputs.tf

```hcl
# Outputs

# Role ARNs
output "developer_role_arn" {
  description = "ARN of the developer IAM role"
  value       = aws_iam_role.developer.arn
}

output "developer_role_name" {
  description = "Name of the developer IAM role"
  value       = aws_iam_role.developer.name
}

output "operator_role_arn" {
  description = "ARN of the operator IAM role"
  value       = aws_iam_role.operator.arn
}

output "operator_role_name" {
  description = "Name of the operator IAM role"
  value       = aws_iam_role.operator.name
}

output "administrator_role_arn" {
  description = "ARN of the administrator IAM role"
  value       = aws_iam_role.administrator.arn
}

output "administrator_role_name" {
  description = "Name of the administrator IAM role"
  value       = aws_iam_role.administrator.name
}

output "break_glass_role_arn" {
  description = "ARN of the break-glass emergency IAM role"
  value       = aws_iam_role.break_glass.arn
}

output "break_glass_role_name" {
  description = "Name of the break-glass emergency IAM role"
  value       = aws_iam_role.break_glass.name
}

# Service Role ARNs
output "ec2_instance_role_arn" {
  description = "ARN of the EC2 instance IAM role"
  value       = var.enable_ec2_instance_role ? aws_iam_role.ec2_instance[0].arn : null
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = var.enable_ec2_instance_role ? aws_iam_instance_profile.ec2[0].name : null
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution IAM role"
  value       = var.enable_lambda_execution_role ? aws_iam_role.lambda_execution[0].arn : null
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS enhanced monitoring IAM role"
  value       = var.enable_rds_monitoring_role ? aws_iam_role.rds_monitoring[0].arn : null
}

# Cross-Account Role ARNs
output "cross_account_auditor_role_arn" {
  description = "ARN of the cross-account auditor IAM role"
  value       = length(var.external_account_ids) > 0 ? aws_iam_role.cross_account_auditor[0].arn : null
}

output "cross_account_support_role_arn" {
  description = "ARN of the cross-account support IAM role"
  value       = length(var.external_account_ids) > 0 ? aws_iam_role.cross_account_support[0].arn : null
}

# Policy ARNs
output "developer_policy_arn" {
  description = "ARN of the developer IAM policy"
  value       = aws_iam_policy.developer.arn
}

output "operator_policy_arn" {
  description = "ARN of the operator IAM policy"
  value       = aws_iam_policy.operator.arn
}

output "administrator_policy_arn" {
  description = "ARN of the administrator IAM policy"
  value       = aws_iam_policy.administrator.arn
}

output "permission_boundary_policy_arn" {
  description = "ARN of the permission boundary IAM policy"
  value       = aws_iam_policy.permission_boundary.arn
}

output "regional_restriction_policy_arn" {
  description = "ARN of the regional restriction IAM policy"
  value       = aws_iam_policy.regional_restriction.arn
}

output "s3_access_policy_arn" {
  description = "ARN of the S3 access IAM policy"
  value       = aws_iam_policy.s3_access.arn
}

# S3 Bucket Information
output "financial_data_bucket_name" {
  description = "Name of the financial data S3 bucket"
  value       = aws_s3_bucket.financial_data.bucket
}

output "financial_data_bucket_arn" {
  description = "ARN of the financial data S3 bucket"
  value       = aws_s3_bucket.financial_data.arn
}

output "access_logs_bucket_name" {
  description = "Name of the S3 access logs bucket"
  value       = var.enable_s3_access_logging ? aws_s3_bucket.access_logs[0].bucket : null
}

output "access_logs_bucket_arn" {
  description = "ARN of the S3 access logs bucket"
  value       = var.enable_s3_access_logging ? aws_s3_bucket.access_logs[0].arn : null
}

# KMS Key Information
output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = var.s3_encryption_enabled ? aws_kms_key.s3[0].key_id : null
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = var.s3_encryption_enabled ? aws_kms_key.s3[0].arn : null
}

output "kms_key_alias" {
  description = "Alias of the KMS key for encryption"
  value       = var.s3_encryption_enabled ? aws_kms_alias.s3[0].name : null
}

# Monitoring Information
output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = var.enable_iam_monitoring ? aws_sns_topic.security_alerts[0].arn : null
}

output "iam_events_log_group_name" {
  description = "Name of the CloudWatch log group for IAM events"
  value       = var.enable_iam_monitoring ? aws_cloudwatch_log_group.iam_events[0].name : null
}

output "iam_events_log_group_arn" {
  description = "ARN of the CloudWatch log group for IAM events"
  value       = var.enable_iam_monitoring ? aws_cloudwatch_log_group.iam_events[0].arn : null
}

# Lambda Function Information
output "access_expiration_lambda_function_name" {
  description = "Name of the access expiration Lambda function"
  value       = var.enable_time_based_access ? aws_lambda_function.access_expiration[0].function_name : null
}

output "access_expiration_lambda_function_arn" {
  description = "ARN of the access expiration Lambda function"
  value       = var.enable_time_based_access ? aws_lambda_function.access_expiration[0].arn : null
}

# General Information
output "account_id" {
  description = "AWS Account ID"
  value       = local.account_id
}

output "region" {
  description = "AWS Region"
  value       = local.region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.name_suffix
}

# Post-Deployment Manual Steps
output "mfa_delete_command" {
  description = "Command to enable MFA delete on S3 bucket (requires root account credentials with MFA)"
  value       = "aws s3api put-bucket-versioning --bucket ${aws_s3_bucket.financial_data.id} --versioning-configuration Status=Enabled,MFADelete=Enabled --mfa 'arn:aws:iam::${local.account_id}:mfa/root-account-mfa-device MFA_TOKEN_CODE'"
}

```

### provider.tf

```hcl
# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

```

### s3.tf

```hcl
# S3 Buckets with Advanced Security

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  count = var.s3_encryption_enabled ? 1 : 0

  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${local.partition}:iam::${local.account_id}:root"
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
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${local.region}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:${local.partition}:logs:${local.region}:${local.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "s3" {
  count = var.s3_encryption_enabled ? 1 : 0

  name          = local.kms_key_alias
  target_key_id = aws_kms_key.s3[0].key_id
}

# Access Logs Bucket
resource "aws_s3_bucket" "access_logs" {
  count = var.enable_s3_access_logging ? 1 : 0

  bucket = local.access_logs_bucket

  tags = merge(local.common_tags, {
    Purpose = "AccessLogs"
  })
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  count = var.enable_s3_access_logging ? 1 : 0

  bucket = aws_s3_bucket.access_logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  count = var.enable_s3_access_logging && var.s3_encryption_enabled ? 1 : 0

  bucket = aws_s3_bucket.access_logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3[0].arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  count = var.enable_s3_access_logging ? 1 : 0

  bucket = aws_s3_bucket.access_logs[0].id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555
    }
  }
}

# Financial Data Bucket
resource "aws_s3_bucket" "financial_data" {
  bucket = local.financial_data_bucket

  tags = merge(local.common_tags, {
    Purpose            = "FinancialData"
    DataClassification = "Confidential"
  })
}

resource "aws_s3_bucket_versioning" "financial_data" {
  bucket = aws_s3_bucket.financial_data.id

  versioning_configuration {
    status = "Enabled"
    # MFA Delete cannot be enabled via Terraform - must be enabled manually using AWS CLI with MFA token:
    # aws s3api put-bucket-versioning --bucket BUCKET_NAME --versioning-configuration Status=Enabled,MFADelete=Enabled --mfa "SERIAL_NUMBER MFA_CODE"
  }
}

resource "aws_s3_bucket_public_access_block" "financial_data" {
  bucket = aws_s3_bucket.financial_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "financial_data" {
  count = var.s3_encryption_enabled ? 1 : 0

  bucket = aws_s3_bucket.financial_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3[0].arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_logging" "financial_data" {
  count = var.enable_s3_access_logging ? 1 : 0

  bucket = aws_s3_bucket.financial_data.id

  target_bucket = aws_s3_bucket.access_logs[0].id
  target_prefix = "financial-data-logs/"
}

# Financial Data Bucket Policy with VPC Endpoint and Encryption Requirements
data "aws_iam_policy_document" "financial_data_bucket_policy" {
  # Deny all access unless through VPC endpoint
  dynamic "statement" {
    for_each = var.vpc_endpoint_id != "" ? [1] : []
    content {
      sid    = "DenyAccessWithoutVPCEndpoint"
      effect = "Deny"
      principals {
        type        = "*"
        identifiers = ["*"]
      }
      actions = ["s3:*"]
      resources = [
        aws_s3_bucket.financial_data.arn,
        "${aws_s3_bucket.financial_data.arn}/*"
      ]

      condition {
        test     = "StringNotEquals"
        variable = "aws:SourceVpce"
        values   = [var.vpc_endpoint_id]
      }
    }
  }

  # Deny unencrypted uploads
  statement {
    sid    = "DenyUnencryptedUploads"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.financial_data.arn}/*"
    ]

    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }

  # Deny insecure transport
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.financial_data.arn,
      "${aws_s3_bucket.financial_data.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Require MFA for delete operations
  statement {
    sid    = "RequireMFAForDelete"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = [
      "s3:DeleteObject",
      "s3:DeleteObjectVersion"
    ]
    resources = [
      "${aws_s3_bucket.financial_data.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["false"]
    }
  }

  # Deny public access explicitly
  statement {
    sid    = "DenyPublicAccess"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.financial_data.arn,
      "${aws_s3_bucket.financial_data.arn}/*"
    ]

    condition {
      test     = "StringLike"
      variable = "s3:x-amz-acl"
      values   = ["public-read", "public-read-write"]
    }
  }
}

resource "aws_s3_bucket_policy" "financial_data" {
  bucket = aws_s3_bucket.financial_data.id
  policy = data.aws_iam_policy_document.financial_data_bucket_policy.json
}

```

### variables.tf

```hcl
# General Variables
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming (e.g., pr4798, synth123). Reads from ENVIRONMENT_SUFFIX env variable if not provided."
  type        = string
  default     = ""

  validation {
    condition     = var.environment_suffix == "" || can(regex("^[a-z0-9-]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "project_name" {
  description = "Project name for resource tagging and naming"
  type        = string
  default     = "zero-trust-iam"
}

variable "owner" {
  description = "Owner or team responsible for the infrastructure"
  type        = string
  default     = "security-team"
}

# Network Security Variables
variable "allowed_ip_ranges" {
  description = "List of allowed IP CIDR ranges for corporate network and VPN access"
  type        = list(string)
  default = [
    "10.0.0.0/8",
    "172.16.0.0/12"
  ]
}

variable "vpc_endpoint_id" {
  description = "VPC endpoint ID for S3 access restrictions"
  type        = string
  default     = ""
}

# Time-Based Access Variables
variable "business_hours_start" {
  description = "Start of business hours in UTC (format: HH:MM:SS)"
  type        = string
  default     = "13:00:00"
}

variable "business_hours_end" {
  description = "End of business hours in UTC (format: HH:MM:SS)"
  type        = string
  default     = "22:00:00"
}

# Session Configuration Variables
variable "max_session_duration" {
  description = "Maximum session duration in seconds for IAM roles (max 14400 = 4 hours)"
  type        = number
  default     = 14400

  validation {
    condition     = var.max_session_duration >= 3600 && var.max_session_duration <= 14400
    error_message = "Maximum session duration must be between 3600 seconds (1 hour) and 14400 seconds (4 hours)."
  }
}

variable "external_session_duration" {
  description = "Session duration in seconds for external cross-account access (max 7200 = 2 hours)"
  type        = number
  default     = 7200

  validation {
    condition     = var.external_session_duration >= 3600 && var.external_session_duration <= 7200
    error_message = "External session duration must be between 3600 seconds (1 hour) and 7200 seconds (2 hours)."
  }
}

variable "mfa_max_age" {
  description = "Maximum age of MFA authentication in seconds"
  type        = number
  default     = 3600
}

# Cross-Account Access Variables
variable "external_account_ids" {
  description = "List of external AWS account IDs allowed for cross-account access"
  type        = list(string)
  default     = []
}

variable "external_id" {
  description = "External ID for cross-account role assumption (prevents confused deputy attacks)"
  type        = string
  default     = ""
  sensitive   = true
}

# Regional Restrictions Variables
variable "allowed_regions" {
  description = "List of AWS regions where operations are permitted"
  type        = list(string)
  default     = ["us-east-1"]
}

# Password Policy Variables
variable "password_min_length" {
  description = "Minimum password length for IAM users"
  type        = number
  default     = 14

  validation {
    condition     = var.password_min_length >= 14
    error_message = "Password minimum length must be at least 14 characters."
  }
}

variable "password_max_age" {
  description = "Maximum password age in days before expiration"
  type        = number
  default     = 90

  validation {
    condition     = var.password_max_age >= 1 && var.password_max_age <= 90
    error_message = "Password maximum age must be between 1 and 90 days."
  }
}

variable "password_reuse_prevention" {
  description = "Number of previous passwords that cannot be reused"
  type        = number
  default     = 12

  validation {
    condition     = var.password_reuse_prevention >= 12
    error_message = "Password reuse prevention must remember at least 12 passwords."
  }
}

# S3 Security Variables
variable "enable_s3_access_logging" {
  description = "Enable S3 access logging for financial data buckets"
  type        = bool
  default     = true
}

variable "s3_encryption_enabled" {
  description = "Enable KMS encryption for S3 buckets"
  type        = bool
  default     = true
}

# Monitoring Variables
variable "enable_iam_monitoring" {
  description = "Enable CloudWatch monitoring for IAM activities"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email address for security alerts"
  type        = string
  default     = "security-team@example.com"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 90

  validation {
    condition     = var.log_retention_days >= 90
    error_message = "Log retention must be at least 90 days for compliance."
  }
}

# Time-Based Access Expiration Variables
variable "enable_time_based_access" {
  description = "Enable Lambda function for automatic time-based access expiration"
  type        = bool
  default     = true
}

variable "access_check_interval" {
  description = "Interval in minutes for checking and revoking expired access"
  type        = number
  default     = 60
}

# Service Role Variables
variable "enable_ec2_instance_role" {
  description = "Create IAM role for EC2 instances"
  type        = bool
  default     = true
}

variable "enable_lambda_execution_role" {
  description = "Create IAM role for Lambda functions"
  type        = bool
  default     = true
}

variable "enable_rds_monitoring_role" {
  description = "Create IAM role for RDS Enhanced Monitoring"
  type        = bool
  default     = true
}

# Financial Data Bucket Variables
variable "financial_data_bucket_name" {
  description = "Name of the S3 bucket for financial data storage (will be suffixed with environment)"
  type        = string
  default     = "financial-data"
}

variable "enable_mfa_delete" {
  description = "Require MFA for S3 object deletion operations (must be enabled manually via AWS CLI with MFA token after deployment)"
  type        = bool
  default     = false
}

```

### versions.tf

```hcl
# versions.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

```

### lambda-access-expiration/index.py

```python
import boto3
import json
import os
from datetime import datetime, timezone
from typing import Dict, List, Any

iam = boto3.client('iam')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
PROJECT_NAME = os.environ.get('PROJECT_NAME', 'zero-trust-iam')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function to check and revoke time-based access grants.

    This function:
    1. Scans for IAM policies with time-based conditions
    2. Checks if any temporary access grants have expired
    3. Detaches expired policies from roles/users
    4. Sends notifications for revoked access
    """

    print(f"Starting access expiration check at {datetime.now(timezone.utc)}")

    revoked_count = 0
    errors = []

    try:
        # Get all customer-managed policies
        policies = get_customer_managed_policies()
        print(f"Found {len(policies)} customer-managed policies to check")

        # Check each policy for time-based conditions
        for policy in policies:
            try:
                # Get policy details
                policy_arn = policy['Arn']
                policy_name = policy['PolicyName']

                # Get policy version
                policy_version = iam.get_policy_version(
                    PolicyArn=policy_arn,
                    VersionId=policy['DefaultVersionId']
                )

                policy_document = policy_version['PolicyVersion']['Document']

                # Check if policy has expired time-based conditions
                if is_policy_expired(policy_document):
                    print(f"Policy {policy_name} has expired - revoking access")

                    # Detach from all attached entities
                    detached = detach_policy_from_all(policy_arn, policy_name)
                    revoked_count += detached

            except Exception as e:
                error_msg = f"Error processing policy {policy.get('PolicyName', 'Unknown')}: {str(e)}"
                print(error_msg)
                errors.append(error_msg)

        # Send summary notification
        if revoked_count > 0 or errors:
            send_notification(revoked_count, errors)

        # Publish CloudWatch metric
        publish_metric('AccessRevocations', revoked_count)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Access expiration check completed',
                'revoked_count': revoked_count,
                'errors': len(errors)
            })
        }

    except Exception as e:
        print(f"Fatal error in access expiration check: {str(e)}")
        raise


def get_customer_managed_policies() -> List[Dict[str, Any]]:
    """Get all customer-managed policies."""
    policies = []
    marker = None

    while True:
        if marker:
            response = iam.list_policies(Scope='Local', Marker=marker, MaxItems=100)
        else:
            response = iam.list_policies(Scope='Local', MaxItems=100)

        policies.extend(response['Policies'])

        if response['IsTruncated']:
            marker = response['Marker']
        else:
            break

    return policies


def is_policy_expired(policy_document: Dict[str, Any]) -> bool:
    """Check if policy has expired based on time conditions."""

    if 'Statement' not in policy_document:
        return False

    current_time = datetime.now(timezone.utc)

    for statement in policy_document['Statement']:
        if 'Condition' not in statement:
            continue

        condition = statement['Condition']

        # Check for DateLessThan condition (expiration time)
        if 'DateLessThan' in condition:
            for key, value in condition['DateLessThan'].items():
                if 'aws:CurrentTime' in key:
                    expiration_time = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    if current_time >= expiration_time:
                        print(f"Policy expired: {current_time} >= {expiration_time}")
                        return True

        # Check for custom expiration tags
        if 'StringEquals' in condition:
            for key, value in condition['StringEquals'].items():
                if 'ExpirationDate' in key:
                    try:
                        expiration_time = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        if current_time >= expiration_time:
                            return True
                    except ValueError:
                        pass

    return False


def detach_policy_from_all(policy_arn: str, policy_name: str) -> int:
    """Detach policy from all attached users, groups, and roles."""

    detached_count = 0

    # Detach from users
    try:
        users_response = iam.list_entities_for_policy(
            PolicyArn=policy_arn,
            EntityFilter='User'
        )

        for user in users_response.get('PolicyUsers', []):
            iam.detach_user_policy(
                UserName=user['UserName'],
                PolicyArn=policy_arn
            )
            print(f"Detached policy {policy_name} from user {user['UserName']}")
            detached_count += 1
    except Exception as e:
        print(f"Error detaching from users: {str(e)}")

    # Detach from groups
    try:
        groups_response = iam.list_entities_for_policy(
            PolicyArn=policy_arn,
            EntityFilter='Group'
        )

        for group in groups_response.get('PolicyGroups', []):
            iam.detach_group_policy(
                GroupName=group['GroupName'],
                PolicyArn=policy_arn
            )
            print(f"Detached policy {policy_name} from group {group['GroupName']}")
            detached_count += 1
    except Exception as e:
        print(f"Error detaching from groups: {str(e)}")

    # Detach from roles
    try:
        roles_response = iam.list_entities_for_policy(
            PolicyArn=policy_arn,
            EntityFilter='Role'
        )

        for role in roles_response.get('PolicyRoles', []):
            iam.detach_role_policy(
                RoleName=role['RoleName'],
                PolicyArn=policy_arn
            )
            print(f"Detached policy {policy_name} from role {role['RoleName']}")
            detached_count += 1
    except Exception as e:
        print(f"Error detaching from roles: {str(e)}")

    return detached_count


def send_notification(revoked_count: int, errors: List[str]) -> None:
    """Send SNS notification about access revocations."""

    if not SNS_TOPIC_ARN:
        print("No SNS topic configured, skipping notification")
        return

    subject = f"IAM Access Expiration Report - {revoked_count} policies revoked"

    message = f"""
IAM Access Expiration Check Completed

Time: {datetime.now(timezone.utc).isoformat()}
Revoked Policies: {revoked_count}
Errors: {len(errors)}

"""

    if errors:
        message += "\nErrors:\n"
        for error in errors:
            message += f"- {error}\n"

    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        print(f"Notification sent to {SNS_TOPIC_ARN}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")


def publish_metric(metric_name: str, value: float) -> None:
    """Publish custom CloudWatch metric."""

    try:
        cloudwatch.put_metric_data(
            Namespace=f'{PROJECT_NAME}/Security',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count',
                    'Timestamp': datetime.now(timezone.utc)
                }
            ]
        )
        print(f"Published metric {metric_name}: {value}")
    except Exception as e:
        print(f"Error publishing metric: {str(e)}")

```

