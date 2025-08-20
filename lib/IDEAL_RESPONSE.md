# Ideal Infrastructure as Code (IaC) Solution

This document contains the ideal Terraform configuration for the serverless application stack, meeting all specified requirements and adhering to security and operational best practices.

## Terraform Stack (`tap_stack.tf`)

```hcl
# Variables for configuration
variable "aws_region" {
  description = "The AWS region to deploy the stack to."
  type        = string
  default     = "us-east-1"
}

variable "lambda_function_name" {
  description = "The name of the Lambda function."
  type        = string
  default     = "tap-lambda-hello-world"
}

variable "api_gateway_name" {
  description = "The name of the API Gateway."
  type        = string
  default     = "tap-api-gateway"
}

variable "dynamodb_table_name" {
  description = "The name of the DynamoDB table."
  type        = string
  default     = "tap-dynamodb-table"
}

variable "iam_role_name" {
  description = "The name of the IAM role for the Lambda function."
  type        = string
  default     = "tap-lambda-execution-role"
}

variable "iam_policy_name" {
  description = "The name of the IAM policy for the Lambda function."
  type        = string
  default     = "tap-lambda-execution-policy"
}

# Data source to get the current AWS account ID for creating a unique S3 bucket name
data "aws_caller_identity" "current" {}

# Data source to create a zip file from inline lambda source code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/hello_world.zip"

  source {
    content  = <<-EOT
import json

def handler(event, context):
    print("request: {}".format(json.dumps(event)))
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'message': 'Hello from Lambda!'})
    }
EOT
    filename = "hello_world.py"
  }
}

# S3 bucket for Lambda deployment packages
resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "tap-lambda-artifacts-bucket-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "Lambda Artifacts Bucket"
  }
}

# Enforce server-side encryption for the S3 bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_bucket_sse" {
  bucket = aws_s3_bucket.lambda_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Enable versioning for the S3 bucket
resource "aws_s3_bucket_versioning" "lambda_bucket_versioning" {
  bucket = aws_s3_bucket.lambda_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access to the S3 bucket
resource "aws_s3_bucket_public_access_block" "lambda_bucket_pab" {
  bucket                  = aws_s3_bucket.lambda_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Upload the Lambda zip file to the S3 bucket
resource "aws_s3_object" "lambda_zip_object" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "${var.lambda_function_name}/${data.archive_file.lambda_zip.output_md5}.zip"
  source = data.archive_file.lambda_zip.output_path
  etag   = filemd5(data.archive_file.lambda_zip.output_path)
}

# IAM Role for Lambda execution
resource "aws_iam_role" "lambda_exec_role" {
  name               = var.iam_role_name
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda execution
resource "aws_iam_policy" "lambda_exec_policy" {
  name   = var.iam_policy_name
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action   = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.tap_table.arn
      }
    ]
  })
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "lambda_exec_policy_attachment" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_exec_policy.arn
}

# DynamoDB Table
resource "aws_dynamodb_table" "tap_table" {
  name           = var.dynamodb_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "TAP Table"
  }
}

# Lambda Function
resource "aws_lambda_function" "tap_lambda" {
  function_name    = var.lambda_function_name
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "hello_world.handler"
  runtime          = "python3.9"
  s3_bucket        = aws_s3_bucket.lambda_bucket.id
  s3_key           = aws_s3_object.lambda_zip_object.key
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.tap_table.name
    }
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_exec_policy_attachment, aws_cloudwatch_log_group.lambda_log_group]
}

# CloudWatch Log Group for the Lambda function
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = 14
}

# API Gateway HTTP API to trigger the Lambda
resource "aws_apigatewayv2_api" "tap_api" {
  name          = var.api_gateway_name
  protocol_type = "HTTP"
  target        = aws_lambda_function.tap_lambda.invoke_arn
}

# Lambda permission to allow invocation from API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tap_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.tap_api.execution_arn}/*/*"
}

# Outputs
output "api_endpoint" {
  description = "The invoke URL for the API Gateway endpoint."
  value       = aws_apigatewayv2_api.tap_api.api_endpoint
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket for Lambda artifacts."
  value       = aws_s3_bucket.lambda_bucket.bucket
}
```