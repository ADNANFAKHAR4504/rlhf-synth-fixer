# CloudWatch Advanced Observability Platform - Terraform Implementation

This implementation creates a comprehensive CloudWatch observability platform with all 10 mandatory requirements for a financial services company's distributed microservices architecture.

## Architecture Overview

The solution implements:
- CloudWatch composite alarms with complex AND/OR logic
- ARM Graviton2-based Lambda functions for custom metric processing
- CloudWatch Metric Streams to S3 with lifecycle management
- Anomaly detectors with customized thresholds
- Custom dashboards with 5+ widget types
- Metric filters extracting values from CloudWatch Logs
- SNS topics with subscription filters for alarm severity
- CloudWatch Synthetics canaries across multiple regions
- Container Insights for ECS task-level metrics
- Cross-account metric sharing

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across environments"
  type        = string
}

variable "region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for multi-region Synthetics canaries"
  type        = string
  default     = "us-west-2"
}

variable "cost_center" {
  description = "Cost center tag for billing attribution"
  type        = string
  default     = "FinOps"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "Confidential"
}

variable "metric_retention_days" {
  description = "Metric data retention in days (15 months = 450 days)"
  type        = number
  default     = 450
}

variable "cross_account_ids" {
  description = "List of AWS account IDs for cross-account observability"
  type        = list(string)
  default     = []
}

variable "ecs_cluster_name" {
  description = "ECS cluster name for Container Insights"
  type        = string
  default     = "microservices-cluster"
}

variable "monitored_endpoints" {
  description = "List of endpoints to monitor with Synthetics canaries"
  type        = list(string)
  default     = ["https://api.example.com/health", "https://app.example.com"]
}

variable "alarm_email_endpoints" {
  description = "List of email addresses for alarm notifications"
  type        = list(string)
  default     = []
}
```

## File: main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      CostCenter         = var.cost_center
      Environment        = var.environment
      DataClassification = var.data_classification
      ManagedBy          = "Terraform"
      Project            = "CloudWatch-Observability"
    }
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      CostCenter         = var.cost_center
      Environment        = var.environment
      DataClassification = var.data_classification
      ManagedBy          = "Terraform"
      Project            = "CloudWatch-Observability"
    }
  }
}

# Local values for resource naming
locals {
  name_prefix = "cw-obs-${var.environment_suffix}"

  common_tags = {
    CostCenter         = var.cost_center
    Environment        = var.environment
    DataClassification = var.data_classification
  }
}
```

## File: s3.tf

```hcl
# S3 bucket for CloudWatch Metric Streams
resource "aws_s3_bucket" "metric_streams" {
  bucket = "${local.name_prefix}-metric-streams"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-metric-streams"
      Purpose = "CloudWatch Metric Streams Storage"
    }
  )
}

# Block public access
resource "aws_s3_bucket_public_access_block" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy for 15-month retention
resource "aws_s3_bucket_lifecycle_configuration" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  rule {
    id     = "metric-retention-policy"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER_IR"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = var.metric_retention_days
    }
  }
}

# Versioning for data protection
resource "aws_s3_bucket_versioning" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket policy for CloudWatch Metric Streams
resource "aws_s3_bucket_policy" "metric_streams" {
  bucket = aws_s3_bucket.metric_streams.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchMetricStreams"
        Effect = "Allow"
        Principal = {
          Service = "streams.metrics.cloudwatch.amazonaws.com"
        }
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.metric_streams.arn}/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# S3 bucket for Synthetics canary artifacts
resource "aws_s3_bucket" "synthetics_artifacts" {
  bucket = "${local.name_prefix}-synthetics-artifacts"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-synthetics-artifacts"
      Purpose = "CloudWatch Synthetics Artifacts"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "synthetics_artifacts" {
  bucket = aws_s3_bucket.synthetics_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "synthetics_artifacts" {
  bucket = aws_s3_bucket.synthetics_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Secondary region bucket for cross-region replication
resource "aws_s3_bucket" "metric_streams_replica" {
  provider = aws.secondary
  bucket   = "${local.name_prefix}-metric-streams-replica"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-metric-streams-replica"
      Purpose = "CloudWatch Metric Streams Replica"
    }
  )
}

resource "aws_s3_bucket_versioning" "metric_streams_replica" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.metric_streams_replica.id

  versioning_configuration {
    status = "Enabled"
  }
}
```

## File: iam.tf

```hcl
data "aws_caller_identity" "current" {}

# IAM role for CloudWatch Metric Streams
resource "aws_iam_role" "metric_streams" {
  name = "${local.name_prefix}-metric-streams-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "streams.metrics.cloudwatch.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "metric_streams" {
  name = "${local.name_prefix}-metric-streams-policy"
  role = aws_iam_role.metric_streams.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "firehose:PutRecord",
          "firehose:PutRecordBatch"
        ]
        Resource = aws_kinesis_firehose_delivery_stream.metric_streams.arn
      }
    ]
  })
}

# IAM role for Kinesis Firehose
resource "aws_iam_role" "firehose" {
  name = "${local.name_prefix}-firehose-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "firehose" {
  name = "${local.name_prefix}-firehose-policy"
  role = aws_iam_role.firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.metric_streams.arn,
          "${aws_s3_bucket.metric_streams.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents"
        ]
        Resource = aws_cloudwatch_log_group.firehose.arn
      }
    ]
  })
}

# IAM role for Lambda functions (ARM Graviton2)
resource "aws_iam_role" "lambda_metric_processor" {
  name = "${local.name_prefix}-lambda-processor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_metric_processor" {
  name = "${local.name_prefix}-lambda-processor-policy"
  role = aws_iam_role.lambda_metric_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM role for CloudWatch Synthetics
resource "aws_iam_role" "synthetics" {
  name = "${local.name_prefix}-synthetics-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "synthetics" {
  name = "${local.name_prefix}-synthetics-policy"
  role = aws_iam_role.synthetics.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.synthetics_artifacts.arn,
          "${aws_s3_bucket.synthetics_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup"
        ]
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "CloudWatchSynthetics"
          }
        }
      }
    ]
  })
}

# IAM role for SNS with retry mechanism
resource "aws_iam_role" "sns_delivery" {
  name = "${local.name_prefix}-sns-delivery-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "sns_delivery" {
  name = "${local.name_prefix}-sns-delivery-policy"
  role = aws_iam_role.sns_delivery.id

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
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

# IAM role for cross-account observability
resource "aws_iam_role" "cross_account_sharing" {
  count = length(var.cross_account_ids) > 0 ? 1 : 0
  name  = "${local.name_prefix}-cross-account-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = [for account_id in var.cross_account_ids : "arn:aws:iam::${account_id}:root"]
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "cloudwatch-cross-account"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "cross_account_sharing" {
  count = length(var.cross_account_ids) > 0 ? 1 : 0
  name  = "${local.name_prefix}-cross-account-policy"
  role  = aws_iam_role.cross_account_sharing[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:DescribeAlarms"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## File: cloudwatch_logs.tf

```hcl
# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${local.name_prefix}"
  retention_in_days = var.metric_retention_days

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-app-logs"
    }
  )
}

# CloudWatch Log Group for Firehose
resource "aws_cloudwatch_log_group" "firehose" {
  name              = "/aws/kinesisfirehose/${local.name_prefix}"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_stream" "firehose" {
  name           = "metric-stream"
  log_group_name = aws_cloudwatch_log_group.firehose.name
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_processor" {
  name              = "/aws/lambda/${local.name_prefix}-metric-processor"
  retention_in_days = 30

  tags = local.common_tags
}

# Metric Filter 1: Extract error count
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${local.name_prefix}-error-count"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level=ERROR*, ...]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "CustomMetrics/${local.name_prefix}"
    value     = "1"
    default_value = "0"
    unit      = "Count"
  }
}

# Metric Filter 2: Extract response time
resource "aws_cloudwatch_log_metric_filter" "response_time" {
  name           = "${local.name_prefix}-response-time"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level, method, path, status, duration]"

  metric_transformation {
    name      = "ResponseTime"
    namespace = "CustomMetrics/${local.name_prefix}"
    value     = "$duration"
    unit      = "Milliseconds"
  }
}

# Metric Filter 3: Extract 5xx errors
resource "aws_cloudwatch_log_metric_filter" "server_errors" {
  name           = "${local.name_prefix}-5xx-errors"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level, method, path, status=5*, ...]"

  metric_transformation {
    name      = "ServerErrorCount"
    namespace = "CustomMetrics/${local.name_prefix}"
    value     = "1"
    default_value = "0"
    unit      = "Count"
  }
}

# Metric Filter 4: Extract memory usage
resource "aws_cloudwatch_log_metric_filter" "memory_usage" {
  name           = "${local.name_prefix}-memory-usage"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "[timestamp, request_id, level, metric=MEMORY, value, unit=MB]"

  metric_transformation {
    name      = "MemoryUsage"
    namespace = "CustomMetrics/${local.name_prefix}"
    value     = "$value"
    unit      = "Megabytes"
  }
}
```

## File: kinesis_firehose.tf

```hcl
# Kinesis Firehose Delivery Stream for CloudWatch Metric Streams
resource "aws_kinesis_firehose_delivery_stream" "metric_streams" {
  name        = "${local.name_prefix}-metric-stream"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn            = aws_iam_role.firehose.arn
    bucket_arn          = aws_s3_bucket.metric_streams.arn
    prefix              = "metrics/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    buffering_size     = 128
    buffering_interval = 60
    compression_format = "GZIP"

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose.name
      log_stream_name = aws_cloudwatch_log_stream.firehose.name
    }

    data_format_conversion_configuration {
      input_format_configuration {
        deserializer {
          open_x_json_ser_de {}
        }
      }

      output_format_configuration {
        serializer {
          parquet_ser_de {}
        }
      }

      schema_configuration {
        database_name = aws_glue_catalog_database.metrics.name
        table_name    = aws_glue_catalog_table.metrics.name
        role_arn      = aws_iam_role.firehose.arn
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-metric-stream"
    }
  )
}

# Glue Catalog Database for metrics
resource "aws_glue_catalog_database" "metrics" {
  name = "${replace(local.name_prefix, "-", "_")}_metrics"

  description = "Database for CloudWatch metrics"
}

# Glue Catalog Table for metrics schema
resource "aws_glue_catalog_table" "metrics" {
  name          = "metric_data"
  database_name = aws_glue_catalog_database.metrics.name

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.metric_streams.id}/metrics/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    columns {
      name = "metric_name"
      type = "string"
    }

    columns {
      name = "namespace"
      type = "string"
    }

    columns {
      name = "value"
      type = "double"
    }

    columns {
      name = "timestamp"
      type = "bigint"
    }

    columns {
      name = "unit"
      type = "string"
    }
  }
}
```

## File: metric_streams.tf

```hcl
# CloudWatch Metric Stream
resource "aws_cloudwatch_metric_stream" "main" {
  name          = "${local.name_prefix}-stream"
  role_arn      = aws_iam_role.metric_streams.arn
  firehose_arn  = aws_kinesis_firehose_delivery_stream.metric_streams.arn
  output_format = "opentelemetry0.7"

  include_filter {
    namespace = "AWS/Lambda"
  }

  include_filter {
    namespace = "AWS/ECS"
  }

  include_filter {
    namespace = "CustomMetrics/${local.name_prefix}"
  }

  include_filter {
    namespace = "AWS/ApplicationELB"
  }

  include_filter {
    namespace = "AWS/RDS"
  }

  statistics_configuration {
    additional_statistics = ["p50", "p90", "p95", "p99"]

    include_metric {
      metric_name = "Duration"
      namespace   = "AWS/Lambda"
    }
  }

  statistics_configuration {
    additional_statistics = ["p50", "p90", "p95", "p99"]

    include_metric {
      metric_name = "ResponseTime"
      namespace   = "CustomMetrics/${local.name_prefix}"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-metric-stream"
    }
  )
}
```

## File: lambda.tf

```hcl
# Lambda function for custom metric processing (ARM Graviton2)
resource "aws_lambda_function" "metric_processor" {
  filename      = data.archive_file.lambda_processor.output_path
  function_name = "${local.name_prefix}-metric-processor"
  role          = aws_iam_role.lambda_metric_processor.arn
  handler       = "index.handler"
  runtime       = "python3.11"

  # ARM Graviton2 processor for cost optimization
  architectures = ["arm64"]

  memory_size = 256
  timeout     = 60

  environment {
    variables = {
      ENVIRONMENT        = var.environment
      METRIC_NAMESPACE   = "CustomMetrics/${local.name_prefix}"
      LOG_LEVEL          = "INFO"
      RETENTION_DAYS     = tostring(var.metric_retention_days)
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-metric-processor"
    }
  )

  depends_on = [aws_cloudwatch_log_group.lambda_processor]
}

# Archive Lambda function code
data "archive_file" "lambda_processor" {
  type        = "zip"
  output_path = "${path.module}/lambda_processor.zip"

  source {
    content  = file("${path.module}/lambda/metric_processor.py")
    filename = "index.py"
  }
}

# Lambda function for alarm notification processing
resource "aws_lambda_function" "alarm_processor" {
  filename      = data.archive_file.lambda_alarm_processor.output_path
  function_name = "${local.name_prefix}-alarm-processor"
  role          = aws_iam_role.lambda_metric_processor.arn
  handler       = "index.handler"
  runtime       = "python3.11"

  # ARM Graviton2 processor
  architectures = ["arm64"]

  memory_size = 128
  timeout     = 30

  environment {
    variables = {
      ENVIRONMENT         = var.environment
      SNS_CRITICAL_ARN    = aws_sns_topic.critical_alarms.arn
      SNS_WARNING_ARN     = aws_sns_topic.warning_alarms.arn
      SNS_INFO_ARN        = aws_sns_topic.info_alarms.arn
      MAX_RETRY_ATTEMPTS  = "5"
      INITIAL_RETRY_DELAY = "1000"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-alarm-processor"
    }
  )
}

data "archive_file" "lambda_alarm_processor" {
  type        = "zip"
  output_path = "${path.module}/lambda_alarm_processor.zip"

  source {
    content  = file("${path.module}/lambda/alarm_processor.py")
    filename = "index.py"
  }
}

# CloudWatch Event Rule to trigger Lambda periodically
resource "aws_cloudwatch_event_rule" "metric_processor" {
  name                = "${local.name_prefix}-metric-processor-schedule"
  description         = "Trigger metric processor Lambda function"
  schedule_expression = "rate(5 minutes)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "metric_processor" {
  rule      = aws_cloudwatch_event_rule.metric_processor.name
  target_id = "MetricProcessorLambda"
  arn       = aws_lambda_function.metric_processor.arn

  retry_policy {
    maximum_event_age       = 3600
    maximum_retry_attempts  = 5
  }
}

resource "aws_lambda_permission" "metric_processor" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.metric_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.metric_processor.arn
}
```

## File: lambda/metric_processor.py

```python
import json
import boto3
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """
    Custom metric processor for advanced CloudWatch observability.
    Processes metrics with math expressions and publishes aggregated data.
    """

    namespace = os.environ.get('METRIC_NAMESPACE')
    environment = os.environ.get('ENVIRONMENT')

    try:
        # Calculate composite metrics using metric math
        composite_metrics = calculate_composite_metrics()

        # Publish custom metrics
        publish_metrics(namespace, composite_metrics)

        # Check for anomalies
        anomalies = detect_anomalies()

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Metrics processed successfully',
                'metrics_published': len(composite_metrics),
                'anomalies_detected': len(anomalies),
                'timestamp': datetime.utcnow().isoformat()
            })
        }

        print(f"Processed {len(composite_metrics)} metrics, detected {len(anomalies)} anomalies")

        return response

    except Exception as e:
        print(f"Error processing metrics: {str(e)}")
        raise

def calculate_composite_metrics() -> List[Dict[str, Any]]:
    """
    Calculate composite metrics using metric math expressions.
    Reduces custom metric count by combining multiple data points.
    """

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=5)

    # Query metrics using metric math to reduce custom metric count
    response = cloudwatch.get_metric_data(
        MetricDataQueries=[
            {
                'Id': 'm1',
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Lambda',
                        'MetricName': 'Invocations'
                    },
                    'Period': 300,
                    'Stat': 'Sum'
                }
            },
            {
                'Id': 'm2',
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Lambda',
                        'MetricName': 'Errors'
                    },
                    'Period': 300,
                    'Stat': 'Sum'
                }
            },
            {
                'Id': 'error_rate',
                'Expression': '(m2 / m1) * 100',
                'Label': 'Error Rate Percentage'
            }
        ],
        StartTime=start_time,
        EndTime=end_time
    )

    composite_metrics = []

    for result in response['MetricDataResults']:
        if result['Id'] == 'error_rate' and len(result['Values']) > 0:
            composite_metrics.append({
                'MetricName': 'CompositeErrorRate',
                'Value': result['Values'][0],
                'Unit': 'Percent',
                'Timestamp': result['Timestamps'][0]
            })

    return composite_metrics

def publish_metrics(namespace: str, metrics: List[Dict[str, Any]]) -> None:
    """
    Publish calculated metrics to CloudWatch.
    """

    if not metrics:
        return

    metric_data = []

    for metric in metrics:
        metric_data.append({
            'MetricName': metric['MetricName'],
            'Value': metric['Value'],
            'Unit': metric.get('Unit', 'None'),
            'Timestamp': metric.get('Timestamp', datetime.utcnow())
        })

    # Batch publish metrics
    cloudwatch.put_metric_data(
        Namespace=namespace,
        MetricData=metric_data
    )

def detect_anomalies() -> List[Dict[str, Any]]:
    """
    Detect anomalies in metrics using CloudWatch anomaly detection.
    """

    anomalies = []

    try:
        # Query anomaly detector status
        response = cloudwatch.describe_anomaly_detectors(
            MaxResults=100
        )

        for detector in response.get('AnomalyDetectors', []):
            if detector.get('StateValue') == 'TRAINED':
                anomalies.append({
                    'namespace': detector.get('Namespace'),
                    'metric': detector.get('MetricName'),
                    'state': detector.get('StateValue')
                })

    except Exception as e:
        print(f"Error detecting anomalies: {str(e)}")

    return anomalies
```

## File: lambda/alarm_processor.py

```python
import json
import boto3
import os
import time
from typing import Dict, Any

sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """
    Process CloudWatch alarms with retry mechanism and exponential backoff.
    Routes notifications to appropriate SNS topics based on severity.
    """

    max_retries = int(os.environ.get('MAX_RETRY_ATTEMPTS', '5'))
    initial_delay = int(os.environ.get('INITIAL_RETRY_DELAY', '1000'))
    environment = os.environ.get('ENVIRONMENT')

    try:
        # Parse alarm from SNS message
        message = json.loads(event['Records'][0]['Sns']['Message'])
        alarm_name = message.get('AlarmName')
        alarm_state = message.get('NewStateValue')
        alarm_reason = message.get('NewStateReason')

        # Determine severity based on alarm name pattern
        severity = determine_severity(alarm_name)

        # Get appropriate SNS topic
        topic_arn = get_topic_for_severity(severity)

        # Publish with retry and exponential backoff
        publish_with_retry(
            topic_arn=topic_arn,
            message=format_alarm_message(message),
            subject=f"[{severity}] {alarm_name}",
            max_retries=max_retries,
            initial_delay=initial_delay
        )

        # Filter non-production during maintenance
        if should_suppress_alarm(alarm_name, environment):
            print(f"Suppressing alarm {alarm_name} for environment {environment}")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Alarm suppressed'})
            }

        return {
            'statusCode': 200,
            'body': json.dumps({
                'alarm': alarm_name,
                'severity': severity,
                'state': alarm_state
            })
        }

    except Exception as e:
        print(f"Error processing alarm: {str(e)}")
        raise

def determine_severity(alarm_name: str) -> str:
    """
    Determine alarm severity based on naming convention.
    """

    if 'critical' in alarm_name.lower():
        return 'CRITICAL'
    elif 'warning' in alarm_name.lower():
        return 'WARNING'
    else:
        return 'INFO'

def get_topic_for_severity(severity: str) -> str:
    """
    Get SNS topic ARN based on severity level.
    """

    severity_map = {
        'CRITICAL': os.environ.get('SNS_CRITICAL_ARN'),
        'WARNING': os.environ.get('SNS_WARNING_ARN'),
        'INFO': os.environ.get('SNS_INFO_ARN')
    }

    return severity_map.get(severity, os.environ.get('SNS_INFO_ARN'))

def publish_with_retry(topic_arn: str, message: str, subject: str,
                      max_retries: int, initial_delay: int) -> None:
    """
    Publish to SNS with exponential backoff retry mechanism.
    """

    attempt = 0
    delay = initial_delay

    while attempt < max_retries:
        try:
            sns.publish(
                TopicArn=topic_arn,
                Message=message,
                Subject=subject
            )
            print(f"Successfully published to SNS on attempt {attempt + 1}")
            return

        except Exception as e:
            attempt += 1
            if attempt >= max_retries:
                print(f"Failed to publish after {max_retries} attempts")
                raise

            print(f"Attempt {attempt} failed: {str(e)}. Retrying in {delay}ms...")
            time.sleep(delay / 1000.0)
            delay *= 2  # Exponential backoff

def format_alarm_message(alarm_data: Dict[str, Any]) -> str:
    """
    Format alarm data into human-readable message.
    """

    return json.dumps({
        'Alarm': alarm_data.get('AlarmName'),
        'State': alarm_data.get('NewStateValue'),
        'Reason': alarm_data.get('NewStateReason'),
        'Timestamp': alarm_data.get('StateChangeTime'),
        'Region': alarm_data.get('Region'),
        'AccountId': alarm_data.get('AWSAccountId')
    }, indent=2)

def should_suppress_alarm(alarm_name: str, environment: str) -> bool:
    """
    Determine if alarm should be suppressed during maintenance windows.
    Excludes non-production environments from alerting.
    """

    # Suppress non-prod alarms during maintenance (example logic)
    if environment != 'prod':
        # Check if within maintenance window (simplified)
        current_hour = time.gmtime().tm_hour
        # Maintenance window: 2 AM - 4 AM UTC
        if 2 <= current_hour < 4:
            return True

    return False
```

## File: sns.tf

```hcl
# SNS Topic for Critical Alarms
resource "aws_sns_topic" "critical_alarms" {
  name         = "${local.name_prefix}-critical-alarms"
  display_name = "Critical CloudWatch Alarms"

  delivery_policy = jsonencode({
    http = {
      defaultHealthyRetryPolicy = {
        minDelayTarget     = 20
        maxDelayTarget     = 600
        numRetries         = 5
        numMaxDelayRetries = 3
        numNoDelayRetries  = 1
        numMinDelayRetries = 1
        backoffFunction    = "exponential"
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-critical-alarms"
      Severity = "Critical"
    }
  )
}

# SNS Topic for Warning Alarms
resource "aws_sns_topic" "warning_alarms" {
  name         = "${local.name_prefix}-warning-alarms"
  display_name = "Warning CloudWatch Alarms"

  delivery_policy = jsonencode({
    http = {
      defaultHealthyRetryPolicy = {
        minDelayTarget     = 20
        maxDelayTarget     = 600
        numRetries         = 5
        numMaxDelayRetries = 3
        numNoDelayRetries  = 1
        numMinDelayRetries = 1
        backoffFunction    = "exponential"
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-warning-alarms"
      Severity = "Warning"
    }
  )
}

# SNS Topic for Info Alarms
resource "aws_sns_topic" "info_alarms" {
  name         = "${local.name_prefix}-info-alarms"
  display_name = "Info CloudWatch Alarms"

  delivery_policy = jsonencode({
    http = {
      defaultHealthyRetryPolicy = {
        minDelayTarget     = 20
        maxDelayTarget     = 300
        numRetries         = 3
        numMaxDelayRetries = 2
        numNoDelayRetries  = 1
        numMinDelayRetries = 0
        backoffFunction    = "exponential"
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-info-alarms"
      Severity = "Info"
    }
  )
}

# SNS Subscriptions for Critical Alarms
resource "aws_sns_topic_subscription" "critical_email" {
  count     = length(var.alarm_email_endpoints) > 0 ? length(var.alarm_email_endpoints) : 0
  topic_arn = aws_sns_topic.critical_alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoints[count.index]

  filter_policy = jsonencode({
    severity = ["CRITICAL"]
  })
}

# SNS Subscription to Lambda for alarm processing
resource "aws_sns_topic_subscription" "alarm_processor" {
  topic_arn = aws_sns_topic.critical_alarms.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.alarm_processor.arn
}

resource "aws_lambda_permission" "sns_invoke" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alarm_processor.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.critical_alarms.arn
}

# CloudWatch Logs for SNS delivery status
resource "aws_cloudwatch_log_group" "sns_delivery" {
  name              = "/aws/sns/${local.name_prefix}"
  retention_in_days = 7

  tags = local.common_tags
}
```

## File: cloudwatch_alarms.tf

```hcl
# Basic CloudWatch Alarms for composite alarm dependencies

# Alarm 1: High CPU utilization
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}-high-cpu-critical"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggers when CPU utilization exceeds 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]
  ok_actions    = [aws_sns_topic.info_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-high-cpu"
      Severity = "Critical"
    }
  )
}

# Alarm 2: High memory utilization
resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${local.name_prefix}-high-memory-warning"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "Triggers when memory utilization exceeds 85%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-high-memory"
      Severity = "Warning"
    }
  )
}

# Alarm 3: High error rate using metric math
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.name_prefix}-high-error-rate-critical"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  alarm_description   = "Triggers when error rate exceeds 5% using metric math"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(m2/m1)*100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "m1"

    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"

      dimensions = {
        FunctionName = aws_lambda_function.metric_processor.function_name
      }
    }
  }

  metric_query {
    id = "m2"

    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"

      dimensions = {
        FunctionName = aws_lambda_function.metric_processor.function_name
      }
    }
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-high-error-rate"
      Severity = "Critical"
    }
  )
}

# Alarm 4: Custom metric - Response Time
resource "aws_cloudwatch_metric_alarm" "slow_response" {
  alarm_name          = "${local.name_prefix}-slow-response-warning"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ResponseTime"
  namespace           = "CustomMetrics/${local.name_prefix}"
  period              = 300
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Triggers when average response time exceeds 1000ms"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-slow-response"
      Severity = "Warning"
    }
  )
}

# Composite Alarm with AND/OR logic - System Health
resource "aws_cloudwatch_composite_alarm" "system_health" {
  alarm_name          = "${local.name_prefix}-system-health-composite"
  alarm_description   = "Composite alarm monitoring system health with AND/OR logic"
  actions_enabled     = true

  # AND condition: High CPU AND High Memory = Critical system issue
  # OR condition: Any critical alarm triggers notification
  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.high_cpu.alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.high_memory.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.high_error_rate.alarm_name})"

  alarm_actions = [aws_sns_topic.critical_alarms.arn]
  ok_actions    = [aws_sns_topic.info_alarms.arn]

  actions_suppressor {
    alarm            = aws_cloudwatch_metric_alarm.maintenance_mode.alarm_name
    extension_period = 300
    wait_period      = 60
  }

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-system-health"
      Type     = "Composite"
      Severity = "Critical"
    }
  )
}

# Maintenance mode alarm for suppression
resource "aws_cloudwatch_metric_alarm" "maintenance_mode" {
  alarm_name          = "${local.name_prefix}-maintenance-mode"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "MaintenanceMode"
  namespace           = "CustomMetrics/${local.name_prefix}"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Indicates system is in maintenance mode"
  treat_missing_data  = "notBreaching"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-maintenance-mode"
    }
  )
}

# Composite Alarm - Performance degradation (3+ metrics)
resource "aws_cloudwatch_composite_alarm" "performance_degradation" {
  alarm_name          = "${local.name_prefix}-performance-composite"
  alarm_description   = "Detects performance degradation across multiple metrics"
  actions_enabled     = true

  # Complex logic: (High CPU OR High Memory) AND Slow Response
  alarm_rule = "(ALARM(${aws_cloudwatch_metric_alarm.high_cpu.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.high_memory.alarm_name})) AND ALARM(${aws_cloudwatch_metric_alarm.slow_response.alarm_name})"

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.name_prefix}-performance"
      Type     = "Composite"
      Severity = "Warning"
    }
  )
}

# Additional alarms for more comprehensive monitoring
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${local.name_prefix}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Triggers when Lambda throttles exceed threshold"

  dimensions = {
    FunctionName = aws_lambda_function.metric_processor.function_name
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = local.common_tags
}
```

## File: anomaly_detectors.tf

```hcl
# Anomaly Detector for Lambda Duration with customized bands
resource "aws_cloudwatch_metric_alarm" "lambda_duration_anomaly" {
  alarm_name          = "${local.name_prefix}-lambda-duration-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "anomaly_detection"
  alarm_description   = "Detects anomalies in Lambda function duration"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "actual"
    return_data = true

    metric {
      metric_name = "Duration"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Average"

      dimensions = {
        FunctionName = aws_lambda_function.metric_processor.function_name
      }
    }
  }

  metric_query {
    id          = "anomaly_detection"
    expression  = "ANOMALY_DETECTION_BAND(actual, 2)"
    label       = "Lambda Duration Anomaly (2 std dev)"
    return_data = true
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-lambda-duration-anomaly"
      Type = "AnomalyDetection"
    }
  )
}

# Anomaly Detector for Error Count with wider bands
resource "aws_cloudwatch_metric_alarm" "error_count_anomaly" {
  alarm_name          = "${local.name_prefix}-error-count-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "anomaly_band"
  alarm_description   = "Detects anomalies in error count with 3 std dev bands"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "errors"
    return_data = true

    metric {
      metric_name = "ErrorCount"
      namespace   = "CustomMetrics/${local.name_prefix}"
      period      = 300
      stat        = "Sum"
    }
  }

  metric_query {
    id          = "anomaly_band"
    expression  = "ANOMALY_DETECTION_BAND(errors, 3)"
    label       = "Error Count Anomaly (3 std dev)"
    return_data = true
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-error-anomaly"
      Type = "AnomalyDetection"
    }
  )
}

# Anomaly Detector for Response Time
resource "aws_cloudwatch_metric_alarm" "response_time_anomaly" {
  alarm_name          = "${local.name_prefix}-response-time-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 3
  threshold_metric_id = "ad_threshold"
  alarm_description   = "Detects response time anomalies with tight bands (1.5 std dev)"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "response"
    return_data = true

    metric {
      metric_name = "ResponseTime"
      namespace   = "CustomMetrics/${local.name_prefix}"
      period      = 300
      stat        = "Average"
    }
  }

  metric_query {
    id          = "ad_threshold"
    expression  = "ANOMALY_DETECTION_BAND(response, 1.5)"
    label       = "Response Time Anomaly (1.5 std dev)"
    return_data = true
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-response-anomaly"
      Type = "AnomalyDetection"
    }
  )
}

# Anomaly Detector for ECS Memory Utilization
resource "aws_cloudwatch_metric_alarm" "ecs_memory_anomaly" {
  alarm_name          = "${local.name_prefix}-ecs-memory-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "memory_band"
  alarm_description   = "Detects memory utilization anomalies in ECS cluster"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "memory"
    return_data = true

    metric {
      metric_name = "MemoryUtilization"
      namespace   = "AWS/ECS"
      period      = 300
      stat        = "Average"

      dimensions = {
        ClusterName = var.ecs_cluster_name
      }
    }
  }

  metric_query {
    id          = "memory_band"
    expression  = "ANOMALY_DETECTION_BAND(memory, 2)"
    label       = "Memory Anomaly Band"
    return_data = true
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ecs-memory-anomaly"
      Type = "AnomalyDetection"
    }
  )
}
```

## File: dashboard.tf

```hcl
# Comprehensive CloudWatch Dashboard with 5+ widget types
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-observability"

  dashboard_body = jsonencode({
    widgets = [
      # Widget 1: Line chart - Lambda metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Errors" }],
            [".", "Throttles", { stat = "Sum", label = "Throttles" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Lambda Function Metrics"
          yAxis = {
            left = {
              label = "Count"
            }
          }
          annotations = {
            horizontal = [
              {
                label = "Error Threshold"
                value = 10
                fill  = "above"
                color = "#ff0000"
              }
            ]
          }
        }
      },

      # Widget 2: Number widget - Current error rate
      {
        type = "metric"
        properties = {
          metrics = [
            [
              {
                expression = "(m2/m1)*100"
                label      = "Error Rate %"
                id         = "error_rate"
              }
            ],
            ["AWS/Lambda", "Errors", { id = "m2", visible = false }],
            [".", "Invocations", { id = "m1", visible = false }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Current Error Rate"
          view   = "singleValue"
        }
      },

      # Widget 3: Stacked area chart - ECS metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            [".", "MemoryUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ECS Resource Utilization"
          view   = "timeSeries"
          stacked = true
          yAxis = {
            left = {
              label = "Percent"
              max   = 100
            }
          }
        }
      },

      # Widget 4: Log widget - Recent errors
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.application.name}' | fields @timestamp, @message | filter level = 'ERROR' | sort @timestamp desc | limit 20"
          region  = var.region
          title   = "Recent Application Errors"
          stacked = false
        }
      },

      # Widget 5: Alarm status widget
      {
        type = "alarm"
        properties = {
          title  = "Alarm Status"
          alarms = [
            aws_cloudwatch_metric_alarm.high_cpu.arn,
            aws_cloudwatch_metric_alarm.high_memory.arn,
            aws_cloudwatch_metric_alarm.high_error_rate.arn,
            aws_cloudwatch_composite_alarm.system_health.arn
          ]
        }
      },

      # Widget 6: Pie chart - Alarm state distribution
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }],
            [".", "Errors", { stat = "Sum" }]
          ]
          period = 86400
          stat   = "Sum"
          region = var.region
          title  = "Daily Invocations vs Errors"
          view   = "pie"
        }
      },

      # Widget 7: Gauge widget - Current CPU utilization
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Current CPU Utilization"
          view   = "gauge"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
          annotations = {
            horizontal = [
              {
                label = "Critical"
                value = 80
                fill  = "above"
                color = "#ff0000"
              },
              {
                label = "Warning"
                value = 60
                fill  = "above"
                color = "#ff9900"
              }
            ]
          }
        }
      },

      # Widget 8: Bar chart - Custom metrics
      {
        type = "metric"
        properties = {
          metrics = [
            ["CustomMetrics/${local.name_prefix}", "ErrorCount", { stat = "Sum" }],
            [".", "ServerErrorCount", { stat = "Sum" }]
          ]
          period = 3600
          stat   = "Sum"
          region = var.region
          title  = "Hourly Error Distribution"
          view   = "bar"
        }
      },

      # Widget 9: Text widget with annotations
      {
        type = "text"
        properties = {
          markdown = "## CloudWatch Observability Dashboard\n\n**Environment:** ${var.environment}\n\n**Last Updated:** {{date}}\n\n### Key Metrics:\n- Lambda invocations and errors\n- ECS resource utilization\n- Custom application metrics\n- Anomaly detection status\n\n### Alert Severity:\n- 🔴 Critical: Immediate action required\n- 🟡 Warning: Investigation needed\n- 🟢 Info: Informational only"
        }
      },

      # Widget 10: Metric explorer - Anomaly detection
      {
        type = "metric"
        properties = {
          metrics = [
            [
              {
                expression = "ANOMALY_DETECTION_BAND(m1, 2)"
                label      = "Expected Range"
                id         = "ad1"
              }
            ],
            ["CustomMetrics/${local.name_prefix}", "ResponseTime", { id = "m1", stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Response Time with Anomaly Detection"
          view   = "timeSeries"
          annotations = {
            horizontal = [
              {
                label = "SLA Threshold"
                value = 1000
              }
            ]
          }
        }
      }
    ]
  })
}

# Secondary dashboard for cross-account metrics
resource "aws_cloudwatch_dashboard" "cross_account" {
  dashboard_name = "${local.name_prefix}-cross-account"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", accountId = data.aws_caller_identity.current.account_id }]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Cross-Account Lambda Invocations"
        }
      }
    ]
  })
}
```

## File: synthetics.tf

```hcl
# CloudWatch Synthetics Canary - Primary Region
resource "aws_synthetics_canary" "api_health_primary" {
  name                 = "${local.name_prefix}-api-health-primary"
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics_artifacts.id}/"
  execution_role_arn   = aws_iam_role.synthetics.arn
  runtime_version      = "syn-python-selenium-2.0"
  handler              = "canary.handler"

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    timeout_in_seconds = 60
    memory_in_mb       = 960
    active_tracing     = true

    environment_variables = {
      ENVIRONMENT = var.environment
    }
  }

  success_retention_period = 31
  failure_retention_period = 31

  artifact_config {
    s3_encryption {
      encryption_mode = "SSE_S3"
    }
  }

  code {
    handler = "canary.handler"
    s3_bucket = aws_s3_bucket.synthetics_artifacts.id
    s3_key    = aws_s3_object.canary_script.key
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-api-health-primary"
      Region = var.region
    }
  )

  depends_on = [aws_s3_object.canary_script]
}

# CloudWatch Synthetics Canary - Secondary Region
resource "aws_synthetics_canary" "api_health_secondary" {
  provider = aws.secondary

  name                 = "${local.name_prefix}-api-health-secondary"
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics_artifacts.id}/"
  execution_role_arn   = aws_iam_role.synthetics.arn
  runtime_version      = "syn-python-selenium-2.0"
  handler              = "canary.handler"

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    timeout_in_seconds = 60
    memory_in_mb       = 960
    active_tracing     = true

    environment_variables = {
      ENVIRONMENT = var.environment
      REGION      = var.secondary_region
    }
  }

  success_retention_period = 31
  failure_retention_period = 31

  artifact_config {
    s3_encryption {
      encryption_mode = "SSE_S3"
    }
  }

  code {
    handler = "canary.handler"
    s3_bucket = aws_s3_bucket.synthetics_artifacts.id
    s3_key    = aws_s3_object.canary_script.key
  }

  tags = merge(
    local.common_tags,
    {
      Name   = "${local.name_prefix}-api-health-secondary"
      Region = var.secondary_region
    }
  )

  depends_on = [aws_s3_object.canary_script]
}

# Upload canary script to S3
resource "aws_s3_object" "canary_script" {
  bucket = aws_s3_bucket.synthetics_artifacts.id
  key    = "canary/canary.zip"
  source = data.archive_file.canary_script.output_path
  etag   = filemd5(data.archive_file.canary_script.output_path)

  tags = local.common_tags
}

# Archive canary script
data "archive_file" "canary_script" {
  type        = "zip"
  output_path = "${path.module}/canary.zip"

  source {
    content  = file("${path.module}/synthetics/canary.py")
    filename = "python/canary.py"
  }
}

# Alarms for Synthetics
resource "aws_cloudwatch_metric_alarm" "canary_failed_primary" {
  alarm_name          = "${local.name_prefix}-canary-failed-primary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SuccessPercent"
  namespace           = "CloudWatchSynthetics"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Canary success rate below 90% in primary region"

  dimensions = {
    CanaryName = aws_synthetics_canary.api_health_primary.name
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-canary-alarm-primary"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "canary_failed_secondary" {
  provider = aws.secondary

  alarm_name          = "${local.name_prefix}-canary-failed-secondary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SuccessPercent"
  namespace           = "CloudWatchSynthetics"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Canary success rate below 90% in secondary region"

  dimensions = {
    CanaryName = aws_synthetics_canary.api_health_secondary.name
  }

  alarm_actions = [aws_sns_topic.critical_alarms.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-canary-alarm-secondary"
    }
  )
}
```

## File: synthetics/canary.py

```python
from aws_synthetics.selenium import synthetics_webdriver as webdriver
from aws_synthetics.common import synthetics_logger as logger
import os

def handler(event, context):
    """
    CloudWatch Synthetics canary for endpoint monitoring.
    Tests API health and performance across multiple regions.
    """

    # Configure browser
    browser = webdriver.Chrome()
    browser.set_page_load_timeout(30)

    environment = os.environ.get('ENVIRONMENT', 'prod')
    region = os.environ.get('REGION', 'us-east-1')

    endpoints = [
        'https://api.example.com/health',
        'https://api.example.com/status',
        'https://app.example.com'
    ]

    try:
        for endpoint in endpoints:
            logger.info(f"Testing endpoint: {endpoint}")

            # Navigate to endpoint
            browser.get(endpoint)

            # Verify page loaded
            page_source = browser.page_source

            if 'error' in page_source.lower():
                raise Exception(f"Error detected on page: {endpoint}")

            logger.info(f"Successfully validated {endpoint}")

            # Take screenshot
            browser.save_screenshot(f"screenshot_{endpoint.replace('://', '_').replace('/', '_')}.png")

        logger.info(f"All endpoints validated successfully in {region}")

    except Exception as e:
        logger.error(f"Canary failed: {str(e)}")
        raise

    finally:
        browser.quit()

    return "Canary completed successfully"
```

## File: container_insights.tf

```hcl
# Enable Container Insights for ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = var.ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"

      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = var.ecs_cluster_name
    }
  )
}

resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/aws/ecs/${var.ecs_cluster_name}/exec"
  retention_in_days = 7

  tags = local.common_tags
}

# CloudWatch Container Insights alarms
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${local.name_prefix}-ecs-cpu-reservation-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUReservation"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "ECS CPU reservation is high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${local.name_prefix}-ecs-memory-reservation-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryReservation"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "ECS memory reservation is high"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }

  alarm_actions = [aws_sns_topic.warning_alarms.arn]

  tags = local.common_tags
}

# Task-level metric filters
resource "aws_cloudwatch_log_group" "ecs_tasks" {
  name              = "/ecs/${var.ecs_cluster_name}/tasks"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_cloudwatch_log_metric_filter" "ecs_task_errors" {
  name           = "${local.name_prefix}-ecs-task-errors"
  log_group_name = aws_cloudwatch_log_group.ecs_tasks.name
  pattern        = "[time, request_id, level=ERROR*, ...]"

  metric_transformation {
    name      = "ECSTaskErrors"
    namespace = "CustomMetrics/${local.name_prefix}"
    value     = "1"
    default_value = "0"
  }
}
```

## File: cross_account.tf

```hcl
# CloudWatch cross-account observability configuration

# Create CloudWatch observability access manager links
resource "aws_oam_link" "cross_account" {
  count = length(var.cross_account_ids)

  label_template  = "$AccountName"
  resource_types  = ["AWS::CloudWatch::Metric", "AWS::Logs::LogGroup", "AWS::XRay::Trace"]
  sink_identifier = aws_oam_sink.main.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-oam-link-${count.index}"
    }
  )
}

# Create sink for receiving metrics from other accounts
resource "aws_oam_sink" "main" {
  name = "${local.name_prefix}-oam-sink"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-observability-sink"
    }
  )
}

# Sink policy to allow cross-account access
resource "aws_oam_sink_policy" "main" {
  sink_identifier = aws_oam_sink.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = {
          AWS = [for account_id in var.cross_account_ids : "arn:aws:iam::${account_id}:root"]
        }
        Action = [
          "oam:CreateLink",
          "oam:UpdateLink"
        ]
        Resource = aws_oam_sink.main.arn
        Condition = {
          "ForAllValues:StringEquals" = {
            "oam:ResourceTypes" = [
              "AWS::CloudWatch::Metric",
              "AWS::Logs::LogGroup",
              "AWS::XRay::Trace"
            ]
          }
        }
      }
    ]
  })
}

# Dashboard for cross-account metrics
resource "aws_cloudwatch_dashboard" "cross_account_monitoring" {
  dashboard_name = "${local.name_prefix}-cross-account-monitoring"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = concat(
            [
              ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Current Account" }]
            ],
            [
              for account_id in var.cross_account_ids :
              ["AWS/Lambda", "Invocations", { stat = "Sum", accountId = account_id, label = "Account ${account_id}" }]
            ]
          )
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Cross-Account Lambda Invocations"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            for account_id in var.cross_account_ids :
            ["AWS/Lambda", "Errors", { stat = "Sum", accountId = account_id, label = "Errors - ${account_id}" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "Cross-Account Error Tracking"
        }
      }
    ]
  })
}
```

## File: outputs.tf

```hcl
output "metric_stream_name" {
  description = "Name of the CloudWatch Metric Stream"
  value       = aws_cloudwatch_metric_stream.main.name
}

output "metric_stream_arn" {
  description = "ARN of the CloudWatch Metric Stream"
  value       = aws_cloudwatch_metric_stream.main.arn
}

output "s3_bucket_metrics" {
  description = "S3 bucket for metric storage"
  value       = aws_s3_bucket.metric_streams.id
}

output "s3_bucket_synthetics" {
  description = "S3 bucket for Synthetics artifacts"
  value       = aws_s3_bucket.synthetics_artifacts.id
}

output "lambda_processor_arn" {
  description = "ARN of the metric processor Lambda function"
  value       = aws_lambda_function.metric_processor.arn
}

output "lambda_alarm_processor_arn" {
  description = "ARN of the alarm processor Lambda function"
  value       = aws_lambda_function.alarm_processor.arn
}

output "sns_critical_topic_arn" {
  description = "ARN of the critical alarms SNS topic"
  value       = aws_sns_topic.critical_alarms.arn
}

output "sns_warning_topic_arn" {
  description = "ARN of the warning alarms SNS topic"
  value       = aws_sns_topic.warning_alarms.arn
}

output "sns_info_topic_arn" {
  description = "ARN of the info alarms SNS topic"
  value       = aws_sns_topic.info_alarms.arn
}

output "dashboard_url" {
  description = "URL to the main CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "composite_alarm_system_health" {
  description = "Name of the system health composite alarm"
  value       = aws_cloudwatch_composite_alarm.system_health.alarm_name
}

output "composite_alarm_performance" {
  description = "Name of the performance composite alarm"
  value       = aws_cloudwatch_composite_alarm.performance_degradation.alarm_name
}

output "canary_primary_name" {
  description = "Name of the primary region Synthetics canary"
  value       = aws_synthetics_canary.api_health_primary.name
}

output "canary_secondary_name" {
  description = "Name of the secondary region Synthetics canary"
  value       = aws_synthetics_canary.api_health_secondary.name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster with Container Insights enabled"
  value       = aws_ecs_cluster.main.name
}

output "oam_sink_arn" {
  description = "ARN of the CloudWatch Observability Access Manager sink"
  value       = aws_oam_sink.main.arn
}

output "cross_account_role_arn" {
  description = "ARN of the cross-account sharing IAM role"
  value       = length(var.cross_account_ids) > 0 ? aws_iam_role.cross_account_sharing[0].arn : null
}

output "log_group_application" {
  description = "Name of the application CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.application.name
}
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and customize values

environment_suffix = "prod-abc123"
region            = "us-east-1"
secondary_region  = "us-west-2"

cost_center         = "FinOps"
environment         = "prod"
data_classification = "Confidential"

metric_retention_days = 450  # 15 months

# ECS cluster for Container Insights
ecs_cluster_name = "microservices-cluster"

# Cross-account observability
cross_account_ids = [
  # "123456789012",
  # "234567890123"
]

# Monitored endpoints for Synthetics
monitored_endpoints = [
  "https://api.example.com/health",
  "https://app.example.com"
]

# Email endpoints for alarm notifications
alarm_email_endpoints = [
  # "oncall@example.com",
  # "devops@example.com"
]
```

## File: README.md

```markdown
# CloudWatch Advanced Observability Platform

Comprehensive Terraform configuration for deploying an enterprise-grade observability platform using AWS CloudWatch.

## Features

This implementation includes all 10 mandatory requirements:

1. **CloudWatch Composite Alarms**: Multiple composite alarms with AND/OR logic monitoring 3+ metrics
2. **Lambda Functions**: ARM Graviton2-based Lambda functions for custom metric processing
3. **CloudWatch Metric Streams**: Streaming metrics to S3 with lifecycle policies (15-month retention)
4. **Anomaly Detectors**: Multiple anomaly detectors with customized threshold bands (1.5, 2, and 3 std dev)
5. **Custom Dashboards**: Comprehensive dashboards with 10+ widget types including line charts, gauges, pie charts, logs, alarms, and annotations
6. **Metric Filters**: Multiple metric filters extracting values from CloudWatch Logs
7. **SNS Topics**: Three SNS topics (Critical, Warning, Info) with subscription filters and exponential backoff retry
8. **CloudWatch Synthetics**: Canaries deployed in 2 regions (us-east-1 and us-west-2)
9. **Container Insights**: Enabled for ECS cluster with task-level metrics
10. **Cross-Account Observability**: CloudWatch Observability Access Manager for metric sharing

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CloudWatch Observability                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Metrics    │───▶│ Metric Math  │───▶│  Anomaly     │      │
│  │  Collection  │    │ Expressions  │    │  Detection   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │            Composite Alarms (AND/OR Logic)           │      │
│  └──────────────────────────────────────────────────────┘      │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  SNS Topic   │    │  SNS Topic   │    │  SNS Topic   │      │
│  │  (Critical)  │    │  (Warning)   │    │   (Info)     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                    │                    │              │
│         └────────────────────┴────────────────────┘              │
│                              │                                    │
│                              ▼                                    │
│                    ┌──────────────────┐                          │
│                    │  Lambda Alarm    │                          │
│                    │  Processor with  │                          │
│                    │ Exponential      │                          │
│                    │ Backoff Retry    │                          │
│                    └──────────────────┘                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              CloudWatch Metric Streams                  │    │
│  │                       │                                  │    │
│  │                       ▼                                  │    │
│  │          ┌──────────────────────┐                       │    │
│  │          │ Kinesis Firehose     │                       │    │
│  │          │ (Parquet conversion) │                       │    │
│  │          └──────────────────────┘                       │    │
│  │                       │                                  │    │
│  │                       ▼                                  │    │
│  │    ┌─────────────────────────────────────┐             │    │
│  │    │ S3 with Lifecycle Management        │             │    │
│  │    │ - 90d: Standard IA                  │             │    │
│  │    │ - 180d: Glacier IR                  │             │    │
│  │    │ - 365d: Deep Archive                │             │    │
│  │    │ - 450d: Expiration (15 months)      │             │    │
│  │    └─────────────────────────────────────┘             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          CloudWatch Synthetics (Multi-Region)          │    │
│  │                                                          │    │
│  │  ┌──────────────────┐      ┌──────────────────┐       │    │
│  │  │   us-east-1      │      │   us-west-2      │       │    │
│  │  │   Canary         │      │   Canary         │       │    │
│  │  └──────────────────┘      └──────────────────┘       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         ECS Container Insights (Task-Level)            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │    Cross-Account Observability (OAM)                   │    │
│  │    - Metric sharing across 3 accounts                  │    │
│  │    - Centralized monitoring                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI v2 configured with appropriate credentials
- IAM permissions for CloudWatch, Lambda, S3, SNS, ECS, Synthetics, and OAM
- Existing ECS cluster (or will create one)
- Two AWS regions available (primary and secondary)

## Quick Start

1. **Clone and Navigate**:
   ```bash
   cd lib/
   ```

2. **Configure Variables**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Initialize Terraform**:
   ```bash
   terraform init
   ```

4. **Plan Deployment**:
   ```bash
   terraform plan -var="environment_suffix=prod-abc123"
   ```

5. **Deploy**:
   ```bash
   terraform apply -var="environment_suffix=prod-abc123"
   ```

## Required Variables

- `environment_suffix`: Unique suffix for resource naming (e.g., "prod-abc123")

## Optional Variables

- `region`: Primary AWS region (default: "us-east-1")
- `secondary_region`: Secondary region for Synthetics (default: "us-west-2")
- `cost_center`: Cost center tag (default: "FinOps")
- `environment`: Environment name (default: "prod")
- `data_classification`: Data classification level (default: "Confidential")
- `metric_retention_days`: Metric retention in days (default: 450 = 15 months)
- `cross_account_ids`: List of AWS account IDs for cross-account observability
- `ecs_cluster_name`: ECS cluster name (default: "microservices-cluster")
- `monitored_endpoints`: List of endpoints for Synthetics monitoring
- `alarm_email_endpoints`: Email addresses for alarm notifications

## Key Components

### 1. CloudWatch Composite Alarms

Two composite alarms with complex AND/OR logic:

- **System Health**: `(High CPU AND High Memory) OR High Error Rate`
- **Performance Degradation**: `(High CPU OR High Memory) AND Slow Response`

### 2. Lambda Functions (ARM Graviton2)

- **Metric Processor**: Scheduled every 5 minutes, calculates composite metrics using metric math
- **Alarm Processor**: Handles alarm notifications with exponential backoff retry (5 attempts)

### 3. CloudWatch Metric Streams

- Streams metrics to S3 via Kinesis Firehose
- Converts to Parquet format using AWS Glue schema
- Lifecycle policies: 90d IA, 180d Glacier IR, 365d Deep Archive, 450d expiration

### 4. Anomaly Detectors

Four anomaly detectors with customized bands:
- Lambda Duration (2 std dev)
- Error Count (3 std dev)
- Response Time (1.5 std dev - tight)
- ECS Memory (2 std dev)

### 5. Custom Dashboards

Comprehensive dashboards with 10 widget types:
- Line charts with annotations
- Number/single value widgets
- Stacked area charts
- Log query widgets
- Alarm status widgets
- Pie charts
- Gauge widgets
- Bar charts
- Text/markdown widgets
- Anomaly detection visualizations

### 6. Metric Filters

Four metric filters extracting log data:
- Error count
- Response time
- 5xx server errors
- Memory usage

### 7. SNS Topics

Three severity-based topics with exponential backoff:
- **Critical**: 5 retries, max 600s delay
- **Warning**: 5 retries, max 600s delay
- **Info**: 3 retries, max 300s delay

### 8. CloudWatch Synthetics

Canaries in two regions:
- Python Selenium runtime v2.0
- 5-minute intervals
- 31-day artifact retention
- Active X-Ray tracing

### 9. Container Insights

- Enabled on ECS cluster
- Task-level metrics
- CPU/Memory reservation alarms
- Task error metric filters

### 10. Cross-Account Observability

- CloudWatch Observability Access Manager (OAM)
- Sink for receiving metrics
- Cross-account dashboards
- IAM roles with external ID

## Constraints Compliance

- ✅ **ARM Graviton2**: All Lambda functions use `arm64` architecture
- ✅ **Retry with Exponential Backoff**: SNS delivery policies and Lambda retry logic
- ✅ **15-Month Retention**: S3 lifecycle expires at 450 days
- ✅ **Metric Math**: Error rate, composite metrics calculated via expressions
- ✅ **Required Tags**: CostCenter, Environment, DataClassification on all resources
- ✅ **Multi-Region Synthetics**: Canaries in us-east-1 and us-west-2
- ✅ **Maintenance Window Filtering**: Lambda alarm processor suppresses non-prod alarms

## Outputs

Key outputs include:
- Metric stream ARN and name
- S3 bucket names
- Lambda function ARNs
- SNS topic ARNs
- Dashboard URLs
- Composite alarm names
- Canary names
- ECS cluster name
- OAM sink ARN

## Monitoring and Maintenance

### View Dashboards

```bash
# Get dashboard URL
terraform output dashboard_url
```

### Test Alarms

```bash
# Publish test metric to trigger alarm
aws cloudwatch put-metric-data \
  --namespace "CustomMetrics/cw-obs-${SUFFIX}" \
  --metric-name ErrorCount \
  --value 100
```

### Check Canary Status

```bash
# Primary region
aws synthetics get-canary --name cw-obs-${SUFFIX}-api-health-primary

# Secondary region
aws synthetics get-canary --name cw-obs-${SUFFIX}-api-health-secondary --region us-west-2
```

### Query Metrics in S3

```bash
# Athena query for metrics
aws athena start-query-execution \
  --query-string "SELECT * FROM metric_data WHERE metric_name = 'CPUUtilization' LIMIT 10" \
  --result-configuration OutputLocation=s3://your-results-bucket/
```

## Cost Optimization

- ARM Graviton2 Lambda functions (20% cost savings)
- S3 lifecycle policies reduce storage costs (90d IA, 180d Glacier, 365d Deep Archive)
- Metric math expressions reduce custom metric count
- VPC endpoints for CloudWatch APIs (not included, add if needed)

## Security

- S3 buckets encrypted at rest (AES256)
- All S3 buckets block public access
- IAM least privilege policies
- Lambda X-Ray tracing enabled
- SNS topics use delivery status logging

## Cleanup

```bash
# Destroy all resources (fully destroyable - no retention policies)
terraform destroy -var="environment_suffix=prod-abc123"
```

## Troubleshooting

### Lambda Permissions

If Lambda functions fail to execute:
```bash
aws logs tail /aws/lambda/cw-obs-${SUFFIX}-metric-processor --follow
```

### Metric Stream Issues

Check Firehose delivery:
```bash
aws logs tail /aws/kinesisfirehose/cw-obs-${SUFFIX} --follow
```

### Synthetics Failures

View canary run results:
```bash
aws synthetics get-canary-runs --name cw-obs-${SUFFIX}-api-health-primary
```

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda functions
2. Verify IAM permissions
3. Review Terraform state: `terraform show`
4. Check AWS service quotas

## License

This code is provided as-is for infrastructure deployment purposes.
```

## Summary

This Terraform implementation provides a comprehensive CloudWatch observability platform meeting all 10 mandatory requirements:

1. ✅ Composite alarms with AND/OR logic (2 composite alarms, 3+ metrics each)
2. ✅ Lambda functions with ARM Graviton2 (2 functions)
3. ✅ Metric Streams to S3 with lifecycle policies (15-month retention)
4. ✅ Anomaly detectors with customized bands (4 detectors, 1.5-3 std dev)
5. ✅ Custom dashboards with 5+ widget types (3 dashboards, 10+ widget types)
6. ✅ Metric filters on CloudWatch Logs (4 filters)
7. ✅ SNS topics with subscription filters (3 severity levels)
8. ✅ Synthetics canaries in 2+ regions (us-east-1, us-west-2)
9. ✅ Container Insights for ECS (task-level metrics)
10. ✅ Cross-account metric sharing (OAM sink and links)

The implementation is production-ready, modular, and follows AWS best practices for security, tagging, and cost optimization.
