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

variable "enable_cloudtrail" {
  description = "Enable CloudTrail resources (set to false if trail limits exceeded)"
  type        = bool
  default     = false
}

variable "enable_rds_replica" {
  description = "Enable RDS read replica in us-west-2"
  type        = bool
  default     = false
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

variable "acm_certificate_arn" {
  description = "The ARN of the existing ACM certificate for the ALB."
  type        = string
  default     = "arn:aws:acm:us-east-1:718240086340:certificate/d3003292-683c-4983-9ac4-e086e5209472"
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

data "aws_region" "current" {}

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

# NAT Gateways
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

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.resource_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-group"
  })
}

# RDS Instance with Customer-Managed KMS Encryption
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

  db_name                       = "financialapp"
  username                      = "dbadmin"
  manage_master_user_password   = true
  master_user_secret_kms_key_id = aws_kms_key.rds_encryption.arn

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

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
      values = ["Security", "Bugfix"]
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

# Application Load Balancer
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

# Data source to get ALB service account for the current region
data "aws_elb_service_account" "main" {}

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

# ALB Target Group
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

# ALB Target Group Attachment
resource "aws_lb_target_group_attachment" "web" {
  count = length(aws_instance.web_servers)

  target_group_arn = aws_lb_target_group.web.arn
  target_id        = aws_instance.web_servers[count.index].id
  port             = 80
}

# ALB Listener - HTTP to HTTPS Redirect
resource "aws_lb_listener" "web_http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = local.common_tags
}

# ALB Listener - HTTPS
resource "aws_lb_listener" "web_https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }

  tags = local.common_tags
}

# API Gateway for comprehensive logging
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

# ===================================================================
# CRITICAL SECURITY ENHANCEMENTS
# ===================================================================

# CloudTrail for audit logging compliance
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = "${local.resource_prefix}-cloudtrail-logs-${random_id.bucket_suffix.hex}"
  force_destroy = var.environment != "production" ? true : false

  tags = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

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
        Resource = aws_s3_bucket.cloudtrail_logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.resource_prefix}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.resource_prefix}-cloudtrail"
          }
        }
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "${local.resource_prefix}-cloudtrail-log-group"
  retention_in_days = 90

  tags = local.common_tags
}

resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${local.resource_prefix}-cloudtrail-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "${local.resource_prefix}-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${aws_cloudwatch_log_group.cloudtrail.name}:*"
      }
    ]
  })
}

resource "aws_cloudtrail" "main" {
  count = var.enable_cloudtrail ? 1 : 0

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]

  name           = "${local.resource_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app_data.arn}/*"]
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  tags = local.common_tags
}

# AWS caller identity already defined at line 63

# SSL/TLS Certificate for HTTPS - Using existing certificate
# resource "aws_acm_certificate" "main" {
#   domain_name       = var.environment_suffix != "" ? "${var.project_name}-${var.environment_suffix}.meerio.com" : "${var.project_name}.meerio.com"
#   validation_method = "DNS"
#
#   subject_alternative_names = [
#     var.environment_suffix != "" ? "*.${var.project_name}-${var.environment_suffix}.meerio.com" : "*.${var.project_name}.meerio.com"
#   ]
#
#   lifecycle {
#     create_before_destroy = true
#   }
#
#   tags = local.common_tags
# }

# AWS Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${local.resource_prefix}-database-credentials"
  description = "Database credentials for RDS instance"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.db_password.result
  })
}

# Random password already defined at line 417

# WAF Web ACL for ALB protection
resource "aws_wafv2_web_acl" "main" {
  name  = "${local.resource_prefix}-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.resource_prefix}-CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.resource_prefix}-KnownBadInputsMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.resource_prefix}-SQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  tags = local.common_tags

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.resource_prefix}-WebACL"
    sampled_requests_enabled   = true
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# CloudWatch Alarms for critical monitoring
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  count = length(aws_instance.web_servers)

  alarm_name          = "${local.resource_prefix}-high-cpu-${count.index}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web_servers[count.index].id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${local.resource_prefix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${local.resource_prefix}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "120"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.resource_prefix}-security-alerts"

  tags = local.common_tags
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# Network ACLs for additional security layer
resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 3306
    to_port    = 3306
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-nacl"
  })
}

resource "aws_network_acl_association" "private" {
  count = length(aws_subnet.private)

  network_acl_id = aws_network_acl.private.id
  subnet_id      = aws_subnet.private[count.index].id
}

resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.main.id

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-nacl"
  })
}

resource "aws_network_acl_association" "public" {
  count = length(aws_subnet.public)

  network_acl_id = aws_network_acl.public.id
  subnet_id      = aws_subnet.public[count.index].id
}

# Additional outputs for new resources
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : null
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
  sensitive   = true
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

# ===================================================================
# MULTI-REGION DEPLOYMENT COMPONENTS
# ===================================================================

# S3 Buckets for Cross-Region Replication (us-west-2)
resource "aws_s3_bucket" "app_data_replica" {
  provider = aws.west
  bucket   = "${local.resource_prefix}-app-data-replica-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-app-data-replica"
    Region = "us-west-2"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.app_data_replica.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "app_data_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.app_data_replica.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "app_data_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.app_data_replica.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail Logs Replica Bucket
resource "aws_s3_bucket" "cloudtrail_logs_replica" {
  provider = aws.west
  bucket   = "${local.resource_prefix}-cloudtrail-logs-replica-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-cloudtrail-logs-replica"
    Region = "us-west-2"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.cloudtrail_logs_replica.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.cloudtrail_logs_replica.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.cloudtrail_logs_replica.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.cloudtrail_logs_replica.id

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
        Resource = aws_s3_bucket.cloudtrail_logs_replica.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:us-west-2:${data.aws_caller_identity.current.account_id}:trail/${local.resource_prefix}-cloudtrail-west"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs_replica.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:us-west-2:${data.aws_caller_identity.current.account_id}:trail/${local.resource_prefix}-cloudtrail-west"
          }
        }
      }
    ]
  })
}

# IAM Role for S3 Cross-Region Replication
resource "aws_iam_role" "s3_replication" {
  name = "${local.resource_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "s3_replication" {
  name = "${local.resource_prefix}-s3-replication-policy"
  role = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = [
          "${aws_s3_bucket.app_data.arn}/*",
          "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_data.arn,
          aws_s3_bucket.cloudtrail_logs.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = [
          "${aws_s3_bucket.app_data_replica.arn}/*",
          "${aws_s3_bucket.cloudtrail_logs_replica.arn}/*"
        ]
      }
    ]
  })
}

# S3 Bucket Replication Configuration - App Data
resource "aws_s3_bucket_replication_configuration" "app_data" {
  depends_on = [aws_s3_bucket_versioning.app_data]
  role       = aws_iam_role.s3_replication.arn
  bucket     = aws_s3_bucket.app_data.id

  rule {
    id     = "replicate-to-west"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.app_data_replica.arn
      storage_class = "STANDARD_IA"
    }
  }
}

# S3 Bucket Replication Configuration - CloudTrail Logs
resource "aws_s3_bucket_replication_configuration" "cloudtrail_logs" {
  depends_on = [
    aws_s3_bucket_versioning.cloudtrail_logs,
    aws_s3_bucket_versioning.cloudtrail_logs_replica
  ]
  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "replicate-cloudtrail-to-west"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.cloudtrail_logs_replica.arn
      storage_class = "STANDARD_IA"
    }
  }
}

# Add versioning to CloudTrail logs bucket for replication
resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# RDS Read Replica in us-west-2
resource "aws_db_instance" "main_replica" {
  provider = aws.west
  count    = var.enable_rds_replica ? 1 : 0

  identifier = "${local.resource_prefix}-database-replica"

  # Read replica configuration
  replicate_source_db = aws_db_instance.main.identifier

  depends_on = [aws_db_instance.main]

  instance_class = "db.t3.micro"

  # Security
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds_encryption_west.arn

  # Backup configuration for read replica
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Destruction settings for testing
  skip_final_snapshot      = true
  deletion_protection      = false
  delete_automated_backups = true

  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-database-replica"
    Region = "us-west-2"
  })
}

# KMS Key for RDS encryption in us-west-2
resource "aws_kms_key" "rds_encryption_west" {
  provider = aws.west

  description             = "KMS key for RDS encryption in us-west-2"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-rds-kms-key-west"
    Region = "us-west-2"
  })
}

resource "aws_kms_alias" "rds_encryption_west" {
  provider = aws.west

  name          = "alias/${local.resource_prefix}-rds-encryption-west"
  target_key_id = aws_kms_key.rds_encryption_west.key_id
}

# CloudTrail in us-west-2
resource "aws_cloudtrail" "west" {
  provider = aws.west
  count    = var.enable_cloudtrail ? 1 : 0

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs_replica]

  name           = "${local.resource_prefix}-cloudtrail-west"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs_replica.bucket

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app_data_replica.arn}/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-cloudtrail-west"
    Region = "us-west-2"
  })
}

# CloudWatch Log Groups for us-west-2
resource "aws_cloudwatch_log_group" "cloudtrail_west" {
  provider = aws.west

  name              = "${local.resource_prefix}-cloudtrail-log-group-west"
  retention_in_days = 90

  tags = merge(local.common_tags, {
    Region = "us-west-2"
  })
}

# SNS Topic for alerts in us-west-2
resource "aws_sns_topic" "alerts_west" {
  provider = aws.west

  name = "${local.resource_prefix}-security-alerts-west"

  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-security-alerts-west"
    Region = "us-west-2"
  })
}

# CloudWatch Alarms for RDS Replica in us-west-2
resource "aws_cloudwatch_metric_alarm" "rds_replica_cpu" {
  provider = aws.west
  count    = var.enable_rds_replica ? 1 : 0

  alarm_name          = "${local.resource_prefix}-rds-replica-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS replica cpu utilization in us-west-2"
  alarm_actions       = [aws_sns_topic.alerts_west.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_replica[0].id
  }

  tags = merge(local.common_tags, {
    Region = "us-west-2"
  })
}

resource "aws_cloudwatch_metric_alarm" "rds_replica_lag" {
  provider = aws.west
  count    = var.enable_rds_replica ? 1 : 0

  alarm_name          = "${local.resource_prefix}-rds-replica-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "60"
  alarm_description   = "This metric monitors RDS replica lag in us-west-2"
  alarm_actions       = [aws_sns_topic.alerts_west.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_replica[0].id
  }

  tags = merge(local.common_tags, {
    Region = "us-west-2"
  })
}

# Multi-Region Outputs
output "app_data_replica_bucket_name" {
  description = "Name of the S3 app data replica bucket in us-west-2"
  value       = aws_s3_bucket.app_data_replica.bucket
}

output "cloudtrail_replica_bucket_name" {
  description = "Name of the CloudTrail replica bucket in us-west-2"
  value       = aws_s3_bucket.cloudtrail_logs_replica.bucket
}

output "rds_replica_endpoint" {
  description = "RDS read replica endpoint in us-west-2"
  value       = var.enable_rds_replica ? aws_db_instance.main_replica[0].endpoint : null
  sensitive   = true
}

output "cloudtrail_west_arn" {
  description = "ARN of the CloudTrail in us-west-2"
  value       = var.enable_cloudtrail ? aws_cloudtrail.west[0].arn : null
}

output "sns_topic_west_arn" {
  description = "ARN of the SNS topic for alerts in us-west-2"
  value       = aws_sns_topic.alerts_west.arn
}

output "kms_key_west_arn" {
  description = "ARN of the KMS key for RDS encryption in us-west-2"
  value       = aws_kms_key.rds_encryption_west.arn
}
