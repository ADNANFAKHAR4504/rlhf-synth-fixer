### Reasoning Trace
---

This is a comprehensive AWS multi-region disaster recovery setup for a financial services trading platform. Let me break down the requirements:

1. **Global Setup**:
   - Primary: us-east-1, Secondary: us-east-1
   - Financial services platform with strict data consistency
   - Automatic failover within 30 seconds
   - Variables to be parameterized

2. **Components needed**:
   - VPC/Networking in both regions
   - Aurora Global Database
   - Route 53 with health checks and failover
   - ALBs with EC2 instances
   - Lambda for failover automation
   - EventBridge for monitoring
   - Secrets Manager with KMS encryption
   - KMS customer-managed keys

3. **File structure**:
   - provider.tf (S3 backend)
   - lib/tap_stack.tf (all resources, variables, locals, outputs)

Let me create a comprehensive Terraform configuration that meets all these requirements.
### Answer 
---

I'll create a comprehensive multi-region disaster recovery infrastructure for your financial services trading platform. This solution implements automatic failover within 30 seconds using Aurora Global Database, Route 53 health checks, and Lambda-based automation.

## provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  backend "s3" {
    bucket         = var.state_bucket
    key            = "${var.environment}/${var.state_key}"
    region         = var.state_region
    encrypt        = true
    dynamodb_table = var.state_lock_table
  }
}

# Primary region provider
provider "aws" {
  region = var.primary_region
  
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "trading-platform"
    }
  }
}

# Secondary region provider
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "trading-platform"
    }
  }
}
```

## lib/tap_stack.tf

```hcl
# ==========================================
# VARIABLES
# ==========================================

variable "primary_region" {
  description = "AWS region for primary deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "AWS region for secondary deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr_blocks" {
  description = "CIDR blocks for both regions"
  type = object({
    primary   = string
    secondary = string
  })
  default = {
    primary   = "10.0.0.0/16"
    secondary = "10.1.0.0/16"
  }
}

variable "database_instance_class" {
  description = "Aurora instance type"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "backup_retention_period" {
  description = "Backup retention duration in days"
  type        = number
  default     = 30
}

variable "environment" {
  description = "Deployment environment (prod/staging)"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["prod", "staging"], var.environment)
    error_message = "Environment must be prod or staging"
  }
}

variable "kms_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
}

variable "route53_domain" {
  description = "Domain name for DNS configuration"
  type        = string
  default     = "trading-platform.example.com"
}

variable "ec2_instances_per_region" {
  description = "Number of EC2 instances per region"
  type        = number
  default     = 3
}

variable "state_bucket" {
  description = "S3 bucket for Terraform state"
  type        = string
  default     = "terraform-state-trading-platform"
}

variable "state_key" {
  description = "S3 key for Terraform state"
  type        = string
  default     = "infrastructure/terraform.tfstate"
}

variable "state_region" {
  description = "AWS region for Terraform state"
  type        = string
  default     = "us-east-1"
}

variable "state_lock_table" {
  description = "DynamoDB table for state locking"
  type        = string
  default     = "terraform-state-lock"
}

# ==========================================
# LOCALS
# ==========================================

locals {
  # Resource naming conventions
  resource_prefix = "${var.environment}-trading"
  
  # Common tags
  common_tags = {
    Environment     = var.environment
    Application     = "trading-platform"
    DataClass       = "highly-confidential"
    ComplianceScope = "financial-services"
    DREnabled       = "true"
  }
  
  # Network configuration
  az_count = 3
  
  primary_azs   = data.aws_availability_zones.primary.names
  secondary_azs = data.aws_availability_zones.secondary.names
  
  # Subnet calculations
  primary_subnet_cidrs = {
    public  = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr_blocks.primary, 4, i)]
    private = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr_blocks.primary, 4, i + 3)]
    db      = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr_blocks.primary, 4, i + 6)]
  }
  
  secondary_subnet_cidrs = {
    public  = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr_blocks.secondary, 4, i)]
    private = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr_blocks.secondary, 4, i + 3)]
    db      = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr_blocks.secondary, 4, i + 6)]
  }
  
  # Feature toggles
  enable_flow_logs      = var.environment == "prod"
  enable_guardduty      = var.environment == "prod"
  enable_detailed_monitoring = var.environment == "prod"
  
  # Database configuration
  db_cluster_identifier = "${local.resource_prefix}-aurora-global"
  db_name              = "tradingdb"
  db_master_username   = "admin"
  db_port             = 3306
  
  # Lambda configuration
  lambda_runtime = "python3.11"
  lambda_timeout = 60
  
  # Health check configuration
  health_check_interval = 10
  health_check_timeout  = 5
  health_threshold     = 2
  unhealthy_threshold  = 2
}

# ==========================================
# DATA SOURCES
# ==========================================

data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_caller_identity" "current" {}

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

data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
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

# ==========================================
# KMS KEYS
# ==========================================

resource "aws_kms_key" "primary" {
  description             = "KMS key for ${local.resource_prefix} - Primary Region"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-kms-primary"
    Region = "primary"
  })
}

resource "aws_kms_alias" "primary" {
  name          = "alias/${local.resource_prefix}-primary"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for ${local.resource_prefix} - Secondary Region"
  deletion_window_in_days = var.kms_deletion_window
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-kms-secondary"
    Region = "secondary"
  })
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/${local.resource_prefix}-secondary"
  target_key_id = aws_kms_key.secondary.key_id
}

# ==========================================
# VPC - PRIMARY REGION
# ==========================================

resource "aws_vpc" "primary" {
  cidr_block           = var.vpc_cidr_blocks.primary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-vpc-primary"
    Region = "primary"
  })
}

resource "aws_subnet" "primary_public" {
  count                   = local.az_count
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_subnet_cidrs.public[count.index]
  availability_zone       = local.primary_azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "primary_private" {
  count             = local.az_count
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_subnet_cidrs.private[count.index]
  availability_zone = local.primary_azs[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_subnet" "primary_db" {
  count             = local.az_count
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_subnet_cidrs.db[count.index]
  availability_zone = local.primary_azs[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-${count.index + 1}"
    Type = "database"
  })
}

resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-igw-primary"
  })
}

resource "aws_eip" "primary_nat" {
  count  = local.az_count
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "primary" {
  count         = local.az_count
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-${count.index + 1}"
  })
}

resource "aws_route_table" "primary_public" {
  vpc_id = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-rt"
  })
}

resource "aws_route_table" "primary_private" {
  count  = local.az_count
  vpc_id = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table_association" "primary_public" {
  count          = local.az_count
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  count          = local.az_count
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

resource "aws_route_table_association" "primary_db" {
  count          = local.az_count
  subnet_id      = aws_subnet.primary_db[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# ==========================================
# VPC - SECONDARY REGION
# ==========================================

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_blocks.secondary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-vpc-secondary"
    Region = "secondary"
  })
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = local.az_count
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_subnet_cidrs.public[count.index]
  availability_zone       = local.secondary_azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = local.az_count
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_subnet_cidrs.private[count.index]
  availability_zone = local.secondary_azs[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_subnet" "secondary_db" {
  provider          = aws.secondary
  count             = local.az_count
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_subnet_cidrs.db[count.index]
  availability_zone = local.secondary_azs[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-${count.index + 1}"
    Type = "database"
  })
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-igw-secondary"
  })
}

resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  count    = local.az_count
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = local.az_count
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-${count.index + 1}"
  })
}

resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-rt"
  })
}

resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  count    = local.az_count
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = local.az_count
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = local.az_count
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

resource "aws_route_table_association" "secondary_db" {
  provider       = aws.secondary
  count          = local.az_count
  subnet_id      = aws_subnet.secondary_db[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# ==========================================
# SECURITY GROUPS
# ==========================================

resource "aws_security_group" "alb_primary" {
  name_prefix = "${local.resource_prefix}-alb-"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from Internet"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from Internet"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alb-sg-primary"
  })
}

resource "aws_security_group" "alb_secondary" {
  provider    = aws.secondary
  name_prefix = "${local.resource_prefix}-alb-"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from Internet"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from Internet"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alb-sg-secondary"
  })
}

resource "aws_security_group" "ec2_primary" {
  name_prefix = "${local.resource_prefix}-ec2-"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
    description     = "HTTP from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ec2-sg-primary"
  })
}

resource "aws_security_group" "ec2_secondary" {
  provider    = aws.secondary
  name_prefix = "${local.resource_prefix}-ec2-"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
    description     = "HTTP from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ec2-sg-secondary"
  })
}

resource "aws_security_group" "rds_primary" {
  name_prefix = "${local.resource_prefix}-rds-"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = local.db_port
    to_port         = local.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_primary.id, aws_security_group.lambda_primary.id]
    description     = "MySQL/Aurora from application"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rds-sg-primary"
  })
}

resource "aws_security_group" "rds_secondary" {
  provider    = aws.secondary
  name_prefix = "${local.resource_prefix}-rds-"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port       = local.db_port
    to_port         = local.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_secondary.id, aws_security_group.lambda_secondary.id]
    description     = "MySQL/Aurora from application"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rds-sg-secondary"
  })
}

resource "aws_security_group" "lambda_primary" {
  name_prefix = "${local.resource_prefix}-lambda-"
  vpc_id      = aws_vpc.primary.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-lambda-sg-primary"
  })
}

resource "aws_security_group" "lambda_secondary" {
  provider    = aws.secondary
  name_prefix = "${local.resource_prefix}-lambda-"
  vpc_id      = aws_vpc.secondary.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-lambda-sg-secondary"
  })
}

# ==========================================
# SECRETS MANAGER
# ==========================================

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name_prefix             = "${local.resource_prefix}-db-creds-"
  description             = "Aurora database master credentials"
  kms_key_id              = aws_kms_key.primary.arn
  recovery_window_in_days = 0
  
  replica {
    region     = var.secondary_region
    kms_key_id = aws_kms_key.secondary.arn
  }
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = local.db_master_username
    password = random_password.db_password.result
    engine   = "mysql"
    host     = aws_rds_global_cluster.main.endpoint
    port     = local.db_port
    dbname   = local.db_name
  })
}

# ==========================================
# AURORA GLOBAL DATABASE
# ==========================================

resource "aws_db_subnet_group" "primary" {
  name       = "${local.resource_prefix}-db-subnet-primary"
  subnet_ids = aws_subnet.primary_db[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-primary"
  })
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${local.resource_prefix}-db-subnet-secondary"
  subnet_ids = aws_subnet.secondary_db[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-secondary"
  })
}

resource "aws_rds_global_cluster" "main" {
  global_cluster_identifier = local.db_cluster_identifier
  engine                    = "aurora-mysql"
  engine_version           = "8.0.mysql_aurora.3.04.0"
  database_name            = local.db_name
  storage_encrypted        = true
  deletion_protection      = var.environment == "prod"
  
  # Support automatic failover
  force_destroy = var.environment != "prod"
}

resource "aws_rds_cluster" "primary" {
  cluster_identifier              = "${local.db_cluster_identifier}-primary"
  engine                          = aws_rds_global_cluster.main.engine
  engine_version                  = aws_rds_global_cluster.main.engine_version
  engine_mode                     = "provisioned"
  global_cluster_identifier       = aws_rds_global_cluster.main.id
  master_username                 = local.db_master_username
  master_password                 = random_password.db_password.result
  database_name                   = local.db_name
  db_subnet_group_name           = aws_db_subnet_group.primary.name
  vpc_security_group_ids         = [aws_security_group.rds_primary.id]
  backup_retention_period        = var.backup_retention_period
  preferred_backup_window        = "03:00-04:00"
  preferred_maintenance_window   = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  storage_encrypted              = true
  kms_key_id                     = aws_kms_key.primary.arn
  deletion_protection            = var.environment == "prod"
  skip_final_snapshot            = var.environment != "prod"
  final_snapshot_identifier      = var.environment == "prod" ? "${local.db_cluster_identifier}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-aurora-primary"
    Region = "primary"
  })
}

resource "aws_rds_cluster_instance" "primary" {
  count                        = 2
  identifier                   = "${local.db_cluster_identifier}-primary-${count.index + 1}"
  cluster_identifier           = aws_rds_cluster.primary.id
  instance_class              = var.database_instance_class
  engine                      = aws_rds_cluster.primary.engine
  engine_version              = aws_rds_cluster.primary.engine_version
  performance_insights_enabled = true
  monitoring_interval         = local.enable_detailed_monitoring ? 60 : 0
  monitoring_role_arn         = local.enable_detailed_monitoring ? aws_iam_role.rds_monitoring.arn : null
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-aurora-instance-primary-${count.index + 1}"
  })
}

resource "aws_rds_cluster" "secondary" {
  provider                        = aws.secondary
  cluster_identifier              = "${local.db_cluster_identifier}-secondary"
  engine                          = aws_rds_global_cluster.main.engine
  engine_version                  = aws_rds_global_cluster.main.engine_version
  engine_mode                     = "provisioned"
  global_cluster_identifier       = aws_rds_global_cluster.main.id
  db_subnet_group_name           = aws_db_subnet_group.secondary.name
  vpc_security_group_ids         = [aws_security_group.rds_secondary.id]
  backup_retention_period        = var.backup_retention_period
  preferred_backup_window        = "03:00-04:00"
  preferred_maintenance_window   = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  storage_encrypted              = true
  kms_key_id                     = aws_kms_key.secondary.arn
  deletion_protection            = var.environment == "prod"
  skip_final_snapshot            = var.environment != "prod"
  
  depends_on = [
    aws_rds_cluster_instance.primary
  ]
  
  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-aurora-secondary"
    Region = "secondary"
  })
}

resource "aws_rds_cluster_instance" "secondary" {
  provider                     = aws.secondary
  count                        = 2
  identifier                   = "${local.db_cluster_identifier}-secondary-${count.index + 1}"
  cluster_identifier           = aws_rds_cluster.secondary.id
  instance_class              = var.database_instance_class
  engine                      = aws_rds_cluster.secondary.engine
  engine_version              = aws_rds_cluster.secondary.engine_version
  performance_insights_enabled = true
  monitoring_interval         = local.enable_detailed_monitoring ? 60 : 0
  monitoring_role_arn         = local.enable_detailed_monitoring ? aws_iam_role.rds_monitoring_secondary.arn : null
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-aurora-instance-secondary-${count.index + 1}"
  })
}

# ==========================================
# APPLICATION LOAD BALANCERS
# ==========================================

resource "aws_lb" "primary" {
  name               = "${local.resource_prefix}-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets           = aws_subnet.primary_public[*].id
  
  enable_deletion_protection = var.environment == "prod"
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alb-primary"
  })
}

resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "${local.resource_prefix}-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets           = aws_subnet.secondary_public[*].id
  
  enable_deletion_protection = var.environment == "prod"
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alb-secondary"
  })
}

resource "aws_lb_target_group" "primary" {
  name     = "${local.resource_prefix}-tg-primary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id
  
  health_check {
    enabled             = true
    healthy_threshold   = local.health_threshold
    unhealthy_threshold = local.unhealthy_threshold
    timeout             = local.health_check_timeout
    interval            = local.health_check_interval
    path                = "/health"
    matcher             = "200"
  }
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
  
  deregistration_delay = 30
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-tg-primary"
  })
}

resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "${local.resource_prefix}-tg-secondary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id
  
  health_check {
    enabled             = true
    healthy_threshold   = local.health_threshold
    unhealthy_threshold = local.unhealthy_threshold
    timeout             = local.health_check_timeout
    interval            = local.health_check_interval
    path                = "/health"
    matcher             = "200"
  }
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
  
  deregistration_delay = 30
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-tg-secondary"
  })
}

resource "aws_lb_listener" "primary" {
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}

resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# ==========================================
# EC2 INSTANCES
# ==========================================

resource "aws_iam_role" "ec2" {
  name = "${local.resource_prefix}-ec2-role"
  
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

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.resource_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

resource "aws_iam_role" "ec2_secondary" {
  provider = aws.secondary
  name     = "${local.resource_prefix}-ec2-role"
  
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

resource "aws_iam_role_policy_attachment" "ec2_ssm_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.ec2_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_secondary" {
  provider = aws.secondary
  name     = "${local.resource_prefix}-ec2-profile"
  role     = aws_iam_role.ec2_secondary.name
}

resource "aws_instance" "primary" {
  count                  = var.ec2_instances_per_region
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.primary_private[count.index % local.az_count].id
  vpc_security_group_ids = [aws_security_group.ec2_primary.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Trading Platform - Primary Region - Instance ${count.index + 1}</h1>" > /var/www/html/index.html
    echo "OK" > /var/www/html/health
  EOF
  )
  
  root_block_device {
    encrypted = true
    kms_key_id = aws_kms_key.primary.arn
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ec2-primary-${count.index + 1}"
  })
}

resource "aws_instance" "secondary" {
  provider               = aws.secondary
  count                  = var.ec2_instances_per_region
  ami                    = data.aws_ami.amazon_linux_secondary.id
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.secondary_private[count.index % local.az_count].id
  vpc_security_group_ids = [aws_security_group.ec2_secondary.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_secondary.name
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Trading Platform - Secondary Region - Instance ${count.index + 1}</h1>" > /var/www/html/index.html
    echo "OK" > /var/www/html/health
  EOF
  )
  
  root_block_device {
    encrypted = true
    kms_key_id = aws_kms_key.secondary.arn
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ec2-secondary-${count.index + 1}"
  })
}

resource "aws_lb_target_group_attachment" "primary" {
  count            = var.ec2_instances_per_region
  target_group_arn = aws_lb_target_group.primary.arn
  target_id        = aws_instance.primary[count.index].id
  port             = 80
}

resource "aws_lb_target_group_attachment" "secondary" {
  provider         = aws.secondary
  count            = var.ec2_instances_per_region
  target_group_arn = aws_lb_target_group.secondary.arn
  target_id        = aws_instance.secondary[count.index].id
  port             = 80
}

# ==========================================
# ROUTE 53
# ==========================================

resource "aws_route53_zone" "main" {
  name = var.route53_domain
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-hosted-zone"
  })
}

resource "aws_route53_health_check" "primary" {
  fqdn              = aws_lb.primary.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = "2"
  request_interval  = "10"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-health-check-primary"
  })
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.route53_domain}"
  type    = "A"
  
  set_identifier = "Primary"
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
  
  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.route53_domain}"
  type    = "A"
  
  set_identifier = "Secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}

# ==========================================
# LAMBDA FAILOVER AUTOMATION
# ==========================================

resource "aws_iam_role" "lambda_failover" {
  name = "${local.resource_prefix}-lambda-failover-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_failover" {
  name = "${local.resource_prefix}-lambda-failover-policy"
  role = aws_iam_role.lambda_failover.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeNetworkInterfaces",
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:FailoverGlobalCluster",
          "rds:DescribeGlobalClusters",
          "rds:DescribeDBClusters",
          "rds:ModifyGlobalCluster"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetChange",
          "route53:ListResourceRecordSets"
        ]
        Resource = [
          "arn:aws:route53:::hostedzone/${aws_route53_zone.main.zone_id}",
          "arn:aws:route53:::change/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "route53:GetHealthCheck",
          "route53:GetHealthCheckStatus"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.primary.arn,
          aws_kms_key.secondary.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda_failover.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_lambda_function" "failover" {
  filename         = "failover_lambda.zip"
  function_name    = "${local.resource_prefix}-failover-orchestrator"
  role            = aws_iam_role.lambda_failover.arn
  handler         = "index.handler"
  runtime         = local.lambda_runtime
  timeout         = local.lambda_timeout
  memory_size     = 512
  
  environment {
    variables = {
      GLOBAL_CLUSTER_ID = aws_rds_global_cluster.main.id
      PRIMARY_REGION    = var.primary_region
      SECONDARY_REGION  = var.secondary_region
      HOSTED_ZONE_ID    = aws_route53_zone.main.zone_id
      DOMAIN_NAME       = var.route53_domain
      ENVIRONMENT       = var.environment
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.primary_private[*].id
    security_group_ids = [aws_security_group.lambda_primary.id]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-failover-lambda"
  })
  
  depends_on = [
    aws_iam_role_policy_attachment.lambda_vpc_execution,
    null_resource.lambda_zip
  ]
}

# Create Lambda deployment package
resource "null_resource" "lambda_zip" {
  triggers = {
    always_run = timestamp()
  }
  
  provisioner "local-exec" {
    command = <<EOF
cat > index.py <<'LAMBDA'
import json
import boto3
import os
import time
from datetime import datetime

def handler(event, context):
    """
    Orchestrate failover to secondary region
    """
    print(f"Failover event received: {json.dumps(event)}")
    
    global_cluster_id = os.environ['GLOBAL_CLUSTER_ID']
    primary_region = os.environ['PRIMARY_REGION']
    secondary_region = os.environ['SECONDARY_REGION']
    hosted_zone_id = os.environ['HOSTED_ZONE_ID']
    domain_name = os.environ['DOMAIN_NAME']
    
    # Initialize clients
    rds_primary = boto3.client('rds', region_name=primary_region)
    rds_secondary = boto3.client('rds', region_name=secondary_region)
    route53 = boto3.client('route53')
    
    try:
        # Step 1: Initiate Aurora Global Database failover
        print(f"Initiating failover of global cluster {global_cluster_id} to {secondary_region}")
        
        response = rds_primary.failover_global_cluster(
            GlobalClusterIdentifier=global_cluster_id,
            TargetDbClusterIdentifier=f"{global_cluster_id}-secondary"
        )
        
        print(f"Failover initiated: {response}")
        
        # Step 2: Wait for failover to complete (monitoring for up to 30 seconds)
        start_time = time.time()
        timeout = 25  # Leave 5 seconds buffer
        
        while time.time() - start_time < timeout:
            try:
                global_cluster = rds_primary.describe_global_clusters(
                    GlobalClusterIdentifier=global_cluster_id
                )['GlobalClusters'][0]
                
                # Check if secondary is now primary
                for member in global_cluster['GlobalClusterMembers']:
                    if secondary_region in member['DBClusterArn'] and member['IsWriter']:
                        print(f"Failover complete - {secondary_region} is now primary")
                        break
                else:
                    time.sleep(2)
                    continue
                break
            except Exception as e:
                print(f"Error checking failover status: {e}")
                time.sleep(2)
        
        # Step 3: Update Route53 records (already handled by health checks, but we can force update)
        print("Updating Route53 DNS records")
        
        # Force traffic to secondary by updating weighted routing
        change_batch = {
            'Changes': [{
                'Action': 'UPSERT',
                'ResourceRecordSet': {
                    'Name': f'db.{domain_name}',
                    'Type': 'CNAME',
                    'TTL': 60,
                    'ResourceRecords': [{'Value': f"{global_cluster_id}-secondary.cluster-ro-{secondary_region}.rds.amazonaws.com"}]
                }
            }]
        }
        
        route53.change_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            ChangeBatch=change_batch
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failover completed successfully',
                'new_primary': secondary_region,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        print(f"Failover failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Failover failed: {str(e)}',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
LAMBDA
zip -j failover_lambda.zip index.py
rm index.py
EOF
  }
}

# ==========================================
# EVENTBRIDGE
# ==========================================

resource "aws_cloudwatch_event_rule" "health_check_failure" {
  name        = "${local.resource_prefix}-health-check-failure"
  description = "Trigger failover on health check failure"
  
  event_pattern = jsonencode({
    source      = ["aws.route53"]
    detail-type = ["Route 53 Health Check State Change"]
    detail = {
      configurationId = [aws_route53_health_check.primary.id]
      newState        = ["ALARM"]
    }
  })
  
  tags = local.common_tags
}

resource "aws_cloudwatch_event_rule" "rds_failure" {
  name        = "${local.resource_prefix}-rds-failure"
  description = "Trigger failover on RDS failure"
  
  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Cluster Event"]
    detail = {
      SourceType = ["db-cluster"]
      EventCategories = ["failure"]
      SourceArn = [{
        "prefix" : aws_rds_cluster.primary.arn
      }]
    }
  })
  
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "health_lambda" {
  rule      = aws_cloudwatch_event_rule.health_check_failure.name
  target_id = "FailoverLambda"
  arn       = aws_lambda_function.failover.arn
}

resource "aws_cloudwatch_event_target" "rds_lambda" {
  rule      = aws_cloudwatch_event_rule.rds_failure.name
  target_id = "FailoverLambda"
  arn       = aws_lambda_function.failover.arn
}

resource "aws_lambda_permission" "allow_eventbridge_health" {
  statement_id  = "AllowExecutionFromEventBridgeHealth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.health_check_failure.arn
}

resource "aws_lambda_permission" "allow_eventbridge_rds" {
  statement_id  = "AllowExecutionFromEventBridgeRDS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.rds_failure.arn
}

# ==========================================
# MONITORING IAM ROLES
# ==========================================

resource "aws_iam_role" "rds_monitoring" {
  name = "${local.resource_prefix}-rds-monitoring"
  
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
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_iam_role" "rds_monitoring_secondary" {
  provider = aws.secondary
  name     = "${local.resource_prefix}-rds-monitoring"
  
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

resource "aws_iam_role_policy_attachment" "rds_monitoring_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.rds_monitoring_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ==========================================
# OUTPUTS
# ==========================================

output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    primary   = aws_vpc.primary.id
    secondary = aws_vpc.secondary.id
  }
}

output "alb_endpoints" {
  description = "ALB DNS endpoints"
  value = {
    primary   = aws_lb.primary.dns_name
    secondary = aws_lb.secondary.dns_name
  }
}

output "alb_arns" {
  description = "ALB ARNs"
  value = {
    primary   = aws_lb.primary.arn
    secondary = aws_lb.secondary.arn
  }
}

output "aurora_global_cluster_id" {
  description = "Aurora Global Cluster identifier"
  value       = aws_rds_global_cluster.main.id
}

output "aurora_endpoints" {
  description = "Aurora cluster endpoints"
  value = {
    global_writer = aws_rds_global_cluster.main.endpoint
    primary = {
      writer = aws_rds_cluster.primary.endpoint
      reader = aws_rds_cluster.primary.reader_endpoint
    }
    secondary = {
      writer = aws_rds_cluster.secondary.endpoint
      reader = aws_rds_cluster.secondary.reader_endpoint
    }
  }
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_nameservers" {
  description = "Route53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "application_url" {
  description = "Application URL with failover"
  value       = "https://app.${var.route53_domain}"
}

output "lambda_function_arn" {
  description = "Failover Lambda function ARN"
  value       = aws_lambda_function.failover.arn
}

output "kms_key_ids" {
  description = "KMS key IDs"
  value = {
    primary   = aws_kms_key.primary.id
    secondary = aws_kms_key.secondary.id
  }
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "ec2_instance_ids" {
  description = "EC2 instance IDs"
  value = {
    primary   = aws_instance.primary[*].id
    secondary = aws_instance.secondary[*].id
  }
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    primary = {
      alb    = aws_security_group.alb_primary.id
      ec2    = aws_security_group.ec2_primary.id
      rds    = aws_security_group.rds_primary.id
      lambda = aws_security_group.lambda_primary.id
    }
    secondary = {
      alb    = aws_security_group.alb_secondary.id
      ec2    = aws_security_group.ec2_secondary.id
      rds    = aws_security_group.rds_secondary.id
      lambda = aws_security_group.lambda_secondary.id
    }
  }
}

output "eventbridge_rule_arns" {
  description = "EventBridge rule ARNs"
  value = {
    health_check = aws_cloudwatch_event_rule.health_check_failure.arn
    rds_failure  = aws_cloudwatch_event_rule.rds_failure.arn
  }
}
```

## Key Features Implemented

### 1. **Multi-Region Architecture**
- Primary region (us-east-1) and secondary region (us-east-1) with complete infrastructure duplication
- VPCs with public, private, and database subnets across 3 AZs in each region
- Cross-region replication for Aurora Global Database and Secrets Manager

### 2. **30-Second Failover Capability**
- **Route 53 Health Checks**: Monitor primary ALB every 10 seconds
- **DNS Failover Routing**: Automatic DNS update to secondary region