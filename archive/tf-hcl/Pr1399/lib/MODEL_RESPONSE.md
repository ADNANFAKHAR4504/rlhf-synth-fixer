I'll help you create a clean, modular Terraform setup for your AWS environments. Based on your requirements, here's a comprehensive solution:

## Directory Structure

First, let's expand your directory structure to be more modular and environment-aware:

```
├── environments/
│   ├── dev/
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── terraform.tfvars
│       └── backend.tf
├── modules/
│   └── tap_stack/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── versions.tf
├── main.tf
├── variables.tf
├── outputs.tf
├── provider.tf
└── versions.tf
```

## Core Configuration Files

### `provider.tf`

```hcl
# Configure the AWS Provider
terraform {
  required_version = ">= 1.0"

  backend "s3" {
    # Backend configuration will be provided via backend config files
    # or command line during terraform init
  }

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
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment   = var.environment
      Project       = var.project_name
      ManagedBy     = "Terraform"
      Owner         = var.owner
      CostCenter    = var.cost_center
    }
  }
}

# Data source for current AWS account info
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

### `main.tf` (Root module that calls your tap_stack module)

```hcl
# Main Terraform configuration that orchestrates the tap_stack module
module "tap_stack" {
  source = "./modules/tap_stack"

  # Environment configuration
  environment    = var.environment
  project_name   = var.project_name
  aws_region     = var.aws_region

  # Infrastructure sizing based on environment
  instance_type     = var.instance_type
  min_capacity      = var.min_capacity
  max_capacity      = var.max_capacity
  desired_capacity  = var.desired_capacity

  # Database configuration
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_engine_version    = var.db_engine_version

  # Security and networking
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  enable_nat_gateway   = var.enable_nat_gateway
  enable_vpn_gateway   = var.enable_vpn_gateway

  # Monitoring and logging
  enable_detailed_monitoring = var.enable_detailed_monitoring
  log_retention_days        = var.log_retention_days

  # Backup and maintenance
  backup_retention_period = var.backup_retention_period
  maintenance_window     = var.maintenance_window
  backup_window         = var.backup_window

  # Tags
  owner       = var.owner
  cost_center = var.cost_center

  # Secrets
  db_master_username_secret_name = var.db_master_username_secret_name
  db_master_password_secret_name = var.db_master_password_secret_name
  api_key_secret_name           = var.api_key_secret_name
}
```

### `variables.tf` (Root variables)

```hcl
# Core environment variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap-stack"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
}

# Infrastructure sizing variables
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_capacity" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

# Database variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "13.13"
}

# Network variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway"
  type        = bool
  default     = true
}

variable "enable_vpn_gateway" {
  description = "Enable VPN Gateway"
  type        = bool
  default     = false
}

# Monitoring variables
variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

# Backup variables
variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "maintenance_window" {
  description = "RDS maintenance window"
  type        = string
  default     = "sun:03:00-sun:04:00"
}

variable "backup_window" {
  description = "RDS backup window"
  type        = string
  default     = "02:00-03:00"
}

# Secret variables
variable "db_master_username_secret_name" {
  description = "Name of the secret containing DB master username"
  type        = string
  default     = "tap-stack/db/master-username"
}

variable "db_master_password_secret_name" {
  description = "Name of the secret containing DB master password"
  type        = string
  default     = "tap-stack/db/master-password"
}

variable "api_key_secret_name" {
  description = "Name of the secret containing API key"
  type        = string
  default     = "tap-stack/api-key"
}
```

### `modules/tap_stack/main.tf`

```hcl
# Local values for computed configurations
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Environment-specific configurations
  is_production = var.environment == "prod"

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Owner       = var.owner
    CostCenter  = var.cost_center
  }
}

# Random password for database (stored in Secrets Manager)
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "db_master_username" {
  name                    = "${local.name_prefix}-${var.db_master_username_secret_name}"
  description             = "Database master username for ${var.environment}"
  recovery_window_in_days = local.is_production ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_master_username" {
  secret_id     = aws_secretsmanager_secret.db_master_username.id
  secret_string = "admin"
}

resource "aws_secretsmanager_secret" "db_master_password" {
  name                    = "${local.name_prefix}-${var.db_master_password_secret_name}"
  description             = "Database master password for ${var.environment}"
  recovery_window_in_days = local.is_production ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_master_password" {
  secret_id     = aws_secretsmanager_secret.db_master_password.id
  secret_string = random_password.db_password.result
}

# API Key secret
resource "aws_secretsmanager_secret" "api_key" {
  name                    = "${local.name_prefix}-${var.api_key_secret_name}"
  description             = "API key for ${var.environment}"
  recovery_window_in_days = local.is_production ? 30 : 0

  tags = local.common_tags
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
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

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateways (conditional based on environment)
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
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
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
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

# Security Groups
resource "aws_security_group" "web" {
  name        = "${local.name_prefix}-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
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
    Name = "${local.name_prefix}-web-sg"
  })
}

resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-db-sg"
  description = "Security group for database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-sg"
  })
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-database"

  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = replace("${var.project_name}_${var.environment}", "-", "_")
  username = aws_secretsmanager_secret_version.db_master_username.secret_string
  password = aws_secretsmanager_secret_version.db_master_password.secret_string

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  skip_final_snapshot       = !local.is_production
  final_snapshot_identifier = local.is_production ? "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  monitoring_interval = var.enable_detailed_monitoring ? 60 : 0
  monitoring_role_arn = var.enable_detailed_monitoring ? aws_iam_role.rds_monitoring[0].arn : null

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
  })
}

# IAM Role for RDS Enhanced Monitoring (conditional)
resource "aws_iam_role" "rds_monitoring" {
  count = var.enable_detailed_monitoring ? 1 : 0

  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.enable_detailed_monitoring ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/application/${local.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}
```

### `modules/tap_stack/variables.tf`

```hcl
# All the variables that the module accepts
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
}

# Infrastructure variables
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_capacity" {
  description = "Minimum number of instances"
  type        = number
}

variable "max_capacity" {
  description = "Maximum number of instances"
  type        = number
}

variable "desired_capacity" {
  description = "Desired number of instances"
  type        = number
}

# Database variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
}

# Network variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway"
  type        = bool
}

variable "enable_vpn_gateway" {
  description = "Enable VPN Gateway"
  type        = bool
}

# Monitoring variables
variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

# Backup variables
variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
}

variable "maintenance_window" {
  description = "RDS maintenance window"
  type        = string
}

variable "backup_window" {
  description = "RDS backup window"
  type        = string
}

# Secret variables
variable "db_master_username_secret_name" {
  description = "Name of the secret containing DB master username"
  type        = string
}

variable "db_master_password_secret_name" {
  description = "Name of the secret containing DB master password"
  type        = string
}

variable "api_key_secret_name" {
  description = "Name of the secret containing API key"
  type        = string
}
```

## Environment-Specific Configuration

### `environments/dev/terraform.tfvars`

```hcl
# Development environment configuration
environment = "dev"
aws_region  = "us-west-2"

# Smaller instances for dev
instance_type    = "t3.micro"
min_capacity     = 1
max_capacity     = 2
desired_capacity = 1

# Smaller database for dev
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
db_engine_version    = "13.13"

# Dev network settings
vpc_cidr           = "10.0.0.0/16"
enable_nat_gateway = false  # Save costs in dev
enable_vpn_gateway = false

# Minimal monitoring for dev
enable_detailed_monitoring = false
log_retention_days        = 3

# Shorter backup retention for dev
backup_retention_period = 1
maintenance_window     = "sun:03:00-sun:04:00"
backup_window         = "02:00-03:00"

# Tags
owner       = "dev-team"
cost_center = "development"
```

### `environments/dev/backend.tf`

```hcl
# Development backend configuration
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "tap-stack/dev/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
```

### `environments/staging/terraform.tfvars`

```hcl
# Staging environment configuration
environment = "staging"
aws_region  = "us-west-2"

# Medium instances for staging
instance_type    = "t3.small"
min_capacity     = 1
max_capacity     = 3
desired_capacity = 2

# Medium database for staging
db_instance_class    = "db.t3.small"
db_allocated_storage = 50
db_engine_version    = "13.13"

# Staging network settings
vpc_cidr           = "10.1.0.0/16"
enable_nat_gateway = true
enable_vpn_gateway = false

# Standard monitoring for staging
enable_detailed_monitoring = true
log_retention_days        = 7

# Standard backup retention for staging
backup_retention_period = 7
maintenance_window     = "sun:03:00-sun:04:00"
backup_window         = "02:00-03:00"

# Tags
owner       = "staging-team"
cost_center = "staging"
```

### `environments/prod/terraform.tfvars`

```hcl
# Production environment configuration
environment = "prod"
aws_region  = "us-west-2"

# Larger instances for production
instance_type    = "t3.medium"
min_capacity     = 2
max_capacity     = 10
desired_capacity = 3

# Larger database for production
db_instance_class    = "db.t3.medium"
db_allocated_storage = 100
db_engine_version    = "13.13"

# Production network settings
vpc_cidr           = "10.2.0.0/16"
enable_nat_gateway = true
enable_vpn_gateway = true

# Full monitoring for production
enable_detailed_monitoring = true
log_retention_days        = 30

# Longer backup retention for production
backup_retention_period = 30
maintenance_window     = "sun:03:00-sun:04:00"
backup_window         = "02:00-03:00"

# Tags
owner       = "platform-team"
cost_center = "production"
```

## Usage Instructions

### 1. **Initialize Backend Resources** (One-time setup)

First, create the S3 bucket and DynamoDB table for state management:

```bash
# Create S3 bucket for state files
aws s3 mb s3://your-terraform-state-bucket --region us-west-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2
```

### 2. **Deploy to Different Environments**

```bash
# For Development
terraform init -backend-config=environments/dev/backend.tf
terraform plan -var-file=environments/dev/terraform.tfvars
terraform apply -var-file=environments/dev/terraform.tfvars

# For Staging
terraform init -backend-config=environments/staging/backend.tf -reconfigure
terraform plan -var-file=environments/staging/terraform.tfvars
terraform apply -var-file=environments/staging/terraform.tfvars

# For Production
terraform init -backend-config=environments/prod/backend.tf -reconfigure
terraform plan -var-file=environments/prod/terraform.tfvars
terraform apply -var-file=environments/prod/terraform.tfvars
```

## Key Features of This Setup

- Environment Separation: Each environment has its own state file and configuration
- Shared Backend: All environments use the same S3 bucket with different keys
- No Hardcoding: All environment-specific values are in .tfvars files
- Secure Secrets: Database passwords and API keys stored in AWS Secrets Manager
- Modular Design: Core infrastructure is in a reusable module
- Environment-Aware: Different configurations for dev/staging/prod (costs, monitoring, etc.)
- Clean Structure: Easy to understand and maintain
- Validation: Input validation ensures only valid environments are used

This setup gives you complete environment isolation while maintaining consistency and reusability across your AWS infrastructure!
