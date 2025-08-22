# Secure Financial Application Infrastructure - Terraform Configuration

## Complete Infrastructure Solution

This document presents the production-ready Terraform configuration for a highly secure AWS infrastructure designed to host a critical financial application, implementing all required security controls and best practices.

### Key Improvements

- **Environment Isolation**: Added `environment_suffix` variable for resource naming to enable multiple deployments
- **Resource Destruction Safety**: Configured all resources to be cleanly destroyable
- **Provider Management**: Separated provider configuration from main stack
- **Comprehensive Testing**: Full unit and integration test coverage
- **Security Hardening**: Enhanced security group configurations and IAM policies

## Infrastructure Code

### provider.tf
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
      version = ">= 3.1"
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

### tap_stack.tf
```hcl
# tap_stack.tf - Secure Financial Application Infrastructure

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "financial-app"
}

variable "owner" {
  description = "Owner for resource tagging"
  type        = string
  default     = "platform-team"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# Local values
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "terraform"
  }

  private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24"]

  # Add suffix to resource names for uniqueness
  resource_prefix = var.environment_suffix != "" ? "${var.project_name}-${var.environment_suffix}" : var.project_name
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_elb_service_account" "main" {}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds_encryption" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
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
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rds-kms-key"
  })
}

resource "aws_kms_alias" "rds_encryption" {
  name          = "alias/${local.resource_prefix}-rds-encryption"
  target_key_id = aws_kms_key.rds_encryption.key_id
}

# VPC Foundation
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# NAT Gateways for High Availability
resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-gateway-${count.index + 1}"
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
    Name = "${local.resource_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups (Default-Deny with Explicit Allow Rules)
resource "aws_security_group" "web_tier" {
  name_prefix = "${local.resource_prefix}-web-"
  description = "Security group for web tier - default deny with explicit allow"
  vpc_id      = aws_vpc.main.id

  # Explicit ingress rules only for necessary traffic
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-web-sg"
  })
}

resource "aws_security_group" "alb" {
  name_prefix = "${local.resource_prefix}-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alb-sg"
  })
}

resource "aws_security_group" "database" {
  name_prefix = "${local.resource_prefix}-db-"
  description = "Security group for RDS database - default deny"
  vpc_id      = aws_vpc.main.id

  # Only allow database access from web tier
  ingress {
    description     = "MySQL/Aurora from web tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier.id]
  }

  # No outbound rules needed for database
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-sg"
  })
}

# S3 Bucket with AES-256 Encryption
resource "aws_s3_bucket" "app_data" {
  bucket = "${local.resource_prefix}-app-data-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-app-data-bucket"
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# RDS Database with Customer-Managed KMS Encryption
resource "aws_db_subnet_group" "main" {
  name       = "${local.resource_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-group"
  })
}

resource "aws_db_instance" "main" {
  identifier = "${local.resource_prefix}-database"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_encryption.arn

  db_name  = "financialapp"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = true
  deletion_protection       = false

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-database"
  })
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

# IAM Roles and Policies with MFA Enforcement
resource "aws_iam_role" "ec2_role" {
  name = "${local.resource_prefix}-ec2-role"

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

resource "aws_iam_policy" "ec2_ssm_policy" {
  name        = "${local.resource_prefix}-ec2-ssm-policy"
  description = "Policy for EC2 instances to use Systems Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel",
          "ec2messages:AcknowledgeMessage",
          "ec2messages:DeleteMessage",
          "ec2messages:FailMessage",
          "ec2messages:GetEndpoint",
          "ec2messages:GetMessages",
          "ec2messages:SendReply"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "iam:*",
          "aws-portal:*"
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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_ssm_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.resource_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# EC2 Instances in Private Subnets
resource "aws_instance" "web_servers" {
  count = length(aws_subnet.private)

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private[count.index].id
  vpc_security_group_ids = [aws_security_group.web_tier.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data_base64 = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-ssm-agent
              systemctl enable amazon-ssm-agent
              systemctl start amazon-ssm-agent
              EOF
  )

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  tags = merge(local.common_tags, {
    Name       = "${local.resource_prefix}-web-server-${count.index + 1}"
    PatchGroup = "${local.resource_prefix}-web-servers"
  })
}

# Systems Manager Patch Manager Configuration
resource "aws_ssm_patch_baseline" "security_patches" {
  name             = "${local.resource_prefix}-security-patches"
  description      = "Patch baseline for security updates"
  operating_system = "AMAZON_LINUX_2023"

  approval_rule {
    approve_after_days  = 0
    compliance_level    = "HIGH"
    enable_non_security = false

    patch_filter {
      key    = "CLASSIFICATION"
      values = ["Security", "Bugfix", "Critical"]
    }

    patch_filter {
      key    = "SEVERITY"
      values = ["Critical", "Important"]
    }
  }

  tags = local.common_tags
}

resource "aws_ssm_patch_group" "web_servers" {
  baseline_id = aws_ssm_patch_baseline.security_patches.id
  patch_group = "${local.resource_prefix}-web-servers"
}

resource "aws_ssm_maintenance_window" "patch_window" {
  name                       = "${local.resource_prefix}-patch-window"
  description                = "Maintenance window for patching"
  schedule                   = "cron(0 2 ? * SUN *)" # Every Sunday at 2 AM
  duration                   = 3
  cutoff                     = 1
  allow_unassociated_targets = false

  tags = local.common_tags
}

resource "aws_ssm_maintenance_window_target" "web_servers" {
  window_id     = aws_ssm_maintenance_window.patch_window.id
  name          = "${local.resource_prefix}-web-servers-target"
  description   = "Web servers maintenance target"
  resource_type = "INSTANCE"

  targets {
    key    = "tag:PatchGroup"
    values = ["${local.resource_prefix}-web-servers"]
  }
}

resource "aws_ssm_maintenance_window_task" "patch_task" {
  window_id        = aws_ssm_maintenance_window.patch_window.id
  name             = "${local.resource_prefix}-patch-task"
  description      = "Patch management task"
  task_type        = "RUN_COMMAND"
  task_arn         = "AWS-RunPatchBaseline"
  priority         = 1
  service_role_arn = aws_iam_role.ssm_maintenance_role.arn
  max_concurrency  = "2"
  max_errors       = "1"

  targets {
    key    = "WindowTargetIds"
    values = [aws_ssm_maintenance_window_target.web_servers.id]
  }

  task_invocation_parameters {
    run_command_parameters {
      parameter {
        name   = "Operation"
        values = ["Install"]
      }

      timeout_seconds = 3600
    }
  }
}

# IAM Role for SSM Maintenance Window
resource "aws_iam_role" "ssm_maintenance_role" {
  name = "${local.resource_prefix}-ssm-maintenance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ssm_maintenance" {
  role       = aws_iam_role.ssm_maintenance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonSSMMaintenanceWindowRole"
}

# Application Load Balancer with Access Logging
resource "aws_lb" "main" {
  name               = "${local.resource_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alb"
  })
}

# S3 Bucket for ALB Access Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.resource_prefix}-alb-logs-${random_id.alb_bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alb-logs"
  })
}

resource "random_id" "alb_bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConsoleAutoGen"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
      }
    ]
  })
}

# ALB Target Group and Listener
resource "aws_lb_target_group" "web" {
  name     = "${local.resource_prefix}-web-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-web-tg"
  })
}

resource "aws_lb_target_group_attachment" "web" {
  count = length(aws_instance.web_servers)

  target_group_arn = aws_lb_target_group.web.arn
  target_id        = aws_instance.web_servers[count.index].id
  port             = 80
}

resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }

  tags = local.common_tags
}

# API Gateway with Comprehensive Logging
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.resource_prefix}-api"
  description = "Main API Gateway for financial application"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_mock" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "health_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "health_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  status_code = aws_api_gateway_method_response.health_200.status_code

  response_templates = {
    "application/json" = jsonencode({
      message   = "API is healthy"
      timestamp = "$context.requestTime"
    })
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "API-Gateway-Execution-Logs_${aws_api_gateway_rest_api.main.id}/prod"
  retention_in_days = 14

  tags = local.common_tags
}

# API Gateway Deployment with Access Logging
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_method.health_get,
    aws_api_gateway_integration.health_mock,
    aws_api_gateway_integration_response.health_200
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "prod"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = local.common_tags
}

# Outputs (No secrets exposed)
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = join(",", aws_subnet.private[*].id)
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = join(",", aws_subnet.public[*].id)
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for application data"
  value       = aws_s3_bucket.app_data.bucket
}

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "kms_key_id" {
  description = "ID of the KMS key used for RDS encryption"
  value       = aws_kms_key.rds_encryption.key_id
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = join(",", aws_instance.web_servers[*].id)
}

output "patch_baseline_id" {
  description = "ID of the SSM patch baseline"
  value       = aws_ssm_patch_baseline.security_patches.id
}
```

## Key Security Features Implemented

### Network Security
- **VPC Foundation**: All resources deployed within isolated VPC with proper CIDR planning
- **Multi-AZ Deployment**: Resources spread across multiple availability zones for high availability
- **Private Subnet Isolation**: EC2 instances deployed in private subnets with NAT gateway access
- **Default-Deny Security Groups**: All security groups block inbound traffic by default with explicit allow rules only

### Data Protection
- **Encryption at Rest**: 
  - S3 buckets with AES-256 encryption
  - RDS with customer-managed KMS key encryption
  - EBS volumes encrypted by default
- **KMS Key Rotation**: Automatic rotation enabled for all KMS keys
- **S3 Bucket Policies**: Proper bucket policies for ALB access logs

### Identity and Access Management
- **IAM with MFA Enforcement**: Critical actions require MFA authentication
- **Least Privilege**: IAM roles and policies follow principle of least privilege
- **Instance Profiles**: EC2 instances use IAM instance profiles for secure API access

### Logging and Monitoring
- **API Gateway Access Logging**: Comprehensive request/response logging
- **ALB Access Logs**: Load balancer access patterns tracked
- **CloudWatch Log Groups**: Centralized logging with retention policies

### Vulnerability Management
- **SSM Patch Manager**: Automated patching for security vulnerabilities
- **Maintenance Windows**: Scheduled patching during low-traffic periods
- **Patch Groups**: Organized patching strategy for different instance types

### Infrastructure as Code Best Practices
- **Environment Isolation**: Environment suffix for resource naming enables multiple deployments
- **Resource Tagging**: Consistent tagging strategy for cost allocation and management
- **Modular Design**: Separated provider configuration from main stack
- **Clean Destruction**: All resources configured to be cleanly destroyable
- **Data Sources**: Using AWS data sources for AMI selection and account information
- **Random IDs**: Unique resource naming to avoid conflicts