# Terraform Observability Platform Implementation

This implementation provides a complete enterprise-grade observability platform for payment processing systems using Terraform with HCL.

## File: lib/provider.tf

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
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Project     = "PaymentObservability"
      ManagedBy   = "Terraform"
    }
  }
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deploying resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "xray_sampling_percentage" {
  description = "X-Ray trace sampling percentage (0.0-1.0)"
  type        = number
  default     = 0.1
}

variable "alert_email" {
  description = "Email address for alert notifications"
  type        = string
  default     = ""
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub integration"
  type        = bool
  default     = true
}

variable "enable_config" {
  description = "Enable AWS Config for compliance tracking"
  type        = bool
  default     = true
}
```

## File: lib/main.tf

```hcl
# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "cloudtrail-logs-${var.environment_suffix}"
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

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
}

# CloudTrail for API audit logging
resource "aws_cloudtrail" "payment_audit" {
  name                          = "payment-audit-trail-${var.environment_suffix}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "payment_api_logs" {
  name              = "/aws/payment-api-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.observability.arn
}

resource "aws_cloudwatch_log_group" "payment_processor_logs" {
  name              = "/aws/payment-processor-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.observability.arn
}

resource "aws_cloudwatch_log_group" "payment_database_logs" {
  name              = "/aws/payment-database-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.observability.arn
}

resource "aws_cloudwatch_log_group" "security_events_logs" {
  name              = "/aws/security-events-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.observability.arn
}

# KMS Key for encryption
resource "aws_kms_key" "observability" {
  description             = "KMS key for observability platform encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "observability" {
  name          = "alias/observability-${var.environment_suffix}"
  target_key_id = aws_kms_key.observability.key_id
}

# X-Ray Sampling Rule
resource "aws_xray_sampling_rule" "payment_transactions" {
  rule_name      = "payment-transactions-${var.environment_suffix}"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = var.xray_sampling_percentage
  url_path       = "/api/payment/*"
  host           = "*"
  http_method    = "POST"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  attributes = {
    Environment = var.environment_suffix
  }
}

resource "aws_xray_sampling_rule" "default_sampling" {
  rule_name      = "default-sampling-${var.environment_suffix}"
  priority       = 5000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.05
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  attributes = {
    Environment = var.environment_suffix
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "payment_alerts" {
  name              = "payment-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.observability.id
}

resource "aws_sns_topic" "security_alerts" {
  name              = "security-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.observability.id
}

resource "aws_sns_topic_subscription" "payment_alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.payment_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "payment-high-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "PaymentProcessing"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when payment error rate exceeds threshold"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "payment-high-latency-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TransactionLatency"
  namespace           = "PaymentProcessing"
  period              = 300
  statistic           = "Average"
  threshold           = 500
  alarm_description   = "Alert when payment latency exceeds 500ms"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "failed_transactions" {
  alarm_name          = "payment-failed-transactions-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedTransactions"
  namespace           = "PaymentProcessing"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Critical alert for failed payment transactions"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    Environment = var.environment_suffix
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "payment_operations" {
  dashboard_name = "payment-operations-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["PaymentProcessing", "TransactionCount", { stat = "Sum", label = "Total Transactions" }],
            [".", "SuccessfulTransactions", { stat = "Sum", label = "Successful" }],
            [".", "FailedTransactions", { stat = "Sum", label = "Failed" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Payment Transaction Volume"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["PaymentProcessing", "TransactionLatency", { stat = "Average", label = "Avg Latency" }],
            ["...", { stat = "p50", label = "p50" }],
            ["...", { stat = "p95", label = "p95" }],
            ["...", { stat = "p99", label = "p99" }]
          ]
          period = 300
          region = var.aws_region
          title  = "Transaction Latency Distribution (ms)"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["PaymentProcessing", "Errors", { stat = "Sum", label = "Total Errors" }],
            [".", "AuthorizationErrors", { stat = "Sum", label = "Auth Errors" }],
            [".", "GatewayErrors", { stat = "Sum", label = "Gateway Errors" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Error Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.payment_api_logs.name}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent Errors"
          stacked = false
        }
      }
    ]
  })
}

# EventBridge Rule for Security Events
resource "aws_cloudwatch_event_rule" "security_config_changes" {
  name        = "security-config-changes-${var.environment_suffix}"
  description = "Capture AWS Config compliance changes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
    }
  })
}

resource "aws_cloudwatch_event_target" "security_config_sns" {
  rule      = aws_cloudwatch_event_rule.security_config_changes.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

resource "aws_sns_topic_policy" "security_alerts_eventbridge" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

# EventBridge Rule for CloudTrail Events
resource "aws_cloudwatch_event_rule" "unauthorized_api_calls" {
  name        = "unauthorized-api-calls-${var.environment_suffix}"
  description = "Detect unauthorized API calls"

  event_pattern = jsonencode({
    source      = ["aws.cloudtrail"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      errorCode = ["AccessDenied", "UnauthorizedOperation"]
    }
  })
}

resource "aws_cloudwatch_event_target" "unauthorized_api_sns" {
  rule      = aws_cloudwatch_event_rule.unauthorized_api_calls.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

# Systems Manager Parameters
resource "aws_ssm_parameter" "xray_sampling_rate" {
  name  = "/observability/${var.environment_suffix}/xray/sampling-rate"
  type  = "String"
  value = tostring(var.xray_sampling_percentage)

  description = "X-Ray sampling percentage for payment transactions"
}

resource "aws_ssm_parameter" "log_retention" {
  name  = "/observability/${var.environment_suffix}/logs/retention-days"
  type  = "String"
  value = tostring(var.log_retention_days)

  description = "CloudWatch log retention period in days"
}

resource "aws_ssm_parameter" "alert_threshold_latency" {
  name  = "/observability/${var.environment_suffix}/alerts/latency-threshold-ms"
  type  = "String"
  value = "500"

  description = "Latency threshold for payment transaction alerts"
}

# AWS Config (if enabled)
resource "aws_s3_bucket" "config_logs" {
  count  = var.enable_config ? 1 : 0
  bucket = "config-logs-${var.environment_suffix}"
}

resource "aws_s3_bucket_public_access_block" "config_logs" {
  count  = var.enable_config ? 1 : 0
  bucket = aws_s3_bucket.config_logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_logs" {
  count  = var.enable_config ? 1 : 0
  bucket = aws_s3_bucket.config_logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_iam_role" "config_role" {
  count = var.enable_config ? 1 : 0
  name  = "config-role-${var.environment_suffix}"

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
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  count      = var.enable_config ? 1 : 0
  role       = aws_iam_role.config_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  count = var.enable_config ? 1 : 0
  name  = "config-s3-policy"
  role  = aws_iam_role.config_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config_logs[0].arn,
          "${aws_s3_bucket.config_logs[0].arn}/*"
        ]
      }
    ]
  })
}

resource "aws_config_configuration_recorder" "main" {
  count    = var.enable_config ? 1 : 0
  name     = "config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config_role[0].arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main" {
  count          = var.enable_config ? 1 : 0
  name           = "config-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config_logs[0].bucket

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  count      = var.enable_config ? 1 : 0
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules
resource "aws_config_config_rule" "encrypted_volumes" {
  count = var.enable_config ? 1 : 0
  name  = "encrypted-volumes-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_bucket_encryption" {
  count = var.enable_config ? 1 : 0
  name  = "s3-bucket-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "iam_password_policy" {
  count = var.enable_config ? 1 : 0
  name  = "iam-password-policy-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Security Hub (if enabled)
resource "aws_securityhub_account" "main" {
  count = var.enable_security_hub ? 1 : 0
}

resource "aws_securityhub_standards_subscription" "cis" {
  count         = var.enable_security_hub ? 1 : 0
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/cis-aws-foundations-benchmark/v/1.4.0"

  depends_on = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "pci_dss" {
  count         = var.enable_security_hub ? 1 : 0
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/pci-dss/v/3.2.1"

  depends_on = [aws_securityhub_account.main]
}

# Data sources
data "aws_caller_identity" "current" {}
```

## File: lib/outputs.tf

```hcl
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail for audit logging"
  value       = aws_cloudtrail.payment_audit.arn
}

output "cloudtrail_bucket" {
  description = "S3 bucket name for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "payment_api_log_group" {
  description = "CloudWatch log group for payment API logs"
  value       = aws_cloudwatch_log_group.payment_api_logs.name
}

output "payment_processor_log_group" {
  description = "CloudWatch log group for payment processor logs"
  value       = aws_cloudwatch_log_group.payment_processor_logs.name
}

output "payment_database_log_group" {
  description = "CloudWatch log group for payment database logs"
  value       = aws_cloudwatch_log_group.payment_database_logs.name
}

output "security_events_log_group" {
  description = "CloudWatch log group for security events"
  value       = aws_cloudwatch_log_group.security_events_logs.name
}

output "xray_sampling_rule_payment" {
  description = "X-Ray sampling rule for payment transactions"
  value       = aws_xray_sampling_rule.payment_transactions.id
}

output "payment_alerts_topic_arn" {
  description = "SNS topic ARN for payment alerts"
  value       = aws_sns_topic.payment_alerts.arn
}

output "security_alerts_topic_arn" {
  description = "SNS topic ARN for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "dashboard_name" {
  description = "CloudWatch dashboard name for payment operations"
  value       = aws_cloudwatch_dashboard.payment_operations.dashboard_name
}

output "kms_key_id" {
  description = "KMS key ID for observability platform encryption"
  value       = aws_kms_key.observability.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for observability platform encryption"
  value       = aws_kms_key.observability.arn
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = var.enable_config ? aws_config_configuration_recorder.main[0].name : null
}

output "config_bucket" {
  description = "S3 bucket for AWS Config logs"
  value       = var.enable_config ? aws_s3_bucket.config_logs[0].id : null
}

output "security_hub_enabled" {
  description = "Whether Security Hub is enabled"
  value       = var.enable_security_hub
}

output "ssm_xray_sampling_parameter" {
  description = "SSM parameter for X-Ray sampling rate"
  value       = aws_ssm_parameter.xray_sampling_rate.name
}

output "ssm_log_retention_parameter" {
  description = "SSM parameter for log retention days"
  value       = aws_ssm_parameter.log_retention.name
}

output "ssm_latency_threshold_parameter" {
  description = "SSM parameter for latency threshold"
  value       = aws_ssm_parameter.alert_threshold_latency.name
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example Terraform variables file
# Copy to terraform.tfvars and adjust values

aws_region         = "us-east-1"
environment_suffix = "dev-12345"

# CloudWatch log retention (7-30 days recommended for cost management)
log_retention_days = 14

# X-Ray sampling percentage (0.05 = 5%, 0.1 = 10%)
xray_sampling_percentage = 0.1

# Alert email (leave empty to skip email subscriptions)
alert_email = "ops-team@example.com"

# Feature flags
enable_security_hub = true
enable_config       = true
```

## File: lib/README.md

```markdown
# Payment Processing Observability Platform

Enterprise-grade observability infrastructure for payment processing systems using Terraform.

## Architecture Overview

This Terraform configuration deploys a comprehensive observability stack including:

- **Centralized Logging**: CloudWatch log groups with encryption and retention policies
- **Distributed Tracing**: X-Ray sampling rules for transaction tracing
- **Metrics & Dashboards**: CloudWatch dashboards for payment KPIs
- **Alerting**: CloudWatch alarms with SNS notifications
- **Audit Logging**: CloudTrail for AWS API tracking
- **Event Management**: EventBridge rules for automated incident response
- **Compliance**: AWS Config rules and Security Hub integration
- **Operational Parameters**: Systems Manager parameter store

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions for CloudWatch, X-Ray, CloudTrail, Config, Security Hub

## Deployment Instructions

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Configure Variables

Create `terraform.tfvars` file:

```hcl
environment_suffix       = "prod-abc123"
aws_region              = "us-east-1"
log_retention_days      = 14
xray_sampling_percentage = 0.1
alert_email             = "ops-team@example.com"
enable_security_hub     = true
enable_config           = true
```

### 3. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 4. Apply Configuration

```bash
terraform apply tfplan
```

### 5. Confirm SNS Subscriptions

After deployment, check your email for SNS subscription confirmation links and confirm them to receive alerts.

## Resource Naming

All resources include the `environment_suffix` variable for uniqueness:
- CloudWatch Log Groups: `/aws/payment-api-${environment_suffix}`
- SNS Topics: `payment-alerts-${environment_suffix}`
- S3 Buckets: `cloudtrail-logs-${environment_suffix}`

## AWS Services Used

- **CloudWatch**: Logs, metrics, dashboards, alarms
- **X-Ray**: Distributed tracing with sampling rules
- **CloudTrail**: API audit logging
- **EventBridge**: Event-driven alerting
- **SNS**: Multi-channel notifications
- **Systems Manager**: Parameter storage
- **AWS Config**: Resource configuration tracking
- **Security Hub**: Centralized security findings
- **KMS**: Encryption key management
- **S3**: Log storage with lifecycle policies

## Security Features

- **Encryption**: All logs encrypted at rest with KMS
- **IAM**: Least privilege roles for all services
- **S3**: Public access blocked, versioning enabled
- **CloudTrail**: Log file validation enabled
- **Compliance**: PCI DSS and CIS AWS Foundations standards

## Cost Optimization

- Log retention: 14 days (configurable 7-30 days)
- X-Ray sampling: 10% of requests (configurable 5-10%)
- Lifecycle policies: S3 logs expire after 90 days
- Serverless architecture: No EC2 instances or NAT gateways

## CloudWatch Dashboard

Access the payment operations dashboard:
1. Navigate to CloudWatch Console
2. Select "Dashboards"
3. Open `payment-operations-${environment_suffix}`

Dashboard includes:
- Transaction volume (total, successful, failed)
- Latency distribution (p50, p95, p99)
- Error metrics (total, authorization, gateway)
- Recent error logs

## Alerting Configuration

Three CloudWatch alarms are configured:

1. **High Error Rate**: Triggers when errors exceed 10 in 5 minutes
2. **High Latency**: Triggers when average latency exceeds 500ms
3. **Failed Transactions**: Triggers when failed transactions exceed 5 per minute

All alarms send notifications to the `payment-alerts-${environment_suffix}` SNS topic.

## Security Monitoring

EventBridge rules monitor:
- AWS Config compliance changes
- Unauthorized API calls (AccessDenied, UnauthorizedOperation)

Security alerts sent to `security-alerts-${environment_suffix}` SNS topic.

## X-Ray Tracing

Two sampling rules configured:

1. **Payment Transactions** (priority 1000): 10% sampling for `/api/payment/*` POST requests
2. **Default Sampling** (priority 5000): 5% sampling for all other requests

Configure sampling rate via `xray_sampling_percentage` variable or SSM parameter.

## AWS Config Rules

Three compliance rules enabled:
- `encrypted-volumes`: Ensures EBS volumes are encrypted
- `s3-bucket-encryption`: Ensures S3 buckets have encryption
- `iam-password-policy`: Validates IAM password policy

## Systems Manager Parameters

Operational parameters stored in SSM:
- `/observability/${environment_suffix}/xray/sampling-rate`
- `/observability/${environment_suffix}/logs/retention-days`
- `/observability/${environment_suffix}/alerts/latency-threshold-ms`

## Log Analysis Examples

### Query recent errors in payment API:

```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

### Query transactions by latency:

```
fields @timestamp, transaction_id, latency
| filter latency > 500
| sort latency desc
| limit 50
```

### Query failed payment transactions:

```
fields @timestamp, transaction_id, error_code, error_message
| filter status = "failed"
| stats count() by error_code
```

## Troubleshooting

### CloudTrail not logging

- Verify S3 bucket policy allows CloudTrail service
- Check trail is enabled: `aws cloudtrail get-trail-status`

### Config recorder not starting

- Verify IAM role has `AWS_ConfigRole` managed policy
- Check S3 bucket permissions for Config service

### Alarms not triggering

- Verify SNS email subscriptions are confirmed
- Check metrics are being published to CloudWatch
- Review alarm thresholds and evaluation periods

### Security Hub standards not enabling

- Ensure Security Hub is enabled in the region
- Check IAM permissions for Security Hub management
- Standards may take 15-30 minutes to fully enable

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: S3 buckets with objects must be emptied manually before destruction.

## Integration with Applications

### Publishing Custom Metrics

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_data(
    Namespace='PaymentProcessing',
    MetricData=[
        {
            'MetricName': 'TransactionCount',
            'Value': 1,
            'Unit': 'Count',
            'Dimensions': [
                {'Name': 'Environment', 'Value': 'prod-abc123'}
            ]
        }
    ]
)
```

### Enabling X-Ray Tracing

For Lambda functions:
```python
from aws_xray_sdk.core import xray_recorder

@xray_recorder.capture('process_payment')
def process_payment(event):
    # Your payment logic
    pass
```

For API Gateway:
- Enable X-Ray tracing in API Gateway stage settings

### Writing Application Logs

Configure application to write to CloudWatch log groups:
- `/aws/payment-api-${environment_suffix}`
- `/aws/payment-processor-${environment_suffix}`
- `/aws/payment-database-${environment_suffix}`

## Compliance Notes

### PCI DSS Compliance

This observability platform supports PCI DSS requirements:
- Requirement 10.2: Audit logs for security events (CloudTrail)
- Requirement 10.3: Audit trail entries (CloudWatch Logs)
- Requirement 10.5: Secure audit trails (KMS encryption)
- Requirement 10.6: Review logs (CloudWatch dashboards)

### Data Retention

- CloudWatch Logs: 14 days (configurable)
- CloudTrail S3: 90 days (lifecycle policy)
- Config S3: Indefinite (configure lifecycle as needed)

## Outputs

After deployment, Terraform outputs include:
- CloudWatch log group names
- SNS topic ARNs for alerts
- Dashboard name
- KMS key ID
- Config recorder name
- SSM parameter names

Use outputs for application integration:
```bash
terraform output payment_api_log_group
terraform output payment_alerts_topic_arn
```

## Support

For issues or questions:
1. Review CloudWatch Logs for error details
2. Check AWS Config compliance dashboard
3. Review Security Hub findings
4. Consult Terraform state: `terraform state list`
```

## File: test/main.tftest.hcl

```hcl
variables {
  environment_suffix       = "test-12345"
  aws_region              = "us-east-1"
  log_retention_days      = 7
  xray_sampling_percentage = 0.1
  alert_email             = ""
  enable_security_hub     = false
  enable_config           = false
}

run "validate_cloudtrail" {
  command = plan

  assert {
    condition     = aws_cloudtrail.payment_audit.enable_log_file_validation == true
    error_message = "CloudTrail log file validation must be enabled"
  }

  assert {
    condition     = aws_cloudtrail.payment_audit.include_global_service_events == true
    error_message = "CloudTrail must include global service events"
  }
}

run "validate_log_groups" {
  command = plan

  assert {
    condition     = aws_cloudwatch_log_group.payment_api_logs.retention_in_days == 7
    error_message = "Log retention must match configured value"
  }

  assert {
    condition     = can(regex(".*test-12345", aws_cloudwatch_log_group.payment_api_logs.name))
    error_message = "Log group name must include environment suffix"
  }
}

run "validate_encryption" {
  command = plan

  assert {
    condition     = aws_kms_key.observability.enable_key_rotation == true
    error_message = "KMS key rotation must be enabled"
  }

  assert {
    condition     = aws_s3_bucket_server_side_encryption_configuration.cloudtrail_logs.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm == "AES256"
    error_message = "S3 bucket must have encryption enabled"
  }
}

run "validate_s3_security" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.cloudtrail_logs.block_public_acls == true
    error_message = "S3 bucket must block public ACLs"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.cloudtrail_logs.restrict_public_buckets == true
    error_message = "S3 bucket must restrict public access"
  }
}

run "validate_xray_sampling" {
  command = plan

  assert {
    condition     = aws_xray_sampling_rule.payment_transactions.fixed_rate == 0.1
    error_message = "X-Ray sampling rate must match configured value"
  }

  assert {
    condition     = can(regex("payment-transactions-.*", aws_xray_sampling_rule.payment_transactions.rule_name))
    error_message = "X-Ray sampling rule name must include descriptive prefix"
  }
}

run "validate_alarms" {
  command = plan

  assert {
    condition     = length(aws_cloudwatch_metric_alarm.high_error_rate.alarm_actions) > 0
    error_message = "CloudWatch alarm must have at least one action configured"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.high_latency.threshold == 500
    error_message = "Latency alarm threshold must be 500ms"
  }
}

run "validate_sns_topics" {
  command = plan

  assert {
    condition     = can(regex("payment-alerts-test-12345", aws_sns_topic.payment_alerts.name))
    error_message = "SNS topic name must include environment suffix"
  }

  assert {
    condition     = aws_sns_topic.payment_alerts.kms_master_key_id != null
    error_message = "SNS topic must be encrypted with KMS"
  }
}

run "validate_ssm_parameters" {
  command = plan

  assert {
    condition     = can(regex("/observability/test-12345/.*", aws_ssm_parameter.xray_sampling_rate.name))
    error_message = "SSM parameter name must include environment suffix in path"
  }
}
```

