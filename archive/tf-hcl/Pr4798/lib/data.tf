# Current AWS account and region information
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_partition" "current" {}

# CloudFront log delivery canonical user ID (for S3 audit bucket ACL if needed)
data "aws_canonical_user_id" "current" {}

# IAM policy document for S3 bucket policies
data "aws_iam_policy_document" "primary_bucket_policy" {
  # Deny unencrypted uploads
  statement {
    sid    = "DenyUnencryptedObjectUploads"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.primary.arn}/*"
    ]

    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }

  # Enforce SSL/TLS
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:*"
    ]

    resources = [
      aws_s3_bucket.primary.arn,
      "${aws_s3_bucket.primary.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Optional VPC endpoint restriction
  dynamic "statement" {
    for_each = var.restrict_to_vpc_endpoint != "" ? [1] : []

    content {
      sid    = "RestrictToVPCEndpoint"
      effect = "Deny"

      principals {
        type        = "*"
        identifiers = ["*"]
      }

      actions = [
        "s3:*"
      ]

      resources = [
        aws_s3_bucket.primary.arn,
        "${aws_s3_bucket.primary.arn}/*"
      ]

      condition {
        test     = "StringNotEquals"
        variable = "aws:SourceVpce"
        values   = [var.restrict_to_vpc_endpoint]
      }

      # Allow AWS services
      condition {
        test     = "StringNotEquals"
        variable = "aws:PrincipalServiceName"
        values = [
          "cloudtrail.amazonaws.com",
          "logging.s3.amazonaws.com"
        ]
      }
    }
  }

  # Optional trusted account access
  dynamic "statement" {
    for_each = length(var.trusted_account_ids) > 0 ? [1] : []

    content {
      sid    = "AllowTrustedAccounts"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = [for account_id in var.trusted_account_ids : "arn:${data.aws_partition.current.partition}:iam::${account_id}:root"]
      }

      actions = [
        "s3:GetObject",
        "s3:ListBucket"
      ]

      resources = [
        aws_s3_bucket.primary.arn,
        "${aws_s3_bucket.primary.arn}/*"
      ]
    }
  }
}

# Audit bucket policy
data "aws_iam_policy_document" "audit_bucket_policy" {
  # Allow CloudTrail to write logs
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions = [
      "s3:GetBucketAcl"
    ]

    resources = [
      aws_s3_bucket.audit.arn
    ]
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.audit.arn}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  # Allow S3 access logging
  statement {
    sid    = "S3AccessLoggingWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.audit.arn}/*"
    ]
  }

  # Enforce SSL/TLS
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:*"
    ]

    resources = [
      aws_s3_bucket.audit.arn,
      "${aws_s3_bucket.audit.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}
