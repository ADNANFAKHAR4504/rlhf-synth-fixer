# Transaction Reconciliation Pipeline - Terraform Infrastructure

This document contains the complete Terraform infrastructure code for the serverless transaction reconciliation pipeline.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "lambda_runtime" {
  description = "Lambda function runtime"
  type        = string
  default     = "python3.9"
}

variable "lambda_memory_size" {
  description = "Lambda function memory allocation in MB"
  type        = number
  default     = 1024
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 30
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "reconciliation"
  }
}
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
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}
```

## File: lib/s3.tf

```hcl
resource "aws_s3_bucket" "reconciliation_data" {
  bucket = "reconciliation-data-${var.environment_suffix}"

  tags = {
    Name = "reconciliation-data-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "reconciliation_data" {
  bucket = aws_s3_bucket.reconciliation_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "reconciliation_data" {
  bucket = aws_s3_bucket.reconciliation_data.id

  rule {
    id     = "glacier-transition"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_notification" "reconciliation_trigger" {
  bucket = aws_s3_bucket.reconciliation_data.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.trigger_reconciliation.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".csv"
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}
```

## File: lib/dynamodb.tf

```hcl
resource "aws_dynamodb_table" "transaction_records" {
  name         = "transaction-records-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "transaction-records-${var.environment_suffix}"
  }
}

resource "aws_dynamodb_table" "reconciliation_results" {
  name         = "reconciliation-results-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "reconciliation_id"
  range_key    = "timestamp"

  attribute {
    name = "reconciliation_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "reconciliation-results-${var.environment_suffix}"
  }
}
```

## File: lib/sns.tf

```hcl
resource "aws_sns_topic" "reconciliation_notifications" {
  name = "reconciliation-notifications-${var.environment_suffix}"

  tags = {
    Name = "reconciliation-notifications-${var.environment_suffix}"
  }
}

resource "aws_sns_topic_subscription" "reconciliation_email" {
  topic_arn = aws_sns_topic.reconciliation_notifications.arn
  protocol  = "email"
  endpoint  = "finance-team@example.com"
}
```

## File: lib/iam.tf

```hcl
# IAM Role for Trigger Lambda
resource "aws_iam_role" "trigger_lambda_role" {
  name = "trigger-lambda-role-${var.environment_suffix}"

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
    Name = "trigger-lambda-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "trigger_lambda_policy" {
  name = "trigger-lambda-policy"
  role = aws_iam_role.trigger_lambda_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/trigger-reconciliation-*"
      },
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.reconciliation_workflow.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.reconciliation_data.arn}/*"
      }
    ]
  })
}

# IAM Role for Processing Lambdas
resource "aws_iam_role" "processing_lambda_role" {
  name = "processing-lambda-role-${var.environment_suffix}"

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
    Name = "processing-lambda-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "processing_lambda_policy" {
  name = "processing-lambda-policy"
  role = aws_iam_role.processing_lambda_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/*-${var.environment_suffix}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.reconciliation_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.transaction_records.arn,
          aws_dynamodb_table.reconciliation_results.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.reconciliation_notifications.arn
      }
    ]
  })
}

# IAM Role for Step Functions
resource "aws_iam_role" "step_functions_role" {
  name = "step-functions-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "step-functions-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "step_functions_policy" {
  name = "step-functions-policy"
  role = aws_iam_role.step_functions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.file_parser.arn,
          aws_lambda_function.transaction_validator.arn,
          aws_lambda_function.report_generator.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.reconciliation_notifications.arn
      }
    ]
  })
}
```

## File: lib/lambda.tf

```hcl
# Package Lambda functions
data "archive_file" "trigger_reconciliation_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/trigger_reconciliation.py"
  output_path = "${path.module}/lambda/trigger_reconciliation.zip"
}

data "archive_file" "file_parser_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/file_parser.py"
  output_path = "${path.module}/lambda/file_parser.zip"
}

data "archive_file" "transaction_validator_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/transaction_validator.py"
  output_path = "${path.module}/lambda/transaction_validator.zip"
}

data "archive_file" "report_generator_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/report_generator.py"
  output_path = "${path.module}/lambda/report_generator.zip"
}

# Trigger Lambda Function
resource "aws_lambda_function" "trigger_reconciliation" {
  filename         = data.archive_file.trigger_reconciliation_zip.output_path
  function_name    = "trigger-reconciliation-${var.environment_suffix}"
  role            = aws_iam_role.trigger_lambda_role.arn
  handler         = "trigger_reconciliation.lambda_handler"
  source_code_hash = data.archive_file.trigger_reconciliation_zip.output_base64sha256
  runtime         = var.lambda_runtime
  memory_size     = var.lambda_memory_size
  timeout         = 300

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.reconciliation_workflow.arn
    }
  }

  tags = {
    Name = "trigger-reconciliation-${var.environment_suffix}"
  }
}

resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.trigger_reconciliation.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.reconciliation_data.arn
}

# File Parser Lambda Function
resource "aws_lambda_function" "file_parser" {
  filename         = data.archive_file.file_parser_zip.output_path
  function_name    = "file-parser-${var.environment_suffix}"
  role            = aws_iam_role.processing_lambda_role.arn
  handler         = "file_parser.lambda_handler"
  source_code_hash = data.archive_file.file_parser_zip.output_base64sha256
  runtime         = var.lambda_runtime
  memory_size     = var.lambda_memory_size
  timeout         = 300

  environment {
    variables = {
      TRANSACTION_TABLE = aws_dynamodb_table.transaction_records.name
    }
  }

  tags = {
    Name = "file-parser-${var.environment_suffix}"
  }
}

# Transaction Validator Lambda Function
resource "aws_lambda_function" "transaction_validator" {
  filename         = data.archive_file.transaction_validator_zip.output_path
  function_name    = "transaction-validator-${var.environment_suffix}"
  role            = aws_iam_role.processing_lambda_role.arn
  handler         = "transaction_validator.lambda_handler"
  source_code_hash = data.archive_file.transaction_validator_zip.output_base64sha256
  runtime         = var.lambda_runtime
  memory_size     = var.lambda_memory_size
  timeout         = 300

  environment {
    variables = {
      TRANSACTION_TABLE = aws_dynamodb_table.transaction_records.name
      RESULTS_TABLE     = aws_dynamodb_table.reconciliation_results.name
    }
  }

  tags = {
    Name = "transaction-validator-${var.environment_suffix}"
  }
}

# Report Generator Lambda Function
resource "aws_lambda_function" "report_generator" {
  filename         = data.archive_file.report_generator_zip.output_path
  function_name    = "report-generator-${var.environment_suffix}"
  role            = aws_iam_role.processing_lambda_role.arn
  handler         = "report_generator.lambda_handler"
  source_code_hash = data.archive_file.report_generator_zip.output_base64sha256
  runtime         = var.lambda_runtime
  memory_size     = var.lambda_memory_size
  timeout         = 300

  environment {
    variables = {
      RESULTS_TABLE = aws_dynamodb_table.reconciliation_results.name
      SNS_TOPIC_ARN = aws_sns_topic.reconciliation_notifications.arn
    }
  }

  tags = {
    Name = "report-generator-${var.environment_suffix}"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "trigger_reconciliation" {
  name              = "/aws/lambda/trigger-reconciliation-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "trigger-reconciliation-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "file_parser" {
  name              = "/aws/lambda/file-parser-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "file-parser-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "transaction_validator" {
  name              = "/aws/lambda/transaction-validator-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "transaction-validator-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "report_generator" {
  name              = "/aws/lambda/report-generator-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "report-generator-logs-${var.environment_suffix}"
  }
}
```

## File: lib/step_functions.tf

```hcl
resource "aws_sfn_state_machine" "reconciliation_workflow" {
  name     = "reconciliation-workflow-${var.environment_suffix}"
  role_arn = aws_iam_role.step_functions_role.arn

  definition = jsonencode({
    Comment = "Transaction Reconciliation Workflow"
    StartAt = "ParseFile"
    States = {
      ParseFile = {
        Type     = "Task"
        Resource = aws_lambda_function.file_parser.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed", "States.Timeout", "Lambda.ServiceException", "Lambda.TooManyRequestsException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
            ResultPath  = "$.error"
          }
        ]
        Next = "ValidateTransactions"
      }
      ValidateTransactions = {
        Type     = "Task"
        Resource = aws_lambda_function.transaction_validator.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed", "States.Timeout", "Lambda.ServiceException", "Lambda.TooManyRequestsException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
            ResultPath  = "$.error"
          }
        ]
        Next = "GenerateReport"
      }
      GenerateReport = {
        Type     = "Task"
        Resource = aws_lambda_function.report_generator.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed", "States.Timeout", "Lambda.ServiceException", "Lambda.TooManyRequestsException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
            ResultPath  = "$.error"
          }
        ]
        Next = "NotifySuccess"
      }
      NotifySuccess = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.reconciliation_notifications.arn
          Message = {
            "status" : "SUCCESS",
            "message" : "Transaction reconciliation completed successfully",
            "input.$" : "$"
          }
        }
        End = true
      }
      NotifyFailure = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.reconciliation_notifications.arn
          Message = {
            "status" : "FAILURE",
            "message" : "Transaction reconciliation failed",
            "error.$" : "$.error"
          }
        }
        End = true
      }
    }
  })

  tags = {
    Name = "reconciliation-workflow-${var.environment_suffix}"
  }
}
```

## File: lib/cloudwatch.tf

```hcl
resource "aws_cloudwatch_dashboard" "reconciliation_dashboard" {
  dashboard_name = "reconciliation-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/States", "ExecutionTime", { stat = "Average", label = "Avg Execution Time" }],
            [".", ".", { stat = "Maximum", label = "Max Execution Time" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Step Functions Execution Time"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/States", "ExecutionsFailed", { stat = "Sum", label = "Failed Executions" }],
            [".", "ExecutionsSucceeded", { stat = "Sum", label = "Successful Executions" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Step Functions Execution Status"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", label = "File Parser Duration" }, { functionName = aws_lambda_function.file_parser.function_name }],
            ["...", { functionName = aws_lambda_function.transaction_validator.function_name, label = "Validator Duration" }],
            ["...", { functionName = aws_lambda_function.report_generator.function_name, label = "Report Gen Duration" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Function Duration"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Sum", label = "File Parser Errors" }, { functionName = aws_lambda_function.file_parser.function_name }],
            ["...", { functionName = aws_lambda_function.transaction_validator.function_name, label = "Validator Errors" }],
            ["...", { functionName = aws_lambda_function.report_generator.function_name, label = "Report Gen Errors" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Function Errors"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.transaction_records.name }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.transaction_records.name }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Capacity Units - Transaction Records"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.reconciliation_results.name }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.reconciliation_results.name }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Capacity Units - Reconciliation Results"
        }
      }
    ]
  })
}
```

## File: lib/outputs.tf

```hcl
output "s3_bucket_name" {
  description = "Name of the S3 bucket for reconciliation data"
  value       = aws_s3_bucket.reconciliation_data.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.reconciliation_data.arn
}

output "state_machine_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.reconciliation_workflow.arn
}

output "state_machine_name" {
  description = "Name of the Step Functions state machine"
  value       = aws_sfn_state_machine.reconciliation_workflow.name
}

output "transaction_table_name" {
  description = "Name of the DynamoDB transaction records table"
  value       = aws_dynamodb_table.transaction_records.name
}

output "results_table_name" {
  description = "Name of the DynamoDB reconciliation results table"
  value       = aws_dynamodb_table.reconciliation_results.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS notification topic"
  value       = aws_sns_topic.reconciliation_notifications.arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.reconciliation_dashboard.dashboard_name
}

output "file_parser_function_name" {
  description = "Name of the file parser Lambda function"
  value       = aws_lambda_function.file_parser.function_name
}

output "transaction_validator_function_name" {
  description = "Name of the transaction validator Lambda function"
  value       = aws_lambda_function.transaction_validator.function_name
}

output "report_generator_function_name" {
  description = "Name of the report generator Lambda function"
  value       = aws_lambda_function.report_generator.function_name
}
```

## File: lib/lambda/trigger_reconciliation.py

```python
import json
import boto3
import os
from urllib.parse import unquote_plus

stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    """
    Triggered by S3 event when CSV file is uploaded.
    Starts Step Functions execution with file details.
    """
    try:
        # Extract S3 event details
        s3_event = event['Records'][0]['s3']
        bucket_name = s3_event['bucket']['name']
        object_key = unquote_plus(s3_event['object']['key'])
        
        # Prepare input for Step Functions
        execution_input = {
            'bucket': bucket_name,
            'key': object_key,
            'timestamp': event['Records'][0]['eventTime']
        }
        
        # Start Step Functions execution
        state_machine_arn = os.environ['STATE_MACHINE_ARN']
        response = stepfunctions.start_execution(
            stateMachineArn=state_machine_arn,
            input=json.dumps(execution_input)
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Reconciliation workflow started',
                'executionArn': response['executionArn']
            })
        }
        
    except Exception as e:
        print(f"Error starting workflow: {str(e)}")
        raise
```

## File: lib/lambda/file_parser.py

```python
import json
import boto3
import csv
from io import StringIO

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Parses CSV file from S3 and stores transactions in DynamoDB.
    Returns parsed transaction count and reconciliation ID.
    """
    try:
        bucket = event['bucket']
        key = event['key']
        
        # Download CSV file from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(StringIO(csv_content))
        transactions = list(csv_reader)
        
        # Store in DynamoDB
        table_name = boto3.client('lambda').get_function_configuration(
            FunctionName=context.function_name
        )['Environment']['Variables']['TRANSACTION_TABLE']
        
        table = dynamodb.Table(table_name)
        
        reconciliation_id = f"{bucket}/{key}"
        transaction_count = 0
        
        with table.batch_writer() as batch:
            for transaction in transactions:
                transaction_id = transaction.get('transaction_id', '')
                if transaction_id:
                    batch.put_item(Item={
                        'transaction_id': transaction_id,
                        'reconciliation_id': reconciliation_id,
                        'amount': transaction.get('amount', '0'),
                        'provider': transaction.get('provider', ''),
                        'timestamp': transaction.get('timestamp', ''),
                        'status': 'pending'
                    })
                    transaction_count += 1
        
        return {
            'statusCode': 200,
            'reconciliation_id': reconciliation_id,
            'transaction_count': transaction_count,
            'bucket': bucket,
            'key': key
        }
        
    except Exception as e:
        print(f"Error parsing file: {str(e)}")
        raise
```

## File: lib/lambda/transaction_validator.py

```python
import json
import boto3
import time
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Validates transactions against business rules.
    Stores validation results in DynamoDB.
    """
    try:
        reconciliation_id = event['reconciliation_id']
        transaction_count = event['transaction_count']
        
        # Get table names from environment
        transaction_table_name = boto3.client('lambda').get_function_configuration(
            FunctionName=context.function_name
        )['Environment']['Variables']['TRANSACTION_TABLE']
        
        results_table_name = boto3.client('lambda').get_function_configuration(
            FunctionName=context.function_name
        )['Environment']['Variables']['RESULTS_TABLE']
        
        transaction_table = dynamodb.Table(transaction_table_name)
        results_table = dynamodb.Table(results_table_name)
        
        # Query transactions for this reconciliation
        response = transaction_table.scan(
            FilterExpression='reconciliation_id = :rid',
            ExpressionAttributeValues={':rid': reconciliation_id}
        )
        
        transactions = response['Items']
        
        # Validate transactions
        valid_count = 0
        invalid_count = 0
        discrepancies = []
        
        for transaction in transactions:
            is_valid = validate_transaction(transaction)
            
            if is_valid:
                valid_count += 1
                transaction_table.update_item(
                    Key={'transaction_id': transaction['transaction_id']},
                    UpdateExpression='SET #status = :status',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':status': 'valid'}
                )
            else:
                invalid_count += 1
                discrepancies.append({
                    'transaction_id': transaction['transaction_id'],
                    'reason': 'Validation failed',
                    'amount': transaction.get('amount', '0')
                })
                transaction_table.update_item(
                    Key={'transaction_id': transaction['transaction_id']},
                    UpdateExpression='SET #status = :status',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':status': 'invalid'}
                )
        
        # Store validation results
        timestamp = int(time.time())
        results_table.put_item(Item={
            'reconciliation_id': reconciliation_id,
            'timestamp': timestamp,
            'total_transactions': transaction_count,
            'valid_transactions': valid_count,
            'invalid_transactions': invalid_count,
            'discrepancies': discrepancies,
            'status': 'validated'
        })
        
        return {
            'statusCode': 200,
            'reconciliation_id': reconciliation_id,
            'valid_count': valid_count,
            'invalid_count': invalid_count,
            'discrepancies': discrepancies
        }
        
    except Exception as e:
        print(f"Error validating transactions: {str(e)}")
        raise

def validate_transaction(transaction):
    """
    Business logic for transaction validation.
    Returns True if transaction is valid, False otherwise.
    """
    try:
        # Check if amount is present and valid
        amount = float(transaction.get('amount', 0))
        if amount <= 0:
            return False
        
        # Check if provider is present
        provider = transaction.get('provider', '')
        if not provider:
            return False
        
        # Check if timestamp is present
        timestamp = transaction.get('timestamp', '')
        if not timestamp:
            return False
        
        return True
        
    except (ValueError, TypeError):
        return False
```

## File: lib/lambda/report_generator.py

```python
import json
import boto3
import time

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """
    Generates reconciliation report and sends notification via SNS.
    """
    try:
        reconciliation_id = event['reconciliation_id']
        valid_count = event['valid_count']
        invalid_count = event['invalid_count']
        discrepancies = event.get('discrepancies', [])
        
        # Get results table name from environment
        results_table_name = boto3.client('lambda').get_function_configuration(
            FunctionName=context.function_name
        )['Environment']['Variables']['RESULTS_TABLE']
        
        results_table = dynamodb.Table(results_table_name)
        
        # Update results with report generation timestamp
        timestamp = int(time.time())
        results_table.update_item(
            Key={
                'reconciliation_id': reconciliation_id,
                'timestamp': timestamp
            },
            UpdateExpression='SET report_generated = :ts, #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':ts': timestamp,
                ':status': 'completed'
            }
        )
        
        # Generate report summary
        report = generate_report_summary(
            reconciliation_id, 
            valid_count, 
            invalid_count, 
            discrepancies
        )
        
        # Send notification via SNS
        sns_topic_arn = boto3.client('lambda').get_function_configuration(
            FunctionName=context.function_name
        )['Environment']['Variables']['SNS_TOPIC_ARN']
        
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='Transaction Reconciliation Report',
            Message=report
        )
        
        return {
            'statusCode': 200,
            'reconciliation_id': reconciliation_id,
            'report': report,
            'notification_sent': True
        }
        
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        raise

def generate_report_summary(reconciliation_id, valid_count, invalid_count, discrepancies):
    """
    Generates a formatted report summary.
    """
    total = valid_count + invalid_count
    success_rate = (valid_count / total * 100) if total > 0 else 0
    
    report = f"""
Transaction Reconciliation Report
==================================

Reconciliation ID: {reconciliation_id}
Completed: {time.strftime('%Y-%m-%d %H:%M:%S')}

Summary:
--------
Total Transactions: {total}
Valid Transactions: {valid_count}
Invalid Transactions: {invalid_count}
Success Rate: {success_rate:.2f}%

"""
    
    if discrepancies:
        report += "\nDiscrepancies Found:\n"
        report += "--------------------\n"
        for i, discrepancy in enumerate(discrepancies[:10], 1):
            report += f"{i}. Transaction ID: {discrepancy['transaction_id']}\n"
            report += f"   Reason: {discrepancy['reason']}\n"
            report += f"   Amount: {discrepancy['amount']}\n\n"
        
        if len(discrepancies) > 10:
            report += f"\n... and {len(discrepancies) - 10} more discrepancies.\n"
    else:
        report += "\nNo discrepancies found. All transactions validated successfully.\n"
    
    report += "\n" + "="*50 + "\n"
    
    return report
```
