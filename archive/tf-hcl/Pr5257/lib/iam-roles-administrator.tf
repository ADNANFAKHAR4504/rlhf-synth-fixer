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
