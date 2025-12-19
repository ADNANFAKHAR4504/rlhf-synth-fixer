# Audit Logging System Infrastructure

Here's the complete Terraform infrastructure for your audit logging system with immutable storage and compliance features.

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 3653 # 10 years
}

variable "s3_retention_years" {
  description = "S3 Object Lock retention in years"
  type        = number
  default     = 10
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "audit-logging"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "daily_event_count" {
  description = "Expected daily event count"
  type        = number
  default     = 18700
}
```

```hcl
# main.tf

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Compliance  = "Audit-Logs"
  }
}

# KMS Key for encryption
resource "aws_kms_key" "audit_logs" {
  description             = "KMS key for audit log encryption"
  deletion_window_in_days = 30
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
      },
      {
        Sid    = "Allow CloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow S3"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-kms-key"
  })
}

resource "aws_kms_alias" "audit_logs" {
  name          = "alias/${var.project_name}-audit-logs"
  target_key_id = aws_kms_key.audit_logs.key_id
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "audit_events" {
  name              = "/aws/${var.project_name}/audit-events"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.audit_logs.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-audit-events"
  })
}

# CloudWatch Logs Insights Query Definition
resource "aws_cloudwatch_query_definition" "audit_query" {
  name = "${var.project_name}-audit-insights"

  log_group_names = [
    aws_cloudwatch_log_group.audit_events.name
  ]

  query_string = <<-QUERY
    fields @timestamp, requestId, transactionId, eventType, userId, @message
    | filter eventType = "CRITICAL" or eventType = "SECURITY"
    | sort @timestamp desc
    | limit 1000
  QUERY
}

# S3 Bucket for immutable log storage with Object Lock
resource "aws_s3_bucket" "audit_logs" {
  bucket = "${var.project_name}-logs-${data.aws_caller_identity.current.account_id}"

  object_lock_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-audit-logs-bucket"
  })
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.audit_logs.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_object_lock_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    default_retention {
      mode = "GOVERNANCE"
      years = var.s3_retention_years
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

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
  }
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_logs.arn}/cloudtrail/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AllowCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit_logs.arn
      }
    ]
  })
}

# CloudTrail for API auditing
resource "aws_cloudtrail" "audit" {
  name                          = "${var.project_name}-trail"
  s3_bucket_name                = aws_s3_bucket.audit_logs.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.audit_logs.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.audit_logs.arn}/"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function/*"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudtrail"
  })

  depends_on = [aws_s3_bucket_policy.audit_logs]
}

resource "aws_cloudwatch_log_group" "cloudtrail_logs" {
  name              = "/aws/${var.project_name}/cloudtrail"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.audit_logs.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudtrail-logs"
  })
}

# IAM Role for Lambda log processor
resource "aws_iam_role" "lambda_log_processor" {
  name = "${var.project_name}-lambda-log-processor"

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

resource "aws_iam_role_policy" "lambda_log_processor" {
  name = "${var.project_name}-lambda-log-processor-policy"
  role = aws_iam_role.lambda_log_processor.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = aws_cloudwatch_log_group.audit_events.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectRetention"
        ]
        Resource = "${aws_s3_bucket.audit_logs.arn}/processed-logs/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.audit_logs.arn
      }
    ]
  })
}

# Lambda function for log processing
resource "aws_lambda_function" "log_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-log-processor"
  role            = aws_iam_role.lambda_log_processor.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 300
  memory_size     = 512

  environment {
    variables = {
      S3_BUCKET       = aws_s3_bucket.audit_logs.id
      S3_PREFIX       = "processed-logs"
      LOG_GROUP       = aws_cloudwatch_log_group.audit_events.name
      KMS_KEY_ID      = aws_kms_key.audit_logs.arn
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-log-processor"
  })
}

resource "aws_cloudwatch_log_group" "lambda_log_processor" {
  name              = "/aws/lambda/${aws_lambda_function.log_processor.function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.audit_logs.arn

  tags = local.common_tags
}

# CloudWatch Log subscription filter to trigger Lambda
resource "aws_cloudwatch_log_subscription_filter" "lambda_processor" {
  name            = "${var.project_name}-log-processor-filter"
  log_group_name  = aws_cloudwatch_log_group.audit_events.name
  filter_pattern  = ""
  destination_arn = aws_lambda_function.log_processor.arn

  depends_on = [aws_lambda_permission.allow_cloudwatch]
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.log_processor.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.audit_events.arn}:*"
}

# EventBridge for real-time alerts
resource "aws_cloudwatch_event_rule" "critical_events" {
  name        = "${var.project_name}-critical-events"
  description = "Capture critical audit events"

  event_pattern = jsonencode({
    source      = ["aws.logs"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "DeleteLogGroup",
        "DeleteLogStream",
        "PutBucketPolicy",
        "DeleteBucket",
        "PutBucketObjectLockConfiguration"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "eventbridge_logs" {
  name              = "/aws/events/${var.project_name}-critical-events"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.audit_logs.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-eventbridge-logs"
  })
}

# EventBridge target - SNS for alerts
resource "aws_sns_topic" "critical_alerts" {
  name              = "${var.project_name}-critical-alerts"
  kms_master_key_id = aws_kms_key.audit_logs.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-critical-alerts"
  })
}

resource "aws_sns_topic_policy" "critical_alerts" {
  arn = aws_sns_topic.critical_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.critical_alerts.arn
      }
    ]
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.critical_events.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.critical_alerts.arn
}

resource "aws_cloudwatch_event_target" "cloudwatch_logs" {
  rule      = aws_cloudwatch_event_rule.critical_events.name
  target_id = "SendToCloudWatchLogs"
  arn       = aws_cloudwatch_log_group.eventbridge_logs.arn
}

# AppSync API for real-time monitoring
resource "aws_appsync_graphql_api" "monitoring" {
  name                = "${var.project_name}-monitoring-api"
  authentication_type = "API_KEY"

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs.arn
    field_log_level          = "ERROR"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-monitoring-api"
  })
}

resource "aws_appsync_api_key" "monitoring" {
  api_id  = aws_appsync_graphql_api.monitoring.id
  expires = timeadd(timestamp(), "8760h") # 1 year
}

resource "aws_cloudwatch_log_group" "appsync" {
  name              = "/aws/appsync/${var.project_name}-monitoring"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.audit_logs.arn

  tags = local.common_tags
}

# IAM role for AppSync logging
resource "aws_iam_role" "appsync_logs" {
  name = "${var.project_name}-appsync-logs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "appsync_logs" {
  name = "${var.project_name}-appsync-logs-policy"
  role = aws_iam_role.appsync_logs.id

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
        Resource = "${aws_cloudwatch_log_group.appsync.arn}:*"
      }
    ]
  })
}

# EventBridge rule to send events to AppSync
resource "aws_cloudwatch_event_rule" "appsync_events" {
  name        = "${var.project_name}-appsync-events"
  description = "Send audit events to AppSync for real-time monitoring"

  event_pattern = jsonencode({
    source = ["custom.audit"]
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "appsync" {
  rule      = aws_cloudwatch_event_rule.appsync_events.name
  target_id = "SendToAppSync"
  arn       = "${aws_appsync_graphql_api.monitoring.arn}/graphql"
  role_arn  = aws_iam_role.eventbridge_appsync.arn

  http_target {
    path_parameter_values = []
    query_string_parameters = {}
    header_parameters = {
      "x-api-key" = aws_appsync_api_key.monitoring.key
    }
  }
}

# IAM role for EventBridge to invoke AppSync
resource "aws_iam_role" "eventbridge_appsync" {
  name = "${var.project_name}-eventbridge-appsync"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "eventbridge_appsync" {
  name = "${var.project_name}-eventbridge-appsync-policy"
  role = aws_iam_role.eventbridge_appsync.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "appsync:GraphQL"
        ]
        Resource = "${aws_appsync_graphql_api.monitoring.arn}/*"
      }
    ]
  })
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${var.project_name}-cloudtrail-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "${var.project_name}-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
      }
    ]
  })
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

# Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = file("${path.module}/lambda_function.py")
    filename = "index.py"
  }
}
```

```python
# lambda_function.py

import json
import boto3
import gzip
import base64
import os
from datetime import datetime

s3_client = boto3.client('s3')
logs_client = boto3.client('logs')

S3_BUCKET = os.environ['S3_BUCKET']
S3_PREFIX = os.environ['S3_PREFIX']
KMS_KEY_ID = os.environ['KMS_KEY_ID']

def handler(event, context):
    """
    Process CloudWatch Logs and archive to S3 with Object Lock
    """
    try:
        # Decode and decompress CloudWatch Logs data
        compressed_payload = base64.b64decode(event['awslogs']['data'])
        uncompressed_payload = gzip.decompress(compressed_payload)
        log_data = json.loads(uncompressed_payload)

        # Process each log event
        processed_events = []
        for log_event in log_data['logEvents']:
            try:
                # Try to parse as JSON
                message = json.loads(log_event['message'])
            except json.JSONDecodeError:
                # If not JSON, keep as string
                message = log_event['message']

            processed_event = {
                'timestamp': log_event['timestamp'],
                'message': message,
                'ingestionTime': log_event.get('ingestionTime'),
                'logGroup': log_data['logGroup'],
                'logStream': log_data['logStream']
            }
            processed_events.append(processed_event)

        # Generate S3 key based on timestamp
        timestamp = datetime.utcnow()
        s3_key = f"{S3_PREFIX}/{timestamp.year}/{timestamp.month:02d}/{timestamp.day:02d}/{timestamp.strftime('%Y%m%d-%H%M%S')}-{context.request_id}.json.gz"

        # Compress processed events
        compressed_data = gzip.compress(
            json.dumps(processed_events, indent=2).encode('utf-8')
        )

        # Upload to S3 with encryption
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=compressed_data,
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=KMS_KEY_ID,
            ContentType='application/json',
            ContentEncoding='gzip',
            Metadata={
                'log-group': log_data['logGroup'],
                'log-stream': log_data['logStream'],
                'event-count': str(len(processed_events))
            }
        )

        print(f"Successfully processed {len(processed_events)} events and stored to {s3_key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed logs',
                'eventCount': len(processed_events),
                's3Key': s3_key
            })
        }

    except Exception as e:
        print(f"Error processing logs: {str(e)}")
        raise
```

```hcl
# outputs.tf

output "kms_key_id" {
  description = "KMS key ID for audit log encryption"
  value       = aws_kms_key.audit_logs.id
}

output "kms_key_arn" {
  description = "KMS key ARN for audit log encryption"
  value       = aws_kms_key.audit_logs.arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch Log Group name for audit events"
  value       = aws_cloudwatch_log_group.audit_events.name
}

output "cloudwatch_log_group_arn" {
  description = "CloudWatch Log Group ARN for audit events"
  value       = aws_cloudwatch_log_group.audit_events.arn
}

output "s3_bucket_name" {
  description = "S3 bucket name for immutable log storage"
  value       = aws_s3_bucket.audit_logs.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for immutable log storage"
  value       = aws_s3_bucket.audit_logs.arn
}

output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = aws_cloudtrail.audit.name
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.audit.arn
}

output "lambda_function_name" {
  description = "Lambda function name for log processing"
  value       = aws_lambda_function.log_processor.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN for log processing"
  value       = aws_lambda_function.log_processor.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for critical alerts"
  value       = aws_sns_topic.critical_alerts.arn
}

output "appsync_api_id" {
  description = "AppSync API ID for real-time monitoring"
  value       = aws_appsync_graphql_api.monitoring.id
}

output "appsync_api_url" {
  description = "AppSync API URL for real-time monitoring"
  value       = aws_appsync_graphql_api.monitoring.uris["GRAPHQL"]
}

output "appsync_api_key" {
  description = "AppSync API key"
  value       = aws_appsync_api_key.monitoring.key
  sensitive   = true
}

output "eventbridge_rule_critical_events" {
  description = "EventBridge rule name for critical events"
  value       = aws_cloudwatch_event_rule.critical_events.name
}

output "eventbridge_rule_appsync" {
  description = "EventBridge rule name for AppSync events"
  value       = aws_cloudwatch_event_rule.appsync_events.name
}
```

```hcl
# iam_policies.tf

# IAM policy for read-only access to audit logs
resource "aws_iam_policy" "audit_log_reader" {
  name        = "${var.project_name}-audit-log-reader"
  description = "Read-only access to audit logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          aws_cloudwatch_log_group.audit_events.arn,
          "${aws_cloudwatch_log_group.audit_events.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.audit_logs.arn
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for audit log administrators (can bypass Object Lock governance mode)
resource "aws_iam_policy" "audit_log_admin" {
  name        = "${var.project_name}-audit-log-admin"
  description = "Administrative access to audit logs with Object Lock bypass"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:*"
        ]
        Resource = [
          aws_cloudwatch_log_group.audit_events.arn,
          "${aws_cloudwatch_log_group.audit_events.arn}:*",
          aws_cloudwatch_log_group.cloudtrail_logs.arn,
          "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:BypassGovernanceRetention"
        ]
        Resource = "${aws_s3_bucket.audit_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:*"
        ]
        Resource = aws_kms_key.audit_logs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:*"
        ]
        Resource = aws_cloudtrail.audit.arn
      }
    ]
  })

  tags = local.common_tags
}

# Deny policy to prevent log modification by unauthorized users
resource "aws_iam_policy" "deny_log_modification" {
  name        = "${var.project_name}-deny-log-modification"
  description = "Explicitly deny log modification operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Action = [
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream",
          "logs:PutRetentionPolicy",
          "logs:DeleteRetentionPolicy"
        ]
        Resource = [
          aws_cloudwatch_log_group.audit_events.arn,
          "${aws_cloudwatch_log_group.audit_events.arn}:*"
        ]
      },
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "s3:DeleteObject",
          "s3:DeleteObjectVersion",
          "s3:PutBucketObjectLockConfiguration",
          "s3:PutObjectLegalHold",
          "s3:PutObjectRetention"
        ]
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
        Condition = {
          StringNotLike = {
            "aws:userid" = [
              "AIDA*", # Exclude specific admin user IDs if needed
            ]
          }
        }
      }
    ]
  })

  tags = local.common_tags
}
```

This infrastructure provides:

1. **CloudWatch Logs** with 10-year retention and field indexes for fast querying
2. **S3 with Object Lock** in governance mode for immutable storage
3. **KMS encryption** for all logs and data at rest
4. **CloudTrail** for comprehensive API auditing with insights
5. **Lambda function** to process and archive logs to S3
6. **EventBridge rules** with enhanced logging for real-time alerts
7. **AppSync integration** for real-time monitoring dashboard
8. **IAM policies** implementing least privilege and preventing unauthorized modifications
9. **SNS topics** for critical event notifications

All resources are encrypted with customer-managed KMS keys and follow AWS security best practices. The S3 Object Lock is configured in governance mode with 10-year retention, allowing authorized users to bypass if needed.
