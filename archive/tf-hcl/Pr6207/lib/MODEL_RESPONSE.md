### Reasoning Trace
---

The user wants me to implement a serverless fraud detection pipeline using AWS services in a Terraform configuration file (tap_stack.tf). Based on the requirements, I need to create:

1. API Gateway with REST API endpoint for /transactions (POST)
2. Lambda function for transaction processing (Python 3.11, Graviton2 ARM)
3. DynamoDB table with streams enabled
4. Lambda function for fraud detection (triggered by DynamoDB streams)
5. SQS queue for suspicious transactions
6. Dead letter queues for both Lambda functions
7. CloudWatch alarms and logging
8. IAM roles and policies with least privilege
9. All the necessary integrations between services

I'll structure this as a complete Terraform configuration file with all the necessary resources.
### Answer 
---

I'll implement the complete serverless fraud detection pipeline in Terraform. Here's the `tap_stack.tf` file:

```terraform
# tap_stack.tf - Serverless Fraud Detection Pipeline

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
}

# ==================== Variables ====================
variable "aws_region" {
  description = "AWS Region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "fraud-detection"
}

# ==================== Local Variables ====================
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  
  lambda_timeout     = 30
  lambda_memory_size = 512
}

# ==================== DynamoDB Table ====================
resource "aws_dynamodb_table" "transactions" {
  name           = "${var.project_name}-transactions-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "transaction_id"
  range_key      = "timestamp"
  
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "transaction_id"
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
    enabled = true
  }
  
  tags = local.common_tags
}

# ==================== SQS Queues ====================
# Dead Letter Queue for Transaction Processing Lambda
resource "aws_sqs_queue" "transaction_dlq" {
  name                       = "${var.project_name}-transaction-dlq-${var.environment}"
  message_retention_seconds  = 1209600  # 14 days
  visibility_timeout_seconds = 300
  
  tags = local.common_tags
}

# Dead Letter Queue for Fraud Detection Lambda
resource "aws_sqs_queue" "fraud_detection_dlq" {
  name                       = "${var.project_name}-fraud-detection-dlq-${var.environment}"
  message_retention_seconds  = 1209600  # 14 days
  visibility_timeout_seconds = 300
  
  tags = local.common_tags
}

# Main Queue for Suspicious Transactions
resource "aws_sqs_queue" "suspicious_transactions" {
  name                       = "${var.project_name}-suspicious-transactions-${var.environment}"
  message_retention_seconds  = 345600   # 4 days
  visibility_timeout_seconds = 300
  receive_wait_time_seconds  = 20       # Long polling
  
  tags = local.common_tags
}

# ==================== IAM Roles and Policies ====================
# Transaction Processing Lambda Role
resource "aws_iam_role" "transaction_lambda_role" {
  name = "${var.project_name}-transaction-lambda-role-${var.environment}"
  
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

# Fraud Detection Lambda Role
resource "aws_iam_role" "fraud_detection_lambda_role" {
  name = "${var.project_name}-fraud-detection-lambda-role-${var.environment}"
  
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

# Transaction Lambda Policy
resource "aws_iam_role_policy" "transaction_lambda_policy" {
  name = "${var.project_name}-transaction-lambda-policy-${var.environment}"
  role = aws_iam_role.transaction_lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.transaction_dlq.arn
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

# Fraud Detection Lambda Policy
resource "aws_iam_role_policy" "fraud_detection_lambda_policy" {
  name = "${var.project_name}-fraud-detection-lambda-policy-${var.environment}"
  role = aws_iam_role.fraud_detection_lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "${aws_dynamodb_table.transactions.arn}/stream/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:GetItem"
        ]
        Resource = aws_dynamodb_table.transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.fraud_detection_dlq.arn,
          aws_sqs_queue.suspicious_transactions.arn
        ]
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

# ==================== Lambda Functions ====================
# Transaction Processing Lambda
resource "aws_lambda_function" "transaction_processor" {
  filename         = "lambda_functions/transaction_processor.zip"
  function_name    = "${var.project_name}-transaction-processor-${var.environment}"
  role            = aws_iam_role.transaction_lambda_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda_functions/transaction_processor.zip")
  runtime         = "python3.11"
  architectures   = ["arm64"]  # Graviton2
  timeout         = local.lambda_timeout
  memory_size     = local.lambda_memory_size
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.transactions.name
      ENVIRONMENT    = var.environment
    }
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.transaction_dlq.arn
  }
  
  reserved_concurrent_executions = 1000
  
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
}

# Fraud Detection Lambda
resource "aws_lambda_function" "fraud_detector" {
  filename         = "lambda_functions/fraud_detector.zip"
  function_name    = "${var.project_name}-fraud-detector-${var.environment}"
  role            = aws_iam_role.fraud_detection_lambda_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda_functions/fraud_detector.zip")
  runtime         = "python3.11"
  architectures   = ["arm64"]  # Graviton2
  timeout         = local.lambda_timeout
  memory_size     = local.lambda_memory_size
  
  environment {
    variables = {
      DYNAMODB_TABLE     = aws_dynamodb_table.transactions.name
      SQS_QUEUE_URL      = aws_sqs_queue.suspicious_transactions.url
      ENVIRONMENT        = var.environment
    }
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.fraud_detection_dlq.arn
  }
  
  reserved_concurrent_executions = 500
  
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
}

# DynamoDB Stream Event Source Mapping
resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn       = aws_dynamodb_table.transactions.stream_arn
  function_name          = aws_lambda_function.fraud_detector.arn
  starting_position      = "LATEST"
  maximum_retry_attempts = 3
  
  parallelization_factor               = 10
  maximum_batching_window_in_seconds   = 5
  maximum_record_age_in_seconds        = 3600
  bisect_batch_on_function_error      = true
  
  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.fraud_detection_dlq.arn
    }
  }
}

# ==================== API Gateway ====================
resource "aws_api_gateway_rest_api" "fraud_detection_api" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "Fraud Detection API for transaction processing"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = local.common_tags
}

# API Gateway Resource
resource "aws_api_gateway_resource" "transactions" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id
  parent_id   = aws_api_gateway_rest_api.fraud_detection_api.root_resource_id
  path_part   = "transactions"
}

# Request Validator
resource "aws_api_gateway_request_validator" "transaction_validator" {
  name                        = "transaction-validator"
  rest_api_id                 = aws_api_gateway_rest_api.fraud_detection_api.id
  validate_request_body       = true
  validate_request_parameters = false
}

# API Gateway Model (JSON Schema)
resource "aws_api_gateway_model" "transaction_model" {
  rest_api_id  = aws_api_gateway_rest_api.fraud_detection_api.id
  name         = "TransactionModel"
  content_type = "application/json"
  
  schema = jsonencode({
    "$schema" = "http://json-schema.org/draft-04/schema#"
    type     = "object"
    required = ["transaction_id", "amount", "card_number", "merchant_id", "timestamp"]
    properties = {
      transaction_id = {
        type = "string"
      }
      amount = {
        type = "number"
        minimum = 0
      }
      card_number = {
        type = "string"
        pattern = "^[0-9]{16}$"
      }
      merchant_id = {
        type = "string"
      }
      timestamp = {
        type = "number"
      }
      location = {
        type = "object"
        properties = {
          lat = { type = "number" }
          lng = { type = "number" }
        }
      }
    }
  })
}

# API Gateway Method
resource "aws_api_gateway_method" "post_transaction" {
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection_api.id
  resource_id   = aws_api_gateway_resource.transactions.id
  http_method   = "POST"
  authorization = "NONE"
  
  request_validator_id = aws_api_gateway_request_validator.transaction_validator.id
  
  request_models = {
    "application/json" = aws_api_gateway_model.transaction_model.name
  }
}

# API Gateway Integration
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id
  resource_id = aws_api_gateway_resource.transactions.id
  http_method = aws_api_gateway_method.post_transaction.http_method
  
  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.transaction_processor.invoke_arn
  
  timeout_milliseconds = 29000
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fraud_detection_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "fraud_detection_deployment" {
  depends_on = [
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_method.post_transaction
  ]
  
  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id
  stage_name  = var.environment
  
  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "fraud_detection_stage" {
  deployment_id = aws_api_gateway_deployment.fraud_detection_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.fraud_detection_api.id
  stage_name    = var.environment
  
  xray_tracing_enabled = true
  
  tags = local.common_tags
}

# API Gateway Method Settings (for throttling)
resource "aws_api_gateway_method_settings" "transaction_settings" {
  rest_api_id = aws_api_gateway_rest_api.fraud_detection_api.id
  stage_name  = aws_api_gateway_stage.fraud_detection_stage.stage_name
  method_path = "${aws_api_gateway_resource.transactions.path_part}/${aws_api_gateway_method.post_transaction.http_method}"
  
  settings {
    throttling_rate_limit  = 10000
    throttling_burst_limit = 5000
    metrics_enabled        = true
    logging_level         = "INFO"
    data_trace_enabled    = true
  }
}

# ==================== CloudWatch Log Groups ====================
resource "aws_cloudwatch_log_group" "transaction_processor_logs" {
  name              = "/aws/lambda/${aws_lambda_function.transaction_processor.function_name}"
  retention_in_days = 7
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "fraud_detector_logs" {
  name              = "/aws/lambda/${aws_lambda_function.fraud_detector.function_name}"
  retention_in_days = 7
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.fraud_detection_api.name}"
  retention_in_days = 7
  
  tags = local.common_tags
}

# ==================== CloudWatch Alarms ====================
# Transaction Processor Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "transaction_processor_errors" {
  alarm_name          = "${var.project_name}-transaction-processor-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Average"
  threshold          = "0.01"
  alarm_description  = "This metric monitors transaction processor lambda errors"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.transaction_processor.function_name
  }
  
  tags = local.common_tags
}

# Fraud Detector Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "fraud_detector_errors" {
  alarm_name          = "${var.project_name}-fraud-detector-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Average"
  threshold          = "0.01"
  alarm_description  = "This metric monitors fraud detector lambda errors"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.fraud_detector.function_name
  }
  
  tags = local.common_tags
}

# Lambda Duration Alarm
resource "aws_cloudwatch_metric_alarm" "transaction_processor_duration" {
  alarm_name          = "${var.project_name}-transaction-processor-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Duration"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Average"
  threshold          = "3000"
  alarm_description  = "Alert when lambda execution takes too long"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.transaction_processor.function_name
  }
  
  tags = local.common_tags
}

# DLQ Message Count Alarm
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project_name}-dlq-messages-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "ApproximateNumberOfMessagesVisible"
  namespace          = "AWS/SQS"
  period             = "300"
  statistic          = "Sum"
  threshold          = "10"
  alarm_description  = "Alert when messages are in DLQ"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    QueueName = aws_sqs_queue.transaction_dlq.name
  }
  
  tags = local.common_tags
}

# API Gateway 4XX Errors Alarm
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "${var.project_name}-api-4xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "4XXError"
  namespace          = "AWS/ApiGateway"
  period             = "300"
  statistic          = "Sum"
  threshold          = "100"
  alarm_description  = "Alert on high 4XX error rate"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.fraud_detection_api.name
    Stage   = var.environment
  }
  
  tags = local.common_tags
}

# ==================== CloudWatch Dashboard ====================
resource "aws_cloudwatch_dashboard" "fraud_detection_dashboard" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Transaction Processor" }],
            [".", "Errors", { stat = "Sum", label = "Errors", yAxis = "right" }],
            [".", "Duration", { stat = "Average", label = "Duration", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Performance"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "API Calls" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors", yAxis = "right" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Metrics"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "UserErrors", { stat = "Sum" }],
            [".", "SystemErrors", { stat = "Sum" }],
            [".", "ConsumedReadCapacityUnits", { stat = "Sum", yAxis = "right" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Performance"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", { stat = "Sum", label = "Messages Sent" }],
            [".", "ApproximateNumberOfMessagesVisible", { stat = "Average", label = "Messages in Queue" }],
            [".", "ApproximateAgeOfOldestMessage", { stat = "Maximum", label = "Oldest Message Age", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "SQS Queue Metrics"
          period  = 300
        }
      }
    ]
  })
}

# ==================== Outputs ====================
output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL for transaction submissions"
  value       = "${aws_api_gateway_deployment.fraud_detection_deployment.invoke_url}${aws_api_gateway_stage.fraud_detection_stage.stage_name}/transactions"
}

output "sqs_queue_url" {
  description = "SQS queue URL for suspicious transaction processing"
  value       = aws_sqs_queue.suspicious_transactions.url
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table storing transactions"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_stream_arn" {
  description = "ARN of the DynamoDB stream"
  value       = aws_dynamodb_table.transactions.stream_arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to CloudWatch Dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.fraud_detection_dashboard.dashboard_name}"
}

output "transaction_processor_lambda_arn" {
  description = "ARN of the transaction processor Lambda function"
  value       = aws_lambda_function.transaction_processor.arn
}

output "fraud_detector_lambda_arn" {
  description = "ARN of the fraud detector Lambda function"
  value       = aws_lambda_function.fraud_detector.arn
}
```

## Lambda Function Code Examples

You'll also need to create the Lambda function code. Here are example implementations:

### Transaction Processor Lambda (`lambda_functions/transaction_processor.py`):

```python
import json
import boto3
import os
import logging
from decimal import Decimal
import time
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

def handler(event, context):
    try:
        # Parse the incoming transaction
        body = json.loads(event['body'])
        
        # Add server-side timestamp if not provided
        if 'timestamp' not in body:
            body['timestamp'] = int(time.time() * 1000)
        
        # Generate transaction_id if not provided
        if 'transaction_id' not in body:
            body['transaction_id'] = str(uuid.uuid4())
        
        # Convert float to Decimal for DynamoDB
        if 'amount' in body:
            body['amount'] = Decimal(str(body['amount']))
        
        # Store in DynamoDB
        table.put_item(Item=body)
        
        logger.info(f"Transaction processed: {body['transaction_id']}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': body['transaction_id']
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
```

### Fraud Detector Lambda (`lambda_functions/fraud_detector.py`):

```python
import json
import boto3
import os
import logging
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
queue_url = os.environ['SQS_QUEUE_URL']

def handler(event, context):
    suspicious_transactions = []
    
    for record in event['Records']:
        if record['eventName'] in ['INSERT', 'MODIFY']:
            try:
                # Extract the transaction from the stream
                new_image = record['dynamodb'].get('NewImage', {})
                transaction = {
                    'transaction_id': new_image.get('transaction_id', {}).get('S', ''),
                    'amount': float(new_image.get('amount', {}).get('N', 0)),
                    'card_number': new_image.get('card_number', {}).get('S', ''),
                    'merchant_id': new_image.get('merchant_id', {}).get('S', ''),
                    'timestamp': int(new_image.get('timestamp', {}).get('N', 0))
                }
                
                # Simple fraud detection rules
                is_suspicious = detect_fraud(transaction)
                
                if is_suspicious:
                    suspicious_transactions.append(transaction)
                    
                    # Send to SQS for manual review
                    sqs.send_message(
                        QueueUrl=queue_url,
                        MessageBody=json.dumps(transaction),
                        MessageAttributes={
                            'fraud_score': {
                                'StringValue': str(calculate_fraud_score(transaction)),
                                'DataType': 'Number'
                            }
                        }
                    )
                    
                    logger.warning(f"Suspicious transaction detected: {transaction['transaction_id']}")
                
            except Exception as e:
                logger.error(f"Error processing record: {str(e)}")
                raise
    
    return {
        'statusCode': 200,
        'batchItemFailures': []
    }

def detect_fraud(transaction):
    """Simple fraud detection logic"""
    # High amount transactions
    if transaction['amount'] > 10000:
        return True
    
    # Suspicious patterns (example)
    # You can add more sophisticated ML models here
    return False

def calculate_fraud_score(transaction):
    """Calculate a fraud risk score"""
    score = 0
    
    if transaction['amount'] > 5000:
        score += 30
    if transaction['amount'] > 10000:
        score += 40
    
    return min(score, 100)
```

## Deployment Instructions

1. **Create the Lambda deployment packages:**
```bash
# Create directories
mkdir -p lambda_functions

# Create transaction processor package
cd lambda_functions
echo "import json..." > transaction_processor.py  # Add the code above
zip transaction_processor.zip transaction_processor.py
mv transaction_processor.py index.py
zip -u transaction_processor.zip index.py

# Create fraud detector package
echo "import json..." > fraud_detector.py  # Add the code above
zip fraud_detector.zip fraud_detector.py
mv fraud_detector.py index.py
zip -u fraud_detector.zip index.py
cd ..
```

2. **Initialize and deploy Terraform:**
```bash
terraform init
terraform plan
terraform apply
```

## Key Features Implemented

1. **Scalability**: Auto-scaling Lambda functions with reserved concurrency
2. **Cost Optimization**: ARM Graviton2 processors, 7-day log retention
3. **Error Handling**: DLQs with 3 retry attempts, error alarms
4. **Monitoring**: CloudWatch dashboard, multiple alarms
5. **Security**: Least privilege IAM roles, request validation
6. **Performance**: DynamoDB on-demand billing, SQS long polling

The system will automatically scale from 100 to 50,000+ transactions per minute based on demand.