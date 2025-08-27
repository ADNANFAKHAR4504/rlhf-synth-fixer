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

data "aws_iam_policy_document" "secure_bucket" {
  statement {
    sid = "1"
    actions = [
      "s3:List*",
      "s3:GetBucketLocation",
    ]
    resources = [
      "arn:aws:s3:::*",
    ]
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
    resources = ["arn:aws:logs:${region}:${data.aws_caller_identity.current.id}:log-group:/aws/cloudtrail/cloudtrail-logs-pr2219:*"]
  }
}

