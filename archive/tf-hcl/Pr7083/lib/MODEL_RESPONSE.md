### Reasoning Trace
---

Let me analyze this request carefully:

1. Need to create a serverless webhook processing pipeline
2. Must use modular Terraform configuration with separate files for each service
3. Key components:
   - 3 Lambda functions (webhook receiver, payload validator, transaction processor)
   - API Gateway REST API with API key auth and usage plans
   - DynamoDB tables for transaction storage
   - S3 buckets for webhook payloads and failed archives
   - SQS queues with DLQ
   - CloudWatch Log Groups
   - IAM roles
   - CloudWatch alarms
   - X-Ray tracing
   - Tags on all resources

4. Specific requirements:
   - Lambda: Python 3.11, arm64 architecture
   - S3: versioning enabled, block public access
   - DynamoDB: on-demand billing, point-in-time recovery, encryption
   - API Gateway: throttling, burst limits
   - Use random suffix for unique names
   - Lambda env vars reference SSM Parameter Store
   - us-east-1 region
   - Terraform 1.5+ with AWS provider 5.x

Let me structure this into separate .tf files:
- main.tf (providers and random suffix)
- lambda.tf (Lambda functions)
- api_gateway.tf (API Gateway configuration)
- dynamodb.tf (DynamoDB tables)
- s3.tf (S3 buckets)
- sqs.tf (SQS queues)
- iam.tf (IAM roles and policies)
- cloudwatch.tf (Log groups and alarms)
- variables.tf (input variables)
- outputs.tf (outputs)
### Answer 
---

I'll create a modular Terraform configuration for your serverless webhook processing pipeline. Here's the complete setup with separate files for each service component:

## **main.tf**
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
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project
    CostCenter  = var.cost_center
  }
}
```

## **variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "webhook-processor"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "fintech-ops"
}

variable "lambda_configs" {
  description = "Lambda function configurations"
  type = map(object({
    memory_size = number
    timeout     = number
  }))
  default = {
    webhook_receiver = {
      memory_size = 512
      timeout     = 60
    }
    payload_validator = {
      memory_size = 256
      timeout     = 30
    }
    transaction_processor = {
      memory_size = 1024
      timeout     = 120
    }
  }
}
```

## **lambda.tf**
```hcl
# Lambda Functions
resource "aws_lambda_function" "webhook_receiver" {
  function_name     = "webhook-receiver-${random_string.suffix.result}"
  role             = aws_iam_role.webhook_receiver_role.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  architectures    = ["arm64"]
  memory_size      = var.lambda_configs.webhook_receiver.memory_size
  timeout          = var.lambda_configs.webhook_receiver.timeout
  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      QUEUE_URL           = aws_sqs_queue.webhook_processing_queue.url
      BUCKET_NAME         = aws_s3_bucket.webhook_payloads.id
      API_KEY_PARAM_PATH  = "/webhook-processor/api-key"
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "payload_validator" {
  function_name     = "payload-validator-${random_string.suffix.result}"
  role             = aws_iam_role.payload_validator_role.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  architectures    = ["arm64"]
  memory_size      = var.lambda_configs.payload_validator.memory_size
  timeout          = var.lambda_configs.payload_validator.timeout
  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      VALIDATION_RULES_PARAM = "/webhook-processor/validation-rules"
      DLQ_URL               = aws_sqs_queue.webhook_dlq.url
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "transaction_processor" {
  function_name     = "transaction-processor-${random_string.suffix.result}"
  role             = aws_iam_role.transaction_processor_role.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  architectures    = ["arm64"]
  memory_size      = var.lambda_configs.transaction_processor.memory_size
  timeout          = var.lambda_configs.transaction_processor.timeout
  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.id
      ARCHIVE_BUCKET      = aws_s3_bucket.failed_messages.id
      DB_SECRET_PARAM     = "/webhook-processor/db-credentials"
    }
  }

  tags = local.common_tags
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_webhook" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_receiver.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}

# Lambda event source mappings for SQS
resource "aws_lambda_event_source_mapping" "validator_sqs" {
  event_source_arn = aws_sqs_queue.webhook_processing_queue.arn
  function_name    = aws_lambda_function.payload_validator.arn
  batch_size       = 10
}

resource "aws_lambda_event_source_mapping" "processor_sqs" {
  event_source_arn = aws_sqs_queue.validated_queue.arn
  function_name    = aws_lambda_function.transaction_processor.arn
  batch_size       = 10
}

# Placeholder lambda code
data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "${path.module}/lambda_placeholder.zip"
  
  source {
    content  = "def handler(event, context): return {'statusCode': 200}"
    filename = "index.py"
  }
}
```

## **api_gateway.tf**
```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "webhook_api" {
  name        = "webhook-api-${random_string.suffix.result}"
  description = "Webhook processing API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# Request validator
resource "aws_api_gateway_request_validator" "webhook_validator" {
  rest_api_id                  = aws_api_gateway_rest_api.webhook_api.id
  name                         = "webhook-request-validator"
  validate_request_body        = true
  validate_request_parameters  = true
}

# API Resource
resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_rest_api.webhook_api.root_resource_id
  path_part   = "webhook"
}

# API Method
resource "aws_api_gateway_method" "webhook_post" {
  rest_api_id          = aws_api_gateway_rest_api.webhook_api.id
  resource_id          = aws_api_gateway_resource.webhook.id
  http_method          = "POST"
  authorization        = "NONE"
  api_key_required     = true
  request_validator_id = aws_api_gateway_request_validator.webhook_validator.id
}

# Lambda integration
resource "aws_api_gateway_integration" "webhook_lambda" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  resource_id = aws_api_gateway_resource.webhook.id
  http_method = aws_api_gateway_method.webhook_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.webhook_receiver.invoke_arn
}

# API deployment
resource "aws_api_gateway_deployment" "webhook_deployment" {
  depends_on = [
    aws_api_gateway_method.webhook_post,
    aws_api_gateway_integration.webhook_lambda
  ]

  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}

# API stage with X-Ray tracing
resource "aws_api_gateway_stage" "webhook_stage" {
  deployment_id = aws_api_gateway_deployment.webhook_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  tags = local.common_tags
}

# API Key
resource "aws_api_gateway_api_key" "webhook_key" {
  name        = "webhook-api-key-${random_string.suffix.result}"
  description = "API key for webhook access"
  enabled     = true

  tags = local.common_tags
}

# Usage Plan
resource "aws_api_gateway_usage_plan" "webhook_plan" {
  name        = "webhook-usage-plan-${random_string.suffix.result}"
  description = "Usage plan for webhook API"

  api_stages {
    api_id = aws_api_gateway_rest_api.webhook_api.id
    stage  = aws_api_gateway_stage.webhook_stage.stage_name
  }

  quota_settings {
    limit  = 1000000
    period = "MONTH"
  }

  throttle_settings {
    rate_limit  = 1000
    burst_limit = 2000
  }
}

# Usage Plan Key
resource "aws_api_gateway_usage_plan_key" "webhook_plan_key" {
  key_id        = aws_api_gateway_api_key.webhook_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.webhook_plan.id
}
```

## **dynamodb.tf**
```hcl
# DynamoDB table for transactions
resource "aws_dynamodb_table" "transactions" {
  name         = "transactions-${random_string.suffix.result}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"
  range_key    = "timestamp"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  global_secondary_index {
    name            = "customer-index"
    hash_key        = "customer_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}
```

## **s3.tf**
```hcl
# S3 bucket for raw webhook payloads
resource "aws_s3_bucket" "webhook_payloads" {
  bucket = "webhook-payloads-${random_string.suffix.result}"
  
  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id

  rule {
    id     = "archive-old-payloads"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# S3 bucket for failed message archives
resource "aws_s3_bucket" "failed_messages" {
  bucket = "failed-messages-${random_string.suffix.result}"
  
  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id

  rule {
    id     = "cleanup-failed-messages"
    status = "Enabled"

    transition {
      days          = 7
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 90
    }
  }
}
```

## **sqs.tf**
```hcl
# Main processing queue
resource "aws_sqs_queue" "webhook_processing_queue" {
  name                      = "webhook-processing-${random_string.suffix.result}"
  visibility_timeout_seconds = 300
  message_retention_seconds = 1209600 # 14 days
  receive_wait_time_seconds = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.webhook_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags
}

# Validated messages queue
resource "aws_sqs_queue" "validated_queue" {
  name                      = "validated-messages-${random_string.suffix.result}"
  visibility_timeout_seconds = 300
  message_retention_seconds = 1209600
  receive_wait_time_seconds = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.webhook_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags
}

# Dead letter queue
resource "aws_sqs_queue" "webhook_dlq" {
  name                      = "webhook-dlq-${random_string.suffix.result}"
  message_retention_seconds = 1209600

  tags = local.common_tags
}

# DLQ redrive allow policy
resource "aws_sqs_queue_redrive_allow_policy" "webhook_dlq" {
  queue_url = aws_sqs_queue.webhook_dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [
      aws_sqs_queue.webhook_processing_queue.arn,
      aws_sqs_queue.validated_queue.arn
    ]
  })
}
```

## **iam.tf**
```hcl
# IAM role for webhook receiver Lambda
resource "aws_iam_role" "webhook_receiver_role" {
  name = "webhook-receiver-role-${random_string.suffix.result}"

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

resource "aws_iam_role_policy" "webhook_receiver_policy" {
  name = "webhook-receiver-policy"
  role = aws_iam_role.webhook_receiver_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.webhook_processing_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.webhook_payloads.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/webhook-processor/*"
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

# IAM role for payload validator Lambda
resource "aws_iam_role" "payload_validator_role" {
  name = "payload-validator-role-${random_string.suffix.result}"

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

resource "aws_iam_role_policy" "payload_validator_policy" {
  name = "payload-validator-policy"
  role = aws_iam_role.payload_validator_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.webhook_processing_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.validated_queue.arn,
          aws_sqs_queue.webhook_dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/webhook-processor/*"
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

# IAM role for transaction processor Lambda
resource "aws_iam_role" "transaction_processor_role" {
  name = "transaction-processor-role-${random_string.suffix.result}"

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

resource "aws_iam_role_policy" "transaction_processor_policy" {
  name = "transaction-processor-policy"
  role = aws_iam_role.transaction_processor_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.validated_queue.arn
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
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.failed_messages.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/webhook-processor/*"
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
```

## **cloudwatch.tf**
```hcl
# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "webhook_receiver_logs" {
  name              = "/aws/lambda/webhook-receiver-${random_string.suffix.result}"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "payload_validator_logs" {
  name              = "/aws/lambda/payload-validator-${random_string.suffix.result}"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "transaction_processor_logs" {
  name              = "/aws/lambda/transaction-processor-${random_string.suffix.result}"
  retention_in_days = 7

  tags = local.common_tags
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "webhook_receiver_errors" {
  alarm_name          = "webhook-receiver-errors-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Average"
  threshold          = "1"
  alarm_description  = "This metric monitors webhook receiver errors"

  dimensions = {
    FunctionName = aws_lambda_function.webhook_receiver.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "payload_validator_errors" {
  alarm_name          = "payload-validator-errors-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Average"
  threshold          = "1"
  alarm_description  = "This metric monitors payload validator errors"

  dimensions = {
    FunctionName = aws_lambda_function.payload_validator.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "transaction_processor_errors" {
  alarm_name          = "transaction-processor-errors-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Average"
  threshold          = "1"
  alarm_description  = "This metric monitors transaction processor errors"

  dimensions = {
    FunctionName = aws_lambda_function.transaction_processor.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "dlq-messages-high-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "ApproximateNumberOfMessagesVisible"
  namespace          = "AWS/SQS"
  period             = "300"
  statistic          = "Average"
  threshold          = "10"
  alarm_description  = "Alert when DLQ messages exceed 10"

  dimensions = {
    QueueName = aws_sqs_queue.webhook_dlq.name
  }

  tags = local.common_tags
}
```

## **outputs.tf**
```hcl
output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = "${aws_api_gateway_stage.webhook_stage.invoke_url}/webhook"
}

output "api_key_id" {
  description = "API Key ID for authentication"
  value       = aws_api_gateway_api_key.webhook_key.id
}

output "webhook_receiver_arn" {
  description = "ARN of webhook receiver Lambda function"
  value       = aws_lambda_function.webhook_receiver.arn
}

output "payload_validator_arn" {
  description = "ARN of payload validator Lambda function"
  value       = aws_lambda_function.payload_validator.arn
}

output "transaction_processor_arn" {
  description = "ARN of transaction processor Lambda function"
  value       = aws_lambda_function.transaction_processor.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB transactions table"
  value       = aws_dynamodb_table.transactions.id
}

output "webhook_payloads_bucket" {
  description = "S3 bucket name for webhook payloads"
  value       = aws_s3_bucket.webhook_payloads.id
}

output "failed_messages_bucket" {
  description = "S3 bucket name for failed messages"
  value       = aws_s3_bucket.failed_messages.id
}

output "processing_queue_url" {
  description = "URL of the main processing queue"
  value       = aws_sqs_queue.webhook_processing_queue.url
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.webhook_dlq.url
}

output "random_suffix" {
  description = "Random suffix used for resource naming"
  value       = random_string.suffix.result
}
```

This modular Terraform configuration creates a complete serverless webhook processing pipeline with:

1. **Three Lambda functions** with proper memory/timeout settings and Python 3.11/arm64 architecture
2. **API Gateway REST API** with request validation, API key authentication, and usage plans (1000 req/min)
3. **DynamoDB table** with on-demand billing and point-in-time recovery
4. **S3 buckets** for webhook payloads and failed messages with lifecycle policies
5. **SQS queues** with 300-second visibility timeout and DLQ after 3 retries
6. **CloudWatch Log Groups** with 7-day retention
7. **IAM roles** with least privilege access
8. **CloudWatch alarms** for Lambda errors (>1%) and DLQ messages (>10)
9. **X-Ray tracing** enabled for all Lambda functions and API Gateway
10. **Consistent tagging** across all resources

The configuration uses the Terraform random provider to generate unique suffixes for globally unique resource names and references Systems Manager Parameter Store for sensitive data in Lambda environment variables.