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