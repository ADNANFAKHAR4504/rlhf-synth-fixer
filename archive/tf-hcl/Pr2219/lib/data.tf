# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current region
data "aws_region" "current" {}

data "aws_iam_policy_document" "cloudtrail_s3" {
  statement {
    sid = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = ["arn:aws:s3:::secconfig-cloudtrail-bucket-pr2219"]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }

  statement {
    sid = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::secconfig-cloudtrail-bucket-pr2219/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

# Secure bucket policy - allow all IAM roles/users in this account
data "aws_iam_policy_document" "secure_bucket" {
  statement {
    sid     = "AllowAllAccountPrincipals"
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = [
      "arn:aws:s3:::secconfig-secure-bucket-pr2219",
      "arn:aws:s3:::secconfig-secure-bucket-pr2219/*"
    ]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }
}


data "aws_iam_policy_document" "config_s3" {
  statement {
    sid = "AWSCloudTrailAclCheck"
    actions   = [
      "s3:GetBucketAcl",
      "s3:ListBucket"
      ]
    resources = ["arn:aws:s3:::secconfig-config-bucket-pr2219"]

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
  }

  statement {
    sid = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::secconfig-config-bucket-pr2219/*"]

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

data "aws_iam_policy_document" "cloudtrail_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "cloudtrail_cw_policy" {
  statement {
    actions   = ["logs:PutLogEvents", "logs:CreateLogStream"]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "config_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "config_policy" {
  statement {
    actions   = ["logs:PutLogEvents", "logs:CreateLogStream"]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "mfa_role_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = ["sts:AssumeRole"]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = ["3600"]
    }
  }
}

data "aws_iam_policy_document" "s3_readonly" {
  statement {
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]

    resources = [
      module.s3_secure_bucket.s3_bucket_arn,
      "${module.s3_secure_bucket.s3_bucket_arn}/*"
    ]
  }
}