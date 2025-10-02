# Terraform Infrastructure for Serverless Order Processing System

## variables.tf
```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "service_name" {
  description = "Service name for tagging"
  type        = string
  default     = "OrderProcessing"
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 55
}

variable "sqs_visibility_timeout" {
  description = "SQS visibility timeout in seconds"
  type        = number
  default     = 60
}

variable "sqs_message_retention_days" {
  description = "SQS message retention period in days"
  type        = number
  default     = 4
}

variable "dlq_message_retention_days" {
  description = "DLQ message retention period in days"
  type        = number
  default     = 14
}

variable "max_receive_count" {
  description = "Maximum receive count before sending to DLQ"
  type        = number
  default     = 3
}

variable "lambda_reserved_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda"
  type        = number
  default     = 10
}

variable "sqs_batch_size" {
  description = "Batch size for SQS to Lambda event source mapping"
  type        = number
  default     = 5
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "dlq_alarm_threshold" {
  description = "DLQ message count threshold for CloudWatch alarm"
  type        = number
  default     = 5
}
```

## main.tf
```hcl
# main.tf

locals {
  common_tags = {
    Environment = var.environment
    Service     = var.service_name
    ManagedBy   = "Terraform"
  }
}

# Data source for Lambda deployment package
data "archive_file" "lambda_package" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_deployment.zip"
}

# DynamoDB Table for order status tracking
resource "aws_dynamodb_table" "order_status" {
  name           = "order-processing-status"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "order_id"

  attribute {
    name = "order_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "order-processing-status"
  })
}

# Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                      = "order-processing-dlq"
  message_retention_seconds = var.dlq_message_retention_days * 24 * 60 * 60

  tags = merge(local.common_tags, {
    Name = "order-processing-dlq"
    Type = "DeadLetterQueue"
  })
}

# Main SQS Queue
resource "aws_sqs_queue" "order_queue" {
  name                      = "order-processing-queue"
  visibility_timeout_seconds = var.sqs_visibility_timeout
  message_retention_seconds = var.sqs_message_retention_days * 24 * 60 * 60

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(local.common_tags, {
    Name = "order-processing-queue"
    Type = "StandardQueue"
  })
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "order-processing-lambda-role"

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

# IAM Policy for Lambda
resource "aws_iam_policy" "lambda_policy" {
  name        = "order-processing-lambda-policy"
  description = "Policy for order processing Lambda function"

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
        Resource = aws_sqs_queue.order_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.order_status.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Attach AWS managed policy for basic Lambda execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/order-processing"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "order-processing-lambda-logs"
  })
}

# Lambda Function
resource "aws_lambda_function" "order_processor" {
  filename         = data.archive_file.lambda_package.output_path
  function_name    = "order-processing-function"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  runtime         = "python3.10"
  memory_size     = var.lambda_memory_size
  timeout         = var.lambda_timeout
  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.order_status.name
      DLQ_URL            = aws_sqs_queue.dlq.url
      REGION             = var.aws_region
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = merge(local.common_tags, {
    Name = "order-processing-function"
  })
}

# SQS to Lambda Event Source Mapping
resource "aws_lambda_event_source_mapping" "sqs_lambda_trigger" {
  event_source_arn = aws_sqs_queue.order_queue.arn
  function_name    = aws_lambda_function.order_processor.arn
  batch_size       = var.sqs_batch_size
  enabled          = true

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment
  ]
}

# CloudWatch Metric Alarm for DLQ
resource "aws_cloudwatch_metric_alarm" "dlq_alarm" {
  alarm_name          = "order-processing-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "ApproximateNumberOfMessagesVisible"
  namespace          = "AWS/SQS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.dlq_alarm_threshold
  alarm_description  = "Alert when DLQ has more than ${var.dlq_alarm_threshold} messages"
  treat_missing_data = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  tags = merge(local.common_tags, {
    Name = "order-processing-dlq-alarm"
  })
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "order_processing" {
  dashboard_name = "order-processing-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { stat = "Average", label = "Messages in Queue" }],
            [".", "NumberOfMessagesReceived", { stat = "Sum", label = "Messages Received" }],
            [".", "NumberOfMessagesDeleted", { stat = "Sum", label = "Messages Processed" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Order Queue Metrics"
          dimensions = {
            QueueName = aws_sqs_queue.order_queue.name
          }
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Errors" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration (ms)" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Metrics"
          dimensions = {
            FunctionName = aws_lambda_function.order_processor.function_name
          }
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { stat = "Average", label = "Messages in DLQ" }]
          ]
          view    = "singleValue"
          region  = var.aws_region
          title   = "Dead Letter Queue"
          dimensions = {
            QueueName = aws_sqs_queue.dlq.name
          }
          period = 300
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.lambda_logs.name}' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent Lambda Logs"
        }
      }
    ]
  })
}

# Enable CloudWatch Insights for Lambda logs
resource "aws_cloudwatch_query_definition" "order_processing_insights" {
  name = "order-processing-insights"

  log_group_names = [
    aws_cloudwatch_log_group.lambda_logs.name
  ]

  query_string = <<-QUERY
    fields @timestamp, @message, @logStream, @log
    | filter @message like /ERROR|WARNING|PROCESSED/
    | stats count() by bin(5m)
  QUERY
}
```

## outputs.tf
```hcl
# outputs.tf

output "order_queue_url" {
  description = "URL of the order processing queue"
  value       = aws_sqs_queue.order_queue.url
}

output "order_queue_arn" {
  description = "ARN of the order processing queue"
  value       = aws_sqs_queue.order_queue.arn
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.order_processor.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.order_processor.function_name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.order_status.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.order_status.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.order_processing.dashboard_name}"
}
```

## lambda_function.py
```python
# lambda_function.py

import json
import boto3
import os
import logging
from datetime import datetime
from typing import Dict, Any, List
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients with region
region = os.environ.get('REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb', region_name=region)
sqs = boto3.client('sqs', region_name=region)

# Get environment variables
DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
DLQ_URL = os.environ.get('DLQ_URL', '')

# Get DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process order confirmation messages from SQS queue.

    Args:
        event: SQS event containing order messages
        context: Lambda context object

    Returns:
        Dict containing processing status
    """
    logger.info(f"Received {len(event.get('Records', []))} messages for processing")

    processed_count = 0
    failed_count = 0
    batch_item_failures = []

    # Process each message in the batch
    for record in event.get('Records', []):
        message_id = record.get('messageId')
        receipt_handle = record.get('receiptHandle')

        try:
            # Parse the message body
            body = json.loads(record.get('body', '{}'))
            order_id = body.get('order_id')

            if not order_id:
                raise ValueError("Missing order_id in message")

            logger.info(f"Processing order: {order_id}")

            # Process the order
            process_result = process_order(order_id, body)

            if process_result['success']:
                # Update status in DynamoDB
                update_order_status(
                    order_id=order_id,
                    status='PROCESSED',
                    details=process_result.get('details', {}),
                    error_message=None
                )
                processed_count += 1
                logger.info(f"Successfully processed order: {order_id}")
            else:
                # Handle processing failure
                raise Exception(f"Order processing failed: {process_result.get('error', 'Unknown error')}")

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in message {message_id}: {str(e)}")
            batch_item_failures.append({"itemIdentifier": message_id})
            failed_count += 1

        except Exception as e:
            logger.error(f"Error processing message {message_id}: {str(e)}")

            # Try to extract order_id for error logging
            try:
                body = json.loads(record.get('body', '{}'))
                order_id = body.get('order_id', 'unknown')
            except:
                order_id = 'unknown'

            # Update status as failed in DynamoDB
            try:
                update_order_status(
                    order_id=order_id,
                    status='FAILED',
                    details={'message_id': message_id},
                    error_message=str(e)
                )
            except Exception as db_error:
                logger.error(f"Failed to update DynamoDB for order {order_id}: {str(db_error)}")

            # Add to batch failures for reprocessing
            batch_item_failures.append({"itemIdentifier": message_id})
            failed_count += 1

    # Log processing summary
    logger.info(f"Processing complete. Processed: {processed_count}, Failed: {failed_count}")

    # Return batch item failures for partial batch failure handling
    return {
        "batchItemFailures": batch_item_failures
    }

def process_order(order_id: str, order_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process individual order confirmation.

    Args:
        order_id: Unique order identifier
        order_data: Order details dictionary

    Returns:
        Dict with processing result
    """
    try:
        # Validate required fields
        required_fields = ['customer_id', 'amount', 'items']
        for field in required_fields:
            if field not in order_data:
                raise ValueError(f"Missing required field: {field}")

        # Simulate order processing logic
        customer_id = order_data['customer_id']
        amount = order_data['amount']
        items = order_data['items']

        # Validate amount
        if amount <= 0:
            raise ValueError(f"Invalid order amount: {amount}")

        # Validate items
        if not items or not isinstance(items, list):
            raise ValueError("Invalid or empty items list")

        # Process order (simulated business logic)
        processing_details = {
            'customer_id': customer_id,
            'amount': amount,
            'item_count': len(items),
            'confirmation_number': f"CONF-{order_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        }

        logger.info(f"Order {order_id} processed successfully with confirmation: {processing_details['confirmation_number']}")

        return {
            'success': True,
            'details': processing_details
        }

    except Exception as e:
        logger.error(f"Error in process_order for {order_id}: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def update_order_status(order_id: str, status: str, details: Dict[str, Any], error_message: str = None) -> None:
    """
    Update order status in DynamoDB table.

    Args:
        order_id: Unique order identifier
        status: Processing status (PROCESSED, FAILED, etc.)
        details: Additional processing details
        error_message: Error message if processing failed
    """
    try:
        timestamp = datetime.utcnow().isoformat()

        # Prepare the item
        item = {
            'order_id': order_id,
            'status': status,
            'processed_at': timestamp,
            'details': json.dumps(details)
        }

        if error_message:
            item['error_message'] = error_message

        # Use paginator-friendly approach for large result sets
        response = table.put_item(Item=item)

        logger.info(f"Updated DynamoDB for order {order_id} with status: {status}")

    except ClientError as e:
        logger.error(f"DynamoDB error for order {order_id}: {e.response['Error']['Message']}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating DynamoDB for order {order_id}: {str(e)}")
        raise

def get_processing_stats() -> Dict[str, int]:
    """
    Get processing statistics from DynamoDB using paginator.

    Returns:
        Dict with processing statistics
    """
    try:
        paginator = dynamodb.meta.client.get_paginator('scan')

        stats = {
            'total': 0,
            'processed': 0,
            'failed': 0
        }

        # Use paginator for efficient scanning of large tables
        page_iterator = paginator.paginate(
            TableName=DYNAMODB_TABLE_NAME,
            Select='COUNT',
            FilterExpression='attribute_exists(#status)',
            ExpressionAttributeNames={'#status': 'status'}
        )

        for page in page_iterator:
            stats['total'] += page['Count']

        logger.info(f"Processing statistics: {stats}")
        return stats

    except Exception as e:
        logger.error(f"Error getting processing stats: {str(e)}")
        return {'total': 0, 'processed': 0, 'failed': 0}
```
