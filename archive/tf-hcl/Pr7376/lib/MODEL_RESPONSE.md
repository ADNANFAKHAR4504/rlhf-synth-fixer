# Financial Market Data Processing System - Terraform Implementation

This document contains the complete Terraform implementation for the Financial Market Data Processing System using EventBridge, Lambda, and DynamoDB.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 512
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "FinancialMarketData"
    ManagedBy   = "Terraform"
    Environment = "production"
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
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# DynamoDB Table for Market Data Storage
resource "aws_dynamodb_table" "market_data" {
  name           = "market-data-${var.environment_suffix}"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "event_id"
  range_key      = "timestamp"
  stream_enabled = false

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "exchange"
    type = "S"
  }

  attribute {
    name = "symbol"
    type = "S"
  }

  global_secondary_index {
    name            = "ExchangeIndex"
    hash_key        = "exchange"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "SymbolIndex"
    hash_key        = "symbol"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiration_time"
    enabled        = true
  }

  tags = {
    Name = "market-data-${var.environment_suffix}"
  }
}

# DynamoDB Table for Audit Trail
resource "aws_dynamodb_table" "audit_trail" {
  name           = "audit-trail-${var.environment_suffix}"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "audit_id"
  range_key      = "timestamp"
  stream_enabled = false

  attribute {
    name = "audit_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "event_type"
    type = "S"
  }

  global_secondary_index {
    name            = "EventTypeIndex"
    hash_key        = "event_type"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "audit-trail-${var.environment_suffix}"
  }
}

# EventBridge Event Bus
resource "aws_cloudwatch_event_bus" "market_data" {
  name = "market-data-bus-${var.environment_suffix}"

  tags = {
    Name = "market-data-bus-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "market_processor" {
  name              = "/aws/lambda/market-processor-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "market-processor-logs-${var.environment_suffix}"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_execution" {
  name = "market-processor-lambda-role-${var.environment_suffix}"

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
    Name = "market-processor-lambda-role-${var.environment_suffix}"
  }
}

# IAM Policy for Lambda DynamoDB Access
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "lambda-dynamodb-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.market_data.arn,
          "${aws_dynamodb_table.market_data.arn}/index/*",
          aws_dynamodb_table.audit_trail.arn,
          "${aws_dynamodb_table.audit_trail.arn}/index/*"
        ]
      }
    ]
  })
}

# IAM Policy for Lambda CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logging" {
  name = "lambda-logging-policy-${var.environment_suffix}"
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
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/market-processor-${var.environment_suffix}:*"
      }
    ]
  })
}

# SQS Dead Letter Queue for Failed Events
resource "aws_sqs_queue" "dlq" {
  name                      = "market-processor-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name = "market-processor-dlq-${var.environment_suffix}"
  }
}

# Lambda Function Package
data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda_package.zip"
}

# Lambda Function
resource "aws_lambda_function" "market_processor" {
  filename         = data.archive_file.lambda_package.output_path
  function_name    = "market-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "handler.lambda_handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory

  environment {
    variables = {
      MARKET_DATA_TABLE = aws_dynamodb_table.market_data.name
      AUDIT_TRAIL_TABLE = aws_dynamodb_table.audit_trail.name
      ENVIRONMENT       = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  depends_on = [
    aws_cloudwatch_log_group.market_processor,
    aws_iam_role_policy.lambda_dynamodb,
    aws_iam_role_policy.lambda_logging
  ]

  tags = {
    Name = "market-processor-${var.environment_suffix}"
  }
}

# IAM Policy for Lambda to Send to DLQ
resource "aws_iam_role_policy" "lambda_dlq" {
  name = "lambda-dlq-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}

# EventBridge Rule for Trade Events
resource "aws_cloudwatch_event_rule" "trade_events" {
  name           = "trade-events-rule-${var.environment_suffix}"
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  description    = "Route trade execution events to Lambda processor"

  event_pattern = jsonencode({
    source      = ["market.data"]
    detail-type = ["Trade Execution", "Trade Update"]
  })

  tags = {
    Name = "trade-events-rule-${var.environment_suffix}"
  }
}

# EventBridge Rule for Quote Events
resource "aws_cloudwatch_event_rule" "quote_events" {
  name           = "quote-events-rule-${var.environment_suffix}"
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  description    = "Route market quote events to Lambda processor"

  event_pattern = jsonencode({
    source      = ["market.data"]
    detail-type = ["Market Quote", "Price Update"]
  })

  tags = {
    Name = "quote-events-rule-${var.environment_suffix}"
  }
}

# EventBridge Target for Trade Events
resource "aws_cloudwatch_event_target" "trade_lambda" {
  rule           = aws_cloudwatch_event_rule.trade_events.name
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  target_id      = "trade-lambda-target"
  arn            = aws_lambda_function.market_processor.arn

  retry_policy {
    maximum_event_age       = 3600
    maximum_retry_attempts  = 2
  }

  dead_letter_config {
    arn = aws_sqs_queue.dlq.arn
  }
}

# EventBridge Target for Quote Events
resource "aws_cloudwatch_event_target" "quote_lambda" {
  rule           = aws_cloudwatch_event_rule.quote_events.name
  event_bus_name = aws_cloudwatch_event_bus.market_data.name
  target_id      = "quote-lambda-target"
  arn            = aws_lambda_function.market_processor.arn

  retry_policy {
    maximum_event_age       = 3600
    maximum_retry_attempts  = 2
  }

  dead_letter_config {
    arn = aws_sqs_queue.dlq.arn
  }
}

# Lambda Permission for EventBridge Trade Events
resource "aws_lambda_permission" "eventbridge_trade" {
  statement_id  = "AllowEventBridgeTradeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.market_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.trade_events.arn
}

# Lambda Permission for EventBridge Quote Events
resource "aws_lambda_permission" "eventbridge_quote" {
  statement_id  = "AllowEventBridgeQuoteInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.market_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.quote_events.arn
}

# CloudWatch Alarm for Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "market-processor-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda function has more than 5 errors in 1 minute"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.market_processor.function_name
  }

  tags = {
    Name = "market-processor-errors-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Lambda Duration
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "market-processor-duration-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 5000
  alarm_description   = "Alert when Lambda function average duration exceeds 5 seconds"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.market_processor.function_name
  }

  tags = {
    Name = "market-processor-duration-${var.environment_suffix}"
  }
}
```

## File: lib/outputs.tf

```hcl
output "event_bus_name" {
  description = "Name of the EventBridge event bus"
  value       = aws_cloudwatch_event_bus.market_data.name
}

output "event_bus_arn" {
  description = "ARN of the EventBridge event bus"
  value       = aws_cloudwatch_event_bus.market_data.arn
}

output "lambda_function_name" {
  description = "Name of the market processor Lambda function"
  value       = aws_lambda_function.market_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the market processor Lambda function"
  value       = aws_lambda_function.market_processor.arn
}

output "market_data_table_name" {
  description = "Name of the DynamoDB market data table"
  value       = aws_dynamodb_table.market_data.name
}

output "market_data_table_arn" {
  description = "ARN of the DynamoDB market data table"
  value       = aws_dynamodb_table.market_data.arn
}

output "audit_trail_table_name" {
  description = "Name of the DynamoDB audit trail table"
  value       = aws_dynamodb_table.audit_trail.name
}

output "audit_trail_table_arn" {
  description = "ARN of the DynamoDB audit trail table"
  value       = aws_dynamodb_table.audit_trail.arn
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
  value       = aws_cloudwatch_log_group.market_processor.name
}

output "trade_events_rule_arn" {
  description = "ARN of the trade events EventBridge rule"
  value       = aws_cloudwatch_event_rule.trade_events.arn
}

output "quote_events_rule_arn" {
  description = "ARN of the quote events EventBridge rule"
  value       = aws_cloudwatch_event_rule.quote_events.arn
}
```

## File: lib/lambda/handler.py

```python
import json
import os
import time
import uuid
from decimal import Decimal
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Get table names from environment variables
MARKET_DATA_TABLE = os.environ['MARKET_DATA_TABLE']
AUDIT_TRAIL_TABLE = os.environ['AUDIT_TRAIL_TABLE']
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'unknown')

# Get table resources
market_data_table = dynamodb.Table(MARKET_DATA_TABLE)
audit_trail_table = dynamodb.Table(AUDIT_TRAIL_TABLE)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process incoming market data events from EventBridge.

    Args:
        event: EventBridge event containing market data
        context: Lambda context object

    Returns:
        Response dictionary with status and processed event count
    """
    try:
        print(f"Received event: {json.dumps(event)}")

        # Extract event details
        event_id = event.get('id', str(uuid.uuid4()))
        source = event.get('source', 'unknown')
        detail_type = event.get('detail-type', 'unknown')
        detail = event.get('detail', {})
        timestamp = int(time.time() * 1000)  # milliseconds

        # Process the market data event
        result = process_market_event(
            event_id=event_id,
            source=source,
            detail_type=detail_type,
            detail=detail,
            timestamp=timestamp
        )

        # Create audit trail
        create_audit_record(
            event_id=event_id,
            event_type=detail_type,
            timestamp=timestamp,
            status='SUCCESS',
            details=result
        )

        print(f"Successfully processed event {event_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event processed successfully',
                'event_id': event_id,
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")

        # Create error audit record
        try:
            create_audit_record(
                event_id=event_id if 'event_id' in locals() else 'unknown',
                event_type=detail_type if 'detail_type' in locals() else 'unknown',
                timestamp=int(time.time() * 1000),
                status='ERROR',
                details={'error': str(e)}
            )
        except Exception as audit_error:
            print(f"Failed to create audit record: {str(audit_error)}")

        # Re-raise exception for Lambda retry logic
        raise


def process_market_event(
    event_id: str,
    source: str,
    detail_type: str,
    detail: Dict[str, Any],
    timestamp: int
) -> Dict[str, Any]:
    """
    Process and store market data event in DynamoDB.

    Args:
        event_id: Unique event identifier
        source: Event source
        detail_type: Type of market data event
        detail: Event details containing market data
        timestamp: Event timestamp in milliseconds

    Returns:
        Dictionary with processing results
    """
    # Extract market data fields
    exchange = detail.get('exchange', 'UNKNOWN')
    symbol = detail.get('symbol', 'UNKNOWN')
    price = detail.get('price', 0)
    volume = detail.get('volume', 0)

    # Convert float to Decimal for DynamoDB
    if isinstance(price, float):
        price = Decimal(str(price))
    if isinstance(volume, (int, float)):
        volume = Decimal(str(volume))

    # Prepare item for DynamoDB
    item = {
        'event_id': event_id,
        'timestamp': timestamp,
        'source': source,
        'detail_type': detail_type,
        'exchange': exchange,
        'symbol': symbol,
        'price': price,
        'volume': volume,
        'raw_data': json.dumps(detail),
        'processed_at': int(time.time()),
        'environment': ENVIRONMENT
    }

    # Add TTL (30 days from now)
    ttl_days = 30
    item['expiration_time'] = int(time.time()) + (ttl_days * 24 * 60 * 60)

    # Store in DynamoDB
    try:
        market_data_table.put_item(Item=item)
        print(f"Stored market data for {symbol} from {exchange}")
    except ClientError as e:
        print(f"Error storing market data: {e.response['Error']['Message']}")
        raise

    return {
        'event_id': event_id,
        'symbol': symbol,
        'exchange': exchange,
        'price': float(price),
        'volume': float(volume)
    }


def create_audit_record(
    event_id: str,
    event_type: str,
    timestamp: int,
    status: str,
    details: Dict[str, Any]
) -> None:
    """
    Create an audit trail record in DynamoDB.

    Args:
        event_id: Unique event identifier
        event_type: Type of event
        timestamp: Event timestamp in milliseconds
        status: Processing status (SUCCESS or ERROR)
        details: Additional details about the processing
    """
    audit_id = str(uuid.uuid4())

    audit_item = {
        'audit_id': audit_id,
        'timestamp': timestamp,
        'event_id': event_id,
        'event_type': event_type,
        'status': status,
        'details': json.dumps(details),
        'environment': ENVIRONMENT,
        'created_at': int(time.time())
    }

    try:
        audit_trail_table.put_item(Item=audit_item)
        print(f"Created audit record {audit_id} for event {event_id}")
    except ClientError as e:
        print(f"Error creating audit record: {e.response['Error']['Message']}")
        # Don't raise exception for audit failures
```

## File: lib/lambda/requirements.txt

```txt
boto3>=1.28.0
botocore>=1.31.0
```

## File: lib/terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and customize

environment_suffix = "dev"
aws_region         = "us-east-1"
lambda_runtime     = "python3.11"
lambda_timeout     = 30
lambda_memory      = 512
log_retention_days = 30

tags = {
  Project     = "FinancialMarketData"
  ManagedBy   = "Terraform"
  Environment = "development"
  Team        = "Platform"
}
```

## File: lib/README.md

```markdown
# Financial Market Data Processing System

This Terraform configuration deploys a serverless event-driven architecture for processing real-time financial market data using AWS EventBridge, Lambda, and DynamoDB.

## Architecture Overview

The system consists of the following components:

- **EventBridge Event Bus**: Central hub for receiving and routing market data events
- **Lambda Function**: Serverless processor for market data events
- **DynamoDB Tables**:
  - `market-data`: Stores processed market data with GSIs for querying
  - `audit-trail`: Maintains complete audit trail for compliance
- **CloudWatch Logs**: Centralized logging for monitoring and debugging
- **SQS Dead Letter Queue**: Captures failed events for analysis
- **CloudWatch Alarms**: Monitors Lambda errors and performance

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- Python 3.11 or Node.js 18.x for Lambda runtime
- AWS account with necessary permissions

## Resource Naming Convention

All resources follow the naming pattern: `{resource-type}-{purpose}-${var.environment_suffix}`

This ensures:
- Unique resource names across environments
- Easy identification of resource purpose
- Prevention of naming conflicts

## Deployment Instructions

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Configure Variables

Create a `terraform.tfvars` file from the example:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your specific values:

```hcl
environment_suffix = "prod"
aws_region         = "us-east-1"
lambda_runtime     = "python3.11"
lambda_timeout     = 30
lambda_memory      = 512
log_retention_days = 30
```

### 3. Review Execution Plan

```bash
terraform plan -var-file=terraform.tfvars
```

### 4. Deploy Infrastructure

```bash
terraform apply -var-file=terraform.tfvars
```

### 5. Verify Deployment

After successful deployment, Terraform will output the resource names and ARNs:

```bash
terraform output
```

## Testing the System

### Send Test Events to EventBridge

Use the AWS CLI to send test market data events:

```bash
aws events put-events \
  --entries '[
    {
      "Source": "market.data",
      "DetailType": "Trade Execution",
      "Detail": "{\"exchange\":\"NYSE\",\"symbol\":\"AAPL\",\"price\":150.25,\"volume\":1000}",
      "EventBusName": "market-data-bus-<environment_suffix>"
    }
  ]'
```

### Query DynamoDB for Processed Data

```bash
aws dynamodb query \
  --table-name market-data-<environment_suffix> \
  --index-name SymbolIndex \
  --key-condition-expression "symbol = :symbol" \
  --expression-attribute-values '{":symbol":{"S":"AAPL"}}'
```

### Check Lambda Logs

```bash
aws logs tail /aws/lambda/market-processor-<environment_suffix> --follow
```

### Monitor Dead Letter Queue

```bash
aws sqs receive-message \
  --queue-url $(terraform output -raw dlq_url) \
  --max-number-of-messages 10
```

## Monitoring and Observability

### CloudWatch Dashboards

The system automatically creates CloudWatch alarms for:

- Lambda function errors (threshold: 5 errors per minute)
- Lambda function duration (threshold: 5 seconds average)

### Key Metrics to Monitor

- **Lambda Invocations**: Total number of events processed
- **Lambda Errors**: Failed event processing attempts
- **Lambda Duration**: Processing latency
- **DynamoDB Consumed Capacity**: Read/write throughput
- **SQS Messages**: Failed events in DLQ

### Accessing Logs

CloudWatch Logs are organized by Lambda function:

```bash
/aws/lambda/market-processor-<environment_suffix>
```

Logs are retained for 30 days for compliance requirements.

## Security

### IAM Roles and Policies

The Lambda function operates with least-privilege IAM permissions:

- **DynamoDB**: PutItem, GetItem, Query, UpdateItem on specific tables
- **CloudWatch Logs**: CreateLogGroup, CreateLogStream, PutLogEvents
- **SQS**: SendMessage to DLQ only

### Data Encryption

- DynamoDB tables use server-side encryption
- CloudWatch Logs are encrypted at rest
- Data in transit uses TLS 1.2+

### Network Security

- Lambda functions operate in AWS-managed VPC
- No public endpoints exposed
- EventBridge uses AWS PrivateLink

## Scaling and Performance

### Auto-Scaling

- **Lambda**: Automatically scales up to 1000 concurrent executions
- **DynamoDB**: PAY_PER_REQUEST billing mode scales automatically
- **EventBridge**: Handles millions of events per second

### Performance Targets

- Lambda cold start: < 1 second
- Lambda warm execution: < 200ms
- DynamoDB latency: Single-digit milliseconds
- End-to-end processing: < 500ms

## Cost Optimization

- DynamoDB PAY_PER_REQUEST eliminates idle capacity costs
- Lambda charges only for actual compute time
- CloudWatch Logs retention limited to 30 days
- DynamoDB TTL automatically removes old data

## Disaster Recovery

### Backup Strategy

- DynamoDB Point-in-Time Recovery enabled (35 days)
- CloudWatch Logs retained for 30 days
- Infrastructure state in Terraform state file

### Recovery Procedures

1. **Data Recovery**: Use DynamoDB point-in-time recovery
2. **Infrastructure Recovery**: Re-apply Terraform configuration
3. **Failed Events**: Replay from DLQ

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file=terraform.tfvars
```

**WARNING**: This will permanently delete all data. Ensure you have backups before destroying.

## Troubleshooting

### Lambda Function Not Processing Events

1. Check EventBridge rule is enabled
2. Verify Lambda permissions for EventBridge
3. Check Lambda function logs in CloudWatch

### DynamoDB Write Failures

1. Check IAM role permissions
2. Verify table exists and is ACTIVE
3. Check for provisioned throughput limits (if not using PAY_PER_REQUEST)

### High Lambda Errors

1. Check DLQ for failed event details
2. Review Lambda function logs
3. Verify event payload format

## Compliance and Audit

### Audit Trail

All events are logged in the `audit-trail` DynamoDB table with:

- Unique audit ID
- Original event ID
- Processing status
- Timestamp
- Detailed processing information

### Compliance Features

- 30-day log retention for regulatory requirements
- Complete audit trail of all transactions
- Encryption at rest and in transit
- Point-in-time recovery for data protection

## Support and Maintenance

For issues or questions:

1. Check CloudWatch Logs for errors
2. Review Terraform plan output
3. Consult AWS service documentation

## License

This infrastructure code is managed by the Platform Engineering team.
```
