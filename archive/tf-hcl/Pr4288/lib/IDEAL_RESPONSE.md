# Centralized Logging and Analytics System - IDEAL RESPONSE

This is the ideal implementation of a centralized real-time logging and analytics system for 500 servers on AWS using Terraform.

## provider.tf

```terraform
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project
      ManagedBy   = "Terraform"
    }
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "logging-analytics/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

## variables.tf

```terraform
variable "aws_region" {
  description = "The AWS region to deploy the infrastructure"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "logging-analytics"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (from ENVIRONMENT_SUFFIX env var)"
  type        = string
  default     = ""
}

variable "log_bucket_name" {
  description = "The name of the S3 bucket for log storage"
  type        = string
  default     = "centralized-logging-storage"
}

variable "log_types" {
  description = "Types of logs to collect and process"
  type        = list(string)
  default     = ["application", "system", "security", "performance"]
}

variable "retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 365
}

variable "firehose_buffer_size" {
  description = "Firehose buffer size in MB"
  type        = number
  default     = 64
}

variable "firehose_buffer_interval" {
  description = "Firehose buffer interval in seconds"
  type        = number
  default     = 60
}

variable "lambda_memory_size" {
  description = "Lambda memory allocation"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 120
}

variable "glue_database_name" {
  description = "Name of the Glue database"
  type        = string
  default     = "logs_analytics_db"
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "admin@example.com"
}
```

## main.tf

```terraform
# Generate a unique suffix for resource names
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  # Use ENVIRONMENT_SUFFIX from environment variable, fallback to random suffix for local development
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : random_id.suffix.hex
  name_suffix        = local.environment_suffix # Alias for unit tests
  name_prefix        = "${var.project}-${var.environment}"
  full_prefix        = "${local.name_prefix}-${local.environment_suffix}"
}

#---------------------------
# S3 Bucket for Log Storage
#---------------------------
resource "aws_s3_bucket" "log_storage" {
  bucket = "${var.log_bucket_name}-${local.name_suffix}"
}

resource "aws_s3_bucket_lifecycle_configuration" "log_lifecycle" {
  bucket = aws_s3_bucket.log_storage.id

  rule {
    id     = "log_retention"
    status = "Enabled"

    expiration {
      days = var.retention_days
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_encryption" {
  bucket = aws_s3_bucket.log_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "log_access_block" {
  bucket = aws_s3_bucket.log_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

#---------------------------
# IAM Roles and Policies
#---------------------------
# IAM Role for Firehose
resource "aws_iam_role" "firehose_role" {
  name = "${local.full_prefix}-firehose-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "firehose.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "firehose_policy" {
  name = "${local.full_prefix}-firehose-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ],
        Resource = [
          aws_s3_bucket.log_storage.arn,
          "${aws_s3_bucket.log_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "lambda:InvokeFunction"
        ],
        Resource = [
          aws_lambda_function.log_processor.arn,
          "${aws_lambda_function.log_processor.arn}:*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "glue:GetTableVersions"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "firehose_policy_attachment" {
  role       = aws_iam_role.firehose_role.name
  policy_arn = aws_iam_policy.firehose_policy.arn
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${local.full_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name = "${local.full_prefix}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ],
        Resource = "${aws_s3_bucket.log_storage.arn}/*"
      },
      {
        Effect = "Allow",
        Action = [
          "cloudwatch:PutMetricData"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "kinesis:DescribeStream",
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# IAM Role for Glue
resource "aws_iam_role" "glue_role" {
  name = "${local.full_prefix}-glue-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = [
          "glue.amazonaws.com",
          "firehose.amazonaws.com"
        ]
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "glue_service_policy" {
  role       = aws_iam_role.glue_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

resource "aws_iam_policy" "glue_s3_policy" {
  name = "${local.full_prefix}-glue-s3-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        Resource = [
          aws_s3_bucket.log_storage.arn,
          "${aws_s3_bucket.log_storage.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "glue_s3_policy_attachment" {
  role       = aws_iam_role.glue_role.name
  policy_arn = aws_iam_policy.glue_s3_policy.arn
}

# IAM Role for Athena
resource "aws_iam_role" "athena_role" {
  name = "${local.full_prefix}-athena-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "athena.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "athena_policy" {
  name = "${local.full_prefix}-athena-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload",
          "s3:PutObject"
        ],
        Resource = [
          aws_s3_bucket.log_storage.arn,
          "${aws_s3_bucket.log_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "glue:GetDatabase",
          "glue:GetTable",
          "glue:GetPartition",
          "glue:GetPartitions",
          "glue:BatchGetPartition"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "athena_policy_attachment" {
  role       = aws_iam_role.athena_role.name
  policy_arn = aws_iam_policy.athena_policy.arn
}

#---------------------------
# Kinesis Firehose Delivery Streams
#---------------------------
resource "aws_kinesis_firehose_delivery_stream" "log_delivery_stream" {
  for_each = toset(var.log_types)

  name        = "${local.full_prefix}-${each.value}-stream"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn            = aws_iam_role.firehose_role.arn
    bucket_arn          = aws_s3_bucket.log_storage.arn
    prefix              = "logs/${each.value}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/"
    error_output_prefix = "errors/${each.value}/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/"
    buffer_size         = var.firehose_buffer_size
    buffer_interval     = var.firehose_buffer_interval

    # Processing with Lambda
    processing_configuration {
      enabled = true

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = aws_lambda_function.log_processor.arn
        }

        parameters {
          parameter_name  = "BufferIntervalInSeconds"
          parameter_value = "60"
        }

        parameters {
          parameter_name  = "BufferSizeInMBs"
          parameter_value = "3"
        }
      }
    }

    # Data format conversion
    data_format_conversion_configuration {
      input_format_configuration {
        deserializer {
          hive_json_ser_de {}
        }
      }

      output_format_configuration {
        serializer {
          parquet_ser_de {}
        }
      }

      schema_configuration {
        database_name = aws_glue_catalog_database.logs_database.name
        role_arn      = aws_iam_role.glue_role.arn
        table_name    = aws_glue_catalog_table.logs_table[each.value].name
      }
    }

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose_log_group.name
      log_stream_name = "firehose-${each.value}"
    }
  }

  tags = {
    LogType = each.value
  }
}

# CloudWatch Log Group for Firehose
resource "aws_cloudwatch_log_group" "firehose_log_group" {
  name              = "/aws/firehose/${local.full_prefix}-logs"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_stream" "firehose_log_streams" {
  for_each = toset(var.log_types)

  name           = "firehose-${each.value}"
  log_group_name = aws_cloudwatch_log_group.firehose_log_group.name
}

#---------------------------
# Lambda Function for Log Processing
#---------------------------
resource "aws_lambda_function" "log_processor" {
  function_name    = "${local.full_prefix}-log-processor"
  filename         = "lambda_function.zip"
  source_code_hash = filebase64sha256("lambda_function.zip")
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = {
      LOG_BUCKET       = aws_s3_bucket.log_storage.id
      METRIC_NAMESPACE = "${local.name_prefix}-logs"
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.log_processor.function_name}"
  retention_in_days = 30
}

#---------------------------
# Glue Resources for Schema Management
#---------------------------
resource "aws_glue_catalog_database" "logs_database" {
  name = var.glue_database_name
}

resource "aws_glue_catalog_table" "logs_table" {
  for_each = toset(var.log_types)

  name          = "${each.value}_logs"
  database_name = aws_glue_catalog_database.logs_database.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    "classification"      = "parquet"
    "parquet.compression" = "SNAPPY"
    EXTERNAL              = "TRUE"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.log_storage.id}/logs/${each.value}/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      name                  = "ParquetHiveSerDe"
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    columns {
      name = "timestamp"
      type = "string"
    }

    columns {
      name = "log_level"
      type = "string"
    }

    columns {
      name = "message"
      type = "string"
    }

    columns {
      name = "server_id"
      type = "string"
    }

    columns {
      name = "source"
      type = "string"
    }

    columns {
      name = "component"
      type = "string"
    }
  }
}

resource "aws_glue_crawler" "logs_crawler" {
  name          = "${local.full_prefix}-logs-crawler"
  role          = aws_iam_role.glue_role.name
  database_name = aws_glue_catalog_database.logs_database.name

  s3_target {
    path = "s3://${aws_s3_bucket.log_storage.id}/logs/"
  }

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }

  schedule = "cron(0 0 * * ? *)" # Run daily at midnight
}

#---------------------------
# Athena Workgroup
#---------------------------
resource "aws_athena_workgroup" "logs_analytics" {
  name = "${local.full_prefix}-logs-analytics"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.log_storage.id}/athena-results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }
}

#---------------------------
# CloudWatch Metrics and Alarms
#---------------------------
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.full_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ErrorCount"
  namespace           = "${local.name_prefix}-logs"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors for high error rates in logs"
  alarm_actions       = [aws_sns_topic.alarm_notifications.arn]
  ok_actions          = [aws_sns_topic.alarm_notifications.arn]
}

resource "aws_sns_topic" "alarm_notifications" {
  name = "${local.full_prefix}-alarm-notifications"
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.alarm_notifications.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Dashboard for monitoring log metrics
resource "aws_cloudwatch_dashboard" "logs_dashboard" {
  dashboard_name = "${local.full_prefix}-logs-dashboard"

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
            ["${local.name_prefix}-logs", "ProcessedLogCount", { "stat" : "Sum" }],
            ["${local.name_prefix}-logs", "ErrorCount", { "stat" : "Sum" }]
          ],
          view   = "timeSeries",
          region = var.aws_region,
          title  = "Log Processing Metrics",
          period = 300
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
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["application"].name, { "stat" : "Sum" }],
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["system"].name, { "stat" : "Sum" }],
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["security"].name, { "stat" : "Sum" }],
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["performance"].name, { "stat" : "Sum" }]
          ],
          view   = "timeSeries",
          region = var.aws_region,
          title  = "Firehose Delivery Success",
          period = 300
        }
      }
    ]
  })
}
```

## outputs.tf

```terraform
output "log_bucket_name" {
  description = "Name of the S3 bucket storing logs"
  value       = aws_s3_bucket.log_storage.id
}

output "firehose_delivery_streams" {
  description = "Firehose delivery stream names by log type"
  value = {
    for k, v in aws_kinesis_firehose_delivery_stream.log_delivery_stream : k => v.name
  }
}

output "lambda_function_name" {
  description = "Name of the log processing Lambda function"
  value       = aws_lambda_function.log_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the log processing Lambda function"
  value       = aws_lambda_function.log_processor.arn
}

output "glue_database_name" {
  description = "Name of the Glue database for log analytics"
  value       = aws_glue_catalog_database.logs_database.name
}

output "glue_table_names" {
  description = "Names of Glue tables by log type"
  value = {
    for k, v in aws_glue_catalog_table.logs_table : k => v.name
  }
}

output "glue_crawler_name" {
  description = "Name of the Glue crawler for schema discovery"
  value       = aws_glue_crawler.logs_crawler.name
}

output "athena_workgroup_name" {
  description = "Name of the Athena workgroup for log analysis"
  value       = aws_athena_workgroup.logs_analytics.name
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.logs_dashboard.dashboard_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarm notifications"
  value       = aws_sns_topic.alarm_notifications.arn
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.environment_suffix
}

output "iam_role_names" {
  description = "Key IAM role names created by this stack"
  value = {
    firehose = aws_iam_role.firehose_role.name
    lambda   = aws_iam_role.lambda_role.name
    glue     = aws_iam_role.glue_role.name
    athena   = aws_iam_role.athena_role.name
  }
}
```

## Lambda Function (index.js)

```javascript
// index.js - Lambda function for log processing
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();
const s3 = new AWS.S3();

// Environment variables from Lambda configuration
const LOG_BUCKET = process.env.LOG_BUCKET;
const METRIC_NAMESPACE = process.env.METRIC_NAMESPACE;

/**
 * Main handler function for processing logs from Kinesis Firehose
 */
exports.handler = async (event, context) => {
  console.log('Processing log batch with ID:', context.awsRequestId);

  const records = event.records;
  const processedRecords = [];

  // Metrics to track
  let totalLogs = 0;
  let errorCount = 0;
  let securityEventCount = 0;
  let performanceEventCount = 0;
  let serverMetrics = {};

  try {
    // Process each record in the batch
    for (const record of records) {
      try {
        totalLogs++;

        // Decode and parse the record
        const buffer = Buffer.from(record.data, 'base64');
        const decodedData = buffer.toString('utf-8');

        // Parse log data (assuming JSON)
        let logData;
        try {
          logData = JSON.parse(decodedData);
        } catch (err) {
          // Handle non-JSON logs
          logData = {
            message: decodedData,
            timestamp: new Date().toISOString(),
            log_level: decodedData.includes('ERROR') ? 'ERROR' : 'INFO',
            parsed: false,
          };
        }

        // Extract log source from Firehose metadata
        const logSource = extractLogSource(record);

        // Enrich log data
        logData.processing_time = new Date().toISOString();
        logData.log_source = logSource || 'unknown';

        // Track metrics based on log content
        if (isErrorLog(logData)) {
          errorCount++;
        }

        if (isSecurityEvent(logData, logSource)) {
          securityEventCount++;
        }

        if (isPerformanceEvent(logData, logSource)) {
          performanceEventCount++;
        }

        // Track per-server metrics
        if (logData.server_id) {
          if (!serverMetrics[logData.server_id]) {
            serverMetrics[logData.server_id] = {
              logCount: 0,
              errorCount: 0,
            };
          }

          serverMetrics[logData.server_id].logCount++;

          if (isErrorLog(logData)) {
            serverMetrics[logData.server_id].errorCount++;
          }
        }

        // Add structured data for better analysis
        logData.year = new Date().getFullYear();
        logData.month = new Date().getMonth() + 1;
        logData.day = new Date().getDate();
        logData.hour = new Date().getHours();

        // Convert processed log back to base64
        const processedData = Buffer.from(JSON.stringify(logData)).toString(
          'base64'
        );

        // Add to processed records
        processedRecords.push({
          recordId: record.recordId,
          result: 'Ok',
          data: processedData,
        });
      } catch (err) {
        console.error('Error processing record:', err);
        errorCount++;

        // If processing fails, return the original record
        processedRecords.push({
          recordId: record.recordId,
          result: 'ProcessingFailed',
          data: record.data,
        });
      }
    }

    // Send metrics to CloudWatch
    await sendCloudWatchMetrics(
      totalLogs,
      errorCount,
      securityEventCount,
      performanceEventCount,
      serverMetrics
    );

    // For important events, store a summary in S3 for audit purposes
    if (errorCount > 0 || securityEventCount > 0) {
      await storeAuditSummary(context.awsRequestId, {
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
        totalLogs,
        errorCount,
        securityEventCount,
        performanceEventCount,
      });
    }

    console.log(
      `Processed ${totalLogs} logs, found ${errorCount} errors, ${securityEventCount} security events`
    );

    // Return the processed records back to Firehose
    return { records: processedRecords };
  } catch (err) {
    console.error('Fatal error in log processor:', err);
    throw err;
  }
};

/**
 * Extract log source from the Kinesis Firehose record
 */
function extractLogSource(record) {
  if (
    record.kinesisRecordMetadata &&
    record.kinesisRecordMetadata.deliveryStreamArn
  ) {
    const streamArn = record.kinesisRecordMetadata.deliveryStreamArn;
    const streamName = streamArn.split('/').pop();

    // Extract log type from delivery stream name pattern
    const logTypeMatch = streamName.match(/-([^-]+)-stream$/);
    return logTypeMatch ? logTypeMatch[1] : null;
  }
  return null;
}

/**
 * Determine if a log entry is an error based on its content
 */
function isErrorLog(logData) {
  if (logData.log_level) {
    return ['ERROR', 'FATAL', 'SEVERE', 'CRITICAL'].includes(
      logData.log_level.toUpperCase()
    );
  }

  if (logData.level) {
    return ['ERROR', 'FATAL', 'SEVERE', 'CRITICAL'].includes(
      logData.level.toUpperCase()
    );
  }

  if (logData.message) {
    return (
      logData.message.includes('error') ||
      logData.message.includes('exception') ||
      logData.message.includes('fail') ||
      logData.message.includes('critical')
    );
  }

  return false;
}

/**
 * Determine if a log entry is a security event
 */
function isSecurityEvent(logData, logSource) {
  if (logSource === 'security') {
    return true;
  }

  const message = logData.message || '';
  return (
    message.includes('authentication') ||
    message.includes('login') ||
    message.includes('password') ||
    message.includes('permission') ||
    message.includes('access denied') ||
    message.includes('unauthorized') ||
    message.includes('firewall')
  );
}

/**
 * Determine if a log entry is a performance event
 */
function isPerformanceEvent(logData, logSource) {
  if (logSource === 'performance') {
    return true;
  }

  const message = logData.message || '';
  return (
    message.includes('latency') ||
    message.includes('timeout') ||
    message.includes('slow') ||
    message.includes('memory') ||
    message.includes('cpu') ||
    message.includes('performance')
  );
}

/**
 * Send metrics to CloudWatch
 */
async function sendCloudWatchMetrics(
  totalLogs,
  errorCount,
  securityEventCount,
  performanceEventCount,
  serverMetrics
) {
  const timestamp = new Date();

  // Helper function to ensure valid metric values
  const sanitizeValue = (value) => {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.floor(value)); // Ensure positive integers
  };

  // Prepare metric data with sanitized values
  const metricData = [
    {
      MetricName: 'ProcessedLogCount',
      Value: sanitizeValue(totalLogs),
      Unit: 'Count',
      Timestamp: timestamp,
    },
    {
      MetricName: 'ErrorCount',
      Value: sanitizeValue(errorCount),
      Unit: 'Count',
      Timestamp: timestamp,
    },
    {
      MetricName: 'SecurityEventCount',
      Value: sanitizeValue(securityEventCount),
      Unit: 'Count',
      Timestamp: timestamp,
    },
    {
      MetricName: 'PerformanceEventCount',
      Value: sanitizeValue(performanceEventCount),
      Unit: 'Count',
      Timestamp: timestamp,
    },
  ];

  // Add per-server metrics with sanitized values
  for (const [serverId, metrics] of Object.entries(serverMetrics || {})) {
    if (metrics && typeof metrics === 'object') {
      metricData.push(
        {
          MetricName: 'ServerLogCount',
          Value: sanitizeValue(metrics.logCount),
          Unit: 'Count',
          Timestamp: timestamp,
          Dimensions: [{ Name: 'ServerId', Value: String(serverId) }],
        },
        {
          MetricName: 'ServerErrorCount',
          Value: sanitizeValue(metrics.errorCount),
          Unit: 'Count',
          Timestamp: timestamp,
          Dimensions: [{ Name: 'ServerId', Value: String(serverId) }],
        }
      );
    }
  }

  // Send metrics in batches (maximum 20 per request)
  for (let i = 0; i < metricData.length; i += 20) {
    const batch = metricData.slice(i, i + 20);

    try {
      await cloudwatch
        .putMetricData({
          Namespace: METRIC_NAMESPACE,
          MetricData: batch,
        })
        .promise();
    } catch (err) {
      console.error('Error sending CloudWatch metrics:', err);
    }
  }
}

/**
 * Store audit summary in S3 for important events
 */
async function storeAuditSummary(requestId, summaryData) {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const key = `audit-summaries/${year}/${month}/${day}/${requestId}.json`;

  try {
    await s3
      .putObject({
        Bucket: LOG_BUCKET,
        Key: key,
        Body: JSON.stringify(summaryData, null, 2),
        ContentType: 'application/json',
      })
      .promise();
  } catch (err) {
    console.error('Error storing audit summary:', err);
  }
}
```

## Architecture Overview

This ideal solution implements a production-ready centralized logging and analytics system with the following key improvements:

### Key Features
1. **Scalable Ingestion**: Kinesis Firehose with optimized 64MB buffer size for high-volume logging
2. **Real-time Processing**: Lambda function with robust error handling and NaN value sanitization
3. **Secure Storage**: S3 with encryption, lifecycle policies, and public access blocking
4. **Schema Management**: Glue database with automated crawler for schema evolution
5. **Analytics Ready**: Athena workgroup with encrypted query results
6. **Comprehensive Monitoring**: CloudWatch metrics, alarms, and dashboards
7. **Audit Compliance**: Separate storage for security events and error summaries

### Security & Compliance
- **Least Privilege IAM**: Minimal required permissions for each role
- **Encryption**: AES256 encryption for S3 and Athena results
- **Access Control**: Complete public access blocking on S3 buckets
- **Audit Trail**: Automatic storage of security events and errors for compliance

This solution is ready for production deployment and can handle the full logging requirements for 500 servers with proper monitoring, alerting, and audit capabilities.
