# Serverless ETL Pipeline for Banking Transactions - Terraform Implementation

This implementation provides a complete serverless ETL pipeline using Terraform to process banking transaction files on AWS.

## Architecture Overview

The solution includes:
- S3 buckets for input/output with encryption and versioning
- Lambda function for ETL processing with proper error handling
- SQS dead letter queue for failed messages
- EventBridge rule for triggering Lambda on S3 events
- CloudWatch logs and alarms for monitoring
- IAM roles with least privilege permissions

## File: lib/variables.tf

```hcl
variable "environmentSuffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
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
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout for Lambda function in seconds"
  type        = number
  default     = 300
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "max_receive_count" {
  description = "Maximum number of retries before sending to DLQ"
  type        = number
  default     = 3
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
  default     = ""
}
```

## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Project     = "BankingETL"
      ManagedBy   = "Terraform"
    }
  }
}
```

## File: lib/s3.tf

```hcl
# Input bucket for incoming transaction files
resource "aws_s3_bucket" "input" {
  bucket        = "etl-input-${var.environmentSuffix}"
  force_destroy = true

  tags = {
    Name        = "etl-input-${var.environmentSuffix}"
    Description = "Input bucket for banking transaction files"
  }
}

resource "aws_s3_bucket_versioning" "input" {
  bucket = aws_s3_bucket.input.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "input" {
  bucket = aws_s3_bucket.input.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "input" {
  bucket = aws_s3_bucket.input.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Output bucket for processed transaction data
resource "aws_s3_bucket" "output" {
  bucket        = "etl-output-${var.environmentSuffix}"
  force_destroy = true

  tags = {
    Name        = "etl-output-${var.environmentSuffix}"
    Description = "Output bucket for processed transaction data"
  }
}

resource "aws_s3_bucket_versioning" "output" {
  bucket = aws_s3_bucket.output.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "output" {
  bucket = aws_s3_bucket.output.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "output" {
  bucket = aws_s3_bucket.output.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "output" {
  bucket = aws_s3_bucket.output.id

  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"

    transition {
      days          = 0
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

# Audit bucket for processing logs and metadata
resource "aws_s3_bucket" "audit" {
  bucket        = "etl-audit-${var.environmentSuffix}"
  force_destroy = true

  tags = {
    Name        = "etl-audit-${var.environmentSuffix}"
    Description = "Audit bucket for ETL processing logs"
  }
}

resource "aws_s3_bucket_versioning" "audit" {
  bucket = aws_s3_bucket.audit.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit" {
  bucket = aws_s3_bucket.audit.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Event Notification to EventBridge
resource "aws_s3_bucket_notification" "input_notification" {
  bucket      = aws_s3_bucket.input.id
  eventbridge = true
}
```

## File: lib/sqs.tf

```hcl
# Dead Letter Queue for failed Lambda executions
resource "aws_sqs_queue" "dlq" {
  name                      = "etl-dlq-${var.environmentSuffix}"
  message_retention_seconds = 1209600 # 14 days
  visibility_timeout_seconds = 300

  tags = {
    Name        = "etl-dlq-${var.environmentSuffix}"
    Description = "Dead letter queue for failed ETL processing"
  }
}

resource "aws_sqs_queue_policy" "dlq" {
  queue_url = aws_sqs_queue.dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}
```

## File: lib/iam.tf

```hcl
# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "etl-lambda-role-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "etl-lambda-role-${var.environmentSuffix}"
  }
}

# Policy for Lambda to write logs to CloudWatch
resource "aws_iam_role_policy" "lambda_logging" {
  name = "lambda-logging-policy"
  role = aws_iam_role.lambda_execution.id

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
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/etl-processor-${var.environmentSuffix}:*"
      }
    ]
  })
}

# Policy for Lambda to access S3 buckets
resource "aws_iam_role_policy" "lambda_s3_access" {
  name = "lambda-s3-access-policy"
  role = aws_iam_role.lambda_execution.id

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
          aws_s3_bucket.input.arn,
          "${aws_s3_bucket.input.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "${aws_s3_bucket.output.arn}/*",
          "${aws_s3_bucket.audit.arn}/*"
        ]
      }
    ]
  })
}

# Policy for Lambda to send messages to DLQ
resource "aws_iam_role_policy" "lambda_sqs_access" {
  name = "lambda-sqs-access-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueUrl"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}

# EventBridge role to invoke Lambda
resource "aws_iam_role" "eventbridge_lambda" {
  name = "etl-eventbridge-role-${var.environmentSuffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "etl-eventbridge-role-${var.environmentSuffix}"
  }
}

resource "aws_iam_role_policy" "eventbridge_invoke_lambda" {
  name = "eventbridge-invoke-lambda-policy"
  role = aws_iam_role.eventbridge_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.processor.arn
      }
    ]
  })
}
```

## File: lib/lambda.tf

```hcl
# Archive Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda_function.zip"
}

# Lambda function for ETL processing
resource "aws_lambda_function" "processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "etl-processor-${var.environmentSuffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "processor.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      OUTPUT_BUCKET      = aws_s3_bucket.output.bucket
      AUDIT_BUCKET       = aws_s3_bucket.audit.bucket
      DLQ_URL            = aws_sqs_queue.dlq.url
      ENVIRONMENT_SUFFIX = var.environmentSuffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = {
    Name        = "etl-processor-${var.environmentSuffix}"
    Description = "Lambda function for processing banking transactions"
  }

  depends_on = [
    aws_iam_role_policy.lambda_logging,
    aws_iam_role_policy.lambda_s3_access,
    aws_iam_role_policy.lambda_sqs_access
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/etl-processor-${var.environmentSuffix}"
  retention_in_days = 30

  tags = {
    Name = "etl-lambda-logs-${var.environmentSuffix}"
  }
}

# Lambda permission for EventBridge to invoke
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_object_created.arn
}
```

## File: lib/eventbridge.tf

```hcl
# EventBridge rule to trigger Lambda on S3 object creation
resource "aws_cloudwatch_event_rule" "s3_object_created" {
  name        = "etl-s3-object-created-${var.environmentSuffix}"
  description = "Trigger ETL processing when file is uploaded to input bucket"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.input.bucket]
      }
    }
  })

  tags = {
    Name = "etl-s3-trigger-${var.environmentSuffix}"
  }
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.s3_object_created.name
  target_id = "InvokeLambdaFunction"
  arn       = aws_lambda_function.processor.arn
  role_arn  = aws_iam_role.eventbridge_lambda.arn
}
```

## File: lib/cloudwatch.tf

```hcl
# SNS topic for alarms (conditional)
resource "aws_sns_topic" "alarms" {
  count = var.alarm_email != "" ? 1 : 0
  name  = "etl-alarms-${var.environmentSuffix}"

  tags = {
    Name = "etl-alarms-${var.environmentSuffix}"
  }
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "etl-lambda-errors-${var.environmentSuffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda function has more than 5 errors in 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name = "etl-lambda-errors-${var.environmentSuffix}"
  }
}

# CloudWatch alarm for Lambda throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "etl-lambda-throttles-${var.environmentSuffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when Lambda function is throttled"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name = "etl-lambda-throttles-${var.environmentSuffix}"
  }
}

# CloudWatch alarm for DLQ messages
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "etl-dlq-messages-${var.environmentSuffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alert when messages appear in the DLQ"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name = "etl-dlq-messages-${var.environmentSuffix}"
  }
}
```

## File: lib/outputs.tf

```hcl
output "input_bucket_name" {
  description = "Name of the S3 input bucket"
  value       = aws_s3_bucket.input.bucket
}

output "output_bucket_name" {
  description = "Name of the S3 output bucket"
  value       = aws_s3_bucket.output.bucket
}

output "audit_bucket_name" {
  description = "Name of the S3 audit bucket"
  value       = aws_s3_bucket.audit.bucket
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.processor.arn
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.s3_object_created.name
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example Terraform variables file
# Copy this to terraform.tfvars and customize for your environment

environmentSuffix  = "dev"
aws_region         = "us-east-1"
lambda_memory_size = 512
lambda_timeout     = 300
lambda_runtime     = "python3.11"
max_receive_count  = 3
alarm_email        = "your-email@example.com"
```

## File: lib/lambda/processor.py

```python
import json
import csv
import boto3
import os
from datetime import datetime
from io import StringIO
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
sqs_client = boto3.client('sqs')

# Environment variables
OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET')
AUDIT_BUCKET = os.environ.get('AUDIT_BUCKET')
DLQ_URL = os.environ.get('DLQ_URL')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX')


def handler(event, context):
    """
    Lambda handler to process banking transaction files from S3.

    Args:
        event: EventBridge event containing S3 object details
        context: Lambda context object

    Returns:
        dict: Processing result with status and metadata
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Extract S3 details from EventBridge event
        bucket_name = event['detail']['bucket']['name']
        object_key = event['detail']['object']['key']

        logger.info(f"Processing file: s3://{bucket_name}/{object_key}")

        # Download the file from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        file_content = response['Body'].read().decode('utf-8')

        # Process the transaction file
        result = process_transactions(file_content, object_key)

        # Save processed data to output bucket
        save_processed_data(result['processed_transactions'], object_key)

        # Save audit log
        save_audit_log(result['audit_data'], object_key)

        logger.info(f"Successfully processed {result['total_records']} records")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing completed successfully',
                'records_processed': result['total_records'],
                'records_valid': result['valid_records'],
                'records_invalid': result['invalid_records']
            })
        }

    except Exception as e:
        logger.error(f"Error processing file: {str(e)}", exc_info=True)

        # Send error to DLQ
        try:
            send_to_dlq(event, str(e))
        except Exception as dlq_error:
            logger.error(f"Failed to send message to DLQ: {str(dlq_error)}")

        raise


def process_transactions(file_content, object_key):
    """
    Process transaction file content and validate records.

    Args:
        file_content: Raw file content string
        object_key: S3 object key

    Returns:
        dict: Processing results with statistics
    """
    processed_transactions = []
    invalid_records = []
    total_records = 0
    valid_records = 0

    # Determine file format (CSV or JSON)
    if object_key.endswith('.json'):
        transactions = process_json_format(file_content)
    else:
        transactions = process_csv_format(file_content)

    # Process each transaction
    for idx, transaction in enumerate(transactions):
        total_records += 1

        try:
            # Validate transaction
            validated_transaction = validate_transaction(transaction, idx)

            # Calculate aggregations
            enriched_transaction = enrich_transaction(validated_transaction)

            processed_transactions.append(enriched_transaction)
            valid_records += 1

        except ValueError as e:
            logger.warning(f"Invalid transaction at row {idx}: {str(e)}")
            invalid_records.append({
                'row': idx,
                'data': transaction,
                'error': str(e)
            })

    # Generate audit data
    audit_data = {
        'file': object_key,
        'timestamp': datetime.utcnow().isoformat(),
        'total_records': total_records,
        'valid_records': valid_records,
        'invalid_records': len(invalid_records),
        'invalid_details': invalid_records
    }

    return {
        'processed_transactions': processed_transactions,
        'audit_data': audit_data,
        'total_records': total_records,
        'valid_records': valid_records,
        'invalid_records': len(invalid_records)
    }


def process_csv_format(file_content):
    """Parse CSV format transaction file."""
    csv_reader = csv.DictReader(StringIO(file_content))
    return list(csv_reader)


def process_json_format(file_content):
    """Parse JSON format transaction file."""
    data = json.loads(file_content)

    # Handle both array of transactions and object with transactions field
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and 'transactions' in data:
        return data['transactions']
    else:
        raise ValueError("Invalid JSON format: expected array or object with 'transactions' field")


def validate_transaction(transaction, row_index):
    """
    Validate a single transaction record.

    Args:
        transaction: Transaction record dict
        row_index: Row index for error reporting

    Returns:
        dict: Validated transaction

    Raises:
        ValueError: If transaction is invalid
    """
    required_fields = ['transaction_id', 'amount', 'account_id', 'timestamp']

    # Check required fields
    for field in required_fields:
        if field not in transaction or not transaction[field]:
            raise ValueError(f"Missing required field: {field}")

    # Validate amount is numeric
    try:
        amount = float(transaction['amount'])
        if amount < 0:
            raise ValueError("Amount cannot be negative")
    except (ValueError, TypeError):
        raise ValueError("Invalid amount format")

    # Validate transaction_id is not empty
    if not str(transaction['transaction_id']).strip():
        raise ValueError("Transaction ID cannot be empty")

    # Validate account_id format (simple check)
    if not str(transaction['account_id']).strip():
        raise ValueError("Account ID cannot be empty")

    return transaction


def enrich_transaction(transaction):
    """
    Enrich transaction with calculated fields and metadata.

    Args:
        transaction: Validated transaction dict

    Returns:
        dict: Enriched transaction
    """
    enriched = transaction.copy()

    # Add processing metadata
    enriched['processed_at'] = datetime.utcnow().isoformat()
    enriched['environment'] = ENVIRONMENT_SUFFIX

    # Convert amount to float for calculations
    amount = float(enriched['amount'])
    enriched['amount_float'] = amount

    # Add transaction type based on amount
    enriched['transaction_type'] = 'credit' if amount >= 0 else 'debit'

    # Add categorization (simple example)
    enriched['category'] = categorize_transaction(enriched)

    return enriched


def categorize_transaction(transaction):
    """
    Categorize transaction based on amount and description.
    Simple example categorization logic.
    """
    amount = abs(float(transaction['amount']))

    if amount < 50:
        return 'small'
    elif amount < 1000:
        return 'medium'
    else:
        return 'large'


def save_processed_data(transactions, object_key):
    """
    Save processed transactions to output bucket with date partitioning.

    Args:
        transactions: List of processed transactions
        object_key: Original S3 object key
    """
    if not transactions:
        logger.warning("No valid transactions to save")
        return

    # Create date partition
    now = datetime.utcnow()
    partition = f"year={now.year}/month={now.month:02d}/day={now.day:02d}"

    # Generate output file name
    file_name = os.path.basename(object_key)
    output_key = f"{partition}/processed_{file_name}.json"

    # Save to S3
    s3_client.put_object(
        Bucket=OUTPUT_BUCKET,
        Key=output_key,
        Body=json.dumps(transactions, indent=2),
        ContentType='application/json',
        ServerSideEncryption='AES256'
    )

    logger.info(f"Saved processed data to s3://{OUTPUT_BUCKET}/{output_key}")


def save_audit_log(audit_data, object_key):
    """
    Save processing audit log to audit bucket.

    Args:
        audit_data: Audit data dictionary
        object_key: Original S3 object key
    """
    # Generate audit file name
    file_name = os.path.basename(object_key)
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    audit_key = f"audit_logs/{timestamp}_{file_name}_audit.json"

    # Save to S3
    s3_client.put_object(
        Bucket=AUDIT_BUCKET,
        Key=audit_key,
        Body=json.dumps(audit_data, indent=2),
        ContentType='application/json',
        ServerSideEncryption='AES256'
    )

    logger.info(f"Saved audit log to s3://{AUDIT_BUCKET}/{audit_key}")


def send_to_dlq(event, error_message):
    """
    Send failed event to dead letter queue.

    Args:
        event: Original event that failed processing
        error_message: Error message describing the failure
    """
    message_body = {
        'event': event,
        'error': error_message,
        'timestamp': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT_SUFFIX
    }

    sqs_client.send_message(
        QueueUrl=DLQ_URL,
        MessageBody=json.dumps(message_body)
    )

    logger.info(f"Sent message to DLQ: {DLQ_URL}")
```

## File: lib/lambda/requirements.txt

```txt
boto3>=1.26.0
```

## File: lib/README.md

```markdown
# Serverless ETL Pipeline for Banking Transactions

A production-ready serverless ETL pipeline built with Terraform that processes banking transaction files on AWS.

## Architecture

The solution implements a fully serverless architecture:

- **S3 Input Bucket**: Receives banking transaction files (CSV or JSON)
- **EventBridge**: Triggers Lambda function when new files arrive
- **Lambda Function**: Processes transactions, validates data, and enriches records
- **S3 Output Bucket**: Stores processed transactions with date partitioning
- **S3 Audit Bucket**: Maintains processing logs and audit trails
- **SQS Dead Letter Queue**: Captures failed processing attempts
- **CloudWatch Logs**: Records all Lambda executions
- **CloudWatch Alarms**: Monitors errors, throttles, and DLQ messages
- **IAM Roles**: Enforces least privilege access control

## Features

- **Automatic Processing**: Files uploaded to input bucket trigger processing automatically
- **Data Validation**: Validates transaction records and handles malformed data
- **Error Handling**: Comprehensive error handling with retry logic and DLQ
- **Security**: Encryption at rest, least privilege IAM, no public access
- **Monitoring**: CloudWatch logs and alarms for operational visibility
- **Cost Optimization**: S3 Intelligent-Tiering for storage cost savings
- **Audit Trail**: Complete audit logs for compliance requirements

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create resources

## Deployment

1. **Initialize Terraform**:
```bash
cd lib
terraform init
```

2. **Create terraform.tfvars**:
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

3. **Review Plan**:
```bash
terraform plan -var-file=terraform.tfvars
```

4. **Deploy Infrastructure**:
```bash
terraform apply -var-file=terraform.tfvars
```

## Configuration

Key variables in `terraform.tfvars`:

- `environmentSuffix`: Unique identifier for resource names (required)
- `aws_region`: AWS region for deployment (default: us-east-1)
- `lambda_memory_size`: Lambda memory allocation in MB (default: 512)
- `lambda_timeout`: Lambda timeout in seconds (default: 300)
- `alarm_email`: Email for CloudWatch alarms (optional)

## Usage

### Upload Transaction File

Upload a CSV or JSON file to the input bucket:

```bash
aws s3 cp transactions.csv s3://etl-input-<environmentSuffix>/transactions.csv
```

### CSV Format Example

```csv
transaction_id,amount,account_id,timestamp,description
TXN001,150.50,ACC12345,2024-01-15T10:30:00Z,Payment received
TXN002,-45.00,ACC12346,2024-01-15T11:00:00Z,Purchase at store
```

### JSON Format Example

```json
{
  "transactions": [
    {
      "transaction_id": "TXN001",
      "amount": 150.50,
      "account_id": "ACC12345",
      "timestamp": "2024-01-15T10:30:00Z",
      "description": "Payment received"
    }
  ]
}
```

### Monitor Processing

View Lambda logs:

```bash
aws logs tail /aws/lambda/etl-processor-<environmentSuffix> --follow
```

Check processed files:

```bash
aws s3 ls s3://etl-output-<environmentSuffix>/ --recursive
```

View audit logs:

```bash
aws s3 ls s3://etl-audit-<environmentSuffix>/audit_logs/ --recursive
```

Check DLQ for failures:

```bash
aws sqs receive-message --queue-url <dlq-url> --max-number-of-messages 10
```

## Testing

### Unit Tests

Run Lambda function unit tests:

```bash
cd lib/lambda
python -m pytest test_processor.py -v
```

### Integration Tests

Run integration tests:

```bash
cd test
python -m pytest test_integration.py -v
```

## Resource Naming

All resources include the `environmentSuffix` variable for uniqueness:

- S3 Buckets: `etl-{input|output|audit}-${environmentSuffix}`
- Lambda Function: `etl-processor-${environmentSuffix}`
- IAM Roles: `etl-lambda-role-${environmentSuffix}`
- SQS Queue: `etl-dlq-${environmentSuffix}`
- CloudWatch Alarms: `etl-{alarm-type}-${environmentSuffix}`

## Security

- All S3 buckets encrypted with AES-256
- Block public access enabled on all buckets
- IAM roles follow least privilege principle
- Versioning enabled on all buckets
- CloudWatch logs for audit trail

## Cost Optimization

- Serverless architecture (pay per use)
- S3 Intelligent-Tiering for automatic cost optimization
- Lambda memory tuned for performance/cost balance
- CloudWatch log retention set to 30 days

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file=terraform.tfvars
```

Note: S3 buckets use `force_destroy = true` for clean teardown during testing.

## Troubleshooting

### Lambda Timeout

If processing large files (>100MB), increase `lambda_timeout` and `lambda_memory_size`:

```hcl
lambda_timeout     = 600
lambda_memory_size = 1024
```

### DLQ Messages

Check DLQ for failed processing attempts:

```bash
aws sqs receive-message --queue-url $(terraform output -raw dlq_url)
```

### CloudWatch Alarms

If alarms trigger frequently, review:
- Lambda error logs
- Input file format and data quality
- Lambda memory and timeout settings

## Support

For issues or questions, review:
- CloudWatch Logs: `/aws/lambda/etl-processor-${environmentSuffix}`
- Audit Logs: `s3://etl-audit-${environmentSuffix}/audit_logs/`
- Dead Letter Queue messages for error details
```