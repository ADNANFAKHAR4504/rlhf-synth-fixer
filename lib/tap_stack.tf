########################################
# Data-Only Terraform for CI/CD
# All resources are assumed to be managed by pipeline
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

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
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
# Data Sources (CI/CD Read-Only)
########################################
########################################
# Data Sources (CI/CD Read-Only)
########################################

# VPC
data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-vpc"]
  }
  filter {
    name   = "isDefault"
    values = ["false"]
  }
  # Optionally, add more filters or use 'id' if you know the VPC ID
}

# Public Subnets
data "aws_subnet" "public" {
  for_each   = toset(var.public_subnet_cidrs)
  cidr_block = each.value
  vpc_id     = data.aws_vpc.main.id
}

# Private Subnets
data "aws_subnet" "private" {
  for_each   = toset(var.private_subnet_cidrs)
  cidr_block = each.value
  vpc_id     = data.aws_vpc.main.id
}

# Security Groups
data "aws_security_group" "web" {
  name   = "${var.project_name}-web-sg"
  vpc_id = data.aws_vpc.main.id
}

data "aws_security_group" "app" {
  name   = "${var.project_name}-app-sg"
  vpc_id = data.aws_vpc.main.id
}

data "aws_security_group" "database" {
  name   = "${var.project_name}-db-sg"
  vpc_id = data.aws_vpc.main.id
}

# Application Load Balancer
data "aws_lb" "main" {
  name = "${var.project_name}-alb"
}

# Target Group
data "aws_lb_target_group" "app" {
  name = "${var.project_name}-app-tg"
}

# RDS Database
data "aws_db_instance" "main" {
  db_instance_identifier = "${var.project_name}-database"
}


# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket        = "${var.project_name}-bucket-${var.environment}"
  force_destroy = true
  tags          = local.common_tags
}


########################################
# Outputs
########################################

output "vpc_id" {
  value = data.aws_vpc.main.id
}

output "public_subnet_ids" {
  value = [for s in data.aws_subnet.public : s.id]
}

output "private_subnet_ids" {
  value = [for s in data.aws_subnet.private : s.id]
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
  value = aws_s3_bucket.main.bucket
}
