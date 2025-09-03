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

# Availability Zones
data "aws_availability_zones" "available" {}

# Existing DB Subnet Group
data "aws_db_subnet_group" "main" {
  name = "${var.project_name}-db-subnet-group"
}

# Existing S3 Bucket
data "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-bucket-${var.environment}"
}

########################################
# Resources
########################################

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = local.common_tags
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier              = "${var.project_name}-database"
  engine                  = "mysql"
  engine_version          = "8.0.35"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp2"
  storage_encrypted       = true
  db_name                 = "myappdb"
  username                = "admin"
  password                = "changeme123!" # Use a secure value or variable in production
  vpc_security_group_ids  = []             # Add security group IDs as needed
  db_subnet_group_name    = data.aws_db_subnet_group.main.name
  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false
  tags                    = local.common_tags
}

# S3 Object in existing bucket
resource "aws_s3_object" "test_file" {
  bucket  = data.aws_s3_bucket.main.bucket
  key     = "test.txt"
  content = "integration test file"
  acl     = "private"
}

# Security Groups
resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "Web security group"
  vpc_id      = aws_vpc.main.id
  tags        = local.common_tags
}

resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "App security group"
  vpc_id      = aws_vpc.main.id
  tags        = local.common_tags
}

resource "aws_security_group" "database" {
  name        = "${var.project_name}-db-sg"
  description = "Database security group"
  vpc_id      = aws_vpc.main.id
  tags        = local.common_tags
}

########################################
# Outputs
########################################

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "db_instance_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}

output "s3_bucket_name" {
  value = data.aws_s3_bucket.main.bucket
}

output "web_security_group_id" {
  value = aws_security_group.web.id
}

output "app_security_group_id" {
  value = aws_security_group.app.id
}

output "database_security_group_id" {
  value = aws_security_group.database.id
}
