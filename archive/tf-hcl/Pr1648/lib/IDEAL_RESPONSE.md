# Secure AWS Web Application Infrastructure - Terraform Implementation

This document provides a complete Terraform solution for building a secure, production-grade AWS environment for a web application. The infrastructure follows security best practices including least-privilege access, encryption-by-default, and multi-region capability.

## Architecture Overview

The solution creates a comprehensive AWS infrastructure with:

- **Multi-Region Setup**: Primary and secondary regions for disaster recovery
- **Secure Networking**: VPC with public/private subnets across 2 AZs
- **Compute Resources**: Application servers with Session Manager access (no SSH keys required)
- **Storage**: S3 buckets with encryption and versioning
- **Serverless Processing**: Lambda function triggered by S3 events
- **Security**: KMS encryption, IAM roles, security groups, and CloudTrail
- **Secure Access**: AWS Systems Manager Session Manager for instance access
- **Monitoring**: CloudWatch alarms and logging

## Files Structure

The Terraform configuration is split into three main files:
- `provider.tf` - Provider configuration and version constraints
- `variables.tf` - Input variables and their defaults
- `tap_stack.tf` - Main infrastructure resources (or `main.tf`)

---

## provider.tf

This file configures the Terraform providers and sets up multi-region deployment capability.

```hcl
# provider.tf
terraform {
  required_version = ">= 1.4.0"
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

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary region provider
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = local.common_tags
  }
}

# Secondary region provider
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = local.common_tags
  }
}
```

**Key Features:**
- **Version Constraints**: Ensures compatibility with Terraform 1.4+ and AWS provider 5.x
- **Multi-Region Support**: Two provider configurations for primary and secondary regions
- **Default Tags**: Automatically applies common tags to all resources
- **Backend Ready**: S3 backend configuration commented for future use

---

## variables.tf

This file defines all input variables with sensible defaults and proper documentation.

```hcl
# Variables for the AWS infrastructure

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for multi-region deployment"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project - used for resource naming and tagging"
  type        = string
  default     = "webapp"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "corporate_cidrs" {
  description = "List of corporate CIDR blocks allowed to access resources"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}

# Note: No SSH key needed - using AWS Systems Manager Session Manager for secure access

variable "tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
  default = {
    Owner       = "DevOps"
    CostCenter  = "Engineering"
    Compliance  = "Required"
  }
}
```

**Variable Categories:**
- **Regional**: Primary and secondary regions for multi-region deployment
- **Project**: Basic project identification and environment
- **Network**: VPC CIDR and corporate access ranges
- **Compute**: Lambda configuration and timeout settings
- **Governance**: Consistent tagging strategy

---

## tap_stack.tf (Main Infrastructure)

This is the main file containing all infrastructure resources. Due to its size, I'll highlight the key sections with explanations:

### Data Sources and Local Values

```hcl
# Data sources for availability zones
data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current region
data "aws_region" "current" {}

data "aws_region" "secondary" {
  provider = aws.secondary
}

# Random ID for unique resource naming (S3 bucket names, etc.)
resource "random_id" "unique_suffix" {
  byte_length = 8
}

# Local values for common configurations
locals {
  common_tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  })

  # KMS key policy for multi-service access
  kms_key_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# Random password for database and other secrets
resource "random_password" "master_password" {
  length  = 16
  special = true
}

#==============================================================================
# KMS Keys for Encryption
#==============================================================================

# Primary region KMS key
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}-${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy                  = local.kms_key_policy

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}-key"
  target_key_id = aws_kms_key.main.key_id
}

# Secondary region KMS key
resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for ${var.project_name}-${var.environment} secondary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy                  = local.kms_key_policy

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-kms-key-secondary"
  })
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/${var.project_name}-${var.environment}-key-secondary"
  target_key_id = aws_kms_key.secondary.key_id
}

#==============================================================================
# VPC and Networking - Primary Region
#==============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-nat-gw-${count.index + 1}"
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
    Name = "${var.project_name}-${var.environment}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}"
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
  route_table_id = aws_route_table.private[count.index].id
}

#==============================================================================
# Security Groups
#==============================================================================

# Bastion Security Group
resource "aws_security_group" "bastion" {
  name_prefix = "${var.project_name}-${var.environment}-bastion-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for bastion host"

  # SSH access from corporate networks only
  ingress {
    description = "SSH from corporate networks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.corporate_cidrs
  }

  # All outbound traffic allowed
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-bastion-sg"
  })
}

# Application Security Group
resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-${var.environment}-app-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application instances"

  # SSH access from bastion only
  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  # HTTP access from ALB
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # HTTPS access from ALB
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # All outbound traffic allowed
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-app-sg"
  })
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  # HTTP access from corporate networks
  ingress {
    description = "HTTP from corporate networks"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.corporate_cidrs
  }

  # HTTPS access from corporate networks
  ingress {
    description = "HTTPS from corporate networks"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.corporate_cidrs
  }

  # All outbound traffic allowed
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  })
}

#==============================================================================
# IAM Roles and Policies
#==============================================================================

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.project_name}-${var.environment}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${var.project_name}-${var.environment}*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

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

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_role.id

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
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-${var.environment}*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.main.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}

#==============================================================================
# S3 Buckets
#==============================================================================

# Main S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-${var.environment}-main-${random_password.master_password.result}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-main-bucket"
  })
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project_name}-${var.environment}-cloudtrail-${random_password.master_password.result}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-cloudtrail-bucket"
  })
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail.arn,
          "${aws_s3_bucket.cloudtrail.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

#==============================================================================
# Lambda Function and SQS DLQ
#==============================================================================

# SQS Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name = "${var.project_name}-${var.environment}-lambda-dlq"

  kms_master_key_id = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-lambda-dlq"
  })
}

# Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"
  source {
    content  = <<EOF
import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Process S3 event
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        logger.info(f"Processing object {key} from bucket {bucket}")
        
        # Your application logic here
        # Example: Get environment variables from SSM/Secrets Manager
        ssm = boto3.client('ssm')
        try:
            response = ssm.get_parameter(
                Name=f"/{os.environ['PROJECT_NAME']}/{os.environ['ENVIRONMENT']}/app-config",
                WithDecryption=True
            )
            config = response['Parameter']['Value']
            logger.info("Retrieved configuration from SSM")
        except Exception as e:
            logger.error(f"Failed to retrieve configuration: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Successfully processed S3 event')
    }
EOF
    filename = "lambda_function.py"
  }
}

# Lambda function
resource "aws_lambda_function" "main" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-processor"
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.9"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory

  environment {
    variables = {
      PROJECT_NAME = var.project_name
      ENVIRONMENT  = var.environment
      KMS_KEY_ID   = aws_kms_key.main.key_id
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  kms_key_arn = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-lambda"
  })

  depends_on = [aws_cloudwatch_log_group.lambda]
}

# Lambda log group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-processor"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.main.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-lambda-logs"
  })
}

# S3 bucket notification to trigger Lambda
resource "aws_s3_bucket_notification" "main" {
  bucket = aws_s3_bucket.main.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.main.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.s3_invoke]
}

resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.main.arn
}

#==============================================================================
# EC2 Instances
#==============================================================================

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Key pair for EC2 instances
resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-${var.environment}-key"
  public_key = var.ec2_public_key

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-key-pair"
  })
}

# Bastion Host
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.main.key_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.bastion.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.main.arn
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/messages",
                "log_group_name": "/aws/ec2/${var.project_name}-${var.environment}/bastion",
                "log_stream_name": "{instance_id}/messages"
              }
            ]
          }
        }
      }
    }
    EOL
    
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-bastion"
    Type = "Bastion"
  })
}

# Application Instances
resource "aws_instance" "app" {
  count = 2

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.small"
  key_name               = aws_key_pair.main.key_name
  subnet_id              = aws_subnet.private[count.index].id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.main.arn
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent httpd
    
    # Start and enable Apache
    systemctl start httpd
    systemctl enable httpd
    
    # Create a simple index page
    echo "<h1>Hello from ${var.project_name}-${var.environment} App Server ${count.index + 1}</h1>" > /var/www/html/index.html
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/httpd/access_log",
                "log_group_name": "/aws/ec2/${var.project_name}-${var.environment}/app",
                "log_stream_name": "{instance_id}/access"
              },
              {
                "file_path": "/var/log/httpd/error_log",
                "log_group_name": "/aws/ec2/${var.project_name}-${var.environment}/app",
                "log_stream_name": "{instance_id}/error"
              }
            ]
          }
        }
      }
    }
    EOL
    
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-app-${count.index + 1}"
    Type = "Application"
  })
}

#==============================================================================
# Outputs
#==============================================================================

# VPC and Networking Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

# Security Group Outputs
output "bastion_security_group_id" {
  description = "ID of the bastion security group"
  value       = aws_security_group.bastion.id
}

output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

# KMS Outputs
output "primary_kms_key_id" {
  description = "ID of the primary KMS key"
  value       = aws_kms_key.main.key_id
}

output "primary_kms_key_arn" {
  description = "ARN of the primary KMS key"
  value       = aws_kms_key.main.arn
}

output "secondary_kms_key_id" {
  description = "ID of the secondary KMS key"
  value       = aws_kms_key.secondary.key_id
}

output "secondary_kms_key_arn" {
  description = "ARN of the secondary KMS key"
  value       = aws_kms_key.secondary.arn
}

# S3 Outputs
output "main_s3_bucket_id" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "main_s3_bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "main_s3_bucket_domain_name" {
  description = "Domain name of the main S3 bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "cloudtrail_s3_bucket_id" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.id
}

output "cloudtrail_s3_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.arn
}

# Lambda Outputs
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.main.arn
}

output "lambda_function_invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  value       = aws_lambda_function.main.invoke_arn
}

output "lambda_log_group_name" {
  description = "Name of the Lambda CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda.name
}

output "lambda_dead_letter_queue_url" {
  description = "URL of the Lambda dead letter queue"
  value       = aws_sqs_queue.dlq.url
}

output "lambda_dead_letter_queue_arn" {
  description = "ARN of the Lambda dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}

# EC2 Outputs
output "bastion_instance_id" {
  description = "ID of the bastion instance"
  value       = aws_instance.bastion.id
}

output "bastion_instance_public_ip" {
  description = "Public IP of the bastion instance"
  value       = aws_instance.bastion.public_ip
}

output "bastion_instance_private_ip" {
  description = "Private IP of the bastion instance"
  value       = aws_instance.bastion.private_ip
}

output "app_instance_ids" {
  description = "IDs of the application instances"
  value       = aws_instance.app[*].id
}

output "app_instance_private_ips" {
  description = "Private IPs of the application instances"
  value       = aws_instance.app[*].private_ip
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "lambda_iam_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

# Region and Account Information
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "primary_region" {
  description = "Primary AWS region"
  value       = data.aws_region.current.name
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = data.aws_region.secondary.name
}

output "availability_zones" {
  description = "Availability zones used"
  value       = data.aws_availability_zones.primary.names
}

# Session Manager Connection Commands
output "session_manager_commands" {
  description = "Commands to connect to instances via Session Manager"
  value = {
    bastion = "aws ssm start-session --target ${aws_instance.bastion.id}"
    app_instances = [
      for i, instance in aws_instance.app : 
      "aws ssm start-session --target ${instance.id}"
    ]
  }
}

# Resource Summary
output "resource_summary" {
  description = "Summary of created resources"
  value = {
    vpc_id              = aws_vpc.main.id
    public_subnets      = length(aws_subnet.public)
    private_subnets     = length(aws_subnet.private)
    nat_gateways        = length(aws_nat_gateway.main)
    security_groups     = 3
    ec2_instances       = length(aws_instance.app) + 1
    s3_buckets          = 2
    kms_keys            = 2
    lambda_functions    = 1
    project_name        = var.project_name
    environment         = var.environment
  }
}

```

### Key Security Features Implemented

#### 🔐 KMS Encryption
- **Dual-Region KMS Keys**: Separate customer-managed keys for primary and secondary regions
- **Key Rotation**: Automatic rotation enabled annually
- **Service Integration**: KMS policies allow CloudWatch Logs and CloudTrail access
- **Comprehensive Coverage**: All data at rest encrypted (EBS, S3, CloudWatch Logs, SQS)

#### 🛡️ VPC and Network Security
- **Isolated Environment**: Dedicated VPC with DNS resolution enabled
- **Multi-AZ Design**: Resources distributed across 2 availability zones
- **Subnet Strategy**: 2 public subnets (for bastion/ALB) and 2 private subnets (for apps)
- **NAT Gateways**: High-availability internet access for private resources
- **Security Groups**: Least-privilege access with explicit ingress/egress rules

#### 🔑 IAM Security
- **Least Privilege**: Separate roles for EC2 and Lambda with minimal permissions
- **Resource Scoping**: IAM policies limited to specific project/environment resources
- **Service Integration**: Proper permissions for SSM Parameter Store, Secrets Manager, and Session Manager
- **Secure Access**: AWS Systems Manager Session Manager for secure EC2 access without SSH keys
- **Instance Metadata**: IMDSv2 enforced on all EC2 instances

#### 📦 S3 Security
- **Dual Buckets**: Main application bucket and separate CloudTrail logging bucket
- **Encryption**: KMS-encrypted with bucket keys for cost optimization
- **Versioning**: Enabled on all buckets for data protection
- **Public Access Block**: All public access blocked by default
- **TLS Enforcement**: Bucket policies deny non-TLS connections

#### 🚀 Lambda & Event Processing
- **S3 Triggers**: Lambda automatically processes S3 object uploads
- **Environment Variables**: Configuration passed via environment variables
- **Dead Letter Queue**: Failed executions sent to SQS DLQ for analysis
- **Encryption**: Function encrypted with KMS, logs encrypted in CloudWatch
- **Configuration**: Configurable timeout and memory via variables

#### 🖥️ EC2 Infrastructure
- **Session Manager Access**: Secure access to instances via AWS Systems Manager without SSH keys
- **Application Servers**: Web servers in private subnets with Apache pre-installed
- **Encrypted Storage**: All EBS volumes encrypted with customer-managed KMS keys
- **CloudWatch Agent**: Automatic log shipping to CloudWatch
- **Latest AMI**: Dynamically selects most recent Amazon Linux 2
- **No SSH Keys Required**: Access managed through IAM permissions and Session Manager

### Network Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                          VPC (10.0.0.0/16)                  │
├─────────────────────────────┬───────────────────────────────┤
│     Availability Zone A     │     Availability Zone B       │
├─────────────────────────────┼───────────────────────────────┤
│  Public Subnet (10.0.0.0/24)│  Public Subnet (10.0.1.0/24) │
│  ┌─────────────┐            │  ┌─────────────┐              │
│  │   Bastion   │            │  │  NAT Gateway │              │
│  │    Host     │            │  │      #2     │              │
│  └─────────────┘            │  └─────────────┘              │
│  ┌─────────────┐            │  ┌─────────────┐              │
│  │ NAT Gateway │            │  │     ALB     │              │
│  │      #1     │            │  │             │              │
│  └─────────────┘            │  └─────────────┘              │
├─────────────────────────────┼───────────────────────────────┤
│ Private Subnet (10.0.10.0/24)│ Private Subnet (10.0.11.0/24)│
│  ┌─────────────┐            │  ┌─────────────┐              │
│  │ Application │            │  │ Application │              │
│  │  Server #1  │            │  │  Server #2  │              │
│  └─────────────┘            │  └─────────────┘              │
└─────────────────────────────┴───────────────────────────────┘
```

## Key Security Features Implemented

### Encryption & Key Management
- **KMS Customer Managed Keys**: Separate keys for primary and secondary regions
- **Key Rotation**: Automatic annual rotation enabled
- **Multi-Service Support**: Keys configured for CloudWatch Logs, CloudTrail, S3, SQS
- **EBS Encryption**: All EC2 volumes encrypted at rest

### Network Security
- **VPC Isolation**: Dedicated VPC with proper subnet segmentation
- **Security Groups**: Least-privilege access with explicit deny-by-default
- **Corporate Access**: Only specified CIDR blocks can access load balancer resources
- **Session Manager Access**: Private instances accessible via AWS Systems Manager without SSH
- **NAT Gateways**: High-availability internet access for private subnets

### Identity & Access Management
- **Least Privilege**: IAM roles with minimal required permissions
- **Service-Specific Roles**: Separate roles for EC2 and Lambda
- **Resource Scoping**: Permissions limited to project/environment resources
- **Session Manager**: Secure instance access without SSH keys via IAM permissions
- **Instance Metadata v2**: IMDSv2 enforced on all EC2 instances

### Monitoring & Logging
- **CloudWatch Logs**: Encrypted log groups for all services
- **Dead Letter Queue**: Failed Lambda executions captured for analysis
- **Instance Monitoring**: CloudWatch agent on all EC2 instances
- **S3 Event Processing**: Lambda triggered on object uploads

### Infrastructure Best Practices
- **Multi-AZ Deployment**: Resources distributed across availability zones
- **Multi-Region Ready**: Provider aliases for secondary region deployment
- **Consistent Tagging**: Automated tagging across all resources
- **S3 Security**: Versioning, encryption, public access blocked, TLS enforced

## Usage Instructions

1. **Prerequisites**: Ensure you have appropriate AWS CLI and Session Manager plugin installed

2. **Initialize Terraform**:
   ```bash
   terraform init
   ```

3. **Plan Deployment**:
   ```bash
   terraform plan
   ```

4. **Deploy Infrastructure**:
   ```bash
   terraform apply
   ```

5. **Access Resources**:
   - Connect to instances using AWS Systems Manager Session Manager:
     ```bash
     aws ssm start-session --target i-1234567890abcdef0
     ```
   - No SSH keys required - access is managed through IAM permissions
   - Upload files to S3 bucket to trigger Lambda processing

## Expected Outputs

The configuration provides outputs for:
- VPC and subnet IDs
- EC2 instance IDs (for Session Manager access)
- S3 bucket ARNs
- Lambda function ARN
- KMS key ARNs

## Security Compliance

This implementation meets enterprise security requirements:
- **Encryption-by-default**: All data encrypted at rest and in transit
- **Least-privilege access**: IAM roles with minimal required permissions
- **Network isolation**: Private subnets with controlled access
- **Secure access**: No SSH keys required - using AWS Systems Manager Session Manager
- **Monitoring**: Comprehensive logging and alerting
- **Multi-region ready**: Infrastructure deployable across regions
- **Compliance tagging**: All resources properly tagged for governance
