# Secure AWS Infrastructure with Terraform HCL

This solution provides a production-ready, modular Terraform implementation for a secure AWS infrastructure in the `us-west-2` region, emphasizing security best practices, modularity, and maintainability.

## Infrastructure Components

### 1. Networking Module (`modules/networking/`)
```hcl
# VPC with DNS support
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(var.common_tags, {Name = "${var.project_name}-vpc"})
}

# Public Subnets (2 AZs)
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  tags                    = merge(var.common_tags, {Name = "${var.project_name}-public-subnet-${count.index + 1}"})
}

# Private Subnets (2 AZs)
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  tags              = merge(var.common_tags, {Name = "${var.project_name}-private-subnet-${count.index + 1}"})
}

# NAT Gateway for private subnet internet access
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = merge(var.common_tags, {Name = "${var.project_name}-nat-gateway"})
  depends_on    = [aws_internet_gateway.main]
}

# VPC Flow Logs for monitoring
resource "aws_flow_log" "vpc" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}
```

### 2. Security Module (`modules/security/`)
```hcl
# Web Security Group - Least Privilege
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  vpc_id      = var.vpc_id
  description = "Security group for web servers"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH - Restricted"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.trusted_ip_range] # Restricted to specific IPs only
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group - Web tier access only
resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-"
  vpc_id      = var.vpc_id
  
  ingress {
    description     = "MySQL/Aurora from web tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  ingress {
    description     = "PostgreSQL from web tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
}
```

### 3. Storage Module (`modules/storage/`)
```hcl
# S3 Buckets with KMS Encryption
resource "aws_s3_bucket" "app_data" {
  bucket = "${var.project_name}-app-data-${random_id.bucket_suffix.hex}"
  tags   = merge(var.common_tags, {Purpose = "Application Data Storage"})
}

# Server-Side Encryption with KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket                  = aws_s3_bucket.app_data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning for data protection
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle policies for cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    id     = "log_lifecycle"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}
```

### 4. IAM Module (`modules/iam/`)
```hcl
# EC2 Role with Least Privilege
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

# S3 Access Policy - Specific buckets only
resource "aws_iam_policy" "s3_access" {
  name        = "${var.project_name}-s3-access"
  description = "Policy for S3 access with least privilege"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [for arn in var.s3_bucket_arns : "${arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = var.s3_bucket_arns
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = [var.kms_key_arn]
      }
    ]
  })
}
```

### 5. Root Module Configuration (`main.tf`)
```hcl
terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment       = var.environment
      Project          = var.project_name
      ManagedBy        = "Terraform"
      EnvironmentSuffix = var.environment_suffix
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment_suffix}"
  common_tags = {
    Environment       = var.environment
    Project          = var.project_name
    ManagedBy        = "Terraform"
    EnvironmentSuffix = var.environment_suffix
  }
}

# KMS Key with rotation
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = merge(local.common_tags, {Name = "${local.name_prefix}-kms-key"})
}

# Module invocations with proper dependencies
module "networking" {
  source               = "./modules/networking"
  project_name         = local.name_prefix
  environment          = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  common_tags         = local.common_tags
}

module "security" {
  source           = "./modules/security"
  project_name     = local.name_prefix
  environment      = var.environment
  vpc_id          = module.networking.vpc_id
  trusted_ip_range = var.trusted_ip_range
  common_tags      = local.common_tags
}

module "storage" {
  source       = "./modules/storage"
  project_name = local.name_prefix
  environment  = var.environment
  kms_key_id   = aws_kms_key.main.id
  common_tags  = local.common_tags
  depends_on   = [aws_kms_key.main]
}

module "iam" {
  source         = "./modules/iam"
  project_name   = local.name_prefix
  environment    = var.environment
  kms_key_arn    = aws_kms_key.main.arn
  s3_bucket_arns = module.storage.bucket_arns
  common_tags    = local.common_tags
}
```

## Key Security Features

### 1. **Network Isolation**
- Public and private subnet separation
- NAT Gateway for controlled outbound internet access from private subnets
- VPC Flow Logs for network monitoring

### 2. **Encryption at Rest**
- KMS encryption for all S3 buckets
- KMS key rotation enabled
- Bucket key enabled for performance optimization

### 3. **Access Control**
- IAM roles with least privilege principle
- Security groups with minimal required access
- SSH restricted to specific IP ranges only
- Database access limited to web tier only

### 4. **Data Protection**
- S3 versioning enabled on all buckets
- Public access blocked on all S3 buckets
- Lifecycle policies for cost optimization

### 5. **Monitoring & Compliance**
- VPC Flow Logs to CloudWatch
- Consistent tagging for resource management
- Environment suffix for multi-environment deployments

## Deployment Variables
```hcl
variable "aws_region" {
  default = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  default = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "trusted_ip_range" {
  description = "Trusted IP range for SSH access"
  type        = string
}
```

## Outputs
```hcl
output "vpc_id" {
  value = module.networking.vpc_id
}

output "nat_gateway_public_ip" {
  value = module.networking.nat_gateway_public_ip
}

output "s3_bucket_names" {
  value = module.storage.bucket_names
}

output "kms_key_id" {
  value = aws_kms_key.main.id
}

output "security_group_ids" {
  value = module.security.security_group_ids
}

output "iam_role_arns" {
  value = module.iam.role_arns
}
```

## Deployment Commands
```bash
# Initialize Terraform with S3 backend
terraform init \
  -backend-config="bucket=terraform-state-bucket" \
  -backend-config="key=${ENVIRONMENT_SUFFIX}/terraform.tfstate" \
  -backend-config="region=us-west-2"

# Plan deployment
terraform plan -var="environment_suffix=${ENVIRONMENT_SUFFIX}"

# Apply infrastructure
terraform apply -auto-approve -var="environment_suffix=${ENVIRONMENT_SUFFIX}"

# Destroy infrastructure (when needed)
terraform destroy -auto-approve -var="environment_suffix=${ENVIRONMENT_SUFFIX}"
```

This implementation provides a secure, scalable, and maintainable AWS infrastructure that follows Terraform and AWS best practices, ready for production deployment.