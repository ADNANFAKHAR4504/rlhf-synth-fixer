I'll create a comprehensive Terraform codebase that meets all your requirements. Here's the complete HCL implementation:

## Directory Structure
```
terraform/
├── modules/
│   ├── kms/
│   ├── s3/
│   ├── cloudfront/
│   ├── iam/
│   ├── monitoring/
│   └── logging/
├── environments/
│   ├── development/
│   ├── testing/
│   └── production/
├── variables.tf
└── outputs.tf
```

## Root Variables and Outputs

**variables.tf**
```hcl
# Root level variables for common configuration
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, testing, production)"
  type        = string
  validation {
    condition     = contains(["development", "testing", "production"], var.environment)
    error_message = "Environment must be development, testing, or production."
  }
}

variable "owner" {
  description = "Owner tag for all resources"
  type        = string
  default     = "infrastructure-team"
}

variable "purpose" {
  description = "Purpose tag for all resources"
  type        = string
  default     = "enterprise-web-application"
}

# Common tags applied to all resources
locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Purpose     = var.purpose
    ManagedBy   = "terraform"
  }
}
```

**outputs.tf**
```hcl
# Root level outputs
output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = module.kms.key_id
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}
```

## KMS Module

**modules/kms/main.tf**
```hcl
# KMS key for encrypting all data storage services
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} environment encryption"
  deletion_window_in_days = var.deletion_window_in_days
  enable_key_rotation     = true

  # Key policy allowing root account access and service usage
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
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

  tags = var.tags
}

# KMS key alias for easier reference
resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-${var.service}-${var.resource}"
  target_key_id = aws_kms_key.main.key_id
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}
```

**modules/kms/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "service" {
  description = "Service name for naming convention"
  type        = string
  default     = "security"
}

variable "resource" {
  description = "Resource name for naming convention"
  type        = string
  default     = "kms"
}

variable "deletion_window_in_days" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

**modules/kms/outputs.tf**
```hcl
output "key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}

output "key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "alias_name" {
  description = "KMS key alias name"
  value       = aws_kms_alias.main.name
}
```

## S3 Module

**modules/s3/main.tf**
```hcl
# S3 bucket with private access and KMS encryption
resource "aws_s3_bucket" "main" {
  bucket = "${var.environment}-${var.service}-${var.resource}"
  tags   = var.tags
}

# Block all public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for data protection
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configure default KMS encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Enable access logging
resource "aws_s3_bucket_logging" "main" {
  bucket = aws_s3_bucket.main.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "access-logs/"
}

# Separate bucket for access logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.environment}-${var.service}-access-logs"
  tags   = var.tags
}

# Block public access for access logs bucket
resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle configuration for access logs
resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

# Bucket policy for explicit access control
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.cloudfront_oai_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.main.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.main]
}
```

**modules/s3/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "service" {
  description = "Service name for naming convention"
  type        = string
  default     = "storage"
}

variable "resource" {
  description = "Resource name for naming convention"
  type        = string
  default     = "bucket"
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "cloudfront_oai_arn" {
  description = "CloudFront Origin Access Identity ARN"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

**modules/s3/outputs.tf**
```hcl
output "bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "access_logs_bucket_name" {
  description = "Access logs bucket name"
  value       = aws_s3_bucket.access_logs.bucket
}
```

## CloudFront Module

**modules/cloudfront/main.tf**
```hcl
# CloudFront Origin Access Identity for S3 access
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for ${var.environment} environment"
}

# CloudFront distribution with HTTPS-only access
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = var.s3_bucket_domain_name
    origin_id   = "S3-${var.s3_bucket_name}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "CloudFront distribution for ${var.environment} environment"

  # Enable logging
  logging_config {
    include_cookies = false
    bucket          = var.logging_bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  # Default cache behavior with HTTPS redirect
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.s3_bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Price class for cost optimization
  price_class = var.price_class

  # Geographic restrictions (if needed)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Use AWS managed certificate for HTTPS
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  # Security headers
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = var.tags
}
```

**modules/cloudfront/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "s3_bucket_domain_name" {
  description = "S3 bucket domain name"
  type        = string
}

variable "logging_bucket_domain_name" {
  description = "S3 logging bucket domain name"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

**modules/cloudfront/outputs.tf**
```hcl
output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "oai_arn" {
  description = "Origin Access Identity ARN"
  value       = aws_cloudfront_origin_access_identity.main.iam_arn
}
```

## IAM Module

**modules/iam/main.tf**
```hcl
# IAM role for application access with least privilege
resource "aws_iam_role" "app_role" {
  name = "${var.environment}-${var.service}-${var.resource}-role"

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

  tags = var.tags
}

# IAM policy for S3 read-only access
resource "aws_iam_policy" "s3_read_policy" {
  name        = "${var.environment}-${var.service}-s3-read-policy"
  description = "Policy for S3 read access in ${var.environment} environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${var.s3_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = var.s3_bucket_arn
      }
    ]
  })

  tags = var.tags
}

# IAM policy for CloudWatch logs
resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name        = "${var.environment}-${var.service}-cloudwatch-logs-policy"
  description = "Policy for CloudWatch logs access in ${var.environment} environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })

  tags = var.tags
}

# Attach policies to role
resource "aws_iam_role_policy_attachment" "s3_read_attachment" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs_attachment" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "app_profile" {
  name = "${var.environment}-${var.service}-${var.resource}-profile"
  role = aws_iam_role.app_role.name

  tags = var.tags
}

# IAM user for programmatic access (if needed)
resource "aws_iam_user" "app_user" {
  name = "${var.environment}-${var.service}-${var.resource}-user"
  path = "/"

  tags = var.tags
}

# Attach policies to user
resource "aws_iam_user_policy_attachment" "user_s3_read_attachment" {
  user       = aws_iam_user.app_user.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}
```

**modules/iam/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "service" {
  description = "Service name for naming convention"
  type        = string
  default     = "app"
}

variable "resource" {
  description = "Resource name for naming convention"
  type        = string
  default     = "access"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN for policy"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

**modules/iam/outputs.tf**
```hcl
output "role_arn" {
  description = "IAM role ARN"
  value       = aws_iam_role.app_role.arn
}

output "role_name" {
  description = "IAM role name"
  value       = aws_iam_role.app_role.name
}

output "instance_profile_name" {
  description = "IAM instance profile name"
  value       = aws_iam_instance_profile.app_profile.name
}

output "user_name" {
  description = "IAM user name"
  value       = aws_iam_user.app_user.name
}
```

## Monitoring Module

**modules/monitoring/main.tf**
```hcl
# CloudWatch log group for application logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/${var.environment}/${var.service}/${var.resource}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_arn

  tags = var.tags
}

# CloudWatch alarm for IAM policy modification attempts
resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  name           = "${var.environment}-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_logs.name
  pattern        = "{ ($.eventName = DeleteGroupPolicy) || ($.eventName = DeleteRolePolicy) || ($.eventName = DeleteUserPolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }"

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "Security/IAM"
    value     = "1"
  }
}

# CloudWatch log group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_logs" {
  name              = "/aws/cloudtrail/${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_arn

  tags = var.tags
}

# CloudWatch alarm for IAM policy changes
resource "aws_cloudwatch_metric_alarm" "iam_policy_changes_alarm" {
  alarm_name          = "${var.environment}-iam-policy-changes-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChanges"
  namespace           = "Security/IAM"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors IAM policy changes"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = var.tags
}

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name              = "${var.environment}-security-alerts"
  kms_master_key_id = var.kms_key_id

  tags = var.tags
}

# SNS topic policy
resource "aws_sns_topic_policy" "alerts_policy" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# SNS topic subscription (email)
resource "aws_sns_topic_subscription" "email_alerts" {
  count     = length(var.alert_email_addresses)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

# CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-infrastructure-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["Security/IAM", "IAMPolicyChanges"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "IAM Policy Changes"
          period  = 300
        }
      }
    ]
  })
}
```

**modules/monitoring/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "service" {
  description = "Service name for naming convention"
  type        = string
  default     = "app"
}

variable "resource" {
  description = "Resource name for naming convention"
  type        = string
  default     = "logs"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "alert_email_addresses" {
  description = "List of email addresses for alerts"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

**modules/monitoring/outputs.tf**
```hcl
output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}
```

## Logging Module

**modules/logging/main.tf**
```hcl
# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.environment}-${var.service}-cloudtrail-logs"
  tags   = var.tags
}

# Block public access for CloudTrail logs bucket
resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail logs bucket policy
resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.cloudtrail_logs]
}

# CloudTrail for API logging
resource "aws_cloudtrail" "main" {
  name           = "${var.environment}-${var.service}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket

  # Enable log file validation
  enable_log_file_validation = true

  # Include global service events
  include_global_service_events = true
  is_multi_region_trail         = true

  # Send logs to CloudWatch
  cloud_watch_logs_group_arn = "${var.cloudwatch_log_group_arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_logs_role.arn

  # Enable insights
  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  # Event selectors for data events
  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${var.s3_bucket_arn}/*"]
    }
  }

  tags = var.tags
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_logs_role" {
  name = "${var.environment}-cloudtrail-logs-role"

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

  tags = var.tags
}

# IAM policy for CloudTrail logs role
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "${var.environment}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail_logs_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}
```

**modules/logging/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "service" {
  description = "Service name for naming convention"
  type        = string
  default     = "security"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN for data events logging"
  type        = string
}

variable "cloudwatch_log_group_arn" {
  description = "CloudWatch log group ARN for CloudTrail"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

**modules/logging/outputs.tf**
```hcl
output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_logs_bucket_name" {
  description = "CloudTrail logs S3 bucket name"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}
```

## Environment Configurations

**environments/development/main.tf**
```hcl
# Development