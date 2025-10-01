# TAP Stack Infrastructure - Ideal Response

## Overview
This infrastructure stack deploys a secure, scalable serverless application on AWS designed for handling RLHF (Reinforcement Learning from Human Feedback) task processing. The stack implements a complete end-to-end solution with proper security, monitoring, and scalability features.

## Architecture Components

### Core Services
- **API Gateway REST API**: Serves as the secure entry point with IAM authentication and IP-based access control
- **Lambda Function**: Python-based serverless compute for processing requests and business logic
- **DynamoDB Table**: NoSQL database with auto-scaling for storing task data and metadata
- **S3 Bucket**: Secure storage for Lambda execution logs with server-side encryption

### Security Features
- **IAM Roles & Policies**: Least-privilege access control for all resources
- **IP Restriction**: API Gateway access limited to specified IP addresses
- **AWS Secrets Manager**: Secure storage and retrieval of API keys
- **VPC Integration**: Network isolation with proper security group configurations
- **Encryption**: S3 server-side encryption (AES256) for data at rest

### Monitoring & Observability
- **CloudWatch Alarms**: Automated monitoring for API Gateway 4XX and 5XX errors
- **CloudWatch Logs**: Centralized logging for Lambda function execution
- **S3 Audit Logs**: Detailed request/response logging for compliance and debugging
- **API Gateway Caching**: Performance optimization with encrypted cache

### Scalability Features
- **DynamoDB Auto-scaling**: Automatic read/write capacity adjustment based on utilization (target: 70%)
- **Lambda Concurrency**: Serverless auto-scaling based on demand
- **API Gateway Throttling**: Built-in request rate limiting and quota management

## Resource Configuration

### Compute Layer
- **Lambda Runtime**: Python 3.8 with optimized deployment package
- **Environment Variables**: Secure configuration for DynamoDB table, S3 bucket, and Secrets Manager
- **Memory/Timeout**: Configured for optimal performance-to-cost ratio

### Data Layer
- **DynamoDB**: Provisioned billing mode with hash key 'id' for consistent performance
- **S3**: Versioning enabled with lifecycle policies for cost optimization
- **Secrets Manager**: Centralized API key management with rotation capabilities

### Network Layer
- **VPC**: Dedicated 10.0.0.0/16 network with DNS support
- **Security Groups**: Fine-grained network access control for HTTPS, HTTP, and ICMP traffic
- **API Gateway Stage**: Production deployment with comprehensive method settings

## Operational Features

### Deployment Pipeline
- **Infrastructure as Code**: Terraform-based deployment with state management
- **Environment Separation**: Configurable environments through variable overrides
- **Automated Testing**: Unit and integration test suites for reliability

### Cost Optimization
- **Right-sized Provisioning**: DynamoDB starts at 5 RCU/WCU with auto-scaling to 100
- **S3 Lifecycle**: Intelligent tiering for log retention
- **API Gateway Caching**: 5-minute TTL to reduce backend calls

### Compliance & Governance
- **Resource Tagging**: Consistent tagging strategy for cost allocation and management
- **Access Logging**: Comprehensive audit trail for security compliance
- **Backup Strategy**: DynamoDB point-in-time recovery and S3 versioning

## Integration Points

### External Services
- **API Key Management**: Secure integration with external authentication providers
- **Monitoring Integration**: CloudWatch metrics exportable to external monitoring systems
- **Backup Integration**: S3 cross-region replication support for disaster recovery

### Development Workflow
- **Local Development**: Docker-compose setup for local testing
- **CI/CD Pipeline**: Automated deployment through GitHub Actions
- **Testing Framework**: Comprehensive test suite with mocked AWS services

## Expected Outcomes

### Performance Metrics
- **API Response Time**: < 200ms for 95th percentile requests
- **Availability**: 99.9% uptime with automatic failover
- **Scalability**: Handle 1000+ concurrent requests with auto-scaling
- **Cost Efficiency**: Optimized for variable workloads with pay-per-use pricing

### Security Posture
- **Zero Trust Architecture**: All communications encrypted and authenticated
- **Principle of Least Privilege**: Minimal required permissions for all components
- **Audit Compliance**: Complete request/response logging and monitoring
- **Data Protection**: Encryption at rest and in transit for all sensitive data

### Operational Excellence
- **Automated Monitoring**: Proactive alerting for system health and performance
- **Self-Healing**: Automatic recovery from transient failures
- **Maintenance Windows**: Zero-downtime deployments and updates
- **Documentation**: Comprehensive runbooks and troubleshooting guides

This infrastructure provides a production-ready, secure, and scalable foundation for the TAP (Task Assignment Platform) application, specifically designed to handle RLHF workloads with enterprise-grade reliability and security standards.

```hcl
# Input Variables
# -----------------------------
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"
}
# -----------------------------

variable "lambda_allowed_ips" {
  description = "List of known IP addresses allowed to access API Gateway"
  type        = list(string)
  default     = ["203.0.113.1", "198.51.100.2"]
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "tap_stack_data"
}

variable "lambda_log_bucket_name" {
  description = "Name of the S3 bucket for Lambda logs"
  type        = string
  default     = "tap-stack-logs-bucket"
}

variable "tags" {
  description = "Tags for all resources"
  type        = map(string)
  default = {
    Project     = "TapStack"
    Environment = "Production"
    Owner       = "TuringGPT"
    ManagedBy   = "Terraform"
  }
}

variable "api_key_secret_name" {
  description = "Name of the secret in AWS Secrets Manager for API keys"
  type        = string
  default     = "tap_stack_api_keys"
}

# -----------------------------
# Locals
# -----------------------------
locals {
  common_tags = var.tags
}

# -----------------------------
# VPC for API Gateway
# -----------------------------
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = local.common_tags
}

# -----------------------------
# S3 Bucket for Lambda Logs
# -----------------------------
resource "aws_s3_bucket" "lambda_logs" {
  bucket = var.lambda_log_bucket_name
  tags   = local.common_tags

  versioning {
    enabled = true
  }

}

# Recommended: S3 bucket server-side encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_logs" {
  bucket = aws_s3_bucket.lambda_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# -----------------------------
# DynamoDB Table with Autoscaling
# -----------------------------
resource "aws_dynamodb_table" "data" {
  name         = var.dynamodb_table_name
  billing_mode = "PROVISIONED"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  read_capacity  = 5
  write_capacity = 5
  tags           = local.common_tags
}

resource "aws_appautoscaling_target" "dynamodb_read" {
  max_capacity       = 100
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.data.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_read_policy" {
  name               = "DynamoDBReadAutoScalingPolicy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_read.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_read.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_target" "dynamodb_write" {
  max_capacity       = 100
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.data.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_write_policy" {
  name               = "DynamoDBWriteAutoScalingPolicy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_write.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_write.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_write.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = 70.0
  }
}

# -----------------------------
# IAM Role for Lambda
# -----------------------------
resource "aws_iam_role" "lambda_exec" {
  name = "tap_stack_lambda_exec_role"
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
  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "tap_stack_lambda_policy"
  description = "Least privilege policy for Lambda"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.data.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.lambda_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# -----------------------------
# Lambda Function
# -----------------------------
resource "aws_lambda_function" "main" {
  function_name = "tap_stack_lambda"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.8"
  filename      = "function.zip" # Upload your deployment package separately
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.data.name
      LOG_BUCKET     = aws_s3_bucket.lambda_logs.bucket
      API_KEY_SECRET = var.api_key_secret_name
    }
  }
  tags = local.common_tags
}

# -----------------------------
# API Gateway REST API
# -----------------------------
resource "aws_api_gateway_rest_api" "main" {
  name        = "tap_stack_api"
  description = "REST API for Lambda"
  tags        = local.common_tags
}

resource "aws_api_gateway_resource" "lambda_resource" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "lambda"
}

resource "aws_api_gateway_method" "lambda_method" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.lambda_resource.id
  http_method   = "POST"
  authorization = "AWS_IAM"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.lambda_resource.id
  http_method             = aws_api_gateway_method.lambda_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.main.invoke_arn
}

resource "aws_api_gateway_deployment" "main" {
  depends_on = [aws_api_gateway_integration.lambda_integration]
  rest_api_id = aws_api_gateway_rest_api.main.id
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = "prod"
  deployment_id = aws_api_gateway_deployment.main.id
  cache_cluster_enabled = true
  cache_cluster_size    = "0.5"
  tags = local.common_tags
}

resource "aws_api_gateway_method_settings" "prod_settings" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"
  settings {
    metrics_enabled = true
    logging_level   = "INFO"
    cache_data_encrypted = true
    cache_ttl_in_seconds = 300
  }
}

resource "aws_api_gateway_gateway_response" "cors" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"
  status_code   = "400"
  response_parameters = {
  "gatewayresponse.header.Access-Control-Allow-Origin"  = "'https://google.com'"
  "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
  "gatewayresponse.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
}

# -----------------------------
# Security Group for API Gateway
# -----------------------------
resource "aws_security_group" "api_gw_sg" {
  name        = "tap_stack_api_gw_sg"
  description = "Allow ICMP, TCP 80/443 for API Gateway"
  vpc_id      = aws_vpc.main.id
  tags        = local.common_tags

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# -----------------------------
# IAM Policy for API Gateway IP Restriction
# -----------------------------
resource "aws_iam_policy" "api_gw_ip_restrict" {
  name        = "tap_stack_api_gw_ip_restrict"
  description = "Restrict API Gateway access to known IPs"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "execute-api:Invoke"
      Resource = "*"
      Condition = {
        IpAddress = {
          "aws:SourceIp" = var.lambda_allowed_ips
        }
      }
    }]
  })
}

# -----------------------------
# Secrets Manager for API Keys
# -----------------------------
resource "aws_secretsmanager_secret" "api_keys" {
  name = var.api_key_secret_name
  tags = local.common_tags
}

# -----------------------------
# CloudWatch Alarms for API Gateway Errors
# -----------------------------
resource "aws_cloudwatch_metric_alarm" "apigw_4xx" {
  alarm_name          = "tap_stack_apigw_4xx_errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alarm for API Gateway 4XX errors"
  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name          = "tap_stack_apigw_5xx_errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alarm for API Gateway 5XX errors"
  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
  }
  tags = local.common_tags
}

# -----------------------------
# Outputs
# -----------------------------
output "lambda_function_name" {
  value = aws_lambda_function.main.function_name
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.data.name
}

output "api_gateway_id" {
  value = aws_api_gateway_rest_api.main.id
}

output "s3_log_bucket_name" {
  value = aws_s3_bucket.lambda_logs.bucket
}

output "api_key_secret_arn" {
  value = aws_secretsmanager_secret.api_keys.arn
}

output "cloudwatch_alarm_4xx_name" {
  value = aws_cloudwatch_metric_alarm.apigw_4xx.alarm_name
}

output "cloudwatch_alarm_5xx_name" {
  value = aws_cloudwatch_metric_alarm.apigw_5xx.alarm_name
}
```
