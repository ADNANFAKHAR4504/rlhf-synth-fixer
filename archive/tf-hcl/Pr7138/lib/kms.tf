# Primary KMS key in us-east-1
resource "aws_kms_key" "primary" {
  provider    = aws.primary
  description = "Primary KMS key for multi-account security framework - ${var.environment_suffix}"

  deletion_window_in_days = 30
  enable_key_rotation     = true
  rotation_period_in_days = var.kms_key_rotation_days

  tags = merge(
    var.tags,
    {
      Name = "primary-kms-key-${var.environment_suffix}"
    }
  )
}

# Primary KMS key alias
resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/security-primary-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key policy for primary key
resource "aws_kms_key_policy" "primary" {
  provider   = aws.primary
  key_id     = aws_kms_key.primary.id
  policy     = data.aws_iam_policy_document.kms_primary_policy.json
  depends_on = [aws_kms_key.primary]
}

# KMS key policy document
data "aws_iam_policy_document" "kms_primary_policy" {
  statement {
    sid    = "Enable IAM Root Account Permissions"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "Allow Cross Account Use"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for id in var.trusted_account_ids : "arn:aws:iam::${id}:root"]
    }
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "kms:CreateGrant",
      "kms:DescribeKey"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "Allow CloudTrail to Encrypt Logs"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = [
      "kms:GenerateDataKey",
      "kms:DecryptDataKey"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "Allow AWS Config to Use Key"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "Allow CloudWatch Logs to Encrypt"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["logs.${var.primary_region}.amazonaws.com"]
    }
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = ["*"]
    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values   = ["arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:*"]
    }
  }

  statement {
    sid    = "Prevent Key Deletion"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = [
      "kms:ScheduleKeyDeletion",
      "kms:DisableKey"
    ]
    resources = ["*"]
  }
}

# Replica KMS key in us-west-2
resource "aws_kms_replica_key" "secondary" {
  provider                = aws.secondary
  description             = "Replica KMS key for disaster recovery - ${var.environment_suffix}"
  primary_key_arn         = aws_kms_key.primary.arn
  deletion_window_in_days = 30

  depends_on = [aws_kms_key.primary]

  tags = merge(
    var.tags,
    {
      Name = "replica-kms-key-${var.environment_suffix}"
    }
  )
}

# Replica KMS key alias
resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/security-replica-${var.environment_suffix}"
  target_key_id = aws_kms_replica_key.secondary.key_id
  depends_on    = [aws_kms_replica_key.secondary]
}

# KMS key grant for cross-account use
resource "aws_kms_grant" "cross_account" {
  for_each = toset(var.trusted_account_ids)

  name              = "cross-account-grant-${each.value}-${var.environment_suffix}"
  key_id            = aws_kms_key.primary.key_id
  grantee_principal = "arn:aws:iam::${each.value}:root"

  operations = [
    "Decrypt",
    "GenerateDataKey",
    "CreateGrant"
  ]

  constraints {
    encryption_context_subset = {
      "Department" = "Finance"
    }
  }

  retiring_principal = "arn:aws:iam::${each.value}:role/KmsGrantRole"

  depends_on = [aws_kms_key.primary]
}
