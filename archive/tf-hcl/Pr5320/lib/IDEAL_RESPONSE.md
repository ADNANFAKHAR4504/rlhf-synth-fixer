### Reasoning Trace
---

This is a comprehensive request for building an automated image processing system using Terraform. Let me break down what's needed:

1. S3 bucket with:
   - AES256 encryption
   - Public access blocked
   - Versioning enabled
   - Lifecycle policies (30 days to IA, 90 days deletion for thumbnails)
   - Event notification for Lambda trigger

2. Lambda function:
   - Python 3.9 runtime
   - 1024MB memory
   - 60-second timeout
   - Triggers on S3 upload
   - Processes images to create thumbnails (150x150) and previews (800x600)
   - Proper IAM role with least privilege

3. DynamoDB table:
   - On-demand billing
   - Store metadata (filename, timestamps, sizes, locations, status)
   - Global secondary index on user_id

4. CloudWatch:
   - Dashboard with metrics
   - Alarms for error rates and processing time
   - Log groups with 7-day retention

5. Security:
   - IAM roles with least privilege
   - No wildcards in policies
   - Explicit resource ARNs

6. Organization:
   - lib/provider.tf
   - lib/main.tf
   - Use environmentSuffix for naming
   - Tags for Environment, Project, CostCenter

7. Outputs for operational access

Let me create a comprehensive Terraform configuration that addresses all these requirements.
### Answer 
---

I'll create a comprehensive Terraform configuration for your automated image processing system. This setup will handle the full pipeline from image upload to thumbnail generation with proper monitoring and security.

## Project Structure

```
terraform-image-processor/
├── lib/
│   ├── provider.tf
│   └── main.tf
├── lib/lambda/image_processor.py
└── terraform.tfvars.example
```

## Terraform Configuration

### **lib/provider.tf**

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
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      CostCenter  = var.cost_center
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name (qua, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "image-processor"
}

variable "cost_center" {
  description = "Cost center for billing tracking"
  type        = string
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
}
```

### **lib/main.tf**

```hcl
locals {
  environmentSuffix = var.environment == "prod" ? "" : "-${var.environment}"
  
  bucket_name     = "media-processor-images${local.environmentSuffix}"
  function_name   = "image-processor${local.environmentSuffix}"
  table_name      = "image-metadata${local.environmentSuffix}"
  dashboard_name  = "image-processing-metrics${local.environmentSuffix}"
}

# ==================== S3 CONFIGURATION ====================

# Main S3 bucket for image storage
resource "aws_s3_bucket" "image_bucket" {
  bucket = local.bucket_name
  
  tags = {
    Name        = "Image Processing Bucket"
    Description = "Stores original and processed images"
  }
}

# Enable versioning
resource "aws_s3_bucket_versioning" "image_bucket_versioning" {
  bucket = aws_s3_bucket.image_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption with AES256
resource "aws_s3_bucket_server_side_encryption_configuration" "image_bucket_encryption" {
  bucket = aws_s3_bucket.image_bucket.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "image_bucket_pab" {
  bucket = aws_s3_bucket.image_bucket.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policies
resource "aws_s3_bucket_lifecycle_configuration" "image_bucket_lifecycle" {
  bucket = aws_s3_bucket.image_bucket.id
  
  rule {
    id     = "transition-processed-images"
    status = "Enabled"
    
    filter {
      prefix = "processed/"
    }
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
  
  rule {
    id     = "delete-old-thumbnails"
    status = "Enabled"
    
    filter {
      and {
        prefix = "processed/"
        tags = {
          Type = "thumbnail"
        }
      }
    }
    
    expiration {
      days = 90
    }
  }
}

# S3 event notification for Lambda trigger
resource "aws_s3_bucket_notification" "image_upload_trigger" {
  bucket = aws_s3_bucket.image_bucket.id
  
  lambda_function {
    lambda_function_arn = aws_lambda_function.image_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ""
  }
  
  depends_on = [aws_lambda_permission.allow_s3_invoke]
}

# ==================== DYNAMODB CONFIGURATION ====================

# DynamoDB table for image metadata
resource "aws_dynamodb_table" "image_metadata" {
  name         = local.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "image_id"
  
  attribute {
    name = "image_id"
    type = "S"
  }
  
  attribute {
    name = "user_id"
    type = "S"
  }
  
  attribute {
    name = "upload_timestamp"
    type = "N"
  }
  
  # Global secondary index for user queries
  global_secondary_index {
    name            = "user-images-index"
    hash_key        = "user_id"
    range_key       = "upload_timestamp"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name        = "Image Metadata Table"
    Description = "Stores metadata for processed images"
  }
}

# ==================== LAMBDA CONFIGURATION ====================

# Package Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/image_processor.py"
  output_path = "${path.module}/../lambda/image_processor.zip"
}

# Lambda function for image processing
resource "aws_lambda_function" "image_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = local.function_name
  role            = aws_iam_role.lambda_execution.arn
  handler         = "image_processor.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  memory_size     = 1024
  timeout         = 60
  
  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.image_bucket.id
      TABLE_NAME  = aws_dynamodb_table.image_metadata.name
    }
  }
  
  layers = [
    "arn:aws:lambda:${var.aws_region}:770693421928:layer:Klayers-p39-pillow:1"
  ]
  
  tags = {
    Name        = "Image Processor Lambda"
    Description = "Processes uploaded images and generates thumbnails"
  }
}

# Lambda permission for S3 to invoke
resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.image_bucket.arn
}

# ==================== IAM CONFIGURATION ====================

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${local.function_name}-execution-role"
  
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
    Name        = "Lambda Execution Role"
    Description = "Role for image processor Lambda function"
  }
}

# Lambda execution policy - least privilege
resource "aws_iam_policy" "lambda_execution" {
  name        = "${local.function_name}-policy"
  description = "Policy for image processor Lambda with least privilege"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ReadUploadPrefix"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.image_bucket.arn}/uploads/*"
      },
      {
        Sid    = "S3WriteProcessedPrefix"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectTagging"
        ]
        Resource = "${aws_s3_bucket.image_bucket.arn}/processed/*"
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.image_metadata.arn,
          "${aws_dynamodb_table.image_metadata.arn}/index/*"
        ]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.function_name}*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_execution.arn
}

# ==================== CLOUDWATCH CONFIGURATION ====================

# Log group for Lambda function
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 7
  
  tags = {
    Name        = "Lambda Log Group"
    Description = "Logs for image processor Lambda"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "image_processing" {
  dashboard_name = local.dashboard_name
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Daily Processing Count" }],
            [".", "Duration", { stat = "Average", label = "Avg Processing Time (ms)" }],
            [".", "Errors", { stat = "Sum", label = "Error Count" }],
            [".", "Throttles", { stat = "Sum", label = "Throttle Count" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Image Processing Metrics"
          view   = "timeSeries"
          dimensions = {
            FunctionName = local.function_name
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Average", label = "Error Rate %" }],
            [".", "Invocations", { stat = "Sum", visible = false }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Error Rate"
          view   = "singleValue"
          dimensions = {
            FunctionName = local.function_name
          }
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '/aws/lambda/${local.function_name}' | fields @timestamp, @message | sort @timestamp desc | limit 100"
          region  = var.aws_region
          title   = "Recent Processing Logs"
        }
      }
    ]
  })
}

# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  name = "${local.function_name}-alarms"
  
  tags = {
    Name        = "Image Processing Alarms"
    Description = "SNS topic for CloudWatch alarms"
  }
}

resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.function_name}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Average"
  threshold          = "0.05"
  alarm_description  = "Triggers when error rate exceeds 5%"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.image_processor.function_name
  }
  
  tags = {
    Name = "High Error Rate Alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_processing_time" {
  alarm_name          = "${local.function_name}-high-processing-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Duration"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Average"
  threshold          = "30000"
  alarm_description  = "Triggers when processing time exceeds 30 seconds"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.image_processor.function_name
  }
  
  tags = {
    Name = "High Processing Time Alarm"
  }
}

# ==================== DATA SOURCES ====================

data "aws_caller_identity" "current" {}

# ==================== OUTPUTS ====================

output "s3_bucket_name" {
  value       = aws_s3_bucket.image_bucket.id
  description = "Name of the S3 bucket for image storage"
}

output "lambda_function_arn" {
  value       = aws_lambda_function.image_processor.arn
  description = "ARN of the image processor Lambda function"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.image_metadata.name
  description = "Name of the DynamoDB table for image metadata"
}

output "cloudwatch_dashboard_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.image_processing.dashboard_name}"
  description = "URL to access the CloudWatch dashboard"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.alarms.arn
  description = "ARN of the SNS topic for alarms"
}

output "upload_prefix" {
  value       = "s3://${aws_s3_bucket.image_bucket.id}/uploads/"
  description = "S3 path for uploading images"
}

output "processed_prefix" {
  value       = "s3://${aws_s3_bucket.image_bucket.id}/processed/"
  description = "S3 path for processed images"
}
```

### **lambda/image_processor.py**

```python
import json
import boto3
import os
import uuid
from datetime import datetime
from PIL import Image
from io import BytesIO
import logging

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Image processing configurations
THUMBNAIL_SIZE = (150, 150)
PREVIEW_SIZE = (800, 600)

def handler(event, context):
    """
    Main Lambda handler for image processing
    """
    try:
        # Parse S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            # Extract metadata
            image_id = str(uuid.uuid4())
            user_id = extract_user_id(key)
            original_filename = os.path.basename(key)
            upload_timestamp = int(datetime.now().timestamp())
            
            logger.info(f"Processing image: {key}")
            
            # Download image from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            image_data = response['Body'].read()
            original_size = len(image_data)
            
            # Open image with Pillow
            image = Image.open(BytesIO(image_data))
            
            # Generate thumbnail
            thumbnail = create_resized_image(image, THUMBNAIL_SIZE, "thumbnail")
            thumbnail_key = f"processed/thumbnails/{image_id}_thumb.jpg"
            thumbnail_size = upload_image_to_s3(thumbnail, thumbnail_key, {"Type": "thumbnail"})
            
            # Generate preview
            preview = create_resized_image(image, PREVIEW_SIZE, "preview")
            preview_key = f"processed/previews/{image_id}_preview.jpg"
            preview_size = upload_image_to_s3(preview, preview_key, {"Type": "preview"})
            
            # Store metadata in DynamoDB
            table = dynamodb.Table(TABLE_NAME)
            processing_timestamp = int(datetime.now().timestamp())
            
            metadata_item = {
                'image_id': image_id,
                'user_id': user_id,
                'original_filename': original_filename,
                'original_key': key,
                'upload_timestamp': upload_timestamp,
                'processing_timestamp': processing_timestamp,
                'original_size': original_size,
                'thumbnail_key': thumbnail_key,
                'thumbnail_size': thumbnail_size,
                'preview_key': preview_key,
                'preview_size': preview_size,
                'processing_status': 'completed',
                'image_format': image.format,
                'image_dimensions': f"{image.width}x{image.height}"
            }
            
            table.put_item(Item=metadata_item)
            
            logger.info(f"Successfully processed image: {image_id}")
            
            # Return success metrics
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Image processed successfully',
                    'image_id': image_id,
                    'processing_time_ms': (processing_timestamp - upload_timestamp) * 1000
                })
            }
            
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        
        # Try to update DynamoDB with error status
        try:
            table = dynamodb.Table(TABLE_NAME)
            table.put_item(Item={
                'image_id': image_id if 'image_id' in locals() else str(uuid.uuid4()),
                'user_id': user_id if 'user_id' in locals() else 'unknown',
                'original_filename': original_filename if 'original_filename' in locals() else 'unknown',
                'processing_status': 'failed',
                'error_message': str(e),
                'upload_timestamp': upload_timestamp if 'upload_timestamp' in locals() else int(datetime.now().timestamp())
            })
        except:
            pass
        
        raise e

def extract_user_id(key):
    """
    Extract user ID from S3 key path
    Assumes format: uploads/{user_id}/{filename}
    """
    parts = key.split('/')
    if len(parts) >= 3:
        return parts[1]
    return 'unknown'

def create_resized_image(image, size, image_type):
    """
    Create a resized version of the image
    """
    # Convert RGBA to RGB if necessary
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    
    # Create copy and resize
    img_copy = image.copy()
    img_copy.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Save to BytesIO
    output = BytesIO()
    img_copy.save(output, format='JPEG', quality=85, optimize=True)
    output.seek(0)
    
    return output

def upload_image_to_s3(image_data, key, tags):
    """
    Upload processed image to S3
    """
    image_bytes = image_data.read()
    
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=key,
        Body=image_bytes,
        ContentType='image/jpeg',
        Tagging='&'.join([f"{k}={v}" for k, v in tags.items()])
    )
    
    return len(image_bytes)
```

## Deployment Instructions

1. **Initialize Terraform:**
```bash
cd terraform-image-processor
terraform init
```

2. **Review the plan:**
```bash
terraform plan
```

3. **Deploy the infrastructure:**
```bash
terraform apply
```

## Key Features Implemented

### Security
- **Least privilege IAM policies** with explicit resource ARNs
- **AES256 encryption** for S3 bucket
- **Public access blocked** on S3
- **Specific prefixes** for read/write operations

### Performance & Scalability
- **1024MB memory** allocation for Lambda
- **60-second timeout** for processing
- **On-demand DynamoDB** for variable traffic
- **Global secondary index** for user queries

### Monitoring & Observability
- **CloudWatch dashboard** with key metrics
- **Error rate alarms** (>5% threshold)
- **Processing time alarms** (>30 seconds)
- **7-day log retention** for cost optimization

### Cost Optimization
- **Lifecycle policies** for storage transitions
- **Thumbnail deletion** after 90 days
- **Standard-IA** transition after 30 days
- **Comprehensive tagging** for billing tracking

### File Organization
- Uses `environmentSuffix` pattern for multi-environment support
- Structured in `lib/` directory as requested
- Clean separation of provider and resource configurations

The system will automatically process images as they're uploaded to the `uploads/` prefix in S3, generate thumbnails and previews, store metadata in DynamoDB, and provide comprehensive monitoring through CloudWatch.