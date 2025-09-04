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
# IAM Roles and Policies (Least Privilege Principle)
########################

# IAM Role for Application Access
resource "aws_iam_role" "application_role" {
  for_each = local.environments
  name     = "${each.value}-application-role-${local.project_name}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${each.value}-application-role-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
  }
}

# IAM Role for Audit Access (Read-only logs)
resource "aws_iam_role" "audit_role" {
  for_each = local.environments
  name     = "${each.value}-audit-role-${local.project_name}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })

  tags = {
    Name        = "${each.value}-audit-role-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
  }
}

# IAM Role for Read-only Access
resource "aws_iam_role" "readonly_role" {
  for_each = local.environments
  name     = "${each.value}-readonly-role-${local.project_name}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })

  tags = {
    Name        = "${each.value}-readonly-role-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
  }
}

# IAM Policy for Application Role - CloudWatch Logs Write Access
resource "aws_iam_policy" "application_logs_policy" {
  for_each = local.environments
  name     = "${each.value}-application-logs-policy-${local.project_name}-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.application_logs_use1[each.value].arn}:*",
          "${aws_cloudwatch_log_group.application_logs_usw2[each.value].arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.logs_use1[each.value].arn,
          aws_kms_key.logs_usw2[each.value].arn
        ]
      }
    ]
  })

  tags = {
    Name        = "${each.value}-application-logs-policy-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
  }
}

# IAM Policy for Audit Role - Read-only access to audit logs
resource "aws_iam_policy" "audit_logs_policy" {
  for_each = local.environments
  name     = "${each.value}-audit-logs-policy-${local.project_name}-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.audit_logs_use1[each.value].arn}:*",
          "${aws_cloudwatch_log_group.audit_logs_usw2[each.value].arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.logs_use1[each.value].arn,
          aws_kms_key.logs_usw2[each.value].arn
        ]
      }
    ]
  })

  tags = {
    Name        = "${each.value}-audit-logs-policy-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
  }
}

# IAM Policy for Read-only Role - Read-only access to all logs
resource "aws_iam_policy" "readonly_logs_policy" {
  for_each = local.environments
  name     = "${each.value}-readonly-logs-policy-${local.project_name}-${var.environment_suffix}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.application_logs_use1[each.value].arn}:*",
          "${aws_cloudwatch_log_group.application_logs_usw2[each.value].arn}:*",
          "${aws_cloudwatch_log_group.audit_logs_use1[each.value].arn}:*",
          "${aws_cloudwatch_log_group.audit_logs_usw2[each.value].arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.logs_use1[each.value].arn,
          aws_kms_key.logs_usw2[each.value].arn
        ]
      }
    ]
  })

  tags = {
    Name        = "${each.value}-readonly-logs-policy-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
  }
}

# Policy Attachments
resource "aws_iam_role_policy_attachment" "application_logs_attachment" {
  for_each   = local.environments
  policy_arn = aws_iam_policy.application_logs_policy[each.value].arn
  role       = aws_iam_role.application_role[each.value].name
}

resource "aws_iam_role_policy_attachment" "audit_logs_attachment" {
  for_each   = local.environments
  policy_arn = aws_iam_policy.audit_logs_policy[each.value].arn
  role       = aws_iam_role.audit_role[each.value].name
}

resource "aws_iam_role_policy_attachment" "readonly_logs_attachment" {
  for_each   = local.environments
  policy_arn = aws_iam_policy.readonly_logs_policy[each.value].arn
  role       = aws_iam_role.readonly_role[each.value].name
}

########################
# CloudWatch Log Groups (split by region to bind correct provider & key)
########################
# us-east-1 - Application Logs
resource "aws_cloudwatch_log_group" "application_logs_use1" {
  for_each          = local.environments
  name              = "/aws/application/${each.value}-logs-${local.project_name}-${var.environment_suffix}"
  retention_in_days = each.value == "production" ? 365 : 30
  kms_key_id        = aws_kms_key.logs_use1[each.value].arn

  tags = {
    Name        = "${each.value}-application-logs-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
    Region      = var.primary_region
  }
}

# us-east-1 - Audit Logs
resource "aws_cloudwatch_log_group" "audit_logs_use1" {
  for_each          = local.environments
  name              = "/aws/audit/${each.value}-audit-logs-${local.project_name}-${var.environment_suffix}"
  retention_in_days = each.value == "production" ? 365 : 30
  kms_key_id        = aws_kms_key.logs_use1[each.value].arn

  tags = {
    Name        = "${each.value}-audit-logs-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
    Region      = var.primary_region
  }
}

# us-west-2 - Application Logs
resource "aws_cloudwatch_log_group" "application_logs_usw2" {
  provider          = aws.secondary
  for_each          = local.environments
  name              = "/aws/application/${each.value}-logs-${local.project_name}-${var.environment_suffix}"
  retention_in_days = each.value == "production" ? 365 : 30
  kms_key_id        = aws_kms_key.logs_usw2[each.value].arn

  tags = {
    Name        = "${each.value}-application-logs-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
    Region      = var.secondary_region
  }
}

# us-west-2 - Audit Logs
resource "aws_cloudwatch_log_group" "audit_logs_usw2" {
  provider          = aws.secondary
  for_each          = local.environments
  name              = "/aws/audit/${each.value}-audit-logs-${local.project_name}-${var.environment_suffix}"
  retention_in_days = each.value == "production" ? 365 : 30
  kms_key_id        = aws_kms_key.logs_usw2[each.value].arn

  tags = {
    Name        = "${each.value}-audit-logs-${local.project_name}-${var.environment_suffix}"
    Environment = each.value
    Region      = var.secondary_region
  }
}

########################
# Outputs compatible with for_each resources
# Returns maps keyed by each.key for every region/env instance
########################

# --- KMS keys (use1 / usw2) ---

output "kms_logs_use1_arn_by_key" {
  description = "ARNs of KMS keys created by aws_kms_key.logs_use1, keyed by each.key"
  value       = { for k, v in aws_kms_key.logs_use1 : k => v.arn }
}

output "kms_logs_use1_key_id_by_key" {
  description = "Key IDs of KMS keys created by aws_kms_key.logs_use1, keyed by each.key"
  value       = { for k, v in aws_kms_key.logs_use1 : k => v.key_id }
}

output "kms_logs_usw2_arn_by_key" {
  description = "ARNs of KMS keys created by aws_kms_key.logs_usw2, keyed by each.key"
  value       = { for k, v in aws_kms_key.logs_usw2 : k => v.arn }
}

output "kms_logs_usw2_key_id_by_key" {
  description = "Key IDs of KMS keys created by aws_kms_key.logs_usw2, keyed by each.key"
  value       = { for k, v in aws_kms_key.logs_usw2 : k => v.key_id }
}

# --- KMS aliases ---

output "kms_alias_logs_use1_name_by_key" {
  description = "Alias names for aws_kms_alias.logs_use1, keyed by each.key"
  value       = { for k, v in aws_kms_alias.logs_use1 : k => v.name }
}

output "kms_alias_logs_use1_arn_by_key" {
  description = "Alias ARNs for aws_kms_alias.logs_use1, keyed by each.key"
  value       = { for k, v in aws_kms_alias.logs_use1 : k => v.arn }
}

output "kms_alias_logs_use1_target_key_id_by_key" {
  description = "Target key IDs for aws_kms_alias.logs_use1, keyed by each.key"
  value       = { for k, v in aws_kms_alias.logs_use1 : k => v.target_key_id }
}

output "kms_alias_logs_usw2_name_by_key" {
  description = "Alias names for aws_kms_alias.logs_usw2, keyed by each.key"
  value       = { for k, v in aws_kms_alias.logs_usw2 : k => v.name }
}

output "kms_alias_logs_usw2_arn_by_key" {
  description = "Alias ARNs for aws_kms_alias.logs_usw2, keyed by each.key"
  value       = { for k, v in aws_kms_alias.logs_usw2 : k => v.arn }
}

output "kms_alias_logs_usw2_target_key_id_by_key" {
  description = "Target key IDs for aws_kms_alias.logs_usw2, keyed by each.key"
  value       = { for k, v in aws_kms_alias.logs_usw2 : k => v.target_key_id }
}

# --- CloudWatch Log Groups ---

output "log_group_use1_name_by_key" {
  description = "Log group names for aws_cloudwatch_log_group.application_logs_use1, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.application_logs_use1 : k => v.name }
}

output "log_group_use1_arn_by_key" {
  description = "Log group ARNs for aws_cloudwatch_log_group.application_logs_use1, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.application_logs_use1 : k => v.arn }
}

output "log_group_use1_kms_key_id_by_key" {
  description = "KMS key IDs used by the use1 log groups, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.application_logs_use1 : k => v.kms_key_id }
}

output "log_group_usw2_name_by_key" {
  description = "Log group names for aws_cloudwatch_log_group.application_logs_usw2, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.application_logs_usw2 : k => v.name }
}

output "log_group_usw2_arn_by_key" {
  description = "Log group ARNs for aws_cloudwatch_log_group.application_logs_usw2, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.application_logs_usw2 : k => v.arn }
}

output "log_group_usw2_kms_key_id_by_key" {
  description = "KMS key IDs used by the usw2 log groups, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.application_logs_usw2 : k => v.kms_key_id }
}

# --- IAM Roles ---

output "iam_application_role_name_by_key" {
  description = "Application role names, keyed by each.key"
  value       = { for k, v in aws_iam_role.application_role : k => v.name }
}

output "iam_application_role_arn_by_key" {
  description = "Application role ARNs, keyed by each.key"
  value       = { for k, v in aws_iam_role.application_role : k => v.arn }
}

output "iam_audit_role_name_by_key" {
  description = "Audit role names, keyed by each.key"
  value       = { for k, v in aws_iam_role.audit_role : k => v.name }
}

output "iam_audit_role_arn_by_key" {
  description = "Audit role ARNs, keyed by each.key"
  value       = { for k, v in aws_iam_role.audit_role : k => v.arn }
}

output "iam_readonly_role_name_by_key" {
  description = "Read-only role names, keyed by each.key"
  value       = { for k, v in aws_iam_role.readonly_role : k => v.name }
}

output "iam_readonly_role_arn_by_key" {
  description = "Read-only role ARNs, keyed by each.key"
  value       = { for k, v in aws_iam_role.readonly_role : k => v.arn }
}

# --- IAM Policies ---

output "iam_application_policy_arn_by_key" {
  description = "Application policy ARNs, keyed by each.key"
  value       = { for k, v in aws_iam_policy.application_logs_policy : k => v.arn }
}

output "iam_audit_policy_arn_by_key" {
  description = "Audit policy ARNs, keyed by each.key"
  value       = { for k, v in aws_iam_policy.audit_logs_policy : k => v.arn }
}

output "iam_readonly_policy_arn_by_key" {
  description = "Read-only policy ARNs, keyed by each.key"
  value       = { for k, v in aws_iam_policy.readonly_logs_policy : k => v.arn }
}

# --- Audit Log Groups ---

output "audit_log_group_use1_name_by_key" {
  description = "Audit log group names for us-east-1, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.audit_logs_use1 : k => v.name }
}

output "audit_log_group_use1_arn_by_key" {
  description = "Audit log group ARNs for us-east-1, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.audit_logs_use1 : k => v.arn }
}

output "audit_log_group_use1_kms_key_id_by_key" {
  description = "KMS key IDs used by the us-east-1 audit log groups, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.audit_logs_use1 : k => v.kms_key_id }
}

output "audit_log_group_usw2_name_by_key" {
  description = "Audit log group names for us-west-2, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.audit_logs_usw2 : k => v.name }
}

output "audit_log_group_usw2_arn_by_key" {
  description = "Audit log group ARNs for us-west-2, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.audit_logs_usw2 : k => v.arn }
}

output "audit_log_group_usw2_kms_key_id_by_key" {
  description = "KMS key IDs used by the us-west-2 audit log groups, keyed by each.key"
  value       = { for k, v in aws_cloudwatch_log_group.audit_logs_usw2 : k => v.kms_key_id }
}

