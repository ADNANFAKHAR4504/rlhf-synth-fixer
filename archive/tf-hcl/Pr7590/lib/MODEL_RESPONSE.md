### Reasoning Trace
---

The user wants me to create a comprehensive Terraform configuration for a payment processing infrastructure that can be deployed across three environments (dev, staging, prod) with consistency but allowing for environment-specific variations. Let me break down what's needed:

1. A reusable Terraform module that can be parameterized
2. Environment-specific configurations
3. All the infrastructure components mentioned:
   - DynamoDB tables
   - Lambda functions
   - API Gateway
   - S3 buckets
   - CloudWatch monitoring
   - KMS keys
   - VPC/Network components
   - Tagging strategy
   - Validation mechanisms

I'll create a comprehensive Terraform configuration that addresses all these requirements. The structure should be:
- Main module definition
- Variables for environment-specific configurations
- Resources for all components
- Outputs for important values
- Validation rules to prevent drift

Let me create a well-structured, production-ready Terraform configuration.
### Answer 
---

# Payment Processing Infrastructure Terraform Stack

Below is the comprehensive Terraform configuration for your payment processing infrastructure. This solution provides a reusable module with environment-specific parameters while maintaining consistency across deployments.

## tap_stack.tf

```hcl
# ============================================================================
# Payment Processing Infrastructure Stack
# ============================================================================
# This module provides a consistent, parameterized infrastructure stack for
# payment processing across development, staging, and production environments
# ============================================================================

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
  }
}

# ============================================================================
# Input Variables
# ============================================================================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  validation {
    condition = contains([
      "us-east-1",    # Production
      "us-west-2",    # Staging
      "eu-west-1"     # Development
    ], var.region)
    error_message = "Region must be us-east-1, us-west-2, or eu-west-1."
  }
}

variable "team" {
  description = "Team responsible for the infrastructure"
  type        = string
  default     = "payment-processing"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "fintech-payments"
}

# Environment-specific capacity configurations
variable "dynamodb_capacity" {
  description = "DynamoDB read/write capacity units per environment"
  type = map(object({
    read  = number
    write = number
  }))
  default = {
    dev = {
      read  = 5
      write = 5
    }
    staging = {
      read  = 25
      write = 25
    }
    prod = {
      read  = 100
      write = 100
    }
  }
}

variable "lambda_memory" {
  description = "Lambda function memory allocation per environment"
  type = map(number)
  default = {
    dev     = 512
    staging = 1024
    prod    = 2048
  }
}

variable "api_throttle_limit" {
  description = "API Gateway throttling limits per environment"
  type = map(number)
  default = {
    dev     = 100
    staging = 500
    prod    = 2000
  }
}

variable "retention_days" {
  description = "Data retention days per environment"
  type = map(number)
  default = {
    dev     = 30
    staging = 90
    prod    = 365
  }
}

# ============================================================================
# Local Variables
# ============================================================================

locals {
  common_tags = {
    Environment     = var.environment
    Team           = var.team
    CostCenter     = var.cost_center
    ManagedBy      = "Terraform"
    Project        = "payment-processing"
    ConfigVersion  = "1.0.0"
  }
  
  # Environment-specific configurations
  env_config = {
    dynamodb_read_capacity  = var.dynamodb_capacity[var.environment].read
    dynamodb_write_capacity = var.dynamodb_capacity[var.environment].write
    lambda_memory_size      = var.lambda_memory[var.environment]
    api_throttle_limit      = var.api_throttle_limit[var.environment]
    retention_days          = var.retention_days[var.environment]
  }
  
  # Naming convention
  name_prefix = "payment-${var.environment}"
  
  # AZ configuration
  availability_zones = data.aws_availability_zones.available.names
}

# ============================================================================
# Data Sources
# ============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ============================================================================
# Network Infrastructure
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.${var.environment == "dev" ? "0" : var.environment == "staging" ? "1" : "2"}.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.${var.environment == "dev" ? "0" : var.environment == "staging" ? "1" : "2"}.${count.index + 1}.0/24"
  availability_zone = local.availability_zones[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Public Subnets for NAT Gateways
resource "aws_subnet" "public" {
  count = 2
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.${var.environment == "dev" ? "0" : var.environment == "staging" ? "1" : "2"}.${count.index + 10}.0/24"
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.environment == "prod" ? 2 : 1
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.environment == "prod" ? 2 : 1
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = var.environment == "prod" ? 2 : 1
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 2
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.environment == "prod" ? count.index : 0].id
}

# Security Groups
resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

# ============================================================================
# KMS Keys
# ============================================================================

resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} payment processing encryption"
  deletion_window_in_days = var.environment == "prod" ? 30 : 7
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# ============================================================================
# DynamoDB Tables
# ============================================================================

# Transactions Table
resource "aws_dynamodb_table" "transactions" {
  name           = "${local.name_prefix}-transactions"
  billing_mode   = "PROVISIONED"
  read_capacity  = local.env_config.dynamodb_read_capacity
  write_capacity = local.env_config.dynamodb_write_capacity
  hash_key       = "transaction_id"
  range_key      = "timestamp"
  
  attribute {
    name = "transaction_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  attribute {
    name = "customer_id"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  global_secondary_index {
    name            = "customer_index"
    hash_key        = "customer_id"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = local.env_config.dynamodb_read_capacity
    write_capacity  = local.env_config.dynamodb_write_capacity
  }
  
  global_secondary_index {
    name            = "status_index"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = local.env_config.dynamodb_read_capacity
    write_capacity  = local.env_config.dynamodb_write_capacity
  }
  
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  point_in_time_recovery {
    enabled = var.environment == "prod" ? true : false
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-transactions"
    Type = "DynamoDB"
  })
}

# Audit Logs Table
resource "aws_dynamodb_table" "audit_logs" {
  name           = "${local.name_prefix}-audit-logs"
  billing_mode   = "PROVISIONED"
  read_capacity  = local.env_config.dynamodb_read_capacity
  write_capacity = local.env_config.dynamodb_write_capacity
  hash_key       = "audit_id"
  range_key      = "timestamp"
  
  attribute {
    name = "audit_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  attribute {
    name = "action_type"
    type = "S"
  }
  
  global_secondary_index {
    name            = "action_index"
    hash_key        = "action_type"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = local.env_config.dynamodb_read_capacity
    write_capacity  = local.env_config.dynamodb_write_capacity
  }
  
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.main.arn
  }
  
  point_in_time_recovery {
    enabled = var.environment == "prod" ? true : false
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logs"
    Type = "DynamoDB"
  })
}

# ============================================================================
# S3 Buckets
# ============================================================================

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Main storage bucket
resource "aws_s3_bucket" "storage" {
  bucket = "${local.name_prefix}-storage-${random_string.bucket_suffix.result}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-storage"
    Type = "S3"
  })
}

resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "storage" {
  bucket = aws_s3_bucket.storage.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id
  
  rule {
    id     = "expire-old-objects"
    status = "Enabled"
    
    expiration {
      days = local.env_config.retention_days
    }
    
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = var.environment == "prod" ? 90 : 30
      storage_class = "STANDARD_IA"
    }
  }
}

# Create folder structure
resource "aws_s3_object" "folders" {
  for_each = toset([
    "transactions/",
    "reports/",
    "archives/",
    "logs/"
  ])
  
  bucket  = aws_s3_bucket.storage.id
  key     = each.value
  content = ""
}

# ============================================================================
# IAM Roles and Policies
# ============================================================================

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "${local.name_prefix}-lambda-execution-role"
  
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
  
  tags = local.common_tags
}

# Lambda Execution Policy
resource "aws_iam_role_policy" "lambda_execution" {
  name = "${local.name_prefix}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution.id
  
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
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/*",
          aws_dynamodb_table.audit_logs.arn,
          "${aws_dynamodb_table.audit_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.storage.arn,
          "${aws_s3_bucket.storage.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# ============================================================================
# Lambda Functions
# ============================================================================

# Payment Validation Lambda
resource "aws_lambda_function" "payment_validation" {
  filename         = "lambda_placeholder.zip"
  function_name    = "${local.name_prefix}-payment-validation"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "python3.10"
  memory_size     = local.env_config.lambda_memory_size
  timeout         = 30
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = {
      ENVIRONMENT       = var.environment
      TRANSACTIONS_TABLE = aws_dynamodb_table.transactions.name
      AUDIT_TABLE       = aws_dynamodb_table.audit_logs.name
      STORAGE_BUCKET    = aws_s3_bucket.storage.id
      KMS_KEY_ID        = aws_kms_key.main.id
    }
  }
  
  reserved_concurrent_executions = var.environment == "prod" ? 100 : 10
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-validation"
    Type = "Lambda"
  })
}

# Payment Processing Lambda
resource "aws_lambda_function" "payment_processing" {
  filename         = "lambda_placeholder.zip"
  function_name    = "${local.name_prefix}-payment-processing"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "python3.10"
  memory_size     = local.env_config.lambda_memory_size
  timeout         = 60
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = {
      ENVIRONMENT       = var.environment
      TRANSACTIONS_TABLE = aws_dynamodb_table.transactions.name
      AUDIT_TABLE       = aws_dynamodb_table.audit_logs.name
      STORAGE_BUCKET    = aws_s3_bucket.storage.id
      KMS_KEY_ID        = aws_kms_key.main.id
    }
  }
  
  reserved_concurrent_executions = var.environment == "prod" ? 200 : 20
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-processing"
    Type = "Lambda"
  })
}

# Payment Notification Lambda
resource "aws_lambda_function" "payment_notification" {
  filename         = "lambda_placeholder.zip"
  function_name    = "${local.name_prefix}-payment-notification"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  runtime         = "python3.10"
  memory_size     = local.env_config.lambda_memory_size
  timeout         = 30
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  environment {
    variables = {
      ENVIRONMENT       = var.environment
      TRANSACTIONS_TABLE = aws_dynamodb_table.transactions.name
      AUDIT_TABLE       = aws_dynamodb_table.audit_logs.name
      STORAGE_BUCKET    = aws_s3_bucket.storage.id
      KMS_KEY_ID        = aws_kms_key.main.id
    }
  }
  
  reserved_concurrent_executions = var.environment == "prod" ? 50 : 10
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-notification"
    Type = "Lambda"
  })
}

# ============================================================================
# CloudWatch Log Groups
# ============================================================================

resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = {
    validation   = aws_lambda_function.payment_validation.function_name
    processing   = aws_lambda_function.payment_processing.function_name
    notification = aws_lambda_function.payment_notification.function_name
  }
  
  name              = "/aws/lambda/${each.value}"
  retention_in_days = local.env_config.retention_days
  kms_key_id        = aws_kms_key.main.arn
  
  tags = merge(local.common_tags, {
    Name = "/aws/lambda/${each.value}"
    Type = "CloudWatch"
  })
}

# ============================================================================
# API Gateway
# ============================================================================

resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-api"
  description = "Payment processing API for ${var.environment}"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api"
    Type = "API Gateway"
  })
}

# API Resources
resource "aws_api_gateway_resource" "process" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "process"
}

resource "aws_api_gateway_resource" "validate" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "validate"
}

resource "aws_api_gateway_resource" "status" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "status"
}

# API Methods and Integrations
resource "aws_api_gateway_method" "process_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.process.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "process_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.process.id
  http_method = aws_api_gateway_method.process_post.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_processing.invoke_arn
}

resource "aws_api_gateway_method" "validate_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.validate.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "validate_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.validate.id
  http_method = aws_api_gateway_method.validate_post.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_validation.invoke_arn
}

resource "aws_api_gateway_method" "status_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.status.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "status_lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.status.id
  http_method = aws_api_gateway_method.status_get.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_notification.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.process.id,
      aws_api_gateway_resource.validate.id,
      aws_api_gateway_resource.status.id,
      aws_api_gateway_method.process_post.id,
      aws_api_gateway_method.validate_post.id,
      aws_api_gateway_method.status_get.id,
      aws_api_gateway_integration.process_lambda.id,
      aws_api_gateway_integration.validate_lambda.id,
      aws_api_gateway_integration.status_lambda.id,
    ]))
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment
  
  throttle_settings {
    rate_limit  = local.env_config.api_throttle_limit
    burst_limit = local.env_config.api_throttle_limit * 2
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-stage"
  })
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = {
    process  = aws_lambda_function.payment_processing.function_name
    validate = aws_lambda_function.payment_validation.function_name
    status   = aws_lambda_function.payment_notification.function_name
  }
  
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = each.value
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# ============================================================================
# CloudWatch Alarms
# ============================================================================

# Lambda Error Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = {
    validation   = aws_lambda_function.payment_validation.function_name
    processing   = aws_lambda_function.payment_processing.function_name
    notification = aws_lambda_function.payment_notification.function_name
  }
  
  alarm_name          = "${each.value}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = var.environment == "prod" ? "10" : "5"
  alarm_description   = "This metric monitors lambda errors"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = each.value
  }
  
  tags = merge(local.common_tags, {
    Name = "${each.value}-errors"
    Type = "CloudWatch Alarm"
  })
}

# DynamoDB Throttling Alarms
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  for_each = {
    transactions = aws_dynamodb_table.transactions.name
    audit_logs   = aws_dynamodb_table.audit_logs.name
  }
  
  alarm_name          = "${each.value}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB throttling"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    TableName = each.value
  }
  
  tags = merge(local.common_tags, {
    Name = "${each.value}-throttles"
    Type = "CloudWatch Alarm"
  })
}

# API Gateway 4xx Errors Alarm
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "${local.name_prefix}-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.environment == "prod" ? "100" : "50"
  alarm_description   = "This metric monitors API Gateway 4xx errors"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-4xx-errors"
    Type = "CloudWatch Alarm"
  })
}

# API Gateway 5xx Errors Alarm
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${local.name_prefix}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = var.environment == "prod" ? "10" : "5"
  alarm_description   = "This metric monitors API Gateway 5xx errors"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
    Stage   = aws_api_gateway_stage.main.stage_name
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-5xx-errors"
    Type = "CloudWatch Alarm"
  })
}

# ============================================================================
# CloudWatch Dashboard
# ============================================================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Validation" }],
            [".", "Errors", { stat = "Sum", yAxis = "right" }],
            ["...", { FunctionName = aws_lambda_function.payment_processing.function_name, stat = "Sum", label = "Processing" }],
            [".", "Errors", { stat = "Sum", yAxis = "right" }],
            ["...", { FunctionName = aws_lambda_function.payment_notification.function_name, stat = "Sum", label = "Notification" }],
            [".", "Errors", { stat = "Sum", yAxis = "right" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Lambda Function Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { TableName = aws_dynamodb_table.transactions.name }],
            [".", "ConsumedWriteCapacityUnits", { TableName = aws_dynamodb_table.transactions.name, yAxis = "right" }],
            [".", "ConsumedReadCapacityUnits", { TableName = aws_dynamodb_table.audit_logs.name }],
            [".", "ConsumedWriteCapacityUnits", { TableName = aws_dynamodb_table.audit_logs.name, yAxis = "right" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "DynamoDB Capacity Units"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { ApiName = aws_api_gateway_rest_api.main.name, Stage = var.environment }],
            [".", "4XXError", { ApiName = aws_api_gateway_rest_api.main.name, Stage = var.environment, stat = "Sum", yAxis = "right" }],
            [".", "5XXError", { ApiName = aws_api_gateway_rest_api.main.name, Stage = var.environment, stat = "Sum", yAxis = "right" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
          title  = "API Gateway Metrics"
        }
      }
    ]
  })
}

# ============================================================================
# Configuration Validation
# ============================================================================

# Validation to ensure configuration consistency
resource "null_resource" "configuration_validation" {
  lifecycle {
    precondition {
      condition = (
        var.environment == "dev" && var.region == "eu-west-1" ||
        var.environment == "staging" && var.region == "us-west-2" ||
        var.environment == "prod" && var.region == "us-east-1"
      )
      error_message = "Environment and region mismatch. Expected: dev->eu-west-1, staging->us-west-2, prod->us-east-1"
    }
  }
}

# ============================================================================
# Configuration Manifest Output
# ============================================================================

resource "local_file" "configuration_manifest" {
  filename = "${var.environment}_configuration_manifest.json"
  content = jsonencode({
    environment = var.environment
    region      = var.region
    timestamp   = timestamp()
    configuration = {
      dynamodb_capacity = {
        read  = local.env_config.dynamodb_read_capacity
        write = local.env_config.dynamodb_write_capacity
      }
      lambda_memory      = local.env_config.lambda_memory_size
      api_throttle_limit = local.env_config.api_throttle_limit
      retention_days     = local.env_config.retention_days
    }
    resources = {
      vpc_id                = aws_vpc.main.id
      api_gateway_endpoint  = aws_api_gateway_stage.main.invoke_url
      transactions_table    = aws_dynamodb_table.transactions.name
      audit_logs_table      = aws_dynamodb_table.audit_logs.name
      storage_bucket        = aws_s3_bucket.storage.id
      kms_key_id           = aws_kms_key.main.id
    }
    tags = local.common_tags
  })
}

# ============================================================================
# Outputs
# ============================================================================

output "api_gateway_url" {
  description = "API Gateway invocation URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    transactions = aws_dynamodb_table.transactions.name
    audit_logs   = aws_dynamodb_table.audit_logs.name
  }
}

output "lambda_functions" {
  description = "Lambda function names"
  value = {
    validation   = aws_lambda_function.payment_validation.function_name
    processing   = aws_lambda_function.payment_processing.function_name
    notification = aws_lambda_function.payment_notification.function_name
  }
}

output "s3_bucket" {
  description = "S3 storage bucket name"
  value       = aws_s3_bucket.storage.id
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.id
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "configuration_hash" {
  description = "Configuration hash for drift detection"
  value       = sha256(jsonencode(local.env_config))
}
```

## Key Features of This Implementation

### 1. **Environment-Specific Configuration**
- Parameterized variables for DynamoDB capacity, Lambda memory, API throttling, and retention policies
- Validation rules to ensure correct environment-region pairing
- Automatic configuration manifest generation for documentation

### 2. **Network Architecture**
- Isolated VPCs with environment-specific CIDR blocks
- Private subnets for Lambda functions with NAT Gateway access
- Consistent security group configurations across environments

### 3. **Data Layer**
- DynamoDB tables with configurable capacity units
- Global secondary indexes for efficient queries
- KMS encryption and point-in-time recovery (production only)

### 4. **Compute Layer**
- Lambda functions with environment-specific memory allocations
- VPC configuration for secure network access
- Reserved concurrent executions based on environment

### 5. **API Gateway**
- Consistent routes across all environments
- Environment-specific throttling configurations
- Regional endpoints for optimal performance

### 6. **Storage**
- S3 buckets with lifecycle policies
- Consistent folder structure
- KMS encryption and versioning enabled

### 7. **Monitoring & Alerting**
- CloudWatch alarms for Lambda errors, DynamoDB throttling, and API errors
- Unified dashboard for metrics visualization
- Log retention matching S3 lifecycle policies

### 8. **Governance & Compliance**
- Comprehensive tagging strategy
- Configuration validation through lifecycle preconditions
- Automatic manifest generation for audit trails
- Configuration hash output for drift detection

## Usage Example

To deploy this infrastructure:

```bash
# For development environment
terraform apply -var="environment=dev" -var="region=eu-west-1"

# For staging environment
terraform apply -var="environment=staging" -var="region=us-west-2"

# For production environment
terraform apply -var="environment=prod" -var="region=us-east-1"
```

## Next Steps

1. **Create Lambda placeholder**: Create a `lambda_placeholder.zip` file with a basic handler
2. **State Management**: Configure remote state backend (S3 + DynamoDB)
3. **CI/CD Integration**: Integrate with your deployment pipeline
4. **Drift Detection**: Implement automated configuration drift detection using the configuration hash
5. **Testing**: Implement automated tests to validate infrastructure consistency

This implementation provides a robust foundation for your payment processing infrastructure while maintaining the flexibility needed for environment-specific optimizations.