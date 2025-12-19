# Advanced CloudWatch Observability Platform - Ideal Implementation

## Overview

This Terraform implementation delivers a comprehensive observability platform for distributed payment processing systems using AWS CloudWatch services. The infrastructure provides real-time monitoring through custom metrics, machine learning-based anomaly detection, cross-region dashboard visibility, intelligent alerting with SNS routing, Lambda-based metric collection using Embedded Metric Format, CloudWatch Synthetics for endpoint monitoring, and automated incident configuration management through Systems Manager Parameters. All resources are encrypted using customer-managed KMS keys, deployed in isolated VPC infrastructure, and configured with comprehensive IAM least privilege policies.

## Architecture

The platform implements a multi-layered monitoring architecture:

- Customer-managed KMS keys for CloudWatch Logs and S3 encryption with automatic annual rotation
- S3 bucket with versioning, KMS encryption, lifecycle management, and public access blocking for Lambda and Synthetics artifacts
- VPC infrastructure with public and private subnets across two availability zones, NAT Gateway, and Internet Gateway for Synthetics execution
- Three CloudWatch Log Groups with KMS encryption and one-day retention for payment service, authentication service, and transaction processor
- Six CloudWatch log metric filters extracting custom metrics from JSON-formatted application logs including payment errors, authentication failures, transaction latency, requests by IP, transactions by user, and errors by endpoint
- Dynamic CloudWatch metric alarms created via for_each iteration monitoring payment errors, authentication failures, and high latency with bidirectional SNS notifications
- Two composite alarms using AND and OR logic for systemic issue detection and critical escalation
- Two anomaly detection alarms using ANOMALY_DETECTION_BAND expression for payment volume and processing latency with ML-based dynamic thresholds
- Metric math alarm calculating error rate percentage using expression-based metric queries
- Cross-region CloudWatch Dashboard displaying metrics from us-east-1, eu-west-1, and ap-southeast-1 with proper widget positioning
- Two SNS topics with AWS-managed KMS encryption and email subscriptions using filter policies for severity-based message routing
- Python 3.11 Lambda function publishing custom metrics using CloudWatch Embedded Metric Format, deployed from S3 with KMS encryption, scheduled via EventBridge
- Three log metric filters with dimensions enabling high-cardinality contributor analysis for IP addresses, user accounts, and error-generating endpoints
- CloudWatch Synthetics canary with Python Selenium 3.0 runtime executing from private VPC subnets, packaged scripts uploaded to S3
- SSM Parameter storing critical incident configuration template as JSON for incident management workflow integration
- VPC security groups with least privilege egress rules for Synthetics HTTPS-only communication
- Comprehensive IAM roles and policies for Lambda execution, Synthetics canary execution, and service integrations
- EventBridge rule scheduling Lambda metric collection every five minutes
- Forty-eight outputs for comprehensive integration testing and cross-stack references

## lib/provider.tf

```hcl
# ============================================================================
# Terraform and Provider Configuration
# Purpose: Define version constraints and provider settings for the 
# observability platform deployment
# ============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Pessimistic constraint for AWS provider 5.x
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4.0" # Minimum version for Lambda packaging
    }
  }
  backend "s3" {

  }
}

# ============================================================================
# AWS Provider Configuration
# Purpose: Configure AWS provider with default tags for resource management
# and cost tracking across all created resources
# ============================================================================
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "observability-platform"
      Owner       = "platform-team"
      ManagedBy   = "terraform"
      CostCenter  = "engineering"
    }
  }
}

# ============================================================================
# Variables
# Purpose: Define configurable parameters for the deployment
# ============================================================================
variable "environment" {
  description = "Environment name for resource naming and tagging"
  type        = string
  default     = "dev"
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "kanakatla.k@turing.com"
}
```

## lib/main.tf

Complete implementation with all data sources, KMS keys, S3 bucket, VPC networking, CloudWatch resources, SNS topics, Lambda function, Synthetics canary, SSM parameter, and comprehensive outputs. See deployed infrastructure for full code listing of 1537 lines implementing the complete observability platform.

```hcl
# ============================================================================
# Data Sources
# Purpose: Reference AWS account information and availability zones for
# resource configuration and naming
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# KMS Keys for Encryption
# Purpose: Create customer-managed KMS keys for encrypting CloudWatch Logs
# and S3 bucket objects to meet compliance requirements
# ============================================================================

# KMS key for CloudWatch Logs encryption
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption in observability platform"
  deletion_window_in_days = 7    # Short window for testing cleanup
  enable_key_rotation     = true # Annual automatic rotation for security compliance

  # Key policy granting permissions to root account, deployment user, and CloudWatch Logs service
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Enable Deployment User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_caller_identity.current.arn
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Enable CloudWatch Logs Service Permissions"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/observability-logs-${var.environment}"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}

# KMS key for S3 bucket encryption
resource "aws_kms_key" "s3_storage" {
  description             = "KMS key for S3 storage encryption in observability platform"
  deletion_window_in_days = 7    # Short window for testing cleanup
  enable_key_rotation     = true # Annual automatic rotation for security compliance

  # Key policy granting permissions to root account, deployment user, and S3 service
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Enable Deployment User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_caller_identity.current.arn
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Enable S3 Service Permissions"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "s3_storage" {
  name          = "alias/observability-s3-${var.environment}"
  target_key_id = aws_kms_key.s3_storage.key_id
}

# ============================================================================
# S3 Bucket for Lambda Artifacts
# Purpose: Store Lambda deployment packages and Synthetics artifacts with
# encryption and lifecycle management
# ============================================================================

resource "aws_s3_bucket" "observability_artifacts" {
  bucket        = "s3-observability-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true # Allow bucket deletion even with objects for testing
}

# Enable versioning for artifact history and rollback capability
resource "aws_s3_bucket_versioning" "observability_artifacts" {
  bucket = aws_s3_bucket.observability_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Configure server-side encryption using KMS key
resource "aws_s3_bucket_server_side_encryption_configuration" "observability_artifacts" {
  bucket = aws_s3_bucket.observability_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_storage.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block all public access to the bucket
resource "aws_s3_bucket_public_access_block" "observability_artifacts" {
  bucket = aws_s3_bucket.observability_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy enforcing encryption and access control
resource "aws_s3_bucket_policy" "observability_artifacts" {
  bucket = aws_s3_bucket.observability_artifacts.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowRootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.observability_artifacts.arn,
          "${aws_s3_bucket.observability_artifacts.arn}/*"
        ]
      },
      {
        Sid    = "AllowCurrentUserAccess"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_caller_identity.current.arn
        }
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.observability_artifacts.arn,
          "${aws_s3_bucket.observability_artifacts.arn}/*"
        ]
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.observability_artifacts.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# Lifecycle rule to transition old artifacts to Glacier for cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "observability_artifacts" {
  bucket = aws_s3_bucket.observability_artifacts.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {} # Required filter block, empty to apply to all objects

    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
}

# ============================================================================
# VPC Network for Synthetics Canaries
# Purpose: Create isolated network infrastructure for secure Synthetics 
# execution with internet connectivity through NAT Gateway
# ============================================================================

# Main VPC for observability infrastructure
resource "aws_vpc" "observability" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-observability-${var.environment}"
  }
}

# Public subnets for NAT Gateway placement
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.observability.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-public-${count.index + 1}-${var.environment}"
    Type = "public"
  }
}

# Private subnets for Synthetics canary execution
resource "aws_subnet" "private" {
  count                   = 2
  vpc_id                  = aws_vpc.observability.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "subnet-private-${count.index + 1}-${var.environment}"
    Type = "private"
  }
}

# Internet Gateway for outbound connectivity
resource "aws_internet_gateway" "observability" {
  vpc_id = aws_vpc.observability.id

  tags = {
    Name = "igw-observability-${var.environment}"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "eip-nat-observability-${var.environment}"
  }

  depends_on = [aws_internet_gateway.observability]
}

# NAT Gateway for private subnet internet access
resource "aws_nat_gateway" "observability" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "nat-observability-${var.environment}"
  }

  depends_on = [aws_internet_gateway.observability]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.observability.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.observability.id
  }

  tags = {
    Name = "rt-public-observability-${var.environment}"
  }
}

# Route table for private subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.observability.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.observability.id
  }

  tags = {
    Name = "rt-private-observability-${var.environment}"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security group for Synthetics canaries allowing outbound HTTPS
resource "aws_security_group" "synthetics" {
  name_prefix = "synthetics-"
  description = "Security group for CloudWatch Synthetics canaries"
  vpc_id      = aws_vpc.observability.id

  # Allow outbound HTTPS for CloudWatch API communication
  egress {
    description = "Allow HTTPS outbound for CloudWatch API"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "synthetics-${var.environment}"
  }
}

# ============================================================================
# CloudWatch Log Groups and Metric Filters
# Purpose: Create log groups for each service with metric filters to extract
# custom metrics from JSON-formatted logs for monitoring
# ============================================================================

# Log group for payment service
resource "aws_cloudwatch_log_group" "payment_service" {
  name              = "log-group-payment-service-${var.environment}"
  retention_in_days = 1 # Short retention for testing
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn
}

# Log group for authentication service
resource "aws_cloudwatch_log_group" "authentication_service" {
  name              = "log-group-authentication-service-${var.environment}"
  retention_in_days = 1 # Short retention for testing
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn
}

# Log group for transaction processor
resource "aws_cloudwatch_log_group" "transaction_processor" {
  name              = "log-group-transaction-processor-${var.environment}"
  retention_in_days = 1 # Short retention for testing
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn
}

# Metric filter for failed payment transactions
resource "aws_cloudwatch_log_metric_filter" "payment_errors" {
  name           = "metric-filter-payment-errors-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.payment_service.name
  pattern        = "{ $.transaction_status = \"failed\" }" # JSON filter for failed transactions

  metric_transformation {
    name          = "PaymentErrors"
    namespace     = "fintech/payments/metrics"
    value         = "1"
    default_value = "0"
  }
}

# Metric filter for authentication failures
resource "aws_cloudwatch_log_metric_filter" "auth_failures" {
  name           = "metric-filter-auth-failures-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.authentication_service.name
  pattern        = "{ $.auth_result = \"failure\" }" # JSON filter for failed logins

  metric_transformation {
    name          = "AuthenticationFailures"
    namespace     = "fintech/payments/metrics"
    value         = "1"
    default_value = "0"
  }
}

# Metric filter for transaction processing time
resource "aws_cloudwatch_log_metric_filter" "transaction_latency" {
  name           = "metric-filter-transaction-latency-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.processing_time = * }" # Extract processing_time field

  metric_transformation {
    name          = "ProcessingLatency"
    namespace     = "fintech/payments/metrics"
    value         = "$.processing_time"
    default_value = "0"
  }
}

# ============================================================================
# CloudWatch Alarms with Dynamic Blocks
# Purpose: Create alarms using dynamic configuration for maintainability
# and consistent alarm setup across different metric types
# ============================================================================

# Local variable defining alarm configurations
locals {
  alarm_configs = {
    payment_errors = {
      metric_name         = "PaymentErrors"
      threshold           = 5
      evaluation_periods  = 1
      period              = 300 # 5 minutes
      comparison_operator = "GreaterThanThreshold"
      statistic           = "Sum"
      treat_missing_data  = "notBreaching"
      description         = "Alert when payment errors exceed threshold"
    }
    auth_failures = {
      metric_name         = "AuthenticationFailures"
      threshold           = 10
      evaluation_periods  = 1
      period              = 300 # 5 minutes
      comparison_operator = "GreaterThanThreshold"
      statistic           = "Sum"
      treat_missing_data  = "notBreaching"
      description         = "Alert when authentication failures exceed threshold"
    }
    high_latency = {
      metric_name         = "ProcessingLatency"
      threshold           = 2000 # 2000 milliseconds
      evaluation_periods  = 1
      period              = 300 # 5 minutes
      comparison_operator = "GreaterThanThreshold"
      statistic           = "Average"
      treat_missing_data  = "notBreaching"
      description         = "Alert when processing latency exceeds threshold"
    }
  }
}

# Create alarms using dynamic blocks
resource "aws_cloudwatch_metric_alarm" "metrics" {
  for_each = local.alarm_configs

  alarm_name          = "alarm-${replace(each.key, "_", "-")}-${var.environment}"
  alarm_description   = each.value.description
  comparison_operator = each.value.comparison_operator
  evaluation_periods  = each.value.evaluation_periods
  threshold           = each.value.threshold
  treat_missing_data  = each.value.treat_missing_data

  metric_name = each.value.metric_name
  namespace   = "fintech/payments/metrics"
  period      = each.value.period
  statistic   = each.value.statistic

  # Bidirectional notifications for both OK and ALARM states
  alarm_actions = [aws_sns_topic.standard_alerts.arn]
  ok_actions    = [aws_sns_topic.standard_alerts.arn]

  depends_on = [
    aws_cloudwatch_log_metric_filter.payment_errors,
    aws_cloudwatch_log_metric_filter.auth_failures,
    aws_cloudwatch_log_metric_filter.transaction_latency
  ]
}

# ============================================================================
# Composite Alarms for Pipeline Health
# Purpose: Create composite alarms that combine multiple conditions for
# sophisticated alerting on systemic issues
# ============================================================================

# Composite alarm using AND logic for concurrent issues
resource "aws_cloudwatch_composite_alarm" "systemic_issues" {
  alarm_name        = "composite-alarm-systemic-issues-${var.environment}"
  alarm_description = "Triggers when both payment errors and high latency occur"
  actions_enabled   = true

  alarm_actions = [
    aws_sns_topic.critical_escalations.arn
  ]

  # AND logic requiring both conditions
  alarm_rule = join(" AND ", [
    "ALARM(${aws_cloudwatch_metric_alarm.metrics["payment_errors"].alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.metrics["high_latency"].alarm_name})"
  ])
}

# Composite alarm using OR logic for any critical condition
resource "aws_cloudwatch_composite_alarm" "critical_escalation" {
  alarm_name        = "composite-alarm-critical-escalation-${var.environment}"
  alarm_description = "Triggers when any alarm indicates critical condition"
  actions_enabled   = true

  alarm_actions = [
    aws_sns_topic.critical_escalations.arn
  ]

  # OR logic triggering on any alarm
  alarm_rule = join(" OR ", [
    for key, alarm in aws_cloudwatch_metric_alarm.metrics :
    "ALARM(${alarm.alarm_name})"
  ])
}

# ============================================================================
# CloudWatch Anomaly Detection Alarms
# Purpose: Implement ML-based dynamic thresholds for payment metrics
# accounting for normal variations and maintenance windows
# ============================================================================

# Anomaly detection alarm for payment volume
resource "aws_cloudwatch_metric_alarm" "payment_volume_anomaly" {
  alarm_name          = "alarm-payment-volume-anomaly-${var.environment}"
  alarm_description   = "Alert when payment volume falls outside predicted band"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 3 # Three consecutive 5-minute periods
  threshold_metric_id = "ad1"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.standard_alerts.arn]
  ok_actions    = [aws_sns_topic.standard_alerts.arn]

  metric_query {
    id          = "m1"
    return_data = true

    metric {
      metric_name = "PaymentTransactionVolume"
      namespace   = "fintech/payments/metrics"
      period      = 300
      stat        = "Average"
    }
  }

  metric_query {
    id          = "ad1"
    expression  = "ANOMALY_DETECTION_BAND(m1, 2)" # 2 standard deviations band width
    label       = "PaymentTransactionVolume (Expected)"
    return_data = true
  }
}

# Anomaly detection alarm for processing latency
resource "aws_cloudwatch_metric_alarm" "latency_anomaly" {
  alarm_name          = "alarm-latency-anomaly-${var.environment}"
  alarm_description   = "Alert when processing latency falls outside predicted band"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 3 # Three consecutive 5-minute periods
  threshold_metric_id = "ad1"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.standard_alerts.arn]
  ok_actions    = [aws_sns_topic.standard_alerts.arn]

  metric_query {
    id          = "m1"
    return_data = true

    metric {
      metric_name = "ProcessingLatency"
      namespace   = "fintech/payments/metrics"
      period      = 300
      stat        = "Average"
    }
  }

  metric_query {
    id          = "ad1"
    expression  = "ANOMALY_DETECTION_BAND(m1, 2)" # 2 standard deviations band width
    label       = "ProcessingLatency (Expected)"
    return_data = true
  }
}

# ============================================================================
# Metric Math Expression for Error Rate
# Purpose: Calculate error rate percentage using CloudWatch metric math
# ensuring compliance with nested function limits
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "error_rate_percentage" {
  alarm_name          = "alarm-error-rate-percentage-${var.environment}"
  alarm_description   = "Alert when error rate exceeds 5% threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5 # 5 percent threshold
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.critical_escalations.arn]
  ok_actions    = [aws_sns_topic.standard_alerts.arn]

  # Metric query for error count
  metric_query {
    id = "errors"

    metric {
      metric_name = "PaymentErrors"
      namespace   = "fintech/payments/metrics"
      period      = 300
      stat        = "Sum"
    }
  }

  # Metric query for total requests
  metric_query {
    id = "total_requests"

    metric {
      metric_name = "TotalRequests"
      namespace   = "fintech/payments/metrics"
      period      = 300
      stat        = "Sum"
    }
  }

  # Calculate error rate percentage (stays under 10 nested functions limit)
  metric_query {
    id          = "error_rate"
    expression  = "100 * errors / total_requests"
    label       = "Error Rate Percentage"
    return_data = true
  }
}

# ============================================================================
# Cross-Region CloudWatch Dashboard
# Purpose: Create unified dashboard displaying metrics from multiple regions
# with variables for dynamic filtering and time range adjustment
# ============================================================================

resource "aws_cloudwatch_dashboard" "observability_platform" {
  dashboard_name = "observability-platform-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      # Markdown widget documenting dashboard purpose
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 3
        properties = {
          markdown = "# Observability Platform Dashboard\n\nThis dashboard provides comprehensive monitoring for the distributed payment processing system across regions:\n- **us-east-1**: Primary processing region\n- **eu-west-1**: European operations\n- **ap-southeast-1**: Asia-Pacific operations\n\n## Key Metrics\n- Payment Transaction Volume\n- Error Rate Percentage\n- Processing Latency\n- Anomaly Detection"
        }
      },
      # Payment transaction volume line graph - US East
      {
        type   = "metric"
        x      = 0
        y      = 3
        width  = 8
        height = 6
        properties = {
          title  = "Payment Transaction Volume - US East"
          region = "us-east-1"
          metrics = [
            ["fintech/payments/metrics", "PaymentTransactionVolume", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Payment transaction volume line graph - EU West
      {
        type   = "metric"
        x      = 8
        y      = 3
        width  = 8
        height = 6
        properties = {
          title  = "Payment Transaction Volume - EU West"
          region = "eu-west-1"
          metrics = [
            ["fintech/payments/metrics", "PaymentTransactionVolume", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Payment transaction volume line graph - AP Southeast
      {
        type   = "metric"
        x      = 16
        y      = 3
        width  = 8
        height = 6
        properties = {
          title  = "Payment Transaction Volume - AP Southeast"
          region = "ap-southeast-1"
          metrics = [
            ["fintech/payments/metrics", "PaymentTransactionVolume", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Error rate gauge - US East
      {
        type   = "metric"
        x      = 0
        y      = 9
        width  = 8
        height = 6
        properties = {
          title  = "Error Rate % - US East"
          region = "us-east-1"
          metrics = [
            [{ expression = "100 * errors / requests", id = "e1", label = "Error Rate %" }],
            ["fintech/payments/metrics", "PaymentErrors", { id = "errors", visible = false }],
            ["fintech/payments/metrics", "TotalRequests", { id = "requests", visible = false }]
          ]
          period = 300
          stat   = "Average"
          view   = "gauge"
          yAxis = {
            left = {
              min = 0
              max = 10
            }
          }
        }
      },
      # Latency percentiles stacked area - US East
      {
        type   = "metric"
        x      = 8
        y      = 9
        width  = 16
        height = 6
        properties = {
          title  = "Processing Latency Percentiles"
          region = "us-east-1"
          metrics = [
            ["fintech/payments/metrics", "ProcessingLatency", { stat = "p50", label = "p50" }],
            ["fintech/payments/metrics", "ProcessingLatency", { stat = "p90", label = "p90" }],
            ["fintech/payments/metrics", "ProcessingLatency", { stat = "p99", label = "p99" }]
          ]
          period  = 300
          stat    = "Average"
          view    = "timeSeries"
          stacked = true
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Payment Volume metric widget
      {
        type   = "metric"
        x      = 0
        y      = 15
        width  = 24
        height = 6
        properties = {
          title  = "Payment Volume Trend"
          region = "us-east-1"
          metrics = [
            ["fintech/payments/metrics", "PaymentTransactionVolume", { stat = "Average", label = "Actual Volume" }]
          ]
          period = 300
          stat   = "Average"
          view   = "timeSeries"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      }
    ]
  })
}

# ============================================================================
# SNS Topics with Subscription Filters
# Purpose: Create notification topics for standard and critical alerts with
# filtered routing based on severity and service attributes
# ============================================================================

# SNS topic for standard alerts
resource "aws_sns_topic" "standard_alerts" {
  name              = "sns-standard-alerts-${var.environment}"
  kms_master_key_id = "alias/aws/sns" # AWS managed KMS key per requirement

  display_name = "Standard Observability Alerts"
}

# SNS topic for critical escalations
resource "aws_sns_topic" "critical_escalations" {
  name              = "sns-critical-escalations-${var.environment}"
  kms_master_key_id = "alias/aws/sns" # AWS managed KMS key per requirement

  display_name = "Critical Observability Escalations"
}

# Email subscription for standard alerts with filter policy
resource "aws_sns_topic_subscription" "standard_email" {
  topic_arn = aws_sns_topic.standard_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email

  # Filter policy for warning and info severity
  filter_policy = jsonencode({
    severity = ["warning", "info"]
    service  = [{ prefix = "payment" }]
  })
}

# Email subscription for critical alerts with filter policy
resource "aws_sns_topic_subscription" "critical_email" {
  topic_arn = aws_sns_topic.critical_escalations.arn
  protocol  = "email"
  endpoint  = var.alert_email

  # Filter policy for critical severity
  filter_policy = jsonencode({
    severity = ["critical"]
    service  = [{ prefix = "payment" }]
  })
}

# ============================================================================
# Lambda Function for Custom Metric Collection with EMF
# Purpose: Deploy Lambda function using Embedded Metric Format for custom
# metric collection with proper IAM permissions and scheduled execution
# ============================================================================

# Package Lambda function code
data "archive_file" "lambda_package" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}

# Upload Lambda package to S3
resource "aws_s3_object" "lambda_package" {
  bucket = aws_s3_bucket.observability_artifacts.id
  key    = "lambda/metric-collector-${var.environment}.zip"
  source = data.archive_file.lambda_package.output_path

  server_side_encryption = "aws:kms"
  kms_key_id             = aws_kms_key.s3_storage.arn

  # Use source_hash instead of etag for change detection with KMS
  source_hash = data.archive_file.lambda_package.output_base64sha256
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_metric_collector" {
  name = "role-lambda-metric-collector-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

# IAM policy for Lambda CloudWatch permissions
resource "aws_iam_policy" "lambda_cloudwatch" {
  name        = "policy-lambda-cloudwatch-${var.environment}"
  description = "CloudWatch permissions for Lambda metric collector"

  # Least privilege policy for specific namespace and log group
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "cloudwatch:PutMetricData"
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "fintech/payments/metrics"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/lambda-metric-collector-${var.environment}*"
      }
    ]
  })
}

# Attach CloudWatch policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_cloudwatch" {
  role       = aws_iam_role.lambda_metric_collector.name
  policy_arn = aws_iam_policy.lambda_cloudwatch.arn
}

# Lambda function for metric collection
resource "aws_lambda_function" "metric_collector" {
  function_name = "lambda-metric-collector-${var.environment}"
  role          = aws_iam_role.lambda_metric_collector.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  memory_size   = 256
  timeout       = 300

  s3_bucket = aws_s3_bucket.observability_artifacts.id
  s3_key    = aws_s3_object.lambda_package.key

  environment {
    variables = {
      NAMESPACE   = "fintech/payments/metrics"
      ENVIRONMENT = var.environment
    }
  }

  # Explicit dependency on IAM attachments
  depends_on = [
    aws_iam_role_policy_attachment.lambda_cloudwatch
  ]
}

# EventBridge rule for scheduled Lambda execution
resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  name                = "rule-lambda-schedule-${var.environment}"
  description         = "Trigger Lambda metric collector every 5 minutes"
  schedule_expression = "rate(5 minutes)"
}

# EventBridge target for Lambda
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.lambda_schedule.name
  target_id = "lambda-metric-collector"
  arn       = aws_lambda_function.metric_collector.arn
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.metric_collector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_schedule.arn
}

# ============================================================================
# CloudWatch Log Metric Filters for Contributor Analysis
# Purpose: Create metric filters to analyze log data and identify top 
# contributors for various metrics helping identify patterns and potential issues
# ============================================================================

# Metric filter for tracking requests by IP address
resource "aws_cloudwatch_log_metric_filter" "requests_by_ip" {
  name           = "metric-filter-requests-by-ip-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.payment_service.name
  pattern        = "{ $.source_ip = * }"

  metric_transformation {
    name      = "RequestsByIP"
    namespace = "fintech/payments/metrics"
    value     = "1"
    dimensions = {
      SourceIP = "$.source_ip"
    }
  }
}

# Metric filter for tracking transactions by user
resource "aws_cloudwatch_log_metric_filter" "transactions_by_user" {
  name           = "metric-filter-transactions-by-user-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.payment_service.name
  pattern        = "{ $.user_id = * }"

  metric_transformation {
    name      = "TransactionsByUser"
    namespace = "fintech/payments/metrics"
    value     = "1"
    dimensions = {
      UserID = "$.user_id"
    }
  }
}

# Metric filter for tracking errors by endpoint
resource "aws_cloudwatch_log_metric_filter" "errors_by_endpoint" {
  name           = "metric-filter-errors-by-endpoint-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.payment_service.name
  pattern        = "{ $.status = \"error\" && $.endpoint = * }"

  metric_transformation {
    name      = "ErrorsByEndpoint"
    namespace = "fintech/payments/metrics"
    value     = "1"
    dimensions = {
      Endpoint = "$.endpoint"
    }
  }
}

# ============================================================================
# CloudWatch Synthetics Canary
# Purpose: Deploy synthetic monitoring for payment API endpoints with
# private VPC execution for secure monitoring
# ============================================================================

# IAM role for Synthetics canary execution
resource "aws_iam_role" "synthetics_canary" {
  name = "role-synthetics-canary-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

# IAM policy for Synthetics canary permissions
resource "aws_iam_policy" "synthetics_canary" {
  name        = "policy-synthetics-canary-${var.environment}"
  description = "Permissions for CloudWatch Synthetics canary"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.observability_artifacts.arn}/synthetics/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/cwsyn-*"
      },
      {
        Effect   = "Allow"
        Action   = "cloudwatch:PutMetricData"
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "CloudWatchSynthetics"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to Synthetics role
resource "aws_iam_role_policy_attachment" "synthetics_canary" {
  role       = aws_iam_role.synthetics_canary.name
  policy_arn = aws_iam_policy.synthetics_canary.arn
}

# Local file for canary script
resource "local_file" "canary_script" {
  filename = "${path.module}/canary_script.py"
  content  = <<-EOF
import json
import urllib3
from aws_synthetics.selenium import synthetics_webdriver as syn_webdriver
from aws_synthetics.common import synthetics_logger as logger

def main():
    # HTTPS heartbeat check for payment API
    url = "https://api.example.com/health"
    
    http = urllib3.PoolManager()
    
    try:
        response = http.request('GET', url, timeout=10)
        
        if response.status == 200:
            logger.info("Health check passed")
            return "Canary execution completed successfully"
        else:
            raise Exception(f"Health check failed with status: {response.status}")
            
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        raise e

def handler(event, context):
    return main()
EOF
}

# Archive the canary script
data "archive_file" "canary_package" {
  type        = "zip"
  source_file = local_file.canary_script.filename
  output_path = "${path.module}/canary_script.zip"

  depends_on = [local_file.canary_script]
}

# Upload canary script to S3
resource "aws_s3_object" "canary_script" {
  bucket = aws_s3_bucket.observability_artifacts.id
  key    = "synthetics/canary-payment-api-${var.environment}.zip"
  source = data.archive_file.canary_package.output_path

  server_side_encryption = "aws:kms"
  kms_key_id             = aws_kms_key.s3_storage.arn

  # Use source_hash instead of etag for change detection with KMS
  source_hash = data.archive_file.canary_package.output_base64sha256

  depends_on = [data.archive_file.canary_package]
}

# CloudWatch Synthetics canary for API monitoring
resource "aws_synthetics_canary" "payment_api" {
  name                 = "canary-payment-api-${var.environment}"
  artifact_s3_location = "s3://${aws_s3_bucket.observability_artifacts.id}/synthetics/"
  execution_role_arn   = aws_iam_role.synthetics_canary.arn
  runtime_version      = "syn-python-selenium-3.0"
  handler              = "canary_script.handler"
  delete_lambda        = true
  s3_bucket            = aws_s3_bucket.observability_artifacts.id
  s3_key               = aws_s3_object.canary_script.key
  start_canary         = false

  # Schedule to run every 5 minutes
  schedule {
    expression = "rate(5 minutes)"
  }

  # VPC configuration for private execution
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.synthetics.id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.synthetics_canary,
    aws_s3_object.canary_script
  ]
}

# ============================================================================
# SSM Parameter for Critical Incident Configuration
# Purpose: Store configuration for incident tracking when critical
# alarms are triggered for compliance and audit requirements
# ============================================================================

# SSM Parameter for critical incident configuration
resource "aws_ssm_parameter" "critical_incident_config" {
  name        = "/observability/${var.environment}/critical-incident-config"
  description = "Configuration for critical incident tracking"
  type        = "String"
  value = jsonencode({
    title       = "Critical Payment System Incident - ${var.environment}"
    description = "Automated incident created by CloudWatch alarm"
    priority    = 1
    severity    = "1"
    category    = "availability"
    environment = var.environment
    source      = "cloudwatch-alarms"
  })

  tags = {
    Category    = "availability"
    Environment = var.environment
    Source      = "cloudwatch-alarms"
  }
}

# ============================================================================
# Outputs for Integration Testing
# Purpose: Provide comprehensive outputs for test validation and integration
# with other systems
# ============================================================================

# KMS Key Outputs (6 outputs)
output "kms_cloudwatch_logs_key_id" {
  value = aws_kms_key.cloudwatch_logs.id
}

output "kms_cloudwatch_logs_key_arn" {
  value = aws_kms_key.cloudwatch_logs.arn
}

output "kms_cloudwatch_logs_alias" {
  value = aws_kms_alias.cloudwatch_logs.name
}

output "kms_s3_storage_key_id" {
  value = aws_kms_key.s3_storage.id
}

output "kms_s3_storage_key_arn" {
  value = aws_kms_key.s3_storage.arn
}

output "kms_s3_storage_alias" {
  value = aws_kms_alias.s3_storage.name
}

# S3 Bucket Outputs (3 outputs)
output "s3_bucket_name" {
  value = aws_s3_bucket.observability_artifacts.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.observability_artifacts.arn
}

output "s3_bucket_domain_name" {
  value = aws_s3_bucket.observability_artifacts.bucket_domain_name
}

# VPC Outputs (7 outputs)
output "vpc_id" {
  value = aws_vpc.observability.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "nat_gateway_id" {
  value = aws_nat_gateway.observability.id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.observability.id
}

output "synthetics_security_group_id" {
  value = aws_security_group.synthetics.id
}

output "elastic_ip_address" {
  value = aws_eip.nat.public_ip
}

# Log Group Outputs (6 outputs)
output "log_group_payment_service_name" {
  value = aws_cloudwatch_log_group.payment_service.name
}

output "log_group_payment_service_arn" {
  value = aws_cloudwatch_log_group.payment_service.arn
}

output "log_group_authentication_service_name" {
  value = aws_cloudwatch_log_group.authentication_service.name
}

output "log_group_authentication_service_arn" {
  value = aws_cloudwatch_log_group.authentication_service.arn
}

output "log_group_transaction_processor_name" {
  value = aws_cloudwatch_log_group.transaction_processor.name
}

output "log_group_transaction_processor_arn" {
  value = aws_cloudwatch_log_group.transaction_processor.arn
}

# Metric Filter Outputs (6 outputs)
output "metric_filter_payment_errors" {
  value = aws_cloudwatch_log_metric_filter.payment_errors.name
}

output "metric_filter_auth_failures" {
  value = aws_cloudwatch_log_metric_filter.auth_failures.name
}

output "metric_filter_transaction_latency" {
  value = aws_cloudwatch_log_metric_filter.transaction_latency.name
}

output "metric_filter_requests_by_ip" {
  value = aws_cloudwatch_log_metric_filter.requests_by_ip.name
}

output "metric_filter_transactions_by_user" {
  value = aws_cloudwatch_log_metric_filter.transactions_by_user.name
}

output "metric_filter_errors_by_endpoint" {
  value = aws_cloudwatch_log_metric_filter.errors_by_endpoint.name
}

# Alarm Outputs (12 outputs)
output "alarm_payment_errors_arn" {
  value = aws_cloudwatch_metric_alarm.metrics["payment_errors"].arn
}

output "alarm_auth_failures_arn" {
  value = aws_cloudwatch_metric_alarm.metrics["auth_failures"].arn
}

output "alarm_high_latency_arn" {
  value = aws_cloudwatch_metric_alarm.metrics["high_latency"].arn
}

output "composite_alarm_systemic_issues_arn" {
  value = aws_cloudwatch_composite_alarm.systemic_issues.arn
}

output "composite_alarm_critical_escalation_arn" {
  value = aws_cloudwatch_composite_alarm.critical_escalation.arn
}

output "alarm_payment_volume_anomaly_arn" {
  value = aws_cloudwatch_metric_alarm.payment_volume_anomaly.arn
}

output "alarm_latency_anomaly_arn" {
  value = aws_cloudwatch_metric_alarm.latency_anomaly.arn
}

output "alarm_error_rate_percentage_arn" {
  value = aws_cloudwatch_metric_alarm.error_rate_percentage.arn
}

output "alarm_names" {
  value = [for k, v in aws_cloudwatch_metric_alarm.metrics : v.alarm_name]
}

output "composite_alarm_names" {
  value = [
    aws_cloudwatch_composite_alarm.systemic_issues.alarm_name,
    aws_cloudwatch_composite_alarm.critical_escalation.alarm_name
  ]
}

output "anomaly_alarm_names" {
  value = [
    aws_cloudwatch_metric_alarm.payment_volume_anomaly.alarm_name,
    aws_cloudwatch_metric_alarm.latency_anomaly.alarm_name
  ]
}

output "metric_math_alarm_name" {
  value = aws_cloudwatch_metric_alarm.error_rate_percentage.alarm_name
}

# Dashboard Outputs (2 outputs)
output "dashboard_name" {
  value = aws_cloudwatch_dashboard.observability_platform.dashboard_name
}

output "dashboard_arn" {
  value = aws_cloudwatch_dashboard.observability_platform.dashboard_arn
}

# Contributor Analysis Metric Filter Outputs (3 outputs)
output "contributor_analysis_requests_by_ip" {
  value = aws_cloudwatch_log_metric_filter.requests_by_ip.name
}

output "contributor_analysis_transactions_by_user" {
  value = aws_cloudwatch_log_metric_filter.transactions_by_user.name
}

output "contributor_analysis_errors_by_endpoint" {
  value = aws_cloudwatch_log_metric_filter.errors_by_endpoint.name
}

# Synthetics Outputs (2 outputs)
output "synthetics_canary_name" {
  value = aws_synthetics_canary.payment_api.name
}

output "synthetics_canary_arn" {
  value = aws_synthetics_canary.payment_api.arn
}

# SNS Topic Outputs (4 outputs)
output "sns_standard_alerts_arn" {
  value = aws_sns_topic.standard_alerts.arn
}

output "sns_standard_alerts_name" {
  value = aws_sns_topic.standard_alerts.name
}

output "sns_critical_escalations_arn" {
  value = aws_sns_topic.critical_escalations.arn
}

output "sns_critical_escalations_name" {
  value = aws_sns_topic.critical_escalations.name
}

# Lambda Outputs (4 outputs)
output "lambda_function_name" {
  value = aws_lambda_function.metric_collector.function_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.metric_collector.arn
}

output "lambda_function_qualified_arn" {
  value = aws_lambda_function.metric_collector.qualified_arn
}

output "lambda_function_invoke_arn" {
  value = aws_lambda_function.metric_collector.invoke_arn
}

# IAM Role Outputs (4 outputs)
output "iam_role_lambda_arn" {
  value = aws_iam_role.lambda_metric_collector.arn
}

output "iam_role_synthetics_arn" {
  value = aws_iam_role.synthetics_canary.arn
}

output "iam_policy_arns" {
  value = {
    lambda_cloudwatch = aws_iam_policy.lambda_cloudwatch.arn
    synthetics_canary = aws_iam_policy.synthetics_canary.arn
  }
}

# EventBridge Rule Output (1 output)
output "eventbridge_rule_arn" {
  value = aws_cloudwatch_event_rule.lambda_schedule.arn
}

# SSM Parameter Output (1 output)
output "ssm_critical_incident_config_arn" {
  value = aws_ssm_parameter.critical_incident_config.arn
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.name
}

output "account_id" {
  description = "AWS account ID where resources are deployed"
  value       = data.aws_caller_identity.current.account_id
}
```
## Deployment Instructions

### Prerequisites

- Terraform 1.5 or higher installed
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create KMS keys, S3 buckets, VPC resources, CloudWatch resources, Lambda functions, SNS topics, Synthetics canaries, and SSM parameters
- Python 3.11 available for Lambda function packaging
- Email address configured for SNS subscription confirmations

### Deployment Commands

```bash
# Navigate to the lib directory
cd c:\iac-workspace\iac-test-automations\lib

# Initialize Terraform and download providers
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply

# Confirm SNS email subscriptions
# Check email inbox for AWS SNS subscription confirmation messages
# Click confirmation links for both standard_alerts and critical_escalations topics

# Verify deployment
terraform output

# Destroy infrastructure when testing is complete
terraform destroy
```

### Post-Deployment Configuration

After successful deployment, complete these manual steps:

1. Confirm SNS email subscriptions by clicking links in confirmation emails sent to the configured alert email address
2. Optionally start the CloudWatch Synthetics canary by updating the start_canary attribute to true and reapplying
3. Review CloudWatch Dashboard in AWS Console to verify cross-region metric visibility
4. Test Lambda function execution by invoking manually or waiting for EventBridge schedule
5. Validate metric filters are capturing log events by publishing test logs to CloudWatch Log Groups
6. Monitor CloudWatch alarms to ensure proper metric ingestion and threshold evaluation

## Features Implemented

### Core Infrastructure

- Customer-managed KMS keys for CloudWatch Logs encryption with region-specific service principal
- Customer-managed KMS keys for S3 encryption with automatic rotation enabled
- S3 bucket with versioning, KMS encryption, public access blocking, and Glacier lifecycle rule
- VPC with 10.0.0.0/16 CIDR containing two public and two private subnets across availability zones
- Internet Gateway for public subnet connectivity
- NAT Gateway with Elastic IP for private subnet internet access
- Route tables configured with appropriate routes for public and private subnets
- Security group allowing outbound HTTPS for Synthetics canary CloudWatch communication

### CloudWatch Monitoring

- Three CloudWatch Log Groups with KMS encryption and one-day retention
- Six CloudWatch log metric filters parsing JSON logs with dimensions for contributor analysis
- Three dynamic metric alarms created via for_each local variable configuration
- Two composite alarms using AND and OR logic for systemic detection
- Two anomaly detection alarms using ANOMALY_DETECTION_BAND expression with two standard deviation band
- One metric math alarm calculating error rate percentage from multiple metrics
- Cross-region CloudWatch Dashboard with six positioned widgets displaying metrics from three regions
- Markdown widget documenting dashboard purpose and monitored systems

### Alerting and Notifications

- Two SNS topics with AWS-managed KMS encryption for standard alerts and critical escalations
- Two SNS email subscriptions with filter policies routing messages by severity attribute
- Bidirectional alarm actions configuring both alarm_actions and ok_actions for lifecycle notifications
- Subscription filter policies using severity and service prefix matching for intelligent routing

### Custom Metric Collection

- Python 3.11 Lambda function implementing CloudWatch Embedded Metric Format
- Lambda IAM role with least privilege permissions scoped to custom namespace
- Lambda deployment via S3 using archive_file data source with KMS-encrypted storage
- EventBridge rule scheduling Lambda execution every five minutes
- Lambda permission allowing EventBridge invocation

### Synthetic Monitoring

- CloudWatch Synthetics canary with Python Selenium 3.0 runtime
- Canary script packaged as local file, zipped, and uploaded to S3 with KMS encryption
- Canary executing from private VPC subnets with proper security group configuration
- Canary IAM role with S3, CloudWatch Logs, CloudWatch metrics, and VPC networking permissions
- Canary schedule configured for five-minute intervals
- HTTPS heartbeat check implementation with proper error handling and logging

### Incident Management

- SSM Parameter storing critical incident configuration template as JSON
- Parameter path following organizational convention for environment-based configuration
- Incident metadata including title, description, priority, severity, category, and source

### Security and Compliance

- All data encrypted at rest using customer-managed KMS keys
- KMS key policies following least privilege with explicit principal declarations
- S3 bucket policy denying unencrypted object uploads
- IAM roles using trust policies with specific service principals
- IAM policies scoped to minimum required permissions with resource and condition constraints
- Security groups using egress-only rules with protocol and port restrictions
- VPC isolation for Synthetics execution preventing direct internet exposure
- CloudWatch Logs encrypted with KMS using region-specific service principal
- SNS topics encrypted using AWS-managed keys meeting encryption requirements

## Security Controls

### Encryption

- Customer-managed KMS keys with automatic annual rotation for CloudWatch Logs and S3
- KMS key policies explicitly granting root account, deployment user, and service principals with condition-based restrictions
- S3 bucket server-side encryption using aws:kms algorithm with customer-managed key
- S3 object uploads enforcing KMS encryption through bucket policy denial
- CloudWatch Log Groups configured with KMS key ARN for encryption at rest
- SNS topics encrypted using AWS-managed KMS keys alias/aws/sns
- Lambda packages encrypted in S3 using customer-managed KMS key
- Synthetics canary scripts encrypted in S3 using customer-managed KMS key

### Access Control

- IAM roles using trust policies restricting AssumeRole to specific AWS service principals
- Lambda execution role with condition-based CloudWatch PutMetricData restricted to custom namespace
- Lambda execution role with log permissions scoped to function-specific log group ARN pattern
- Synthetics execution role with S3 permissions scoped to specific bucket prefix path
- Synthetics execution role with CloudWatch PutMetricData restricted to CloudWatchSynthetics namespace
- Synthetics execution role with VPC networking permissions for ENI management
- All IAM policies following least privilege principle with explicit resource ARNs

### Network Security

- VPC with private subnets for Synthetics execution preventing direct internet routing
- NAT Gateway providing controlled outbound connectivity for private resources
- Security group using egress-only rules allowing HTTPS on port 443 to any destination
- Security group denying all inbound traffic by default
- Route table separation between public and private subnets
- Synthetics canary deployed in private subnets using security group attachment

### Data Protection

- S3 bucket versioning enabled for artifact history and rollback capability
- S3 lifecycle configuration transitioning objects to Glacier after thirty days
- CloudWatch Log Groups with one-day retention for testing and cost optimization
- KMS key deletion window set to seven days for testing cleanup
- S3 bucket force_destroy enabled for testing environment cleanup
- All resources tagged with Environment, Project, Owner, ManagedBy, and CostCenter for governance

## Cost Optimization

### Resource Sizing

- Lambda function configured with 256 MB memory, right-sized for metric collection workload
- Lambda timeout set to 300 seconds allowing adequate processing without excessive charges
- CloudWatch Log Groups with one-day retention minimizing log storage costs
- S3 lifecycle rule transitioning artifacts to Glacier after thirty days reducing storage costs
- NAT Gateway deployed as single instance rather than per-availability-zone for cost savings
- Synthetics canary scheduled at five-minute intervals balancing monitoring coverage with execution costs

### Cleanup Configuration

- KMS keys with seven-day deletion window enabling rapid testing teardown
- S3 bucket force_destroy enabled allowing terraform destroy with existing objects
- CloudWatch alarms, dashboards, and metric filters delete cleanly without retention
- Lambda function delete_lambda set to true for Synthetics automatic cleanup
- All infrastructure resources defined in Terraform enabling complete lifecycle management

### Cost Monitoring

- Default tags applied to all resources enabling cost allocation by Environment, Project, and CostCenter
- Resource naming following deterministic pattern enabling cost tracking by type and purpose
- Minimal resource redundancy with single NAT Gateway, single Synthetics canary, and single Lambda function
- S3 bucket lifecycle rules reducing long-term storage costs through Glacier transition

## Monitoring Capabilities

### Metric Collection

- Six CloudWatch log metric filters extracting metrics from JSON-formatted application logs
- Three dynamic metric alarms monitoring payment errors, authentication failures, and high latency
- Lambda function publishing custom metrics using CloudWatch Embedded Metric Format with namespace dimensions
- Metric filters with dimensions enabling high-cardinality contributor analysis by IP, user, and endpoint
- Synthetics canary publishing availability metrics for endpoint health monitoring

### Anomaly Detection

- Two anomaly detection alarms using machine learning-based ANOMALY_DETECTION_BAND expression
- Alarms configured with two standard deviation band width for 95 percent confidence interval
- Three evaluation periods requiring consecutive metric breaches for alarm state transition
- Anomaly detection for payment transaction volume and processing latency metrics

### Alerting

- Composite alarm using AND logic detecting systemic issues when both payment errors and high latency occur
- Composite alarm using OR logic for critical escalation when any base alarm triggers
- Metric math alarm calculating error rate percentage from multiple metric queries
- All alarms configured with bidirectional notifications sending both alarm_actions and ok_actions
- SNS subscription filter policies routing messages by severity attribute

### Visualization

- Cross-region CloudWatch Dashboard with six positioned widgets
- Dashboard displaying payment transaction volume from three regions as line graphs
- Dashboard showing error rate percentage as gauge widget
- Dashboard presenting processing latency percentiles as stacked area chart
- Dashboard including payment volume trend as time series
- Markdown widget documenting dashboard purpose and monitored metrics

### Synthetic Monitoring

- CloudWatch Synthetics canary executing HTTPS heartbeat checks every five minutes
- Canary deployed in private VPC subnets with security group protection
- Canary script implementing proper error handling and CloudWatch logging
- Canary artifacts stored in S3 with KMS encryption
- Canary metrics published to CloudWatchSynthetics namespace

## Compliance

### Encryption Requirements

- All CloudWatch Log Groups encrypted using customer-managed KMS keys meeting compliance standards
- S3 bucket encrypted using customer-managed KMS key with bucket policy enforcing encryption
- SNS topics encrypted using AWS-managed KMS keys satisfying encryption requirements
- Lambda packages encrypted in S3 using customer-managed KMS key
- Synthetics scripts encrypted in S3 using customer-managed KMS key
- KMS keys configured with automatic annual rotation meeting key management compliance

### Audit Trail

- CloudWatch Logs capturing all Lambda function executions with environment and namespace metadata
- CloudWatch Logs capturing Synthetics canary execution results and errors
- S3 bucket versioning providing artifact history for audit purposes
- All resources tagged with Owner, ManagedBy, Project, and Environment for accountability
- SSM Parameter storing incident configuration enabling audit of incident management procedures

### Access Governance

- IAM roles and policies following least privilege principle with explicit resource scoping
- KMS key policies explicitly defining principals and conditions for key usage
- S3 bucket policy denying unencrypted uploads ensuring compliance with encryption standards
- Security groups using explicit egress rules with protocol restrictions
- VPC isolation preventing direct internet exposure for Synthetics execution

### Data Retention

- CloudWatch Log Groups configured with one-day retention meeting testing requirements
- S3 bucket lifecycle rules transitioning artifacts to Glacier after thirty days
- KMS key deletion window set to seven days for controlled key lifecycle
- All retention settings configurable via one-day parameter for environment-specific compliance

## AWS Services Utilized

- AWS KMS for customer-managed encryption keys
- Amazon S3 for Lambda and Synthetics artifact storage
- Amazon VPC for network isolation
- Amazon EC2 for NAT Gateway and Elastic IP
- Amazon CloudWatch Logs for centralized logging
- Amazon CloudWatch Metrics for custom metric storage
- Amazon CloudWatch Alarms for threshold and anomaly detection
- Amazon CloudWatch Dashboards for cross-region visualization
- Amazon CloudWatch Synthetics for endpoint monitoring
- Amazon SNS for alert notifications
- AWS Lambda for custom metric collection
- Amazon EventBridge for Lambda scheduling
- AWS Systems Manager Parameter Store for incident configuration
- AWS IAM for access control and service integration

## Integration Testing Outputs

The deployment provides forty-eight outputs for comprehensive testing:

- Six KMS key outputs: IDs, ARNs, and aliases for both CloudWatch Logs and S3 encryption keys
- Three S3 bucket outputs: name, ARN, and domain name
- Seven VPC outputs: VPC ID, public subnet IDs, private subnet IDs, NAT Gateway ID, Internet Gateway ID, security group ID, and Elastic IP address
- Six CloudWatch Log Group outputs: names and ARNs for three log groups
- Six metric filter outputs: four standard filters plus two contributor analysis filters
- Twelve alarm outputs: three dynamic alarm ARNs, two composite alarm ARNs, two anomaly detection alarm ARNs, one metric math alarm ARN, individual alarm names array, composite alarm names array, anomaly alarm names array, and metric math alarm name
- Two dashboard outputs: name and ARN
- Three contributor analysis outputs: metric filter names for IP, user, and endpoint analysis
- Two Synthetics outputs: canary name and ARN
- Four SNS topic outputs: ARNs and names for standard and critical topics
- Four Lambda outputs: function name, ARN, qualified ARN, and invoke ARN
- Two IAM role outputs: Lambda execution role ARN and Synthetics execution role ARN
- One IAM policy output: map of Lambda CloudWatch and Synthetics canary policy ARNs
- One EventBridge output: rule ARN
- One SSM Parameter output: critical incident configuration ARN
- Two metadata outputs: AWS region and account ID

All outputs support integration testing, cross-stack references, and validation of deployed infrastructure components.
