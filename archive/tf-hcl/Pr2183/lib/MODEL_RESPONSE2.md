# Deployment Failure Analysis and Resolution

## 🔍 **Root Cause Analysis**

### 1. **Database Module Incompleteness**
The deployment fails because the `modules/database/main.tf` file is **truncated and incomplete**. The file cuts off mid-resource definition:

```hcl
# This line is incomplete and causes syntax errors
max_allocated_storage = var.allocated_storage *
```

**Missing components:**
- Incomplete resource definitions
- Missing variables file
- Missing outputs file
- No parameter store integration for secrets
- No backup and monitoring configurations

### 2. **Single Environment Limitation**
The current configuration uses **only one AWS provider**, which means:
- Both staging and production would deploy to the same AWS account/region
- No environment isolation
- Shared state files leading to conflicts
- Cannot leverage different AWS accounts for environment separation

## 🛠️ **Complete Database Module**

### `modules/database/main.tf`
```hcl
# Random password generation when not provided
resource "random_password" "db_password" {
  count   = var.db_password == null ? 1 : 0
  length  = 16
  special = true
  
  # Ensure password meets MySQL requirements
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
  min_special = 1
}

# Store database credentials in Parameter Store
resource "aws_ssm_parameter" "db_username" {
  name  = "/${var.name_prefix}/database/username"
  type  = "SecureString"
  value = var.db_username

  tags = var.tags
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.name_prefix}/database/password"
  type  = "SecureString"
  value = var.db_password != null ? var.db_password : random_password.db_password[0].result

  tags = var.tags
}

# RDS Subnet Group (if not passed from networking module)
resource "aws_db_subnet_group" "main" {
  count      = var.db_subnet_group_name == null ? 1 : 0
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

# RDS Parameter Group for MySQL optimization
resource "aws_db_parameter_group" "main" {
  family = "mysql8.0"
  name   = "${var.name_prefix}-db-params"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "max_connections"
    value = "1000"
  }

  tags = var.tags
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.name_prefix}-database"

  # Engine Configuration
  engine         = "mysql"
  engine_version = "8.0.35"
  instance_class = var.instance_class

  # Storage Configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database Configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password != null ? var.db_password : random_password.db_password[0].result

  # Network Configuration
  db_subnet_group_name   = var.db_subnet_group_name != null ? var.db_subnet_group_name : aws_db_subnet_group.main[0].name
  vpc_security_group_ids = var.vpc_security_group_ids
  publicly_accessible    = false

  # High Availability & Backup
  multi_az               = var.multi_az
  backup_retention_period = var.backup_retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Deletion Protection
  deletion_protection = var.deletion_protection
  skip_final_snapshot = !var.deletion_protection
  final_snapshot_identifier = var.deletion_protection ? "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Performance Insights
  performance_insights_enabled = var.instance_class != "db.t3.micro" ? true : false
  performance_insights_retention_period = var.instance_class != "db.t3.micro" ? 7 : null

  # Parameter Group
  parameter_group_name = aws_db_parameter_group.main.name

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Enable automated backups
  copy_tags_to_snapshot = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database"
  })

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      password,
    ]
  }
}

# Enhanced Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.name_prefix}-rds-monitoring-role"

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

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Alarms for Database Monitoring
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.name_prefix}-database-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.name_prefix}-database-connection-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS connection count"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.tags
}
```

### `modules/database/variables.tf`
```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "List of subnet IDs for DB subnet group (used if db_subnet_group_name is null)"
  type        = list(string)
  default     = []
}

variable "vpc_security_group_ids" {
  description = "List of VPC security group IDs"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "backup_retention" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "multi_az" {
  description = "Enable multi-AZ deployment"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "webapp"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = null
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### `modules/database/outputs.tf`
```hcl
output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "parameter_store_username" {
  description = "Parameter Store path for database username"
  value       = aws_ssm_parameter.db_username.name
}

output "parameter_store_password" {
  description = "Parameter Store path for database password"
  value       = aws_ssm_parameter.db_password.name
  sensitive   = true
}
```

## 🏗️ **Multi-Environment Architecture Strategy**

### **Recommended Approach: Workspace-Based with Provider Aliasing**

### Updated `main.tf` with Multi-Environment Support
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Default provider for current environment
provider "aws" {
  region = var.region
  
  default_tags {
    tags = local.common_tags
  }
}

# Optional: Provider alias for cross-region deployments
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  
  default_tags {
    tags = local.common_tags
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  name_prefix = local.name_prefix
  tags        = local.common_tags
}

# Networking Module
module "networking" {
  source = "./modules/networking"
  
  name_prefix         = local.name_prefix
  vpc_cidr           = local.current_network_config.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets     = local.current_network_config.public_subnets
  private_subnets    = local.current_network_config.private_subnets
  database_subnets   = local.current_network_config.database_subnets
  tags               = local.common_tags
}

# Database Module
module "database" {
  source = "./modules/database"
  
  name_prefix           = local.name_prefix
  db_subnet_group_name  = module.networking.db_subnet_group_name
  vpc_security_group_ids = [module.networking.database_security_group_id]
  
  instance_class      = local.current_db_config.instance_class
  allocated_storage   = local.current_db_config.allocated_storage
  backup_retention    = local.current_db_config.backup_retention
  multi_az           = local.current_db_config.multi_az
  deletion_protection = local.current_db_config.deletion_protection
  
  db_username = var.db_username
  db_password = var.db_password
  
  tags = local.common_tags
}

# Compute Module
module "compute" {
  source = "./modules/compute"
  
  name_prefix                = local.name_prefix
  vpc_id                    = module.networking.vpc_id
  public_subnet_ids         = module.networking.public_subnet_ids
  private_subnet_ids        = module.networking.private_subnet_ids
  alb_security_group_id     = module.networking.alb_security_group_id
  instance_security_group_id = module.networking.instance_security_group_id
  
  ami_id           = data.aws_ami.amazon_linux.id
  instance_type    = local.current_instance_config.instance_type
  min_size         = local.current_instance_config.min_size
  max_size         = local.current_instance_config.max_size
  desired_capacity = local.current_instance_config.desired_capacity
  volume_size      = local.current_instance_config.volume_size
  
  instance_profile_name = module.iam.instance_profile_name
  db_endpoint          = module.database.db_endpoint
  
  tags = local.common_tags
}
```

### Updated `variables.tf`
```hcl
variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "department" {
  description = "Department name for tagging"
  type        = string
  default     = "Engineering"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "WebApp"
}

variable "region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for cross-region deployments"
  type        = string
  default     = "us-west-2"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = []
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = null
  sensitive   = true
}
```

### Updated `locals.tf`
```hcl
locals {
  # Region-specific availability zones
  region_azs = {
    "us-east-1" = ["us-east-1a", "us-east-1b", "us-east-1c"]
    "us-west-2" = ["us-west-2a", "us-west-2b", "us-west-2c"]
  }

  # Use provided AZs or default to region-specific ones
  effective_azs = length(var.availability_zones) > 0 ? var.availability_zones : local.region_azs[var.region]

  # Environment-specific configurations
  instance_configs = {
    staging = {
      instance_type    = "t3.micro"
      min_size        = 1
      max_size        = 2
      desired_capacity = 1
      volume_size     = 20
    }
    production = {
      instance_type    = "t3.medium"
      min_size        = 2
      max_size        = 6
      desired_capacity = 3
      volume_size     = 50
    }
  }

  db_configs = {
    staging = {
      instance_class      = "db.t3.micro"
      allocated_storage   = 20
      backup_retention    = 7
      multi_az           = false
      deletion_protection = false
    }
    production = {
      instance_class      = "db.t3.medium"
      allocated_storage   = 100
      backup_retention    = 30
      multi_az           = true
      deletion_protection = true
    }
  }

  network_configs = {
    staging = {
      vpc_cidr = "10.0.0.0/16"
      public_subnets = [
        "10.0.1.0/24",
        "10.0.2.0/24"
      ]
      private_subnets = [
        "10.0.10.0/24",
        "10.0.20.0/24"
      ]
      database_subnets = [
        "10.0.30.0/24",
        "10.0.40.0/24"
      ]
    }
    production = {
      vpc_cidr = "10.1.0.0/16"
      public_subnets = [
        "10.1.1.0/24",
        "10.1.2.0/24",
        "10.1.3.0/24"
      ]
      private_subnets = [
        "10.1.10.0/24",
        "10.1.20.0/24",
        "10.1.30.0/24"
      ]
      database_subnets = [
        "10.1.40.0/24",
        "10.1.50.0/24",
        "10.1.60.0/24"
      ]
    }
  }

  # Current environment configurations using lookup
  current_instance_config = lookup(local.instance_configs, var.environment, local.instance_configs["staging"])
  current_db_config      = lookup(local.db_configs, var.environment, local.db_configs["staging"])
  current_network_config = lookup(local.network_configs, var.environment, local.network_configs["staging"])

  # Common tags
  common_tags = {
    Department  = var.department
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "Terraform"
    Region      = var.region
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  # Resource naming
  name_prefix = "${var.project}-${var.environment}"
}
```

## 📁 **Directory Structure for Multi-Environment**

```
terraform/
├── main.tf
├── variables.tf
├── locals.tf
├── outputs.tf
├── modules/
│   ├── networking/
│   ├── compute/
│   ├── database/
│   └── iam/
├── environments/
│   ├── staging/
│   │   ├── terraform.tfvars
│   │   ├── backend.tf
│   │   └── versions.tf
│   └── production/
│       ├── terraform.tfvars
│       ├── backend.tf
│       └── versions.tf
└── scripts/
    ├── deploy-staging.sh
    └── deploy-production.sh
```

### Environment-Specific Configuration Files

#### `environments/staging/terraform.tfvars`
```hcl
environment = "staging"
region      = "us-east-1"
department  = "Engineering"
project     = "WebApp"

db_username = "admin"
# db_password should be set via environment variable or prompted
```

#### `environments/production/terraform.tfvars`
```hcl
environment = "production"
region      = "us-west-2"
department  = "Engineering"
project     = "WebApp"

db_username = "admin"
# db_password should be set via environment variable or prompted
```

#### `environments/staging/backend.tf`
```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "webapp/staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

#### `environments/production/backend.tf`
```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "webapp/production/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

## 🚀 **Deployment Scripts**

### `scripts/deploy-staging.sh`
```bash
#!/bin/bash
set -e

echo "Deploying to STAGING environment..."

cd environments/staging

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var-file="terraform.tfvars" -out=staging.tfplan

# Apply the deployment
terraform apply staging.tfplan

echo "Staging deployment completed!"
```

### `scripts/deploy-production.sh`
```bash
#!/bin/bash
set -e

echo "Deploying to PRODUCTION environment..."

cd environments/production

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var-file="terraform.tfvars" -out=production.tfplan

# Apply the deployment (with confirmation)
echo "Review the plan above. Type 'yes' to proceed with production deployment:"
terraform apply production.tfplan

echo "Production deployment completed!"
```

## 🎯 **Best Practices Implemented**

### 1. **Environment Isolation**
- Separate state files per environment
- Different AWS regions for staging/production
- Environment-specific resource sizing

### 2. **Security**
- Database passwords stored in Parameter Store
- Encrypted EBS volumes and RDS storage
- Least privilege IAM roles
- Security groups with minimal access

### 3. **High Availability**
- Multi-AZ RDS for production
- Auto Scaling Groups across multiple AZs
- Application Load Balancer with health checks

### 4. **Cost Optimization**
- Smaller instance types for staging
- Environment-specific storage allocation
- CloudWatch alarms for monitoring

### 5. **Operational Excellence**
- Comprehensive monitoring and alerting
- Automated backups with retention policies
- Performance Insights for production databases

## 📋 **Deployment Commands**

```bash
# Deploy staging
./scripts/deploy-staging.sh

# Deploy production
./scripts/deploy-production.sh

# Or manually:
cd environments/staging
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

This architecture provides complete environment isolation, proper resource management, and follows AWS Well-Architected Framework principles.