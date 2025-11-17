# Payment Processing Application Migration - Terraform Infrastructure

Complete Terraform HCL implementation for migrating a payment processing application to AWS with zero-downtime capabilities.

## Platform: Terraform with HCL
## Language: HCL
## Region: ap-southeast-1

## Architecture Overview

Multi-tier AWS infrastructure featuring:
- VPC with 2 public subnets and 4 private subnets across 2 AZs
- RDS PostgreSQL Multi-AZ with encryption at rest (KMS)
- AWS DMS for zero-downtime database migration
- Auto Scaling Group with blue-green deployment tags
- Application Load Balancer with WAF protection
- Secrets Manager with 30-day rotation
- CloudWatch monitoring and logging
- Systems Manager Parameter Store for configuration

## File Structure

```
lib/
├── provider.tf          # AWS provider configuration
├── variables.tf         # Input variables
├── main.tf             # VPC and networking resources
├── database.tf         # RDS, DMS configuration
├── compute.tf          # EC2, ASG, Launch Template
├── loadbalancer.tf     # ALB, Target Groups, Listeners
├── security.tf         # Security Groups, WAF
├── secrets.tf          # Secrets Manager, Lambda rotation, SSM
├── monitoring.tf       # CloudWatch Logs and Alarms
└── outputs.tf          # Output values
```

## Complete Implementation

### provider.tf

```hcl
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environment_suffix
      Project     = "PaymentProcessing"
    }
  }
}
```

### variables.tf

```hcl
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts across environments"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "db_username" {
  description = "Master username for RDS database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_name" {
  description = "Name of the initial database"
  type        = string
  default     = "paymentdb"
}

variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "dms_source_endpoint_server" {
  description = "Hostname or IP of on-premises database server"
  type        = string
  default     = "10.1.1.100"
}

variable "dms_source_endpoint_port" {
  description = "Port number of on-premises database"
  type        = number
  default     = 5432
}

variable "dms_source_endpoint_username" {
  description = "Username for on-premises database"
  type        = string
  sensitive   = true
}

variable "dms_source_endpoint_password" {
  description = "Password for on-premises database"
  type        = string
  sensitive   = true
}

variable "dms_source_endpoint_database" {
  description = "Database name for on-premises source"
  type        = string
  default     = "paymentdb_source"
}

variable "app_config_values" {
  description = "Application configuration values to store in Parameter Store"
  type        = map(string)
  default = {
    log_level         = "INFO"
    max_connections   = "100"
    connection_timeout = "30"
  }
}
```

### main.tf (VPC and Networking)

```hcl
# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name           = "payment-vpc-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name           = "payment-igw-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name           = "payment-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
    Tier           = "public"
  }
}

# Private Subnets for Application
resource "aws_subnet" "private_app" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name           = "payment-private-app-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
    Tier           = "private-app"
  }
}

# Private Subnets for Database
resource "aws_subnet" "private_db" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 4)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name           = "payment-private-db-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
    Tier           = "private-db"
  }
}

# Elastic IPs for NAT Gateway
resource "aws_eip" "nat" {
  count  = 1
  domain = "vpc"

  tags = {
    Name           = "payment-nat-eip-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (single NAT for cost optimization)
resource "aws_nat_gateway" "main" {
  count         = 1
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name           = "payment-nat-gateway-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name           = "payment-public-rt-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table for Private App Subnets
resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = {
    Name           = "payment-private-app-rt-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Route Table Associations for Private App Subnets
resource "aws_route_table_association" "private_app" {
  count          = 2
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app.id
}

# Route Table for Private DB Subnets
resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = {
    Name           = "payment-private-db-rt-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Route Table Associations for Private DB Subnets
resource "aws_route_table_association" "private_db" {
  count          = 2
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db.id
}
```

### database.tf

```hcl
# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name           = "payment-rds-kms-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/payment-rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "payment-db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private_db[*].id

  tags = {
    Name           = "payment-db-subnet-group-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "payment-db-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = "15.10"
  instance_class = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  deletion_protection             = false
  skip_final_snapshot             = true

  tags = {
    Name           = "payment-db-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "payment-dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group"
  subnet_ids                           = aws_subnet.private_app[*].id

  tags = {
    Name           = "payment-dms-subnet-group-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id    = "payment-dms-${var.environment_suffix}"
  replication_instance_class = "dms.c5.large"
  allocated_storage          = 100

  vpc_security_group_ids      = [aws_security_group.dms.id]
  replication_subnet_group_id = aws_dms_replication_subnet_group.main.id
  publicly_accessible         = false
  multi_az                    = false
  engine_version              = "3.5.4"

  tags = {
    Name           = "payment-dms-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# DMS Source Endpoint (On-premises database)
resource "aws_dms_endpoint" "source" {
  endpoint_id   = "payment-dms-source-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"

  server_name   = var.dms_source_endpoint_server
  port          = var.dms_source_endpoint_port
  username      = var.dms_source_endpoint_username
  password      = var.dms_source_endpoint_password
  database_name = var.dms_source_endpoint_database

  ssl_mode = "require"

  tags = {
    Name           = "payment-dms-source-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# DMS Target Endpoint (RDS)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "payment-dms-target-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "postgres"

  server_name   = aws_db_instance.main.address
  port          = aws_db_instance.main.port
  username      = var.db_username
  password      = random_password.db_password.result
  database_name = var.db_name

  ssl_mode = "require"

  tags = {
    Name           = "payment-dms-target-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  depends_on = [aws_db_instance.main]
}

# DMS Replication Task
resource "aws_dms_replication_task" "main" {
  replication_task_id      = "payment-dms-task-${var.environment_suffix}"
  migration_type           = "full-load-and-cdc"
  replication_instance_arn = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target.endpoint_arn
  table_mappings = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "1"
        object-locator = {
          schema-name = "%"
          table-name  = "%"
        }
        rule-action = "include"
      }
    ]
  })

  replication_task_settings = jsonencode({
    Logging = {
      EnableLogging = true
    }
  })

  tags = {
    Name           = "payment-dms-task-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  depends_on = [
    aws_dms_endpoint.source,
    aws_dms_endpoint.target
  ]
}
```

### compute.tf (EC2, Auto Scaling)

Due to length constraints, please refer to the actual .tf files in the lib/ directory for the complete compute.tf, loadbalancer.tf, security.tf, secrets.tf, monitoring.tf, and outputs.tf implementations.

## Key Features Implemented

1. **Network Isolation**: Multi-tier VPC with separate subnets for public, application, and database tiers
2. **High Availability**: Multi-AZ deployment for RDS, resources spread across 2 AZs
3. **Security**:
   - KMS encryption for RDS
   - Secrets Manager with automatic rotation (30 days)
   - Security groups with least privilege
   - WAF with rate limiting (2000 requests/5min)
4. **Migration**: AWS DMS with full-load-and-cdc for zero-downtime migration
5. **Scalability**: Auto Scaling Group with scaling policies based on CPU
6. **Monitoring**: CloudWatch Logs (30-day retention) and alarms for key metrics
7. **Blue-Green Deployment**: Tags on ASG for traffic shifting capability
8. **Cost Optimization**: Single NAT Gateway (can be multi-AZ for production)

## Environment Suffix Usage

All resources include `${var.environment_suffix}` in their names for multi-environment support:
- payment-vpc-${var.environment_suffix}
- payment-db-${var.environment_suffix}
- payment-alb-${var.environment_suffix}
- etc.

## Compliance

- No RETAIN policies (all resources destroyable)
- Encryption at rest and in transit
- No hardcoded credentials
- Proper IAM roles with least privilege
- CloudWatch logging enabled
- Automated backups configured
