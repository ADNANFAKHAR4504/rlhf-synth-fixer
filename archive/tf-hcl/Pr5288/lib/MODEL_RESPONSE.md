### Reasoning Trace
---

The user is asking for a Terraform configuration for a healthcare startup that needs to deploy infrastructure across multiple environments (dev, staging, prod) using Terraform workspaces. The requirements are quite detailed and include:

1. AWS infrastructure in us-west-2
2. VPC with public/private subnets across 2 AZs
3. ALB in public subnets
4. EC2 instances in private subnets
5. RDS PostgreSQL in private subnets
6. KMS encryption for RDS
7. CloudWatch logging
8. Environment-specific configurations using workspaces
9. Proper tagging and security

I need to create a modular Terraform configuration with:
- main.tf (core infrastructure)
- variables.tf (input variables)
- outputs.tf (outputs with environment context)
- terraform.tfvars (default values)

Let me structure this properly with all the required components.
### Answer 
---

# Healthcare Infrastructure Terraform Configuration

I'll help you create a robust, multi-environment Terraform configuration for your healthcare infrastructure. This solution uses Terraform workspaces to manage environment-specific configurations while maintaining consistency across all deployments.

## Configuration Files

### **variables.tf**
```hcl
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the healthcare project"
  type        = string
  default     = "healthcare-app"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "db_username" {
  description = "Master username for RDS database"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Master password for RDS database"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the initial database"
  type        = string
  default     = "healthcare_db"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "key_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
}
```

### **main.tf**
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

provider "aws" {
  region = var.aws_region
}

# Locals for environment-specific configurations
locals {
  environment = terraform.workspace == "default" ? "dev" : terraform.workspace
  
  env_config = {
    dev = {
      vpc_cidr            = "10.1.0.0/16"
      instance_type       = "t3.micro"
      instance_count      = 2
      db_instance_class   = "db.t3.micro"
      db_allocated_storage = 20
      db_backup_retention = 1
      deletion_protection = false
      multi_az           = false
    }
    staging = {
      vpc_cidr            = "10.2.0.0/16"
      instance_type       = "t3.small"
      instance_count      = 2
      db_instance_class   = "db.t3.small"
      db_allocated_storage = 50
      db_backup_retention = 3
      deletion_protection = false
      multi_az           = false
    }
    prod = {
      vpc_cidr            = "10.3.0.0/16"
      instance_type       = "t3.medium"
      instance_count      = 4
      db_instance_class   = "db.t3.medium"
      db_allocated_storage = 100
      db_backup_retention = 7
      deletion_protection = true
      multi_az           = true
    }
  }
  
  config = local.env_config[local.environment]
  
  common_tags = {
    Environment = local.environment
    Project     = var.project_name
    Owner       = var.owner
    ManagedBy   = "Terraform"
  }
}

# KMS Key for RDS Encryption
resource "aws_kms_key" "rds_encryption" {
  description             = "KMS key for RDS encryption in ${local.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-kms-${local.environment}"
  })
}

resource "aws_kms_alias" "rds_encryption" {
  name          = "alias/${var.project_name}-rds-${local.environment}"
  target_key_id = aws_kms_key.rds_encryption.key_id
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = local.config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-${local.environment}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw-${local.environment}"
  })
}

# Public Subnets (for ALB)
resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.config.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${local.environment}"
    Type = "Public"
  })
}

# Private Subnets (for EC2 instances)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.config.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${local.environment}"
    Type = "Private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.config.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-${count.index + 1}-${local.environment}"
    Type = "Database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip-${count.index + 1}-${local.environment}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-${count.index + 1}-${local.environment}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt-${local.environment}"
  })
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-${count.index + 1}-${local.environment}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg-${local.environment}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP from anywhere"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from anywhere"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb-sg-${local.environment}"
  })
}

resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg-${local.environment}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow HTTP from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ec2-sg-${local.environment}"
  })
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg-${local.environment}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "Allow PostgreSQL from EC2 instances"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-sg-${local.environment}"
  })
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-ec2-role-${local.environment}"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-ec2-profile-${local.environment}"
  role = aws_iam_role.ec2.name
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb-${local.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
  
  enable_deletion_protection = local.config.deletion_protection
  enable_http2              = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb-${local.environment}"
  })
}

resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-tg-${local.environment}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-tg-${local.environment}"
  })
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# EC2 Instances
resource "aws_instance" "app" {
  count = local.config.instance_count
  
  ami                    = var.ami_id
  instance_type          = local.config.instance_type
  key_name              = var.key_name
  subnet_id             = aws_subnet.private[count.index % length(aws_subnet.private)].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  
  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }
  
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Healthcare App - ${local.environment} - Instance ${count.index + 1}</h1>" > /var/www/html/index.html
  EOF
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ec2-${count.index + 1}-${local.environment}"
  })
}

resource "aws_lb_target_group_attachment" "main" {
  count = local.config.instance_count
  
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_instance.app[count.index].id
  port             = 80
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group-${local.environment}"
  subnet_ids = aws_subnet.database[*].id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group-${local.environment}"
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db-${local.environment}"
  
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = local.config.db_instance_class
  allocated_storage    = local.config.db_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true
  kms_key_id          = aws_kms_key.rds_encryption.arn
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = local.config.db_backup_retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = local.config.multi_az
  deletion_protection    = local.config.deletion_protection
  skip_final_snapshot    = !local.config.deletion_protection
  final_snapshot_identifier = local.config.deletion_protection ? "${var.project_name}-db-final-snapshot-${local.environment}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-${local.environment}"
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/rds/instance/${aws_db_instance.main.identifier}/postgresql"
  retention_in_days = local.config.db_backup_retention * 2
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-logs-${local.environment}"
  })
}
```

### **outputs.tf**
```hcl
output "environment" {
  description = "Current environment name"
  value       = local.environment
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "ec2_instance_ids" {
  description = "IDs of EC2 instances"
  value       = aws_instance.app[*].id
}

output "ec2_private_ips" {
  description = "Private IP addresses of EC2 instances"
  value       = aws_instance.app[*].private_ip
}

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = aws_db_instance.main.db_name
}

output "kms_key_id" {
  description = "ID of the KMS key used for RDS encryption"
  value       = aws_kms_key.rds_encryption.id
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.main.name
}

# Environment-specific output keys
output "environment_config" {
  description = "Current environment configuration"
  value = {
    "${local.environment}_vpc_cidr"            = local.config.vpc_cidr
    "${local.environment}_instance_type"       = local.config.instance_type
    "${local.environment}_instance_count"      = local.config.instance_count
    "${local.environment}_db_instance_class"   = local.config.db_instance_class
    "${local.environment}_db_backup_retention" = local.config.db_backup_retention
    "${local.environment}_deletion_protection" = local.config.deletion_protection
  }
}
```

### **terraform.tfvars**
```hcl
# Project Configuration
project_name = "healthcare-app"
owner        = "DevOps Team"

# EC2 Configuration
# Replace with your actual AMI ID for the region
ami_id   = "ami-0c94855ba95c87f0a"  # Amazon Linux 2 AMI for us-west-2
key_name = "healthcare-keypair"

# Database Configuration
db_username = "healthcaredbadmin"
# Note: Store db_password securely - don't commit to version control
# Use environment variable: export TF_VAR_db_password="your-secure-password"
```

## Deployment Guide

### 1. Initialize Terraform
```bash
# Initialize Terraform with default workspace (dev)
terraform init
```

### 2. Create and Configure Workspaces
```bash
# Create workspaces for each environment
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# List available workspaces
terraform workspace list

# Select a workspace
terraform workspace select dev
```

### 3. Deploy to Each Environment
```bash
# Deploy to Development
terraform workspace select dev
terraform plan -out=dev.tfplan
terraform apply dev.tfplan

# Deploy to Staging
terraform workspace select staging
terraform plan -out=staging.tfplan
terraform apply staging.tfplan

# Deploy to Production
terraform workspace select prod
terraform plan -out=prod.tfplan
terraform apply prod.tfplan
```

### 4. Managing Environment-Specific Secrets
```bash
# Set database password as environment variable
export TF_VAR_db_password="your-secure-password-here"

# Or use different passwords per environment
export TF_VAR_db_password="dev-password"    # for dev
export TF_VAR_db_password="staging-password" # for staging
export TF_VAR_db_password="prod-password"    # for production
```

## Key Features Implemented

### 🔒 **Security & Compliance**
- **Encryption at Rest**: RDS instances use customer-managed KMS keys
- **Network Isolation**: Private subnets for compute and database tiers
- **Security Groups**: Restrictive rules allowing only necessary traffic
- **IAM Roles**: EC2 instances use IAM roles instead of static credentials

### 🌐 **High Availability**
- **Multi-AZ Deployment**: Resources spread across 2 availability zones
- **NAT Gateways**: One per AZ for redundant internet access
- **Load Balancing**: ALB distributes traffic across multiple instances

### 🔧 **Environment Management**
- **Terraform Workspaces**: Clean separation between environments
- **Non-overlapping CIDRs**: Prevents network conflicts
- **Environment-specific Sizing**: Appropriate resource sizing per environment
- **Production Safeguards**: Deletion protection enabled for production

### 📊 **Monitoring & Logging**
- **CloudWatch Integration**: RDS logs exported to CloudWatch
- **Resource Tagging**: Consistent tagging for cost allocation and management

## Environment Comparison

| Feature | Development | Staging | Production |
|---------|------------|---------|------------|
| **VPC CIDR** | 10.1.0.0/16 | 10.2.0.0/16 | 10.3.0.0/16 |
| **EC2 Instance Type** | t3.micro | t3.small | t3.medium |
| **EC2 Count** | 2 | 2 | 4 |
| **RDS Instance Class** | db.t3.micro | db.t3.small | db.t3.medium |
| **RDS Storage** | 20 GB | 50 GB | 100 GB |
| **Backup Retention** | 1 day | 3 days | 7 days |
| **Multi-AZ RDS** | No | No | Yes |
| **Deletion Protection** | No | No | Yes |

## Best Practices Implemented

1. **Infrastructure as Code**: Everything is defined in Terraform
2. **DRY Principle**: Uses locals block to avoid repetition
3. **Secure by Default**: Private subnets, encryption, restrictive security groups
4. **Scalability**: Easy to add more instances or modify configurations
5. **Cost Optimization**: Right-sized resources for each environment
6. **Compliance Ready**: Encryption, logging, and audit trail capabilities

This configuration provides a solid foundation for your healthcare application infrastructure while maintaining compliance requirements and allowing for easy management across multiple environments.