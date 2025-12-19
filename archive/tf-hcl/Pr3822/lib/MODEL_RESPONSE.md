# Terraform Infrastructure for Centralized Logging

Here is the complete Terraform infrastructure code for the centralized logging system.

## variables.tf

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "application_count" {
  description = "Number of applications"
  type        = number
  default     = 12
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 90
}

variable "firehose_buffer_size" {
  description = "Firehose buffer size in MB"
  type        = number
  default     = 1
}

variable "firehose_buffer_interval" {
  description = "Firehose buffer interval in seconds"
  type        = number
  default     = 60
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "centralized-logging"
}

variable "cross_account_ids" {
  description = "List of AWS account IDs for cross-account access"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "CentralizedLogging"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
```

## main.tf

```hcl
# main.tf

# KMS key for encryption
resource "aws_kms_key" "logging_key" {
  description             = "KMS key for centralized logging encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-kms-key"
  })
}

resource "aws_kms_alias" "logging_key_alias" {
  name          = "alias/${var.project_name}"
  target_key_id = aws_kms_key.logging_key.key_id
}

# S3 bucket for log storage
resource "aws_s3_bucket" "log_storage" {
  bucket = "${var.project_name}-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-log-storage"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_storage" {
  bucket = aws_s3_bucket.log_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.logging_key.arn
    }
  }
}

resource "aws_s3_bucket_versioning" "log_storage" {
  bucket = aws_s3_bucket.log_storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "log_storage" {
  bucket = aws_s3_bucket.log_storage.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555
    }
  }
}

resource "aws_s3_bucket_public_access_block" "log_storage" {
  bucket = aws_s3_bucket.log_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Groups for each application
resource "aws_cloudwatch_log_group" "applications" {
  count = var.application_count

  name              = "/aws/application/app-${format("%02d", count.index + 1)}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.logging_key.arn

  tags = merge(var.tags, {
    Name        = "app-${format("%02d", count.index + 1)}"
    Application = "app-${format("%02d", count.index + 1)}"
  })
}

# CloudWatch Log subscription filters to send logs to Kinesis Firehose
resource "aws_cloudwatch_log_subscription_filter" "firehose" {
  count = var.application_count

  name            = "firehose-subscription-app-${format("%02d", count.index + 1)}"
  log_group_name  = aws_cloudwatch_log_group.applications[count.index].name
  filter_pattern  = ""
  destination_arn = aws_kinesis_firehose_delivery_stream.logs.arn
  role_arn        = aws_iam_role.cloudwatch_to_firehose.arn

  depends_on = [aws_iam_role_policy.cloudwatch_to_firehose]
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
```

## iam.tf

```hcl
# iam.tf

# IAM role for CloudWatch to Firehose
resource "aws_iam_role" "cloudwatch_to_firehose" {
  name = "${var.project_name}-cloudwatch-to-firehose"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "cloudwatch_to_firehose" {
  name = "${var.project_name}-cloudwatch-to-firehose"
  role = aws_iam_role.cloudwatch_to_firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "firehose:PutRecord",
          "firehose:PutRecordBatch"
        ]
        Resource = aws_kinesis_firehose_delivery_stream.logs.arn
      }
    ]
  })
}

# IAM role for Kinesis Firehose
resource "aws_iam_role" "firehose" {
  name = "${var.project_name}-firehose-role"

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

  tags = var.tags
}

resource "aws_iam_role_policy" "firehose" {
  name = "${var.project_name}-firehose-policy"
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
          aws_s3_bucket.log_storage.arn,
          "${aws_s3_bucket.log_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction",
          "lambda:GetFunctionConfiguration"
        ]
        Resource = aws_lambda_function.log_transformer.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.logging_key.arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${var.aws_region}.amazonaws.com"
          }
          StringLike = {
            "kms:EncryptionContext:aws:s3:arn" = "${aws_s3_bucket.log_storage.arn}/*"
          }
        }
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

# IAM role for Lambda function
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

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

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Cross-account access IAM role for audit teams
resource "aws_iam_role" "cross_account_audit" {
  count = length(var.cross_account_ids) > 0 ? 1 : 0
  name  = "${var.project_name}-cross-account-audit"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = [for account_id in var.cross_account_ids : "arn:aws:iam::${account_id}:root"]
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.project_name}-audit"
          }
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "cross_account_audit" {
  count = length(var.cross_account_ids) > 0 ? 1 : 0
  name  = "${var.project_name}-cross-account-audit-policy"
  role  = aws_iam_role.cross_account_audit[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.log_storage.arn,
          "${aws_s3_bucket.log_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/application/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:StartQuery",
          "logs:StopQuery",
          "logs:GetQueryResults"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.logging_key.arn
      }
    ]
  })
}

# KMS key policy to allow services to use the key
resource "aws_kms_key_policy" "logging_key" {
  key_id = aws_kms_key.logging_key.id

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
      },
      {
        Sid    = "Allow Firehose"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## lambda.tf

```hcl
# lambda.tf

# Lambda function for log transformation
resource "aws_lambda_function" "log_transformer" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "${var.project_name}-log-transformer"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 256

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
  }

  tags = var.tags
}

# Create Lambda function code
resource "local_file" "lambda_code" {
  content = <<-EOF
import base64
import json
import gzip
from datetime import datetime

def handler(event, context):
    output = []

    for record in event['records']:
        try:
            # Decode the base64 encoded data
            payload = base64.b64decode(record['data'])

            # Decompress if gzipped
            try:
                payload = gzip.decompress(payload)
            except:
                pass

            # Parse the CloudWatch log event
            log_event = json.loads(payload)

            # Transform each log event
            if 'logEvents' in log_event:
                for log in log_event['logEvents']:
                    # Extract application name from log group
                    log_group = log_event.get('logGroup', '')
                    app_name = log_group.split('/')[-1] if log_group else 'unknown'

                    # Create structured log entry
                    transformed_log = {
                        'timestamp': log.get('timestamp'),
                        'message': log.get('message'),
                        'application': app_name,
                        'logGroup': log_event.get('logGroup'),
                        'logStream': log_event.get('logStream'),
                        'processed_at': datetime.utcnow().isoformat()
                    }

                    # Encode the transformed log
                    output_data = json.dumps(transformed_log) + '\n'
                    output_record = {
                        'recordId': record['recordId'],
                        'result': 'Ok',
                        'data': base64.b64encode(output_data.encode()).decode()
                    }
                    output.append(output_record)
            else:
                # If not a CloudWatch log event, pass through
                output.append({
                    'recordId': record['recordId'],
                    'result': 'Ok',
                    'data': record['data']
                })

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            # Return failed record
            output.append({
                'recordId': record['recordId'],
                'result': 'ProcessingFailed',
                'data': record['data']
            })

    return {'records': output}
EOF

  filename = "${path.module}/lambda/index.py"
}

# Create zip file for Lambda
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "${path.module}/lambda/function.zip"

  depends_on = [local_file.lambda_code]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-log-transformer"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.logging_key.arn

  tags = var.tags
}
```

## firehose.tf

```hcl
# firehose.tf

# CloudWatch Log Group for Firehose
resource "aws_cloudwatch_log_group" "firehose" {
  name              = "/aws/kinesisfirehose/${var.project_name}"
  retention_in_days = 7

  tags = var.tags
}

resource "aws_cloudwatch_log_stream" "firehose_dest" {
  name           = "DestinationDelivery"
  log_group_name = aws_cloudwatch_log_group.firehose.name
}

resource "aws_cloudwatch_log_stream" "firehose_backup" {
  name           = "BackupDelivery"
  log_group_name = aws_cloudwatch_log_group.firehose.name
}

# Kinesis Firehose Delivery Stream
resource "aws_kinesis_firehose_delivery_stream" "logs" {
  name        = "${var.project_name}-delivery-stream"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose.arn
    bucket_arn = aws_s3_bucket.log_storage.arn

    # Buffering configuration
    buffering_size     = var.firehose_buffer_size
    buffering_interval = var.firehose_buffer_interval

    # Compression
    compression_format = "GZIP"

    # Error output prefix
    error_output_prefix = "errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    # Dynamic partitioning configuration
    dynamic_partitioning_configuration {
      enabled = true
    }

    # Prefix with dynamic partitioning using JQ processor
    prefix = "application=!{partitionKeyFromQuery:application}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    # Processing configuration for Lambda transformation
    processing_configuration {
      enabled = true

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = "${aws_lambda_function.log_transformer.arn}:$LATEST"
        }

        parameters {
          parameter_name  = "BufferSizeInMBs"
          parameter_value = "1"
        }

        parameters {
          parameter_name  = "BufferIntervalInSeconds"
          parameter_value = "60"
        }
      }

      # AppendDelimiterToRecord processor
      processors {
        type = "AppendDelimiterToRecord"

        parameters {
          parameter_name  = "Delimiter"
          parameter_value = "\\n"
        }
      }

      # MetadataExtraction for dynamic partitioning
      processors {
        type = "MetadataExtraction"

        parameters {
          parameter_name  = "JsonParsingEngine"
          parameter_value = "JQ-1.6"
        }

        parameters {
          parameter_name  = "MetadataExtractionQuery"
          parameter_value = "{application:.application}"
        }
      }
    }

    # CloudWatch logging
    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose.name
      log_stream_name = aws_cloudwatch_log_stream.firehose_dest.name
    }

    # S3 backup configuration
    s3_backup_mode = "Enabled"

    s3_backup_configuration {
      role_arn   = aws_iam_role.firehose.arn
      bucket_arn = aws_s3_bucket.log_storage.arn
      prefix     = "backup/"

      buffering_size     = var.firehose_buffer_size
      buffering_interval = var.firehose_buffer_interval
      compression_format = "GZIP"

      cloudwatch_logging_options {
        enabled         = true
        log_group_name  = aws_cloudwatch_log_group.firehose.name
        log_stream_name = aws_cloudwatch_log_stream.firehose_backup.name
      }
    }
  }

  tags = var.tags
}
```

## cloudwatch_insights.tf

```hcl
# cloudwatch_insights.tf

# CloudWatch Insights Queries for log analysis
resource "aws_cloudwatch_query_definition" "error_logs" {
  name = "${var.project_name}-error-logs"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp, @message, @logStream
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
QUERY
}

resource "aws_cloudwatch_query_definition" "application_stats" {
  name = "${var.project_name}-application-stats"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp, @logStream
| stats count() by @logStream
| sort count desc
QUERY
}

resource "aws_cloudwatch_query_definition" "hourly_log_volume" {
  name = "${var.project_name}-hourly-log-volume"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp
| stats count() by bin(1h)
| sort @timestamp desc
QUERY
}

resource "aws_cloudwatch_query_definition" "application_errors_by_type" {
  name = "${var.project_name}-errors-by-application"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp, @message, @logStream
| filter @message like /ERROR/ or @message like /WARN/
| parse @message /(?<level>ERROR|WARN)/
| stats count() by level, @logStream
| sort count desc
QUERY
}

resource "aws_cloudwatch_query_definition" "recent_logs_all_apps" {
  name = "${var.project_name}-recent-logs-all-apps"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp, @message, @logStream
| sort @timestamp desc
| limit 50
QUERY
}
```

## outputs.tf

```hcl
# outputs.tf

output "s3_bucket_name" {
  description = "Name of the S3 bucket for log storage"
  value       = aws_s3_bucket.log_storage.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for log storage"
  value       = aws_s3_bucket.log_storage.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.logging_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = aws_kms_key.logging_key.arn
}

output "firehose_delivery_stream_name" {
  description = "Name of the Kinesis Firehose delivery stream"
  value       = aws_kinesis_firehose_delivery_stream.logs.name
}

output "firehose_delivery_stream_arn" {
  description = "ARN of the Kinesis Firehose delivery stream"
  value       = aws_kinesis_firehose_delivery_stream.logs.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function for log transformation"
  value       = aws_lambda_function.log_transformer.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function for log transformation"
  value       = aws_lambda_function.log_transformer.arn
}

output "cloudwatch_log_groups" {
  description = "Map of application names to CloudWatch Log Group names"
  value = {
    for idx, lg in aws_cloudwatch_log_group.applications :
    "app-${format("%02d", idx + 1)}" => lg.name
  }
}

output "cloudwatch_log_group_arns" {
  description = "List of CloudWatch Log Group ARNs"
  value       = [for lg in aws_cloudwatch_log_group.applications : lg.arn]
}

output "cross_account_role_arn" {
  description = "ARN of the cross-account audit role"
  value       = length(var.cross_account_ids) > 0 ? aws_iam_role.cross_account_audit[0].arn : null
}

output "cloudwatch_insights_queries" {
  description = "CloudWatch Insights query definition names"
  value = {
    error_logs              = aws_cloudwatch_query_definition.error_logs.name
    application_stats       = aws_cloudwatch_query_definition.application_stats.name
    hourly_log_volume       = aws_cloudwatch_query_definition.hourly_log_volume.name
    errors_by_application   = aws_cloudwatch_query_definition.application_errors_by_type.name
    recent_logs_all_apps    = aws_cloudwatch_query_definition.recent_logs_all_apps.name
  }
}

output "firehose_cloudwatch_log_group" {
  description = "CloudWatch Log Group for Firehose monitoring"
  value       = aws_cloudwatch_log_group.firehose.name
}
```
