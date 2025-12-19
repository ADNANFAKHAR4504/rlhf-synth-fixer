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
