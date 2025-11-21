### Reasoning Trace
---

This is a comprehensive request for building a payment processing workflow orchestration system using Terraform with HCL. Let me break down the requirements:

1. **Step Functions State Machine**: Orchestrates payment lifecycle with validation and processing steps, retry logic, and failure handling
2. **Lambda Functions**: Two functions - validation and processing - with Python 3.11 runtime
3. **DynamoDB Table**: For transaction state management with on-demand billing
4. **SNS Topic**: For failure notifications
5. **CloudWatch**: Monitoring with log groups and alarms
6. **IAM Roles and Policies**: Following least privilege principle
7. **KMS Encryption**: For all services
8. **Specific naming pattern**: {resource-type}-{purpose}-{environment}
9. **File structure**: provider.tf, main.tf, and two Python files for Lambda functions

Let me create the complete infrastructure:

## lib/provider.tf
- Terraform and provider configurations
- Variable definitions
- Data sources

## lib/main.tf
- All AWS resources (KMS, DynamoDB, SNS, CloudWatch, IAM, Lambda, Step Functions)
- Comprehensive outputs

## lib/lambda_validation.py
- Payment validation logic

## lib/lambda_processing.py
- Payment processing logic

I need to ensure:
- Proper dependencies with depends_on
- Exponential backoff in Step Functions
- All required outputs (minimum 30)
- Correct IAM permissions
- KMS encryption for all services
- CloudWatch alarms for monitoring
### Answer 
---

I'll help you create a comprehensive payment processing workflow orchestration system using Terraform with AWS Step Functions, Lambda, DynamoDB, and monitoring. This solution handles payment validation, processing, retries, and notifications.

## File Structure

### lib/provider.tf

```hcl
# Terraform and Provider Configuration
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

# AWS Provider Configuration
provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment      = var.environment
      Owner           = "PaymentTeam"
      CostCenter      = "Engineering"
      DataClassification = "Sensitive"
    }
  }
}

# Variables
variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "dev"
}

# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

### lib/main.tf

```hcl
# KMS Keys for Encryption
resource "aws_kms_key" "dynamodb_encryption" {
  description             = "KMS key for DynamoDB table encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow DynamoDB to use the key"
        Effect = "Allow"
        Principal = {
          Service = "dynamodb.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "dynamodb_encryption" {
  name          = "alias/dynamodb-transactions-${var.environment}"
  target_key_id = aws_kms_key.dynamodb_encryption.key_id
}

resource "aws_kms_key" "sns_encryption" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_kms_alias" "sns_encryption" {
  name          = "alias/sns-payment-notifications-${var.environment}"
  target_key_id = aws_kms_key.sns_encryption.key_id
}

resource "aws_kms_key" "cloudwatch_encryption" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "cloudwatch_encryption" {
  name          = "alias/cloudwatch-logs-${var.environment}"
  target_key_id = aws_kms_key.cloudwatch_encryption.key_id
}

# DynamoDB Table
resource "aws_dynamodb_table" "transactions" {
  name                   = "dynamodb-transactions-${var.environment}"
  billing_mode           = "PAY_PER_REQUEST"
  deletion_protection_enabled = false
  
  hash_key = "transaction_id"
  
  attribute {
    name = "transaction_id"
    type = "S"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_encryption.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
}

# SNS Topic
resource "aws_sns_topic" "payment_notifications" {
  name              = "sns-payment-notifications-${var.environment}"
  kms_master_key_id = aws_kms_key.sns_encryption.id
}

resource "aws_sns_topic_policy" "payment_notifications" {
  arn = aws_sns_topic.payment_notifications.arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowStepFunctionsPublish"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.step_functions_execution.arn
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.payment_notifications.arn
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "validation_lambda" {
  name              = "/aws/lambda/lambda-payment-validation-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
}

resource "aws_cloudwatch_log_group" "processing_lambda" {
  name              = "/aws/lambda/lambda-payment-processing-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/sfn-payment-workflow-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "step_functions_failures" {
  alarm_name          = "alarm-sfn-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = "300"
  statistic           = "Sum"
  threshold           = "2"
  alarm_description   = "Alert when Step Functions executions fail"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]
  
  dimensions = {
    StateMachineArn = aws_sfn_state_machine.payment_workflow.arn
  }
}

resource "aws_cloudwatch_metric_alarm" "validation_lambda_errors" {
  alarm_name          = "alarm-lambda-validation-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert when validation Lambda has errors"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.validation.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "validation_lambda_throttles" {
  alarm_name          = "alarm-lambda-validation-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alert when validation Lambda is throttled"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.validation.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_lambda_errors" {
  alarm_name          = "alarm-lambda-processing-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert when processing Lambda has errors"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.processing.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_lambda_throttles" {
  alarm_name          = "alarm-lambda-processing-throttles-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alert when processing Lambda is throttled"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.processing.function_name
  }
}

resource "aws_cloudwatch_log_metric_filter" "payment_duration" {
  name           = "metric-filter-payment-duration-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.step_functions.name
  pattern        = "[time, request_id, event_type, duration]"
  
  metric_transformation {
    name      = "PaymentProcessingDuration"
    namespace = "PaymentWorkflow"
    value     = "$duration"
  }
}

resource "aws_cloudwatch_metric_alarm" "payment_duration" {
  alarm_name          = "alarm-payment-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "PaymentProcessingDuration"
  namespace           = "PaymentWorkflow"
  period              = "300"
  statistic           = "Average"
  threshold           = "120"
  alarm_description   = "Alert when payment processing takes too long"
  alarm_actions       = [aws_sns_topic.payment_notifications.arn]
  treat_missing_data  = "notBreaching"
}

# IAM Roles and Policies
data "aws_iam_policy_document" "step_functions_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "step_functions_execution" {
  name               = "role-sfn-payment-workflow-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.step_functions_assume_role.json
}

data "aws_iam_policy_document" "step_functions_execution" {
  statement {
    sid    = "InvokeLambdaFunctions"
    effect = "Allow"
    actions = [
      "lambda:InvokeFunction"
    ]
    resources = [
      aws_lambda_function.validation.arn,
      aws_lambda_function.processing.arn
    ]
  }
  
  statement {
    sid    = "PublishToSNS"
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [
      aws_sns_topic.payment_notifications.arn
    ]
  }
  
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogDelivery",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutLogEvents",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
      "logs:DescribeLogGroups"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "step_functions_execution" {
  name   = "policy-sfn-payment-workflow-${var.environment}"
  role   = aws_iam_role.step_functions_execution.id
  policy = data.aws_iam_policy_document.step_functions_execution.json
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "validation_lambda" {
  name               = "role-lambda-validation-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role" "processing_lambda" {
  name               = "role-lambda-processing-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "validation_lambda" {
  statement {
    sid    = "DynamoDBAccess"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem"
    ]
    resources = [
      aws_dynamodb_table.transactions.arn
    ]
  }
  
  statement {
    sid    = "KMSDecrypt"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = [
      aws_kms_key.dynamodb_encryption.arn
    ]
  }
}

data "aws_iam_policy_document" "processing_lambda" {
  statement {
    sid    = "DynamoDBAccess"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem"
    ]
    resources = [
      aws_dynamodb_table.transactions.arn
    ]
  }
  
  statement {
    sid    = "KMSDecrypt"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = [
      aws_kms_key.dynamodb_encryption.arn
    ]
  }
  
  statement {
    sid    = "SNSPublish"
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [
      aws_sns_topic.payment_notifications.arn
    ]
  }
}

resource "aws_iam_role_policy" "validation_lambda" {
  name   = "policy-lambda-validation-${var.environment}"
  role   = aws_iam_role.validation_lambda.id
  policy = data.aws_iam_policy_document.validation_lambda.json
}

resource "aws_iam_role_policy" "processing_lambda" {
  name   = "policy-lambda-processing-${var.environment}"
  role   = aws_iam_role.processing_lambda.id
  policy = data.aws_iam_policy_document.processing_lambda.json
}

resource "aws_iam_role_policy_attachment" "validation_lambda_basic" {
  role       = aws_iam_role.validation_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "processing_lambda_basic" {
  role       = aws_iam_role.processing_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function Archives
data "archive_file" "validation_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda_validation.py"
  output_path = "${path.module}/validation_lambda.zip"
}

data "archive_file" "processing_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda_processing.py"
  output_path = "${path.module}/processing_lambda.zip"
}

# Lambda Functions
resource "aws_lambda_function" "validation" {
  filename         = data.archive_file.validation_lambda.output_path
  function_name    = "lambda-payment-validation-${var.environment}"
  role            = aws_iam_role.validation_lambda.arn
  handler         = "lambda_validation.lambda_handler"
  source_code_hash = data.archive_file.validation_lambda.output_base64sha256
  runtime         = "python3.11"
  memory_size     = 256
  timeout         = 300
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name
      SNS_TOPIC_ARN      = aws_sns_topic.payment_notifications.arn
    }
  }
  
  depends_on = [
    aws_iam_role.validation_lambda,
    aws_iam_role_policy_attachment.validation_lambda_basic,
    aws_iam_role_policy.validation_lambda,
    aws_cloudwatch_log_group.validation_lambda
  ]
}

resource "aws_lambda_function" "processing" {
  filename         = data.archive_file.processing_lambda.output_path
  function_name    = "lambda-payment-processing-${var.environment}"
  role            = aws_iam_role.processing_lambda.arn
  handler         = "lambda_processing.lambda_handler"
  source_code_hash = data.archive_file.processing_lambda.output_base64sha256
  runtime         = "python3.11"
  memory_size     = 256
  timeout         = 300
  
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name
      SNS_TOPIC_ARN      = aws_sns_topic.payment_notifications.arn
    }
  }
  
  depends_on = [
    aws_iam_role.processing_lambda,
    aws_iam_role_policy_attachment.processing_lambda_basic,
    aws_iam_role_policy.processing_lambda,
    aws_cloudwatch_log_group.processing_lambda
  ]
}

# Step Functions State Machine
resource "aws_sfn_state_machine" "payment_workflow" {
  name     = "sfn-payment-workflow-${var.environment}"
  role_arn = aws_iam_role.step_functions_execution.arn
  type     = "STANDARD"
  
  definition = jsonencode({
    Comment = "Payment Processing Workflow"
    StartAt = "ValidatePayment"
    States = {
      ValidatePayment = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.validation.arn
          Payload = {
            "transaction_id.$"   = "$.transaction_id"
            "payment_amount.$"    = "$.payment_amount"
            "payment_method.$"    = "$.payment_method"
            "customer_id.$"       = "$.customer_id"
          }
        }
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
          }
        ]
        Next = "ProcessPayment"
      }
      ProcessPayment = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.processing.arn
          Payload = {
            "transaction_id.$"   = "$.transaction_id"
            "payment_amount.$"    = "$.payment_amount"
            "payment_method.$"    = "$.payment_method"
            "customer_id.$"       = "$.customer_id"
            "validation_result.$" = "$.Payload"
          }
        }
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "NotifyFailure"
          }
        ]
        Next = "PaymentComplete"
      }
      PaymentComplete = {
        Type = "Pass"
        Result = {
          status = "SUCCESS"
          message = "Payment processed successfully"
        }
        End = true
      }
      NotifyFailure = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.payment_notifications.arn
          Message = {
            "error.$"          = "$.Error"
            "transaction_id.$" = "$.transaction_id"
            "timestamp.$"      = "$$.State.EnteredTime"
            "execution_arn.$"  = "$$.Execution.Id"
          }
        }
        End = true
      }
    }
  })
  
  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }
  
  depends_on = [
    aws_iam_role_policy.step_functions_execution
  ]
}

# Outputs
output "step_functions_state_machine_arn" {
  value = aws_sfn_state_machine.payment_workflow.arn
}

output "step_functions_state_machine_name" {
  value = aws_sfn_state_machine.payment_workflow.name
}

output "step_functions_state_machine_id" {
  value = aws_sfn_state_machine.payment_workflow.id
}

output "step_functions_role_arn" {
  value = aws_iam_role.step_functions_execution.arn
}

output "lambda_validation_function_name" {
  value = aws_lambda_function.validation.function_name
}

output "lambda_validation_function_arn" {
  value = aws_lambda_function.validation.arn
}

output "lambda_validation_invoke_arn" {
  value = aws_lambda_function.validation.invoke_arn
}

output "lambda_validation_role_arn" {
  value = aws_iam_role.validation_lambda.arn
}

output "lambda_processing_function_name" {
  value = aws_lambda_function.processing.function_name
}

output "lambda_processing_function_arn" {
  value = aws_lambda_function.processing.arn
}

output "lambda_processing_invoke_arn" {
  value = aws_lambda_function.processing.invoke_arn
}

output "lambda_processing_role_arn" {
  value = aws_iam_role.processing_lambda.arn
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.transactions.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.transactions.arn
}

output "dynamodb_table_id" {
  value = aws_dynamodb_table.transactions.id
}

output "sns_topic_arn" {
  value = aws_sns_topic.payment_notifications.arn
}

output "sns_topic_name" {
  value = aws_sns_topic.payment_notifications.name
}

output "cloudwatch_log_group_validation_name" {
  value = aws_cloudwatch_log_group.validation_lambda.name
}

output "cloudwatch_log_group_validation_arn" {
  value = aws_cloudwatch_log_group.validation_lambda.arn
}

output "cloudwatch_log_group_processing_name" {
  value = aws_cloudwatch_log_group.processing_lambda.name
}

output "cloudwatch_log_group_processing_arn" {
  value = aws_cloudwatch_log_group.processing_lambda.arn
}

output "cloudwatch_log_group_stepfunctions_name" {
  value = aws_cloudwatch_log_group.step_functions.name
}

output "cloudwatch_log_group_stepfunctions_arn" {
  value = aws_cloudwatch_log_group.step_functions.arn
}

output "cloudwatch_alarm_sfn_failures_name" {
  value = aws_cloudwatch_metric_alarm.step_functions_failures.alarm_name
}

output "cloudwatch_alarm_sfn_failures_arn" {
  value = aws_cloudwatch_metric_alarm.step_functions_failures.arn
}

output "cloudwatch_alarm_validation_errors_name" {
  value = aws_cloudwatch_metric_alarm.validation_lambda_errors.alarm_name
}

output "cloudwatch_alarm_validation_errors_arn" {
  value = aws_cloudwatch_metric_alarm.validation_lambda_errors.arn
}

output "cloudwatch_alarm_validation_throttles_name" {
  value = aws_cloudwatch_metric_alarm.validation_lambda_throttles.alarm_name
}

output "cloudwatch_alarm_validation_throttles_arn" {
  value = aws_cloudwatch_metric_alarm.validation_lambda_throttles.arn
}

output "cloudwatch_alarm_processing_errors_name" {
  value = aws_cloudwatch_metric_alarm.processing_lambda_errors.alarm_name
}

output "cloudwatch_alarm_processing_errors_arn" {
  value = aws_cloudwatch_metric_alarm.processing_lambda_errors.arn
}

output "cloudwatch_alarm_processing_throttles_name" {
  value = aws_cloudwatch_metric_alarm.processing_lambda_throttles.alarm_name
}

output "cloudwatch_alarm_processing_throttles_arn" {
  value = aws_cloudwatch_metric_alarm.processing_lambda_throttles.arn
}

output "cloudwatch_alarm_payment_duration_name" {
  value = aws_cloudwatch_metric_alarm.payment_duration.alarm_name
}

output "cloudwatch_alarm_payment_duration_arn" {
  value = aws_cloudwatch_metric_alarm.payment_duration.arn
}

output "kms_key_dynamodb_id" {
  value = aws_kms_key.dynamodb_encryption.id
}

output "kms_key_dynamodb_arn" {
  value = aws_kms_key.dynamodb_encryption.arn
}

output "kms_key_sns_id" {
  value = aws_kms_key.sns_encryption.id
}

output "kms_key_sns_arn" {
  value = aws_kms_key.sns_encryption.arn
}

output "kms_key_cloudwatch_id" {
  value = aws_kms_key.cloudwatch_encryption.id
}

output "kms_key_cloudwatch_arn" {
  value = aws_kms_key.cloudwatch_encryption.arn
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "region" {
  value = data.aws_region.current.name
}
```

### lib/lambda_validation.py

```python
import json
import os
import boto3
import time
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def lambda_handler(event, context):
    """
    Validates payment transactions and updates DynamoDB with validation results.
    
    Args:
        event: Contains transaction_id, payment_amount, payment_method, customer_id
        context: Lambda context object
    
    Returns:
        Validation result with status and details
    """
    
    # Extract transaction details
    transaction_id = event.get('transaction_id')
    payment_amount = event.get('payment_amount')
    payment_method = event.get('payment_method')
    customer_id = event.get('customer_id')
    
    # Initialize response
    response = {
        'transaction_id': transaction_id,
        'validation_status': None,
        'validation_timestamp': datetime.utcnow().isoformat(),
        'validation_details': {}
    }
    
    try:
        # Connect to DynamoDB table
        table = dynamodb.Table(TABLE_NAME)
        
        # Perform validation checks
        validation_errors = []
        
        # Validate transaction_id
        if not transaction_id:
            validation_errors.append('Missing transaction_id')
        
        # Validate payment amount
        if not payment_amount or float(payment_amount) <= 0:
            validation_errors.append('Invalid payment amount')
        elif float(payment_amount) > 10000:
            validation_errors.append('Payment amount exceeds limit')
        
        # Validate payment method
        valid_payment_methods = ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet']
        if payment_method not in valid_payment_methods:
            validation_errors.append(f'Invalid payment method: {payment_method}')
        
        # Validate customer_id
        if not customer_id:
            validation_errors.append('Missing customer_id')
        
        # Check for fraud indicators (simplified)
        fraud_score = 0
        if payment_amount and float(payment_amount) > 5000:
            fraud_score += 30
        
        # High-risk payment methods
        if payment_method == 'bank_transfer':
            fraud_score += 20
        
        # Add fraud check to validation
        if fraud_score > 50:
            validation_errors.append(f'High fraud risk score: {fraud_score}')
        
        # Determine validation status
        if validation_errors:
            response['validation_status'] = 'FAILED'
            response['validation_details']['errors'] = validation_errors
        else:
            response['validation_status'] = 'PASSED'
            response['validation_details']['fraud_score'] = fraud_score
        
        # Store validation results in DynamoDB
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'payment_amount': Decimal(str(payment_amount)),
                'payment_method': payment_method,
                'customer_id': customer_id,
                'validation_status': response['validation_status'],
                'validation_timestamp': response['validation_timestamp'],
                'validation_details': json.dumps(response['validation_details']),
                'processing_status': 'PENDING',
                'created_at': datetime.utcnow().isoformat()
            }
        )
        
        # If validation failed, notify via SNS
        if response['validation_status'] == 'FAILED':
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Payment Validation Failed',
                Message=json.dumps({
                    'transaction_id': transaction_id,
                    'validation_errors': validation_errors,
                    'timestamp': response['validation_timestamp']
                }, indent=2)
            )
            # Raise exception to trigger Step Functions error handling
            raise ValueError(f"Validation failed: {', '.join(validation_errors)}")
        
        return response
        
    except Exception as e:
        print(f"Error validating payment: {str(e)}")
        
        # Update DynamoDB with error status
        try:
            table = dynamodb.Table(TABLE_NAME)
            table.update_item(
                Key={'transaction_id': transaction_id},
                UpdateExpression='SET validation_status = :status, error_message = :error',
                ExpressionAttributeValues={
                    ':status': 'ERROR',
                    ':error': str(e)
                }
            )
        except:
            pass
        
        # Re-raise the exception for Step Functions to handle
        raise e
```

### lib/lambda_processing.py

```python
import json
import os
import boto3
import time
import random
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def lambda_handler(event, context):
    """
    Processes payment transactions and records the final transaction state.
    
    Args:
        event: Contains transaction details and validation results
        context: Lambda context object
    
    Returns:
        Processing result with final transaction state
    """
    
    # Extract transaction details
    transaction_id = event.get('transaction_id')
    payment_amount = event.get('payment_amount')
    payment_method = event.get('payment_method')
    customer_id = event.get('customer_id')
    validation_result = event.get('validation_result', {})
    
    # Initialize response
    response = {
        'transaction_id': transaction_id,
        'processing_status': None,
        'processing_timestamp': datetime.utcnow().isoformat(),
        'processing_details': {}
    }
    
    try:
        # Connect to DynamoDB table
        table = dynamodb.Table(TABLE_NAME)
        
        # Verify validation passed
        if validation_result.get('validation_status') != 'PASSED':
            raise ValueError('Cannot process payment without successful validation')
        
        # Simulate payment gateway communication
        gateway_response = process_payment_gateway(
            transaction_id=transaction_id,
            payment_amount=payment_amount,
            payment_method=payment_method,
            customer_id=customer_id
        )
        
        # Process gateway response
        if gateway_response['status'] == 'SUCCESS':
            response['processing_status'] = 'COMPLETED'
            response['processing_details'] = {
                'gateway_transaction_id': gateway_response['gateway_transaction_id'],
                'authorization_code': gateway_response['authorization_code'],
                'processing_time_ms': gateway_response['processing_time_ms']
            }
        else:
            response['processing_status'] = 'FAILED'
            response['processing_details'] = {
                'error_code': gateway_response.get('error_code'),
                'error_message': gateway_response.get('error_message'),
                'gateway_response': gateway_response
            }
        
        # Update DynamoDB with processing results
        table.update_item(
            Key={'transaction_id': transaction_id},
            UpdateExpression='''
                SET processing_status = :status,
                    processing_timestamp = :timestamp,
                    processing_details = :details,
                    final_status = :final,
                    updated_at = :updated
            ''',
            ExpressionAttributeValues={
                ':status': response['processing_status'],
                ':timestamp': response['processing_timestamp'],
                ':details': json.dumps(response['processing_details']),
                ':final': 'SUCCESS' if response['processing_status'] == 'COMPLETED' else 'FAILED',
                ':updated': datetime.utcnow().isoformat()
            }
        )
        
        # If processing failed, notify via SNS
        if response['processing_status'] == 'FAILED':
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Payment Processing Failed',
                Message=json.dumps({
                    'transaction_id': transaction_id,
                    'processing_error': response['processing_details'],
                    'timestamp': response['processing_timestamp']
                }, indent=2)
            )
            # Raise exception to trigger Step Functions error handling
            raise ValueError(f"Payment processing failed: {response['processing_details'].get('error_message')}")
        
        return response
        
    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        
        # Update DynamoDB with error status
        try:
            table = dynamodb.Table(TABLE_NAME)
            table.update_item(
                Key={'transaction_id': transaction_id},
                UpdateExpression='SET processing_status = :status, error_message = :error, final_status = :final',
                ExpressionAttributeValues={
                    ':status': 'ERROR',
                    ':error': str(e),
                    ':final': 'ERROR'
                }
            )
        except:
            pass
        
        # Send error notification
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Payment Processing Error',
                Message=json.dumps({
                    'transaction_id': transaction_id,
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                }, indent=2)
            )
        except:
            pass
        
        # Re-raise the exception for Step Functions to handle
        raise e


def process_payment_gateway(transaction_id, payment_amount, payment_method, customer_id):
    """
    Simulates payment gateway communication.
    In production, this would make actual API calls to payment providers.
    
    Args:
        transaction_id: Unique transaction identifier
        payment_amount: Amount to process
        payment_method: Payment method to use
        customer_id: Customer identifier
    
    Returns:
        Gateway response with status and details
    """
    
    # Simulate processing time
    processing_start = time.time()
    time.sleep(random.uniform(0.5, 2.0))  # Simulate API latency
    
    # Simulate different response scenarios
    random_value = random.random()
    
    if random_value < 0.85:  # 85% success rate
        return {
            'status': 'SUCCESS',
            'gateway_transaction_id': f'GTW-{transaction_id}-{int(time.time())}',
            'authorization_code': f'AUTH-{random.randint(100000, 999999)}',
            'processing_time_ms': int((time.time() - processing_start) * 1000)
        }
    elif random_value < 0.95:  # 10% insufficient funds
        return {
            'status': 'FAILED',
            'error_code': 'INSUFFICIENT_FUNDS',
            'error_message': 'Transaction declined due to insufficient funds',
            'processing_time_ms': int((time.time() - processing_start) * 1000)
        }
    else:  # 5% gateway errors
        return {
            'status': 'FAILED',
            'error_code': 'GATEWAY_ERROR',
            'error_message': 'Payment gateway temporarily unavailable',
            'processing_time_ms': int((time.time() - processing_start) * 1000)
        }
```

## Key Architecture Features

### 1. **Workflow Orchestration**
- Step Functions state machine manages the complete payment lifecycle
- Sequential validation → processing flow with proper error handling
- Exponential backoff retry logic (2s initial, 3 attempts, 2x backoff rate)
- Automatic SNS notifications on failures

### 2. **Lambda Functions**
- **Validation Lambda**: Checks payment details, fraud scoring, updates DynamoDB
- **Processing Lambda**: Executes payment transactions, simulates gateway communication
- Both configured with 256MB memory and 300s timeout for gateway delays

### 3. **Data Persistence**
- DynamoDB table with on-demand billing for unpredictable traffic
- Transaction state tracking through entire lifecycle
- Point-in-time recovery enabled for financial data protection
- KMS encryption for data at rest

### 4. **Monitoring & Alerting**
- CloudWatch alarms for Step Functions failures, Lambda errors, and throttles
- Custom metric filter tracking payment processing duration
- SNS topic for operational alerts
- All log groups with KMS encryption

### 5. **Security**
- Least-privilege IAM roles for each component
- KMS encryption for DynamoDB, SNS, and CloudWatch Logs
- No VPC configuration needed (using public AWS endpoints)
- Sensitive data classification tags

## Usage Example

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var="environment=dev"

# Apply the configuration
terraform apply -var="environment=dev" -auto-approve

# Test the workflow with sample payload
aws stepfunctions start-execution \
  --state-machine-arn "arn:aws:states:us-east-1:ACCOUNT:stateMachine:sfn-payment-workflow-dev" \
  --input '{"transaction_id":"TXN-001","payment_amount":100.50,"payment_method":"credit_card","customer_id":"CUST-123"}'

# Clean up resources
terraform destroy -var="environment=dev" -auto-approve
```

This solution provides a robust, scalable payment processing workflow with comprehensive error handling, monitoring, and security features suitable for a fintech startup handling 2,000 daily transactions.