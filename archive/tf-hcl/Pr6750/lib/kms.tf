# Primary KMS key in us-east-1
resource "aws_kms_key" "primary" {
  description             = "${local.resource_prefix}-primary-key-${local.suffix}"
  deletion_window_in_days = var.kms_key_deletion_window
  enable_key_rotation     = true
  multi_region            = true

  policy = data.aws_iam_policy_document.kms_key_policy.json

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-primary-key-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "multi-region-encryption"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_alias" "primary" {
  name          = "alias/${local.resource_prefix}-primary-${local.suffix}"
  target_key_id = aws_kms_key.primary.key_id

  lifecycle {
    prevent_destroy = false
  }
}

# Replica key in eu-west-1
resource "aws_kms_replica_key" "eu_west_1" {
  provider = aws.eu_west_1

  description             = "${local.resource_prefix}-replica-eu-west-1-${local.suffix}"
  deletion_window_in_days = var.kms_key_deletion_window
  primary_key_arn         = aws_kms_key.primary.arn

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-replica-eu-west-1-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "multi-region-encryption"
    Region             = "eu-west-1"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_alias" "eu_west_1" {
  provider = aws.eu_west_1

  name          = "alias/${local.resource_prefix}-replica-eu-west-1-${local.suffix}"
  target_key_id = aws_kms_replica_key.eu_west_1.key_id

  lifecycle {
    prevent_destroy = false
  }
}

# Replica key in ap-southeast-1
resource "aws_kms_replica_key" "ap_southeast_1" {
  provider = aws.ap_southeast_1

  description             = "${local.resource_prefix}-replica-ap-southeast-1-${local.suffix}"
  deletion_window_in_days = var.kms_key_deletion_window
  primary_key_arn         = aws_kms_key.primary.arn

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-replica-ap-southeast-1-${local.suffix}"
    DataClassification = "Confidential"
    Purpose            = "multi-region-encryption"
    Region             = "ap-southeast-1"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_alias" "ap_southeast_1" {
  provider = aws.ap_southeast_1

  name          = "alias/${local.resource_prefix}-replica-ap-southeast-1-${local.suffix}"
  target_key_id = aws_kms_replica_key.ap_southeast_1.key_id

  lifecycle {
    prevent_destroy = false
  }
}

# KMS key policy
data "aws_iam_policy_document" "kms_key_policy" {
  # Allow account root for key management
  statement {
    sid    = "Enable IAM User Permissions"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "kms:Create*",
      "kms:Describe*",
      "kms:Enable*",
      "kms:List*",
      "kms:Put*",
      "kms:Update*",
      "kms:Revoke*",
      "kms:Disable*",
      "kms:Get*",
      "kms:Delete*",
      "kms:ScheduleKeyDeletion",
      "kms:CancelKeyDeletion",
      "kms:ReplicateKey"
    ]

    resources = ["*"]
  }

  # Explicitly deny root account decrypt operations
  statement {
    sid    = "DenyRootAccountDecrypt"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = [
      "kms:Decrypt"
    ]

    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:PrincipalType"
      values   = ["Root"]
    }
  }

  # Allow specific IAM roles to use the key
  statement {
    sid    = "AllowIAMRoleUsage"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = [
        aws_iam_role.secrets_rotation.arn,
        aws_iam_role.config_role.arn,
      ]
    }

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:CreateGrant"
    ]

    resources = ["*"]
  }

  # Allow CloudWatch Logs to use the key
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logs.${var.primary_region}.amazonaws.com"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:CreateGrant",
      "kms:DescribeKey"
    ]

    resources = ["*"]

    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values   = ["arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:*"]
    }
  }

  # Allow Secrets Manager to use the key
  statement {
    sid    = "AllowSecretsManager"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["secretsmanager.${var.primary_region}.amazonaws.com"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:CreateGrant",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }

}

data "aws_caller_identity" "current" {}
