```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  environments = ["production", "staging"]
  regions = {
    "us-east-1" = "us_east_1"
    "us-west-2" = "us_west_2"
  }
  project_name = "secure-infra"
}

resource "aws_kms_key" "main" {
  for_each = {
    for combo in setproduct(local.environments, keys(local.regions)) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
      alias       = local.regions[combo[1]]
    }
  }

  provider                = aws[each.value.alias]
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
    Name        = "${each.value.environment}-kms-${local.project_name}"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

resource "aws_kms_alias" "main" {
  for_each = aws_kms_key.main

  provider      = aws[each.value.alias]
  name          = "alias/${each.value.environment}-${local.project_name}-${each.value.region}"
  target_key_id = each.value.key_id
}

resource "aws_cloudwatch_log_group" "application_logs" {
  for_each = {
    for combo in setproduct(local.environments, keys(local.regions)) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
      alias       = local.regions[combo[1]]
    }
  }

  provider          = aws[each.value.alias]
  name              = "/aws/application/${each.value.environment}-logs-${local.project_name}"
  retention_in_days = each.value.environment == "production" ? 365 : 30
  kms_key_id        = aws_kms_key.main[each.key].arn

  tags = {
    Name        = "${each.value.environment}-logs-${local.project_name}"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

resource "aws_cloudwatch_log_group" "audit_logs" {
  for_each = {
    for combo in setproduct(local.environments, keys(local.regions)) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
      alias       = local.regions[combo[1]]
    }
  }

  provider          = aws[each.value.alias]
  name              = "/aws/audit/${each.value.environment}-audit-${local.project_name}"
  retention_in_days = each.value.environment == "production" ? 2557 : 90
  kms_key_id        = aws_kms_key.main[each.key].arn

  tags = {
    Name        = "${each.value.environment}-audit-${local.project_name}"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

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

data "aws_iam_policy_document" "application_role_policy" {
  for_each = {
    for combo in setproduct(local.environments, keys(local.regions)) :
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
    for combo in setproduct(local.environments, keys(local.regions)) :
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
    for combo in setproduct(local.environments, keys(local.regions)) :
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

resource "aws_iam_role" "application_role" {
  for_each = toset(local.environments)

  name               = "${each.key}-role-${local.project_name}-application"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json

  tags = {
    Name        = "${each.key}-role-${local.project_name}-application"
    Environment = each.key
  }
}

resource "aws_iam_role" "audit_role" {
  for_each = toset(local.environments)

  name               = "${each.key}-role-${local.project_name}-audit"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json

  tags = {
    Name        = "${each.key}-role-${local.project_name}-audit"
    Environment = each.key
  }
}

resource "aws_iam_role" "readonly_role" {
  for_each = toset(local.environments)

  name               = "${each.key}-role-${local.project_name}-readonly"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json

  tags = {
    Name        = "${each.key}-role-${local.project_name}-readonly"
    Environment = each.key
  }
}

resource "aws_iam_policy" "application_policy" {
  for_each = {
    for combo in setproduct(local.environments, keys(local.regions)) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  name   = "${each.value.environment}-policy-${local.project_name}-application-${each.value.region}"
  policy = data.aws_iam_policy_document.application_role_policy[each.key].json

  tags = {
    Name        = "${each.value.environment}-policy-${local.project_name}-application"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

resource "aws_iam_policy" "audit_policy" {
  for_each = {
    for combo in setproduct(local.environments, keys(local.regions)) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  name   = "${each.value.environment}-policy-${local.project_name}-audit-${each.value.region}"
  policy = data.aws_iam_policy_document.audit_role_policy[each.key].json

  tags = {
    Name        = "${each.value.environment}-policy-${local.project_name}-audit"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

resource "aws_iam_policy" "readonly_policy" {
  for_each = {
    for combo in setproduct(local.environments, keys(local.regions)) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  name   = "${each.value.environment}-policy-${local.project_name}-readonly-${each.value.region}"
  policy = data.aws_iam_policy_document.readonly_role_policy[each.key].json

  tags = {
    Name        = "${each.value.environment}-policy-${local.project_name}-readonly"
    Environment = each.value.environment
    Region      = each.value.region
  }
}

resource "aws_iam_role_policy_attachment" "application_policy_attachment" {
  for_each = {
    for combo in setproduct(local.environments, keys(local.regions)) :
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
    for combo in setproduct(local.environments, keys(local.regions)) :
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
    for combo in setproduct(local.environments, keys(local.regions)) :
    "${combo[0]}-${combo[1]}" => {
      environment = combo[0]
      region      = combo[1]
    }
  }

  role       = aws_iam_role.readonly_role[each.value.environment].name
  policy_arn = aws_iam_policy.readonly_policy[each.key].arn
}
```