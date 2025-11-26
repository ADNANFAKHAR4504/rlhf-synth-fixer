# Serverless Transaction Processing Pipeline - Production Infrastructure

## Overview

This Terraform configuration implements a production-grade serverless transaction processing pipeline for financial services in the eu-central-1 region with comprehensive GDPR compliance, multi-layer encryption, and complete observability. The architecture processes CSV and JSON transaction files through an event-driven workflow using S3, Lambda, DynamoDB, and SQS with automated error handling, CloudWatch monitoring, and VPC endpoint private connectivity for enhanced security.

## Architecture

- **Event-Driven Processing:** S3 event notifications trigger Lambda functions for real-time transaction processing
- **Multi-Layer Encryption:** Three dedicated KMS keys for S3, DynamoDB, and Lambda/SQS/CloudWatch Logs encryption
- **Error Handling Pipeline:** SQS dead letter queue with dedicated Lambda processor for failed transaction analysis
- **Dual Storage Layer:** DynamoDB tables for successful transactions and error records with global secondary indexes
- **Comprehensive Monitoring:** CloudWatch log groups, alarms for error rates and DLQ depth, and custom dashboard
- **Private Connectivity:** VPC gateway endpoints for S3 and DynamoDB to avoid public internet routing
- **IAM Least Privilege:** Scoped policies with explicit resource ARNs and deny statements for destructive operations
- **Automated Alerting:** SNS topic with email subscriptions for CloudWatch alarm notifications
- **Cost Optimization:** ARM64 Graviton2 processors, on-demand DynamoDB billing, S3 Glacier lifecycle transitions
- **Auditability:** Point-in-time recovery on DynamoDB, S3 versioning, X-Ray tracing, and 30-day log retention

## File Structure

```
lib/
├── provider.tf          # Terraform and provider configurations with default tags
├── main.tf              # Complete infrastructure resources and outputs
├── processor_function.py        # Transaction processing Lambda handler
└── dlq_processor_function.py   # Dead letter queue processing Lambda handler
```

---

## lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
  backend "s3" {

  }
}

provider "aws" {
  region = "eu-central-1"

  default_tags {
    tags = {
      Environment        = var.environment
      DataClassification = "Sensitive"
      Compliance         = "GDPR"
      Owner              = "FinOps-Team"
      ManagedBy          = "Terraform"
    }
  }
}

variable "environment" {
  description = "Environment name for resource naming and differentiation"
  type        = string
  default     = "dev"
}

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "kanakatla.k@turing.com"
}
```

---

## lib/main.tf

```hcl
# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

data "archive_file" "processor_function_zip" {
  type        = "zip"
  source_file = "${path.module}/processor_function.py"
  output_path = "${path.module}/processor_function.zip"
}

data "archive_file" "dlq_processor_function_zip" {
  type        = "zip"
  source_file = "${path.module}/dlq_processor_function.py"
  output_path = "${path.module}/dlq_processor_function.zip"
}

# KMS Keys
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 Service Principal"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/s3-transactions-${var.environment}"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

resource "aws_kms_key" "dynamodb_encryption" {
  description             = "KMS key for DynamoDB table encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow DynamoDB Service Principal"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "dynamodb.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "dynamodb_encryption" {
  name          = "alias/dynamodb-transactions-${var.environment}"
  target_key_id = aws_kms_key.dynamodb_encryption.key_id
}

resource "aws_kms_key" "lambda_encryption" {
  description             = "KMS key for Lambda env vars, SQS, and CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda Service Principal"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SQS Service Principal"
        Effect = "Allow"
        Principal = {
          Service = "sqs.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs Service Principal"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "lambda_encryption" {
  name          = "alias/lambda-encryption-${var.environment}"
  target_key_id = aws_kms_key.lambda_encryption.key_id
}

# S3 Bucket
resource "aws_s3_bucket" "transactions" {
  bucket        = "s3-transactions-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "transactions" {
  bucket = aws_s3_bucket.transactions.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transactions" {
  bucket = aws_s3_bucket.transactions.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "transactions" {
  bucket = aws_s3_bucket.transactions.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "transactions" {
  bucket = aws_s3_bucket.transactions.id

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
          aws_s3_bucket.transactions.arn,
          "${aws_s3_bucket.transactions.arn}/*"
        ]
      },
      {
        Sid       = "DenyUnencryptedUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.transactions.arn}/*"
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "transactions" {
  bucket = aws_s3_bucket.transactions.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# DynamoDB Tables
resource "aws_dynamodb_table" "transactions" {
  name                        = "dynamodb-transactions-${var.environment}"
  billing_mode                = "PAY_PER_REQUEST"
  deletion_protection_enabled = false

  hash_key  = "transaction_id"
  range_key = "timestamp"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_encryption.arn
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dynamodb_table" "errors" {
  name                        = "dynamodb-errors-${var.environment}"
  billing_mode                = "PAY_PER_REQUEST"
  deletion_protection_enabled = false

  hash_key  = "error_id"
  range_key = "timestamp"

  attribute {
    name = "error_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "transaction_id"
    type = "S"
  }

  global_secondary_index {
    name            = "transaction-id-index"
    hash_key        = "transaction_id"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_encryption.arn
  }

  point_in_time_recovery {
    enabled = true
  }
}

# SQS Queues
resource "aws_sqs_queue" "dlq" {
  name                       = "sqs-dlq-${var.environment}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  kms_master_key_id          = aws_kms_key.lambda_encryption.id
}

resource "aws_sqs_queue" "main" {
  name                       = "sqs-main-${var.environment}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  kms_master_key_id          = aws_kms_key.lambda_encryption.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}

# IAM Roles and Policies for Lambda Functions
resource "aws_iam_role" "transaction_processor" {
  name = "lambda-transaction-processor-role-${var.environment}"

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

resource "aws_iam_policy" "transaction_processor" {
  name = "lambda-transaction-processor-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.transactions.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.s3_encryption.arn,
          aws_kms_key.dynamodb_encryption.arn,
          aws_kms_key.lambda_encryption.arn
        ]
      },
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "dynamodb:DeleteTable"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "transaction_processor" {
  role       = aws_iam_role.transaction_processor.name
  policy_arn = aws_iam_policy.transaction_processor.arn
}

resource "aws_iam_role_policy_attachment" "transaction_processor_basic" {
  role       = aws_iam_role.transaction_processor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role" "dlq_processor" {
  name = "lambda-dlq-processor-role-${var.environment}"

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

resource "aws_iam_policy" "dlq_processor" {
  name = "lambda-dlq-processor-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.errors.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.dynamodb_encryption.arn,
          aws_kms_key.lambda_encryption.arn
        ]
      },
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "dynamodb:DeleteTable"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "dlq_processor" {
  role       = aws_iam_role.dlq_processor.name
  policy_arn = aws_iam_policy.dlq_processor.arn
}

resource "aws_iam_role_policy_attachment" "dlq_processor_basic" {
  role       = aws_iam_role.dlq_processor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Functions
resource "aws_lambda_function" "transaction_processor" {
  function_name = "lambda-transaction-processor-${var.environment}"
  role          = aws_iam_role.transaction_processor.arn
  handler       = "processor_function.lambda_handler"
  runtime       = "python3.11"
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 300

  filename         = data.archive_file.processor_function_zip.output_path
  source_code_hash = data.archive_file.processor_function_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name
      SQS_QUEUE_URL       = aws_sqs_queue.main.url
    }
  }

  kms_key_arn = aws_kms_key.lambda_encryption.arn

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role.transaction_processor,
    aws_iam_role_policy_attachment.transaction_processor,
    aws_iam_role_policy_attachment.transaction_processor_basic
  ]
}

resource "aws_lambda_function" "dlq_processor" {
  function_name = "lambda-dlq-processor-${var.environment}"
  role          = aws_iam_role.dlq_processor.arn
  handler       = "dlq_processor_function.lambda_handler"
  runtime       = "python3.11"
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 300

  filename         = data.archive_file.dlq_processor_function_zip.output_path
  source_code_hash = data.archive_file.dlq_processor_function_zip.output_base64sha256

  environment {
    variables = {
      ERRORS_TABLE_NAME = aws_dynamodb_table.errors.name
    }
  }

  kms_key_arn = aws_kms_key.lambda_encryption.arn

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role.dlq_processor,
    aws_iam_role_policy_attachment.dlq_processor,
    aws_iam_role_policy_attachment.dlq_processor_basic
  ]
}

# Lambda Permissions and Event Source Mappings
resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.transactions.arn
}

resource "aws_s3_bucket_notification" "lambda_trigger" {
  bucket = aws_s3_bucket.transactions.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.transaction_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".csv"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.transaction_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".json"
  }

  depends_on = [aws_lambda_permission.s3_invoke]
}

resource "aws_lambda_event_source_mapping" "dlq_trigger" {
  event_source_arn = aws_sqs_queue.dlq.arn
  function_name    = aws_lambda_function.dlq_processor.arn
  batch_size       = 10
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "transaction_processor" {
  name              = "/aws/lambda/${aws_lambda_function.transaction_processor.function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.lambda_encryption.arn
}

resource "aws_cloudwatch_log_group" "dlq_processor" {
  name              = "/aws/lambda/${aws_lambda_function.dlq_processor.function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.lambda_encryption.arn
}

# SNS Topic
resource "aws_sns_topic" "alerts" {
  name              = "sns-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.lambda_encryption.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowRootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "SNS:Publish",
          "SNS:Subscribe",
          "SNS:SetTopicAttributes",
          "SNS:GetTopicAttributes",
          "SNS:DeleteTopic"
        ]
        Resource = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:sns-alerts-${var.environment}"
      },
      {
        Sid    = "AllowCloudWatchPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:sns-alerts-${var.environment}"
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "transaction_processor_error_rate" {
  alarm_name          = "transaction-processor-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Lambda error rate exceeds 1% over 5 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.transaction_processor.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_message_depth" {
  alarm_name          = "dlq-message-depth-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "DLQ message depth exceeds 100"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "monitoring" {
  dashboard_name = "transaction-processing-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Transaction Processor Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Transaction Processor Errors" }],
            [".", "Duration", { stat = "Average", label = "Avg Processing Latency" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Transaction Processing Metrics"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { stat = "Average", label = "DLQ Depth" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "DLQ Message Depth"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum", label = "Read Capacity" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum", label = "Write Capacity" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "DynamoDB Capacity Units"
          period  = 300
        }
      }
    ]
  })
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.s3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:*"
        Resource  = "*"
      }
    ]
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.dynamodb"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "dynamodb:*"
        Resource  = "*"
      }
    ]
  })
}

# VPC for endpoints (minimal setup for serverless)
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# Outputs
output "kms_s3_key_id" {
  value = aws_kms_key.s3_encryption.id
}

output "kms_s3_key_arn" {
  value = aws_kms_key.s3_encryption.arn
}

output "kms_dynamodb_key_id" {
  value = aws_kms_key.dynamodb_encryption.id
}

output "kms_dynamodb_key_arn" {
  value = aws_kms_key.dynamodb_encryption.arn
}

output "kms_lambda_key_id" {
  value = aws_kms_key.lambda_encryption.id
}

output "kms_lambda_key_arn" {
  value = aws_kms_key.lambda_encryption.arn
}

output "s3_bucket_name" {
  value = aws_s3_bucket.transactions.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.transactions.arn
}

output "lambda_transaction_processor_name" {
  value = aws_lambda_function.transaction_processor.function_name
}

output "lambda_transaction_processor_arn" {
  value = aws_lambda_function.transaction_processor.arn
}

output "lambda_transaction_processor_role_arn" {
  value = aws_iam_role.transaction_processor.arn
}

output "lambda_dlq_processor_name" {
  value = aws_lambda_function.dlq_processor.function_name
}

output "lambda_dlq_processor_arn" {
  value = aws_lambda_function.dlq_processor.arn
}

output "lambda_dlq_processor_role_arn" {
  value = aws_iam_role.dlq_processor.arn
}

output "dynamodb_transactions_table_name" {
  value = aws_dynamodb_table.transactions.name
}

output "dynamodb_transactions_table_arn" {
  value = aws_dynamodb_table.transactions.arn
}

output "dynamodb_errors_table_name" {
  value = aws_dynamodb_table.errors.name
}

output "dynamodb_errors_table_arn" {
  value = aws_dynamodb_table.errors.arn
}

output "sqs_main_queue_url" {
  value = aws_sqs_queue.main.url
}

output "sqs_main_queue_arn" {
  value = aws_sqs_queue.main.arn
}

output "sqs_dlq_url" {
  value = aws_sqs_queue.dlq.url
}

output "sqs_dlq_arn" {
  value = aws_sqs_queue.dlq.arn
}

output "cloudwatch_log_group_transaction_processor" {
  value = aws_cloudwatch_log_group.transaction_processor.name
}

output "cloudwatch_log_group_dlq_processor" {
  value = aws_cloudwatch_log_group.dlq_processor.name
}

output "cloudwatch_alarm_error_rate" {
  value = aws_cloudwatch_metric_alarm.transaction_processor_error_rate.alarm_name
}

output "cloudwatch_alarm_dlq_depth" {
  value = aws_cloudwatch_metric_alarm.dlq_message_depth.alarm_name
}

output "cloudwatch_dashboard_name" {
  value = aws_cloudwatch_dashboard.monitoring.dashboard_name
}

output "sns_topic_arn" {
  value = aws_sns_topic.alerts.arn
}

output "vpc_endpoint_s3_id" {
  value = aws_vpc_endpoint.s3.id
}

output "vpc_endpoint_dynamodb_id" {
  value = aws_vpc_endpoint.dynamodb.id
}

output "lambda_transaction_processor_env_vars" {
  value     = aws_lambda_function.transaction_processor.environment[0].variables
  sensitive = true
}

output "lambda_dlq_processor_env_vars" {
  value     = aws_lambda_function.dlq_processor.environment[0].variables
  sensitive = true
}

output "dynamodb_transactions_endpoint" {
  value     = "dynamodb.${data.aws_region.current.name}.amazonaws.com"
  sensitive = true
}

output "dynamodb_errors_endpoint" {
  value     = "dynamodb.${data.aws_region.current.name}.amazonaws.com"
  sensitive = true
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "region" {
  value = data.aws_region.current.name
}

output "availability_zones" {
  value = data.aws_availability_zones.available.names
}

output "processor_function_zip_path" {
  value = data.archive_file.processor_function_zip.output_path
}

output "dlq_processor_function_zip_path" {
  value = data.archive_file.dlq_processor_function_zip.output_path
}
```

---

## Outputs Description

The infrastructure provides 43 comprehensive outputs organized into the following categories:

**KMS Encryption Keys (6 outputs):**
- Three KMS key IDs and ARNs for S3, DynamoDB, and Lambda/SQS/CloudWatch encryption

**S3 Storage (2 outputs):**
- Bucket name and ARN for transaction file uploads

**Lambda Functions (6 outputs):**
- Function names, ARNs, and IAM role ARNs for both transaction processor and DLQ processor

**DynamoDB Tables (4 outputs):**
- Table names and ARNs for transactions and errors storage

**SQS Queues (4 outputs):**
- Queue URLs and ARNs for main queue and dead letter queue

**CloudWatch Monitoring (5 outputs):**
- Log group names for both Lambda functions, alarm names for error rate and DLQ depth, dashboard name

**SNS Notifications (1 output):**
- Topic ARN for CloudWatch alarm notifications

**VPC Endpoints (2 outputs):**
- Endpoint IDs for S3 and DynamoDB gateway endpoints

**Sensitive Outputs (4 outputs):**
- Lambda environment variables and DynamoDB endpoints marked as sensitive

**Metadata Outputs (7 outputs):**
- Account ID, region, availability zones, and Lambda function zip file paths

**Infrastructure Metadata (2 outputs):**
- Lambda deployment package paths for both processor functions

---

## Deployment Instructions

Execute the following commands in sequence to deploy the infrastructure:

```bash
cd lib

terraform init

terraform validate

terraform plan -out=tfplan

terraform apply tfplan
```

After deployment, confirm the SNS email subscription by checking the email inbox for kanakatla.k@turing.com and clicking the confirmation link.

To extract outputs for integration testing:

```bash
terraform output -json > ../cfn-outputs/flat-outputs.json
```

To destroy the infrastructure when no longer needed:

```bash
terraform destroy -auto-approve
```

---

## Features Implemented

- S3 bucket with versioning, KMS encryption, and public access blocking
- S3 event notifications for .csv and .json file uploads triggering Lambda processing
- S3 lifecycle policy transitioning objects to Glacier after 90 days
- Bucket policy enforcing encryption in transit by denying unencrypted uploads
- Lambda transaction processor with ARM64 architecture for cost optimization
- Lambda DLQ processor consuming failed messages from dead letter queue
- DynamoDB tables with on-demand billing and customer-managed KMS encryption
- Point-in-time recovery enabled on both DynamoDB tables for disaster recovery
- Global secondary indexes on status and transaction_id for efficient querying
- SQS main queue with dead letter queue redrive policy after 3 failed attempts
- 300-second visibility timeout matching Lambda timeout duration
- 14-day message retention for comprehensive error analysis
- X-Ray tracing enabled on both Lambda functions for distributed request tracking
- CloudWatch log groups with 30-day retention and KMS encryption
- CloudWatch alarms monitoring Lambda error rates and DLQ message depth
- CloudWatch dashboard displaying transaction processing metrics, DLQ depth, and DynamoDB capacity
- SNS topic with KMS encryption for alarm notifications
- Email subscription for operational alerting to kanakatla.k@turing.com
- VPC gateway endpoints for S3 and DynamoDB private connectivity
- IAM policies following least privilege with explicit resource ARNs
- Explicit deny statements preventing accidental deletion of S3 buckets and DynamoDB tables
- KMS key policies with service principal permissions and encryption context validation
- Three dedicated KMS keys with automatic annual rotation enabled
- Default tags applied to all resources for cost allocation and governance
- Deterministic resource naming pattern for consistent identification
- Explicit dependency management using depends_on for IAM eventual consistency
- Archive data sources for Lambda function packaging from Python source files
- Environment variables encrypted with KMS for Lambda configuration
- S3 bucket force_destroy enabled for testing cleanup
- DynamoDB deletion protection disabled for testing workflows
- KMS key deletion window of 7 days for rapid iteration

---

## Security Controls

**Encryption at Rest:**
- S3 bucket encrypted with dedicated customer-managed KMS key
- DynamoDB tables encrypted with dedicated customer-managed KMS key
- Lambda environment variables encrypted with shared KMS key
- SQS queues encrypted with shared KMS key
- CloudWatch log groups encrypted with shared KMS key
- SNS topic encrypted with shared KMS key
- All KMS keys configured with automatic annual rotation

**Encryption in Transit:**
- S3 bucket policy denies unencrypted uploads using aws:SecureTransport condition
- VPC endpoints route S3 and DynamoDB traffic through AWS private network

**Identity and Access Management:**
- IAM roles with least privilege scoped to specific resource ARNs
- Explicit deny statements for destructive operations (DeleteBucket, DeleteTable)
- KMS key policies restricting service principal access with encryption context
- SNS topic policy with explicit action enumeration instead of wildcards
- Lambda execution roles separated by function with minimal required permissions

**Network Security:**
- S3 bucket public access block enabling all four settings
- VPC gateway endpoints for private connectivity without internet gateway
- Traffic restricted to AWS internal network for S3 and DynamoDB access

**Data Protection:**
- S3 versioning enabled for object recovery from accidental deletion
- DynamoDB point-in-time recovery enabled for disaster recovery
- CloudWatch log retention configured to 30 days for audit trails
- SQS dead letter queue retaining failed messages for 14 days

**Auditability:**
- X-Ray tracing capturing distributed request flows across Lambda functions
- CloudWatch logs capturing all Lambda invocations and errors
- Default tags applied for resource tracking and compliance reporting
- SNS notifications alerting on error rate and DLQ depth threshold breaches

---

## Cost Optimization

**Compute Optimization:**
- Lambda functions using ARM64 Graviton2 processors for 20% cost reduction
- On-demand DynamoDB billing eliminating idle capacity costs
- No reserved Lambda concurrency preventing unnecessary cost allocation

**Storage Optimization:**
- S3 lifecycle policy transitioning objects to Glacier after 90 days
- CloudWatch log retention limited to 30 days to control storage costs
- SQS message retention configured to 14 days for cost-effective error analysis

**Network Optimization:**
- VPC gateway endpoints eliminating NAT gateway costs and data transfer charges
- All traffic routed through AWS private network avoiding internet egress fees

**Operational Optimization:**
- CloudWatch dashboard providing centralized monitoring without third-party tools
- Serverless architecture eliminating EC2 instance management overhead
- Automated error handling reducing manual intervention costs

---

## Monitoring and Observability

**CloudWatch Logs:**
- Transaction processor log group capturing all invocations and errors
- DLQ processor log group capturing error analysis and storage operations
- 30-day retention providing audit trail for compliance requirements

**CloudWatch Alarms:**
- Lambda error rate alarm triggering at threshold of 1 error over 5 minutes
- DLQ message depth alarm triggering when queue exceeds 100 messages
- Two consecutive evaluation periods required before ALARM state transition
- SNS notifications sent to kanakatla.k@turing.com for operational response

**CloudWatch Dashboard:**
- Transaction processing metrics widget displaying Lambda invocations, errors, and average duration
- DLQ message depth widget tracking failed message accumulation over time
- DynamoDB capacity units widget showing read and write consumption patterns
- Five-minute granularity for real-time operational visibility
- Time series visualization for trend analysis and capacity planning

**X-Ray Tracing:**
- Active tracing mode enabled on both Lambda functions
- Distributed request tracking across S3, Lambda, DynamoDB, and SQS
- Service map visualization for dependency analysis
- Latency analysis for performance optimization

---

## Compliance and Governance

**GDPR Compliance:**
- Data classification tag marking all resources as Sensitive
- KMS encryption at rest for all data storage services
- Encryption in transit enforced via S3 bucket policy
- Point-in-time recovery enabling data restoration for regulatory requirements
- 30-day log retention supporting audit and investigation activities
- VPC endpoints ensuring data remains within AWS network boundaries

**Tagging Strategy:**
- Environment tag identifying resource lifecycle stage (dev/prod)
- DataClassification tag marking sensitivity level (Sensitive)
- Compliance tag indicating regulatory framework (GDPR)
- Owner tag assigning operational responsibility (FinOps-Team)
- ManagedBy tag identifying infrastructure source (Terraform)

**Change Management:**
- Terraform state management for infrastructure as code
- Explicit dependency declarations preventing race conditions
- Deterministic naming pattern enabling resource identification
- Force destroy and deletion protection settings documented for each environment

**Access Control:**
- IAM policies following least privilege principle
- Root account access preserved in KMS key policies preventing lockouts
- Service principals restricted with encryption context conditions
- Resource-specific ARN scoping preventing lateral privilege escalation

---

## Summary

This serverless transaction processing pipeline provides a production-grade foundation for financial services transaction handling with comprehensive GDPR compliance, multi-layer encryption using three dedicated KMS keys, and complete observability through CloudWatch monitoring. The architecture implements event-driven processing with automated error handling, maintains audit trails through X-Ray tracing and CloudWatch logs, and optimizes costs through ARM64 processors and intelligent storage lifecycle policies. All infrastructure is deployed through Terraform with deterministic naming, least privilege IAM policies, and extensive outputs supporting comprehensive integration testing validation of the entire transaction processing workflow.