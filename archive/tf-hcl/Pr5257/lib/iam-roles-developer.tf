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
