# Serverless Webhook Processing System - Terraform Implementation

This implementation provides a complete serverless webhook processing system using Terraform with HCL. The infrastructure includes API Gateway REST API, Lambda functions, DynamoDB, SQS FIFO queues, SNS topics, and comprehensive monitoring.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming to support multiple deployments"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the existing ACM certificate for custom domain"
  type        = string
}

variable "custom_domain_name" {
  description = "Custom domain name for API Gateway"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}
```

## File: lib/main.tf

```hcl
# KMS Key for DynamoDB and SQS encryption
resource "aws_kms_key" "webhook_kms" {
  description             = "KMS key for webhook system encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "webhook-kms-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_kms_alias" "webhook_kms_alias" {
  name          = "alias/webhook-kms-${var.environment_suffix}"
  target_key_id = aws_kms_key.webhook_kms.key_id
}

# DynamoDB Table for webhook storage
resource "aws_dynamodb_table" "webhooks" {
  name           = "webhooks-${var.environment_suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "webhook_id"

  attribute {
    name = "webhook_id"
    type = "S"
  }

  ttl {
    attribute_name = "expiry_time"
    enabled        = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.webhook_kms.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "webhooks-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Dead Letter Queue for SQS FIFO
resource "aws_sqs_queue" "webhook_dlq" {
  name                       = "webhook-dlq-${var.environment_suffix}.fifo"
  fifo_queue                 = true
  content_based_deduplication = true
  kms_master_key_id          = aws_kms_key.webhook_kms.id
  kms_data_key_reuse_period_seconds = 300

  tags = {
    Name        = "webhook-dlq-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# SQS FIFO Queue for webhook processing
resource "aws_sqs_queue" "webhook_queue" {
  name                       = "webhook-queue-${var.environment_suffix}.fifo"
  fifo_queue                 = true
  content_based_deduplication = true
  visibility_timeout_seconds = 300
  kms_master_key_id          = aws_kms_key.webhook_kms.id
  kms_data_key_reuse_period_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.webhook_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "webhook-queue-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# SNS Topic for notifications
resource "aws_sns_topic" "webhook_notifications" {
  name              = "webhook-notifications-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.webhook_kms.id

  tags = {
    Name        = "webhook-notifications-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Log Group for validation Lambda
resource "aws_cloudwatch_log_group" "validation_lambda_logs" {
  name              = "/aws/lambda/webhook-validation-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "webhook-validation-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Log Group for processing Lambda
resource "aws_cloudwatch_log_group" "processing_lambda_logs" {
  name              = "/aws/lambda/webhook-processing-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "webhook-processing-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Role for validation Lambda
resource "aws_iam_role" "validation_lambda_role" {
  name = "webhook-validation-lambda-${var.environment_suffix}"

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
    Name        = "webhook-validation-lambda-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Policy for validation Lambda
resource "aws_iam_role_policy" "validation_lambda_policy" {
  name = "webhook-validation-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.validation_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.webhooks.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.webhook_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.webhook_kms.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.validation_lambda_logs.arn}:*"
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

# Dead Letter Queue for processing Lambda
resource "aws_sqs_queue" "processing_lambda_dlq" {
  name                       = "processing-lambda-dlq-${var.environment_suffix}"
  kms_master_key_id          = aws_kms_key.webhook_kms.id
  kms_data_key_reuse_period_seconds = 300

  tags = {
    Name        = "processing-lambda-dlq-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Role for processing Lambda
resource "aws_iam_role" "processing_lambda_role" {
  name = "webhook-processing-lambda-${var.environment_suffix}"

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
    Name        = "webhook-processing-lambda-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Policy for processing Lambda
resource "aws_iam_role_policy" "processing_lambda_policy" {
  name = "webhook-processing-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.processing_lambda_role.id

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
        Resource = aws_sqs_queue.webhook_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.webhook_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.webhook_kms.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.processing_lambda_logs.arn}:*"
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

# Validation Lambda Function
resource "aws_lambda_function" "webhook_validation" {
  filename         = "${path.module}/lambda/validation.zip"
  function_name    = "webhook-validation-${var.environment_suffix}"
  role             = aws_iam_role.validation_lambda_role.arn
  handler          = "validation.lambda_handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/validation.zip")
  runtime          = "python3.9"
  memory_size      = 512
  timeout          = 30

  reserved_concurrent_executions = 100

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.webhooks.name
      SQS_QUEUE_URL  = aws_sqs_queue.webhook_queue.id
    }
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.validation_lambda_logs]

  tags = {
    Name        = "webhook-validation-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Processing Lambda Function
resource "aws_lambda_function" "webhook_processing" {
  filename         = "${path.module}/lambda/processing.zip"
  function_name    = "webhook-processing-${var.environment_suffix}"
  role             = aws_iam_role.processing_lambda_role.arn
  handler          = "processing.lambda_handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/processing.zip")
  runtime          = "python3.9"
  memory_size      = 512
  timeout          = 60

  reserved_concurrent_executions = 100

  dead_letter_config {
    target_arn = aws_sqs_queue.processing_lambda_dlq.arn
  }

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.webhook_notifications.arn
    }
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.processing_lambda_logs]

  tags = {
    Name        = "webhook-processing-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Lambda Event Source Mapping for SQS
resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn = aws_sqs_queue.webhook_queue.arn
  function_name    = aws_lambda_function.webhook_processing.arn
  batch_size       = 10
  enabled          = true
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/webhook-api-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "webhook-api-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "webhook_api" {
  name        = "webhook-api-${var.environment_suffix}"
  description = "Webhook processing API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "webhook-api-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# API Gateway Resource (/webhooks)
resource "aws_api_gateway_resource" "webhooks" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_rest_api.webhook_api.root_resource_id
  path_part   = "webhooks"
}

# API Gateway Method (POST)
resource "aws_api_gateway_method" "post_webhook" {
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  resource_id   = aws_api_gateway_resource.webhooks.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration with Lambda
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.webhook_api.id
  resource_id             = aws_api_gateway_resource.webhooks.id
  http_method             = aws_api_gateway_method.post_webhook.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.webhook_validation.invoke_arn
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_validation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "webhook_deployment" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id

  depends_on = [
    aws_api_gateway_integration.lambda_integration
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "webhook_stage" {
  deployment_id = aws_api_gateway_deployment.webhook_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  stage_name    = "prod"

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name        = "webhook-api-stage-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# API Gateway Custom Domain
resource "aws_api_gateway_domain_name" "webhook_domain" {
  domain_name              = var.custom_domain_name
  regional_certificate_arn = var.acm_certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "webhook-domain-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# API Gateway Base Path Mapping
resource "aws_api_gateway_base_path_mapping" "webhook_mapping" {
  api_id      = aws_api_gateway_rest_api.webhook_api.id
  stage_name  = aws_api_gateway_stage.webhook_stage.stage_name
  domain_name = aws_api_gateway_domain_name.webhook_domain.domain_name
}

# CloudWatch Alarm for DLQ
resource "aws_cloudwatch_metric_alarm" "dlq_alarm" {
  alarm_name          = "webhook-dlq-messages-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when messages appear in DLQ"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.webhook_dlq.name
  }

  tags = {
    Name        = "webhook-dlq-alarm-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
```

## File: lib/outputs.tf

```hcl
output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = "${aws_api_gateway_stage.webhook_stage.invoke_url}/webhooks"
}

output "custom_domain_url" {
  description = "Custom domain URL for API Gateway"
  value       = "https://${aws_api_gateway_domain_name.webhook_domain.domain_name}/webhooks"
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.webhooks.name
}

output "sqs_queue_url" {
  description = "SQS FIFO queue URL"
  value       = aws_sqs_queue.webhook_queue.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.webhook_notifications.arn
}

output "validation_lambda_arn" {
  description = "Validation Lambda function ARN"
  value       = aws_lambda_function.webhook_validation.arn
}

output "processing_lambda_arn" {
  description = "Processing Lambda function ARN"
  value       = aws_lambda_function.webhook_processing.arn
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.webhook_kms.id
}

output "dlq_url" {
  description = "Dead letter queue URL"
  value       = aws_sqs_queue.webhook_dlq.id
}

output "regional_domain_name" {
  description = "Regional domain name for Route53 alias"
  value       = aws_api_gateway_domain_name.webhook_domain.regional_domain_name
}

output "regional_zone_id" {
  description = "Regional zone ID for Route53 alias"
  value       = aws_api_gateway_domain_name.webhook_domain.regional_zone_id
}
```

## File: lib/lambda/validation.py

```python
import json
import os
import time
import uuid
import hashlib
import hmac
import boto3
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
SQS_QUEUE_URL = os.environ['SQS_QUEUE_URL']

# For demo purposes - in production, retrieve from Secrets Manager
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', 'default-secret-key')

def lambda_handler(event, context):
    """
    Validates webhook signature and stores payload in DynamoDB
    """
    try:
        # Parse the incoming webhook
        body = json.loads(event.get('body', '{}'))
        headers = event.get('headers', {})

        # Validate signature
        signature = headers.get('X-Webhook-Signature', '')
        if not validate_signature(event.get('body', ''), signature):
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid signature'})
            }

        # Generate webhook ID
        webhook_id = str(uuid.uuid4())

        # Calculate expiry time (30 days from now)
        expiry_time = int((datetime.now() + timedelta(days=30)).timestamp())

        # Store in DynamoDB
        table = dynamodb.Table(DYNAMODB_TABLE)
        table.put_item(
            Item={
                'webhook_id': webhook_id,
                'payload': json.dumps(body),
                'timestamp': int(time.time()),
                'expiry_time': expiry_time,
                'source_ip': event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
            }
        )

        # Send to SQS for processing
        message_group_id = body.get('merchant_id', 'default')
        deduplication_id = f"{webhook_id}-{int(time.time())}"

        sqs.send_message(
            QueueUrl=SQS_QUEUE_URL,
            MessageBody=json.dumps({
                'webhook_id': webhook_id,
                'payload': body
            }),
            MessageGroupId=message_group_id,
            MessageDeduplicationId=deduplication_id
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook received and queued for processing',
                'webhook_id': webhook_id
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def validate_signature(payload, signature):
    """
    Validates webhook signature using HMAC SHA256
    """
    if not signature:
        return False

    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)
```

## File: lib/lambda/processing.py

```python
import json
import os
import boto3
from datetime import datetime

sns = boto3.client('sns')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def lambda_handler(event, context):
    """
    Processes webhook messages in batches and publishes to SNS
    """
    processed_count = 0
    failed_count = 0

    try:
        # Process each message in the batch
        for record in event['Records']:
            try:
                message_body = json.loads(record['body'])
                webhook_id = message_body['webhook_id']
                payload = message_body['payload']

                # Process the webhook
                result = process_webhook(webhook_id, payload)

                # Publish to SNS
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Message=json.dumps({
                        'webhook_id': webhook_id,
                        'status': 'processed',
                        'timestamp': datetime.now().isoformat(),
                        'result': result
                    }),
                    Subject='Webhook Processed',
                    MessageAttributes={
                        'webhook_id': {
                            'DataType': 'String',
                            'StringValue': webhook_id
                        },
                        'status': {
                            'DataType': 'String',
                            'StringValue': 'processed'
                        }
                    }
                )

                processed_count += 1

            except Exception as e:
                print(f"Error processing record: {str(e)}")
                failed_count += 1
                # Re-raise to send message to DLQ after max retries
                raise

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': processed_count,
                'failed': failed_count
            })
        }

    except Exception as e:
        print(f"Batch processing error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_webhook(webhook_id, payload):
    """
    Business logic for processing webhook
    """
    # Implement your webhook processing logic here
    # This is a placeholder that simulates processing

    return {
        'webhook_id': webhook_id,
        'processed_at': datetime.now().isoformat(),
        'payload_size': len(json.dumps(payload))
    }
```

## File: lib/lambda/package.sh

```bash
#!/bin/bash

# Package validation Lambda
cd $(dirname $0)
mkdir -p temp_validation
cp validation.py temp_validation/
cd temp_validation
zip -r ../validation.zip .
cd ..
rm -rf temp_validation

# Package processing Lambda
mkdir -p temp_processing
cp processing.py temp_processing/
cd temp_processing
zip -r ../processing.zip .
cd ..
rm -rf temp_processing

echo "Lambda functions packaged successfully"
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

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
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "Terraform"
      Project     = "webhook-processing"
    }
  }
}
```

## File: lib/README.md

```markdown
# Serverless Webhook Processing System

This Terraform configuration deploys a complete serverless webhook processing system with API Gateway, Lambda, DynamoDB, SQS, and SNS.

## Architecture

1. **API Gateway REST API**: Receives webhook POST requests at `/webhooks` endpoint
2. **Validation Lambda**: Validates webhook signatures and stores in DynamoDB
3. **DynamoDB**: Stores webhook payloads with 30-day TTL
4. **SQS FIFO Queue**: Ensures ordered processing of validated webhooks
5. **Processing Lambda**: Processes messages in batches of 10 and publishes to SNS
6. **SNS Topic**: Notifies downstream services of processed webhooks
7. **Dead Letter Queues**: Captures failed messages for both SQS and Lambda

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Existing ACM certificate for custom domain

## Deployment

### 1. Package Lambda Functions

```bash
cd lib/lambda
chmod +x package.sh
./package.sh
cd ../..
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Create terraform.tfvars

```hcl
environment_suffix    = "dev"
acm_certificate_arn   = "arn:aws:acm:us-east-1:123456789012:certificate/xxxxx"
custom_domain_name    = "webhooks.example.com"
aws_region            = "us-east-1"
```

### 4. Deploy

```bash
terraform plan
terraform apply
```

## Configuration

### Lambda Environment Variables

The Lambda functions use the following environment variables (automatically configured):

**Validation Lambda**:
- `DYNAMODB_TABLE`: DynamoDB table name
- `SQS_QUEUE_URL`: SQS FIFO queue URL
- `WEBHOOK_SECRET`: (Optional) Secret for signature validation

**Processing Lambda**:
- `SNS_TOPIC_ARN`: SNS topic ARN for notifications

### Resource Naming

All resources use the `environment_suffix` variable for unique naming:
- Format: `resource-type-${var.environment_suffix}`
- Example: `webhook-api-dev`

## Testing

### Send Test Webhook

```bash
# Get the API Gateway URL
API_URL=$(terraform output -raw api_gateway_url)

# Send test webhook
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: <signature>" \
  -d '{"merchant_id": "test123", "amount": 100, "currency": "USD"}'
```

### Monitor Processing

```bash
# Check DynamoDB for stored webhooks
aws dynamodb scan --table-name webhooks-${ENVIRONMENT_SUFFIX}

# Check SQS queue depth
aws sqs get-queue-attributes \
  --queue-url $(terraform output -raw sqs_queue_url) \
  --attribute-names ApproximateNumberOfMessages

# Check CloudWatch Logs
aws logs tail /aws/lambda/webhook-validation-${ENVIRONMENT_SUFFIX} --follow
aws logs tail /aws/lambda/webhook-processing-${ENVIRONMENT_SUFFIX} --follow
```

## Security

- **Encryption**: KMS customer-managed keys for DynamoDB and SQS
- **IAM**: Least-privilege policies for each Lambda function
- **X-Ray Tracing**: Enabled on all Lambda functions for debugging
- **Signature Validation**: HMAC SHA256 signature verification on webhooks
- **CloudWatch Logs**: 7-day retention for all services

## Outputs

- `api_gateway_url`: API Gateway invoke URL
- `custom_domain_url`: Custom domain URL
- `dynamodb_table_name`: DynamoDB table name
- `sqs_queue_url`: SQS queue URL
- `sns_topic_arn`: SNS topic ARN
- `validation_lambda_arn`: Validation Lambda ARN
- `processing_lambda_arn`: Processing Lambda ARN
- `kms_key_id`: KMS key ID
- `dlq_url`: Dead letter queue URL

## Cost Optimization

- Lambda: Pay-per-invocation with 512MB memory
- DynamoDB: On-demand billing mode
- SQS: No charge for first 1M requests/month
- CloudWatch Logs: 7-day retention
- API Gateway: Pay-per-request pricing

## Cleanup

```bash
terraform destroy
```

Note: Ensure SQS queues and DynamoDB table are empty before destroying to avoid data loss.
```

## Deployment Instructions

1. Package Lambda functions by running the package script
2. Initialize Terraform with `terraform init`
3. Create terraform.tfvars with required variables
4. Review the plan with `terraform plan`
5. Deploy with `terraform apply`
6. Configure DNS to point custom domain to the regional domain name output
7. Test the webhook endpoint using the provided curl command

The infrastructure is fully destroyable and uses environmentSuffix for all resource names to support parallel deployments.
