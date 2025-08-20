# Infrastructure as Code Solution

## Terraform Configuration Files


### main.tf

```hcl
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
  
  validation {
    condition     = alltrue([for id in var.trusted_account_ids : can(regex("^[0-9]{12}$", id))])
    error_message = "All account IDs must be 12-digit numbers."
  }
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
  
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notification_email))
    error_message = "Must be a valid email address format."
  }
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
  default     = 30  # Reduced from 90 days for cost optimization
  
  validation {
    condition     = var.cloudtrail_retention_days >= 1 && var.cloudtrail_retention_days <= 3653
    error_message = "Retention days must be between 1 and 3653 (10 years)."
  }
}

variable "enable_sns_notifications" {
  description = "Enable SNS notifications for IAM changes"
  type        = bool
  default     = true
}

variable "enable_aws_config" {
  description = "Enable AWS Config for compliance monitoring"
  type        = bool
  default     = false
}

variable "enable_guardduty" {
  description = "Enable GuardDuty for threat detection"
  type        = bool
  default     = false
}

variable "enable_cloudtrail_insights_monitoring" {
  description = "Enable CloudWatch alarms for CloudTrail Insights cost monitoring"
  type        = bool
  default     = false
}

variable "restricted_ip_ranges" {
  description = "List of IP CIDR ranges allowed to assume roles (empty for no restrictions)"
  type        = list(string)
  default     = []
  
  validation {
    condition     = alltrue([for ip in var.restricted_ip_ranges : can(cidrhost(ip, 0))])
    error_message = "All values must be valid CIDR notation (e.g., 10.0.0.0/16)."
  }
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
    # Add IP restriction if specified
    dynamic "condition" {
      for_each = length(var.restricted_ip_ranges) > 0 ? [1] : []
      content {
        test     = "IpAddress"
        variable = "aws:SourceIp"
        values   = var.restricted_ip_ranges
      }
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
      # EC2 destructive actions
      "ec2:TerminateInstances",
      "ec2:StopInstances",
      "ec2:DeleteInstance",
      "ec2:DeleteVolume",
      "ec2:DeleteSnapshot",
      "ec2:DeleteSecurityGroup",
      "ec2:DeleteSubnet",
      "ec2:DeleteVpc",
      # RDS destructive actions
      "rds:DeleteDBInstance",
      "rds:DeleteDBCluster",
      "rds:DeleteDBSubnetGroup",
      "rds:DeleteDBParameterGroup",
      # S3 destructive actions
      "s3:DeleteBucket",
      "s3:DeleteObject",
      "s3:DeleteBucketPolicy",
      # IAM destructive actions
      "iam:DeleteRole",
      "iam:DeleteUser",
      "iam:DeletePolicy",
      "iam:DeleteAccessKey",
      "iam:DeleteLoginProfile",
      # Lambda destructive actions
      "lambda:DeleteFunction",
      "lambda:DeleteEventSourceMapping",
      # CloudFormation destructive actions
      "cloudformation:DeleteStack",
      "cloudformation:DeleteChangeSet",
      # ECS destructive actions
      "ecs:DeleteCluster",
      "ecs:DeleteService",
      "ecs:DeleteTaskDefinition"
    ]
    resources = ["*"]
    condition {
      test     = "StringNotEquals"
      variable = "aws:PrincipalArn"
      values   = ["arn:${data.aws_partition.current.partition}:iam::${local.account_id}:role/${var.environment}-AdminRole"]
    }
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

# S3 upload policy for specific bucket - restricted permissions
data "aws_iam_policy_document" "s3_upload_policy" {
  statement {
    sid    = "S3UploadAccess"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject"
      # Removed s3:DeleteObject for security - use lifecycle policies instead
    ]
    resources = ["arn:${data.aws_partition.current.partition}:s3:::${local.app_bucket_name}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["private", "bucket-owner-full-control"]
    }
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

# S3 Lifecycle Policy for automated object management
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs_lifecycle" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "cloudtrail-logs-lifecycle"
    status = "Enabled"

    # Transition to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Transition to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete objects after 7 years (2555 days)
    expiration {
      days = 2555
    }

    # Delete incomplete multipart uploads after 7 days
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
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

    # Data events for our S3 buckets only (conditional)
    dynamic "data_resource" {
      for_each = var.cloudtrail_enable_data_events ? [1] : []
      content {
        type   = "AWS::S3::Object"
        values = [
          "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        ]
      }
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch_role.arn

  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  
  # Enable CloudTrail Insights for unusual activity detection
  insight_selector {
    insight_type = "ApiCallRateInsight"
  }
  
  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }
  
  # Enable CloudTrail Insights for cost optimization
  insight_selector {
    insight_type = "ApiCallVolumeInsight"
  }

  tags = merge(local.common_tags, {
    Purpose = "SecurityAudit"
  })

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs_policy]
}

########################
# CloudTrail Insights Cost Monitoring
########################

# CloudWatch Alarm for CloudTrail Insights API Call Volume
resource "aws_cloudwatch_metric_alarm" "cloudtrail_insights_volume" {
  count = var.enable_cloudtrail_insights_monitoring ? 1 : 0
  
  alarm_name          = "${var.environment}-cloudtrail-insights-volume"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "InsightRecordCount"
  namespace           = "AWS/CloudTrail"
  period              = 300
  statistic           = "Sum"
  threshold           = 1000  # Alert if more than 1000 insight records in 5 minutes
  alarm_description   = "CloudTrail Insights generating high volume of records"
  
  dimensions = {
    TrailName = aws_cloudtrail.security_trail.name
  }
  
  tags = merge(local.common_tags, {
    Purpose = "CostMonitoring"
  })
}

# CloudWatch Alarm for CloudTrail Insights Cost
resource "aws_cloudwatch_metric_alarm" "cloudtrail_insights_cost" {
  count = var.enable_cloudtrail_insights_monitoring ? 1 : 0
  
  alarm_name          = "${var.environment}-cloudtrail-insights-cost"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "EstimatedCost"
  namespace           = "AWS/CloudTrail"
  period              = 86400  # Daily cost monitoring
  statistic           = "Maximum"
  threshold           = 50     # Alert if daily cost exceeds $50
  alarm_description   = "CloudTrail Insights daily cost threshold exceeded"
  
  dimensions = {
    TrailName = aws_cloudtrail.security_trail.name
  }
  
  tags = merge(local.common_tags, {
    Purpose = "CostMonitoring"
  })
}

########################
# GuardDuty for Threat Detection
########################

# GuardDuty Detector
resource "aws_guardduty_detector" "threat_detector" {
  count = var.enable_guardduty ? 1 : 0
  
  enable = true
  
  tags = merge(local.common_tags, {
    Purpose = "ThreatDetection"
  })
}

# GuardDuty S3 Protection Feature
resource "aws_guardduty_detector_feature" "s3_protection" {
  count = var.enable_guardduty ? 1 : 0
  
  detector_id = aws_guardduty_detector.threat_detector[0].id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

# GuardDuty Malware Protection Feature
resource "aws_guardduty_detector_feature" "malware_protection" {
  count = var.enable_guardduty ? 1 : 0
  
  detector_id = aws_guardduty_detector.threat_detector[0].id
  name        = "MALWARE_PROTECTION"
  status      = "ENABLED"
}

# GuardDuty EKS Protection Feature
resource "aws_guardduty_detector_feature" "eks_protection" {
  count = var.enable_guardduty ? 1 : 0
  
  detector_id = aws_guardduty_detector.threat_detector[0].id
  name        = "EKS_AUDIT_LOGS"
  status      = "ENABLED"
}

########################
# AWS Config Rules for Compliance
########################

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "config_recorder" {
  count = var.enable_aws_config ? 1 : 0
  
  name     = "${var.environment}-config-recorder"
  role_arn = aws_iam_role.config_role[0].arn

  recording_group {
    all_supported = true
  }
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "config_delivery" {
  count = var.enable_aws_config ? 1 : 0
  
  name           = "${var.environment}-config-delivery"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket
  s3_key_prefix  = "config"
  
  depends_on = [aws_config_configuration_recorder.config_recorder]
}

# AWS Config IAM Role
resource "aws_iam_role" "config_role" {
  count = var.enable_aws_config ? 1 : 0
  
  name = "${var.environment}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Purpose = "AWSConfig"
  })
}

# AWS Config IAM Policy
resource "aws_iam_role_policy_attachment" "config_policy" {
  count = var.enable_aws_config ? 1 : 0  # Fixed: Use enable_aws_config instead of environment check
  
  role       = aws_iam_role.config_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
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

output "guardduty_detector_id" {
  description = "GuardDuty detector ID for threat detection (if enabled)"
  value       = var.enable_guardduty ? aws_guardduty_detector.threat_detector[0].id : null
}

output "guardduty_detector_arn" {
  description = "GuardDuty detector ARN for threat detection (if enabled)"
  value       = var.enable_guardduty ? aws_guardduty_detector.threat_detector[0].arn : null
}

output "cloudtrail_insights_monitoring" {
  description = "CloudTrail Insights cost monitoring alarms (if enabled)"
  value = var.enable_cloudtrail_insights_monitoring ? {
    volume_alarm_arn = aws_cloudwatch_metric_alarm.cloudtrail_insights_volume[0].arn
    cost_alarm_arn   = aws_cloudwatch_metric_alarm.cloudtrail_insights_cost[0].arn
  } : null
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
    aws_config_enabled  = var.enable_aws_config
    guardduty_enabled   = var.enable_guardduty
    ip_restrictions     = length(var.restricted_ip_ranges) > 0 ? var.restricted_ip_ranges : ["No restrictions"]
    cloudtrail_insights = true
    insights_monitoring = var.enable_cloudtrail_insights_monitoring
    lifecycle_policies  = true
  }
}
```


### provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 0.14"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }

  }

  # Partial backend config: values are injected at `terraform init` time
  # Recommended: Add DynamoDB table for state locking
  # backend "s3" {
  #   # bucket         = "terraform-state-bucket"
  #   # key            = "security-config/terraform.tfstate"
  #   # region         = "us-east-1"
  #   # dynamodb_table = "terraform-state-lock"
  #   # encrypt        = true
  # }
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "SecurityConfigurationAsCode"
    }
  }
}
```


### tap_stack.tf

```hcl
# tap_stack.tf - Main stack referencing the security configuration modules

# This file serves as the entry point and references the main IAM security configuration
# All actual resources are defined in main.tf, policies.tf, variables.tf, and outputs.tf

# Local reference to ensure all components are loaded
locals {
  stack_info = {
    name        = "security-iac-stack"
    description = "IAM Security Configuration as Code Stack"
    version     = "1.0.0"
  }
}

# Data source reference to validate the configuration exists
data "aws_caller_identity" "stack_current" {}
data "aws_region" "stack_current" {}

# Stack validation outputs
output "stack_validation" {
  description = "Stack validation information"
  value = {
    stack_name  = local.stack_info.name
    account_id  = data.aws_caller_identity.stack_current.account_id
    region      = data.aws_region.stack_current.name
    deployed_at = timestamp()
  }
}
```
