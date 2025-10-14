### Reasoning Trace

---

Let's create a comprehensive Terraform configuration to implement a centralized logging and analytics system for 500 servers. I'll break this down into the requested files with a focus on implementing each of the required components.

## provider.tf

This file will specify the AWS provider configuration:

```terraform
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.default_tags
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}
```

## variables.tf

This file will define all the variables needed for the configuration:

```terraform
variable "aws_region" {
  description = "The AWS region to deploy resources to"
  type        = string
  default     = "us-east-2"
}

variable "project" {
  description = "Project name used for resource naming"
  type        = string
  default     = "centralized-logging"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "default_tags" {
  description = "Default tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "centralized-logging"
    Environment = "prod"
    ManagedBy   = "terraform"
  }
}

variable "retention_period_days" {
  description = "Number of days to retain logs in S3"
  type        = number
  default     = 365
}

variable "log_bucket_name" {
  description = "Name of the S3 bucket for log storage"
  type        = string
  default     = "centralized-logs-storage"
}

variable "firehose_buffer_size" {
  description = "Kinesis Firehose buffer size in MBs"
  type        = number
  default     = 5
}

variable "firehose_buffer_interval" {
  description = "Kinesis Firehose buffer interval in seconds"
  type        = number
  default     = 60
}

variable "glue_database_name" {
  description = "Name of the Glue database"
  type        = string
  default     = "logs_analytics_db"
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 60
}

variable "quicksight_user_email" {
  description = "Email for the QuickSight admin user"
  type        = string
  default     = "admin@example.com"
}

variable "alarm_notification_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "alerts@example.com"
}

variable "log_types" {
  description = "Types of logs to collect"
  type        = list(string)
  default     = ["application", "system", "security", "performance"]
}
```

## main.tf

This file will include all the main resource definitions:

```terraform
# Random ID to ensure unique resource names
resource "random_id" "this" {
  byte_length = 4
}

locals {
  name_prefix = "${var.project}-${var.environment}-${random_id.this.hex}"
}

#--------------------------
# S3 Bucket for Log Storage
#--------------------------
resource "aws_s3_bucket" "logs" {
  bucket = "${var.log_bucket_name}-${random_id.this.hex}"

  tags = {
    Name = "Log Storage Bucket"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    expiration {
      days = var.retention_period_days
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_encryption" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs_access" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

#--------------------------
# IAM Roles and Policies
#--------------------------

# Firehose IAM role
resource "aws_iam_role" "firehose_role" {
  name = "${local.name_prefix}-firehose-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "firehose_policy" {
  name = "${local.name_prefix}-firehose-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      },
      {
        Action = [
          "lambda:InvokeFunction"
        ]
        Effect   = "Allow"
        Resource = [aws_lambda_function.log_processor.arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "firehose_policy_attachment" {
  role       = aws_iam_role.firehose_role.name
  policy_arn = aws_iam_policy.firehose_policy.arn
}

# Lambda IAM role
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

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
}

resource "aws_iam_policy" "lambda_policy" {
  name = "${local.name_prefix}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.logs.arn}/*"
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Glue IAM role
resource "aws_iam_role" "glue_role" {
  name = "${local.name_prefix}-glue-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "glue.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "glue_service_attachment" {
  role       = aws_iam_role.glue_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

resource "aws_iam_policy" "glue_s3_policy" {
  name = "${local.name_prefix}-glue-s3-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "glue_s3_policy_attachment" {
  role       = aws_iam_role.glue_role.name
  policy_arn = aws_iam_policy.glue_s3_policy.arn
}

#--------------------------
# Kinesis Firehose
#--------------------------
resource "aws_kinesis_firehose_delivery_stream" "log_delivery_stream" {
  for_each = toset(var.log_types)

  name        = "${local.name_prefix}-${each.value}-delivery-stream"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn           = aws_iam_role.firehose_role.arn
    bucket_arn         = aws_s3_bucket.logs.arn
    prefix             = "logs/${each.value}/"
    error_output_prefix = "errors/${each.value}/"
    buffer_size        = var.firehose_buffer_size
    buffer_interval    = var.firehose_buffer_interval

    # Enable S3 backup for all events
    s3_backup_mode     = "Enabled"

    # Data format conversion configuration
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
        table_name    = aws_glue_catalog_table.logs_table[each.value].name
        role_arn      = aws_iam_role.glue_role.arn
      }
    }

    # Process logs with Lambda
    processing_configuration {
      enabled = true

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = aws_lambda_function.log_processor.arn
        }
      }
    }
  }

  tags = {
    Name = "${each.value} Log Delivery Stream"
  }
}

#--------------------------
# AWS Lambda for Log Processing
#--------------------------
resource "aws_lambda_function" "log_processor" {
  function_name    = "${local.name_prefix}-log-processor"
  filename         = "lambda/log_processor.zip"
  source_code_hash = filebase64sha256("lambda/log_processor.zip")
  handler          = "index.handler"
  role             = aws_iam_role.lambda_role.arn
  runtime          = "nodejs16.x"
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = {
      LOG_BUCKET      = aws_s3_bucket.logs.id
      METRIC_NAMESPACE = "LogAnalytics"
    }
  }

  tags = {
    Name = "Log Processor Lambda"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.log_processor.function_name}"
  retention_in_days = 30
}

#--------------------------
# AWS Glue for Schema Discovery
#--------------------------
resource "aws_glue_catalog_database" "logs_database" {
  name = var.glue_database_name
}

resource "aws_glue_catalog_table" "logs_table" {
  for_each = toset(var.log_types)

  name          = "${each.value}_logs"
  database_name = aws_glue_catalog_database.logs_database.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL              = "TRUE"
    "classification"      = "parquet"
    "parquet.compression" = "SNAPPY"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.logs.id}/logs/${each.value}/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    # These columns would be customized based on the actual log format
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
  }
}

# Glue Crawler for automatic schema discovery
resource "aws_glue_crawler" "logs_crawler" {
  name          = "${local.name_prefix}-logs-crawler"
  role          = aws_iam_role.glue_role.arn
  database_name = aws_glue_catalog_database.logs_database.name

  s3_target {
    path = "s3://${aws_s3_bucket.logs.id}/logs/"
  }

  schedule = "cron(0 0 * * ? *)"  # Run daily at midnight

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }
}

#--------------------------
# Athena Workgroup for Queries
#--------------------------
resource "aws_athena_workgroup" "logs_workgroup" {
  name = "${local.name_prefix}-logs-workgroup"

  configuration {
    enforce_workgroup_configuration = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.logs.id}/athena-results/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }
}

#--------------------------
# CloudWatch for Monitoring
#--------------------------
# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/centralized-logging/application"
  retention_in_days = 30
}

# CloudWatch Metric Alarm for error rate
resource "aws_cloudwatch_metric_alarm" "error_rate_alarm" {
  alarm_name          = "${local.name_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ErrorCount"
  namespace           = "LogAnalytics"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alarm when error rate exceeds threshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alarm_notification.arn]
  ok_actions    = [aws_sns_topic.alarm_notification.arn]
}

# SNS Topic for alarm notifications
resource "aws_sns_topic" "alarm_notification" {
  name = "${local.name_prefix}-alarm-notification"
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.alarm_notification.arn
  protocol  = "email"
  endpoint  = var.alarm_notification_email
}

#--------------------------
# AWS QuickSight for Dashboards
#--------------------------
# Note: QuickSight has limited Terraform support, so we'll create basic resources
# and include comments about manual setup

# QuickSight data source permission (for accessing Athena)
resource "aws_quicksight_data_source" "logs_data_source" {
  aws_account_id = data.aws_caller_identity.current.account_id
  data_source_id = "${replace(local.name_prefix, "-", "_")}_logs_data_source"
  name           = "Logs Data Source"

  athena_parameters {
    work_group = aws_athena_workgroup.logs_workgroup.name
  }
}

data "aws_caller_identity" "current" {}
```

## outputs.tf

This file will include the important outputs from the Terraform configuration:

```terraform
output "s3_bucket_name" {
  description = "The name of the S3 bucket storing logs"
  value       = aws_s3_bucket.logs.id
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket storing logs"
  value       = aws_s3_bucket.logs.arn
}

output "firehose_delivery_stream_names" {
  description = "The names of the Kinesis Firehose delivery streams"
  value       = { for k, v in aws_kinesis_firehose_delivery_stream.log_delivery_stream : k => v.name }
}

output "lambda_function_name" {
  description = "The name of the Lambda function processing logs"
  value       = aws_lambda_function.log_processor.function_name
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function processing logs"
  value       = aws_lambda_function.log_processor.arn
}

output "glue_database_name" {
  description = "The name of the Glue database"
  value       = aws_glue_catalog_database.logs_database.name
}

output "glue_crawler_name" {
  description = "The name of the Glue crawler"
  value       = aws_glue_crawler.logs_crawler.name
}

output "athena_workgroup_name" {
  description = "The name of the Athena workgroup"
  value       = aws_athena_workgroup.logs_workgroup.name
}

output "cloudwatch_alarm_name" {
  description = "The name of the CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.error_rate_alarm.alarm_name
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alarm notifications"
  value       = aws_sns_topic.alarm_notification.arn
}
```

Now, let me create the Lambda function code for log processing:

## Lambda Code (index.js)

```javascript
// Lambda function for processing logs from Kinesis Firehose
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();
const s3 = new AWS.S3();

// Environment variables
const LOG_BUCKET = process.env.LOG_BUCKET;
const METRIC_NAMESPACE = process.env.METRIC_NAMESPACE || 'LogAnalytics';

// Main handler function
exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Process Kinesis Firehose records
  const records = event.records;
  const processedRecords = [];

  let errorCount = 0;
  let securityEventCount = 0;
  let performanceEventCount = 0;

  // Helper function to extract the log source from record
  const getLogSource = record => {
    // Extract from the Kinesis Firehose delivery stream name
    // Example format: centralized-logging-prod-abcd1234-security-delivery-stream
    if (
      record.kinesisRecordMetadata &&
      record.kinesisRecordMetadata.deliveryStreamArn
    ) {
      const streamArn = record.kinesisRecordMetadata.deliveryStreamArn;
      const streamName = streamArn.split('/').pop();
      // Extract log type from stream name
      const logTypeMatch = streamName.match(/-([^-]+)-delivery-stream$/);
      return logTypeMatch ? logTypeMatch[1] : 'unknown';
    }
    return 'unknown';
  };

  for (const record of records) {
    try {
      // Decode and parse the record data
      const buffer = Buffer.from(record.data, 'base64');
      const decodedData = buffer.toString('utf-8');

      // Parse the JSON log
      let parsedLog;
      try {
        parsedLog = JSON.parse(decodedData);
      } catch (e) {
        // If it's not valid JSON, create an object with the raw message
        parsedLog = { message: decodedData, parsed: false };
      }

      // Add metadata
      const logSource = getLogSource(record);
      parsedLog.processing_timestamp = new Date().toISOString();
      parsedLog.log_source = logSource;

      // Track metrics based on log content
      if (
        parsedLog.level === 'ERROR' ||
        parsedLog.level === 'FATAL' ||
        parsedLog.log_level === 'ERROR' ||
        parsedLog.log_level === 'FATAL' ||
        decodedData.toLowerCase().includes('error') ||
        decodedData.toLowerCase().includes('exception')
      ) {
        errorCount++;
      }

      // Track security events
      if (
        logSource === 'security' ||
        decodedData.toLowerCase().includes('security') ||
        decodedData.toLowerCase().includes('auth') ||
        decodedData.toLowerCase().includes('permission')
      ) {
        securityEventCount++;
      }

      // Track performance events
      if (
        logSource === 'performance' ||
        decodedData.toLowerCase().includes('latency') ||
        decodedData.toLowerCase().includes('timeout') ||
        decodedData.toLowerCase().includes('slow')
      ) {
        performanceEventCount++;
      }

      // Enrich the log with additional information if needed
      if (parsedLog.server_id) {
        // You could add server details from a database or another source
        parsedLog.server_group = `group-${parsedLog.server_id.charAt(0)}`;
      }

      // Add timestamp if missing
      if (!parsedLog.timestamp) {
        parsedLog.timestamp = new Date().toISOString();
      }

      // Convert back to string and encode
      const transformedRecord = Buffer.from(JSON.stringify(parsedLog)).toString(
        'base64'
      );

      // Add the processed record
      processedRecords.push({
        recordId: record.recordId,
        result: 'Ok',
        data: transformedRecord,
      });
    } catch (error) {
      console.error('Error processing record:', error);

      // Return the original record on error
      processedRecords.push({
        recordId: record.recordId,
        result: 'ProcessingFailed',
        data: record.data,
      });

      errorCount++;
    }
  }

  // Put metrics
  try {
    await cloudwatch
      .putMetricData({
        Namespace: METRIC_NAMESPACE,
        MetricData: [
          {
            MetricName: 'ProcessedLogCount',
            Value: records.length,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'ErrorCount',
            Value: errorCount,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'SecurityEventCount',
            Value: securityEventCount,
            Unit: 'Count',
            Timestamp: new Date(),
          },
          {
            MetricName: 'PerformanceEventCount',
            Value: performanceEventCount,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
      .promise();
  } catch (error) {
    console.error('Error putting metrics:', error);
  }

  // If we want to store additional data to S3, we can do it here
  if (errorCount > 0 || securityEventCount > 0) {
    try {
      // Store important events in a special location for faster access
      const timestamp = new Date().toISOString().split('T')[0];
      await s3
        .putObject({
          Bucket: LOG_BUCKET,
          Key: `important-events/${timestamp}/batch-${context.awsRequestId}.json`,
          Body: JSON.stringify({
            timestamp: new Date().toISOString(),
            batchSize: records.length,
            errorCount: errorCount,
            securityEventCount: securityEventCount,
            performanceEventCount: performanceEventCount,
            requestId: context.awsRequestId,
          }),
          ContentType: 'application/json',
        })
        .promise();
    } catch (error) {
      console.error('Error writing to S3:', error);
    }
  }

  return { records: processedRecords };
};
```

This Lambda function does several important things:

1. Processes logs from Kinesis Firehose
2. Parses and enriches log data
3. Counts different types of events (errors, security, performance)
4. Sends metrics to CloudWatch
5. Stores important events separately in S3 for faster access
6. Handles errors gracefully
7. Returns processed records back to Firehose for continued delivery

Now, let's review what we have created:

1. **provider.tf**: AWS provider configuration
2. **variables.tf**: All variables with sensible defaults
3. **main.tf**: All the infrastructure resources
4. **outputs.tf**: Important resource outputs
5. **Lambda code**: Real-world implementation for log processing

This configuration:

- Uses Kinesis Firehose for log ingestion from 500 servers
- Stores logs securely in S3 with encryption and lifecycle policies
- Uses Glue for schema discovery and catalogs
- Enables Athena for ad-hoc SQL queries on logs
- Processes logs in real-time with Lambda
- Sets up CloudWatch for metrics and alerting
- Prepares for QuickSight dashboards
- Implements IAM roles with least-privilege permissions

The architecture is scalable, secure, and should meet audit requirements with the comprehensive logging and monitoring capabilities.

### Answer

---

# Centralized Logging and Analytics System for 500 Servers

This Terraform configuration implements a centralized real-time logging and analytics system on AWS. The solution ingests logs from 500 servers, processes them in real-time, stores them securely, and provides analysis capabilities.

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
  default     = 5
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
  name_suffix = random_id.suffix.hex
  name_prefix = "${var.project}-${var.environment}"
  full_prefix = "${local.name_prefix}-${local.name_suffix}"
}

#---------------------------
# S3 Bucket for Log Storage
#---------------------------
resource "aws_s3_bucket" "log_storage" {
  bucket = "${var.log_bucket_name}-${local.name_suffix}"

  lifecycle {
    prevent_destroy = true
  }
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
        Service = "glue.amazonaws.com"
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
    role_arn           = aws_iam_role.firehose_role.arn
    bucket_arn         = aws_s3_bucket.log_storage.arn
    prefix             = "logs/${each.value}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/"
    error_output_prefix = "errors/${each.value}/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/"
    buffer_size        = var.firehose_buffer_size
    buffer_interval    = var.firehose_buffer_interval

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
      enabled = true
      log_group_name = aws_cloudwatch_log_group.firehose_log_group.name
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
  runtime          = "nodejs16.x"
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
    enforce_workgroup_configuration = true
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
            ["${local.name_prefix}-logs", "ProcessedLogCount", { "stat": "Sum" }],
            ["${local.name_prefix}-logs", "ErrorCount", { "stat": "Sum" }]
          ],
          view    = "timeSeries",
          region  = var.aws_region,
          title   = "Log Processing Metrics",
          period  = 300
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
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["application"].name, { "stat": "Sum" }],
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["system"].name, { "stat": "Sum" }],
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["security"].name, { "stat": "Sum" }],
            ["AWS/Firehose", "DeliveryToS3.Success", "DeliveryStreamName", aws_kinesis_firehose_delivery_stream.log_delivery_stream["performance"].name, { "stat": "Sum" }]
          ],
          view    = "timeSeries",
          region  = var.aws_region,
          title   = "Firehose Delivery Success",
          period  = 300
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
  value       = {
    for k, v in aws_kinesis_firehose_delivery_stream.log_delivery_stream : k => v.name
  }
}

output "lambda_function_name" {
  description = "Name of the log processing Lambda function"
  value       = aws_lambda_function.log_processor.function_name
}

output "glue_database_name" {
  description = "Name of the Glue database for log analytics"
  value       = aws_glue_catalog_database.logs_database.name
}

output "glue_table_names" {
  description = "Names of Glue tables by log type"
  value       = {
    for k, v in aws_glue_catalog_table.logs_table : k => v.name
  }
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

  // Prepare metric data
  const metricData = [
    {
      MetricName: 'ProcessedLogCount',
      Value: totalLogs,
      Unit: 'Count',
      Timestamp: timestamp,
    },
    {
      MetricName: 'ErrorCount',
      Value: errorCount,
      Unit: 'Count',
      Timestamp: timestamp,
    },
    {
      MetricName: 'SecurityEventCount',
      Value: securityEventCount,
      Unit: 'Count',
      Timestamp: timestamp,
    },
    {
      MetricName: 'PerformanceEventCount',
      Value: performanceEventCount,
      Unit: 'Count',
      Timestamp: timestamp,
    },
  ];

  // Add per-server metrics
  for (const [serverId, metrics] of Object.entries(serverMetrics)) {
    metricData.push(
      {
        MetricName: 'ServerLogCount',
        Value: metrics.logCount,
        Unit: 'Count',
        Timestamp: timestamp,
        Dimensions: [{ Name: 'ServerId', Value: serverId }],
      },
      {
        MetricName: 'ServerErrorCount',
        Value: metrics.errorCount,
        Unit: 'Count',
        Timestamp: timestamp,
        Dimensions: [{ Name: 'ServerId', Value: serverId }],
      }
    );
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

This Terraform configuration creates a centralized logging and analytics system for 500 servers with these components:

1. **Log Ingestion**: Kinesis Firehose delivery streams for different log types (application, system, security, performance)

2. **Real-time Processing**: Lambda function enriches logs, extracts metrics, and flags important events

3. **Secure Storage**: S3 bucket with encryption, lifecycle policies, and access controls

4. **Schema Management**: AWS Glue database, tables, and crawler for log schema discovery and evolution

5. **Analytics**: Athena workgroup for SQL-based querying of log data

6. **Monitoring**: CloudWatch metrics, alarms, and dashboards to track log patterns and issues

7. **Visualization**: Ready for integration with QuickSight (requires manual configuration)

8. **Security**: IAM roles with least-privilege permissions for all components

9. **Compliance**: Audit trail of important events stored separately for compliance requirements

## Deployment Instructions

1. Create the Lambda function deployment package:

   ```bash
   zip -r lambda_function.zip index.js
   ```

2. Initialize Terraform:

   ```bash
   terraform init
   ```

3. Plan the deployment:

   ```bash
   terraform plan
   ```

4. Apply the configuration:

   ```bash
   terraform apply
   ```

5. Verify email subscription for CloudWatch al
