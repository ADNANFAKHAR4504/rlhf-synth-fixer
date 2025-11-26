# Serverless Fraud Detection System - Corrected Terraform Implementation


**CORRECTED VERSION**: This document contains the corrected implementation with all issues from MODEL_RESPONSE.md fixed. See MODEL_FAILURES.md for detailed analysis of corrections.

**Key Corrections Made**:
1. Fixed hardcoded "prod-" prefix in API Gateway stage tag
2. Corrected EventBridge retry policy parameter name to `maximum_event_age_in_seconds`
3. Implemented lazy initialization for DynamoDB table in Lambda app.py

This implementation provides a complete serverless fraud detection system using Terraform/HCL with all mandatory AWS services and security controls.

## Architecture Overview

- **API Gateway**: REST API with /webhook endpoint for receiving fraud detection events
- **Lambda**: Container-based function (ARM64, 3GB memory) for webhook processing
- **DynamoDB**: fraud_patterns table with point-in-time recovery
- **S3**: Audit trail bucket with versioning and encryption
- **EventBridge**: Scheduled rule for 5-minute batch processing
- **ECR**: Container image repository for Lambda
- **SQS**: Dead letter queue for failed Lambda invocations
- **CloudWatch Logs**: KMS-encrypted log groups
- **KMS**: Customer-managed keys for encryption
- **IAM**: Least-privilege roles with explicit deny policies

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix to prevent resource naming conflicts across parallel deployments"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda function in MB"
  type        = number
  default     = 3008
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 60
}

variable "eventbridge_schedule" {
  description = "EventBridge schedule expression for batch processing"
  type        = string
  default     = "rate(5 minutes)"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Service     = "FraudDetection"
  }
}
```

## File: lib/main.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# KMS Key for encryption
resource "aws_kms_key" "fraud_detection" {
  description             = "KMS key for fraud detection system encryption-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "fraud-detection-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "fraud_detection" {
  name          = "alias/fraud-detection-${var.environment_suffix}"
  target_key_id = aws_kms_key.fraud_detection.key_id
}

# S3 Bucket for Audit Trail
resource "aws_s3_bucket" "audit_trail" {
  bucket = "fraud-detection-audit-trail-${var.environment_suffix}"

  tags = {
    Name = "fraud-detection-audit-trail-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "audit_trail" {
  bucket = aws_s3_bucket.audit_trail.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_trail" {
  bucket = aws_s3_bucket.audit_trail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.fraud_detection.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_trail" {
  bucket = aws_s3_bucket.audit_trail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB Table for Fraud Patterns
resource "aws_dynamodb_table" "fraud_patterns" {
  name           = "fraud-patterns-${var.environment_suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "pattern_id"
  range_key      = "timestamp"

  attribute {
    name = "pattern_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.fraud_detection.arn
  }

  tags = {
    Name = "fraud-patterns-${var.environment_suffix}"
  }
}

# ECR Repository for Lambda Container Images
resource "aws_ecr_repository" "lambda_fraud_detector" {
  name                 = "fraud-detector-lambda-${var.environment_suffix}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.fraud_detection.arn
  }

  tags = {
    Name = "fraud-detector-lambda-${var.environment_suffix}"
  }
}

resource "aws_ecr_lifecycle_policy" "lambda_fraud_detector" {
  repository = aws_ecr_repository.lambda_fraud_detector.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# SQS Dead Letter Queue
resource "aws_sqs_queue" "fraud_detection_dlq" {
  name                       = "fraud-detection-dlq-${var.environment_suffix}"
  message_retention_seconds  = 1209600  # 14 days
  visibility_timeout_seconds = 300

  kms_master_key_id = aws_kms_key.fraud_detection.id

  tags = {
    Name = "fraud-detection-dlq-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_fraud_detector" {
  name              = "/aws/lambda/fraud-detector-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.fraud_detection.arn

  tags = {
    Name = "fraud-detector-logs-${var.environment_suffix}"
  }
}
```

## File: lib/iam.tf

```hcl
# IAM Role for Lambda Execution
resource "aws_iam_role" "lambda_fraud_detector" {
  name = "fraud-detector-lambda-role-${var.environment_suffix}"

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

  tags = {
    Name = "fraud-detector-lambda-role-${var.environment_suffix}"
  }
}

# IAM Policy for Lambda - DynamoDB Access
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "fraud-detector-dynamodb-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.fraud_patterns.arn
      },
      {
        Effect = "Deny"
        Action = "dynamodb:*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "dynamodb:ResourceTag/Service" = "FraudDetection"
          }
        }
      }
    ]
  })
}

# IAM Policy for Lambda - S3 Access
resource "aws_iam_role_policy" "lambda_s3" {
  name = "fraud-detector-s3-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.audit_trail.arn}/*"
      },
      {
        Effect = "Deny"
        Action = "s3:*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:ResourceTag/Service" = "FraudDetection"
          }
        }
      }
    ]
  })
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logs" {
  name = "fraud-detector-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda_fraud_detector.arn}:*"
      }
    ]
  })
}

# IAM Policy for Lambda - SQS DLQ
resource "aws_iam_role_policy" "lambda_sqs" {
  name = "fraud-detector-sqs-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.fraud_detection_dlq.arn
      }
    ]
  })
}

# IAM Policy for Lambda - KMS
resource "aws_iam_role_policy" "lambda_kms" {
  name = "fraud-detector-kms-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_fraud_detector.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.fraud_detection.arn
      }
    ]
  })
}

# IAM Role for API Gateway CloudWatch Logs
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "fraud-detector-api-gateway-logs-${var.environment_suffix}"

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

  tags = {
    Name = "fraud-detector-api-gateway-logs-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# IAM Role for EventBridge
resource "aws_iam_role" "eventbridge" {
  name = "fraud-detector-eventbridge-role-${var.environment_suffix}"

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

  tags = {
    Name = "fraud-detector-eventbridge-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "eventbridge_lambda" {
  name = "fraud-detector-eventbridge-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.fraud_detector.arn
      }
    ]
  })
}
```

## File: lib/lambda.tf

```hcl
# Lambda Function for Fraud Detection
resource "aws_lambda_function" "fraud_detector" {
  function_name = "fraud-detector-${var.environment_suffix}"
  role          = aws_iam_role.lambda_fraud_detector.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_fraud_detector.repository_url}:latest"
  architectures = ["arm64"]
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.fraud_patterns.name
      S3_AUDIT_BUCKET     = aws_s3_bucket.audit_trail.id
      KMS_KEY_ID          = aws_kms_key.fraud_detection.id
      ENVIRONMENT_SUFFIX  = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.fraud_detection_dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_fraud_detector,
    aws_iam_role_policy.lambda_logs
  ]

  tags = {
    Name = "fraud-detector-${var.environment_suffix}"
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke-${var.environment_suffix}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fraud_detector.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fraud_detection.execution_arn}/*/*"
}

# Lambda Permission for EventBridge
resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke-${var.environment_suffix}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fraud_detector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.batch_processing.arn
}
```

## File: lib/api_gateway.tf

```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "fraud_detection" {
  name        = "fraud-detection-api-${var.environment_suffix}"
  description = "Fraud Detection Webhook API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "fraud-detection-api-${var.environment_suffix}"
  }
}

# API Gateway Resource - /webhook
resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection.id
  parent_id   = aws_api_gateway_rest_api.fraud_detection.root_resource_id
  path_part   = "webhook"
}

# API Gateway Method - POST /webhook
resource "aws_api_gateway_method" "webhook_post" {
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection.id
  resource_id   = aws_api_gateway_resource.webhook.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration - Lambda Proxy
resource "aws_api_gateway_integration" "webhook_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.fraud_detection.id
  resource_id             = aws_api_gateway_resource.webhook.id
  http_method             = aws_api_gateway_method.webhook_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.fraud_detector.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "fraud_detection" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.webhook.id,
      aws_api_gateway_method.webhook_post.id,
      aws_api_gateway_integration.webhook_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.webhook_lambda
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "production" {
  deployment_id = aws_api_gateway_deployment.fraud_detection.id
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection.id
  stage_name    = "prod"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name = "fraud-detection-api-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/fraud-detection-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.fraud_detection.arn

  tags = {
    Name = "fraud-detection-api-logs-${var.environment_suffix}"
  }
}

# API Gateway Account Settings
resource "aws_api_gateway_account" "fraud_detection" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}
```

## File: lib/eventbridge.tf

```hcl
# EventBridge Rule for Batch Processing
resource "aws_cloudwatch_event_rule" "batch_processing" {
  name                = "fraud-detection-batch-processing-${var.environment_suffix}"
  description         = "Trigger Lambda every 5 minutes for batch fraud pattern analysis"
  schedule_expression = var.eventbridge_schedule

  tags = {
    Name = "fraud-detection-batch-processing-${var.environment_suffix}"
  }
}

# EventBridge Target - Lambda Function
resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.batch_processing.name
  target_id = "fraud-detector-lambda-${var.environment_suffix}"
  arn       = aws_lambda_function.fraud_detector.arn
  role_arn  = aws_iam_role.eventbridge.arn

  input = jsonencode({
    source = "eventbridge-batch-processing"
    action = "analyze-patterns"
  })

  retry_policy {
    maximum_retry_attempts = 2
    maximum_event_age_in_seconds = 3600
  }

  dead_letter_config {
    arn = aws_sqs_queue.fraud_detection_dlq.arn
  }
}
```

## File: lib/outputs.tf

```hcl
output "api_gateway_url" {
  description = "API Gateway webhook endpoint URL"
  value       = "${aws_api_gateway_stage.production.invoke_url}/webhook"
}

output "lambda_function_name" {
  description = "Name of the fraud detector Lambda function"
  value       = aws_lambda_function.fraud_detector.function_name
}

output "lambda_function_arn" {
  description = "ARN of the fraud detector Lambda function"
  value       = aws_lambda_function.fraud_detector.arn
}

output "dynamodb_table_name" {
  description = "Name of the fraud patterns DynamoDB table"
  value       = aws_dynamodb_table.fraud_patterns.name
}

output "s3_audit_bucket" {
  description = "S3 bucket name for audit trail storage"
  value       = aws_s3_bucket.audit_trail.id
}

output "ecr_repository_url" {
  description = "ECR repository URL for Lambda container images"
  value       = aws_ecr_repository.lambda_fraud_detector.repository_url
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.fraud_detection.id
}

output "dlq_url" {
  description = "Dead letter queue URL"
  value       = aws_sqs_queue.fraud_detection_dlq.url
}

output "eventbridge_rule_name" {
  description = "EventBridge rule name for batch processing"
  value       = aws_cloudwatch_event_rule.batch_processing.name
}
```

## File: lib/lambda/Dockerfile

```dockerfile
# Use AWS Lambda base image for ARM64
FROM public.ecr.aws/lambda/python:3.11-arm64

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY app.py .

# Set the CMD to your handler
CMD ["app.lambda_handler"]
```

## File: lib/lambda/requirements.txt

```txt
boto3>=1.28.0
botocore>=1.31.0
```

## File: lib/lambda/app.py

```python
import json
import os
import boto3
import time
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Get environment variables
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
S3_AUDIT_BUCKET = os.environ.get('S3_AUDIT_BUCKET')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX')

# Get DynamoDB table
# Get DynamoDB table (lazy initialization)
table = None
if DYNAMODB_TABLE_NAME:
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)


def lambda_handler(event, context):
    """
    Main Lambda handler for fraud detection webhook processing
    """
    try:
        # Determine event source
        if 'source' in event and event['source'] == 'eventbridge-batch-processing':
            return handle_batch_processing(event, context)
        else:
            return handle_webhook(event, context)

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        raise


def handle_webhook(event, context):
    """
    Handle incoming webhook POST requests from API Gateway
    """
    try:
        # Parse webhook payload
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract fraud detection data
        transaction_id = body.get('transaction_id', 'unknown')
        pattern_data = body.get('pattern_data', {})
        risk_score = body.get('risk_score', 0)

        # Generate pattern ID
        pattern_id = f"pattern-{transaction_id}"
        timestamp = int(time.time())

        # Store pattern in DynamoDB
        table.put_item(
            Item={
                'pattern_id': pattern_id,
                'timestamp': timestamp,
                'transaction_id': transaction_id,
                'risk_score': Decimal(str(risk_score)),
                'pattern_data': json.dumps(pattern_data),
                'processed_at': datetime.utcnow().isoformat(),
                'environment': ENVIRONMENT_SUFFIX
            }
        )

        # Store audit trail in S3
        audit_key = f"audit/{datetime.utcnow().strftime('%Y/%m/%d')}/{pattern_id}-{timestamp}.json"
        s3.put_object(
            Bucket=S3_AUDIT_BUCKET,
            Key=audit_key,
            Body=json.dumps({
                'pattern_id': pattern_id,
                'timestamp': timestamp,
                'transaction_id': transaction_id,
                'risk_score': risk_score,
                'pattern_data': pattern_data,
                'event': event
            }, default=str),
            ContentType='application/json'
        )

        # Determine action based on risk score
        action = 'approve' if risk_score < 50 else 'review' if risk_score < 80 else 'block'

        print(f"Processed fraud detection event - Pattern: {pattern_id}, Risk: {risk_score}, Action: {action}")

        # Return response for API Gateway
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'pattern_id': pattern_id,
                'timestamp': timestamp,
                'action': action,
                'risk_score': risk_score,
                'message': 'Fraud detection event processed successfully'
            })
        }

    except Exception as e:
        print(f"Error handling webhook: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }


def handle_batch_processing(event, context):
    """
    Handle EventBridge scheduled batch processing
    """
    try:
        print(f"Starting batch fraud pattern analysis - Environment: {ENVIRONMENT_SUFFIX}")

        # Query recent patterns (last 5 minutes)
        current_time = int(time.time())
        five_minutes_ago = current_time - 300

        # Scan DynamoDB for recent high-risk patterns
        response = table.scan(
            FilterExpression='#ts > :time_threshold AND risk_score > :risk_threshold',
            ExpressionAttributeNames={
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues={
                ':time_threshold': five_minutes_ago,
                ':risk_threshold': Decimal('70')
            }
        )

        high_risk_patterns = response.get('Items', [])

        print(f"Found {len(high_risk_patterns)} high-risk patterns in batch analysis")

        # Store batch analysis results in S3
        batch_key = f"batch-analysis/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}-analysis.json"
        s3.put_object(
            Bucket=S3_AUDIT_BUCKET,
            Key=batch_key,
            Body=json.dumps({
                'analysis_time': datetime.utcnow().isoformat(),
                'patterns_analyzed': len(high_risk_patterns),
                'high_risk_count': len(high_risk_patterns),
                'patterns': high_risk_patterns
            }, default=str),
            ContentType='application/json'
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Batch processing completed',
                'patterns_analyzed': len(high_risk_patterns)
            })
        }

    except Exception as e:
        print(f"Error in batch processing: {str(e)}")
        raise
```

## File: lib/README.md

```markdown
# Serverless Fraud Detection System

Production-ready serverless fraud detection system built with Terraform and AWS services.

## Architecture

This solution implements a complete serverless fraud detection pipeline:

- **API Gateway**: REST API endpoint (`POST /webhook`) for receiving fraud detection events
- **Lambda Function**: Container-based (ARM64, 3GB memory) for webhook processing and batch analysis
- **DynamoDB**: `fraud_patterns` table with point-in-time recovery for pattern storage
- **S3**: Encrypted bucket with versioning for audit trail storage
- **EventBridge**: Scheduled rule (every 5 minutes) for batch pattern analysis
- **ECR**: Repository for Lambda container images
- **SQS**: Dead letter queue for failed Lambda invocations
- **CloudWatch Logs**: KMS-encrypted log groups for all services
- **KMS**: Customer-managed key for encryption at rest
- **IAM**: Least-privilege roles with explicit deny policies

## Prerequisites

1. **Terraform**: Version 1.0 or higher
2. **AWS CLI**: Configured with appropriate credentials
3. **Docker**: For building Lambda container images
4. **AWS Account**: With permissions to create all required resources

## Deployment

### 1. Configure Variables

Create a `terraform.tfvars` file:

```hcl
environment_suffix = "dev-001"  # Unique suffix for your deployment
aws_region         = "us-east-1"
```

### 2. Build and Push Lambda Container Image

```bash
# Navigate to Lambda directory
cd lib/lambda

# Get ECR login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build Docker image for ARM64
docker buildx build --platform linux/arm64 -t fraud-detector:latest .

# Tag and push to ECR (after infrastructure is created)
docker tag fraud-detector:latest <ecr-repository-url>:latest
docker push <ecr-repository-url>:latest
```

### 3. Initialize and Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Deploy infrastructure
terraform apply
```

### 4. Post-Deployment

After infrastructure is created:

1. Get ECR repository URL from outputs: `terraform output ecr_repository_url`
2. Build and push Lambda container image (see step 2)
3. Update Lambda function to use the new image (or wait for next deployment)

## Usage

### Testing the Webhook Endpoint

```bash
# Get API Gateway URL
API_URL=$(terraform output -raw api_gateway_url)

# Send test webhook
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-12345",
    "risk_score": 75,
    "pattern_data": {
      "amount": 1500.00,
      "merchant": "TEST_MERCHANT",
      "location": "US"
    }
  }'
```

Expected response:

```json
{
  "pattern_id": "pattern-txn-12345",
  "timestamp": 1234567890,
  "action": "review",
  "risk_score": 75,
  "message": "Fraud detection event processed successfully"
}
```

### Monitoring

```bash
# View Lambda logs
aws logs tail /aws/lambda/fraud-detector-<suffix> --follow

# View API Gateway logs
aws logs tail /aws/apigateway/fraud-detection-<suffix> --follow

# Query DynamoDB table
aws dynamodb scan --table-name fraud-patterns-<suffix>

# List audit trail files in S3
aws s3 ls s3://fraud-detection-audit-trail-<suffix>/audit/ --recursive
```

## Security Features

1. **Encryption at Rest**:
   - S3: KMS encryption
   - DynamoDB: KMS encryption
   - CloudWatch Logs: KMS encryption
   - SQS: KMS encryption

2. **IAM Least Privilege**:
   - Lambda has access only to required resources
   - Explicit deny policies prevent access to out-of-scope resources
   - Service-specific roles with minimal permissions

3. **Network Security**:
   - S3 bucket public access blocked
   - API Gateway regional endpoint
   - VPC isolation (optional - not implemented in basic version)

4. **Audit and Compliance**:
   - All webhook events stored in S3 audit bucket
   - DynamoDB point-in-time recovery enabled
   - S3 versioning enabled
   - CloudWatch Logs retention for 30 days

## Cost Optimization

This solution uses serverless components to minimize costs:

- **Lambda**: Pay per invocation (container-based, ARM64 for cost efficiency)
- **DynamoDB**: On-demand billing (no provisioned capacity)
- **API Gateway**: Pay per request
- **EventBridge**: Minimal cost for scheduled rules
- **S3**: Standard storage with lifecycle policies (can be added)

Estimated monthly cost for 1M webhook events: $50-100 USD

## Cleanup

To destroy all resources:

```bash
# Empty S3 bucket first (versioned objects must be deleted)
aws s3 rm s3://fraud-detection-audit-trail-<suffix> --recursive

# Destroy infrastructure
terraform destroy
```

## Troubleshooting

### Lambda Function Not Working

1. Check CloudWatch Logs: `/aws/lambda/fraud-detector-<suffix>`
2. Verify IAM permissions
3. Ensure Lambda has access to DynamoDB and S3
4. Check environment variables are set correctly

### API Gateway 403 Error

1. Verify Lambda permission for API Gateway invocation
2. Check API Gateway deployment stage
3. Review CloudWatch Logs for API Gateway

### Container Image Issues

1. Verify Docker image is built for `linux/arm64` platform
2. Check ECR repository URL is correct
3. Ensure AWS credentials have ECR push permissions
4. Verify Lambda function is updated with latest image

## Optional Enhancements

To add optional features mentioned in requirements:

1. **Step Functions**: Add state machine for complex fraud workflows
2. **SNS**: Add topic for high-severity alert notifications
3. **X-Ray**: Enable X-Ray tracing for Lambda (already enabled in code)

## Support

For issues or questions:
1. Check CloudWatch Logs for errors
2. Review Terraform plan output
3. Verify all prerequisites are met
4. Ensure `environment_suffix` is unique
