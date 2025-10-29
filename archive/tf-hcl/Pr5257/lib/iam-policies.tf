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
