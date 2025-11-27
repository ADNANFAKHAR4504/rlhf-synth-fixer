### Reasoning Trace
---

This is a comprehensive Terraform project for a payment-processing platform with multiple environments using workspaces. Let me break down what needs to be created:

1. Root module configuration (main.tf, providers.tf, variables.tf, outputs.tf)
2. Four child modules:
   - modules/network/* (VPC, subnets, route tables, ACLs)
   - modules/compute/* (ECS cluster, task definition, Fargate service, IAM roles, ALB)
   - modules/database/* (RDS PostgreSQL, subnet group, KMS key, security groups)
   - modules/storage/* (S3 bucket with versioning, lifecycle policy)
3. Environment-specific .tfvars files for dev, staging, and prod
4. Example terraform commands

Key requirements to implement:
- Use Terraform workspaces for environment separation
- No hardcoded values, everything should be parameterized
- Network ACLs and security groups for database isolation
- ECS Fargate with ALB
- RDS PostgreSQL with encryption
- S3 with lifecycle policies
- IAM with least privilege
- CloudWatch logging with retention
- Consistent tagging
- Environment-specific configurations (Multi-AZ for prod, task counts, etc.)

Let me structure this properly:
### Answer 
---

# Payment Processing Platform - Terraform Configuration

I'll provide a complete modular Terraform configuration for a payment-processing platform with workspace-driven deployments. Here's the complete structure:

## Root Module Configuration

### **providers.tf**
```hcl
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
```

### **variables.tf**
```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "payment-processing"
}

variable "vpc_cidr_base" {
  description = "Base CIDR for VPC (first two octets)"
  type        = string
  default     = "10.0"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}

variable "container_image" {
  description = "Docker image for payment processing application"
  type        = string
  default     = "nginx:latest"  # Replace with actual payment app image
}

variable "alb_certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}
```

### **main.tf**
```hcl
locals {
  environment = terraform.workspace
  
  # Environment-specific configurations
  env_config = {
    dev = {
      vpc_cidr           = "${var.vpc_cidr_base}.0.0/16"
      instance_class     = "db.t3.micro"
      multi_az          = false
      task_count        = 1
      task_cpu          = 256
      task_memory       = 512
      log_retention     = 7
      s3_lifecycle_days = 30
      min_capacity      = 1
      max_capacity      = 2
    }
    staging = {
      vpc_cidr           = "${var.vpc_cidr_base}.16.0/16"
      instance_class     = "db.t3.small"
      multi_az          = false
      task_count        = 1
      task_cpu          = 512
      task_memory       = 1024
      log_retention     = 30
      s3_lifecycle_days = 60
      min_capacity      = 1
      max_capacity      = 3
    }
    prod = {
      vpc_cidr           = "${var.vpc_cidr_base}.32.0/16"
      instance_class     = "db.r6g.large"
      multi_az          = true
      task_count        = 3
      task_cpu          = 1024
      task_memory       = 2048
      log_retention     = 90
      s3_lifecycle_days = 90
      min_capacity      = 3
      max_capacity      = 10
    }
  }
  
  current_env_config = local.env_config[local.environment]
  
  common_tags = {
    Environment = local.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }
  
  resource_prefix = "${var.project_name}-${local.environment}"
}

# Network Module
module "network" {
  source = "./modules/network"
  
  vpc_cidr        = local.current_env_config.vpc_cidr
  environment     = local.environment
  project_name    = var.project_name
  azs             = data.aws_availability_zones.available.names
  tags            = local.common_tags
}

# Database Module
module "database" {
  source = "./modules/database"
  
  environment         = local.environment
  project_name       = var.project_name
  subnet_ids         = module.network.private_subnet_ids
  vpc_id            = module.network.vpc_id
  instance_class    = local.current_env_config.instance_class
  multi_az         = local.current_env_config.multi_az
  db_username      = var.db_username
  db_password      = var.db_password
  app_security_group_id = module.compute.ecs_security_group_id
  tags             = local.common_tags
}

# Storage Module
module "storage" {
  source = "./modules/storage"
  
  environment         = local.environment
  project_name       = var.project_name
  lifecycle_days     = local.current_env_config.s3_lifecycle_days
  tags               = local.common_tags
}

# Compute Module
module "compute" {
  source = "./modules/compute"
  
  environment            = local.environment
  project_name          = var.project_name
  vpc_id                = module.network.vpc_id
  public_subnet_ids     = module.network.public_subnet_ids
  private_subnet_ids    = module.network.private_subnet_ids
  task_count           = local.current_env_config.task_count
  task_cpu            = local.current_env_config.task_cpu
  task_memory         = local.current_env_config.task_memory
  container_image     = var.container_image
  s3_bucket_arn      = module.storage.bucket_arn
  db_endpoint        = module.database.db_endpoint
  db_name           = module.database.db_name
  db_username       = var.db_username
  db_password       = var.db_password
  log_retention     = local.current_env_config.log_retention
  certificate_arn   = var.alb_certificate_arn
  min_capacity     = local.current_env_config.min_capacity
  max_capacity     = local.current_env_config.max_capacity
  tags             = local.common_tags
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
```

### **outputs.tf**
```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for transaction logs"
  value       = module.storage.bucket_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.compute.ecs_cluster_name
}
```

## Network Module

### **modules/network/variables.tf**
```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### **modules/network/main.tf**
```hcl
locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.azs[count.index]
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.environment == "prod" ? 2 : 1
  domain = "vpc"
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.environment == "prod" ? 2 : 1
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables - Public
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

# Route Tables - Private
resource "aws_route_table" "private" {
  count  = var.environment == "prod" ? 2 : 1
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = 2
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = 2
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.environment == "prod" ? aws_route_table.private[count.index].id : aws_route_table.private[0].id
}

# Network ACL for Database Subnets
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id
  
  # Allow inbound PostgreSQL traffic only from VPC CIDR
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 5432
    to_port    = 5432
  }
  
  # Allow all outbound traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-database-nacl"
  })
}
```

### **modules/network/outputs.tf**
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}
```

## Database Module

### **modules/database/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for DB subnet group"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "app_security_group_id" {
  description = "Security group ID of the application"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### **modules/database/main.tf**
```hcl
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  db_name     = "paymentdb"
}

# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption - ${var.environment}"
  deletion_window_in_days = 10
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-rds-kms-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = var.subnet_ids
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id
  
  ingress {
    description     = "PostgreSQL from app"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-postgres"
  engine         = "postgres"
  engine_version = "15.4"
  
  instance_class        = var.instance_class
  allocated_storage     = var.environment == "prod" ? 100 : 20
  storage_type          = var.environment == "prod" ? "gp3" : "gp2"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds.arn
  
  db_name  = local.db_name
  username = var.db_username
  password = var.db_password
  
  multi_az               = var.multi_az
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = var.environment == "prod" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  deletion_protection = var.environment == "prod" ? true : false
  skip_final_snapshot = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmmss", timestamp())}" : null
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-postgres"
  })
}
```

### **modules/database/outputs.tf**
```hcl
output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = aws_kms_key.rds.id
}
```

## Storage Module

### **modules/storage/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "lifecycle_days" {
  description = "Days before transitioning to IA and expiring objects"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### **modules/storage/main.tf**
```hcl
locals {
  bucket_name = "${var.project_name}-${var.environment}-transaction-logs-${data.aws_caller_identity.current.account_id}"
}

data "aws_caller_identity" "current" {}

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption - ${var.environment}"
  deletion_window_in_days = 10
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-s3-kms-key"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${var.project_name}-${var.environment}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# S3 Bucket for Transaction Logs
resource "aws_s3_bucket" "transaction_logs" {
  bucket = local.bucket_name
  
  tags = merge(var.tags, {
    Name = local.bucket_name
  })
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id
  
  rule {
    id     = "transition-and-expire"
    status = "Enabled"
    
    transition {
      days          = var.lifecycle_days
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = var.lifecycle_days * 2
      storage_class = "GLACIER"
    }
    
    expiration {
      days = var.lifecycle_days * 4
    }
    
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Block Public Access
resource "aws_s3_bucket_public_access_block" "transaction_logs" {
  bucket = aws_s3_bucket.transaction_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### **modules/storage/outputs.tf**
```hcl
output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.transaction_logs.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.transaction_logs.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3.arn
}
```

## Compute Module

### **modules/compute/variables.tf**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "task_count" {
  description = "Number of ECS tasks to run"
  type        = number
}

variable "task_cpu" {
  description = "CPU units for the task"
  type        = number
}

variable "task_memory" {
  description = "Memory for the task in MB"
  type        = number
}

variable "container_image" {
  description = "Docker image for the container"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  type        = string
}

variable "db_endpoint" {
  description = "RDS endpoint"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "log_retention" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "min_capacity" {
  description = "Minimum number of tasks for auto-scaling"
  type        = number
}

variable "max_capacity" {
  description = "Maximum number of tasks for auto-scaling"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### **modules/compute/main.tf**
```hcl
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  container_name = "payment-processor"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${local.name_prefix}"
  retention_in_days = var.log_retention
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-ecs-logs"
  })
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-task-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
  
  tags = var.tags
}

# IAM Policy for Task Role
resource "aws_iam_role_policy" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.ecs.arn}:*"
      }
    ]
  })
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id
  
  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs" {
  name        = "${local.name_prefix}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id
  
  ingress {
    description     = "Traffic from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-ecs-sg"
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = var.public_subnet_ids
  
  enable_deletion_protection = var.environment == "prod"
  enable_http2              = true
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name        = "${local.name_prefix}-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
  
  deregistration_delay = var.environment == "prod" ? 300 : 30
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-tg"
  })
}

# ALB Listener - HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = var.certificate_arn != "" ? "redirect" : "forward"
    
    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    
    dynamic "forward" {
      for_each = var.certificate_arn == "" ? [1] : []
      content {
        target_group_arn = aws_lb_target_group.main.arn
      }
    }
  }
}

# ALB Listener - HTTPS (if certificate provided)
resource "aws_lb_listener" "https" {
  count = var.certificate_arn != "" ? 1 : 0
  
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"
  
  setting {
    name  = "containerInsights"
    value = var.environment == "prod" ? "enabled" : "disabled"
  }
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-cluster"
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "${local.name_prefix}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([{
    name  = local.container_name
    image = var.container_image
    
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    
    environment = [
      {
        name  = "ENVIRONMENT"
        value = var.environment
      },
      {
        name  = "DB_HOST"
        value = split(":", var.db_endpoint)[0]
      },
      {
        name  = "DB_NAME"
        value = var.db_name
      },
      {
        name  = "DB_USER"
        value = var.db_username
      }
    ]
    
    secrets = [
      {
        name  = "DB_PASSWORD"
        valueFrom = aws_ssm_parameter.db_password.arn
      }
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "ecs"
      }
    }
    
    essential = true
  }])
  
  tags = var.tags
}

# Store DB password in SSM Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/${var.environment}/db/password"
  type  = "SecureString"
  value = var.db_password
  
  tags = var.tags
}

# Grant ECS Task Execution Role access to SSM Parameter
resource "aws_iam_role_policy" "ecs_task_execution_ssm" {
  name = "${local.name_prefix}-ecs-task-execution-ssm"
  role = aws_iam_role.ecs_task_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameters",
        "ssm:GetParameter"
      ]
      Resource = aws_ssm_parameter.db_password.arn
    }]
  })
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "${local.name_prefix}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.task_count
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = local.container_name
    container_port   = 8080
  }
  
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = var.environment == "prod" ? 100 : 50
  
  depends_on = [aws_lb_listener.http]
  
  tags = var.tags
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${local.name_prefix}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70
  }
}

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "memory" {
  name               = "${local.name_prefix}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 70
  }
}

data "aws_region" "current" {}
```

### **modules/compute/outputs.tf**
```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "ecs_security_group_id" {
  description = "Security group ID of ECS tasks"
  value       = aws_security_group.ecs.id
}
```

## Environment Configuration Files

### **environments/dev.tfvars**
```hcl
aws_region      = "us-east-1"
project_name    = "payment-processing"
vpc_cidr_base   = "10.0"
container_image = "nginx:latest"  # Replace with actual payment app image

# Database credentials (use AWS Secrets Manager in production)
db_username = "dbadmin"
db_password = "DevPassword123!"  # Change this!

# Optional: ACM certificate for HTTPS
alb_certificate_arn = ""
```

### **environments/staging.tfvars**
```hcl
aws_region      = "us-east-1"
project_name    = "payment-processing"
vpc_cidr_base   = "10.0"
container_image = "nginx:latest"  # Replace with actual payment app image

# Database credentials (use AWS Secrets Manager in production)
db_username = "dbadmin"
db_password = "StagingPassword456!"  # Change this!

# Optional: ACM certificate for HTTPS
alb_certificate_arn = ""
```

### **environments/prod.tfvars**
```hcl
aws_region      = "us-east-1"
project_name    = "payment-processing"
vpc_cidr_base   = "10.0"
container_image = "nginx:latest"  # Replace with actual payment app image

# Database credentials (use AWS Secrets Manager in production)
db_username = "dbadmin"
db_password = "ProdPassword789!@#"  # Change this!

# Optional: ACM certificate for HTTPS
alb_certificate_arn = ""  # Add your production certificate ARN
```

## Deployment Commands

### **Initial Setup**
```bash
# Initialize Terraform
terraform init

# Create and select dev workspace
terraform workspace new dev
terraform workspace select dev

# Plan and apply for dev environment
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars

# Create and deploy to staging
terraform workspace new staging
terraform workspace select staging
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars

# Create and deploy to production
terraform workspace new prod
terraform workspace select prod
terraform plan -var-file=environments/prod.tfvars
terraform apply -var-file=environments/prod.tfvars
```

### **Switching Between Environments**
```bash
# List workspaces
terraform workspace list

# Switch to dev
terraform workspace select dev
terraform apply -var-file=environments/dev.tfvars

# Switch to staging
terraform workspace select staging
terraform apply -var-file=environments/staging.tfvars

# Switch to prod
terraform workspace select prod
terraform apply -var-file=environments/prod.tfvars
```

### **Destroy Resources**
```bash
# Destroy dev environment
terraform workspace select dev
terraform destroy -var-file=environments/dev.tfvars

# Destroy staging environment
terraform workspace select staging
terraform destroy -var-file=environments/staging.tfvars

# Destroy prod environment (be careful!)
terraform workspace select prod
terraform destroy -var-file=environments/prod.tfvars
```

## Key Features Implemented

1. **Workspace-Driven Configuration**: Each environment (dev/staging/prod) uses Terraform workspaces with specific configurations
2. **Network Isolation**: VPCs with non-overlapping CIDR ranges, Network ACLs restricting database access
3. **Security**: 
   - Environment-specific KMS keys for RDS and S3 encryption
   - Least-privilege IAM policies scoped to environment resources
   - Security groups restricting access between components
4. **High Availability (Production)**:
   - Multi-AZ RDS deployment
   - Multiple NAT gateways
   - Minimum 3 ECS tasks with auto-scaling
5. **Monitoring & Logging**: CloudWatch log groups with environment-specific retention
6. **S3 Lifecycle Management**: Automated transitions to cheaper storage classes and expiration
7. **Tagging**: Consistent tagging across all resources for cost tracking and management

This configuration ensures complete isolation between environments while maintaining code reusability and following AWS best practices.