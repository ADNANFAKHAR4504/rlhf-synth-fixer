### Reasoning Trace
---

The user wants a complete Terraform configuration for a small business backup solution with the following requirements:

1. S3 bucket as storage backbone
2. 500 users, daily backups of critical documents
3. 30-day lifecycle policy for cost control
4. AWS-managed KMS encryption
5. IAM-based access control with bucket policy
6. CloudWatch metrics and alarms
7. EventBridge for daily automated backups
8. Single file: tap_stack.tf
9. Region: us-west-2
10. No provider blocks
11. Use variables and locals for flexibility
12. Include outputs
13. Must be production-ready, secure, and cost-efficient

Let me create a comprehensive Terraform configuration that addresses all these requirements.
### Answer 
---

Here's a complete, production-ready Terraform configuration for your small business backup solution:

```hcl
# tap_stack.tf - Small Business Daily Backup Infrastructure
# Region: us-west-2
# Purpose: Automated, secure, and cost-efficient daily document backup system

# ============================================================================
# VARIABLES
# ============================================================================

variable "company_name" {
  description = "Company name used for resource naming"
  type        = string
  default     = "smallbiz"
}

variable "environment" {
  description = "Environment name (prod/staging/dev)"
  type        = string
  default     = "prod"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups before deletion"
  type        = number
  default     = 30
}

variable "backup_schedule" {
  description = "Cron expression for backup schedule"
  type        = string
  default     = "cron(0 2 * * ? *)" # Daily at 2 AM UTC
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops@example.com"
}

variable "allowed_backup_roles" {
  description = "List of IAM role ARNs allowed to write backups"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    ManagedBy   = "Terraform"
    Purpose     = "DailyBackup"
    CostCenter  = "IT-Operations"
  }
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  bucket_name = "${var.company_name}-${var.environment}-daily-backups-${data.aws_caller_identity.current.account_id}"
  
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      Company     = var.company_name
      Region      = "us-west-2"
    }
  )
  
  # Alarm thresholds
  alarm_thresholds = {
    bucket_size_gb           = 500  # Alert if bucket exceeds 500GB
    daily_requests          = 10000 # Alert if requests exceed 10k/day
    error_rate_percentage   = 5     # Alert if error rate exceeds 5%
  }
  
  # IAM principals for bucket access
  backup_principals = concat(
    var.allowed_backup_roles,
    [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${aws_iam_role.backup_lambda_role.name}"
    ]
  )
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# ============================================================================
# KMS KEY FOR ENCRYPTION
# ============================================================================

resource "aws_kms_key" "backup_encryption" {
  description             = "KMS key for ${var.company_name} daily backup encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.company_name}-backup-encryption-key"
    }
  )
}

resource "aws_kms_alias" "backup_encryption" {
  name          = "alias/${var.company_name}-backup-encryption"
  target_key_id = aws_kms_key.backup_encryption.key_id
}

# ============================================================================
# S3 BUCKET AND CONFIGURATION
# ============================================================================

resource "aws_s3_bucket" "backup_bucket" {
  bucket = local.bucket_name
  
  tags = merge(
    local.common_tags,
    {
      Name = local.bucket_name
    }
  )
}

resource "aws_s3_bucket_versioning" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.backup_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true # Reduces KMS API calls and costs
  }
}

resource "aws_s3_bucket_public_access_block" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  
  rule {
    id     = "delete-old-backups"
    status = "Enabled"
    
    expiration {
      days = var.backup_retention_days
    }
    
    noncurrent_version_expiration {
      noncurrent_days = 7
    }
    
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
  
  rule {
    id     = "transition-to-glacier"
    status = "Enabled"
    
    transition {
      days          = 7
      storage_class = "GLACIER_IR" # Instant retrieval for recent backups
    }
    
    transition {
      days          = 14
      storage_class = "GLACIER" # Deep archive for older backups
    }
  }
}

resource "aws_s3_bucket_logging" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  
  target_bucket = aws_s3_bucket.backup_logs.id
  target_prefix = "access-logs/"
}

resource "aws_s3_bucket_metric" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  name   = "entire-bucket"
}

# ============================================================================
# S3 BUCKET FOR LOGS
# ============================================================================

resource "aws_s3_bucket" "backup_logs" {
  bucket = "${local.bucket_name}-logs"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.bucket_name}-logs"
    }
  )
}

resource "aws_s3_bucket_lifecycle_configuration" "backup_logs" {
  bucket = aws_s3_bucket.backup_logs.id
  
  rule {
    id     = "delete-old-logs"
    status = "Enabled"
    
    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backup_logs" {
  bucket = aws_s3_bucket.backup_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# S3 BUCKET POLICY
# ============================================================================

data "aws_iam_policy_document" "backup_bucket_policy" {
  statement {
    sid    = "DenyInsecureConnections"
    effect = "Deny"
    
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    
    actions = ["s3:*"]
    
    resources = [
      aws_s3_bucket.backup_bucket.arn,
      "${aws_s3_bucket.backup_bucket.arn}/*"
    ]
    
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
  
  statement {
    sid    = "AllowBackupRoleAccess"
    effect = "Allow"
    
    principals {
      type        = "AWS"
      identifiers = local.backup_principals
    }
    
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:ListBucket",
      "s3:ListBucketVersions",
      "s3:GetBucketLocation"
    ]
    
    resources = [
      aws_s3_bucket.backup_bucket.arn,
      "${aws_s3_bucket.backup_bucket.arn}/*"
    ]
  }
  
  statement {
    sid    = "RequireKMSEncryption"
    effect = "Deny"
    
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    
    actions = ["s3:PutObject"]
    
    resources = ["${aws_s3_bucket.backup_bucket.arn}/*"]
    
    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }
}

resource "aws_s3_bucket_policy" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  policy = data.aws_iam_policy_document.backup_bucket_policy.json
}

# ============================================================================
# IAM ROLE FOR BACKUP LAMBDA
# ============================================================================

resource "aws_iam_role" "backup_lambda_role" {
  name = "${var.company_name}-backup-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy" "backup_lambda_policy" {
  name = "${var.company_name}-backup-lambda-policy"
  role = aws_iam_role.backup_lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backup_bucket.arn,
          "${aws_s3_bucket.backup_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.backup_encryption.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:us-west-2:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backup_lambda_basic" {
  role       = aws_iam_role.backup_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ============================================================================
# LAMBDA FUNCTION FOR BACKUP (Placeholder)
# ============================================================================

resource "aws_lambda_function" "backup_handler" {
  filename         = "backup_lambda.zip"
  function_name    = "${var.company_name}-daily-backup-handler"
  role            = aws_iam_role.backup_lambda_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("backup_lambda.zip")
  runtime         = "python3.11"
  timeout         = 300
  memory_size     = 512
  
  environment {
    variables = {
      BACKUP_BUCKET = aws_s3_bucket.backup_bucket.id
      KMS_KEY_ID    = aws_kms_key.backup_encryption.id
    }
  }
  
  tags = local.common_tags
}

# ============================================================================
# EVENTBRIDGE SCHEDULING
# ============================================================================

resource "aws_cloudwatch_event_rule" "backup_schedule" {
  name                = "${var.company_name}-daily-backup-schedule"
  description         = "Trigger daily backup at specified time"
  schedule_expression = var.backup_schedule
  
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "backup_lambda" {
  rule      = aws_cloudwatch_event_rule.backup_schedule.name
  target_id = "BackupLambdaTarget"
  arn       = aws_lambda_function.backup_handler.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backup_handler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.backup_schedule.arn
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_sns_topic" "backup_alerts" {
  name = "${var.company_name}-backup-alerts"
  
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "backup_alerts_email" {
  topic_arn = aws_sns_topic.backup_alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_metric_alarm" "bucket_size" {
  alarm_name          = "${var.company_name}-backup-bucket-size"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BucketSizeBytes"
  namespace           = "AWS/S3"
  period              = 86400
  statistic           = "Average"
  threshold           = local.alarm_thresholds.bucket_size_gb * 1073741824 # Convert GB to bytes
  alarm_description   = "Alert when backup bucket exceeds ${local.alarm_thresholds.bucket_size_gb}GB"
  alarm_actions       = [aws_sns_topic.backup_alerts.arn]
  
  dimensions = {
    BucketName  = aws_s3_bucket.backup_bucket.id
    StorageType = "StandardStorage"
  }
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "bucket_requests" {
  alarm_name          = "${var.company_name}-backup-bucket-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AllRequests"
  namespace           = "AWS/S3"
  period              = 3600
  statistic           = "Sum"
  threshold           = local.alarm_thresholds.daily_requests / 24
  alarm_description   = "Alert when request rate is abnormally high"
  alarm_actions       = [aws_sns_topic.backup_alerts.arn]
  
  dimensions = {
    BucketName = aws_s3_bucket.backup_bucket.id
  }
  
  treat_missing_data = "notBreaching"
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.company_name}-backup-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Alert when backup Lambda function has errors"
  alarm_actions       = [aws_sns_topic.backup_alerts.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.backup_handler.function_name
  }
  
  treat_missing_data = "notBreaching"
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${var.company_name}-backup-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 240000 # 4 minutes in milliseconds
  alarm_description   = "Alert when backup Lambda takes too long"
  alarm_actions       = [aws_sns_topic.backup_alerts.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.backup_handler.function_name
  }
  
  treat_missing_data = "notBreaching"
  tags              = local.common_tags
}

# ============================================================================
# CLOUDWATCH LOG GROUP
# ============================================================================

resource "aws_cloudwatch_log_group" "backup_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.backup_handler.function_name}"
  retention_in_days = 7
  
  tags = local.common_tags
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "backup_bucket_name" {
  description = "Name of the S3 backup bucket"
  value       = aws_s3_bucket.backup_bucket.id
}

output "backup_bucket_arn" {
  description = "ARN of the S3 backup bucket"
  value       = aws_s3_bucket.backup_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.backup_encryption.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.backup_encryption.arn
}

output "lambda_function_arn" {
  description = "ARN of the backup Lambda function"
  value       = aws_lambda_function.backup_handler.arn
}

output "lambda_function_name" {
  description = "Name of the backup Lambda function"
  value       = aws_lambda_function.backup_handler.function_name
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge scheduling rule"
  value       = aws_cloudwatch_event_rule.backup_schedule.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.backup_alerts.arn
}

output "cloudwatch_alarms" {
  description = "Map of CloudWatch alarm names and ARNs"
  value = {
    bucket_size     = aws_cloudwatch_metric_alarm.bucket_size.arn
    bucket_requests = aws_cloudwatch_metric_alarm.bucket_requests.arn
    lambda_errors   = aws_cloudwatch_metric_alarm.lambda_errors.arn
    lambda_duration = aws_cloudwatch_metric_alarm.lambda_duration.arn
  }
}

output "backup_schedule" {
  description = "Cron expression for backup schedule"
  value       = var.backup_schedule
}

output "retention_days" {
  description = "Number of days backups are retained"
  value       = var.backup_retention_days
}

output "iam_role_arn" {
  description = "ARN of the IAM role for backup operations"
  value       = aws_iam_role.backup_lambda_role.arn
}
```

## Key Features Implemented

### 1. **S3 Bucket Configuration**
- **Encryption**: AWS-managed KMS key with automatic key rotation
- **Lifecycle Policies**: 
  - 30-day expiration for old backups
  - Transition to Glacier storage classes for cost optimization
  - Automatic cleanup of incomplete multipart uploads
- **Versioning**: Enabled for data protection
- **Access Logging**: Separate bucket for audit trails

### 2. **Security Features**
- **Bucket Policy**: Enforces HTTPS-only connections and KMS encryption
- **IAM Roles**: Least-privilege access for Lambda function
- **Public Access Block**: Prevents any public access
- **KMS Key**: Dedicated encryption key with rotation enabled

### 3. **Monitoring & Alerting**
- **CloudWatch Alarms**:
  - Bucket size monitoring (alerts at 500GB)
  - Request rate monitoring
  - Lambda error tracking
  - Lambda duration monitoring
- **SNS Topic**: Email notifications for all alarms

### 4. **Automation**
- **EventBridge Rule**: Daily backup schedule (2 AM UTC by default)
- **Lambda Function**: Placeholder for backup logic
- **CloudWatch Logs**: 7-day retention for Lambda logs

### 5. **Cost Optimization**
- **Storage Tiering**: Automatic transition to Glacier after 7 days
- **Bucket Key**: Reduces KMS API calls by 99%
- **Log Retention**: Automated cleanup after 90 days
- **Lifecycle Rules**: Automatic deletion after 30 days

## Usage Instructions

1. **Create the Lambda deployment package**:
```bash
# Create a simple backup_lambda.zip file
echo 'def handler(event, context): return {"statusCode": 200}' > index.py
zip backup_lambda.zip index.py
```

2. **Customize variables** in `terraform.tfvars`:
```hcl
company_name = "acme"
environment = "prod"
alarm_email = "your-ops@company.com"
allowed_backup_roles = ["arn:aws:iam::123456789012:role/existing-backup-role"]
```

3. **Deploy**:
```bash
terraform init
terraform plan
terraform apply
```

## Post-Deployment Steps

1. **Confirm SNS subscription** via email
2. **Implement actual backup logic** in Lambda function
3. **Test backup process** with a manual EventBridge trigger
4. **Configure additional IAM roles** if needed for user access

This solution provides a robust, cost-efficient, and fully automated backup system that scales well for 500 users while maintaining enterprise-grade security and monitoring.
