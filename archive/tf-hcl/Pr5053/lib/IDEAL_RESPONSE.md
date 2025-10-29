## lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  backend "s3" {
    
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "content-management-platform"
      ManagedBy   = "terraform"
    }
  }
}
```

## lib/main.tf

```hcl
# ===========================
# Data Sources
# ===========================
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ===========================
# Variables
# ===========================
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "notification_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = "team@example.com"
}

# ===========================
# Locals
# ===========================
locals {
  common_tags = {
    System      = "file-processing"
    CostCenter  = "content-management"
    Compliance  = "internal"
  }
  
  lambda_timeout     = 60
  lambda_memory      = 512
  log_retention_days = 7
  alarm_period      = 300  # 5 minutes in seconds
  
  # Naming convention with random suffix
  resource_prefix = "cms-file-processor"
}

# ===========================
# Random String for Unique Naming
# ===========================
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
  numeric = true
}

# ===========================
# S3 Bucket Configuration
# ===========================
resource "aws_s3_bucket" "file_uploads" {
  bucket = "${local.resource_prefix}-${random_string.suffix.result}"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-uploads-${random_string.suffix.result}"
      Type = "file-storage"
    }
  )
}

resource "aws_s3_bucket_server_side_encryption_configuration" "file_uploads" {
  bucket = aws_s3_bucket.file_uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "file_uploads" {
  bucket = aws_s3_bucket.file_uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "file_uploads" {
  bucket = aws_s3_bucket.file_uploads.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_notification" "file_uploads" {
  bucket      = aws_s3_bucket.file_uploads.id
  eventbridge = true
}

# ===========================
# Lambda Function
# ===========================
resource "aws_lambda_function" "file_processor" {
  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256
  function_name    = "${local.resource_prefix}-${random_string.suffix.result}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = local.lambda_timeout
  memory_size     = local.lambda_memory

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.file_metadata.name
      SNS_TOPIC_ARN  = aws_sns_topic.notifications.arn
      BUCKET_NAME    = aws_s3_bucket.file_uploads.id
      # REMOVED: AWS_REGION - This is automatically provided by Lambda runtime
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-${random_string.suffix.result}"
    }
  )
}



# Create placeholder Lambda deployment package
# ===========================
# Lambda Deployment Package
# ===========================
data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "$${path.module}/lambda_placeholder.zip"

  source {
    content  = <<-EOF
      exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event, null, 2));
          
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const sns = new AWS.SNS();
          
          try {
              const bucket = event.detail.bucket.name;
              const key = event.detail.object.key;
              const size = event.detail.object.size;
              
              const params = {
                  TableName: process.env.DYNAMODB_TABLE,
                  Item: {
                      upload_id: `$${Date.now()}-$${Math.random().toString(36).substr(2, 9)}`,
                      s3_key: key,
                      upload_timestamp: Date.now(),
                      bucket_name: bucket,
                      file_size: size,
                      processing_status: 'completed',
                      processed_at: new Date().toISOString()
                  }
              };
              
              await dynamodb.put(params).promise();
              console.log('Metadata stored in DynamoDB');
              
              await sns.publish({
                  TopicArn: process.env.SNS_TOPIC_ARN,
                  Subject: 'File Processing Complete',
                  Message: `File processed successfully: $${key} ($${size} bytes)`
              }).promise();
              
              return {
                  statusCode: 200,
                  body: JSON.stringify({ message: 'File processed successfully' })
              };
          } catch (error) {
              console.error('Error processing file:', error);
              
              await sns.publish({
                  TopicArn: process.env.SNS_TOPIC_ARN,
                  Subject: 'File Processing Failed',
                  Message: `Error processing file: $${error.message}`
              }).promise();
              
              throw error;
          }
      };
    EOF
    filename = "index.js"
  }
}


resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.file_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_upload.arn
}

# ===========================
# EventBridge Configuration
# ===========================
resource "aws_cloudwatch_event_rule" "s3_upload" {
  name        = "${local.resource_prefix}-s3-upload-${random_string.suffix.result}"
  description = "Trigger Lambda on S3 file upload"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.file_uploads.id]
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-event-rule-${random_string.suffix.result}"
    }
  )
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.s3_upload.name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.file_processor.arn
}

# ===========================
# SNS Topic
# ===========================
resource "aws_sns_topic" "notifications" {
  name = "${local.resource_prefix}-notifications-${random_string.suffix.result}"
  
  kms_master_key_id = "alias/aws/sns"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-sns-${random_string.suffix.result}"
    }
  )
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# ===========================
# DynamoDB Table
# ===========================
resource "aws_dynamodb_table" "file_metadata" {
  name         = "${local.resource_prefix}-metadata-${random_string.suffix.result}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "upload_id"

  attribute {
    name = "upload_id"
    type = "S"
  }

  attribute {
    name = "s3_key"
    type = "S"
  }

  attribute {
    name = "upload_timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "S3KeyIndex"
    hash_key        = "s3_key"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "TimestampIndex"
    hash_key        = "upload_timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  ttl {
    enabled        = false
    attribute_name = ""
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-dynamodb-${random_string.suffix.result}"
    }
  )
}

# ===========================
# IAM Roles and Policies
# ===========================
resource "aws_iam_role" "lambda_execution" {
  name = "${local.resource_prefix}-lambda-role-${random_string.suffix.result}"

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

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-role-${random_string.suffix.result}"
    }
  )
}

resource "aws_iam_policy" "lambda_permissions" {
  name        = "${local.resource_prefix}-lambda-policy-${random_string.suffix.result}"
  description = "Permissions for file processor Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.file_uploads.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.file_uploads.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.file_metadata.arn,
          "${aws_dynamodb_table.file_metadata.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_permissions" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_permissions.arn
}

# ===========================
# CloudWatch Logs
# ===========================
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.file_processor.function_name}"
  retention_in_days = local.log_retention_days

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-logs-${random_string.suffix.result}"
    }
  )
}

# ===========================
# CloudWatch Metrics and Alarms
# ===========================
resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  alarm_name          = "${local.resource_prefix}-lambda-errors-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = local.alarm_period
  statistic          = "Average"
  threshold          = 0.05  # 5% error rate
  alarm_description  = "Lambda error rate exceeds 5%"
  treat_missing_data = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.file_processor.function_name
  }

  alarm_actions = [aws_sns_topic.notifications.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-error-alarm-${random_string.suffix.result}"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_write_capacity" {
  alarm_name          = "${local.resource_prefix}-dynamodb-writes-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = local.alarm_period
  statistic          = "Sum"
  threshold          = 100  # Threshold for on-demand mode
  alarm_description  = "DynamoDB write throttling risk"
  treat_missing_data = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.file_metadata.name
  }

  alarm_actions = [aws_sns_topic.notifications.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-dynamodb-alarm-${random_string.suffix.result}"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "lambda_invocations" {
  alarm_name          = "${local.resource_prefix}-lambda-invocations-${random_string.suffix.result}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Invocations"
  namespace          = "AWS/Lambda"
  period             = 3600  # 1 hour
  statistic          = "Sum"
  threshold          = 1
  alarm_description  = "No Lambda invocations in the last hour"
  treat_missing_data = "breaching"

  dimensions = {
    FunctionName = aws_lambda_function.file_processor.function_name
  }

  alarm_actions = [aws_sns_topic.notifications.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-health-alarm-${random_string.suffix.result}"
    }
  )
}

# ===========================
# Outputs
# ===========================
output "s3_bucket_name" {
  description = "Name of the S3 bucket for file uploads"
  value       = aws_s3_bucket.file_uploads.id
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.file_processor.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.notifications.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table storing metadata"
  value       = aws_dynamodb_table.file_metadata.name
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.s3_upload.name
}

output "lambda_log_group" {
  description = "CloudWatch log group for Lambda function"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "deployment_region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.id
}

output "account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}
```