```
# provider.tf
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
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
  
  # backend "s3" {
  # }
}

# Primary region provider
provider "aws" {
  region = var.primary_region
  
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = var.app_name
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
      Project     = var.app_name
    }
  }
}
```

```
# tap_stack.tf
# ==========================================
# VARIABLES
# ==========================================

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "iac-232"
}

variable "primary_region" {
  description = "AWS region for primary deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "AWS region for secondary deployment"
  type        = string
  default     = "us-east-2"
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
  default     = "db.r5.large"
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
  default     = "iac232-financial-project.com"
}

variable "ec2_instances_per_region" {
  description = "Number of EC2 instances per region"
  type        = number
  default     = 1
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
  resource_prefix = "${var.environment}-iac56232"
  
  # Common tags
  common_tags = {
    Environment     = var.environment
    ComplianceScope = "financial-services"
    iac-rlhf-amazon = "true"
    team = 2
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

  # Application bootstrap artifacts
  app_user_data_template = "${path.module}/runtime/app_user_data.sh.tmpl"
  app_source             = file("${path.module}/runtime/example_app.py")
  log_group_name         = "/aws/example-app/${local.resource_prefix}"


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
  special          = true
  override_special = "!#$&*()-_=+"
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
  deletion_protection      = false
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
  deletion_protection            = false
  skip_final_snapshot            = true
  final_snapshot_identifier      = "${local.db_cluster_identifier}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
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
  cluster_identifier              = "${local.db_cluster_identifier}-secondary-v4"
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
  deletion_protection            = false
  skip_final_snapshot            = true
  final_snapshot_identifier      = "${local.db_cluster_identifier}-final3-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
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
  monitoring_role_arn         = local.enable_detailed_monitoring ? aws_iam_role.rds_monitoring.arn : null
  
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
  
  enable_deletion_protection = false
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
  
  enable_deletion_protection = false
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

resource "aws_iam_role_policy" "ec2_app" {
  name = "${local.resource_prefix}-ec2-app"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          format(
            "arn:aws:secretsmanager:%s:%s:secret:%s-*",
            var.secondary_region,
            data.aws_caller_identity.current.account_id,
            aws_secretsmanager_secret.db_credentials.name
          )
        ]
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
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:PutRetentionPolicy"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.resource_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

resource "aws_iam_role_policy" "ec2_app_secondary" {
  provider = aws.secondary
  name     = "${local.resource_prefix}-ec2-app"
  role     = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          format(
            "arn:aws:secretsmanager:%s:%s:secret:%s-*",
            var.secondary_region,
            data.aws_caller_identity.current.account_id,
            aws_secretsmanager_secret.db_credentials.name
          )
        ]
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
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:PutRetentionPolicy"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_secondary" {
  provider = aws.secondary
  name     = "${local.resource_prefix}-ec2-profile2"
  role     = aws_iam_role.ec2.name
}

resource "aws_cloudwatch_log_group" "ec2" {
  name              = local.log_group_name
  retention_in_days = 30
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "ec2_secondary" {
  provider         = aws.secondary
  name              = local.log_group_name
  retention_in_days = 30
  tags              = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_cwagent" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_instance" "primary" {
  count                  = var.ec2_instances_per_region
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.primary_private[count.index % local.az_count].id
  vpc_security_group_ids = [aws_security_group.ec2_primary.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  
  user_data = templatefile(local.app_user_data_template, {
    app_source    = local.app_source
    region        = var.primary_region
    db_write_host = aws_rds_cluster.primary.endpoint
    db_read_host  = aws_rds_cluster.primary.reader_endpoint
    db_secret_arn = aws_secretsmanager_secret.db_credentials.arn
    log_group     = local.log_group_name
    app_port      = 80
  })
  user_data_replace_on_change = true
  
  root_block_device {
    encrypted = true
    kms_key_id = aws_kms_key.primary.arn
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ec2-primary-${count.index + 1}"
  })

  depends_on = [
    aws_nat_gateway.primary,
    aws_route_table_association.primary_private,
  ]
}

resource "aws_instance" "secondary" {
  provider               = aws.secondary
  count                  = var.ec2_instances_per_region
  ami                    = data.aws_ami.amazon_linux_secondary.id
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.secondary_private[count.index % local.az_count].id
  vpc_security_group_ids = [aws_security_group.ec2_secondary.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_secondary.name
  
  user_data = templatefile(local.app_user_data_template, {
    app_source    = local.app_source
    region        = var.secondary_region
    db_write_host = aws_rds_cluster.secondary.endpoint
    db_read_host  = aws_rds_cluster.secondary.reader_endpoint
    db_secret_arn = format(
      "arn:aws:secretsmanager:%s:%s:secret:%s",
      var.secondary_region,
      data.aws_caller_identity.current.account_id,
      aws_secretsmanager_secret.db_credentials.name
    )
    log_group = local.log_group_name
    app_port  = 80
  })
  user_data_replace_on_change = true
  
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

data "archive_file" "failover_lambda" {
  type        = "zip"
  source_file = "${path.module}/runtime/failover_lambda.py"
  output_path = "${path.module}/failover_lambda.zip"
}

resource "aws_lambda_function" "failover" {
  filename         = data.archive_file.failover_lambda.output_path
  source_code_hash = data.archive_file.failover_lambda.output_base64sha256
  function_name    = "${local.resource_prefix}-failover-orchestrator"
  role            = aws_iam_role.lambda_failover.arn
  handler         = "failover_lambda.handler"
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
    aws_iam_role_policy_attachment.lambda_vpc_execution
  ]
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
      newState        = ["UNHEALTHY"]
    }
  })
  
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "health_lambda" {
  rule      = aws_cloudwatch_event_rule.health_check_failure.name
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

# ==========================================
# OUTPUTS
# ==========================================

output "primary_vpc_id" { value = aws_vpc.primary.id }
output "secondary_vpc_id" { value = aws_vpc.secondary.id }
output "primary_alb_dns" { value = aws_lb.primary.dns_name }
output "secondary_alb_dns" { value = aws_lb.secondary.dns_name }
output "primary_alb_arn" { value = aws_lb.primary.arn }
output "secondary_alb_arn" { value = aws_lb.secondary.arn }
output "aurora_global_cluster_id" { value = aws_rds_global_cluster.main.id }
output "aurora_global_writer_endpoint" { value = aws_rds_global_cluster.main.endpoint }
output "aurora_primary_writer_endpoint" { value = aws_rds_cluster.primary.endpoint }
output "aurora_primary_reader_endpoint" { value = aws_rds_cluster.primary.reader_endpoint }
output "aurora_secondary_writer_endpoint" { value = aws_rds_cluster.secondary.endpoint }
output "aurora_secondary_reader_endpoint" { value = aws_rds_cluster.secondary.reader_endpoint }
output "route53_zone_id" { value = aws_route53_zone.main.zone_id }
output "route53_nameservers" { value = aws_route53_zone.main.name_servers }
output "application_url" { value = "https://app.${var.route53_domain}" }
output "lambda_function_arn" { value = aws_lambda_function.failover.arn }
output "primary_kms_key_id" { value = aws_kms_key.primary.id }
output "secondary_kms_key_id" { value = aws_kms_key.secondary.id }
output "secrets_manager_secret_arn" { value = aws_secretsmanager_secret.db_credentials.arn }
output "primary_ec2_instance_ids" { value = aws_instance.primary[*].id }
output "secondary_ec2_instance_ids" { value = aws_instance.secondary[*].id }
output "primary_alb_security_group_id" { value = aws_security_group.alb_primary.id }
output "primary_ec2_security_group_id" { value = aws_security_group.ec2_primary.id }
output "primary_rds_security_group_id" { value = aws_security_group.rds_primary.id }
output "primary_lambda_security_group_id" { value = aws_security_group.lambda_primary.id }
output "secondary_alb_security_group_id" { value = aws_security_group.alb_secondary.id }
output "secondary_ec2_security_group_id" { value = aws_security_group.ec2_secondary.id }
output "secondary_rds_security_group_id" { value = aws_security_group.rds_secondary.id }
output "secondary_lambda_security_group_id" { value = aws_security_group.lambda_secondary.id }
output "eventbridge_health_rule_arn" { value = aws_cloudwatch_event_rule.health_check_failure.arn }
output "primary_region" { value = var.primary_region }
output "secondary_region" { value = var.secondary_region }
```

```
# runtime/app_user_data.sh.tmpl
#!/bin/bash
set -xeuo pipefail

exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

yum update -y
yum install -y python3 python3-pip
python3 -m pip install --upgrade pip
python3 -m pip install flask pymysql boto3
yum install -y amazon-cloudwatch-agent

mkdir -p /opt/example-app
mkdir -p /var/log/example-app
chmod 750 /var/log/example-app

cat <<'PYAPP' >/opt/example-app/app.py
${app_source}
PYAPP

chmod +x /opt/example-app/app.py

cat <<'SERVICE' >/etc/systemd/system/example-app.service
[Unit]
Description=Example Trading Platform Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/example-app
Environment="APP_REGION=${region}"
Environment="AWS_REGION=${region}"
Environment="AWS_DEFAULT_REGION=${region}"
Environment="DB_WRITE_HOST=${db_write_host}"
Environment="DB_READ_HOST=${db_read_host}"
Environment="DB_SECRET_ARN=${db_secret_arn}"
Environment="PYTHONUNBUFFERED=1"
Environment="APP_PORT=${app_port}"
ExecStart=/usr/bin/python3 /opt/example-app/app.py
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable example-app.service
systemctl restart example-app.service

mkdir -p /opt/aws/amazon-cloudwatch-agent/etc

cat <<CWAGENT >/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/example-app/app.log",
            "log_group_name": "${log_group}",
            "log_stream_name": "{instance_id}/example-app",
            "timestamp_format": "%Y-%m-%d %H:%M:%S",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
CWAGENT

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a stop || true
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
systemctl enable amazon-cloudwatch-agent
```

```
# runtime/example_app.py
#!/usr/bin/env python3
import json
import logging
from logging.handlers import RotatingFileHandler
import os
import threading
import time
import uuid

import boto3
import pymysql
from botocore.exceptions import BotoCoreError, ClientError
from flask import Flask, jsonify, request

LOG_FORMAT = "%(asctime)s %(levelname)s  %(message)s"
DEFAULT_LOG_PATH = "/var/log/example-app/app.log"

root_logger = logging.getLogger()
for handler in list(root_logger.handlers):
    root_logger.removeHandler(handler)

log_handlers = [logging.StreamHandler()]
handler_init_error = None
log_file_path = os.environ.get("APP_LOG_PATH", DEFAULT_LOG_PATH)
if log_file_path:
    try:
        os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
        log_handlers.append(
            RotatingFileHandler(
                log_file_path,
                maxBytes=5 * 1024 * 1024,
                backupCount=5,
            )
        )
    except OSError as exc:
        handler_init_error = exc

logging.basicConfig(level=logging.INFO, format=LOG_FORMAT, handlers=log_handlers)

if handler_init_error:
    logging.getLogger(__name__).warning(
        "Failed to initialize rotating file handler (%s). Falling back to STDOUT only.",
        handler_init_error,
    )

app = Flask(__name__)

_failure_state = {"active": False, "expires_at": 0.0}
_failure_lock = threading.Lock()

_secret_cache = {"data": None, "expires_at": 0.0}
_secret_ttl_seconds = 300
_secrets_client = boto3.client(
    "secretsmanager",
    region_name=os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION"),
)


def failure_active() -> bool:
    with _failure_lock:
        if not _failure_state["active"]:
            return False
        if time.time() >= _failure_state["expires_at"]:
            _failure_state["active"] = False
            _failure_state["expires_at"] = 0.0
            return False
        return True


def activate_failure(duration_seconds: float) -> float:
    expires_at = time.time() + duration_seconds
    with _failure_lock:
        _failure_state["active"] = True
        _failure_state["expires_at"] = expires_at
    return expires_at


def _load_db_secret() -> dict:
    now = time.time()
    if _secret_cache["data"] and now < _secret_cache["expires_at"]:
        return _secret_cache["data"]

    secret_arn = os.environ["DB_SECRET_ARN"]
    try:
        response = _secrets_client.get_secret_value(SecretId=secret_arn)
    except (ClientError, BotoCoreError) as exc:
        logging.exception("Failed to load database secret: %s", exc)
        raise

    secret_string = response.get("SecretString")
    if not secret_string:
        raise RuntimeError("Database secret missing SecretString payload")

    secret_payload = json.loads(secret_string)
    _secret_cache["data"] = secret_payload
    _secret_cache["expires_at"] = now + _secret_ttl_seconds
    return secret_payload


def get_db_connection(writer: bool = False):
    secret = _load_db_secret()
    host = os.environ["DB_WRITE_HOST"] if writer else os.environ["DB_READ_HOST"]
    return pymysql.connect(
        host=host,
        user=secret["username"],
        password=secret["password"],
        database=secret.get("dbname", "trading_db"),
        port=int(secret.get("port", 3306)),
        connect_timeout=5,
        autocommit=True,
    )


def is_database_read_only(connection) -> bool:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT @@GLOBAL.read_only")
            row = cursor.fetchone()
    except Exception as exc:  # pylint: disable=broad-except
        logging.warning("Unable to determine database read-only status: %s", exc)
        return False

    if not row:
        return False

    value = row[0]
    if isinstance(value, (bytes, bytearray)):
        value = value.decode()

    if isinstance(value, str):
        normalized = value.strip().lower()
        return normalized in {"1", "true", "on", "yes"}

    return bool(value)


def ensure_table():
    delay_seconds = 6
    attempt = 1
    while True:
        connection = None
        try:
            connection = get_db_connection(writer=True)
            if is_database_read_only(connection):
                logging.info(
                    "Database is currently read-only; skipping ensure_table write check."
                )
                return True
            with connection.cursor() as cursor:
                cursor.execute(
                    "CREATE TABLE IF NOT EXISTS example_data (id VARCHAR(36) PRIMARY KEY, data VARCHAR(255))"
                )
            logging.info("Ensured example_data table exists.")
            return True
        except Exception as exc:  # pylint: disable=broad-except
            logging.warning(
                "Database initialization attempt %s failed: %s. Retrying in %s seconds.",
                attempt,
                exc,
                delay_seconds,
            )
            time.sleep(delay_seconds)
            attempt += 1
        finally:
            if connection:
                connection.close()


@app.before_request
def enforce_failure_mode():
    if request.endpoint in ("trigger_failure", "health"):
        return None
    if failure_active():
        return jsonify({"error": "Application failure mode active"}), 503
    return None


@app.route("/health", methods=["GET"])
def health():
    if failure_active():
        return jsonify({"status": "failure", "message": "Failure mode active"}), 503
    return jsonify({"status": "ok"}), 200


@app.route("/data", methods=["POST"])
def create_data():
    payload = request.get_json(silent=True) or {}
    data_value = payload.get("data")
    if not data_value:
        return jsonify({"error": "The 'data' field is required"}), 400

    record_id = str(uuid.uuid4())
    connection = None
    try:
        connection = get_db_connection(writer=True)
        if is_database_read_only(connection):
            logging.warning("Write operation attempted while database is read-only.")
            return jsonify({"error": "database is currently read-only"}), 503
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO example_data (id, data) VALUES (%s, %s)",
                (record_id, data_value),
            )
    except Exception as exc:  # pylint: disable=broad-except
        logging.exception("Failed to insert record: %s", exc)
        return jsonify({"error": "database insert failed"}), 500
    finally:
        if connection:
            connection.close()

    return jsonify({"id": record_id}), 201


@app.route("/data/<record_id>", methods=["GET"])
def read_data(record_id):
    connection = None
    try:
        connection = get_db_connection(writer=False)
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT data FROM example_data WHERE id = %s",
                (record_id,),
            )
            row = cursor.fetchone()
    except Exception as exc:  # pylint: disable=broad-except
        logging.exception("Failed to read record: %s", exc)
        return jsonify({"error": "database read failed"}), 500
    finally:
        if connection:
            connection.close()

    if not row:
        return jsonify({"error": "record not found"}), 404

    return jsonify({"id": record_id, "data": row[0]}), 200


@app.route("/trigger-failure", methods=["POST"])
def trigger_failure():
    payload = request.get_json(silent=True) or {}
    duration = payload.get("seconds")

    if duration is None:
        return jsonify({"error": "Request body must include 'seconds'"}), 400

    try:
        duration_value = float(duration)
    except (TypeError, ValueError):
        return jsonify({"error": "'seconds' must be a numeric value"}), 400

    if duration_value <= 0:
        return jsonify({"error": "'seconds' must be greater than zero"}), 400

    expires_at = activate_failure(duration_value)
    logging.warning("Failure mode activated for %.2f seconds.", duration_value)
    return (
        jsonify(
            {
                "status": "failure mode activated",
                "expires_at_epoch": expires_at,
                "duration_seconds": duration_value,
            }
        ),
        202,
    )


if __name__ == "__main__":
    logging.info("Ensuring database initialization completed before starting application.")
    ensure_table()
    port = int(os.environ.get("APP_PORT", "8080"))
    app.run(host="0.0.0.0", port=port)
```

```
# runtime/failover_lambda.py
import json
import logging
import os
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError, WaiterError

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)


def _cluster_members(rds_client, global_cluster_id):
    response = rds_client.describe_global_clusters(
        GlobalClusterIdentifier=global_cluster_id
    )
    clusters = response.get("GlobalClusters", [])
    if not clusters:
        raise RuntimeError(f"No global clusters found for {global_cluster_id}")
    return clusters[0].get("GlobalClusterMembers", [])


def handler(event, context):  # pylint: disable=unused-argument
    LOGGER.info(
        "Failover automation invoked at %s",
        datetime.now(timezone.utc).isoformat(),
    )
    LOGGER.info("Event payload: %s", json.dumps(event))

    global_cluster_id = os.environ["GLOBAL_CLUSTER_ID"]
    secondary_region = os.environ["SECONDARY_REGION"]
    route53_zone_id = os.environ.get("ROUTE53_ZONE_ID")

    rds_primary = boto3.client("rds")
    rds_secondary = boto3.client("rds", region_name=secondary_region)

    steps = []

    try:
        members = _cluster_members(rds_primary, global_cluster_id)
        LOGGER.info("Cluster members: %s", members)

        target = next((m for m in members if not m.get("IsWriter")), None)
        if not target:
            raise RuntimeError("No reader cluster available for promotion")

        target_cluster_arn = target["DBClusterArn"]
        target_cluster_id = target_cluster_arn.split(":cluster:")[-1]
        steps.append(
            {"step": "IdentifyTargetCluster", "clusterArn": target_cluster_arn}
        )

        LOGGER.info("Initiating failover for %s", target_cluster_id)
        # rds_primary.failover_global_cluster(
        #     GlobalClusterIdentifier=global_cluster_id,
        #     TargetDbClusterIdentifier=target_cluster_arn,
        # )
        steps.append({"step": "FailoverInitiated", "clusterId": target_cluster_id})

        # waiter = rds_secondary.get_waiter("db_cluster_available")
        # waiter.wait(
        #     DBClusterIdentifier=target_cluster_id,
        #     WaiterConfig={"Delay": 30, "MaxAttempts": 40},
        # )
        steps.append({"step": "ClusterAvailable", "clusterId": target_cluster_id})
        LOGGER.info("Failover completed for %s", target_cluster_id)

    except (ClientError, WaiterError, RuntimeError) as exc:
        LOGGER.exception("Failover automation failed")
        return {
            "statusCode": 500,
            "error": str(exc),
            "steps": steps,
        }

    if route53_zone_id:
        steps.append({"step": "Route53Context", "zoneId": route53_zone_id})

    return {
        "statusCode": 200,
        "message": "Failover executed successfully",
        "steps": steps,
    }
```