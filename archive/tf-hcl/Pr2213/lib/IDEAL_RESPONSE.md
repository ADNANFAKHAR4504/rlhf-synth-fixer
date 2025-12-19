# Ideal Response - Serverless Web Application

This document contains the corrected Terraform implementation for a serverless web application on AWS.

## Architecture Overview

The solution implements a complete serverless web application with:
- **Frontend**: Static website hosted in S3 with public read access
- **Backend**: AWS Lambda function for API logic
- **API Layer**: API Gateway for HTTP endpoint exposure
- **Security**: Least-privilege IAM roles and secure defaults

## Implementation

### Provider Configuration

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}
```

### Resource Naming and Tagging

```hcl
# Random suffix for unique resource naming
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  suffix = random_id.suffix.hex
  common_tags = {
    Environment = "Production"
    Project     = "ServerlessWebApp"
    ManagedBy   = "Terraform"
  }
}
```

### S3 Static Website

```hcl
# S3 bucket for static website hosting
resource "aws_s3_bucket" "website" {
  bucket = "serverless-webapp-${local.suffix}"
  tags   = local.common_tags
}

# S3 bucket website configuration
resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# Block public ACLs (security best practice)
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# S3 bucket policy for public read access to website content
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  depends_on = [aws_s3_bucket_public_access_block.website]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })
}
```

### Lambda Function

```hcl
# IAM role for Lambda function
resource "aws_iam_role" "lambda_role" {
  name = "lambda-role-${local.suffix}"
  tags = local.common_tags

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

# IAM policy for Lambda basic execution (least privilege)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Create Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"
  source {
    content = <<-EOF
import json
import datetime

def lambda_handler(event, context):
    # Log the incoming event
    print(f"Received event: {json.dumps(event)}")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'timestamp': datetime.datetime.now().isoformat(),
            'requestId': context.aws_request_id,
            'method': event.get('httpMethod', 'UNKNOWN'),
            'path': event.get('path', 'UNKNOWN')
        })
    }
EOF
    filename = "lambda_function.py"
  }
}

# Lambda function
resource "aws_lambda_function" "main" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "serverless-webapp-${local.suffix}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 10

  tags = local.common_tags
}

# CloudWatch Log Group for Lambda (with retention)
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.main.function_name}"
  retention_in_days = 7
  tags              = local.common_tags
}
```

### API Gateway Configuration

```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "serverless-webapp-api-${local.suffix}"
  description = "API Gateway for serverless web application"
  tags        = local.common_tags

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway resource
resource "aws_api_gateway_resource" "hello" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "hello"
}

# API Gateway method
resource "aws_api_gateway_method" "hello_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.hello.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway method for OPTIONS (CORS preflight)
resource "aws_api_gateway_method" "hello_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.hello.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# API Gateway integration for GET
resource "aws_api_gateway_integration" "hello_get" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.hello.id
  http_method = aws_api_gateway_method.hello_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.main.invoke_arn
}

# API Gateway integration for OPTIONS (CORS)
resource "aws_api_gateway_integration" "hello_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.hello.id
  http_method = aws_api_gateway_method.hello_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# API Gateway method response for GET
resource "aws_api_gateway_method_response" "hello_get_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.hello.id
  http_method = aws_api_gateway_method.hello_get.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# API Gateway method response for OPTIONS
resource "aws_api_gateway_method_response" "hello_options_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.hello.id
  http_method = aws_api_gateway_method.hello_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# API Gateway integration response for OPTIONS
resource "aws_api_gateway_integration_response" "hello_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.hello.id
  http_method = aws_api_gateway_method.hello_options.http_method
  status_code = aws_api_gateway_method_response.hello_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.hello_options]
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.hello_get,
    aws_api_gateway_integration.hello_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.hello.id,
      aws_api_gateway_method.hello_get.id,
      aws_api_gateway_method.hello_options.id,
      aws_api_gateway_integration.hello_get.id,
      aws_api_gateway_integration.hello_options.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "prod"
  tags          = local.common_tags
}
```

### Static Website Content

```hcl
# Sample index.html file
resource "aws_s3_object" "index_html" {
  bucket       = aws_s3_bucket.website.id
  key          = "index.html"
  content_type = "text/html"
  content = <<-EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serverless Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        #response { margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Serverless Web Application</h1>
        <p>This is a static website hosted on S3 with a serverless backend powered by Lambda and API Gateway.</p>
        
        <button onclick="callAPI()">Call Lambda Function</button>
        <div id="response"></div>
        
        <script>
            async function callAPI() {
                try {
                    const response = await fetch('${aws_api_gateway_stage.main.invoke_url}/hello');
                    const data = await response.json();
                    document.getElementById('response').innerHTML = 
                        '<h3>Response from Lambda:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                } catch (error) {
                    document.getElementById('response').innerHTML = 
                        '<h3>Error:</h3><p>' + error.message + '</p>';
                }
            }
        </script>
    </div>
</body>
</html>
EOF

  tags = local.common_tags
}

# Sample error.html file
resource "aws_s3_object" "error_html" {
  bucket       = aws_s3_bucket.website.id
  key          = "error.html"
  content_type = "text/html"
  content = <<-EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Serverless Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go back to home</a>
    </div>
</body>
</html>
EOF

  tags = local.common_tags
}
```

### Outputs

```hcl
# Outputs
output "website_url" {
  description = "URL of the static website"
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.website.id
}

output "api_endpoint" {
  description = "Full API endpoint URL"
  value       = "${aws_api_gateway_stage.main.invoke_url}/hello"
}
```

## Key Features

### Security Best Practices
- **Least Privilege IAM**: Lambda role only has basic execution permissions
- **S3 Security**: Public ACLs blocked, only public policy for website content
- **CORS Configuration**: Proper CORS headers for cross-origin requests

### Scalability & Reliability
- **Auto-scaling**: Lambda automatically scales based on demand
- **Regional Deployment**: API Gateway regional endpoint for better performance
- **CloudWatch Logging**: Centralized logging with retention policy

### Infrastructure Management
- **Resource Naming**: Consistent naming with random suffixes to prevent conflicts
- **Tagging Strategy**: Common tags for resource management and cost tracking
- **Deployment Automation**: Proper dependencies and triggers for API Gateway

## Testing Considerations

- Unit tests should validate resource configurations
- Integration tests should verify end-to-end functionality
- Load testing recommended for production workloads
- Monitor CloudWatch logs and metrics for performance insights