```hcl
# Variables for configuration
variable "aws_region" {
  description = "The AWS region to deploy the stack to."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The deployment environment (dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "The owner of the resources."
  type        = string
  default     = "tap-team"
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

variable "frontend_bucket_name" {
  description = "The name of the S3 bucket for frontend assets."
  type        = string
  default     = "tap-frontend-bucket"
}

variable "cognito_user_pool_name" {
  description = "The name of the Cognito User Pool."
  type        = string
  default     = "tap-user-pool"
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

# S3 bucket for frontend assets
resource "aws_s3_bucket" "frontend_bucket" {
  bucket        = "${var.frontend_bucket_name}-${data.aws_caller_identity.current.account_id}-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "Frontend Assets Bucket"
    Environment = var.environment
    Owner       = var.owner
  }
}

# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Configure S3 bucket for static website hosting
resource "aws_s3_bucket_website_configuration" "frontend_bucket_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# Frontend bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_bucket_sse" {
  bucket = aws_s3_bucket.frontend_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Frontend bucket versioning
resource "aws_s3_bucket_versioning" "frontend_bucket_versioning" {
  bucket = aws_s3_bucket.frontend_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Frontend bucket public access block (keep bucket private, CloudFront will access it)
resource "aws_s3_bucket_public_access_block" "frontend_bucket_pab" {
  bucket                  = aws_s3_bucket.frontend_bucket.id
  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# Bucket ownership controls - required for public bucket policies
resource "aws_s3_bucket_ownership_controls" "frontend_bucket_ownership" {
  bucket = aws_s3_bucket.frontend_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# S3 bucket for Lambda deployment packages
resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "tap-lambda-artifacts-bucket-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name        = "Lambda Artifacts Bucket"
    Environment = var.environment
    Owner       = var.owner
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
    Name        = "TAP Table"
    Environment = var.environment
    Owner       = var.owner
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

  tags = {
    Name        = "TAP API Gateway"
    Environment = var.environment
    Owner       = var.owner
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "tap_api_stage" {
  api_id      = aws_apigatewayv2_api.tap_api.id
  name        = "default"
  auto_deploy = true

  tags = {
    Name        = "TAP API Gateway Stage"
    Environment = var.environment
    Owner       = var.owner
  }
}

# Lambda permission to allow invocation from API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tap_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.tap_api.execution_arn}/*/*"
}

# Cognito User Pool
resource "aws_cognito_user_pool" "tap_user_pool" {
  name = var.cognito_user_pool_name

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]

  tags = {
    Name        = "TAP User Pool"
    Environment = var.environment
    Owner       = var.owner
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "tap_user_pool_client" {
  name         = "${var.cognito_user_pool_name}-client"
  user_pool_id = aws_cognito_user_pool.tap_user_pool.id

  generate_secret = false

  explicit_auth_flows = [
    "ADMIN_NO_SRP_AUTH",
    "USER_PASSWORD_AUTH"
  ]
}

# CloudFront Origin Access Control for S3 bucket access
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "frontend-oac"
  description                       = "OAC for frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution for frontend
resource "aws_cloudfront_distribution" "frontend_distribution" {
  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
    origin_id                = "S3-${aws_s3_bucket.frontend_bucket.bucket}"
  }

  enabled             = true
  default_root_object = "index.html"
  is_ipv6_enabled     = true

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend_bucket.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Custom error page for SPA routing
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "Frontend Distribution"
    Environment = var.environment
    Owner       = var.owner
  }
}

# S3 bucket policy to allow CloudFront OAC access
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  depends_on = [
    aws_s3_bucket_public_access_block.frontend_bucket_pab,
    aws_s3_bucket_ownership_controls.frontend_bucket_ownership
  ]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend_distribution.arn
          }
        }
      }
    ]
  })
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

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table."
  value       = aws_dynamodb_table.tap_table.name
}

output "frontend_bucket_name" {
  description = "The name of the S3 bucket for frontend assets."
  value       = aws_s3_bucket.frontend_bucket.bucket
}

output "frontend_website_endpoint" {
  description = "The CloudFront distribution domain for the frontend."
  value       = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution."
  value       = aws_cloudfront_distribution.frontend_distribution.id
}

output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool."
  value       = aws_cognito_user_pool.tap_user_pool.id
}

output "cognito_user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client."
  value       = aws_cognito_user_pool_client.tap_user_pool_client.id
}
```