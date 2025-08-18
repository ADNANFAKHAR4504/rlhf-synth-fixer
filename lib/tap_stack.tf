########################
# Providers (primary + secondary)
########################
# Keep your existing provider blocks if present; these defaults are safe.
# Primary AWS provider for general resources (e.g., us-east-1)


########################
# Variables (safe defaults; use your existing variables if already defined)
########################
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

# If you already have these locals/vars, feel free to remove these duplicates.
# They are provided here so this file is self-contained.
locals {
  project_name = "secure-infra"
  environments = toset(["staging", "production"])
}

variable "environment_suffix" {
  description = "Environment suffix to avoid conflicts"
  type        = string
  default     = "dev"
}

########################
# Caller identity
########################
data "aws_caller_identity" "current" {}

########################
# KMS Key Policies per region (allow CloudWatch Logs to use the key)
########################
data "aws_iam_policy_document" "logs_kms_use1" {
  statement {
    sid     = "AllowAccountRootAdmin"
    effect  = "Allow"
    actions = ["kms:*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    resources = ["*"]
  }

  statement {
    sid    = "AllowCWLogsUSE1"
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
      "kms:DescribeKey"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "logs_kms_usw2" {
  statement {
    sid     = "AllowAccountRootAdmin"
    effect  = "Allow"
    actions = ["kms:*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    resources = ["*"]
  }

  statement {
    sid    = "AllowCWLogsUSW2"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["logs.${var.secondary_region}.amazonaws.com"]
    }
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = ["*"]
  }
}

########################
# Regional KMS keys
# - One key per ENV per REGION so names stay stable and permissions are scoped
########################
resource "aws_kms_key" "logs_use1" {
  for_each    = local.environments
  description = "CloudWatch Logs KMS key for ${each.value} in ${var.primary_region}"
  policy      = data.aws_iam_policy_document.logs_kms_use1.json

  # Optional: key rotation
  enable_key_rotation = true

  tags = {
    Name        = "logs-${each.value}-${local.project_name}-${var.environment_suffix}-${var.primary_region}"
    Environment = each.value
    Region      = var.primary_region
  }
}

resource "aws_kms_key" "logs_usw2" {
  provider    = aws.secondary
  for_each    = local.environments
  description = "CloudWatch Logs KMS key for ${each.value} in ${var.secondary_region}"
  policy      = data.aws_iam_policy_document.logs_kms_usw2.json

  enable_key_rotation = true

  tags = {
    Name        = "logs-${each.value}-${local.project_name}-${var.environment_suffix}-${var.secondary_region}"
    Environment = each.value
    Region      = var.secondary_region
  }
}

# (Optional) Aliases for nice names: alias/<env>-logs-<project>-<suffix>-<region>
resource "aws_kms_alias" "logs_use1" {
  for_each      = local.environments
  name          = "alias/${each.value}-logs-${local.project_name}-${var.environment_suffix}-${var.primary_region}"
  target_key_id = aws_kms_key.logs_use1[each.value].key_id
}

resource "aws_kms_alias" "logs_usw2" {
  provider      = aws.secondary
  for_each      = local.environments
  name          = "alias/${each.value}-logs-${local.project_name}-${var.environment_suffix}-${var.secondary_region}"
  target_key_id = aws_kms_key.logs_usw2[each.value].key_id
}

########################
# CloudWatch Log Groups (split by region to bind correct provider & key)
########################
# us-east-1
resource "aws_cloudwatch_log_group" "application_logs_use1" {
  for_each          = local.environments
  name              = "/aws/application/${each.value}-logs-${local.project_name}-${var.environment_suffix}"
  retention_in_days = each.value == "production" ? 365 : 30
  kms_key_id        = aws_kms_key.logs_use1[each.value].arn

  tags = {
    Name        = "${each.value}-logs-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
    Region      = var.primary_region
  }
}

# us-west-2
resource "aws_cloudwatch_log_group" "application_logs_usw2" {
  provider          = aws.secondary
  for_each          = local.environments
  name              = "/aws/application/${each.value}-logs-${local.project_name}-${var.environment_suffix}"
  retention_in_days = each.value == "production" ? 365 : 30
  kms_key_id        = aws_kms_key.logs_usw2[each.value].arn

  tags = {
    Name        = "${each.value}-logs-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
    Region      = var.secondary_region
  }
}

########################
# Notes:
# 1) Remove or comment out your previous aws_cloudwatch_log_group "application_logs"
#    and aws_kms_key "main" blocks to avoid duplicate resources.
# 2) No other technical changes should be required. The resources are equivalent,
#    but now bound to the correct regions and KMS policies.
########################
