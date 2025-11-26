# Cross-account role for security team with MFA enforcement
resource "aws_iam_role" "cross_account_security" {
  name               = "cross-account-security-role-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.cross_account_security_assume.json

  tags = merge(
    var.tags,
    {
      Name = "cross-account-security-role-${var.environment_suffix}"
    }
  )
}

# Assume role policy with MFA enforcement
data "aws_iam_policy_document" "cross_account_security_assume" {
  statement {
    sid    = "AllowAssumeWithMFA"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for id in var.trusted_account_ids : "arn:aws:iam::${id}:root"]
    }
    actions = ["sts:AssumeRole"]
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
  }

  statement {
    sid    = "DenyAssumeWithoutMFA"
    effect = "Deny"
    principals {
      type        = "AWS"
      identifiers = [for id in var.trusted_account_ids : "arn:aws:iam::${id}:root"]
    }
    actions = ["sts:AssumeRole"]
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["false"]
    }
  }
}

# Inline policy for security role
resource "aws_iam_role_policy" "cross_account_security" {
  name   = "security-policy-${var.environment_suffix}"
  role   = aws_iam_role.cross_account_security.id
  policy = data.aws_iam_policy_document.cross_account_security_policy.json
}

# Security policy document
data "aws_iam_policy_document" "cross_account_security_policy" {
  statement {
    sid    = "SecurityAuditPermissions"
    effect = "Allow"
    actions = [
      "organizations:Describe*",
      "organizations:List*",
      "config:Describe*",
      "config:Get*",
      "config:List*",
      "cloudtrail:Describe*",
      "cloudtrail:GetTrailStatus",
      "cloudtrail:LookupEvents",
      "kms:Describe*",
      "kms:Get*",
      "kms:List*",
      "iam:Get*",
      "iam:List*",
      "s3:GetBucketEncryption",
      "s3:GetBucketVersioning",
      "s3:ListBucket",
      "ec2:DescribeVolumes",
      "ec2:DescribeVolumeStatus",
      "rds:DescribeDBInstances",
      "rds:DescribeDBClusters"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "DenyDangerousActions"
    effect = "Deny"
    actions = [
      "iam:DeleteUser",
      "iam:DeleteRole",
      "iam:DeleteRolePolicy",
      "iam:PutUserPolicy",
      "iam:PutRolePolicy",
      "kms:ScheduleKeyDeletion",
      "kms:DisableKey",
      "organizations:LeaveOrganization",
      "organizations:DeleteOrganization"
    ]
    resources = ["*"]
  }
}

# Cross-account role for operations team
resource "aws_iam_role" "cross_account_operations" {
  name               = "cross-account-operations-role-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.cross_account_operations_assume.json

  tags = merge(
    var.tags,
    {
      Name = "cross-account-operations-role-${var.environment_suffix}"
    }
  )
}

# Assume role policy for operations
data "aws_iam_policy_document" "cross_account_operations_assume" {
  statement {
    sid    = "AllowAssumeWithMFA"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for id in var.trusted_account_ids : "arn:aws:iam::${id}:root"]
    }
    actions = ["sts:AssumeRole"]
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
  }
}

# Inline policy for operations role
resource "aws_iam_role_policy" "cross_account_operations" {
  name   = "operations-policy-${var.environment_suffix}"
  role   = aws_iam_role.cross_account_operations.id
  policy = data.aws_iam_policy_document.cross_account_operations_policy.json
}

# Operations policy document
data "aws_iam_policy_document" "cross_account_operations_policy" {
  statement {
    sid    = "OperationsPermissions"
    effect = "Allow"
    actions = [
      "autoscaling:Describe*",
      "cloudwatch:Get*",
      "cloudwatch:List*",
      "ec2:Describe*",
      "elasticloadbalancing:Describe*",
      "rds:Describe*",
      "s3:Get*",
      "s3:List*",
      "logs:Describe*",
      "logs:Get*"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "DenyHighRiskOperations"
    effect = "Deny"
    actions = [
      "ec2:TerminateInstances",
      "ec2:DeleteVolume",
      "rds:DeleteDBInstance",
      "s3:DeleteBucket"
    ]
    resources = ["*"]
  }
}

# Cross-account role for developers
resource "aws_iam_role" "cross_account_developer" {
  name               = "cross-account-developer-role-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.cross_account_developer_assume.json

  tags = merge(
    var.tags,
    {
      Name = "cross-account-developer-role-${var.environment_suffix}"
    }
  )
}

# Assume role policy for developers
data "aws_iam_policy_document" "cross_account_developer_assume" {
  statement {
    sid    = "AllowAssumeWithMFA"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for id in var.trusted_account_ids : "arn:aws:iam::${id}:root"]
    }
    actions = ["sts:AssumeRole"]
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
  }
}

# Inline policy for developer role
resource "aws_iam_role_policy" "cross_account_developer" {
  name   = "developer-policy-${var.environment_suffix}"
  role   = aws_iam_role.cross_account_developer.id
  policy = data.aws_iam_policy_document.cross_account_developer_policy.json
}

# Developer policy document
data "aws_iam_policy_document" "cross_account_developer_policy" {
  statement {
    sid    = "DeveloperPermissions"
    effect = "Allow"
    actions = [
      "ec2:Describe*",
      "ec2:Get*",
      "ec2:RunInstances",
      "ec2:StartInstances",
      "ec2:StopInstances",
      "cloudwatch:Get*",
      "logs:Describe*",
      "logs:Get*",
      "s3:Get*",
      "s3:List*",
      "s3:PutObject",
      "lambda:Invoke"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "RestrictToEncryptedResources"
    effect = "Deny"
    actions = [
      "s3:PutObject"
    ]
    resources = ["*"]
    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }
}

# IAM policy for AWS Config role in member accounts
resource "aws_iam_role" "config_role" {
  name               = "aws-config-role-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.config_assume.json

  tags = merge(
    var.tags,
    {
      Name = "aws-config-role-${var.environment_suffix}"
    }
  )
}

# Config assume role policy
data "aws_iam_policy_document" "config_assume" {
  statement {
    sid    = "AllowConfigService"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

# Attach managed policy to config role
resource "aws_iam_role_policy_attachment" "config_managed_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Inline policy for config role with S3 access
resource "aws_iam_role_policy" "config_s3" {
  name   = "config-s3-policy-${var.environment_suffix}"
  role   = aws_iam_role.config_role.id
  policy = data.aws_iam_policy_document.config_s3_policy.json
}

# Config S3 policy document
data "aws_iam_policy_document" "config_s3_policy" {
  statement {
    sid    = "ConfigS3Permissions"
    effect = "Allow"
    actions = [
      "s3:GetBucketVersioning",
      "s3:PutObject",
      "s3:GetObject"
    ]
    resources = [
      aws_s3_bucket.config_bucket.arn,
      "${aws_s3_bucket.config_bucket.arn}/*"
    ]
  }
}

# S3 bucket for AWS Config snapshots
resource "aws_s3_bucket" "config_bucket" {
  bucket = "aws-config-bucket-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.tags,
    {
      Name = "config-bucket-${var.environment_suffix}"
    }
  )
}

# Block public access to config bucket
resource "aws_s3_bucket_public_access_block" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning on config bucket
resource "aws_s3_bucket_versioning" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption on config bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
    bucket_key_enabled = true
  }
}
