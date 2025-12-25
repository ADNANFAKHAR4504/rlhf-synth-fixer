########################
# Random Suffix for Uniqueness
########################

# Random suffix to ensure bucket name uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

########################
# S3 Bucket
########################

# S3 Bucket
resource "aws_s3_bucket" "corp_bucket" {
  bucket = "${local.actual_bucket_name}-${random_id.bucket_suffix.hex}"
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

########################
# IAM Resources
########################

# IAM role for Lambda function
resource "aws_iam_role" "corp_lambda_role" {
  name = local.actual_iam_role_name
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
  name        = local.actual_iam_policy_name
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

########################
# Lambda Resources
########################

# Create ZIP file for Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/corp_lambda_function.zip"
  source {
    content  = <<EOF
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
  function_name    = local.actual_lambda_name
  role             = aws_iam_role.corp_lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.9"
  timeout          = 30

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
  name              = local.actual_log_group_name
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

