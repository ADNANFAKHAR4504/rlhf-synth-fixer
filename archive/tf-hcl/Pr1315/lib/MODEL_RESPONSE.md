I'll create a complete, runnable Terraform package that meets all your requirements. This will be a modular security configuration for AWS Organizations with proper IAM foundations.

## Project Structure

```
security-configuration-as-code/
├── README.md
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tf
├── modules/
│   └── iam_baseline/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── policies/
│           ├── app_deploy_policy.json
│           ├── readonly_policy.json
│           ├── audit_policy.json
│           ├── cloudwatch_readonly_policy.json
│           ├── s3_upload_policy.json
│           └── cloudtrail_write_policy.json
```

## Root Module Files

### `terraform.tf`

```hcl
terraform {
  required_version = ">= 0.14"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

### `variables.tf`

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "account_id" {
  description = "Current AWS account ID"
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.account_id))
    error_message = "Account ID must be a 12-digit number."
  }
}

variable "trusted_account_ids" {
  description = "List of AWS account IDs that can assume roles"
  type        = list(string)
  default     = ["111111111111", "222222222222"]
}

variable "log_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  type        = string
}

variable "app_s3_bucket_name" {
  description = "Name of the S3 bucket for application uploads"
  type        = string
}

variable "notification_email" {
  description = "Email address for IAM change notifications"
  type        = string
}

variable "organization_id" {
  description = "AWS Organization ID for CloudTrail configuration"
  type        = string
  default     = ""
}
```

### `main.tf`

```hcl
module "iam_baseline" {
  source = "./modules/iam_baseline"

  environment          = var.environment
  account_id          = var.account_id
  trusted_account_ids = var.trusted_account_ids
  log_bucket_name     = var.log_bucket_name
  app_s3_bucket_name  = var.app_s3_bucket_name
  notification_email  = var.notification_email
  organization_id     = var.organization_id
  aws_region          = var.aws_region
}
```

### `outputs.tf`

```hcl
output "iam_roles" {
  description = "Created IAM roles"
  value       = module.iam_baseline.iam_roles
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = module.iam_baseline.cloudtrail_arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for IAM notifications"
  value       = module.iam_baseline.sns_topic_arn
}

output "log_bucket_name" {
  description = "CloudTrail log bucket name"
  value       = module.iam_baseline.log_bucket_name
}
```

## IAM Baseline Module

### `modules/iam_baseline/variables.tf`

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "account_id" {
  description = "Current AWS account ID"
  type        = string
}

variable "trusted_account_ids" {
  description = "List of AWS account IDs that can assume roles"
  type        = list(string)
}

variable "log_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  type        = string
}

variable "app_s3_bucket_name" {
  description = "Name of the S3 bucket for application uploads"
  type        = string
}

variable "notification_email" {
  description = "Email address for IAM change notifications"
  type        = string
}

variable "organization_id" {
  description = "AWS Organization ID"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}
```

### `modules/iam_baseline/main.tf`

```hcl
# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for AWS partition
data "aws_partition" "current" {}

# Trust policy for cross-account role assumption
data "aws_iam_policy_document" "cross_account_trust" {
  statement {
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for account_id in var.trusted_account_ids : "arn:${data.aws_partition.current.partition}:iam::${account_id}:root"]
    }
    actions = ["sts:AssumeRole"]
    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = ["${var.environment}-cross-account"]
    }
  }
}

# IAM Policies from JSON files
data "local_file" "app_deploy_policy" {
  filename = "${path.module}/policies/app_deploy_policy.json"
}

data "local_file" "readonly_policy" {
  filename = "${path.module}/policies/readonly_policy.json"
}

data "local_file" "audit_policy" {
  filename = "${path.module}/policies/audit_policy.json"
}

data "local_file" "cloudwatch_readonly_policy" {
  filename = "${path.module}/policies/cloudwatch_readonly_policy.json"
}

data "local_file" "s3_upload_policy" {
  filename = "${path.module}/policies/s3_upload_policy.json"
}

data "local_file" "cloudtrail_write_policy" {
  filename = "${path.module}/policies/cloudtrail_write_policy.json"
}

# IAM Policies
resource "aws_iam_policy" "app_deploy_policy" {
  name        = "${var.environment}-app-deploy-policy"
  description = "Policy for application deployment operations"
  policy = templatefile("${path.module}/policies/app_deploy_policy.json", {
    account_id         = var.account_id
    app_s3_bucket_name = var.app_s3_bucket_name
    environment        = var.environment
  })

  tags = {
    Environment = var.environment
    Purpose     = "AppDeploy"
  }
}

resource "aws_iam_policy" "readonly_policy" {
  name        = "${var.environment}-readonly-policy"
  description = "Read-only access policy"
  policy      = data.local_file.readonly_policy.content

  tags = {
    Environment = var.environment
    Purpose     = "ReadOnly"
  }
}

resource "aws_iam_policy" "audit_policy" {
  name        = "${var.environment}-audit-policy"
  description = "Audit and compliance policy"
  policy = templatefile("${path.module}/policies/audit_policy.json", {
    account_id      = var.account_id
    log_bucket_name = var.log_bucket_name
  })

  tags = {
    Environment = var.environment
    Purpose     = "Audit"
  }
}

resource "aws_iam_policy" "cloudwatch_readonly_policy" {
  name        = "${var.environment}-cloudwatch-readonly-policy"
  description = "CloudWatch read-only access policy"
  policy      = data.local_file.cloudwatch_readonly_policy.content

  tags = {
    Environment = var.environment
    Purpose     = "CloudWatchReadOnly"
  }
}

resource "aws_iam_policy" "s3_upload_policy" {
  name        = "${var.environment}-s3-upload-policy"
  description = "S3 upload policy for specific bucket"
  policy = templatefile("${path.module}/policies/s3_upload_policy.json", {
    app_s3_bucket_name = var.app_s3_bucket_name
  })

  tags = {
    Environment = var.environment
    Purpose     = "S3Upload"
  }
}

resource "aws_iam_policy" "cloudtrail_write_policy" {
  name        = "${var.environment}-cloudtrail-write-policy"
  description = "CloudTrail write policy for centralized logging"
  policy = templatefile("${path.module}/policies/cloudtrail_write_policy.json", {
    log_bucket_name = var.log_bucket_name
    account_id      = var.account_id
  })

  tags = {
    Environment = var.environment
    Purpose     = "CloudTrailWrite"
  }
}

# IAM Roles
resource "aws_iam_role" "app_deploy_role" {
  name               = "${var.environment}-AppDeployRole"
  description        = "Role for application deployment with least privilege access"
  assume_role_policy = data.aws_iam_policy_document.cross_account_trust.json
  max_session_duration = 3600

  tags = {
    Environment = var.environment
    Purpose     = "AppDeploy"
  }
}

resource "aws_iam_role" "readonly_role" {
  name               = "${var.environment}-ReadOnlyRole"
  description        = "Role for read-only access across AWS services"
  assume_role_policy = data.aws_iam_policy_document.cross_account_trust.json
  max_session_duration = 3600

  tags = {
    Environment = var.environment
    Purpose     = "ReadOnly"
  }
}

resource "aws_iam_role" "audit_role" {
  name               = "${var.environment}-AuditRole"
  description        = "Role for audit and compliance activities"
  assume_role_policy = data.aws_iam_policy_document.cross_account_trust.json
  max_session_duration = 3600

  tags = {
    Environment = var.environment
    Purpose     = "Audit"
  }
}

# Policy Attachments
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

# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = var.log_bucket_name
  force_destroy = false

  tags = {
    Environment = var.environment
    Purpose     = "CloudTrailLogs"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "cloudtrail_logs_encryption" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
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
      values   = ["arn:${data.aws_partition.current.partition}:cloudtrail:${var.aws_region}:${var.account_id}:trail/${var.environment}-security-trail"]
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
      values   = ["arn:${data.aws_partition.current.partition}:cloudtrail:${var.aws_region}:${var.account_id}:trail/${var.environment}-security-trail"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

# SNS Topic for IAM notifications
resource "aws_sns_topic" "iam_notifications" {
  name = "${var.environment}-iam-notifications"

  tags = {
    Environment = var.environment
    Purpose     = "IAMNotifications"
  }
}

resource "aws_sns_topic_subscription" "iam_email_notification" {
  topic_arn = aws_sns_topic.iam_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  name              = "/aws/cloudtrail/${var.environment}-security-trail"
  retention_in_days = 90

  tags = {
    Environment = var.environment
    Purpose     = "CloudTrailLogs"
  }
}

# IAM Role for CloudTrail to write to CloudWatch Logs
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

  tags = {
    Environment = var.environment
    Purpose     = "CloudTrailCloudWatch"
  }
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_policy" {
  name = "${var.environment}-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Actions = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resources = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "security_trail" {
  name           = "${var.environment}-security-trail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:${data.aws_partition.current.partition}:s3:::*/*"]
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch_role.arn

  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  tags = {
    Environment = var.environment
    Purpose     = "SecurityAudit"
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs_policy]
}

# EventBridge Rule for IAM changes
resource "aws_cloudwatch_event_rule" "iam_changes" {
  name        = "${var.environment}-iam-changes"
  description = "Capture IAM changes"

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
        "DeleteRolePolicy"
      ]
    }
  })

  tags = {
    Environment = var.environment
    Purpose     = "IAMMonitoring"
  }
}

resource "aws_cloudwatch_event_target" "iam_changes_sns" {
  rule      = aws_cloudwatch_event_rule.iam_changes.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.iam_notifications.arn
}

# SNS Topic Policy to allow EventBridge to publish
resource "aws_sns_topic_policy" "iam_notifications_policy" {
  arn = aws_sns_topic.iam_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.iam_notifications.arn
      }
    ]
  })
}
```

### `modules/iam_baseline/outputs.tf`

```hcl
output "iam_roles" {
  description = "Map of created IAM roles"
  value = {
    app_deploy_role = {
      name = aws_iam_role.app_deploy_role.name
      arn  = aws_iam_role.app_deploy_role.arn
    }
    readonly_role = {
      name = aws_iam_role.readonly_role.name
      arn  = aws_iam_role.readonly_role.arn
    }
    audit_role = {
      name = aws_iam_role.audit_role.name
      arn  = aws_iam_role.audit_role.arn
    }
  }
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.security_trail.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = aws_sns_topic.iam_notifications.arn
}

output "log_bucket_name" {
  description = "CloudTrail log bucket name"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}
```

## Policy Documents

### `modules/iam_baseline/policies/app_deploy_policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2DeploymentAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeImages",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs",
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:CreateTags"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": ["us-east-1", "us-west-2"]
        }
      }
    },
    {
      "Sid": "ECSDeploymentAccess",
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeClusters",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:CreateService",
        "ecs:DeleteService"
      ],
      "Resource": [
        "arn:aws:ecs:*:${account_id}:cluster/${environment}-*",
        "arn:aws:ecs:*:${account_id}:service/${environment}-*/*",
        "arn:aws:ecs:*:${account_id}:task-definition/${environment}-*:*"
      ]
    },
    {
      "Sid": "IAMPassRoleForDeployment",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::${account_id}:role/${environment}-*",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": [
            "ec2.amazonaws.com",
            "ecs-tasks.amazonaws.com"
          ]
        }
      }
    }
  ]
}
```

### `modules/iam_baseline/policies/readonly_policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnlyAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "s3:GetObject",
        "s3:ListBucket",
        "rds:Describe*",
        "lambda:GetFunction",
        "lambda:ListFunctions",
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:ListRoles",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DenyDestructiveActions",
      "Effect": "Deny",
      "Action": ["*:Delete*", "*:Terminate*", "*:Remove*", "*:Detach*"],
      "Resource": "*"
    }
  ]
}
```

### `modules/iam_baseline/policies/audit_policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuditReadAccess",
      "Effect": "Allow",
      "Action": [
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
        "iam:GetAccountSummary"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudTrailLogAccess",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::${log_bucket_name}",
        "arn:aws:s3:::${log_bucket_name}/*"
      ]
    }
  ]
}
```

### `modules/iam_baseline/policies/cloudwatch_readonly_policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchReadOnlyAccess",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:DescribeAlarms",
        "cloudwatch:DescribeAlarmsForMetric",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "logs:FilterLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### `modules/iam_baseline/policies/s3_upload_policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3UploadAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::${app_s3_bucket_name}/*"
    },
    {
      "Sid": "S3BucketListAccess",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "arn:aws:s3:::${app_s3_bucket_name}"
    }
  ]
}
```

### `modules/iam_baseline/policies/cloudtrail_write_policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudTrailLogDelivery",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetBucketAcl"],
      "Resource": [
        "arn:aws:s3:::${log_bucket_name}",
        "arn:aws:s3:::${log_bucket_name}/*"
      ]
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:${account_id}:log-group:/aws/cloudtrail/*"
    }
  ]
}
```

## README.md

```markdown
# Security Configuration as Code

A comprehensive Terraform module for establishing IAM foundations and security baselines in AWS Organizations accounts.

## Overview

This module creates a standardized security configuration that includes:

- Three IAM roles following least-privilege principles
- Comprehensive CloudTrail logging with S3 storage
- SNS notifications for IAM changes
- Modular design for reusability across environments

## Architecture
```

┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ AppDeploy │ │ ReadOnly │ │ Audit │
│ Role │ │ Role │ │ Role │
└─────────────────┘ └──────────────────┘ └─────────────────┘
│ │ │
▼ ▼ ▼
┌─────────────────────────────────────────────────────────────────┐
│ IAM Policies │
│ • App Deployment • CloudWatch RO • Audit Access │
│ • S3 Upload • General RO • CloudTrail Write │
└─────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ Audit & Logging │
│ • CloudTrail (All Events) • S3 Versioned Bucket │
│ • CloudWatch Logs • SNS Notifications │
└─────────────────────────────────────────────────────────────────┘

````

## Features

### IAM Roles
- **AppDeployRole**: EC2/ECS deployment with restricted permissions
- **ReadOnlyRole**: Read-only access across AWS services
- **AuditRole**: Compliance and audit access with CloudTrail log reading

### Security & Compliance
- ✅ Least privilege IAM policies
- ✅ Cross-account role assumption with external ID
- ✅ CloudTrail logging all management and data events
- ✅ S3 bucket versioning and encryption
- ✅ Real-time IAM change notifications
- ✅ CloudWatch Logs integration

### Modularity
- Reusable child module (`iam_baseline`)
- Environment-specific configurations
- Parameterized trusted account IDs
- Separate JSON policy documents

## Usage

### Basic Usage

```hcl
module "security_baseline" {
  source = "./modules/iam_baseline"

  environment          = "prod"
  account_id          = "123456789012"
  trusted_account_ids = ["
````
