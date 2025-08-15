# main.tf - Single file IAM Security Configuration as Code
# All variables, locals, resources, and outputs in one file per team standards

########################
# Variables
########################

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

# account_id is now automatically retrieved via data source - no variable needed

variable "trusted_account_ids" {
  description = "List of AWS account IDs that can assume roles"
  type        = list(string)
  default     = []  # Will use current account if empty
}

variable "log_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  type        = string
  default     = "iac-cloudtrail-logs-dev-default"
}

variable "app_s3_bucket_name" {
  description = "Name of the S3 bucket for application uploads"
  type        = string
  default     = "iac-app-uploads-dev-default"
}

variable "notification_email" {
  description = "Email address for IAM change notifications"
  type        = string
  default     = "devops@example.com"
}

variable "organization_id" {
  description = "AWS Organization ID for CloudTrail configuration"
  type        = string
  default     = ""
}

variable "cloudtrail_enable_data_events" {
  description = "Enable data events in CloudTrail"
  type        = bool
  default     = true
}

variable "cloudtrail_retention_days" {
  description = "Number of days to retain CloudWatch logs for CloudTrail"
  type        = number
  default     = 90
}

variable "enable_sns_notifications" {
  description = "Enable SNS notifications for IAM changes"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

########################
# Locals
########################

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  
  # Use current account if trusted_account_ids is empty
  trusted_accounts = length(var.trusted_account_ids) > 0 ? var.trusted_account_ids : [local.account_id]
  
  # Create unique bucket names by appending random suffix to defaults
  log_bucket_name = "${var.log_bucket_name}-${random_id.bucket_suffix.hex}"
  app_bucket_name = "${var.app_s3_bucket_name}-${random_id.bucket_suffix.hex}"
  
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "SecurityConfigurationAsCode"
  })
}

########################
# Data Sources
########################

# Data source for current AWS account and partition
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}





# Trust policy for cross-account role assumption
data "aws_iam_policy_document" "cross_account_trust" {
  statement {
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for account_id in local.trusted_accounts : "arn:${data.aws_partition.current.partition}:iam::${account_id}:root"]
    }
    actions = ["sts:AssumeRole"]
    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = ["${var.environment}-cross-account"]
    }
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
  }
}

# App Deploy Policy - Least privilege for application deployment
data "aws_iam_policy_document" "app_deploy_policy" {
  statement {
    sid    = "EC2DeploymentAccess"
    effect = "Allow"
    actions = [
      "ec2:DescribeInstances",
      "ec2:DescribeImages",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSubnets",
      "ec2:DescribeVpcs",
      "ec2:DescribeKeyPairs",
      "ec2:RunInstances",
      "ec2:TerminateInstances",
      "ec2:StartInstances",
      "ec2:StopInstances",
      "ec2:CreateTags"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }

  statement {
    sid    = "ECSDeploymentAccess"
    effect = "Allow"
    actions = [
      "ecs:DescribeClusters",
      "ecs:DescribeServices",
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
      "ecs:UpdateService",
      "ecs:CreateService",
      "ecs:DeleteService"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:ecs:*:${local.account_id}:cluster/${var.environment}-*",
      "arn:${data.aws_partition.current.partition}:ecs:*:${local.account_id}:service/${var.environment}-*/*",
      "arn:${data.aws_partition.current.partition}:ecs:*:${local.account_id}:task-definition/${var.environment}-*:*"
    ]
  }

  statement {
    sid       = "IAMPassRoleForDeployment"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = ["arn:${data.aws_partition.current.partition}:iam::${local.account_id}:role/${var.environment}-*"]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values = [
        "ec2.amazonaws.com",
        "ecs-tasks.amazonaws.com"
      ]
    }
  }
}

# Read-only policy with explicit deny for destructive actions
data "aws_iam_policy_document" "readonly_policy" {
  statement {
    sid    = "ReadOnlyAccess"
    effect = "Allow"
    actions = [
      "ec2:Describe*",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:GetBucketLocation",
      "rds:Describe*",
      "lambda:GetFunction",
      "lambda:ListFunctions",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListRoles",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies",
      "iam:GetAccountSummary"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "DenyDestructiveActions"
    effect = "Deny"
    actions = [
      "ec2:TerminateInstances",
      "ec2:StopInstances",
      "rds:DeleteDBInstance",
      "rds:DeleteDBCluster",
      "s3:DeleteBucket",
      "s3:DeleteObject",
      "iam:DeleteRole",
      "iam:DeleteUser",
      "iam:DeletePolicy",
      "lambda:DeleteFunction"
    ]
    resources = ["*"]
  }
}

# Audit policy for compliance and security auditing
data "aws_iam_policy_document" "audit_policy" {
  statement {
    sid    = "AuditReadAccess"
    effect = "Allow"
    actions = [
      "cloudtrail:DescribeTrails",
      "cloudtrail:GetTrailStatus",
      "cloudtrail:LookupEvents",
      "config:GetConfigurationRecorder",
      "config:GetDeliveryChannel",
      "config:GetComplianceDetailsByConfigRule",
      "iam:GenerateCredentialReport",
      "iam:GetCredentialReport",
      "iam:ListUsers",
      "iam:ListRoles",
      "iam:ListPolicies",
      "iam:GetAccountSummary",
      "iam:GetAccountPasswordPolicy",
      "iam:ListAccessKeys",
      "iam:GetAccessKeyLastUsed"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudTrailLogAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::${local.log_bucket_name}",
      "arn:${data.aws_partition.current.partition}:s3:::${local.log_bucket_name}/*"
    ]
  }
}

# CloudWatch read-only policy
data "aws_iam_policy_document" "cloudwatch_readonly_policy" {
  statement {
    sid    = "CloudWatchReadOnlyAccess"
    effect = "Allow"
    actions = [
      "cloudwatch:DescribeAlarms",
      "cloudwatch:DescribeAlarmsForMetric",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:GetMetricData",
      "cloudwatch:ListMetrics",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
      "logs:StartQuery",
      "logs:StopQuery",
      "logs:GetQueryResults"
    ]
    resources = ["*"]
  }
}

# S3 upload policy for specific bucket
data "aws_iam_policy_document" "s3_upload_policy" {
  statement {
    sid    = "S3UploadAccess"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:DeleteObject"
    ]
    resources = ["arn:${data.aws_partition.current.partition}:s3:::${local.app_bucket_name}/*"]
  }

  statement {
    sid    = "S3BucketListAccess"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]
    resources = ["arn:${data.aws_partition.current.partition}:s3:::${local.app_bucket_name}"]
  }
}

# CloudTrail write policy for centralized logging
data "aws_iam_policy_document" "cloudtrail_write_policy" {
  statement {
    sid    = "CloudTrailLogDelivery"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetBucketAcl"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::${local.log_bucket_name}",
      "arn:${data.aws_partition.current.partition}:s3:::${local.log_bucket_name}/*"
    ]
  }

  statement {
    sid    = "CloudWatchLogsAccess"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:${data.aws_partition.current.partition}:logs:*:${local.account_id}:log-group:/aws/cloudtrail/*"]
  }
}

# S3 Bucket Policy for CloudTrail
data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail_logs.arn]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:${data.aws_partition.current.partition}:cloudtrail:${var.aws_region}:${local.account_id}:trail/${var.environment}-security-trail"]
    }
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail_logs.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:${data.aws_partition.current.partition}:cloudtrail:${var.aws_region}:${local.account_id}:trail/${var.environment}-security-trail"]
    }
  }
}

########################
# IAM Policies
########################

resource "aws_iam_policy" "app_deploy_policy" {
  name        = "${var.environment}-app-deploy-policy"
  description = "Policy for application deployment operations with least privilege"
  policy      = data.aws_iam_policy_document.app_deploy_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "readonly_policy" {
  name        = "${var.environment}-readonly-policy"
  description = "Read-only access policy with explicit deny for destructive actions"
  policy      = data.aws_iam_policy_document.readonly_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "audit_policy" {
  name        = "${var.environment}-audit-policy"
  description = "Audit and compliance policy for security monitoring"
  policy      = data.aws_iam_policy_document.audit_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "cloudwatch_readonly_policy" {
  name        = "${var.environment}-cloudwatch-readonly-policy"
  description = "CloudWatch read-only access policy for monitoring"
  policy      = data.aws_iam_policy_document.cloudwatch_readonly_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "s3_upload_policy" {
  name        = "${var.environment}-s3-upload-policy"
  description = "S3 upload policy for specific application bucket"
  policy      = data.aws_iam_policy_document.s3_upload_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "cloudtrail_write_policy" {
  name        = "${var.environment}-cloudtrail-write-policy"
  description = "CloudTrail write policy for centralized logging"
  policy      = data.aws_iam_policy_document.cloudtrail_write_policy.json

  tags = local.common_tags
}

########################
# IAM Roles
########################

resource "aws_iam_role" "app_deploy_role" {
  name                 = "${var.environment}-AppDeployRole"
  description          = "Role for application deployment with least privilege access"
  assume_role_policy   = data.aws_iam_policy_document.cross_account_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    Purpose = "AppDeploy"
  })
}

resource "aws_iam_role" "readonly_role" {
  name                 = "${var.environment}-ReadOnlyRole"
  description          = "Role for read-only access across AWS services"
  assume_role_policy   = data.aws_iam_policy_document.cross_account_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    Purpose = "ReadOnly"
  })
}

resource "aws_iam_role" "audit_role" {
  name                 = "${var.environment}-AuditRole"
  description          = "Role for audit and compliance activities"
  assume_role_policy   = data.aws_iam_policy_document.cross_account_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    Purpose = "Audit"
  })
}

########################
# Policy Attachments
########################

resource "aws_iam_role_policy_attachment" "app_deploy_policy_attachment" {
  role       = aws_iam_role.app_deploy_role.name
  policy_arn = aws_iam_policy.app_deploy_policy.arn
}

resource "aws_iam_role_policy_attachment" "app_deploy_s3_upload_attachment" {
  role       = aws_iam_role.app_deploy_role.name
  policy_arn = aws_iam_policy.s3_upload_policy.arn
}

resource "aws_iam_role_policy_attachment" "readonly_policy_attachment" {
  role       = aws_iam_role.readonly_role.name
  policy_arn = aws_iam_policy.readonly_policy.arn
}

resource "aws_iam_role_policy_attachment" "readonly_cloudwatch_attachment" {
  role       = aws_iam_role.readonly_role.name
  policy_arn = aws_iam_policy.cloudwatch_readonly_policy.arn
}

resource "aws_iam_role_policy_attachment" "audit_policy_attachment" {
  role       = aws_iam_role.audit_role.name
  policy_arn = aws_iam_policy.audit_policy.arn
}

resource "aws_iam_role_policy_attachment" "audit_cloudtrail_attachment" {
  role       = aws_iam_role.audit_role.name
  policy_arn = aws_iam_policy.cloudtrail_write_policy.arn
}

########################
# S3 Resources
########################

resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = local.log_bucket_name
  force_destroy = false

  tags = merge(local.common_tags, {
    Purpose = "CloudTrailLogs"
  })
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_encryption" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

########################
# CloudWatch Resources
########################

resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  name              = "/aws/cloudtrail/${var.environment}-security-trail"
  retention_in_days = var.cloudtrail_retention_days

  tags = merge(local.common_tags, {
    Purpose = "CloudTrailLogs"
  })
}

########################
# CloudTrail IAM Role
########################

resource "aws_iam_role" "cloudtrail_cloudwatch_role" {
  name = "${var.environment}-cloudtrail-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Purpose = "CloudTrailCloudWatch"
  })
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_policy" {
  name = "${var.environment}-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
      }
    ]
  })
}

########################
# CloudTrail
########################

resource "aws_cloudtrail" "security_trail" {
  name           = "${var.environment}-security-trail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket

  # Management events
  event_selector {
    read_write_type           = "All"
    include_management_events = true

    # Data events (conditional)
    dynamic "data_resource" {
      for_each = var.cloudtrail_enable_data_events ? [1] : []
      content {
        type   = "AWS::S3::Object"
        values = ["arn:${data.aws_partition.current.partition}:s3:::*/*"]
      }
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch_role.arn

  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  tags = merge(local.common_tags, {
    Purpose = "SecurityAudit"
  })

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs_policy]
}

########################
# SNS and EventBridge (conditional)
########################

resource "aws_sns_topic" "iam_notifications" {
  count = var.enable_sns_notifications ? 1 : 0
  name  = "${var.environment}-iam-notifications"

  tags = merge(local.common_tags, {
    Purpose = "IAMNotifications"
  })
}

resource "aws_sns_topic_subscription" "iam_email_notification" {
  count     = var.enable_sns_notifications ? 1 : 0
  topic_arn = aws_sns_topic.iam_notifications[0].arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_cloudwatch_event_rule" "iam_changes" {
  count       = var.enable_sns_notifications ? 1 : 0
  name        = "${var.environment}-iam-changes"
  description = "Capture IAM changes for security monitoring"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName = [
        "CreateRole",
        "DeleteRole",
        "AttachRolePolicy",
        "DetachRolePolicy",
        "PutRolePolicy",
        "DeleteRolePolicy",
        "CreateUser",
        "DeleteUser",
        "AttachUserPolicy",
        "DetachUserPolicy"
      ]
    }
  })

  tags = merge(local.common_tags, {
    Purpose = "IAMMonitoring"
  })
}

resource "aws_cloudwatch_event_target" "iam_changes_sns" {
  count     = var.enable_sns_notifications ? 1 : 0
  rule      = aws_cloudwatch_event_rule.iam_changes[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.iam_notifications[0].arn
}

resource "aws_sns_topic_policy" "iam_notifications_policy" {
  count = var.enable_sns_notifications ? 1 : 0
  arn   = aws_sns_topic.iam_notifications[0].arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.iam_notifications[0].arn
      }
    ]
  })
}

########################
# Outputs
########################

output "iam_roles" {
  description = "Map of created IAM roles with their names and ARNs"
  value = {
    app_deploy_role = {
      name = aws_iam_role.app_deploy_role.name
      arn  = aws_iam_role.app_deploy_role.arn
      id   = aws_iam_role.app_deploy_role.id
    }
    readonly_role = {
      name = aws_iam_role.readonly_role.name
      arn  = aws_iam_role.readonly_role.arn
      id   = aws_iam_role.readonly_role.id
    }
    audit_role = {
      name = aws_iam_role.audit_role.name
      arn  = aws_iam_role.audit_role.arn
      id   = aws_iam_role.audit_role.id
    }
  }
}

output "iam_policies" {
  description = "Map of created IAM policies with their names and ARNs"
  value = {
    app_deploy_policy = {
      name = aws_iam_policy.app_deploy_policy.name
      arn  = aws_iam_policy.app_deploy_policy.arn
      id   = aws_iam_policy.app_deploy_policy.id
    }
    readonly_policy = {
      name = aws_iam_policy.readonly_policy.name
      arn  = aws_iam_policy.readonly_policy.arn
      id   = aws_iam_policy.readonly_policy.id
    }
    audit_policy = {
      name = aws_iam_policy.audit_policy.name
      arn  = aws_iam_policy.audit_policy.arn
      id   = aws_iam_policy.audit_policy.id
    }
    cloudwatch_readonly_policy = {
      name = aws_iam_policy.cloudwatch_readonly_policy.name
      arn  = aws_iam_policy.cloudwatch_readonly_policy.arn
      id   = aws_iam_policy.cloudwatch_readonly_policy.id
    }
    s3_upload_policy = {
      name = aws_iam_policy.s3_upload_policy.name
      arn  = aws_iam_policy.s3_upload_policy.arn
      id   = aws_iam_policy.s3_upload_policy.id
    }
    cloudtrail_write_policy = {
      name = aws_iam_policy.cloudtrail_write_policy.name
      arn  = aws_iam_policy.cloudtrail_write_policy.arn
      id   = aws_iam_policy.cloudtrail_write_policy.id
    }
  }
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail for security auditing"
  value       = aws_cloudtrail.security_trail.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail for security auditing"
  value       = aws_cloudtrail.security_trail.name
}

output "log_bucket_name" {
  description = "Name of the S3 bucket storing CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}

output "log_bucket_arn" {
  description = "ARN of the S3 bucket storing CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail_log_group.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail_log_group.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for IAM notifications (if enabled)"
  value       = var.enable_sns_notifications ? aws_sns_topic.iam_notifications[0].arn : null
}

output "sns_topic_name" {
  description = "Name of the SNS topic for IAM notifications (if enabled)"
  value       = var.enable_sns_notifications ? aws_sns_topic.iam_notifications[0].name : null
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge rule for IAM monitoring (if enabled)"
  value       = var.enable_sns_notifications ? aws_cloudwatch_event_rule.iam_changes[0].arn : null
}

output "cross_account_assume_role_commands" {
  description = "AWS CLI commands to assume the created roles from trusted accounts"
  value = {
    app_deploy_role = "aws sts assume-role --role-arn ${aws_iam_role.app_deploy_role.arn} --role-session-name AppDeploySession --external-id ${var.environment}-cross-account"
    readonly_role   = "aws sts assume-role --role-arn ${aws_iam_role.readonly_role.arn} --role-session-name ReadOnlySession --external-id ${var.environment}-cross-account"
    audit_role      = "aws sts assume-role --role-arn ${aws_iam_role.audit_role.arn} --role-session-name AuditSession --external-id ${var.environment}-cross-account"
  }
}

output "security_configuration_summary" {
  description = "Summary of the security configuration deployed"
  value = {
    environment         = var.environment
    account_id          = local.account_id
    trusted_accounts    = local.trusted_accounts
    roles_created       = 3
    policies_created    = 6
    cloudtrail_enabled  = true
    sns_notifications   = var.enable_sns_notifications
    data_events_logging = var.cloudtrail_enable_data_events
    log_retention_days  = var.cloudtrail_retention_days
  }
}