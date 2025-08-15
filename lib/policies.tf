# policies.tf - IAM Policy Documents

# Data source for current AWS account and partition
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

# Trust policy for cross-account role assumption
data "aws_iam_policy_document" "cross_account_trust" {
  statement {
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for account_id in var.trusted_account_ids : "arn:${data.aws_partition.current.partition}:iam::${account_id}:root"]
    }
    actions = ["sts:AssumeRole"]
    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = ["${var.environment}-cross-account"]
    }
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
  }
}

# App Deploy Policy - Least privilege for application deployment
data "aws_iam_policy_document" "app_deploy_policy" {
  statement {
    sid    = "EC2DeploymentAccess"
    effect = "Allow"
    actions = [
      "ec2:DescribeInstances",
      "ec2:DescribeImages",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSubnets",
      "ec2:DescribeVpcs",
      "ec2:DescribeKeyPairs",
      "ec2:RunInstances",
      "ec2:TerminateInstances",
      "ec2:StartInstances",
      "ec2:StopInstances",
      "ec2:CreateTags"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  statement {
    sid    = "ECSDeploymentAccess"
    effect = "Allow"
    actions = [
      "ecs:DescribeClusters",
      "ecs:DescribeServices",
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
      "ecs:UpdateService",
      "ecs:CreateService",
      "ecs:DeleteService"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:ecs:*:${var.account_id}:cluster/${var.environment}-*",
      "arn:${data.aws_partition.current.partition}:ecs:*:${var.account_id}:service/${var.environment}-*/*",
      "arn:${data.aws_partition.current.partition}:ecs:*:${var.account_id}:task-definition/${var.environment}-*:*"
    ]
  }

  statement {
    sid    = "IAMPassRoleForDeployment"
    effect = "Allow"
    actions = ["iam:PassRole"]
    resources = ["arn:${data.aws_partition.current.partition}:iam::${var.account_id}:role/${var.environment}-*"]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values = [
        "ec2.amazonaws.com",
        "ecs-tasks.amazonaws.com"
      ]
    }
  }
}

# Read-only policy with explicit deny for destructive actions
data "aws_iam_policy_document" "readonly_policy" {
  statement {
    sid    = "ReadOnlyAccess"
    effect = "Allow"
    actions = [
      "ec2:Describe*",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:GetBucketLocation",
      "rds:Describe*",
      "lambda:GetFunction",
      "lambda:ListFunctions",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListRoles",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies",
      "iam:GetAccountSummary"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "DenyDestructiveActions"
    effect = "Deny"
    actions = [
      "*:Delete*",
      "*:Terminate*",
      "*:Remove*",
      "*:Detach*",
      "*:Stop*",
      "*:Destroy*"
    ]
    resources = ["*"]
  }
}

# Audit policy for compliance and security auditing
data "aws_iam_policy_document" "audit_policy" {
  statement {
    sid    = "AuditReadAccess"
    effect = "Allow"
    actions = [
      "cloudtrail:DescribeTrails",
      "cloudtrail:GetTrailStatus",
      "cloudtrail:LookupEvents",
      "config:GetConfigurationRecorder",
      "config:GetDeliveryChannel",
      "config:GetComplianceDetailsByConfigRule",
      "iam:GenerateCredentialReport",
      "iam:GetCredentialReport",
      "iam:ListUsers",
      "iam:ListRoles",
      "iam:ListPolicies",
      "iam:GetAccountSummary",
      "iam:GetAccountPasswordPolicy",
      "iam:ListAccessKeys",
      "iam:GetAccessKeyLastUsed"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudTrailLogAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::${var.log_bucket_name}",
      "arn:${data.aws_partition.current.partition}:s3:::${var.log_bucket_name}/*"
    ]
  }
}

# CloudWatch read-only policy
data "aws_iam_policy_document" "cloudwatch_readonly_policy" {
  statement {
    sid    = "CloudWatchReadOnlyAccess"
    effect = "Allow"
    actions = [
      "cloudwatch:DescribeAlarms",
      "cloudwatch:DescribeAlarmsForMetric",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:GetMetricData",
      "cloudwatch:ListMetrics",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
      "logs:StartQuery",
      "logs:StopQuery",
      "logs:GetQueryResults"
    ]
    resources = ["*"]
  }
}

# S3 upload policy for specific bucket
data "aws_iam_policy_document" "s3_upload_policy" {
  statement {
    sid    = "S3UploadAccess"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:DeleteObject"
    ]
    resources = ["arn:${data.aws_partition.current.partition}:s3:::${var.app_s3_bucket_name}/*"]
  }

  statement {
    sid    = "S3BucketListAccess"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]
    resources = ["arn:${data.aws_partition.current.partition}:s3:::${var.app_s3_bucket_name}"]
  }
}

# CloudTrail write policy for centralized logging
data "aws_iam_policy_document" "cloudtrail_write_policy" {
  statement {
    sid    = "CloudTrailLogDelivery"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetBucketAcl"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::${var.log_bucket_name}",
      "arn:${data.aws_partition.current.partition}:s3:::${var.log_bucket_name}/*"
    ]
  }

  statement {
    sid    = "CloudWatchLogsAccess"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:${data.aws_partition.current.partition}:logs:*:${var.account_id}:log-group:/aws/cloudtrail/*"]
  }
}
