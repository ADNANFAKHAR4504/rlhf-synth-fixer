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
