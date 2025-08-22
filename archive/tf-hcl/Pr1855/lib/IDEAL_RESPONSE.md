# Infrastructure as Code Solution

This solution creates a serverless web application infrastructure using AWS Lambda, API Gateway, RDS, and S3 with proper security configurations.

## File Structure

### lib/provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

### lib/main.tf

```hcl
###############################
# ./lib/main.tf
# Single-file Terraform HCL stack
# - No provider blocks here (provider.tf must exist)
# - All variables, locals, resources, and outputs in this file
###############################

########################################
# Variables
########################################
variable "aws_region" {
  description = "Primary AWS region (provider.tf should consume this variable)"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "ProdApp"
}

variable "environment" {
  description = "Environment name for tags (e.g., dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner tag for cost allocation"
  type        = string
  default     = "platform-team"
}

variable "ssh_allowed_cidrs" {
  description = "CIDRs allowed for SSH (kept conservative; not used by default)"
  type        = list(string)
  default     = []
}

variable "http_allowed_cidrs" {
  description = "CIDRs allowed for HTTP/HTTPS (default opens HTTP/HTTPS to public)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.11"
}

variable "lambda_handler" {
  description = "Lambda handler"
  type        = string
  default     = "index.lambda_handler"
}

variable "create_rds" {
  description = "Create RDS instance (set false to save costs during development)"
  type        = bool
  default     = true
}

variable "db_engine" {
  description = "RDS database engine"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_master_username" {
  description = "RDS master username"
  type        = string
  default     = "dbadmin"
}

variable "db_master_password" {
  description = "RDS master password (sensitive - provide via CI/secret store)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "random_suffix_bytes" {
  description = "Bytes for random suffix used in resource names (avoid collisions)"
  type        = number
  default     = 4
}

########################################
# Local Values
########################################
data "aws_caller_identity" "current" {}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default_vpc" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  account_id  = data.aws_caller_identity.current.account_id
  suffix_hex  = random_id.suffix.hex
  name_prefix = lower("${var.project}-${var.environment}-${local.account_id}-${local.suffix_hex}")

  # Common tags applied to all taggable resources
  common_tags = {
    Project     = var.project
    Environment = var.environment
    Owner       = var.owner
    Region      = var.aws_region
    ManagedBy   = "terraform"
  }

  # S3 bucket names must be globally unique
  bucket_names = {
    static  = "prodapp-static-${local.account_id}-${local.suffix_hex}"
    logging = "prodapp-logs-${local.account_id}-${local.suffix_hex}"
  }
}

resource "random_id" "suffix" {
  byte_length = var.random_suffix_bytes
}

########################################
# S3 Buckets (Static & Logging)
# - Static bucket for frontend assets (privately accessible)
# - Logging bucket for access logs (lifecycle policy)
########################################
resource "aws_s3_bucket" "logging" {
  bucket        = local.bucket_names.logging
  force_destroy = true
  tags          = merge(local.common_tags, { Name = "${var.project}-logging-${local.suffix_hex}" })
}

resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logging" {
  bucket = aws_s3_bucket.logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "logging_lifecycle"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket" "static" {
  bucket        = local.bucket_names.static
  force_destroy = true
  tags          = merge(local.common_tags, { Name = "${var.project}-static-${local.suffix_hex}" })
}

resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "static" {
  bucket = aws_s3_bucket.static.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "static" {
  bucket = aws_s3_bucket.static.id

  target_bucket = aws_s3_bucket.logging.id
  target_prefix = "static-access-logs/"
}

resource "aws_s3_bucket_lifecycle_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    id     = "static_lifecycle"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

########################################
# IAM: Lambda execution role (least privilege)
########################################
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project}-lambda-exec-${local.suffix_hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid       = "AllowLambdaServicePrincipal",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

data "aws_iam_policy_document" "lambda_policy_doc" {
  # CloudWatch Logs permissions
  statement {
    sid = "AllowLambdaCreateLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${var.aws_region}:${local.account_id}:*"]
    effect    = "Allow"
  }

  # S3 permissions for the static bucket
  statement {
    sid = "AllowS3Access"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = ["${aws_s3_bucket.static.arn}/*"]
    effect    = "Allow"
  }

  # VPC access (required for RDS connectivity)
  statement {
    sid = "AllowVPCAccess"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface"
    ]
    resources = ["*"]
    effect    = "Allow"
  }
}

resource "aws_iam_role_policy" "lambda_exec_policy" {
  name   = "${var.project}-lambda-policy-${local.suffix_hex}"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_policy_doc.json
}

########################################
# Security Groups: Lambda SG and RDS SG
# - Lambda SG allows outbound to the DB (egress open)
# - RDS SG allows inbound only from Lambda SG on DB port
########################################
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project}-lambda-sg-${local.suffix_hex}"
  description = "Security group for Lambda functions"
  vpc_id      = data.aws_vpc.default.id
  tags        = local.common_tags

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project}-rds-sg-${local.suffix_hex}"
  description = "Security group for RDS (allow from Lambda)"
  vpc_id      = data.aws_vpc.default.id
  tags        = local.common_tags

  # Allow inbound Postgres (5432) or MySQL (3306) from Lambda SG only (added dynamically below)
  ingress {
    from_port       = var.db_engine == "mysql" ? 3306 : 5432
    to_port         = var.db_engine == "mysql" ? 3306 : 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }
}

########################################
# Lambda Function with inline Python code
########################################
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "/tmp/lambda.zip"
  source {
    content = <<EOF
import json
import os

def lambda_handler(event, context):
    print(f"Event: {json.dumps(event)}")
    
    # Simple hello world response
    response_body = {
        'message': 'Hello from Lambda!',
        'event': event,
        'environment_variables': dict(os.environ)
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_body)
    }
EOF
    filename = "index.py"
  }
}

resource "aws_lambda_function" "app" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project}-backend-${local.suffix_hex}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = var.lambda_handler
  runtime          = var.lambda_runtime
  memory_size      = 256
  publish          = true
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # If your Lambda needs VPC access to reach RDS, specify subnet_ids & security_group_ids:
  vpc_config {
    subnet_ids         = slice(data.aws_subnets.default_vpc.ids, 0, 2)
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy.lambda_exec_policy,
    aws_security_group.lambda_sg
  ]
}

# API Gateway REST API (regional)
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project}-api-${local.suffix_hex}"
  description = "Regional API for ${var.project}"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  tags = local.common_tags
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_method.proxy.resource_id
  http_method = aws_api_gateway_method.proxy.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.app.invoke_arn
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke-${local.suffix_hex}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_api_gateway_method" "proxy_root" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_rest_api.api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_root" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_method.proxy_root.resource_id
  http_method = aws_api_gateway_method.proxy_root.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.app.invoke_arn
}

resource "aws_api_gateway_deployment" "api" {
  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.lambda_root,
  ]

  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy.id,
      aws_api_gateway_integration.lambda.id,
      aws_api_gateway_method.proxy_root.id,
      aws_api_gateway_integration.lambda_root.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.api.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "prod"
  tags          = local.common_tags
}

########################################
# RDS (optional) - encrypted, in default VPC, secured by SG
########################################
resource "aws_db_subnet_group" "default" {
  name       = "db-subnet-group-${lower(var.project)}-${local.suffix_hex}"
  subnet_ids = slice(data.aws_subnets.default_vpc.ids, 0, 2)
  tags       = local.common_tags
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_db_instance" "db" {
  count                  = var.create_rds ? 1 : 0
  identifier             = "db-${lower(var.project)}-${local.suffix_hex}"
  engine                 = var.db_engine
  engine_version         = var.db_engine_version
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  db_name                = "${var.project}_db"
  username               = var.db_master_username
  manage_master_user_password = true
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  multi_az               = false
  storage_encrypted      = true
  tags                   = local.common_tags
  # Storage encryption uses AWS-managed keys by default (no CMK created here).
}

########################################
# Minimal IAM policy to allow CloudWatch to put metric logs or alarms if needed (optional)
# (We keep this minimal and optional; not attached automatically)
########################################
data "aws_iam_policy_document" "cw_event_policy" {
  statement {
    sid = "AllowCWPut"
    actions = [
      "cloudwatch:PutMetricData"
    ]
    resources = ["*"]
    effect    = "Allow"
  }
}

resource "aws_iam_policy" "cloudwatch_put" {
  name   = "${var.project}-cw-put-${local.suffix_hex}"
  policy = data.aws_iam_policy_document.cw_event_policy.json
  tags   = local.common_tags
}

########################################
# Outputs (non-sensitive; return empty string for optional resources when disabled)
########################################
output "s3_static_bucket_name" {
  description = "Static S3 bucket name"
  value       = aws_s3_bucket.static.bucket
}

output "s3_logging_bucket_name" {
  description = "Logging S3 bucket name"
  value       = aws_s3_bucket.logging.bucket
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.app.function_name
}

# API Gateway invoke URL (constructed)
output "api_gateway_url" {
  description = "Regional API Gateway invoke URL (prod stage)"
  value       = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}"
}

output "rds_instance_identifier" {
  description = "RDS instance identifier (empty if create_rds = false)"
  value       = var.create_rds ? aws_db_instance.db[0].id : ""
  sensitive   = false
}

output "aws_region" {
  description = "AWS region used by the stack"
  value       = var.aws_region
}
```

## Lambda Function Code

The Lambda function uses inline Python code that provides a simple hello world response:

```python
import json
import os

def lambda_handler(event, context):
    print(f"Event: {json.dumps(event)}")
    
    # Simple hello world response
    response_body = {
        'message': 'Hello from Lambda!',
        'event': event,
        'environment_variables': dict(os.environ)
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_body)
    }
```

## Key Features

- **Serverless Architecture**: Uses AWS Lambda and API Gateway for compute and API management
- **Secure Storage**: S3 buckets with encryption, versioning, and access logging
- **Database Support**: Optional RDS PostgreSQL instance with VPC isolation
- **Security**: Least-privilege IAM roles, security groups, and encrypted storage
- **Monitoring**: CloudWatch integration for logs and metrics
- **Cost Optimization**: Lifecycle policies for S3 and optional RDS creation

## Security Notes

- RDS instances are isolated in VPC with security groups allowing only Lambda access
- All storage resources are encrypted
- IAM roles follow least-privilege principles
- No hardcoded credentials - uses AWS managed passwords for RDS
- S3 buckets block public access by default

## Testing Considerations

- Supports conditional RDS creation via `create_rds` variable
- All outputs are non-sensitive for integration testing
- Uses deterministic naming with random suffixes to avoid conflicts
- Includes proper resource dependencies and lifecycle management