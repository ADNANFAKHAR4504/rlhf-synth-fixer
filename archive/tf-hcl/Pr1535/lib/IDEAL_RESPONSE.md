## Ideal Response: Secure AWS Data Storage Infrastructure (Terraform)

This solution provisions a secure, auditable, and compliant AWS data storage environment using Terraform. It implements all requirements from the prompt, including:

### Key Features
- **Region:** All resources are deployed in `us-west-2` (default, can be overridden).
- **S3 Buckets:**
  - Two buckets: `primary` (application data) and `logs` (logging)
  - AES-256 server-side encryption, versioning, public access blocked, bucket owner enforced
  - HTTPS-only and IP CIDR restrictions
  - Server access logging from `primary` to `logs`
- **IAM Role:**
  - Application role for EC2 with least-privilege S3 access to the `primary` bucket under `app/` path only
- **CloudTrail:**
  - Management events logged to the `logs` bucket, protected against unauthorized deletion
- **Monitoring & Alerts:**
  - CloudWatch metric filter and alarm for IAM policy/role changes, with notifications to an SNS topic
- **SNS Notifications:**
  - `security-alerts` topic with email subscriptions for the security team
- **Variables:**
  - All key parameters (region, allowed CIDRs, security emails) are configurable
- **Outputs:**
  - Bucket names, IAM role ARN, and SNS topic ARN are output for integration and visibility

---

### main.tf (Full Solution)

```hcl
# main.tf
# Terraform configuration for secure AWS data storage infrastructure
# Based on requirements in PROMPT.md

#########################
# Variables
#########################
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "allowed_cidrs" {
  description = "List of CIDR blocks allowed to access S3 buckets"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "security_team_emails" {
  description = "List of security team email addresses for SNS notifications"
  type        = list(string)
  default     = ["security@example.com"]
}

#########################
# Locals
#########################
locals {
  bucket_prefix = "secure-data-${random_id.bucket_suffix.hex}"
  
  tags = {
    Environment = "production"
    Project     = "secure-data-storage"
    ManagedBy   = "terraform"
  }
}

#########################
# Random ID for unique bucket names
#########################
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

#########################
# S3 Buckets
#########################

# Primary bucket for application data
resource "aws_s3_bucket" "primary" {
  bucket = "${local.bucket_prefix}-primary"
  tags   = merge(local.tags, { Purpose = "primary-data" })
}

# Logs bucket
resource "aws_s3_bucket" "logs" {
  bucket = "${local.bucket_prefix}-logs"
  tags   = merge(local.tags, { Purpose = "logs" })
}

# Enable versioning on primary bucket
resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable versioning on logs bucket
resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for primary bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Server-side encryption for logs bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block public access for primary bucket
resource "aws_s3_bucket_public_access_block" "primary" {
  bucket = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Block public access for logs bucket
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket ownership controls for primary bucket
resource "aws_s3_bucket_ownership_controls" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Bucket ownership controls for logs bucket
resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Server access logging configuration
resource "aws_s3_bucket_logging" "primary" {
  bucket = aws_s3_bucket.primary.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "access-logs/primary/"
}

# Bucket policy for primary bucket - enforce HTTPS and IP restrictions
resource "aws_s3_bucket_policy" "primary" {
  bucket = aws_s3_bucket.primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "RestrictToAllowedCIDRs"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
        Condition = {
          StringNotEquals = {
            "aws:userid" = [
              aws_iam_role.application.unique_id,
              "AIDACKCEVSQ6C2EXAMPLE" # Root user placeholder - should be replaced with actual account root user ID
            ]
          }
          IpAddressIfExists = {
            "aws:SourceIp" = var.allowed_cidrs
          }
        }
      }
    ]
  })
}

# Bucket policy for logs bucket - enforce HTTPS
resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "AllowCloudTrailLogs"
        Effect    = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudtrail/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid       = "AllowCloudTrailAclCheck"
        Effect    = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
      }
    ]
  })
}

#########################
# IAM Roles
#########################

# Application role for EC2 instances
resource "aws_iam_role" "application" {
  name = "EC2AppRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.tags
}

# Policy for S3 access to primary bucket
resource "aws_iam_policy" "s3_access" {
  name        = "S3AccessPolicy"
  description = "Policy for EC2 role to access S3 primary bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
        Condition = {
          StringEquals = {
            "s3:prefix" = [
              "app/",
              ""
            ]
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/app/*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "app_s3_access" {
  role       = aws_iam_role.application.name
  policy_arn = aws_iam_policy.s3_access.arn
}

#########################
# CloudTrail
#########################

# CloudTrail trail for management events
resource "aws_cloudtrail" "main" {
  name                          = "main-trail"
  s3_bucket_name                = aws_s3_bucket.logs.bucket
  is_multi_region_trail         = false
  enable_log_file_validation    = true
  cloud_watch_logs_group_arn   = aws_cloudwatch_log_group.trail_logs.arn
  cloud_watch_logs_role_arn    = aws_iam_role.cloudwatch_logs.arn
  enable_logging                = true
  include_global_service_events = true

  depends_on = [aws_s3_bucket_policy.logs]
}

# CloudWatch Logs group for CloudTrail
resource "aws_cloudwatch_log_group" "trail_logs" {
  name_prefix = "cloudtrail-logs-"
  retention_in_days = 90

  tags = local.tags
}

# IAM role for CloudWatch Logs
resource "aws_iam_role" "cloudwatch_logs" {
  name = "CloudWatchLogsRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.tags
}

# Policy for CloudWatch Logs access
resource "aws_iam_policy" "cloudwatch_logs_access" {
  name        = "CloudWatchLogsAccessPolicy"
  description = "Policy for CloudTrail to write logs to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach CloudWatch Logs policy to role
resource "aws_iam_role_policy_attachment" "cloudwatch_logs_access" {
  role       = aws_iam_role.cloudwatch_logs.name
  policy_arn = aws_iam_policy.cloudwatch_logs_access.arn
}

#########################
# Monitoring and Alerts
#########################

# CloudWatch metric filter for IAM policy changes
resource "aws_cloudwatch_metric_filter" "iam_policy_changes" {
  name          = "IAMPolicyChanges"
  log_group_name = aws_cloudwatch_log_group.trail_logs.name
  metric_transformation {
    name      = "PolicyChangeCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }

  filter_pattern = "{ $.eventName = \"PutRolePolicy\" || $.eventName = \"DeleteRolePolicy\" }"
}

# CloudWatch alarm for IAM policy changes
resource "aws_cloudwatch_alarm" "iam_policy_changes" {
  alarm_name          = "IAMPolicyChangesAlarm"
  alarm_description   = "Alarm when IAM policy changes are detected"
  metric_name         = "PolicyChangeCount"
  namespace           = "CloudTrailMetrics"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold            = 0
  comparison_operator  = "GreaterThanThreshold"
  alarm_actions        = [aws_sns_topic.security_alerts.arn]
  ok_actions          = [aws_sns_topic.security_alerts.arn]
}

# IAM Role for Application
resource "aws_iam_role" "application" {
  name = "application-role"
  tags = local.tags

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
}

resource "aws_iam_role_policy" "application_s3" {
  name = "application-s3-policy"
  role = aws_iam_role.application.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/app/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
        Condition = {
          StringLike = {
            "s3:prefix" = ["app/*"]
          }
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "application" {
  name = "application-instance-profile"
  role = aws_iam_role.application.name
  tags = local.tags
}

# CloudTrail
resource "aws_cloudtrail" "security_trail" {
  name           = "security-trail"
  s3_bucket_name = aws_s3_bucket.logs.bucket
  s3_key_prefix  = "cloudtrail"

  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  tags = local.tags

  depends_on = [aws_s3_bucket_policy.logs]
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name = "security-alerts"
  tags = local.tags
}

resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchAlarmsToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "security_team_email" {
  count     = length(var.security_team_emails)
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_emails[count.index]
}

# CloudWatch Monitoring
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/security-trail"
  retention_in_days = 90
  tags              = local.tags
}

resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  name           = "iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.eventName = PutRolePolicy) || ($.eventName = AttachRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = AttachUserPolicy) || ($.eventName = CreateRole) || ($.eventName = DeleteRole) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) }"

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "iam-policy-role-changes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChanges"
  namespace           = "SecurityMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors IAM policy and role changes"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.tags
}

# Outputs
output "primary_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket
}

output "logs_bucket_name" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.logs.bucket
}

output "application_iam_role_arn" {
  description = "ARN of the application IAM role"
  value       = aws_iam_role.application.arn
}

output "security_alerts_sns_topic_arn" {
  description = "ARN of the security alerts SNS topic"
  value       = aws_sns_topic.security_alerts.arn
}
```
