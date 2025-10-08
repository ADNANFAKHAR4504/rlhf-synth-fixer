# Terraform Infrastructure for Expense Tracking Application

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "expense-tracker"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 120
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 1024
}

variable "max_receipt_size_mb" {
  description = "Maximum receipt file size in MB"
  type        = number
  default     = 10
}

variable "notification_email" {
  description = "Email address for completion notifications"
  type        = string
  default     = "admin@example.com"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy   = "Terraform"
    Application = "ExpenseTracking"
    CostCenter  = "Engineering"
  }
}
```

```hcl
# main.tf
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 Bucket for receipt uploads
resource "aws_s3_bucket" "receipts" {
  bucket = "${var.project_name}-receipts-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-receipts"
  })
}

resource "aws_s3_bucket_versioning" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  rule {
    id     = "transition-old-receipts"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER_INSTANT_RETRIEVAL"
    }

    noncurrent_version_expiration {
      noncurrent_days = 180
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

resource "aws_s3_bucket_notification" "receipt_upload" {
  bucket = aws_s3_bucket.receipts.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.process_trigger.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ""
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# DynamoDB table for expense records
resource "aws_dynamodb_table" "expenses" {
  name           = "${var.project_name}-expenses"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "expense_id"
  range_key      = "user_id"

  attribute {
    name = "expense_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "expense_date"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  global_secondary_index {
    name            = "user-date-index"
    hash_key        = "user_id"
    range_key       = "expense_date"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "category-date-index"
    hash_key        = "category"
    range_key       = "expense_date"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-expenses"
  })
}

# SNS Topic for notifications
resource "aws_sns_topic" "processing_notifications" {
  name = "${var.project_name}-processing-notifications"

  tags = merge(var.tags, {
    Name = "${var.project_name}-notifications"
  })
}

resource "aws_sns_topic_subscription" "email_notification" {
  topic_arn = aws_sns_topic.processing_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# SQS Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project_name}-processing-dlq"
  message_retention_seconds = 1209600  # 14 days

  tags = merge(var.tags, {
    Name = "${var.project_name}-dlq"
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-ocr-processor"
  retention_in_days = 14

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-logs"
  })
}

resource "aws_cloudwatch_log_group" "step_function_logs" {
  name              = "/aws/stepfunctions/${var.project_name}-processing"
  retention_in_days = 14

  tags = merge(var.tags, {
    Name = "${var.project_name}-stepfunction-logs"
  })
}

# CloudWatch Metrics and Alarms
resource "aws_cloudwatch_metric_alarm" "processing_errors" {
  alarm_name          = "${var.project_name}-processing-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors step function execution failures"
  alarm_actions       = [aws_sns_topic.processing_notifications.arn]

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.receipt_processing.arn
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda function errors"
  alarm_actions       = [aws_sns_topic.processing_notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.ocr_processor.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project_name}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "5"
  alarm_description   = "Alert when messages are in DLQ"
  alarm_actions       = [aws_sns_topic.processing_notifications.arn]

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }
}
```

```hcl
# iam.tf
# IAM Role for Lambda function
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

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

  tags = var.tags
}

# IAM Policy for Lambda function
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_role.id

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
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.receipts.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "textract:AnalyzeDocument",
          "textract:AnalyzeExpense",
          "textract:GetDocumentAnalysis"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "comprehend:DetectEntities",
          "comprehend:DetectKeyPhrases",
          "comprehend:ClassifyDocument"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.expenses.arn,
          "${aws_dynamodb_table.expenses.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.processing_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.receipt_processing.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# IAM Role for Step Functions
resource "aws_iam_role" "step_function_role" {
  name = "${var.project_name}-stepfunction-role"

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

  tags = var.tags
}

resource "aws_iam_role_policy" "step_function_policy" {
  name = "${var.project_name}-stepfunction-policy"
  role = aws_iam_role.step_function_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.ocr_processor.arn,
          aws_lambda_function.category_detector.arn,
          aws_lambda_function.expense_saver.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTelemetryRecords",
          "xray:PutTraceSegments"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.processing_notifications.arn
      }
    ]
  })
}
```

```hcl
# lambda.tf
# Lambda function for triggering Step Functions
resource "aws_lambda_function" "process_trigger" {
  filename         = "lambda_functions/process_trigger.zip"
  function_name    = "${var.project_name}-process-trigger"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda_functions/process_trigger.zip")
  runtime         = "python3.10"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.receipt_processing.arn
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-process-trigger"
  })
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_trigger.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.receipts.arn
}

# Lambda function for OCR processing
resource "aws_lambda_function" "ocr_processor" {
  filename         = "lambda_functions/ocr_processor.zip"
  function_name    = "${var.project_name}-ocr-processor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda_functions/ocr_processor.zip")
  runtime         = "python3.10"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory
  reserved_concurrent_executions = 10

  environment {
    variables = {
      RECEIPTS_BUCKET = aws_s3_bucket.receipts.id
      DLQ_URL         = aws_sqs_queue.dlq.url
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-ocr-processor"
  })
}

# Lambda function for category detection
resource "aws_lambda_function" "category_detector" {
  filename         = "lambda_functions/category_detector.zip"
  function_name    = "${var.project_name}-category-detector"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda_functions/category_detector.zip")
  runtime         = "python3.10"
  timeout         = 60
  memory_size     = 512
  reserved_concurrent_executions = 10

  environment {
    variables = {
      DLQ_URL = aws_sqs_queue.dlq.url
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-category-detector"
  })
}

# Lambda function for saving expense records
resource "aws_lambda_function" "expense_saver" {
  filename         = "lambda_functions/expense_saver.zip"
  function_name    = "${var.project_name}-expense-saver"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda_functions/expense_saver.zip")
  runtime         = "python3.10"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      EXPENSES_TABLE = aws_dynamodb_table.expenses.name
      DLQ_URL        = aws_sqs_queue.dlq.url
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-expense-saver"
  })
}
```

```hcl
# step_functions.tf
resource "aws_sfn_state_machine" "receipt_processing" {
  name     = "${var.project_name}-receipt-processing"
  role_arn = aws_iam_role.step_function_role.arn

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_function_logs.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  definition = jsonencode({
    Comment = "Receipt processing workflow with OCR and categorization"
    StartAt = "ParallelProcessing"
    States = {
      ParallelProcessing = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "ExtractTextWithOCR"
            States = {
              ExtractTextWithOCR = {
                Type = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.ocr_processor.arn
                  Payload = {
                    "Input.$" = "$"
                  }
                }
                Retry = [
                  {
                    ErrorEquals = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
                    IntervalSeconds = 2
                    MaxAttempts = 6
                    BackoffRate = 2
                  }
                ]
                Catch = [
                  {
                    ErrorEquals = ["States.ALL"]
                    Next = "OCRFailed"
                    ResultPath = "$.error"
                  }
                ]
                ResultPath = "$.ocrResult"
                End = true
              }
              OCRFailed = {
                Type = "Fail"
                Cause = "OCR processing failed after retries"
              }
            }
          },
          {
            StartAt = "DetectCategory"
            States = {
              DetectCategory = {
                Type = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.category_detector.arn
                  Payload = {
                    "Input.$" = "$"
                  }
                }
                Retry = [
                  {
                    ErrorEquals = ["Lambda.ServiceException", "Lambda.AWSLambdaException"]
                    IntervalSeconds = 2
                    MaxAttempts = 3
                    BackoffRate = 2
                  }
                ]
                Catch = [
                  {
                    ErrorEquals = ["States.ALL"]
                    Next = "CategoryDetectionFailed"
                    ResultPath = "$.error"
                  }
                ]
                ResultPath = "$.categoryResult"
                End = true
              }
              CategoryDetectionFailed = {
                Type = "Pass"
                Result = {
                  category = "Uncategorized"
                  confidence = 0
                }
                ResultPath = "$.categoryResult"
                End = true
              }
            }
          }
        ]
        Next = "CombineResults"
        ResultPath = "$.parallelResults"
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next = "ProcessingError"
            ResultPath = "$.error"
          }
        ]
      }
      CombineResults = {
        Type = "Pass"
        Parameters = {
          "receiptId.$" = "$.receiptId"
          "userId.$" = "$.userId"
          "ocrData.$" = "$.parallelResults[0].ocrResult.Payload"
          "categoryData.$" = "$.parallelResults[1].categoryResult.Payload"
        }
        Next = "SaveExpenseRecord"
      }
      SaveExpenseRecord = {
        Type = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.expense_saver.arn
          Payload = {
            "Input.$" = "$"
          }
        }
        Retry = [
          {
            ErrorEquals = ["Lambda.ServiceException", "Lambda.AWSLambdaException"]
            IntervalSeconds = 2
            MaxAttempts = 3
            BackoffRate = 2
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next = "ProcessingError"
            ResultPath = "$.error"
          }
        ]
        Next = "SendNotification"
        ResultPath = "$.saveResult"
      }
      SendNotification = {
        Type = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.processing_notifications.arn
          Message = {
            "receiptId.$" = "$.receiptId"
            "userId.$" = "$.userId"
            "status" = "completed"
            "message" = "Receipt processed successfully"
          }
        }
        End = true
      }
      ProcessingError = {
        Type = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.processing_notifications.arn
          Message = {
            "receiptId.$" = "$.receiptId"
            "status" = "failed"
            "error.$" = "$.error"
          }
        }
        Next = "FailState"
      }
      FailState = {
        Type = "Fail"
        Cause = "Receipt processing failed"
      }
    }
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-state-machine"
  })
}
```

```python
# lambda_functions/process_trigger.py
import json
import os
import boto3
from datetime import datetime

sfn_client = boto3.client('stepfunctions')
STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']

def handler(event, context):
    """Trigger Step Functions execution for new receipt uploads"""

    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        size = record['s3']['object']['size']

        # Extract user ID from key (assumes format: uploads/{user_id}/{filename})
        path_parts = key.split('/')
        user_id = path_parts[1] if len(path_parts) > 1 else 'unknown'

        # Prepare input for Step Functions
        sfn_input = {
            'receiptId': f"{user_id}-{datetime.utcnow().isoformat()}",
            'userId': user_id,
            'bucket': bucket,
            'key': key,
            'size': size,
            'uploadTime': datetime.utcnow().isoformat()
        }

        # Start Step Functions execution
        response = sfn_client.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            name=f"receipt-{user_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            input=json.dumps(sfn_input)
        )

        print(f"Started execution: {response['executionArn']}")

    return {
        'statusCode': 200,
        'body': json.dumps('Processing started')
    }
```

```python
# lambda_functions/ocr_processor.py
import json
import boto3
import os
from typing import Dict, Any

textract = boto3.client('textract')
s3_client = boto3.client('s3')
sqs = boto3.client('sqs')

DLQ_URL = os.environ['DLQ_URL']
RECEIPTS_BUCKET = os.environ['RECEIPTS_BUCKET']

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Process receipt image with Textract for OCR"""

    try:
        input_data = event.get('Input', event)
        bucket = input_data['bucket']
        key = input_data['key']

        # Use Textract AnalyzeExpense for receipt-specific extraction
        response = textract.analyze_expense(
            Document={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            }
        )

        # Extract expense data
        expense_documents = response.get('ExpenseDocuments', [])

        extracted_data = {
            'vendor': None,
            'total': None,
            'date': None,
            'items': [],
            'raw_text': []
        }

        for doc in expense_documents:
            for field in doc.get('SummaryFields', []):
                field_type = field.get('Type', {}).get('Text', '')
                value_text = field.get('ValueDetection', {}).get('Text', '')

                if field_type == 'VENDOR_NAME':
                    extracted_data['vendor'] = value_text
                elif field_type == 'TOTAL':
                    extracted_data['total'] = value_text
                elif field_type == 'INVOICE_RECEIPT_DATE':
                    extracted_data['date'] = value_text

            # Extract line items
            for line_item in doc.get('LineItemGroups', []):
                for item in line_item.get('LineItems', []):
                    item_data = {}
                    for field in item.get('LineItemExpenseFields', []):
                        field_type = field.get('Type', {}).get('Text', '')
                        value_text = field.get('ValueDetection', {}).get('Text', '')
                        item_data[field_type] = value_text
                    if item_data:
                        extracted_data['items'].append(item_data)

        # Get raw text for fallback processing
        text_response = textract.detect_document_text(
            Document={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            }
        )

        for block in text_response['Blocks']:
            if block['BlockType'] == 'LINE':
                extracted_data['raw_text'].append(block['Text'])

        return {
            'statusCode': 200,
            'extractedData': extracted_data,
            'receiptId': input_data['receiptId'],
            'userId': input_data['userId']
        }

    except Exception as e:
        error_message = {
            'error': str(e),
            'event': event
        }

        # Send to DLQ
        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(error_message)
        )

        raise e
```

```python
# lambda_functions/category_detector.py
import json
import boto3
import os
from typing import Dict, Any, List

comprehend = boto3.client('comprehend')
sqs = boto3.client('sqs')

DLQ_URL = os.environ['DLQ_URL']

# Predefined expense categories and keywords
EXPENSE_CATEGORIES = {
    'FOOD_DINING': ['restaurant', 'food', 'lunch', 'dinner', 'breakfast', 'coffee', 'cafe'],
    'TRANSPORTATION': ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'transit'],
    'OFFICE_SUPPLIES': ['staples', 'office', 'supplies', 'paper', 'printer', 'computer'],
    'TRAVEL': ['hotel', 'flight', 'airline', 'accommodation', 'booking'],
    'ENTERTAINMENT': ['movie', 'concert', 'event', 'tickets', 'entertainment'],
    'UTILITIES': ['electric', 'water', 'gas', 'internet', 'phone', 'utility'],
    'HEALTHCARE': ['pharmacy', 'doctor', 'medical', 'hospital', 'clinic'],
    'OTHER': []
}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Detect expense category using Comprehend"""

    try:
        input_data = event.get('Input', event)

        # Get text from either raw event or OCR result
        text_to_analyze = ""
        if 'ocrResult' in input_data and 'Payload' in input_data['ocrResult']:
            ocr_data = input_data['ocrResult']['Payload'].get('extractedData', {})
            vendor = ocr_data.get('vendor', '')
            raw_text = ' '.join(ocr_data.get('raw_text', []))
            text_to_analyze = f"{vendor} {raw_text}"
        else:
            text_to_analyze = str(input_data)

        # Use Comprehend for entity recognition
        entities_response = comprehend.detect_entities(
            Text=text_to_analyze[:5000],  # Comprehend has text length limit
            LanguageCode='en'
        )

        # Use Comprehend for key phrases
        key_phrases_response = comprehend.detect_key_phrases(
            Text=text_to_analyze[:5000],
            LanguageCode='en'
        )

        # Extract entities and key phrases
        entities = [e['Text'].lower() for e in entities_response.get('Entities', [])]
        key_phrases = [kp['Text'].lower() for kp in key_phrases_response.get('KeyPhrases', [])]

        # Combine for category detection
        all_terms = entities + key_phrases + text_to_analyze.lower().split()

        # Detect category based on keywords
        category_scores = {}
        for category, keywords in EXPENSE_CATEGORIES.items():
            score = sum(1 for term in all_terms if any(kw in term for kw in keywords))
            if score > 0:
                category_scores[category] = score

        # Get the category with highest score
        if category_scores:
            detected_category = max(category_scores, key=category_scores.get)
            confidence = min(category_scores[detected_category] / 10, 1.0)  # Normalize confidence
        else:
            detected_category = 'OTHER'
            confidence = 0.5

        # Use Comprehend's custom classification if available (latest feature)
        # This would require a trained custom classifier endpoint
        # Placeholder for custom classification integration

        return {
            'statusCode': 200,
            'category': detected_category,
            'confidence': confidence,
            'entities': entities[:10],  # Top 10 entities
            'keyPhrases': key_phrases[:10],  # Top 10 key phrases
            'receiptId': input_data.get('receiptId'),
            'userId': input_data.get('userId')
        }

    except Exception as e:
        error_message = {
            'error': str(e),
            'event': event
        }

        # Send to DLQ
        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(error_message)
        )

        raise e
```

```python
# lambda_functions/expense_saver.py
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any
import uuid

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

EXPENSES_TABLE = os.environ['EXPENSES_TABLE']
DLQ_URL = os.environ['DLQ_URL']

table = dynamodb.Table(EXPENSES_TABLE)

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Save processed expense record to DynamoDB"""

    try:
        # Extract data from combined results
        receipt_id = event.get('receiptId', str(uuid.uuid4()))
        user_id = event.get('userId', 'unknown')

        ocr_data = event.get('ocrData', {}).get('extractedData', {})
        category_data = event.get('categoryData', {})

        # Parse amount
        total_amount = ocr_data.get('total', '0')
        try:
            # Remove currency symbols and parse
            amount = Decimal(total_amount.replace('$', '').replace(',', ''))
        except:
            amount = Decimal('0')

        # Parse date
        expense_date = ocr_data.get('date', datetime.utcnow().isoformat())
        if not expense_date:
            expense_date = datetime.utcnow().isoformat()

        # Prepare item for DynamoDB
        expense_item = {
            'expense_id': receipt_id,
            'user_id': user_id,
            'expense_date': expense_date,
            'amount': amount,
            'vendor': ocr_data.get('vendor', 'Unknown'),
            'category': category_data.get('category', 'OTHER'),
            'category_confidence': Decimal(str(category_data.get('confidence', 0))),
            'items': json.dumps(ocr_data.get('items', [])),
            'entities': category_data.get('entities', []),
            'key_phrases': category_data.get('keyPhrases', []),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'processing_status': 'completed'
        }

        # Save to DynamoDB
        table.put_item(Item=expense_item)

        return {
            'statusCode': 200,
            'expenseId': receipt_id,
            'userId': user_id,
            'category': expense_item['category'],
            'amount': json.dumps(amount, default=decimal_default),
            'message': 'Expense record saved successfully'
        }

    except Exception as e:
        error_message = {
            'error': str(e),
            'event': event
        }

        # Send to DLQ
        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(error_message)
        )

        raise e
```

```hcl
# outputs.tf
output "s3_bucket_name" {
  description = "Name of the S3 bucket for receipt uploads"
  value       = aws_s3_bucket.receipts.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.receipts.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB expenses table"
  value       = aws_dynamodb_table.expenses.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB expenses table"
  value       = aws_dynamodb_table.expenses.arn
}

output "step_function_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.receipt_processing.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.processing_notifications.arn
}

output "dlq_url" {
  description = "URL of the Dead Letter Queue"
  value       = aws_sqs_queue.dlq.url
}

output "lambda_functions" {
  description = "Names of all Lambda functions"
  value = {
    trigger   = aws_lambda_function.process_trigger.function_name
    ocr       = aws_lambda_function.ocr_processor.function_name
    category  = aws_lambda_function.category_detector.function_name
    saver     = aws_lambda_function.expense_saver.function_name
  }
}

output "cloudwatch_alarms" {
  description = "Names of CloudWatch alarms"
  value = {
    processing_errors = aws_cloudwatch_metric_alarm.processing_errors.alarm_name
    lambda_errors     = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
    dlq_messages      = aws_cloudwatch_metric_alarm.dlq_messages.alarm_name
  }
}
```