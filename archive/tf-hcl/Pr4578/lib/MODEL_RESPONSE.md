I'll create a comprehensive CloudWatch analytics system for your enterprise monitoring needs. Here's the complete Terraform setup with all the required components:

```hcl
# main.tf

# SNS Topic for Alerts
resource "aws_sns_topic" "cloudwatch_alerts" {
  name              = "${var.project_name}-cloudwatch-alerts"
  kms_master_key_id = aws_kms_key.monitoring.id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-cloudwatch-alerts"
  })
}

resource "aws_sns_topic_subscription" "alert_email" {
  for_each = toset(var.alert_email_addresses)

  topic_arn = aws_sns_topic.cloudwatch_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# KMS Key for Encryption
resource "aws_kms_key" "monitoring" {
  description             = "KMS key for ${var.project_name} monitoring resources"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-monitoring-key"
  })
}

resource "aws_kms_alias" "monitoring" {
  name          = "alias/${var.project_name}-monitoring"
  target_key_id = aws_kms_key.monitoring.key_id
}

# DynamoDB Table for Aggregated Logs
resource "aws_dynamodb_table" "aggregated_logs" {
  name             = "${var.project_name}-aggregated-logs"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "metricId"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.monitoring.arn
  }

  attribute {
    name = "metricId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "dateHour"
    type = "S"
  }

  global_secondary_index {
    name            = "dateHour-timestamp-index"
    hash_key        = "dateHour"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-aggregated-logs"
  })
}

# EventBridge Rule for Metric Aggregation
resource "aws_cloudwatch_event_rule" "metric_aggregation" {
  name                = "${var.project_name}-metric-aggregation"
  description         = "Trigger metric aggregation every ${var.aggregation_interval_minutes} minutes"
  schedule_expression = "rate(${var.aggregation_interval_minutes} minutes)"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-metric-aggregation-rule"
  })
}

# Lambda Function for Metric Aggregation
resource "aws_lambda_function" "metric_aggregator" {
  filename         = data.archive_file.metric_aggregator.output_path
  function_name    = "${var.project_name}-metric-aggregator"
  role            = aws_iam_role.metric_aggregator.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.metric_aggregator.output_base64sha256
  runtime         = "python3.9"
  timeout         = 300
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.aggregated_logs.name
      LOG_LEVEL          = var.log_level
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-metric-aggregator"
  })
}

resource "aws_cloudwatch_event_target" "metric_aggregation_lambda" {
  rule      = aws_cloudwatch_event_rule.metric_aggregation.name
  target_id = "MetricAggregatorLambda"
  arn       = aws_lambda_function.metric_aggregator.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.metric_aggregator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.metric_aggregation.arn
}

# Archive file for Lambda deployment
data "archive_file" "metric_aggregator" {
  type        = "zip"
  output_path = "/tmp/metric_aggregator.zip"

  source {
    content  = file("${path.module}/lambda/metric_aggregator.py")
    filename = "index.py"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.project_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.monitoring.arn

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-api-gateway-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.monitoring.arn

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-lambda-logs"
  })
}
```

```hcl
# provider.tf

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    # Configure your backend settings
    # bucket = "your-terraform-state-bucket"
    # key    = "monitoring/terraform.tfstate"
    # region = "us-east-1"
    # encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}
```

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "enterprise-monitoring"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "alert_email_addresses" {
  description = "Email addresses to receive CloudWatch alerts"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "api_latency_threshold" {
  description = "API latency threshold in milliseconds"
  type        = number
  default     = 1000
}

variable "api_error_rate_threshold" {
  description = "API error rate threshold percentage"
  type        = number
  default     = 5
}

variable "lambda_error_threshold" {
  description = "Lambda error count threshold"
  type        = number
  default     = 10
}

variable "lambda_duration_threshold" {
  description = "Lambda duration threshold in milliseconds"
  type        = number
  default     = 3000
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold percentage"
  type        = number
  default     = 80
}

variable "rds_connection_threshold" {
  description = "RDS database connection threshold"
  type        = number
  default     = 100
}

variable "aggregation_interval_minutes" {
  description = "Interval for metric aggregation in minutes"
  type        = number
  default     = 5
}

variable "alarm_evaluation_periods" {
  description = "Number of periods to evaluate for alarms"
  type        = number
  default     = 2
}

variable "alarm_period_seconds" {
  description = "Period in seconds for alarm evaluation"
  type        = number
  default     = 300
}

variable "log_level" {
  description = "Log level for Lambda functions"
  type        = string
  default     = "INFO"
  validation {
    condition     = contains(["DEBUG", "INFO", "WARNING", "ERROR"], var.log_level)
    error_message = "Log level must be one of: DEBUG, INFO, WARNING, ERROR"
  }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "CloudWatch Analytics"
    ManagedBy   = "Terraform"
    CostCenter  = "Engineering"
  }
}

# Resource references (these would be provided by your existing infrastructure)
variable "api_gateway_name" {
  description = "Name of the API Gateway to monitor"
  type        = string
  default     = ""
}

variable "lambda_function_names" {
  description = "List of Lambda function names to monitor"
  type        = list(string)
  default     = []
}

variable "rds_instance_identifier" {
  description = "RDS instance identifier to monitor"
  type        = string
  default     = ""
}
```

```hcl
# outputs.tf

output "cloudwatch_dashboard_url" {
  description = "URL to access the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.cloudwatch_alerts.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for aggregated logs"
  value       = aws_dynamodb_table.aggregated_logs.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.aggregated_logs.arn
}

output "metric_aggregator_lambda_arn" {
  description = "ARN of the metric aggregator Lambda function"
  value       = aws_lambda_function.metric_aggregator.arn
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge rule for metric aggregation"
  value       = aws_cloudwatch_event_rule.metric_aggregation.arn
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.monitoring.id
}

output "alarm_arns" {
  description = "Map of alarm names to their ARNs"
  value = {
    api_latency    = aws_cloudwatch_metric_alarm.api_latency.arn
    api_errors     = aws_cloudwatch_metric_alarm.api_errors.arn
    lambda_errors  = [for alarm in aws_cloudwatch_metric_alarm.lambda_errors : alarm.arn]
    lambda_duration = [for alarm in aws_cloudwatch_metric_alarm.lambda_duration : alarm.arn]
    rds_cpu        = try(aws_cloudwatch_metric_alarm.rds_cpu[0].arn, "")
    rds_connections = try(aws_cloudwatch_metric_alarm.rds_connections[0].arn, "")
  }
}

output "log_group_names" {
  description = "CloudWatch log group names"
  value = {
    api_gateway = aws_cloudwatch_log_group.api_gateway_logs.name
    lambda      = aws_cloudwatch_log_group.lambda_logs.name
  }
}
```

```hcl
# iam.tf

# IAM Role for Metric Aggregator Lambda
resource "aws_iam_role" "metric_aggregator" {
  name = "${var.project_name}-metric-aggregator-role"

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

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-metric-aggregator-role"
  })
}

# IAM Policy for Metric Aggregator
resource "aws_iam_policy" "metric_aggregator" {
  name        = "${var.project_name}-metric-aggregator-policy"
  description = "Policy for metric aggregator Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:GetMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.aggregated_logs.arn,
          "${aws_dynamodb_table.aggregated_logs.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.monitoring.arn
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-metric-aggregator-policy"
  })
}

resource "aws_iam_role_policy_attachment" "metric_aggregator" {
  policy_arn = aws_iam_policy.metric_aggregator.arn
  role       = aws_iam_role.metric_aggregator.name
}

# Service role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-api-gateway-cloudwatch-role"
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
  role       = aws_iam_role.api_gateway_cloudwatch.name
}

# IAM Policy for CloudWatch to publish to SNS
resource "aws_sns_topic_policy" "cloudwatch_alerts" {
  arn = aws_sns_topic.cloudwatch_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.cloudwatch_alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

data "aws_caller_identity" "current" {}
```

```hcl
# monitoring.tf

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-main"

  dashboard_body = jsonencode({
    widgets = [
      # API Gateway Metrics
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "API Requests" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Request Count and Errors"
          period  = 300
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", { stat = "Average", label = "Average Latency" }],
            [".", ".", { stat = "p99", label = "P99 Latency" }],
            [".", ".", { stat = "p95", label = "P95 Latency" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Latency"
          period  = 300
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      # Lambda Metrics
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }],
            [".", "Errors", { stat = "Sum" }],
            [".", "Throttles", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average" }],
            [".", ".", { stat = "p99" }],
            [".", ".", { stat = "Maximum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Duration"
          period  = 300
        }
      },
      # RDS Metrics
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { "stat": "Average" }],
            [".", "DatabaseConnections", { "stat": "Average" }],
            [".", "FreeableMemory", { "stat": "Average", "yAxis": "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS Performance Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ReadLatency", { "stat": "Average" }],
            [".", "WriteLatency", { "stat": "Average" }],
            [".", "ReadThroughput", { "stat": "Average", "yAxis": "right" }],
            [".", "WriteThroughput", { "stat": "Average", "yAxis": "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS I/O Metrics"
          period  = 300
        }
      }
    ]
  })
}

# API Gateway Alarms
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.api_latency_threshold
  alarm_description   = "API Gateway latency is above ${var.api_latency_threshold}ms"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = var.api_gateway_name
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-api-high-latency"
  })
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.project_name}-api-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  threshold           = var.api_error_rate_threshold
  alarm_description   = "API Gateway error rate is above ${var.api_error_rate_threshold}%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "e1"
    expression  = "(m2+m3)/m1*100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        ApiName = var.api_gateway_name
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "4XXError"
      namespace   = "AWS/ApiGateway"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        ApiName = var.api_gateway_name
      }
    }
  }

  metric_query {
    id = "m3"
    metric {
      metric_name = "5XXError"
      namespace   = "AWS/ApiGateway"
      period      = var.alarm_period_seconds
      stat        = "Sum"
      dimensions = {
        ApiName = var.api_gateway_name
      }
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-api-high-error-rate"
  })
}

# Lambda Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.project_name}-lambda-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period_seconds
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Lambda function ${each.key} errors exceed ${var.lambda_error_threshold}"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.key
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-lambda-${each.key}-errors"
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.project_name}-lambda-${each.key}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.lambda_duration_threshold
  alarm_description   = "Lambda function ${each.key} duration exceeds ${var.lambda_duration_threshold}ms"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.key
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-lambda-${each.key}-duration"
  })
}

# RDS Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  count = var.rds_instance_identifier != "" ? 1 : 0

  alarm_name          = "${var.project_name}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_description   = "RDS CPU utilization is above ${var.rds_cpu_threshold}%"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-rds-high-cpu"
  })
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  count = var.rds_instance_identifier != "" ? 1 : 0

  alarm_name          = "${var.project_name}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = var.alarm_period_seconds
  statistic           = "Average"
  threshold           = var.rds_connection_threshold
  alarm_description   = "RDS connections exceed ${var.rds_connection_threshold}"
  alarm_actions       = [aws_sns_topic.cloudwatch_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-rds-high-connections"
  })
}

# Metric Filters for Custom Metrics
resource "aws_cloudwatch_log_metric_filter" "api_gateway_errors" {
  name           = "${var.project_name}-api-gateway-errors"
  log_group_name = aws_cloudwatch_log_group.api_gateway_logs.name
  pattern        = "[timestamp, request_id, event_type=ERROR*, ...]"

  metric_transformation {
    name      = "APIGatewayErrors"
    namespace = "${var.project_name}/APIGateway"
    value     = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "lambda_cold_starts" {
  name           = "${var.project_name}-lambda-cold-starts"
  log_group_name = aws_cloudwatch_log_group.lambda_logs.name
  pattern        = "[timestamp, request_id, event_type=REPORT, ..., duration, billed_duration, memory_size, max_memory_used, init_duration>0]"

  metric_transformation {
    name      = "LambdaColdStarts"
    namespace = "${var.project_name}/Lambda"
    value     = "1"
    default_value = "0"
  }
}
```

```md
# deployment-guide.md

# CloudWatch Analytics System Deployment Guide

## Prerequisites

1. **AWS Account**: Ensure you have an AWS account with appropriate permissions
2. **Terraform**: Install Terraform (v1.0+) on your local machine
3. **AWS CLI**: Install and configure AWS CLI with valid credentials
4. **S3 Backend Bucket**: Create an S3 bucket for Terraform state storage
5. **Email Verification**: Have access to email addresses for alert notifications

## Pre-deployment Setup

### 1. Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and preferred region
```

### 2. Create Terraform Backend Bucket

```bash
aws s3 mb s3://your-terraform-state-bucket-name --region us-east-1
aws s3api put-bucket-versioning --bucket your-terraform-state-bucket-name --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket your-terraform-state-bucket-name --server-side-encryption-configuration file://encryption.json
```

### 3. Create Lambda Function Code

Create a directory `lambda` and add the metric aggregator function:

```python
# lambda/metric_aggregator.py
import json
import boto3
import os
from datetime import datetime, timedelta
from decimal import Decimal

cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

def handler(event, context):
    """Aggregate CloudWatch metrics and store in DynamoDB"""
    
    # Define metrics to aggregate
    metrics_to_aggregate = [
        {
            'namespace': 'AWS/ApiGateway',
            'metric_name': 'Count',
            'dimensions': [],
            'stat': 'Sum'
        },
        {
            'namespace': 'AWS/ApiGateway',
            'metric_name': 'Latency',
            'dimensions': [],
            'stat': 'Average'
        },
        {
            'namespace': 'AWS/Lambda',
            'metric_name': 'Invocations',
            'dimensions': [],
            'stat': 'Sum'
        },
        {
            'namespace': 'AWS/Lambda',
            'metric_name': 'Duration',
            'dimensions': [],
            'stat': 'Average'
        }
    ]
    
    # Get metrics for the last 5 minutes
    end_time = datetime.now()
    start_time = end_time - timedelta(minutes=5)
    
    for metric in metrics_to_aggregate:
        try:
            response = cloudwatch.get_metric_statistics(
                Namespace=metric['namespace'],
                MetricName=metric['metric_name'],
                Dimensions=metric['dimensions'],
                StartTime=start_time,
                EndTime=end_time,
                Period=300,
                Statistics=[metric['stat']]
            )
            
            if response['Datapoints']:
                datapoint = response['Datapoints'][0]
                
                # Store in DynamoDB
                table.put_item(
                    Item={
                        'metricId': f"{metric['namespace']}/{metric['metric_name']}",
                        'timestamp': int(datapoint['Timestamp'].timestamp()),
                        'dateHour': datapoint['Timestamp'].strftime('%Y-%m-%d-%H'),
                        'value': Decimal(str(datapoint[metric['stat']])),
                        'unit': datapoint['Unit'],
                        'stat': metric['stat']
                    }
                )
                
        except Exception as e:
            print(f"Error aggregating metric {metric['metric_name']}: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Metrics aggregated successfully')
    }
```

### 4. Configure terraform.tfvars

Create a `terraform.tfvars` file with your configuration:

```hcl
# terraform.tfvars
aws_region            = "us-east-1"
project_name          = "enterprise-monitoring"
environment           = "production"
alert_email_addresses = ["ops-team@company.com", "oncall@company.com"]

# Existing resources to monitor
api_gateway_name      = "my-api-gateway"
lambda_function_names = ["order-processor", "payment-handler", "notification-service"]
rds_instance_identifier = "production-db"

# Alarm thresholds
api_latency_threshold    = 1000  # milliseconds
api_error_rate_threshold = 5     # percentage
lambda_error_threshold   = 10    # count
lambda_duration_threshold = 3000  # milliseconds
rds_cpu_threshold        = 80    # percentage
rds_connection_threshold = 100   # count

common_tags = {
  Environment = "production"
  Team        = "DevOps"
  Project     = "CloudWatch Analytics"
  CostCenter  = "Engineering"
  ManagedBy   = "Terraform"
}
```

### 5. Update provider.tf Backend Configuration

Update the backend configuration in `provider.tf`:

```hcl
backend "s3" {
  bucket  = "your-terraform-state-bucket-name"
  key     = "monitoring/terraform.tfstate"
  region  = "us-east-1"
  encrypt = true
}
```

## Deployment Steps

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Validate Configuration

```bash
terraform validate
terraform fmt
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### 5. Verify Email Subscriptions

After deployment, check the email addresses specified in `alert_email_addresses`. Each recipient will receive a confirmation email from AWS SNS. Click the confirmation link to activate alerts.

## Post-deployment Verification

### 1. Check CloudWatch Dashboard

Access the dashboard URL from Terraform outputs:

```bash
terraform output cloudwatch_dashboard_url
```

### 2. Verify Alarms

List all created alarms:

```bash
aws cloudwatch describe-alarms --alarm-name-prefix enterprise-monitoring
```

### 3. Test SNS Notifications

Manually trigger a test alarm:

```bash
aws cloudwatch set-alarm-state --alarm-name enterprise-monitoring-api-high-latency --state-value ALARM --state-reason "Testing alarm notification"
```

### 4. Check DynamoDB Table

Verify the aggregated logs table:

```bash
aws dynamodb describe-table --table-name enterprise-monitoring-aggregated-logs
```

## Monitoring and Maintenance

### 1. Regular Tasks

- Review CloudWatch costs weekly
- Adjust alarm thresholds based on baseline metrics
- Clean up old DynamoDB entries (implement TTL if needed)
- Update Lambda function code as requirements change

### 2. Cost Optimization

- Use CloudWatch Logs Insights for ad-hoc queries instead of storing everything
- Implement lifecycle policies for log retention
- Consider using CloudWatch Contributor Insights for top talkers

### 3. Scaling Considerations

- For >100k daily interactions, consider:
  - Enabling DynamoDB auto-scaling
  - Using Kinesis Data Firehose for log aggregation
  - Implementing CloudWatch Composite Alarms for complex scenarios

## Troubleshooting

### Common Issues

1. **SNS emails not received**
   - Check spam folder
   - Verify email addresses in tfvars
   - Check SNS topic subscription status

2. **Lambda aggregator failures**
   - Check CloudWatch Logs for the Lambda function
   - Verify IAM permissions
   - Ensure DynamoDB table is accessible

3. **Missing metrics**
   - Verify API Gateway/Lambda/RDS names in tfvars
   - Check if services are generating metrics
   - Verify IAM roles for services

4. **High costs**
   - Review number of custom metrics
   - Adjust log retention periods
   - Consider using metric math instead of multiple metrics

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all monitoring infrastructure including stored logs and metrics.

## Additional Resources

- [AWS CloudWatch Best Practices](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Best_Practice_Recommended_Alarms_AWS_Services.html)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework - Operational Excellence](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html)

```

```md
# architecture-diagram.md

# CloudWatch Analytics System Architecture

## System Overview

The CloudWatch Analytics System provides comprehensive monitoring and alerting for API Gateway, Lambda functions, and RDS instances, processing ~100k daily interactions with real-time dashboards and proactive alerts.

## Architecture Diagram

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CloudWatch Analytics System                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                    │
│  │ API Gateway  │     │   Lambda     │     │     RDS      │                    │
│  │              ├────▶│  Functions   ├────▶│  Database    │                    │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘                    │
│         │                    │                     │                             │
│         │ Metrics            │ Metrics            │ Metrics                     │
│         ▼                    ▼                     ▼                             │
│  ┌────────────────────────────────────────────────────────────┐                │
│  │                     CloudWatch Metrics                      │                │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │                │
│  │  │  Latency    │  │   Errors    │  │ Throughput  │        │                │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │                │
│  └────────────┬────────────────────────────┬──────────────────┘                │
│               │                            │                                     │
│               ▼                            ▼                                     │
│  ┌──────────────────────┐      ┌─────────────────────────┐                    │
│  │  CloudWatch Alarms   │      │  CloudWatch Dashboard   │                    │
│  │ ┌─────────────────┐  │      │ ┌────────────────────┐  │                    │
│  │ │ Latency > 1s    │  │      │ │  Real-time Graphs  │  │                    │
│  │ ├─────────────────┤  │      │ ├────────────────────┤  │                    │
│  │ │ Error Rate > 5% │  │      │ │  API Performance   │  │◀─── Operations     │
│  │ ├─────────────────┤  │      │ ├────────────────────┤  │     Team           │
│  │ │ CPU > 80%       │  │      │ │  Lambda Metrics    │  │                    │
│  │ └────────┬────────┘  │      │ ├────────────────────┤  │                    │
│  └──────────┼───────────┘      │ │  RDS Performance   │  │                    │
│             │                   │ └────────────────────┘  │                    │
│             ▼                   └─────────────────────────┘                    │
│  ┌──────────────────────┐                                                      │
│  │    SNS Topic         │                                                      │
│  │  ┌──────────────┐    │                                                      │
│  │  │Email Alerts  │────┼────────────────────────────────▶ Operations Team    │
│  │  └──────────────┘    │                                                      │
│  └──────────────────────┘                                                      │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────┐                │
│  │               Metric Aggregation Pipeline                   │                │
│  │                                                             │                │
│  │  ┌────────────────┐         ┌─────────────────┐           │                │
│  │  │  EventBridge   │         │ Lambda Function │           │                │
│  │  │  (5 min rule)  ├────────▶│  (Aggregator)   │           │                │
│  │  └────────────────┘         └────────┬────────┘           │                │
│  │                                       │                     │                │
│  │                                       ▼                     │                │
│  │                            ┌─────────────────────┐         │                │
│  │                            │    DynamoDB         │         │                │
│  │                            │ ┌─────────────────┐ │         │                │
│  │                            │ │ Aggregated Logs │ │         │                │
│  │                            │ │   Time Series   │ │         │                │
│  │                            │ └─────────────────┘ │         │                │
│  │                            └─────────────────────┘         │                │
│  └──────────────────────────────────────────────────────────┘                │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────┐                │
│  │                    Security Layer                          │                │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │                │
│  │  │   KMS Key   │  │ IAM Roles    │  │ Least Privilege│   │                │
│  │  │ Encryption  │  │ & Policies   │  │   Policies     │   │                │
│  │  └─────────────┘  └──────────────┘  └────────────────┘   │                │
│  └──────────────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## Data Flow

### 1. Metric Collection Flow
```

Application Services → CloudWatch Metrics → CloudWatch Service
    │                                              │
    ├─ API Gateway Metrics                        │
    │  • Request Count                            │
    │  • Latency (Avg, P95, P99)                │
    │  • 4XX/5XX Errors                          │
    │                                              │
    ├─ Lambda Metrics                             │
    │  • Invocations                             │
    │  • Duration                                │
    │  • Errors                                  │
    │  • Throttles                               │
    │                                              │
    └─ RDS Metrics                                │
       • CPU Utilization                          │
       • Database Connections                     │
       • Read/Write Latency                       │
       • Read/Write Throughput                    │
                                                   ▼
                                        CloudWatch Processing

```

### 2. Alerting Flow
```

CloudWatch Metrics → CloudWatch Alarms → SNS Topic → Email Notifications
                            │                              │
                            ├─ Threshold Breached         │
                            │                              │
                            └─ Evaluation:                 │
                               • 2 periods of 5 min        │
                               • Statistic: Average        │
                               • Missing data: OK          │
                                                           ▼
                                                    Operations Team

```

### 3. Aggregation Flow
```

EventBridge (5 min) → Lambda Aggregator → CloudWatch GetMetrics API
                            │                        │
                            │                        ▼
                            │                 Process & Transform
                            │                        │
                            └────────────────────────┤
                                                     ▼
                                              DynamoDB PutItem
                                                     │
                                        ┌────────────┴────────────┐
                                        │     Stored Format       │
                                        │ • MetricId (Hash Key)  │
                                        │ • Timestamp (Range)    │
                                        │ • Value               │
                                        │ • DateHour (GSI)      │
                                        └─────────────────────────┘

```

## Component Details

### CloudWatch Components

#### Dashboards
- **Main Dashboard**: Unified view of all critical metrics
- **Widget Layout**: 
  - Row 1: API Gateway request metrics and latency
  - Row 2: Lambda invocation metrics and duration
  - Row 3: RDS performance and I/O metrics
- **Refresh Rate**: 5-minute auto-refresh
- **Time Range**: Last 3 hours default, adjustable

#### Alarms
- **API Gateway Alarms**:
  - High Latency: > 1000ms average over 10 minutes
  - High Error Rate: > 5% 4XX/5XX over 10 minutes
- **Lambda Alarms**:
  - Error Count: > 10 errors in 10 minutes
  - High Duration: > 3000ms average over 10 minutes
- **RDS Alarms**:
  - High CPU: > 80% average over 10 minutes
  - High Connections: > 100 connections average

#### Log Groups
- **Retention**: 30 days default
- **Encryption**: KMS encrypted
- **Metric Filters**: Extract custom metrics from logs

### Data Storage

#### DynamoDB Table
- **Partition Key**: metricId (String)
- **Sort Key**: timestamp (Number)
- **Global Secondary Index**: dateHour-timestamp-index
- **Capacity**: On-demand billing
- **Point-in-time Recovery**: Enabled
- **Stream**: Enabled for change data capture

### Security Architecture

#### Encryption
- **At Rest**: KMS encryption for DynamoDB, CloudWatch Logs
- **In Transit**: TLS 1.2 for all API calls
- **Key Rotation**: Automatic annual rotation

#### IAM Roles
1. **Lambda Aggregator Role**:
   - CloudWatch: GetMetricStatistics, ListMetrics
   - DynamoDB: PutItem, UpdateItem, Query
   - KMS: Decrypt, GenerateDataKey
   
2. **API Gateway Role**:
   - CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents

#### Network Security
- All services communicate via AWS internal network
- No internet-facing components except API Gateway
- VPC endpoints can be added for additional isolation

## High Availability & Scalability

### Availability
- **CloudWatch**: Multi-AZ by default
- **DynamoDB**: Multi-AZ with automatic failover
- **Lambda**: Multi-AZ execution
- **SNS**: Regional service with high availability

### Scalability
- **Metric Ingestion**: Auto-scales with load
- **Dashboard Queries**: Cached for performance
- **DynamoDB**: On-demand scaling
- **Lambda Concurrency**: Up to 1000 concurrent executions

### Performance Optimization
1. **Metric Aggregation**: 5-minute intervals to balance granularity and cost
2. **Dashboard Caching**: Reduces API calls
3. **Alarm Evaluation**: 2 periods to reduce false positives
4. **DynamoDB Indexes**: Optimized for time-range queries

## Cost Considerations

### Major Cost Drivers
1. **Custom Metrics**: $0.30 per metric per month
2. **API Calls**: GetMetricStatistics calls from Lambda
3. **Dashboard Queries**: Frequent refreshes increase costs
4. **Log Storage**: 30-day retention
5. **DynamoDB Storage**: Pay-per-request model

### Cost Optimization Strategies
1. Use metric math instead of multiple custom metrics
2. Implement log sampling for high-volume logs
3. Archive old DynamoDB data to S3
4. Use CloudWatch Insights for ad-hoc queries
5. Set appropriate alarm evaluation periods

## Disaster Recovery

### Backup Strategy
- **DynamoDB**: Point-in-time recovery enabled
- **Configuration**: Terraform state in versioned S3
- **CloudWatch Dashboards**: Defined as code

### Recovery Procedures
1. **Alarm Failure**: Terraform re-apply recreates alarms
2. **Dashboard Loss**: Recreate from Terraform
3. **DynamoDB Corruption**: Restore from point-in-time
4. **Regional Failure**: Deploy to alternate region

## Future Enhancements

### Phase 2 Considerations
1. **Anomaly Detection**: CloudWatch Anomaly Detector
2. **Custom Metrics**: Application-specific metrics
3. **Log Analytics**: CloudWatch Insights queries
4. **Cost Anomaly Detection**: AWS Cost Anomaly Detection
5. **Cross-Region Monitoring**: Multi-region dashboards

### Integration Opportunities
1. **PagerDuty/Opsgenie**: Advanced alerting
2. **Slack/Teams**: ChatOps integration
3. **Grafana**: Advanced visualization
4. **Datadog/New Relic**: APM integration
5. **AWS X-Ray**: Distributed tracing
```

This complete solution provides a production-ready CloudWatch analytics system that:

1. **Monitors** API Gateway, Lambda, and RDS with appropriate metrics
2. **Alerts** proactively on latency, errors, and resource utilization
3. **Stores** aggregated metrics in DynamoDB for long-term analysis
4. **Automates** metric collection using EventBridge and Lambda
5. **Secures** all resources with encryption and least-privilege access
6. **Scales** to handle 100k+ daily interactions efficiently

The architecture is designed to be cost-effective while maintaining high availability and following AWS best practices.
