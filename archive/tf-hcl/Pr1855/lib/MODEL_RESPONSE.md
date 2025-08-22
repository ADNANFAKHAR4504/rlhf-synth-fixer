# ./lib/main.tf
# Complete Terraform stack for secure web application environment
# Requires provider.tf to exist with AWS provider configuration

# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "owner" {
  description = "Owner tag for all resources"
  type        = string
  default     = "devops-team"
}

variable "environment" {
  description = "Environment tag (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "create_rds" {
  description = "Whether to create RDS instance"
  type        = bool
  default     = true
}

variable "rds_admin_username" {
  description = "RDS admin username (password provided via CI/secrets)"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "rds_admin_password" {
  description = "RDS admin password - must be provided via CI/secrets"
  type        = string
  sensitive   = true
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access RDS (for emergency access)"
  type        = list(string)
  default     = ["10.0.0.0/8"] # Private networks only by default
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Common tags applied to all resources
  common_tags = {
    Owner       = var.owner
    Environment = var.environment
    Project     = "ProdApp"
    ManagedBy   = "terraform"
  }

  # Naming convention: prodapp-<resource>-<account>-<suffix>
  name_prefix = "prodapp-${var.environment}"
}

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get current AWS account ID for unique naming
data "aws_caller_identity" "current" {}

# Get default VPC for RDS and Lambda deployment
data "aws_vpc" "default" {
  default = true
}

# Get default subnets for RDS subnet group
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Get availability zones for RDS subnet group
data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# RANDOM SUFFIX FOR GLOBAL UNIQUENESS
# =============================================================================

# Random suffix to avoid naming conflicts in CI/CD
resource "random_id" "suffix" {
  byte_length = 4
}

# =============================================================================
# S3 BUCKETS (Static Hosting + Logging)
# =============================================================================

# S3 bucket for access logging (must be created first)
resource "aws_s3_bucket" "logging" {
  bucket = "${local.name_prefix}-logs-${data.aws_caller_identity.current.account_id}-${random_id.suffix.hex}"
  tags   = local.common_tags
}

# Versioning for logging bucket
resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption for logging bucket (AWS-managed KMS key for cost efficiency)
resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256" # AWS-managed encryption for logs
    }
    bucket_key_enabled = true
  }
}

# Block public access for logging bucket
resource "aws_s3_bucket_public_access_block" "logging" {
  bucket = aws_s3_bucket.logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Main S3 bucket for static content
resource "aws_s3_bucket" "static" {
  bucket = "${local.name_prefix}-static-${data.aws_caller_identity.current.account_id}-${random_id.suffix.hex}"
  tags   = local.common_tags
}

# Versioning for static bucket
resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption for static bucket (AWS-managed KMS key alias/aws/s3)
# Using AWS-managed key for cost efficiency and simplicity
resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = "alias/aws/s3"
    }
    bucket_key_enabled = true
  }
}

# Block public access for static bucket (will use CloudFront or signed URLs)
resource "aws_s3_bucket_public_access_block" "static" {
  bucket = aws_s3_bucket.static.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Access logging configuration
resource "aws_s3_bucket_logging" "static" {
  bucket = aws_s3_bucket.static.id

  target_bucket = aws_s3_bucket.logging.id
  target_prefix = "access-logs/"
}

# Lifecycle rule to expire objects after 365 days
resource "aws_s3_bucket_lifecycle_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    id     = "expire_old_versions"
    status = "Enabled"

    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${local.name_prefix}-lambda-role-${random_id.suffix.hex}"
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

# Lambda execution policy (least privilege)
resource "aws_iam_role_policy" "lambda_execution" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda_execution.id

  # Least privilege: only CloudWatch logs and specific S3/RDS access
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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.static.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*" # Required for VPC Lambda - unavoidable wildcard
      }
    ]
  })
}

# Example MFA policy for destructive operations (illustrative only)
resource "aws_iam_policy" "mfa_required_destructive" {
  name        = "${local.name_prefix}-mfa-destructive-policy"
  description = "Requires MFA for destructive operations (example policy)"
  tags        = local.common_tags

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "rds:DeleteDBInstance",
          "lambda:DeleteFunction"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
}

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Security group for Lambda (if VPC is needed)
resource "aws_security_group" "lambda" {
  name_prefix = "${local.name_prefix}-lambda-"
  vpc_id      = data.aws_vpc.default.id
  description = "Security group for Lambda function"
  tags        = local.common_tags

  # Outbound HTTPS for API calls
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }

  # Outbound to RDS
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
    description     = "PostgreSQL to RDS"
  }
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  vpc_id      = data.aws_vpc.default.id
  description = "Security group for RDS instance"
  tags        = local.common_tags

  # Inbound from Lambda only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "PostgreSQL from Lambda"
  }

  # Emergency access from allowed CIDR blocks (configurable)
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
    description = "Emergency PostgreSQL access"
  }
}

# =============================================================================
# LAMBDA FUNCTION
# =============================================================================

# Lambda function code (inline for simplicity)
resource "aws_lambda_function" "api_backend" {
  filename         = "lambda_function.zip"
  function_name    = "${local.name_prefix}-api-${random_id.suffix.hex}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda_function.lambda_handler"
  runtime         = "python3.9"
  timeout         = 30
  tags            = local.common_tags

  # Create a minimal Lambda deployment package
  depends_on = [data.archive_file.lambda_zip]

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.static.bucket
      RDS_HOST  = var.create_rds ? aws_rds_instance.main[0].endpoint : ""
      # Note: DB credentials should come from AWS Secrets Manager in production
    }
  }
}

# Create Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"
  
  source {
    content = <<EOF
import json
import os

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            's3_bucket': os.environ.get('S3_BUCKET', ''),
            'rds_host': os.environ.get('RDS_HOST', '')
        })
    }
EOF
    filename = "lambda_function.py"
  }
}

# =============================================================================
# API GATEWAY
# =============================================================================

# API Gateway (HTTP API for better performance and cost)
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api-${random_id.suffix.hex}"
  protocol_type = "HTTP"
  description   = "API Gateway for ProdApp backend"
  tags          = local.common_tags

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_origins     = ["*"]
    max_age          = 86400
  }
}

# API Gateway stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true
  tags        = local.common_tags

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      resourcePath  = "$context.resourcePath"
      status        = "$context.status"
      protocol      = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

# API Gateway integration with Lambda
resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.api_backend.invoke_arn
}

# API Gateway route
resource "aws_apigatewayv2_route" "main" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Default route for root path
resource "aws_apigatewayv2_route" "root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# CloudWatch log group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.main.name}"
  retention_in_days = 14
  tags              = local.common_tags
}

# =============================================================================
# RDS DATABASE
# =============================================================================

# RDS subnet group
resource "aws_db_subnet_group" "main" {
  count      = var.create_rds ? 1 : 0
  name       = "${local.name_prefix}-db-subnet-group-${random_id.suffix.hex}"
  subnet_ids = data.aws_subnets.default.ids
  tags       = local.common_tags
}

# RDS instance (PostgreSQL with encryption)
# Multi-AZ disabled by default for cost efficiency in dev/test environments
# Enable Multi-AZ in production for high availability at ~2x cost
resource "aws_rds_instance" "main" {
  count = var.create_rds ? 1 : 0

  identifier = "${local.name_prefix}-db-${random_id.suffix.hex}"
  
  # Database configuration
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.micro" # Smallest instance for cost efficiency
  
  # Storage configuration with encryption
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type         = "gp2"
  storage_encrypted    = true
  kms_key_id          = "alias/aws/rds" # AWS-managed KMS key
  
  # Database credentials (password must be provided via variables)
  db_name  = "prodapp"
  username = var.rds_admin_username
  password = var.rds_admin_password
  
  # Network and security
  db_subnet_group_name   = aws_db_subnet_group.main[0].name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # Backup and maintenance
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Multi-AZ disabled for cost (enable in production)
  multi_az = false
  
  # Monitoring and logging
  monitoring_interval = 60
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  # Deletion protection disabled for CI/CD flexibility
  deletion_protection = false
  skip_final_snapshot = true
  
  tags = local.common_tags
}

# =============================================================================
# OUTPUTS (CI/CD FRIENDLY)
# =============================================================================

output "s3_static_bucket_name" {
  description = "Name of the S3 bucket for static content"
  value       = aws_s3_bucket.static.bucket
}

output "s3_logging_bucket_name" {
  description = "Name of the S3 bucket for access logs"
  value       = aws_s3_bucket.logging.bucket
}

output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api_backend.function_name
}

output "rds_instance_identifier" {
  description = "RDS instance identifier (empty if not created)"
  value       = var.create_rds ? aws_rds_instance.main[0].identifier : ""
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

# Additional outputs for debugging and integration
output "vpc_id" {
  description = "VPC ID used for resources"
  value       = data.aws_vpc.default.id
}

output "lambda_security_group_id" {
  description = "Security group ID for Lambda function"
  value       = aws_security_group.lambda.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS instance"
  value       = aws_security_group.rds.id
}

# =============================================================================
# COMMENTS ON DESIGN DECISIONS
# =============================================================================

/*
ENCRYPTION CHOICES:
- S3 static bucket: Using AWS-managed KMS key (alias/aws/s3) for cost efficiency
  and automatic key rotation. Customer-managed keys would require additional
  KMS permissions and cost more.
- S3 logging bucket: Using AES256 (SSE-S3) for logs as it's sufficient for
  access logs and more cost-effective.
- RDS: Using AWS-managed RDS KMS key (alias/aws/rds) for encryption at rest.

IAM PERMISSIONS:
- Lambda execution role has minimal permissions for CloudWatch logs and specific
  S3 bucket access with explicit ARNs.
- EC2 network interface permissions use wildcard (*) as required by AWS for
  VPC Lambda functions - this is unavoidable.
- RDS access is controlled via security groups rather than IAM for simplicity.

SECURITY CONSIDERATIONS:
- All S3 buckets block public access by default
- RDS is in private subnets with restrictive security groups
- Lambda has VPC configuration for secure RDS access
- API Gateway uses regional endpoint (not edge-optimized) for better control
- No hardcoded credentials - all sensitive values use variables

COST OPTIMIZATIONS:
- RDS Multi-AZ disabled by default (enable in production)
- Smallest instance classes for development
- AWS-managed encryption keys to avoid KMS charges
- Lifecycle policies to clean up old S3 versions

CI/CD CONSIDERATIONS:
- Random suffix prevents naming conflicts in parallel CI runs
- All outputs are non-null strings for reliable test parsing
- Feature toggles via variables (create_rds) for flexible deployments
- No deletion protection for easy cleanup in CI environments
*/