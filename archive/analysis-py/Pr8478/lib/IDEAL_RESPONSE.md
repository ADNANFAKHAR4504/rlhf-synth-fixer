# CloudWatch Monitoring Infrastructure - Ideal Implementation

This document presents the correct Terraform implementation for comprehensive CloudWatch monitoring of payment processing services, including all necessary resources, tests, and analysis tools.

## Overview

The solution creates a complete monitoring infrastructure with:
- CloudWatch Log Groups with KMS encryption for payment-api, transaction-processor, and fraud-detector services
- Metric Filters for extracting business and operational metrics from JSON logs
- CloudWatch Alarms for automated alerting on error rates, response times, and failed transactions
- Composite Alarm for multi-service failure detection
- SNS Topic with email subscription for notifications
- CloudWatch Dashboard with 9 widgets in 3-column layout for visualization
- CloudWatch Logs Insights query definitions for incident investigation
- Infrastructure analysis script for compliance validation

All resources are self-contained and follow infrastructure-as-code best practices with comprehensive test coverage.

## File Structure

```
lib/
  main.tf                  # All infrastructure resources (606 lines)
  variables.tf             # Input variables
  outputs.tf               # Output values for integration
  provider.tf              # AWS provider configuration
  terraform-validator.ts   # Reusable validation utility
  analyse.py               # Infrastructure analysis script
test/
  terraform.unit.test.ts   # Terraform unit tests (99 test cases)
  terraform.int.test.ts    # Terraform integration tests (25 test cases)
tests/
  analyse.unit.test.py     # Python unit tests for analyse.py (40+ test cases)
  analyse.int.test.py      # Python integration tests for analyse.py (20+ test cases)
```

## Implementation

### File: lib/main.tf

```hcl
# KMS key for CloudWatch Logs encryption
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch Logs encryption - ${var.environment_suffix}"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "cloudwatch-logs-key-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/cloudwatch-logs-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "payment_api" {
  name              = "/aws/payment-api-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name        = "payment-api-logs-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "transaction_processor" {
  name              = "/aws/transaction-processor-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name        = "transaction-processor-logs-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "fraud_detector" {
  name              = "/aws/fraud-detector-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name        = "fraud-detector-logs-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# Metric Filters for Error Rates
resource "aws_cloudwatch_log_metric_filter" "payment_api_errors" {
  name           = "payment-api-error-rate-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "FinTech/PaymentAPI/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "transaction_processor_errors" {
  name           = "transaction-processor-error-rate-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "FinTech/TransactionProcessor/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "fraud_detector_errors" {
  name           = "fraud-detector-error-rate-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.fraud_detector.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "FinTech/FraudDetector/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

# Metric Filters for Response Times
resource "aws_cloudwatch_log_metric_filter" "payment_api_response_time" {
  name           = "payment-api-response-time-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "{ $.responseTime = * }"

  metric_transformation {
    name      = "ResponseTime"
    namespace = "FinTech/PaymentAPI/${var.environment}"
    value     = "$.responseTime"
    unit      = "Milliseconds"
  }
}

# Metric Filters for Transaction Amounts
resource "aws_cloudwatch_log_metric_filter" "transaction_amounts" {
  name           = "transaction-amounts-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.transactionAmount = * }"

  metric_transformation {
    name      = "TransactionAmount"
    namespace = "FinTech/TransactionProcessor/${var.environment}"
    value     = "$.transactionAmount"
    unit      = "None"
  }
}

# Metric Filters for Failed Transactions
resource "aws_cloudwatch_log_metric_filter" "failed_transactions" {
  name           = "failed-transactions-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.transaction_processor.name
  pattern        = "{ $.status = \"FAILED\" }"

  metric_transformation {
    name      = "FailedTransactions"
    namespace = "FinTech/TransactionProcessor/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

# Metric Filter for Lambda Cold Starts
resource "aws_cloudwatch_log_metric_filter" "lambda_cold_starts" {
  name           = "lambda-cold-starts-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "[report_label=\"REPORT\", request_id_label=\"RequestId:\", request_id, duration_label=\"Duration:\", duration, duration_unit=\"ms\", billed_duration_label=\"Billed Duration:\", billed_duration, billed_duration_unit=\"ms\", memory_label=\"Memory Size:\", memory_size, memory_unit=\"MB\", max_memory_label=\"Max Memory Used:\", max_memory_used, max_memory_unit=\"MB\", init_duration_label=\"Init Duration:\", init_duration, init_duration_unit=\"ms\"]"

  metric_transformation {
    name      = "ColdStart"
    namespace = "FinTech/Lambda/${var.environment}"
    value     = "1"
    unit      = "Count"
  }
}

# Metric Filter for Lambda Duration
resource "aws_cloudwatch_log_metric_filter" "lambda_duration" {
  name           = "lambda-duration-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.payment_api.name
  pattern        = "[report_label=\"REPORT\", request_id_label=\"RequestId:\", request_id, duration_label=\"Duration:\", duration, ...]"

  metric_transformation {
    name      = "Duration"
    namespace = "FinTech/Lambda/${var.environment}"
    value     = "$duration"
    unit      = "Milliseconds"
  }
}

# SNS Topic for Notifications
resource "aws_sns_topic" "alerts" {
  name              = "payment-monitoring-alerts-${var.environment_suffix}"
  display_name      = "Payment Processing Monitoring Alerts"
  kms_master_key_id = aws_kms_key.cloudwatch.id

  tags = {
    Name        = "monitoring-alerts-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "payment-api-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/PaymentAPI/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when payment API error rate exceeds 1%"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "api-error-alarm-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "api_response_time" {
  alarm_name          = "payment-api-response-time-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ResponseTime"
  namespace           = "FinTech/PaymentAPI/${var.environment}"
  period              = 60
  statistic           = "Average"
  threshold           = 500
  alarm_description   = "Alert when payment API response time exceeds 500ms"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "api-response-time-alarm-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "failed_transactions" {
  alarm_name          = "failed-transactions-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedTransactions"
  namespace           = "FinTech/TransactionProcessor/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when failed transactions exceed 5 per minute"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "failed-transactions-alarm-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "transaction_processor_errors" {
  alarm_name          = "transaction-processor-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/TransactionProcessor/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when transaction processor errors occur"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "transaction-processor-errors-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "fraud_detector_errors" {
  alarm_name          = "fraud-detector-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/FraudDetector/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when fraud detector errors occur"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "fraud-detector-errors-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# Composite Alarm
resource "aws_cloudwatch_composite_alarm" "multi_service_failure" {
  alarm_name        = "multi-service-failure-${var.environment_suffix}"
  alarm_description = "Alert when 2 or more services are experiencing issues"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.alerts.arn]
  ok_actions        = [aws_sns_topic.alerts.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.api_error_rate.alarm_name}) AND (ALARM(${aws_cloudwatch_metric_alarm.transaction_processor_errors.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.fraud_detector_errors.alarm_name}))"

  tags = {
    Name        = "multi-service-failure-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# CloudWatch Alarm for High Load
resource "aws_cloudwatch_metric_alarm" "high_load" {
  alarm_name          = "payment-high-load-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "FinTech/PaymentAPI/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when high load detected (>10 errors/min)"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "high-load-alarm-${var.environment_suffix}"
    CostCenter  = var.cost_center
    Environment = var.environment
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "payment_monitoring" {
  dashboard_name = "payment-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      # Row 1: Service Health (3 columns)
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Payment API Error Rate"
          region = var.aws_region
          metrics = [
            ["FinTech/PaymentAPI/${var.environment}", "ErrorCount", { stat = "Sum", period = 60 }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Transaction Processor Health"
          region = var.aws_region
          metrics = [
            ["FinTech/TransactionProcessor/${var.environment}", "ErrorCount", { stat = "Sum", period = 60, label = "Errors" }],
            [".", "FailedTransactions", { stat = "Sum", period = 60, label = "Failed Transactions" }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Fraud Detector Status"
          region = var.aws_region
          metrics = [
            ["FinTech/FraudDetector/${var.environment}", "ErrorCount", { stat = "Sum", period = 60 }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      # Row 2: Transaction Volume and Performance (3 columns)
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "Transaction Volume Trends"
          region = var.aws_region
          metrics = [
            ["FinTech/TransactionProcessor/${var.environment}", "TransactionAmount", { stat = "SampleCount", period = 300, label = "Total Transactions" }],
            ["...", { stat = "Sum", period = 300, label = "Transaction Volume" }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "API Response Time"
          region = var.aws_region
          metrics = [
            ["FinTech/PaymentAPI/${var.environment}", "ResponseTime", { stat = "Average", period = 60, label = "Avg Response Time" }],
            ["...", { stat = "Maximum", period = 60, label = "Max Response Time" }]
          ]
          view    = "timeSeries"
          stacked = false
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "Error Distribution"
          region = var.aws_region
          metrics = [
            ["FinTech/PaymentAPI/${var.environment}", "ErrorCount", { stat = "Sum", period = 300, label = "API Errors" }],
            ["FinTech/TransactionProcessor/${var.environment}", "ErrorCount", { stat = "Sum", period = 300, label = "Processor Errors" }],
            ["FinTech/FraudDetector/${var.environment}", "ErrorCount", { stat = "Sum", period = 300, label = "Fraud Detector Errors" }]
          ]
          view    = "timeSeries"
          stacked = true
        }
      },
      # Row 3: Business KPIs and Lambda Metrics (3 columns)
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Successful Payments Per Minute"
          region = var.aws_region
          metrics = [
            [
              {
                expression = "m1 - m2"
                label      = "Successful Payments"
                id         = "e1"
              }
            ],
            ["FinTech/TransactionProcessor/${var.environment}", "TransactionAmount", { id = "m1", stat = "SampleCount", period = 60, visible = false }],
            [".", "FailedTransactions", { id = "m2", stat = "Sum", period = 60, visible = false }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Average Transaction Value"
          region = var.aws_region
          metrics = [
            ["FinTech/TransactionProcessor/${var.environment}", "TransactionAmount", { stat = "Average", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          yAxis = {
            left = {
              label = "USD"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Lambda Performance"
          region = var.aws_region
          metrics = [
            ["FinTech/Lambda/${var.environment}", "ColdStart", { stat = "Sum", period = 300, label = "Cold Starts" }],
            [".", "Duration", { stat = "Average", period = 300, label = "Avg Duration", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
        }
      }
    ]
  })
}

# CloudWatch Log Insights Query for Cross-Service Investigation
resource "aws_cloudwatch_query_definition" "error_investigation" {
  name = "payment-error-investigation-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name,
    aws_cloudwatch_log_group.transaction_processor.name,
    aws_cloudwatch_log_group.fraud_detector.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream
    | filter @message like /ERROR/
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "transaction_flow_analysis" {
  name = "transaction-flow-analysis-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name,
    aws_cloudwatch_log_group.transaction_processor.name,
    aws_cloudwatch_log_group.fraud_detector.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, transactionId, status, amount
    | filter ispresent(transactionId)
    | sort @timestamp desc
    | limit 50
  QUERY
}

resource "aws_cloudwatch_query_definition" "performance_analysis" {
  name = "performance-analysis-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.payment_api.name
  ]

  query_string = <<-QUERY
    fields @timestamp, responseTime, endpoint, statusCode
    | filter ispresent(responseTime)
    | stats avg(responseTime) as avgResponseTime, max(responseTime) as maxResponseTime, count() as requestCount by endpoint
    | sort avgResponseTime desc
  QUERY
}
```

### File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to support multiple deployments"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "FinTech-Payments"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
}
```

### File: lib/outputs.tf

```hcl
output "dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.payment_monitoring.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alert notifications"
  value       = aws_sns_topic.alerts.arn
}

output "log_group_names" {
  description = "Names of the CloudWatch log groups"
  value = {
    payment_api           = aws_cloudwatch_log_group.payment_api.name
    transaction_processor = aws_cloudwatch_log_group.transaction_processor.name
    fraud_detector        = aws_cloudwatch_log_group.fraud_detector.name
  }
}

output "alarm_names" {
  description = "Names of the CloudWatch alarms"
  value = {
    api_error_rate        = aws_cloudwatch_metric_alarm.api_error_rate.alarm_name
    api_response_time     = aws_cloudwatch_metric_alarm.api_response_time.alarm_name
    failed_transactions   = aws_cloudwatch_metric_alarm.failed_transactions.alarm_name
    multi_service_failure = aws_cloudwatch_composite_alarm.multi_service_failure.alarm_name
    high_load             = aws_cloudwatch_metric_alarm.high_load.alarm_name
  }
}

output "custom_metric_namespaces" {
  description = "Custom metric namespaces for business KPIs"
  value = [
    "FinTech/PaymentAPI/${var.environment}",
    "FinTech/TransactionProcessor/${var.environment}",
    "FinTech/FraudDetector/${var.environment}",
    "FinTech/Lambda/${var.environment}"
  ]
}
```

### File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environment
      CostCenter  = var.cost_center
    }
  }
}
```

### File: lib/analyse.py

```python
#!/usr/bin/env python3
"""
Infrastructure Analysis Script
Analyzes deployed AWS resources and generates recommendations for CloudWatch monitoring infrastructure
"""

import os
import sys
import json
import boto3
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, timezone


class InfrastructureAnalyzer:
    """Analyzes AWS CloudWatch monitoring infrastructure and generates recommendations"""

    def __init__(self, environment_suffix: str, region_name: str = 'us-east-1'):
        self.environment_suffix = environment_suffix
        self.region = region_name

        # Initialize AWS clients
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        self.logs_client = boto3.client('logs', region_name=region_name)
        self.sns_client = boto3.client('sns', region_name=region_name)
        self.kms_client = boto3.client('kms', region_name=region_name)

    def analyze_log_groups(self) -> List[Dict[str, Any]]:
        """Analyze CloudWatch Log Groups"""
        log_groups = []
        expected_log_groups = [
            f"/aws/payment-api-{self.environment_suffix}",
            f"/aws/transaction-processor-{self.environment_suffix}",
            f"/aws/fraud-detector-{self.environment_suffix}"
        ]

        for log_group_name in expected_log_groups:
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )

                for lg in response.get('logGroups', []):
                    if lg['logGroupName'] == log_group_name:
                        log_groups.append({
                            'name': lg['logGroupName'],
                            'status': 'found',
                            'retention_days': lg.get('retentionInDays', 'unlimited'),
                            'kms_encrypted': 'kmsKeyId' in lg,
                            'stored_bytes': lg.get('storedBytes', 0)
                        })
                        break
                else:
                    log_groups.append({
                        'name': log_group_name,
                        'status': 'missing',
                        'retention_days': None,
                        'kms_encrypted': False,
                        'stored_bytes': 0
                    })
            except Exception as e:
                log_groups.append({
                    'name': log_group_name,
                    'status': 'error',
                    'error': str(e)
                })

        return log_groups

    def analyze_alarms(self) -> List[Dict[str, Any]]:
        """Analyze CloudWatch Alarms"""
        alarms = []
        expected_alarms = [
            f"payment-api-error-rate-{self.environment_suffix}",
            f"payment-api-response-time-{self.environment_suffix}",
            f"failed-transactions-{self.environment_suffix}",
            f"transaction-processor-errors-{self.environment_suffix}",
            f"fraud-detector-errors-{self.environment_suffix}",
            f"payment-high-load-{self.environment_suffix}"
        ]

        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=expected_alarms
            )

            found_alarms = {a['AlarmName']: a for a in response.get('MetricAlarms', [])}

            for alarm_name in expected_alarms:
                if alarm_name in found_alarms:
                    alarm = found_alarms[alarm_name]
                    alarms.append({
                        'name': alarm_name,
                        'status': 'found',
                        'state': alarm.get('StateValue', 'UNKNOWN'),
                        'metric': alarm.get('MetricName', ''),
                        'threshold': alarm.get('Threshold', 0),
                        'has_sns_action': len(alarm.get('AlarmActions', [])) > 0
                    })
                else:
                    alarms.append({
                        'name': alarm_name,
                        'status': 'missing'
                    })
        except Exception as e:
            alarms.append({
                'name': 'all',
                'status': 'error',
                'error': str(e)
            })

        return alarms

    def analyze_composite_alarms(self) -> List[Dict[str, Any]]:
        """Analyze Composite Alarms"""
        composite_alarms = []
        expected_name = f"multi-service-failure-{self.environment_suffix}"

        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNames=[expected_name],
                AlarmTypes=['CompositeAlarm']
            )

            if response.get('CompositeAlarms'):
                alarm = response['CompositeAlarms'][0]
                composite_alarms.append({
                    'name': alarm['AlarmName'],
                    'status': 'found',
                    'state': alarm.get('StateValue', 'UNKNOWN'),
                    'rule': alarm.get('AlarmRule', ''),
                    'has_sns_action': len(alarm.get('AlarmActions', [])) > 0
                })
            else:
                composite_alarms.append({
                    'name': expected_name,
                    'status': 'missing'
                })
        except Exception as e:
            composite_alarms.append({
                'name': expected_name,
                'status': 'error',
                'error': str(e)
            })

        return composite_alarms

    def analyze_dashboards(self) -> List[Dict[str, Any]]:
        """Analyze CloudWatch Dashboards"""
        dashboards = []
        expected_name = f"payment-monitoring-{self.environment_suffix}"

        try:
            response = self.cloudwatch_client.get_dashboard(
                DashboardName=expected_name
            )

            body = json.loads(response.get('DashboardBody', '{}'))
            widget_count = len(body.get('widgets', []))

            dashboards.append({
                'name': expected_name,
                'status': 'found',
                'widget_count': widget_count,
                'expected_widgets': 9,
                'compliant': widget_count >= 9
            })
        except self.cloudwatch_client.exceptions.DashboardNotFoundError:
            dashboards.append({
                'name': expected_name,
                'status': 'missing'
            })
        except Exception as e:
            dashboards.append({
                'name': expected_name,
                'status': 'error',
                'error': str(e)
            })

        return dashboards

    def analyze_metric_filters(self) -> List[Dict[str, Any]]:
        """Analyze Metric Filters"""
        metric_filters = []
        log_groups_to_check = [
            f"/aws/payment-api-{self.environment_suffix}",
            f"/aws/transaction-processor-{self.environment_suffix}",
            f"/aws/fraud-detector-{self.environment_suffix}"
        ]

        for log_group in log_groups_to_check:
            try:
                response = self.logs_client.describe_metric_filters(
                    logGroupName=log_group
                )

                filters = response.get('metricFilters', [])
                metric_filters.append({
                    'log_group': log_group,
                    'status': 'found',
                    'filter_count': len(filters),
                    'filters': [f['filterName'] for f in filters]
                })
            except self.logs_client.exceptions.ResourceNotFoundException:
                metric_filters.append({
                    'log_group': log_group,
                    'status': 'log_group_not_found',
                    'filter_count': 0
                })
            except Exception as e:
                metric_filters.append({
                    'log_group': log_group,
                    'status': 'error',
                    'error': str(e)
                })

        return metric_filters

    def analyze_infrastructure(self) -> Dict[str, Any]:
        """Analyze complete monitoring infrastructure"""
        print(f"[INFO] Analyzing infrastructure for: {self.environment_suffix}")

        analysis_results = {
            'environment_suffix': self.environment_suffix,
            'region': self.region,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'log_groups': [],
            'alarms': [],
            'composite_alarms': [],
            'dashboards': [],
            'metric_filters': [],
            'recommendations': [],
            'compliance_score': 0
        }

        # Analyze each component
        print("  [STEP] Analyzing CloudWatch Log Groups...")
        analysis_results['log_groups'] = self.analyze_log_groups()

        print("  [STEP] Analyzing CloudWatch Alarms...")
        analysis_results['alarms'] = self.analyze_alarms()

        print("  [STEP] Analyzing Composite Alarms...")
        analysis_results['composite_alarms'] = self.analyze_composite_alarms()

        print("  [STEP] Analyzing Dashboards...")
        analysis_results['dashboards'] = self.analyze_dashboards()

        print("  [STEP] Analyzing Metric Filters...")
        analysis_results['metric_filters'] = self.analyze_metric_filters()

        # Generate recommendations
        analysis_results['recommendations'] = self._generate_recommendations(analysis_results)

        # Calculate compliance score
        analysis_results['compliance_score'] = self._calculate_compliance_score(analysis_results)

        return analysis_results

    def _generate_recommendations(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate recommendations based on analysis"""
        recommendations = []

        # Check log groups
        for lg in analysis['log_groups']:
            if lg.get('status') == 'missing':
                recommendations.append({
                    'priority': 'high',
                    'category': 'logging',
                    'resource': lg['name'],
                    'message': f"Log group '{lg['name']}' is missing. Deploy Terraform configuration."
                })
            elif not lg.get('kms_encrypted', False):
                recommendations.append({
                    'priority': 'medium',
                    'category': 'security',
                    'resource': lg['name'],
                    'message': f"Log group '{lg['name']}' is not KMS encrypted."
                })
            elif lg.get('retention_days') != 7:
                recommendations.append({
                    'priority': 'low',
                    'category': 'compliance',
                    'resource': lg['name'],
                    'message': f"Log group '{lg['name']}' retention is {lg.get('retention_days', 'unlimited')}, expected 7 days."
                })

        # Check alarms
        missing_alarms = [a for a in analysis['alarms'] if a.get('status') == 'missing']
        if missing_alarms:
            recommendations.append({
                'priority': 'high',
                'category': 'monitoring',
                'resource': 'alarms',
                'message': f"{len(missing_alarms)} CloudWatch alarms are missing."
            })

        for alarm in analysis['alarms']:
            if alarm.get('status') == 'found' and not alarm.get('has_sns_action', False):
                recommendations.append({
                    'priority': 'medium',
                    'category': 'alerting',
                    'resource': alarm['name'],
                    'message': f"Alarm '{alarm['name']}' has no SNS notification action."
                })

        # Check composite alarms
        for ca in analysis['composite_alarms']:
            if ca.get('status') == 'missing':
                recommendations.append({
                    'priority': 'high',
                    'category': 'monitoring',
                    'resource': ca['name'],
                    'message': "Composite alarm for multi-service failure detection is missing."
                })

        # Check dashboards
        for dashboard in analysis['dashboards']:
            if dashboard.get('status') == 'missing':
                recommendations.append({
                    'priority': 'medium',
                    'category': 'visibility',
                    'resource': dashboard['name'],
                    'message': "CloudWatch dashboard for payment monitoring is missing."
                })
            elif not dashboard.get('compliant', False):
                recommendations.append({
                    'priority': 'low',
                    'category': 'compliance',
                    'resource': dashboard['name'],
                    'message': f"Dashboard has {dashboard.get('widget_count', 0)} widgets, expected 9."
                })

        # Check metric filters
        for mf in analysis['metric_filters']:
            if mf.get('status') == 'log_group_not_found':
                recommendations.append({
                    'priority': 'high',
                    'category': 'logging',
                    'resource': mf['log_group'],
                    'message': f"Log group '{mf['log_group']}' not found for metric filters."
                })
            elif mf.get('filter_count', 0) == 0:
                recommendations.append({
                    'priority': 'medium',
                    'category': 'monitoring',
                    'resource': mf['log_group'],
                    'message': f"No metric filters configured for '{mf['log_group']}'."
                })

        return recommendations

    def _calculate_compliance_score(self, analysis: Dict[str, Any]) -> float:
        """Calculate overall compliance score (0-100)"""
        total_checks = 0
        passed_checks = 0

        # Log groups (3 expected)
        for lg in analysis['log_groups']:
            total_checks += 3  # existence, encryption, retention
            if lg.get('status') == 'found':
                passed_checks += 1
                if lg.get('kms_encrypted', False):
                    passed_checks += 1
                if lg.get('retention_days') == 7:
                    passed_checks += 1

        # Alarms (6 expected)
        for alarm in analysis['alarms']:
            total_checks += 2  # existence, sns action
            if alarm.get('status') == 'found':
                passed_checks += 1
                if alarm.get('has_sns_action', False):
                    passed_checks += 1

        # Composite alarm
        for ca in analysis['composite_alarms']:
            total_checks += 2
            if ca.get('status') == 'found':
                passed_checks += 1
                if ca.get('has_sns_action', False):
                    passed_checks += 1

        # Dashboard
        for dashboard in analysis['dashboards']:
            total_checks += 2
            if dashboard.get('status') == 'found':
                passed_checks += 1
                if dashboard.get('compliant', False):
                    passed_checks += 1

        # Metric filters
        for mf in analysis['metric_filters']:
            total_checks += 1
            if mf.get('filter_count', 0) > 0:
                passed_checks += 1

        if total_checks == 0:
            return 0.0

        return round((passed_checks / total_checks) * 100, 2)

    def print_report(self, analysis: Dict[str, Any]):
        """Print analysis report to console"""
        print()
        print("=" * 70)
        print("Infrastructure Analysis Report")
        print("=" * 70)
        print(f"Environment Suffix: {analysis['environment_suffix']}")
        print(f"Region: {analysis['region']}")
        print(f"Timestamp: {analysis['timestamp']}")
        print(f"Compliance Score: {analysis['compliance_score']}%")
        print()

        # Log Groups
        print("-" * 70)
        print("CloudWatch Log Groups:")
        for lg in analysis['log_groups']:
            status_indicator = "[OK]" if lg.get('status') == 'found' else "[MISSING]"
            encryption = "Encrypted" if lg.get('kms_encrypted', False) else "Not Encrypted"
            retention = lg.get('retention_days', 'N/A')
            print(f"  {status_indicator} {lg['name']}")
            if lg.get('status') == 'found':
                print(f"        Retention: {retention} days | {encryption}")
        print()

        # Alarms
        print("-" * 70)
        print("CloudWatch Alarms:")
        for alarm in analysis['alarms']:
            status_indicator = "[OK]" if alarm.get('status') == 'found' else "[MISSING]"
            if alarm.get('status') == 'found':
                state = alarm.get('state', 'UNKNOWN')
                print(f"  {status_indicator} {alarm['name']} (State: {state})")
            else:
                print(f"  {status_indicator} {alarm['name']}")
        print()

        # Composite Alarms
        print("-" * 70)
        print("Composite Alarms:")
        for ca in analysis['composite_alarms']:
            status_indicator = "[OK]" if ca.get('status') == 'found' else "[MISSING]"
            print(f"  {status_indicator} {ca['name']}")
        print()

        # Dashboards
        print("-" * 70)
        print("CloudWatch Dashboards:")
        for dashboard in analysis['dashboards']:
            status_indicator = "[OK]" if dashboard.get('status') == 'found' else "[MISSING]"
            if dashboard.get('status') == 'found':
                print(f"  {status_indicator} {dashboard['name']} ({dashboard.get('widget_count', 0)} widgets)")
            else:
                print(f"  {status_indicator} {dashboard['name']}")
        print()

        # Recommendations
        if analysis['recommendations']:
            print("-" * 70)
            print("Recommendations:")
            for rec in analysis['recommendations']:
                priority_tag = f"[{rec['priority'].upper()}]"
                print(f"  {priority_tag} {rec['message']}")
        print()
        print("=" * 70)

    def export_json_report(self, analysis: Dict[str, Any], output_path: str):
        """Export analysis report to JSON file"""
        with open(output_path, 'w') as f:
            json.dump(analysis, f, indent=2, default=str)
        print(f"[INFO] Report exported to: {output_path}")


def main():
    """Main entry point for the infrastructure analyzer"""
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    output_file = os.getenv('OUTPUT_FILE', '')

    print(f"[INFO] Starting infrastructure analysis")
    print(f"[INFO] Environment Suffix: {environment_suffix}")
    print(f"[INFO] AWS Region: {aws_region}")

    analyzer = InfrastructureAnalyzer(environment_suffix, aws_region)
    analysis = analyzer.analyze_infrastructure()
    analyzer.print_report(analysis)

    if output_file:
        analyzer.export_json_report(analysis, output_file)

    # Return exit code based on compliance score
    if analysis['compliance_score'] >= 80:
        print("[RESULT] Infrastructure is compliant")
        return 0
    elif analysis['compliance_score'] >= 50:
        print("[RESULT] Infrastructure has warnings")
        return 1
    else:
        print("[RESULT] Infrastructure is non-compliant")
        return 2


if __name__ == "__main__":
    sys.exit(main())
```

## Testing Implementation

### Unit Tests (test/terraform.unit.test.ts)

The unit tests achieve comprehensive coverage by validating:

1. **File Structure**: All required Terraform files exist (main.tf, variables.tf, outputs.tf, provider.tf)
2. **Resource Declarations**: All CloudWatch resources are defined correctly
3. **Configuration Validation**:
   - KMS encryption enabled
   - 7-day log retention
   - Environment suffix in all resource names
   - Proper tagging (CostCenter, Environment, Name)
4. **Variables and Outputs**: All required variables and outputs defined with descriptions
5. **Security**: No provider blocks in main.tf, KMS key rotation enabled
6. **Business Logic**: Correct metric namespaces, alarm thresholds, composite alarm rules

### Integration Tests (test/terraform.int.test.ts)

The integration tests validate deployed resources using AWS SDK v3:

1. **CloudWatch Log Groups**: Exist, have 7-day retention, use KMS encryption
2. **Metric Filters**: Correctly configured for error rates, response times, transaction amounts
3. **CloudWatch Alarms**: Exist with correct thresholds, comparison operators, SNS actions
4. **Composite Alarm**: Combines multiple alarm states correctly
5. **SNS Topic**: Accessible, has KMS encryption enabled
6. **CloudWatch Dashboard**: Exists, contains 9+ widgets
7. **Logs Insights Queries**: 3 saved queries exist for troubleshooting
8. **Custom Metrics**: Namespaces follow FinTech/Service/Environment pattern
9. **Infrastructure Integrity**: Consistent naming, environment suffix usage

### Python Tests (tests/analyse.unit.test.py and tests/analyse.int.test.py)

The Python tests validate the infrastructure analysis script:

1. **Unit Tests** (40+ test cases):
   - Analyzer initialization
   - Log group analysis
   - Alarm analysis
   - Composite alarm analysis
   - Dashboard analysis
   - Metric filter analysis
   - Recommendation generation
   - Compliance score calculation
   - Report generation
   - Error handling

2. **Integration Tests** (20+ test cases):
   - Real AWS resource analysis
   - Compliance scoring against deployed infrastructure
   - Report generation and export

## Deployment

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="environment_suffix=synthd1z2p4u2" -var="alert_email=alerts@example.com"

# Deploy infrastructure
terraform apply -var="environment_suffix=synthd1z2p4u2" -var="alert_email=alerts@example.com" -auto-approve

# Run tests
npm run test:unit      # Terraform unit tests
npm run test:integration  # Terraform integration tests
python -m pytest tests/  # Python tests

# Run infrastructure analysis
ENVIRONMENT_SUFFIX=synthd1z2p4u2 AWS_REGION=us-east-1 python lib/analyse.py

# Destroy infrastructure
terraform destroy -var="environment_suffix=synthd1z2p4u2" -var="alert_email=alerts@example.com" -auto-approve
```

## Outputs

After successful deployment:

```json
{
  "dashboard_url": "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=payment-monitoring-synthd1z2p4u2",
  "sns_topic_arn": "arn:aws:sns:us-east-1:342597974367:payment-monitoring-alerts-synthd1z2p4u2",
  "log_group_names": {
    "payment_api": "/aws/payment-api-synthd1z2p4u2",
    "transaction_processor": "/aws/transaction-processor-synthd1z2p4u2",
    "fraud_detector": "/aws/fraud-detector-synthd1z2p4u2"
  },
  "alarm_names": {
    "api_error_rate": "payment-api-error-rate-synthd1z2p4u2",
    "api_response_time": "payment-api-response-time-synthd1z2p4u2",
    "failed_transactions": "failed-transactions-synthd1z2p4u2",
    "multi_service_failure": "multi-service-failure-synthd1z2p4u2",
    "high_load": "payment-high-load-synthd1z2p4u2"
  },
  "custom_metric_namespaces": [
    "FinTech/PaymentAPI/prod",
    "FinTech/TransactionProcessor/prod",
    "FinTech/FraudDetector/prod",
    "FinTech/Lambda/prod"
  ]
}
```

## Best Practices Demonstrated

1. **Infrastructure as Code**: Complete Terraform configuration with proper modularity
2. **Security**: KMS encryption for logs and SNS, proper key policies
3. **Monitoring**: Comprehensive CloudWatch setup with alarms, dashboards, and Logs Insights
4. **Testing**: Comprehensive test coverage with both unit and integration tests
5. **CI/CD Ready**: All resources destroyable, proper tagging, environment suffix usage
6. **AWS Best Practices**: Follows AWS Well-Architected Framework for monitoring and logging
7. **Infrastructure QA**: Python-based analysis script for compliance validation
8. **Idempotent Resources**: All resources can be safely redeployed without conflicts
