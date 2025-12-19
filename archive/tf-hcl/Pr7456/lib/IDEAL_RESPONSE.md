
## tap_stack.tf

```hcl
# tap_stack.tf - Multi-Environment Payment Platform Infrastructure

# ================================
# DATA SOURCES
# ================================

# Get available AZs in the current region
data "aws_availability_zones" "available" {
  state = "available"
}

# Get existing VPC (if exists) or create new one
data "aws_vpcs" "existing" {
  filter {
    name   = "tag:Environment"
    values = [var.environment_suffix]
  }
  filter {
    name   = "tag:Project"
    values = [var.project_name]
  }
}

# ================================
# LOCALS - Environment-specific configurations
# ================================

locals {
  # Environment-specific configurations
  environment_config = {
    dev = {
      # Regional configuration
      region                = "eu-west-1"
      vpc_cidr              = "10.1.0.0/16"
      availability_zones    = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
      private_subnet_cidrs  = ["10.1.10.0/24", "10.1.20.0/24", "10.1.30.0/24"]
      public_subnet_cidrs   = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
      database_subnet_cidrs = ["10.1.100.0/24", "10.1.200.0/24", "10.1.250.0/24"]

      # RDS configuration
      db_instance_class          = "db.t3.micro"
      db_backup_retention_period = 7
      db_multi_az                = false

      # ALB configuration
      alb_instance_count = 1

      # S3 lifecycle configuration
      s3_archive_days = 30
    }
    staging = {
      # Regional configuration
      region                = "us-west-2"
      vpc_cidr              = "10.2.0.0/16"
      availability_zones    = ["us-west-2a", "us-west-2b", "us-west-2c"]
      private_subnet_cidrs  = ["10.2.10.0/24", "10.2.20.0/24", "10.2.30.0/24"]
      public_subnet_cidrs   = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
      database_subnet_cidrs = ["10.2.100.0/24", "10.2.200.0/24", "10.2.250.0/24"]

      # RDS configuration
      db_instance_class          = "db.t3.small"
      db_backup_retention_period = 14
      db_multi_az                = false

      # ALB configuration
      alb_instance_count = 2

      # S3 lifecycle configuration
      s3_archive_days = 60
    }
    prod = {
      # Regional configuration
      region                = "us-east-1"
      vpc_cidr              = "10.3.0.0/16"
      availability_zones    = ["us-east-1a", "us-east-1b", "us-east-1c"]
      private_subnet_cidrs  = ["10.3.10.0/24", "10.3.20.0/24", "10.3.30.0/24"]
      public_subnet_cidrs   = ["10.3.1.0/24", "10.3.2.0/24", "10.3.3.0/24"]
      database_subnet_cidrs = ["10.3.100.0/24", "10.3.200.0/24", "10.3.250.0/24"]

      # RDS configuration
      db_instance_class          = "db.r6g.large"
      db_backup_retention_period = 30
      db_multi_az                = true

      # ALB configuration
      alb_instance_count = 3

      # S3 lifecycle configuration
      s3_archive_days = 90
    }
  }

  # Current environment configuration
  current_config = local.environment_config[var.environment_suffix]

  # Common tags
  common_tags = {
    Project     = var.project_name
    Environment = var.environment_suffix
    Repository  = var.repository
    Author      = var.commit_author
    PRNumber    = var.pr_number
    Team        = var.team
    ManagedBy   = "Terraform"
  }

  # Resource naming with environment prefix
  name_prefix = "${var.environment_suffix}-${var.project_name}"
}

# ================================
# KMS KEYS FOR ENCRYPTION
# ================================

# KMS key for RDS encryption (environment-specific)
resource "aws_kms_key" "rds_encryption" {
  description             = "KMS key for RDS encryption in ${var.environment_suffix} environment"
  deletion_window_in_days = var.environment_suffix == "prod" ? 30 : 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-rds-kms-key"
    Service = "RDS"
  })
}

resource "aws_kms_alias" "rds_encryption" {
  name          = "alias/${local.name_prefix}-rds-encryption"
  target_key_id = aws_kms_key.rds_encryption.key_id
}

# KMS key for S3 encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 encryption in ${var.environment_suffix} environment"
  deletion_window_in_days = var.environment_suffix == "prod" ? 30 : 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-s3-kms-key"
    Service = "S3"
  })
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/${local.name_prefix}-s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# ================================
# VPC AND NETWORKING
# ================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.current_config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets (for ALB)
resource "aws_subnet" "public" {
  count = length(local.current_config.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.current_config.public_subnet_cidrs[count.index]
  availability_zone       = local.current_config.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets (for application servers)
resource "aws_subnet" "private" {
  count = length(local.current_config.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.current_config.private_subnet_cidrs[count.index]
  availability_zone = local.current_config.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets (for RDS)
resource "aws_subnet" "database" {
  count = length(local.current_config.database_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.current_config.database_subnet_cidrs[count.index]
  availability_zone = local.current_config.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-subnet-${count.index + 1}"
    Type = "Database"
  })
}

# NAT Gateways for private subnet internet access
resource "aws_eip" "nat" {
  count = length(aws_subnet.public)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = length(aws_subnet.public)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = length(aws_subnet.private)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route table associations
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

# ================================
# SECURITY GROUPS
# ================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.main.id

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

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Application Security Group
resource "aws_security_group" "application" {
  name_prefix = "${local.name_prefix}-app-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "App port from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Security Group - Only accessible from application subnets
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from application"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
  }

  # Additional ingress for private subnet CIDR blocks (least privilege)
  dynamic "ingress" {
    for_each = local.current_config.private_subnet_cidrs
    content {
      description = "PostgreSQL from private subnet ${ingress.value}"
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ================================
# RDS MODULE
# ================================

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  # Database configuration
  identifier            = "${local.name_prefix}-payment-db"
  engine                = var.db_engine
  engine_version        = var.db_engine_version
  instance_class        = local.current_config.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2

  # Database settings
  db_name  = "paymentdb"
  username = "dbadmin"
  manage_master_user_password = true

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # High availability
  multi_az = local.current_config.db_multi_az

  # Backup configuration
  backup_retention_period = local.current_config.db_backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds_encryption.arn

  # Deletion protection
  deletion_protection       = var.environment_suffix == "prod"
  skip_final_snapshot       = var.environment_suffix != "prod"
  final_snapshot_identifier = var.environment_suffix == "prod" ? "${local.name_prefix}-payment-db-final-snapshot" : null

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-db"
  })
}

# ================================
# APPLICATION LOAD BALANCER MODULE
# ================================

# ALB
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-payment-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment_suffix == "prod"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-alb"
  })
}

# Target Group for applications
resource "aws_lb_target_group" "app" {
  name     = "${local.name_prefix}-app-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-tg"
  })
}

# ALB Listener
resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-listener"
  })
}

# ================================
# S3 MODULE
# ================================

# S3 Bucket for application assets
resource "aws_s3_bucket" "assets" {
  bucket = "${local.name_prefix}-payment-assets-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-payment-assets"
  })
}

# Random ID for bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "archive_old_objects"
    status = "Enabled"

    transition {
      days          = local.current_config.s3_archive_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = local.current_config.s3_archive_days + 30
      storage_class = "GLACIER"
    }

    transition {
      days          = local.current_config.s3_archive_days + 120 # Must be 90+ days after GLACIER
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_expiration {
      noncurrent_days = local.current_config.s3_archive_days
    }
  }
}

# ================================
# IAM ROLES AND POLICIES
# ================================

# IAM Role for EC2 instances (for ECS or direct EC2)
resource "aws_iam_role" "app_role" {
  name = "${local.name_prefix}-app-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-role"
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "app_profile" {
  name = "${local.name_prefix}-app-profile"
  role = aws_iam_role.app_role.name
}

# IAM Policy for S3 access
resource "aws_iam_role_policy" "app_s3_policy" {
  name = "${local.name_prefix}-app-s3-policy"
  role = aws_iam_role.app_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Resource = "${aws_s3_bucket.assets.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.assets.arn
      }
    ]
  })
}
```

## variables.tf

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment_suffix)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  default     = "payment-platform"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

# Database configuration
variable "db_engine" {
  description = "Database engine type"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.10"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "The allocated storage in gigabytes"
  type        = number
  default     = 20
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access resources"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}
```

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
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}

```

## outputs.tf

```hcl
# outputs.tf - Infrastructure Outputs

# ================================
# RDS OUTPUTS
# ================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = false
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "rds_master_user_secret_arn" {
  description = "ARN of the RDS master user secret"
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
  sensitive   = true
}

# ================================
# APPLICATION LOAD BALANCER OUTPUTS
# ================================

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

# ================================
# S3 OUTPUTS
# ================================

output "s3_bucket_name" {
  description = "Name of the S3 bucket for application assets"
  value       = aws_s3_bucket.assets.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.assets.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.assets.bucket_domain_name
}

# ================================
# ENVIRONMENT SUMMARY
# ================================

output "environment_summary" {
  description = "Summary of deployed environment"
  value = {
    environment       = var.environment_suffix
    project_name      = var.project_name
    region            = var.aws_region
    vpc_id            = aws_vpc.main.id
    vpc_cidr          = aws_vpc.main.cidr_block
    database_endpoint = aws_db_instance.main.endpoint
    alb_dns_name      = aws_lb.main.dns_name
    s3_bucket_name    = aws_s3_bucket.assets.bucket
  }
}

# ================================
# SECURITY OUTPUTS
# ================================

output "security_group_ids" {
  description = "IDs of created security groups"
  value = {
    alb_sg         = aws_security_group.alb.id
    application_sg = aws_security_group.application.id
    rds_sg         = aws_security_group.rds.id
  }
}

# ================================
# KMS OUTPUTS
# ================================

output "kms_key_arns" {
  description = "ARNs of KMS keys for encryption"
  value = {
    rds_kms_key = aws_kms_key.rds_encryption.arn
    s3_kms_key  = aws_kms_key.s3_encryption.arn
  }
}

# ================================
# NETWORKING OUTPUTS
# ================================

output "subnet_ids" {
  description = "IDs of created subnets"
  value = {
    public_subnets   = aws_subnet.public[*].id
    private_subnets  = aws_subnet.private[*].id
    database_subnets = aws_subnet.database[*].id
  }
}

output "nat_gateway_ips" {
  description = "Elastic IPs of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# ================================
# IAM OUTPUTS
# ================================

output "iam_role_arn" {
  description = "ARN of the application IAM role"
  value       = aws_iam_role.app_role.arn
}

output "instance_profile_name" {
  description = "Name of the instance profile"
  value       = aws_iam_instance_profile.app_profile.name
}

# ================================
# MONITORING OUTPUTS
# ================================

output "cloudwatch_log_group_name" {
  description = "Name of the VPC Flow Logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "alb_logs_bucket_name" {
  description = "Name of the ALB access logs S3 bucket"
  value       = aws_s3_bucket.alb_logs.bucket
}

# ================================
# SECURITY OUTPUTS
# ================================

output "kms_rds_key_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds_encryption.arn
}

output "kms_s3_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.arn
}
```

