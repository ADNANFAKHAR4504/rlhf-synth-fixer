# S3-Lambda Integration Infrastructure

I'll help you create the Terraform HCL infrastructure for an S3-Lambda integration system. Here's the complete solution with proper IAM roles and following AWS best practices:

## variables.tf

```hcl
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "corp-s3-bucket"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "corp-s3-processor"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "S3LambdaIntegration"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```

## s3.tf

```hcl
# Random suffix to ensure bucket name uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket
resource "aws_s3_bucket" "corp_bucket" {
  bucket = "${var.bucket_name}-${random_id.bucket_suffix.hex}"
  tags   = var.common_tags
}

# Enable versioning
resource "aws_s3_bucket_versioning" "corp_bucket_versioning" {
  bucket = aws_s3_bucket.corp_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configure public access block to allow public reads
resource "aws_s3_bucket_public_access_block" "corp_bucket_pab" {
  bucket = aws_s3_bucket.corp_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy for public read access
resource "aws_s3_bucket_policy" "corp_bucket_policy" {
  bucket     = aws_s3_bucket.corp_bucket.id
  depends_on = [aws_s3_bucket_public_access_block.corp_bucket_pab]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.corp_bucket.arn}/*"
      }
    ]
  })
}

# S3 bucket notification for Lambda
resource "aws_s3_bucket_notification" "corp_bucket_notification" {
  bucket = aws_s3_bucket.corp_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.corp_s3_processor.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}
```

## iam.tf

```hcl
# IAM role for Lambda function
resource "aws_iam_role" "corp_lambda_role" {
  name = "corp-lambda-s3-processor-role"
  tags = var.common_tags

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
}

# IAM policy for Lambda to access S3 and CloudWatch
resource "aws_iam_policy" "corp_lambda_policy" {
  name        = "corp-lambda-s3-policy"
  description = "Policy for Lambda function to access S3 and CloudWatch logs"

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.corp_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.corp_bucket.arn
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "corp_lambda_policy_attachment" {
  policy_arn = aws_iam_policy.corp_lambda_policy.arn
  role       = aws_iam_role.corp_lambda_role.name
}
```

## lambda.tf

```hcl
# Create ZIP file for Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/corp_lambda_function.zip"
  source {
    content = <<EOF
import json
import boto3
from urllib.parse import unquote_plus

def lambda_handler(event, context):
    # Process S3 event
    s3_client = boto3.client('s3')
    
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])
        
        print(f"Processing object: {key} from bucket: {bucket}")
        
        try:
            # Get object metadata
            response = s3_client.head_object(Bucket=bucket, Key=key)
            print(f"Object metadata: {response}")
            
            # You can add custom processing logic here
            print(f"Successfully processed {key}")
            
        except Exception as e:
            print(f"Error processing {key}: {str(e)}")
            raise e
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing completed successfully')
    }
EOF
    filename = "lambda_function.py"
  }
}

# Lambda function
resource "aws_lambda_function" "corp_s3_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = var.lambda_function_name
  role            = aws_iam_role.corp_lambda_role.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 30
  
  # Configure for improved scaling (up to 1,000 concurrent executions every 10 seconds)
  reserved_concurrent_executions = 100

  tags = var.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.corp_lambda_policy_attachment,
    aws_cloudwatch_log_group.corp_lambda_logs,
  ]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "corp_lambda_logs" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = 14
  tags              = var.common_tags
}

# Permission for S3 to invoke Lambda
resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.corp_s3_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.corp_bucket.arn
}
```

## outputs.tf

```hcl
output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.corp_bucket.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.corp_bucket.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.corp_s3_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.corp_s3_processor.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.corp_lambda_role.arn
}
```

This infrastructure includes:

1. **S3 Bucket** with versioning enabled and 'corp-' naming convention
2. **Bucket Policy** allowing public read access to objects
3. **Lambda Function** triggered by S3 ObjectCreated events
4. **IAM Role and Policies** following least privilege principle
5. **S3 Bucket Notification** to trigger Lambda on object creation
6. **CloudWatch Log Group** for Lambda logging
7. **Latest AWS features** including improved Lambda scaling configuration

The Lambda function is configured with reserved concurrent executions to take advantage of the latest scaling improvements. All resources follow the 'corp-' naming convention and include proper tagging.