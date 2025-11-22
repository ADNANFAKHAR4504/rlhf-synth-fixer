### Reasoning Trace
---

This is a comprehensive request for building a serverless transaction processing pipeline using Terraform. Let me break down the requirements and create the necessary files:

1. **lib/provider.tf** - Contains provider configuration, variables, and tags
2. **lib/main.tf** - Contains all the infrastructure resources
3. **lib/processor_function.py** - Python Lambda function for processing transactions
4. **lib/dlq_processor_function.py** - Python Lambda function for processing DLQ messages

Key requirements:
- S3 bucket with event notifications
- Lambda functions (transaction processor and DLQ processor)
- DynamoDB tables (transactions and errors)
- SQS queues (main and DLQ)
- KMS encryption keys (3 separate keys)
- CloudWatch monitoring (log groups, alarms, dashboard)
- SNS topic for alerts
- VPC endpoints for S3 and DynamoDB
- Comprehensive outputs (37-40 minimum)

Let me create each file carefully following all the detailed requirements.
### Answer 
---

I'll create a comprehensive serverless transaction processing pipeline with all the specified components. This architecture provides secure, scalable transaction processing with complete observability and error handling.

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
```

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
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "logs.${data.aws_region.current.name}.amazonaws.com"
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
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.transactions.arn,
          "${aws_s3_bucket.transactions.arn}/*"
        ]
      },
      {
        Sid    = "DenyUnencryptedUploads"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.transactions.arn}/*"
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
  name                   = "dynamodb-transactions-${var.environment}"
  billing_mode           = "PAY_PER_REQUEST"
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
  name                   = "dynamodb-errors-${var.environment}"
  billing_mode           = "PAY_PER_REQUEST"
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
  name                      = "sqs-dlq-${var.environment}"
  visibility_timeout_seconds = 300
  message_retention_seconds = 1209600  # 14 days
  kms_master_key_id         = aws_kms_key.lambda_encryption.id
}

resource "aws_sqs_queue" "main" {
  name                      = "sqs-main-${var.environment}"
  visibility_timeout_seconds = 300
  message_retention_seconds = 1209600  # 14 days
  kms_master_key_id         = aws_kms_key.lambda_encryption.id
  
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
  
  reserved_concurrent_executions = 100
  
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
  
  reserved_concurrent_executions = 50
  
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
        Action   = "SNS:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = "*"
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "devops-alerts@example.com"
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

## lib/processor_function.py

```python
import json
import os
import boto3
import uuid
import time
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs_client = boto3.client('sqs')

# Environment variables
DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
SQS_QUEUE_URL = os.environ['SQS_QUEUE_URL']

# Get DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# Transaction schema for validation
TRANSACTION_SCHEMA = {
    'csv': ['transaction_id', 'amount', 'currency', 'sender', 'receiver', 'type'],
    'json': {
        'required': ['transaction_id', 'amount', 'currency', 'sender', 'receiver', 'type'],
        'types': {
            'transaction_id': str,
            'amount': (int, float),
            'currency': str,
            'sender': str,
            'receiver': str,
            'type': str
        }
    }
}

def lambda_handler(event, context):
    """
    Process transaction files uploaded to S3
    """
    print(f"Processing event: {json.dumps(event)}")
    
    for record in event.get('Records', []):
        try:
            # Extract S3 object details
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            
            print(f"Processing file: s3://{bucket_name}/{object_key}")
            
            # Determine file type
            file_extension = object_key.split('.')[-1].lower()
            
            if file_extension not in ['csv', 'json']:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
            # Get file from S3
            response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
            file_content = response['Body'].read().decode('utf-8')
            
            # Process based on file type
            if file_extension == 'csv':
                transactions = process_csv_file(file_content)
            else:  # json
                transactions = process_json_file(file_content)
            
            # Validate and store transactions
            successful = 0
            failed = 0
            
            for transaction in transactions:
                try:
                    # Validate transaction
                    validate_transaction(transaction, file_extension)
                    
                    # Add metadata
                    transaction['timestamp'] = int(datetime.now().timestamp() * 1000)
                    transaction['status'] = 'processed'
                    transaction['source_file'] = object_key
                    transaction['processed_at'] = datetime.now().isoformat()
                    
                    # Convert floats to Decimal for DynamoDB
                    if 'amount' in transaction:
                        transaction['amount'] = Decimal(str(transaction['amount']))
                    
                    # Store in DynamoDB
                    table.put_item(Item=transaction)
                    successful += 1
                    
                    print(f"Stored transaction: {transaction['transaction_id']}")
                    
                except Exception as e:
                    failed += 1
                    print(f"Failed to process transaction: {str(e)}")
                    
                    # Send failed transaction to DLQ
                    send_to_dlq(transaction, str(e), object_key)
            
            print(f"Processing complete. Successful: {successful}, Failed: {failed}")
            
        except Exception as e:
            print(f"Error processing record: {str(e)}")
            
            # Send entire file processing error to DLQ
            error_message = {
                'error': str(e),
                'bucket': bucket_name,
                'key': object_key,
                'timestamp': datetime.now().isoformat()
            }
            
            sqs_client.send_message(
                QueueUrl=SQS_QUEUE_URL,
                MessageBody=json.dumps(error_message)
            )
            
            raise e
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }

def process_csv_file(content):
    """
    Process CSV file and extract transactions
    """
    import csv
    from io import StringIO
    
    transactions = []
    reader = csv.DictReader(StringIO(content))
    
    for row in reader:
        # Clean and convert data
        transaction = {}
        for key, value in row.items():
            if key and value:
                # Try to convert numeric values
                if key == 'amount':
                    try:
                        transaction[key] = float(value)
                    except ValueError:
                        transaction[key] = value
                else:
                    transaction[key] = value.strip()
        
        transactions.append(transaction)
    
    return transactions

def process_json_file(content):
    """
    Process JSON file and extract transactions
    """
    data = json.loads(content)
    
    # Handle both single transaction and array of transactions
    if isinstance(data, dict):
        transactions = [data]
    elif isinstance(data, list):
        transactions = data
    else:
        raise ValueError("Invalid JSON structure")
    
    return transactions

def validate_transaction(transaction, file_type):
    """
    Validate transaction against schema
    """
    if file_type == 'csv':
        # Check required fields
        required_fields = TRANSACTION_SCHEMA['csv']
        for field in required_fields:
            if field not in transaction or not transaction[field]:
                raise ValueError(f"Missing required field: {field}")
    
    else:  # json
        # Check required fields
        required_fields = TRANSACTION_SCHEMA['json']['required']
        for field in required_fields:
            if field not in transaction:
                raise ValueError(f"Missing required field: {field}")
        
        # Check types
        for field, expected_type in TRANSACTION_SCHEMA['json']['types'].items():
            if field in transaction:
                if not isinstance(transaction[field], expected_type):
                    raise ValueError(f"Invalid type for field {field}")
    
    # Additional business validation
    if 'amount' in transaction:
        amount = float(transaction['amount']) if isinstance(transaction['amount'], str) else transaction['amount']
        if amount <= 0:
            raise ValueError("Transaction amount must be positive")
    
    # Validate currency code
    if 'currency' in transaction:
        if len(transaction['currency']) != 3:
            raise ValueError("Currency must be a 3-letter code")
    
    return True

def send_to_dlq(transaction, error_message, source_file):
    """
    Send failed transaction to DLQ for manual review
    """
    message = {
        'transaction': transaction,
        'error': error_message,
        'source_file': source_file,
        'timestamp': datetime.now().isoformat(),
        'retry_count': 0
    }
    
    sqs_client.send_message(
        QueueUrl=SQS_QUEUE_URL,
        MessageBody=json.dumps(message, default=str)
    )
    
    print(f"Sent to DLQ: {transaction.get('transaction_id', 'unknown')}")
```

## lib/dlq_processor_function.py

```python
import json
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs_client = boto3.client('sqs')

# Environment variables
ERRORS_TABLE_NAME = os.environ['ERRORS_TABLE_NAME']

# Get DynamoDB table
errors_table = dynamodb.Table(ERRORS_TABLE_NAME)

def lambda_handler(event, context):
    """
    Process messages from the Dead Letter Queue
    """
    print(f"Processing {len(event.get('Records', []))} DLQ messages")
    
    processed_count = 0
    error_count = 0
    
    for record in event.get('Records', []):
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            receipt_handle = record['receiptHandle']
            
            print(f"Processing DLQ message: {record['messageId']}")
            
            # Extract error details
            error_record = extract_error_details(message_body, record)
            
            # Store in errors table
            store_error_record(error_record)
            
            # Delete message from queue after successful processing
            # (This is handled automatically by Lambda-SQS integration)
            
            processed_count += 1
            print(f"Stored error record: {error_record['error_id']}")
            
        except Exception as e:
            error_count += 1
            print(f"Failed to process DLQ message: {str(e)}")
            print(f"Message content: {json.dumps(record)}")
            
            # Log the error but don't raise to avoid re-processing
            # Message will return to DLQ after visibility timeout
    
    print(f"DLQ processing complete. Processed: {processed_count}, Errors: {error_count}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'errors': error_count
        })
    }

def extract_error_details(message_body, sqs_record):
    """
    Extract and analyze error details from DLQ message
    """
    error_record = {
        'error_id': str(uuid.uuid4()),
        'timestamp': int(datetime.now().timestamp() * 1000),
        'message_id': sqs_record.get('messageId'),
        'received_at': datetime.now().isoformat()
    }
    
    # Extract transaction data if present
    if 'transaction' in message_body:
        transaction = message_body['transaction']
        error_record['transaction_id'] = transaction.get('transaction_id', 'unknown')
        error_record['transaction_data'] = json.dumps(transaction, default=str)
    else:
        error_record['transaction_id'] = 'unknown'
    
    # Extract error information
    if 'error' in message_body:
        error_record['error_message'] = message_body['error']
        error_record['error_type'] = classify_error(message_body['error'])
    
    # Extract source file information
    if 'source_file' in message_body:
        error_record['source_file'] = message_body['source_file']
    elif 'key' in message_body:
        error_record['source_file'] = message_body['key']
    
    # Add retry information
    if 'retry_count' in message_body:
        error_record['retry_count'] = message_body['retry_count']
    
    # Extract S3 bucket if present
    if 'bucket' in message_body:
        error_record['bucket'] = message_body['bucket']
    
    # Add SQS message attributes
    if 'attributes' in sqs_record:
        attributes = sqs_record['attributes']
        error_record['approximate_receive_count'] = attributes.get('ApproximateReceiveCount', '0')
        error_record['sent_timestamp'] = attributes.get('SentTimestamp')
        error_record['first_receive_timestamp'] = attributes.get('ApproximateFirstReceiveTimestamp')
    
    # Calculate time in queue
    if 'sent_timestamp' in error_record and error_record['sent_timestamp']:
        sent_time = int(error_record['sent_timestamp'])
        current_time = int(datetime.now().timestamp() * 1000)
        error_record['time_in_queue_ms'] = current_time - sent_time
    
    # Add context information
    error_record['processing_context'] = {
        'dlq_processor_version': '1.0.0',
        'runtime': context.function_name if context else 'local',
        'request_id': context.aws_request_id if context else str(uuid.uuid4())
    }
    
    return error_record

def classify_error(error_message):
    """
    Classify error type based on error message
    """
    error_lower = error_message.lower()
    
    if 'missing required field' in error_lower:
        return 'VALIDATION_ERROR'
    elif 'invalid type' in error_lower:
        return 'TYPE_ERROR'
    elif 'amount must be positive' in error_lower:
        return 'BUSINESS_RULE_VIOLATION'
    elif 'currency must be' in error_lower:
        return 'FORMAT_ERROR'
    elif 'timeout' in error_lower:
        return 'TIMEOUT_ERROR'
    elif 'throttl' in error_lower:
        return 'THROTTLING_ERROR'
    elif 'connection' in error_lower or 'network' in error_lower:
        return 'NETWORK_ERROR'
    elif 'permission' in error_lower or 'unauthorized' in error_lower:
        return 'AUTHORIZATION_ERROR'
    else:
        return 'UNKNOWN_ERROR'

def store_error_record(error_record):
    """
    Store error record in DynamoDB errors table
    """
    # Convert any float values to Decimal for DynamoDB
    for key, value in error_record.items():
        if isinstance(value, float):
            error_record[key] = Decimal(str(value))
        elif isinstance(value, dict):
            error_record[key] = json.dumps(value, default=str)
    
    # Store in DynamoDB
    errors_table.put_item(Item=error_record)
    
    # Log summary for monitoring
    print(json.dumps({
        'action': 'error_stored',
        'error_id': error_record['error_id'],
        'transaction_id': error_record.get('transaction_id'),
        'error_type': error_record.get('error_type'),
        'source_file': error_record.get('source_file')
    }))
    
    # Check if this is a critical error that needs immediate attention
    if error_record.get('error_type') in ['AUTHORIZATION_ERROR', 'UNKNOWN_ERROR']:
        print(f"CRITICAL ERROR DETECTED: {error_record['error_type']}")
        # In production, this could trigger additional alerts
    
    return error_record
```

## Summary

This serverless transaction processing pipeline provides:

### **Architecture Components**
- **S3 bucket** with versioning, encryption, and automated Lambda triggers for CSV/JSON files
- **Two Lambda functions** with ARM architecture for cost optimization
- **DynamoDB tables** for transaction and error storage with GSI indexes
- **SQS queues** with DLQ for reliable error handling
- **KMS encryption** across all services with separate keys
- **CloudWatch monitoring** with alarms, logs, and dashboard
- **VPC endpoints** for private connectivity
- **SNS notifications** for operational alerts

### **Key Features**
- **Schema validation** for incoming transactions
- **Automated retry logic** with DLQ for failed processing
- **Complete audit trail** for GDPR compliance
- **Real-time monitoring** with CloudWatch dashboard
- **Cost-optimized** using ARM Graviton2 and on-demand DynamoDB
- **Secure by default** with encryption at rest and in transit
- **Clean teardown** with force_destroy and deletion settings for testing

The system processes files immediately upon upload, validates against schemas, stores successful transactions, and maintains detailed error records for analysis and compliance requirements.