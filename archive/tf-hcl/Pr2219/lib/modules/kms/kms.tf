resource "aws_kms_key" "secure_key" {
  description             = "KMS key for encrypting CloudTrail and other services"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = data.aws_iam_policy_document.kms_key_policy.json

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_kms_alias" "secure_key_alias" {
  name          = "alias/${var.project}-${var.environment}-kms-key"
  target_key_id = aws_kms_key.secure_key.key_id
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "kms_key_policy" {
  statement {
    sid    = "AllowRootAccountFullAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [data.aws_caller_identity.current.account_id]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "AllowCloudTrailUse"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = [
        "cloudtrail.amazonaws.com",
        "logs.${var.region}.amazonaws.com"
      ]
    }

    actions = [
      "kms:GenerateDataKey*",
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }
}