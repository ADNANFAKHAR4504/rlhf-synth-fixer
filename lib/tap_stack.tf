########################################
# Data-Only Terraform for CI/CD
# Reads existing infrastructure, no resources created
########################################

########################################
# Variables
########################################
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "myapp"
}

########################################
# Locals
########################################
locals {
  base_tags = {
    Owner     = "sivav-cmd"
    ManagedBy = "terraform"
  }

  common_tags = merge(local.base_tags, {
    Project     = var.project_name
    Environment = var.environment
  })
}

########################################
# Data Sources (read-only)
########################################

# VPC
data "aws_vpc" "main" {
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Public Subnet(s)
data "aws_subnet" "public" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-public-subnet-1"]
  }
}

# Private Subnet(s)
data "aws_subnet" "private" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-private-subnet-1"]
  }
}

# Security Groups
data "aws_security_group" "web" {
  filter {
    name   = "group-name"
    values = ["${var.project_name}-web-sg"]
  }
}

data "aws_security_group" "app" {
  filter {
    name   = "group-name"
    values = ["${var.project_name}-app-sg"]
  }
}

data "aws_security_group" "database" {
  filter {
    name   = "group-name"
    values = ["${var.project_name}-db-sg"]
  }
}

# Application Load Balancer
data "aws_lb" "main" {
  name = "${var.project_name}-alb"
}

# Target Group
data "aws_lb_target_group" "app" {
  name = "${var.project_name}-app-tg"
}

# RDS Database (already exists)
data "aws_db_instance" "main" {
  db_instance_identifier = "${var.project_name}-database"
}

# S3 Bucket (already exists)
data "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-bucket-${var.environment}"
}

########################################
# Outputs
########################################

output "vpc_id" {
  value = data.aws_vpc.main.id
}

output "public_subnet_id" {
  value = data.aws_subnet.public.id
}

output "private_subnet_id" {
  value = data.aws_subnet.private.id
}

output "web_security_group_id" {
  value = data.aws_security_group.web.id
}

output "app_security_group_id" {
  value = data.aws_security_group.app.id
}

output "database_security_group_id" {
  value = data.aws_security_group.database.id
}

output "alb_arn" {
  value = data.aws_lb.main.arn
}

output "app_target_group_arn" {
  value = data.aws_lb_target_group.app.arn
}

output "db_instance_endpoint" {
  value     = data.aws_db_instance.main.endpoint
  sensitive = true
}

output "s3_bucket_name" {
  value = data.aws_s3_bucket.main.bucket
}
