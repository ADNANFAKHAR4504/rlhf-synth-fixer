```hcl
########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix to avoid conflicts between deployments"
  type        = string
  default     = "dev"
}

########################
# Data Sources
########################
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

########################
# Local Values
########################
locals {
  environments = ["production", "staging"]
  regions      = ["us-east-1", "us-west-2"]
  project_name = "secure-infra"
}

########################
# KMS Keys for Encryption
########################
resource "aws_kms_key" "main" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  description             = "KMS key for ${each.value.environment} environment in ${each.value.region}"
  deletion_window_in_days = each.value.environment == "production" ? 30 : 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${each.value.region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${each.value.environment}-kms-${local.project_name}-${var.environment_suffix}"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

resource "aws_kms_alias" "main" {
  for_each = aws_kms_key.main

  name          = "alias/${each.value.environment}-${local.project_name}-${each.value.region}-${var.environment_suffix}"
  target_key_id = each.value.key_id
}

########################
# CloudWatch Log Groups
########################
resource "aws_cloudwatch_log_group" "application_logs" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  name              = "/aws/application/${each.value.environment}-logs-${local.project_name}-${var.environment_suffix}"
  retention_in_days = each.value.environment == "production" ? 365 : 30
  kms_key_id        = aws_kms_key.main[each.key].arn

  tags = {
    Name        = "${each.value.environment}-logs-${local.project_name}-${var.environment_suffix}"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

resource "aws_cloudwatch_log_group" "audit_logs" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  name              = "/aws/audit/${each.value.environment}-audit-${local.project_name}-${var.environment_suffix}"
  retention_in_days = each.value.environment == "production" ? 2557 : 90
  kms_key_id        = aws_kms_key.main[each.key].arn

  tags = {
    Name        = "${each.value.environment}-audit-${local.project_name}-${var.environment_suffix}"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

########################
# IAM Assume Role Policy
########################
data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com", "lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

########################
# IAM Policy Documents
########################
data "aws_iam_policy_document" "application_role_policy" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  statement {
    sid    = "CloudWatchLogsAccess"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = [
      aws_cloudwatch_log_group.application_logs[each.key].arn,
      "${aws_cloudwatch_log_group.application_logs[each.key].arn}:*"
    ]
  }

  statement {
    sid    = "KMSAccess"
    effect = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = [aws_kms_key.main[each.key].arn]
  }
}

data "aws_iam_policy_document" "audit_role_policy" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  statement {
    sid    = "AuditLogsAccess"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = [
      aws_cloudwatch_log_group.audit_logs[each.key].arn,
      "${aws_cloudwatch_log_group.audit_logs[each.key].arn}:*"
    ]
  }

  statement {
    sid    = "KMSAccess"
    effect = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = [aws_kms_key.main[each.key].arn]
  }
}

data "aws_iam_policy_document" "readonly_role_policy" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  statement {
    sid    = "ReadOnlyLogsAccess"
    effect = "Allow"
    actions = [
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:GetLogEvents",
      "logs:FilterLogEvents"
    ]
    resources = [
      aws_cloudwatch_log_group.application_logs[each.key].arn,
      "${aws_cloudwatch_log_group.application_logs[each.key].arn}:*",
      aws_cloudwatch_log_group.audit_logs[each.key].arn,
      "${aws_cloudwatch_log_group.audit_logs[each.key].arn}:*"
    ]
  }

  statement {
    sid    = "KMSReadAccess"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]
    resources = [aws_kms_key.main[each.key].arn]
  }
}

########################
# IAM Roles
########################
resource "aws_iam_role" "application_role" {
  for_each = toset(local.environments)

  name               = "${each.key}-role-${local.project_name}-application-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json

  tags = {
    Name        = "${each.key}-role-${local.project_name}-application-${var.environment_suffix}"
    Environment = each.key
  }
}

resource "aws_iam_role" "audit_role" {
  for_each = toset(local.environments)

  name               = "${each.key}-role-${local.project_name}-audit-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json

  tags = {
    Name        = "${each.key}-role-${local.project_name}-audit-${var.environment_suffix}"
    Environment = each.key
  }
}

resource "aws_iam_role" "readonly_role" {
  for_each = toset(local.environments)

  name               = "${each.key}-role-${local.project_name}-readonly-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json

  tags = {
    Name        = "${each.key}-role-${local.project_name}-readonly-${var.environment_suffix}"
    Environment = each.key
  }
}

########################
# IAM Policies
########################
resource "aws_iam_policy" "application_policy" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  name   = "${each.value.environment}-policy-${local.project_name}-application-${each.value.region}-${var.environment_suffix}"
  policy = data.aws_iam_policy_document.application_role_policy[each.key].json

  tags = {
    Name        = "${each.value.environment}-policy-${local.project_name}-application-${var.environment_suffix}"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

resource "aws_iam_policy" "audit_policy" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  name   = "${each.value.environment}-policy-${local.project_name}-audit-${each.value.region}-${var.environment_suffix}"
  policy = data.aws_iam_policy_document.audit_role_policy[each.key].json

  tags = {
    Name        = "${each.value.environment}-policy-${local.project_name}-audit-${var.environment_suffix}"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

resource "aws_iam_policy" "readonly_policy" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  name   = "${each.value.environment}-policy-${local.project_name}-readonly-${each.value.region}-${var.environment_suffix}"
  policy = data.aws_iam_policy_document.readonly_role_policy[each.key].json

  tags = {
    Name        = "${each.value.environment}-policy-${local.project_name}-readonly-${var.environment_suffix}"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

########################
# IAM Role Policy Attachments
########################
resource "aws_iam_role_policy_attachment" "application_policy_attachment" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  role       = aws_iam_role.application_role[each.value.environment].name
  policy_arn = aws_iam_policy.application_policy[each.key].arn
}

resource "aws_iam_role_policy_attachment" "audit_policy_attachment" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  role       = aws_iam_role.audit_role[each.value.environment].name
  policy_arn = aws_iam_policy.audit_policy[each.key].arn
}

resource "aws_iam_role_policy_attachment" "readonly_policy_attachment" {
  for_each = {
    for combo in setproduct(local.environments, local.regions) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  role       = aws_iam_role.readonly_role[each.value.environment].name
  policy_arn = aws_iam_policy.readonly_policy[each.key].arn
}

########################
# Outputs
########################
output "kms_key_ids" {
  description = "KMS key IDs for each environment and region"
  value = {
    for k, v in aws_kms_key.main : k => v.key_id
  }
}

output "kms_key_arns" {
  description = "KMS key ARNs for each environment and region"
  value = {
    for k, v in aws_kms_key.main : k => v.arn
  }
}

output "application_log_group_names" {
  description = "CloudWatch Log Group names for application logs"
  value = {
    for k, v in aws_cloudwatch_log_group.application_logs : k => v.name
  }
}

output "audit_log_group_names" {
  description = "CloudWatch Log Group names for audit logs"
  value = {
    for k, v in aws_cloudwatch_log_group.audit_logs : k => v.name
  }
}

output "application_role_arns" {
  description = "IAM application role ARNs"
  value = {
    for k, v in aws_iam_role.application_role : k => v.arn
  }
}

output "audit_role_arns" {
  description = "IAM audit role ARNs"
  value = {
    for k, v in aws_iam_role.audit_role : k => v.arn
  }
}

output "readonly_role_arns" {
  description = "IAM readonly role ARNs"
  value = {
    for k, v in aws_iam_role.readonly_role : k => v.arn
  }
}
```