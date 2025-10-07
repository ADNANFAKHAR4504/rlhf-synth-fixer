# provider.tf

```terraform
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
```

# tap_stack.tf

```terraform
# Variables
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., pr123, dev)"
  type        = string
  default     = "dev"
}

# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_kms_key" "media_encryption" {
  description             = "KMS key for media pipeline encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_kms_alias" "media_encryption" {
  name          = "alias/media-pipeline-encryption-${var.environment_suffix}"
  target_key_id = aws_kms_key.media_encryption.key_id
}

resource "aws_s3_bucket" "input_bucket" {
  bucket_prefix = "media-input-${var.environment_suffix}-"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "input_bucket_block" {
  bucket                  = aws_s3_bucket.input_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "input_bucket_encryption" {
  bucket = aws_s3_bucket.input_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "input_bucket_versioning" {
  bucket = aws_s3_bucket.input_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "output_bucket" {
  bucket_prefix = "media-output-${var.environment_suffix}-"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "output_bucket_block" {
  bucket                  = aws_s3_bucket.output_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "output_bucket_encryption" {
  bucket = aws_s3_bucket.output_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "output_bucket_versioning" {
  bucket = aws_s3_bucket.output_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "media_assets" {
  name         = "MediaAssets-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "AssetId"
  attribute {
    name = "AssetId"
    type = "S"
  }
  attribute {
    name = "Status"
    type = "S"
  }
  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "Status"
    projection_type = "ALL"
  }
  point_in_time_recovery {
    enabled = true
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.media_encryption.arn
  }
}

resource "aws_sqs_queue" "processing_dlq" {
  name                      = "media-processing-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.media_encryption.id
}

resource "aws_sqs_queue" "processing_queue" {
  name                       = "media-processing-queue-${var.environment_suffix}"
  visibility_timeout_seconds = 900
  message_retention_seconds  = 86400
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.processing_dlq.arn
    maxReceiveCount     = 5
  })
  kms_master_key_id = aws_kms_key.media_encryption.id
}

resource "aws_sqs_queue" "status_update_dlq" {
  name                      = "media-status-update-dlq-${var.environment_suffix}"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.media_encryption.id
}

resource "aws_sqs_queue" "status_update_queue" {
  name                       = "media-status-update-queue-${var.environment_suffix}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.status_update_dlq.arn
    maxReceiveCount     = 5
  })
  kms_master_key_id = aws_kms_key.media_encryption.id
}

resource "aws_iam_role" "mediaconvert_role" {
  name = "MediaConvertRole-${var.environment_suffix}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "mediaconvert.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "mediaconvert_s3_access" {
  name = "MediaConvertS3Access-${var.environment_suffix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.input_bucket.arn,
          "${aws_s3_bucket.input_bucket.arn}/*"
        ]
      },
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.output_bucket.arn,
          "${aws_s3_bucket.output_bucket.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "mediaconvert_s3_attachment" {
  role       = aws_iam_role.mediaconvert_role.name
  policy_arn = aws_iam_policy.mediaconvert_s3_access.arn
}

resource "aws_iam_role" "media_processor_role" {
  name = "MediaProcessorLambdaRole-${var.environment_suffix}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "lambda_s3_access" {
  name = "MediaProcessorS3Access-${var.environment_suffix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.input_bucket.arn,
          "${aws_s3_bucket.input_bucket.arn}/*"
        ]
      },
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.output_bucket.arn,
          "${aws_s3_bucket.output_bucket.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_mediaconvert_access" {
  name = "MediaProcessorMediaConvertAccess-${var.environment_suffix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "mediaconvert:CreateJob",
        "mediaconvert:GetJob",
        "mediaconvert:ListJobs",
        "mediaconvert:DescribeEndpoints",
        "mediaconvert:GetPreset",
        "mediaconvert:GetJobTemplate"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

resource "aws_iam_policy" "lambda_iam_passrole" {
  name = "MediaProcessorPassRole-${var.environment_suffix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = "iam:PassRole"
      Effect   = "Allow"
      Resource = aws_iam_role.mediaconvert_role.arn
    }]
  })
}

resource "aws_iam_policy" "lambda_dynamodb_access" {
  name = "MediaProcessorDynamoDBAccess-${var.environment_suffix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ]
      Effect = "Allow"
      Resource = [
        aws_dynamodb_table.media_assets.arn,
        "${aws_dynamodb_table.media_assets.arn}/index/*"
      ]
    }]
  })
}

resource "aws_iam_policy" "lambda_sqs_access" {
  name = "MediaProcessorSQSAccess-${var.environment_suffix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Effect = "Allow"
        Resource = [
          aws_sqs_queue.processing_queue.arn,
          aws_sqs_queue.status_update_queue.arn
        ]
      },
      {
        Action   = "sqs:SendMessage"
        Effect   = "Allow"
        Resource = [
          aws_sqs_queue.processing_queue.arn,
          aws_sqs_queue.status_update_queue.arn,
          aws_sqs_queue.processing_dlq.arn,
          aws_sqs_queue.status_update_dlq.arn
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_kms_access" {
  name = "MediaProcessorKMSAccess-${var.environment_suffix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ]
      Effect   = "Allow"
      Resource = aws_kms_key.media_encryption.arn
    }]
  })
}

resource "aws_iam_policy" "lambda_logs_access" {
  name = "MediaProcessorLogsAccess-${var.environment_suffix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Effect   = "Allow"
      Resource = "arn:aws:logs:${var.aws_region}:*:*"
    }]
  })
}

resource "aws_iam_policy" "lambda_xray_access" {
  name = "MediaProcessorXRayAccess-${var.environment_suffix}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_mediaconvert_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_mediaconvert_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_passrole_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_iam_passrole.arn
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sqs_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_sqs_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_kms_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_kms_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_logs_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_logs_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_xray_attachment" {
  role       = aws_iam_role.media_processor_role.name
  policy_arn = aws_iam_policy.lambda_xray_access.arn
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/function.zip"
  source {
    content  = file("${path.module}/lambda_function.py")
    filename = "index.py"
  }
}

resource "aws_lambda_function" "media_processor" {
  function_name                  = "MediaProcessor-${var.environment_suffix}"
  role                           = aws_iam_role.media_processor_role.arn
  handler                        = "index.handler"
  runtime                        = "python3.11"
  timeout                        = 300
  memory_size                    = 1024
  filename                       = data.archive_file.lambda_zip.output_path
  source_code_hash               = data.archive_file.lambda_zip.output_base64sha256
  reserved_concurrent_executions = 100
  environment {
    variables = {
      INPUT_BUCKET       = aws_s3_bucket.input_bucket.id
      OUTPUT_BUCKET      = aws_s3_bucket.output_bucket.id
      ASSETS_TABLE       = aws_dynamodb_table.media_assets.name
      MEDIACONVERT_ROLE  = aws_iam_role.mediaconvert_role.arn
      AWS_REGION_CUSTOM  = var.aws_region
    }
  }
  tracing_config {
    mode = "Active"
  }
  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs_attachment,
    aws_cloudwatch_log_group.lambda_log_group
  ]
}

resource "aws_lambda_event_source_mapping" "processing_queue_mapping" {
  event_source_arn = aws_sqs_queue.processing_queue.arn
  function_name    = aws_lambda_function.media_processor.arn
  batch_size       = 10
}

resource "aws_lambda_event_source_mapping" "status_update_queue_mapping" {
  event_source_arn = aws_sqs_queue.status_update_queue.arn
  function_name    = aws_lambda_function.media_processor.arn
  batch_size       = 10
}

resource "aws_sqs_queue_policy" "processing_queue_policy" {
  queue_url = aws_sqs_queue.processing_queue.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowS3ToSendMessages"
      Effect    = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.processing_queue.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_s3_bucket.input_bucket.arn
        }
      }
    }]
  })
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.input_bucket.id
  queue {
    queue_arn = aws_sqs_queue.processing_queue.arn
    events    = ["s3:ObjectCreated:*"]
  }
  depends_on = [aws_sqs_queue_policy.processing_queue_policy]
}

resource "aws_cloudwatch_event_rule" "mediaconvert_status_change" {
  name = "media-convert-status-${var.environment_suffix}"
  event_pattern = jsonencode({
    source      = ["aws.mediaconvert"]
    detail-type = ["MediaConvert Job State Change"]
  })
}

resource "aws_cloudwatch_event_target" "mediaconvert_status_target" {
  rule      = aws_cloudwatch_event_rule.mediaconvert_status_change.name
  target_id = "SendToSQS"
  arn       = aws_sqs_queue.status_update_queue.arn
}

resource "aws_sqs_queue_policy" "status_queue_policy" {
  queue_url = aws_sqs_queue.status_update_queue.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowEventBridgeToSendMessages"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.status_update_queue.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_cloudwatch_event_rule.mediaconvert_status_change.arn
        }
      }
    }]
  })
}

resource "aws_cloudwatch_metric_alarm" "processing_queue_depth" {
  alarm_name          = "media-processing-queue-depth-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Alert when processing queue depth exceeds threshold"
  dimensions = {
    QueueName = aws_sqs_queue.processing_queue.name
  }
}

resource "aws_cloudwatch_metric_alarm" "processing_dlq_not_empty" {
  alarm_name          = "media-processing-dlq-not-empty-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Alert when messages appear in processing DLQ"
  dimensions = {
    QueueName = aws_sqs_queue.processing_dlq.name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "media-processor-lambda-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda function errors exceed threshold"
  dimensions = {
    FunctionName = aws_lambda_function.media_processor.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "media-processor-lambda-throttles-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda function throttles exceed threshold"
  dimensions = {
    FunctionName = aws_lambda_function.media_processor.function_name
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.media_processor.function_name}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.media_encryption.arn
}

resource "aws_cloudwatch_dashboard" "media_pipeline_dashboard" {
  dashboard_name = "MediaPipeline-${var.environment_suffix}"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.processing_queue.name],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.status_update_queue.name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Queue Depth"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.processing_dlq.name],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.status_update_dlq.name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Dead Letter Queue Depth"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.media_processor.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.media_processor.function_name],
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.media_processor.function_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.media_processor.function_name, { "stat" : "Average" }],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.media_processor.function_name, { "stat" : "Maximum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Duration"
          period  = 300
        }
      }
    ]
  })
}

# Outputs
output "input_bucket_name" {
  description = "Name of the S3 input bucket"
  value       = aws_s3_bucket.input_bucket.id
}

output "output_bucket_name" {
  description = "Name of the S3 output bucket"
  value       = aws_s3_bucket.output_bucket.id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB assets table"
  value       = aws_dynamodb_table.media_assets.name
}

output "processing_queue_url" {
  description = "URL of the processing SQS queue"
  value       = aws_sqs_queue.processing_queue.url
}

output "status_update_queue_url" {
  description = "URL of the status update SQS queue"
  value       = aws_sqs_queue.status_update_queue.url
}

output "lambda_function_name" {
  description = "Name of the media processor Lambda function"
  value       = aws_lambda_function.media_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the media processor Lambda function"
  value       = aws_lambda_function.media_processor.arn
}

output "kms_key_id" {
  description = "ID of the KMS encryption key"
  value       = aws_kms_key.media_encryption.id
}

output "kms_key_arn" {
  description = "ARN of the KMS encryption key"
  value       = aws_kms_key.media_encryption.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.media_pipeline_dashboard.dashboard_name
}

output "mediaconvert_role_arn" {
  description = "ARN of the MediaConvert IAM role"
  value       = aws_iam_role.mediaconvert_role.arn
}
```

# lambda_function.py

```python
import json
import os
import boto3
from botocore.exceptions import ClientError

mediaconvert = boto3.client('mediaconvert', region_name=os.environ.get('AWS_REGION_CUSTOM', 'us-east-1'))
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION_CUSTOM', 'us-east-1'))
s3 = boto3.client('s3', region_name=os.environ.get('AWS_REGION_CUSTOM', 'us-east-1'))

INPUT_BUCKET = os.environ['INPUT_BUCKET']
OUTPUT_BUCKET = os.environ['OUTPUT_BUCKET']
ASSETS_TABLE = os.environ['ASSETS_TABLE']
MEDIACONVERT_ROLE = os.environ['MEDIACONVERT_ROLE']

table = dynamodb.Table(ASSETS_TABLE)

def get_mediaconvert_endpoint():
    try:
        response = mediaconvert.describe_endpoints()
        return response['Endpoints'][0]['Url']
    except Exception as e:
        print(f"Error getting MediaConvert endpoint: {str(e)}")
        raise

def handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    for record in event.get('Records', []):
        try:
            if 'eventSource' in record and record['eventSource'] == 'aws:sqs':
                message_body = json.loads(record['body'])
                
                if 'source' in message_body and message_body['source'] == 'aws.mediaconvert':
                    handle_mediaconvert_status(message_body)
                elif 'Records' in message_body:
                    for s3_record in message_body['Records']:
                        if s3_record.get('eventSource') == 'aws:s3':
                            handle_s3_upload(s3_record)
                else:
                    print(f"Unknown message type: {message_body}")
        except Exception as e:
            print(f"Error processing record: {str(e)}")
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }

def handle_s3_upload(s3_record):
    bucket = s3_record['s3']['bucket']['name']
    key = s3_record['s3']['object']['key']
    
    print(f"Processing S3 upload: {bucket}/{key}")
    
    asset_id = key.split('/')[-1].split('.')[0]
    
    table.put_item(Item={
        'AssetId': asset_id,
        'Status': 'PENDING',
        'InputFile': f"s3://{bucket}/{key}",
        'Renditions': []
    })
    
    try:
        mediaconvert_endpoint = get_mediaconvert_endpoint()
        mc_client = boto3.client('mediaconvert', endpoint_url=mediaconvert_endpoint, 
                                region_name=os.environ.get('AWS_REGION_CUSTOM', 'us-east-1'))
        
        job_settings = {
            'Role': MEDIACONVERT_ROLE,
            'Settings': {
                'Inputs': [{
                    'FileInput': f"s3://{bucket}/{key}",
                    'AudioSelectors': {
                        'Audio Selector 1': {
                            'DefaultSelection': 'DEFAULT'
                        }
                    },
                    'VideoSelector': {}
                }],
                'OutputGroups': [{
                    'Name': 'File Group',
                    'OutputGroupSettings': {
                        'Type': 'FILE_GROUP_SETTINGS',
                        'FileGroupSettings': {
                            'Destination': f"s3://{OUTPUT_BUCKET}/{asset_id}/"
                        }
                    },
                    'Outputs': [
                        {
                            'ContainerSettings': {
                                'Container': 'MP4'
                            },
                            'VideoDescription': {
                                'Width': 1920,
                                'Height': 1080,
                                'CodecSettings': {
                                    'Codec': 'H_264',
                                    'H264Settings': {
                                        'Bitrate': 5000000,
                                        'RateControlMode': 'CBR'
                                    }
                                }
                            },
                            'AudioDescriptions': [{
                                'CodecSettings': {
                                    'Codec': 'AAC',
                                    'AacSettings': {
                                        'Bitrate': 96000,
                                        'CodingMode': 'CODING_MODE_2_0',
                                        'SampleRate': 48000
                                    }
                                }
                            }],
                            'NameModifier': '_1080p'
                        },
                        {
                            'ContainerSettings': {
                                'Container': 'MP4'
                            },
                            'VideoDescription': {
                                'Width': 1280,
                                'Height': 720,
                                'CodecSettings': {
                                    'Codec': 'H_264',
                                    'H264Settings': {
                                        'Bitrate': 3000000,
                                        'RateControlMode': 'CBR'
                                    }
                                }
                            },
                            'AudioDescriptions': [{
                                'CodecSettings': {
                                    'Codec': 'AAC',
                                    'AacSettings': {
                                        'Bitrate': 96000,
                                        'CodingMode': 'CODING_MODE_2_0',
                                        'SampleRate': 48000
                                    }
                                }
                            }],
                            'NameModifier': '_720p'
                        }
                    ]
                }]
            },
            'UserMetadata': {
                'AssetId': asset_id
            }
        }
        
        response = mc_client.create_job(**job_settings)
        job_id = response['Job']['Id']
        
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status, JobId = :job_id',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'PROCESSING',
                ':job_id': job_id
            }
        )
        
        print(f"Created MediaConvert job {job_id} for asset {asset_id}")
        
    except Exception as e:
        print(f"Error creating MediaConvert job: {str(e)}")
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status, ErrorMessage = :error',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'FAILED',
                ':error': str(e)
            }
        )
        raise

def handle_mediaconvert_status(message):
    detail = message.get('detail', {})
    status = detail.get('status')
    job_id = detail.get('jobId')
    user_metadata = detail.get('userMetadata', {})
    asset_id = user_metadata.get('AssetId')
    
    if not asset_id:
        print(f"No AssetId in job metadata for job {job_id}")
        return
    
    print(f"MediaConvert job {job_id} status: {status} for asset {asset_id}")
    
    if status == 'COMPLETE':
        output_group_details = detail.get('outputGroupDetails', [])
        renditions = []
        for group in output_group_details:
            for output_detail in group.get('outputDetails', []):
                renditions.append({
                    'OutputFile': output_detail.get('outputFilePaths', [''])[0],
                    'DurationInMs': output_detail.get('durationInMs', 0)
                })
        
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status, Renditions = :renditions',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'COMPLETED',
                ':renditions': renditions
            }
        )
        print(f"Asset {asset_id} processing completed with {len(renditions)} renditions")
        
    elif status in ['ERROR', 'CANCELED']:
        error_message = detail.get('errorMessage', 'Unknown error')
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status, ErrorMessage = :error',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'FAILED',
                ':error': error_message
            }
        )
        print(f"Asset {asset_id} processing failed: {error_message}")
    
    else:
        table.update_item(
            Key={'AssetId': asset_id},
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': status
            }
        )
```
