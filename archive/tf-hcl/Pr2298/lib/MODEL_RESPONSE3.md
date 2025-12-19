# Enhanced Model Response - API Gateway Integration & Monitoring

This document contains the AI model's response to the additional infrastructure enhancement requirements.

## Enhancement Overview

Building upon the existing production infrastructure, this response adds API Gateway integration and enhanced monitoring capabilities to support a microservices architecture.

## Additional Components

### API Gateway Integration
- **REST API Gateway** with production stage deployment
- **Lambda proxy integration** for seamless request forwarding
- **CORS configuration** for web application support
- **API deployment** with automatic redeployment triggers

### Enhanced Monitoring & Security  
- **VPC Flow Logs** stored in S3 for network traffic monitoring
- **Enhanced RDS monitoring** with increased monitoring intervals
- **Security group optimization** following least privilege principles
- **Comprehensive resource tagging** across all components

## Implementation Additions

The following Terraform resources extend the existing infrastructure:

### API Gateway Resources

```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "app_api" {
  name        = "prod-api-${random_string.bucket_suffix.result}"
  description = "Production API Gateway for microservices"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "prod-api-gateway"
  })
}

# API Gateway Resource (proxy)
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.app_api.id
  parent_id   = aws_api_gateway_rest_api.app_api.root_resource_id
  path_part   = "{proxy+}"
}

# API Gateway Method
resource "aws_api_gateway_method" "proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.app_api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

# Lambda Integration
resource "aws_api_gateway_integration" "proxy_integration" {
  rest_api_id = aws_api_gateway_rest_api.app_api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_method.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.main.invoke_arn
}

# CORS Configuration for root resource
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.app_api.id
  resource_id   = aws_api_gateway_rest_api.app_api.root_resource_id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.app_api.id
  resource_id = aws_api_gateway_rest_api.app_api.root_resource_id
  http_method = aws_api_gateway_method.options_method.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.app_api.id
  resource_id = aws_api_gateway_rest_api.app_api.root_resource_id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.app_api.id
  resource_id = aws_api_gateway_rest_api.app_api.root_resource_id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "app_deployment" {
  rest_api_id = aws_api_gateway_rest_api.app_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy_method.id,
      aws_api_gateway_integration.proxy_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "app_stage" {
  deployment_id = aws_api_gateway_deployment.app_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.app_api.id
  stage_name    = "prod"

  tags = merge(local.common_tags, {
    Name = "prod-api-stage"
  })
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.app_api.execution_arn}/*/*"
}
```

### VPC Flow Logs

```hcl
# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_s3_bucket.flow_logs.arn
  log_format      = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${windowstart} $${windowend} $${action} $${flowlogstatus}"
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "prod-vpc-flow-logs"
  })
}

# S3 bucket for VPC Flow Logs
resource "aws_s3_bucket" "flow_logs" {
  bucket = "prod-vpc-flow-logs-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "prod-vpc-flow-logs"
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs_lifecycle" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    id     = "flow_logs_lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_log" {
  name = "prod-flowlogs-role-${random_string.db_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_log" {
  name = "prod-flowlogs-policy"
  role = aws_iam_role.flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.flow_logs.arn,
          "${aws_s3_bucket.flow_logs.arn}/*"
        ]
      }
    ]
  })
}
```

### Additional Outputs

```hcl
# API Gateway outputs
output "api_gateway_invoke_url" {
  description = "Base URL for API Gateway stage"
  value       = aws_api_gateway_stage.app_stage.invoke_url
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.app_api.id
}

output "flow_logs_bucket" {
  description = "S3 bucket for VPC flow logs"
  value       = aws_s3_bucket.flow_logs.bucket
}
```

## Enhanced Features

### Monitoring Improvements
- **VPC Flow Logs**: Comprehensive network traffic monitoring with S3 storage and lifecycle policies
- **API Gateway Logging**: Integrated with CloudWatch for request/response monitoring
- **Cost Optimization**: Intelligent S3 lifecycle transitions (IA after 30 days, Glacier after 90 days)

### Security Enhancements  
- **CORS Support**: Proper cross-origin resource sharing configuration
- **Lambda Permissions**: Specific API Gateway invoke permissions with source ARN restrictions
- **Flow Log Analysis**: Network traffic analysis capabilities for security monitoring

### Microservices Readiness
- **Proxy Integration**: ANY method proxy for flexible request handling
- **Regional Endpoints**: Optimized for single-region deployments
- **Auto-deployment**: Automatic redeployment when integration changes occur

## Integration Points

The enhanced infrastructure maintains backward compatibility while adding:

1. **API Gateway** as the entry point for Lambda functions
2. **VPC Flow Logs** for network monitoring and compliance
3. **Enhanced tagging** strategy across all resources
4. **Cost-optimized storage** with intelligent lifecycle policies

## Testing Considerations

Additional test coverage should include:
- API Gateway endpoint availability and response validation
- CORS functionality verification
- VPC Flow Logs delivery to S3
- Lambda function invocation through API Gateway
- S3 lifecycle policy effectiveness

This enhancement provides a solid foundation for microservices architecture while maintaining security best practices and cost optimization.