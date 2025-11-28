## lib/provider.tf

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

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

## lib/variables.tf

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
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


variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for ASG"
  type        = string
}

variable "asg_min" {
  description = "Minimum number of instances in ASG"
  type        = number
}

variable "asg_max" {
  description = "Maximum number of instances in ASG"
  type        = number
}

variable "rds_backup_retention" {
  description = "RDS backup retention period in days"
  type        = number
}

variable "s3_lifecycle_days" {
  description = "S3 object lifecycle expiration in days"
  type        = number
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "paymentsdb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  default     = ""
}
```

## lib/tap_stack.tf

```hcl
locals {
  project_name = "payments"
  environment  = var.environment
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Owner       = "SecurityTeam"
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }

  # Environment-specific settings
  env_config = {
    dev = {
      multi_az            = false
      deletion_protection = false
    }
    staging = {
      multi_az            = false
      deletion_protection = false
    }
    prod = {
      multi_az            = true
      deletion_protection = true
    }
  }
}

# Generate secure RDS password if not provided
resource "random_password" "db_password" {
  count            = var.db_password == "" ? 1 : 0
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# KMS Key Module
module "kms" {
  source = "./modules/kms"

  environment  = var.environment
  project_name = local.project_name
  common_tags  = local.common_tags
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment  = var.environment
  project_name = local.project_name
  vpc_cidr     = var.vpc_cidr
  region       = var.aws_region
  common_tags  = local.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  environment  = var.environment
  project_name = local.project_name
  vpc_id       = module.vpc.vpc_id
  common_tags  = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment             = var.environment
  project_name            = local.project_name
  db_instance_class       = var.db_instance_class
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password != "" ? var.db_password : random_password.db_password[0].result
  backup_retention_period = var.rds_backup_retention
  multi_az                = local.env_config[var.environment].multi_az
  deletion_protection     = local.env_config[var.environment].deletion_protection
  subnet_ids              = module.vpc.private_subnet_ids
  kms_key_id              = module.kms.key_arn
  security_group_id       = module.security_groups.rds_sg_id
  common_tags             = local.common_tags
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment    = var.environment
  project_name   = local.project_name
  kms_key_id     = module.kms.key_id
  lifecycle_days = var.s3_lifecycle_days
  common_tags    = local.common_tags
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  environment       = var.environment
  project_name      = local.project_name
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.public_subnet_ids
  security_group_id = module.security_groups.alb_sg_id
  common_tags       = local.common_tags
}

# ASG Module
module "asg" {
  source = "./modules/asg"

  environment       = var.environment
  project_name      = local.project_name
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_id = module.security_groups.ec2_sg_id
  target_group_arns = [module.alb.target_group_arn]
  instance_type     = var.instance_type
  min_size          = var.asg_min
  max_size          = var.asg_max
  s3_bucket_arn     = module.s3.bucket_arn
  common_tags       = local.common_tags
}
```

## lib/outputs.tf

```hcl
# ===========================================
# COMPREHENSIVE TERRAFORM OUTPUTS
# ===========================================
# This file contains all outputs for testing and integration purposes

# ===========================================
# ENVIRONMENT INFORMATION
# ===========================================

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "AWS region"
  value       = data.aws_region.current.id
}

output "project_name" {
  description = "Project name"
  value       = local.project_name
}

# ===========================================
# VPC AND NETWORKING
# ===========================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "availability_zones" {
  description = "Availability zones used"
  value       = module.vpc.availability_zones
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = module.vpc.internet_gateway_id
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = module.vpc.nat_gateway_id
}

output "nat_gateway_ip" {
  description = "NAT Gateway public IP"
  value       = module.vpc.nat_gateway_ip
}

# ===========================================
# LOAD BALANCER
# ===========================================

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.alb_arn
}

output "alb_zone_id" {
  description = "ALB Zone ID for Route53 alias records"
  value       = module.alb.alb_zone_id
}

output "alb_target_group_arn" {
  description = "ALB Target Group ARN"
  value       = module.alb.target_group_arn
}

output "alb_url" {
  description = "Complete ALB URL"
  value       = "http://${module.alb.alb_dns_name}"
}

# ===========================================
# AUTO SCALING GROUP
# ===========================================

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = module.asg.asg_name
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = module.asg.asg_arn
}

output "launch_template_id" {
  description = "Launch Template ID"
  value       = module.asg.launch_template_id
}

output "asg_min_size" {
  description = "ASG minimum size"
  value       = var.asg_min
}

output "asg_max_size" {
  description = "ASG maximum size"
  value       = var.asg_max
}

# ===========================================
# RDS DATABASE
# ===========================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
}

output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = module.rds.instance_id
}

output "rds_arn" {
  description = "RDS instance ARN"
  value       = module.rds.instance_arn
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds.port
}

output "rds_engine" {
  description = "RDS engine type"
  value       = module.rds.engine
}

output "rds_engine_version" {
  description = "RDS engine version"
  value       = module.rds.engine_version
}

output "rds_db_name" {
  description = "RDS database name"
  value       = module.rds.db_name
}

output "db_subnet_group_name" {
  description = "RDS DB subnet group name"
  value       = module.rds.db_subnet_group_name
}

# ===========================================
# S3 STORAGE
# ===========================================

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.bucket_arn
}

output "s3_bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = module.s3.bucket_domain_name
}

output "s3_bucket_region" {
  description = "S3 bucket region"
  value       = module.s3.bucket_region
}

# ===========================================
# SECURITY
# ===========================================

output "security_group_ids" {
  description = "Security Group IDs"
  value = {
    alb_sg_id = module.security_groups.alb_sg_id
    ec2_sg_id = module.security_groups.ec2_sg_id
    rds_sg_id = module.security_groups.rds_sg_id
  }
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = module.kms.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = module.kms.key_arn
}

output "kms_key_alias_arn" {
  description = "KMS key alias ARN"
  value       = module.kms.key_alias_arn
}

# ===========================================
# TESTING AND INTEGRATION HELPERS
# ===========================================

output "ssh_bastion_info" {
  description = "Information for connecting to instances (if needed)"
  value = {
    security_group_id = module.security_groups.ec2_sg_id
    subnets           = module.vpc.private_subnet_ids
    instance_type     = var.instance_type
  }
}

output "infrastructure_summary" {
  description = "Summary of deployed infrastructure for testing"
  value = {
    environment  = var.environment
    region       = data.aws_region.current.id
    vpc_id       = module.vpc.vpc_id
    alb_url      = "http://${module.alb.alb_dns_name}"
    rds_endpoint = module.rds.endpoint
    s3_bucket    = module.s3.bucket_name
    asg_name     = module.asg.asg_name
  }
}

# ===========================================
# TESTING ENDPOINTS
# ===========================================

output "test_endpoints" {
  description = "Key endpoints for testing the deployed infrastructure"
  value = {
    web_application = "http://${module.alb.alb_dns_name}"
    health_check    = "http://${module.alb.alb_dns_name}/health"
    api_endpoint    = "http://${module.alb.alb_dns_name}/api"
    rds_connection  = "${module.rds.endpoint}:${module.rds.port}"
  }
}

output "aws_cli_commands" {
  description = "Useful AWS CLI commands for testing"
  value = {
    describe_instances = "aws ec2 describe-instances --filters 'Name=tag:Name,Values=dev-payments-ec2' --region ${data.aws_region.current.id}"
    check_rds_status   = "aws rds describe-db-instances --db-instance-identifier ${module.rds.instance_id} --region ${data.aws_region.current.id}"
    list_s3_objects    = "aws s3 ls s3://${module.s3.bucket_name}/ --region ${data.aws_region.current.id}"
    check_alb_health   = "aws elbv2 describe-target-health --target-group-arn ${module.alb.target_group_arn} --region ${data.aws_region.current.id}"
  }
}
```

## lib/dev.tfvars

```hcl
environment          = "dev"
vpc_cidr            = "10.0.0.0/16"
instance_type       = "t3.micro"
asg_min             = 1
asg_max             = 2
rds_backup_retention = 7
s3_lifecycle_days   = 90
db_instance_class   = "db.t3.micro"
```

## lib/staging.tfvars

```hcl
environment          = "staging"
vpc_cidr            = "10.1.0.0/16"
instance_type       = "t3.small"
asg_min             = 2
asg_max             = 4
rds_backup_retention = 7
s3_lifecycle_days   = 180
db_instance_class   = "db.t3.small"
```

## lib/prod.tfvars

```hcl
environment          = "prod"
vpc_cidr            = "10.2.0.0/16"
instance_type       = "t3.large"
asg_min             = 3
asg_max             = 10
rds_backup_retention = 30
s3_lifecycle_days   = 365
db_instance_class   = "db.t3.medium"
```

## lib/modules/vpc/main.tf

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-vpc"
    }
  )
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-igw"
    }
  )
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-public-subnet-${count.index + 1}"
      Type = "Public"
    }
  )
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 100)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-private-subnet-${count.index + 1}"
      Type = "Private"
    }
  )
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-nat-eip"
    }
  )
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-nat"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-public-rt"
    }
  )
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-private-rt"
    }
  )
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
```

## lib/modules/vpc/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

## lib/modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = aws_nat_gateway.main.id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = data.aws_availability_zones.available.names
}

output "nat_gateway_ip" {
  description = "NAT Gateway public IP"
  value       = aws_eip.nat.public_ip
}
```

## lib/modules/kms/main.tf

```hcl
data "aws_caller_identity" "current" {}

resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} ${var.project_name} encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-kms"
    }
  )
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-${var.project_name}-kms"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_kms_key_policy" "main" {
  key_id = aws_kms_key.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow services to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "rds.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}
```

## lib/modules/kms/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

## lib/modules/kms/outputs.tf

```hcl
output "key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.id
}

output "key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "key_alias_arn" {
  description = "KMS key alias ARN"
  value       = aws_kms_alias.main.arn
}
```

## lib/modules/security_groups/main.tf

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.environment}-${var.project_name}-alb-sg"
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
    description = "All traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-alb-sg"
    }
  )
}

# EC2/ASG Security Group
resource "aws_security_group" "ec2" {
  name        = "${var.environment}-${var.project_name}-ec2-sg"
  description = "Security group for EC2 instances in ASG"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-ec2-sg"
    }
  )
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${var.environment}-${var.project_name}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "All traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-rds-sg"
    }
  )
}
```

## lib/modules/security_groups/variables.tf

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

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

## lib/modules/security_groups/outputs.tf

```hcl
output "alb_sg_id" {
  description = "ALB Security Group ID"
  value       = aws_security_group.alb.id
}

output "ec2_sg_id" {
  description = "EC2 Security Group ID"
  value       = aws_security_group.ec2.id
}

output "rds_sg_id" {
  description = "RDS Security Group ID"
  value       = aws_security_group.rds.id
}
```

## lib/modules/rds/main.tf

```hcl
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-${var.project_name}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-db-subnet-group"
    }
  )
}

resource "aws_db_instance" "main" {
  identifier = "${var.environment}-${var.project_name}-rds"

  engine                = "postgres"
  engine_version        = "15.12"
  instance_class        = var.db_instance_class
  allocated_storage     = 20
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = var.kms_key_id

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  multi_az               = var.multi_az
  publicly_accessible    = false
  deletion_protection    = var.deletion_protection

  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.environment}-${var.project_name}-rds-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  lifecycle {
    prevent_destroy = false
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-rds"
    }
  )
}

# Conditional lifecycle rule for production
resource "null_resource" "rds_lifecycle_check" {
  count = var.environment == "prod" ? 1 : 0

  lifecycle {
    prevent_destroy = true
  }

  triggers = {
    rds_id = aws_db_instance.main.id
  }
}
```

## lib/modules/rds/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
}

variable "subnet_ids" {
  description = "Subnet IDs for DB subnet group"
  type        = list(string)
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

## lib/modules/rds/outputs.tf

```hcl
output "endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "engine" {
  description = "RDS engine type"
  value       = aws_db_instance.main.engine
}

output "engine_version" {
  description = "RDS engine version"
  value       = aws_db_instance.main.engine_version_actual
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_subnet_group.main.name
}
```

## lib/modules/s3/main.tf

```hcl
resource "aws_s3_bucket" "main" {
  bucket = "${var.environment}-${var.project_name}-app-data-log"

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-app-data-log"
    }
  )
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "expire-objects"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.lifecycle_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.lifecycle_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

## lib/modules/s3/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "lifecycle_days" {
  description = "Number of days before objects expire"
  type        = number
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

## lib/modules/s3/outputs.tf

```hcl
output "bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_region" {
  description = "S3 bucket region"
  value       = aws_s3_bucket.main.region
}
```

## lib/modules/alb/main.tf

```hcl
resource "aws_lb" "main" {
  name               = "${var.environment}-${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.subnet_ids

  enable_deletion_protection = false
  enable_http2              = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-alb"
    }
  )
}

resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-${var.project_name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-tg"
    }
  )
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
```

## lib/modules/alb/variables.tf

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

variable "subnet_ids" {
  description = "Subnet IDs for ALB"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

## lib/modules/alb/outputs.tf

```hcl
output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.main.arn
}
```

## lib/modules/asg/main.tf

```hcl
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

resource "aws_iam_role" "ec2" {
  name = "${var.environment}-${var.project_name}-ec2-roles"

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

  tags = var.common_tags
}

resource "aws_iam_role_policy" "ec2_s3_access" {
  name = "${var.environment}-${var.project_name}-ec2-s3-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.environment}-${var.project_name}-ec2-profiles"
  role = aws_iam_role.ec2.name

  tags = var.common_tags
}

resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment}-${var.project_name}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.security_group_id]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Payment Processing App - ${var.environment}</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      var.common_tags,
      {
        Name = "${var.environment}-${var.project_name}-ec2"
      }
    )
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "main" {
  name               = "${var.environment}-${var.project_name}-asg"
  vpc_zone_identifier = var.subnet_ids
  target_group_arns   = var.target_group_arns
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size = var.min_size
  max_size = var.max_size
  desired_capacity = var.min_size

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-${var.project_name}-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-${var.project_name}-scale-up"
  autoscaling_group_name = aws_autoscaling_group.main.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown              = 300
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-${var.project_name}-scale-down"
  autoscaling_group_name = aws_autoscaling_group.main.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown              = 300
}
```

## lib/modules/asg/variables.tf

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

variable "subnet_ids" {
  description = "Subnet IDs for ASG"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

variable "target_group_arns" {
  description = "Target group ARNs"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum ASG size"
  type        = number
}

variable "max_size" {
  description = "Maximum ASG size"
  type        = number
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN for IAM policy"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

## lib/modules/asg/outputs.tf

```hcl
output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.main.name
}

output "asg_id" {
  description = "Auto Scaling Group ID"
  value       = aws_autoscaling_group.main.id
}

output "launch_template_id" {
  description = "Launch Template ID"
  value       = aws_launch_template.main.id
}

output "iam_role_arn" {
  description = "EC2 IAM role ARN"
  value       = aws_iam_role.ec2.arn
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = aws_autoscaling_group.main.arn
}
```
