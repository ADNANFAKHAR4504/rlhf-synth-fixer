# AWS Infrastructure Configuration - Ideal Response

This Terraform configuration creates a production-ready cloud environment with S3 storage, RDS PostgreSQL database, and EC2 instance with all the latest AWS features and best practices.

## provider.tf

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
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
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

## tap_stack.tf

```hcl
########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "cloud-environment"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming isolation"
  type        = string
  default     = "dev"
}

########################
# Data Sources
########################
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

########################
# S3 Bucket with Latest Features
########################
resource "aws_s3_bucket" "project_files" {
  bucket        = "${var.project_name}-${var.environment_suffix}-${random_string.bucket_suffix.result}"
  force_destroy = true # Enable cleanup capability

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-project-files"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Enable versioning for data protection
resource "aws_s3_bucket_versioning" "project_files" {
  bucket = aws_s3_bucket.project_files.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access for security
resource "aws_s3_bucket_public_access_block" "project_files" {
  bucket = aws_s3_bucket.project_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable encryption with S3 default data integrity protections
resource "aws_s3_bucket_server_side_encryption_configuration" "project_files" {
  bucket = aws_s3_bucket.project_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true # Enable S3 Bucket Keys for cost optimization
  }
}

########################
# VPC and Networking
########################
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-vpc"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-igw"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Public subnets for EC2 instances
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-public-subnet-${count.index + 1}"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Private subnets for RDS Multi-AZ
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-private-subnet-${count.index + 1}"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-public-rt"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

########################
# Security Groups
########################
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-${var.environment_suffix}-ec2-sg"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Consider restricting in production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-ec2-sg"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment_suffix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id] # Only from EC2
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-rds-sg"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

########################
# EC2 Instance
########################
resource "aws_instance" "dev" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t2.micro"
  key_name               = aws_key_pair.dev.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]
  subnet_id              = aws_subnet.public[0].id

  # Enable IMDSv2 for enhanced security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-dev-instance"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "tls_private_key" "dev" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "dev" {
  key_name   = "${var.project_name}-${var.environment_suffix}-dev-key"
  public_key = tls_private_key.dev.public_key_openssh

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-dev-key"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

########################
# RDS PostgreSQL with Latest Features
########################
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment_suffix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-db-subnet-group"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-${var.environment_suffix}-postgres"

  # Storage Configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3" # Latest GP3 storage for better performance
  storage_encrypted     = true

  # Engine Configuration
  engine         = "postgres"
  engine_version = "15.8"
  instance_class = "db.t4g.micro" # Graviton2-based instance for better performance/cost

  # Database Configuration
  db_name  = "appdb"
  username = "dbadmin"
  password = random_password.db_password.result

  # Network Configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # High Availability
  multi_az            = true
  publicly_accessible = false

  # Backup Configuration
  backup_retention_period = 7
  backup_window          = "07:00-09:00"
  maintenance_window     = "sun:09:00-sun:10:00"

  # Cleanup Configuration
  skip_final_snapshot = true
  deletion_protection = false # Enable cleanup capability

  # Performance Insights (disabled for t4g.micro)
  performance_insights_enabled = false

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-postgres"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

########################
# Outputs
########################
output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.project_files.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.project_files.arn
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.dev.id
}

output "ec2_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.dev.public_ip
}

output "ec2_private_ip" {
  description = "Private IP of the EC2 instance"
  value       = aws_instance.dev.private_ip
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgres.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

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

output "private_key_pem" {
  description = "Private key for EC2 access"
  value       = tls_private_key.dev.private_key_pem
  sensitive   = true
}
```

## Key Improvements

1. **Environment Isolation**: Added `environment_suffix` variable for resource naming to prevent conflicts between multiple deployments.

2. **Latest AWS Features**:
   - S3: Bucket Keys enabled for cost optimization with encryption
   - RDS: Graviton2-based instance (`db.t4g.micro`) for better performance/cost
   - RDS: GP3 storage type for improved performance
   - EC2: IMDSv2 enforced for enhanced security

3. **Security Best Practices**:
   - All public access blocked on S3 bucket
   - Encryption enabled for both S3 and RDS storage
   - RDS only accessible from EC2 security group
   - IMDSv2 required on EC2 instance

4. **High Availability**:
   - RDS Multi-AZ deployment for automatic failover
   - Resources spread across multiple availability zones
   - Proper subnet segregation (public/private)

5. **Cleanup Capability**:
   - `force_destroy = true` on S3 bucket
   - `deletion_protection = false` on RDS
   - `skip_final_snapshot = true` on RDS

6. **Operational Excellence**:
   - Comprehensive tagging strategy
   - Meaningful output values for integration
   - Proper resource dependencies
   - Clear variable descriptions

7. **Cost Optimization**:
   - S3 Bucket Keys for reduced KMS costs
   - Graviton2 instances for better price/performance
   - GP3 storage for better IOPS/cost ratio

This configuration provides a production-ready, secure, and cost-optimized infrastructure that meets all requirements while incorporating the latest AWS features and best practices.