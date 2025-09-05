I'll design a comprehensive Terraform configuration that meets all your requirements. Here's the complete solution:

## File Structure

### provider.tf
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
      version = "~> 3.1"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {
  }
}

# Primary provider for us-east-1
provider "aws" {
  alias  = "use1"
  region = "us-east-1"
  
  default_tags {
    tags = local.common_tags
  }
}

# Secondary provider for us-west-2
provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
  
  default_tags {
    tags = local.common_tags
  }
}

provider "random" {}
```

### lib/main.tf
```hcl
# ============================================================================
# VARIABLES
# ============================================================================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "multi-region-infra"
}

variable "regions" {
  description = "List of AWS regions to deploy to"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "mycompany-data"
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
  
  validation {
    condition = alltrue([
      for cidr in var.allowed_ssh_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All values must be valid CIDR blocks."
  }
}

variable "allowed_http_cidrs" {
  description = "CIDR blocks allowed for HTTP access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "db_master_username" {
  description = "Master username for RDS instance"
  type        = string
  default     = "admin"
}

variable "db_master_password" {
  description = "Master password for RDS instance"
  type        = string
  sensitive   = true
  default     = null
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  # Common tags applied to all resources
  common_tags = merge({
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }, var.additional_tags)
  
  # Generate unique identifiers
  unique_suffix = random_id.unique.hex
  
  # Naming convention
  name_prefix = "${var.project}-${var.environment}"
  
  # Regional configurations
  region_configs = {
    "us-east-1" = {
      provider_alias = "use1"
      az_count      = 3
      vpc_cidr      = "10.1.0.0/16"
    }
    "us-west-2" = {
      provider_alias = "usw2"
      az_count      = 3
      vpc_cidr      = "10.2.0.0/16"
    }
  }
}

# ============================================================================
# RANDOM RESOURCES
# ============================================================================

resource "random_id" "unique" {
  byte_length = 4
}

resource "random_password" "db_password" {
  count   = var.db_master_password == null ? 1 : 0
  length  = 16
  special = true
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_availability_zones" "use1" {
  provider = aws.use1
  state    = "available"
}

data "aws_availability_zones" "usw2" {
  provider = aws.usw2
  state    = "available"
}

data "aws_ami" "amazon_linux_use1" {
  provider    = aws.use1
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_usw2" {
  provider    = aws.usw2
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Use data source (no hard-coded ARN)
data "aws_iam_policy" "rds_enhanced_monitoring" {
  name = "AmazonRDSEnhancedMonitoringRole"
}

# ============================================================================
# KMS KEYS
# ============================================================================

resource "aws_kms_key" "s3_key_use1" {
  provider                = aws.use1
  description             = "KMS key for S3 encryption in us-east-1"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-s3-key-use1"
    Region = "us-east-1"
  })
}

resource "aws_kms_alias" "s3_key_alias_use1" {
  provider      = aws.use1
  name          = "alias/${local.name_prefix}-s3-key-use1"
  target_key_id = aws_kms_key.s3_key_use1.key_id
}

resource "aws_kms_key" "s3_key_usw2" {
  provider                = aws.usw2
  description             = "KMS key for S3 encryption in us-west-2"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-s3-key-usw2"
    Region = "us-west-2"
  })
}

resource "aws_kms_alias" "s3_key_alias_usw2" {
  provider      = aws.usw2
  name          = "alias/${local.name_prefix}-s3-key-usw2"
  target_key_id = aws_kms_key.s3_key_usw2.key_id
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

# Audit buckets for access logging
resource "aws_s3_bucket" "audit_use1" {
  provider = aws.use1
  bucket   = "${var.s3_bucket_prefix}-audit-use1-${local.unique_suffix}"
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-audit-bucket-use1"
    Region = "us-east-1"
    Type   = "audit"
  })
}

resource "aws_s3_bucket" "audit_usw2" {
  provider = aws.usw2
  bucket   = "${var.s3_bucket_prefix}-audit-usw2-${local.unique_suffix}"
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-audit-bucket-usw2"
    Region = "us-west-2"
    Type   = "audit"
  })
}

# Main S3 buckets
resource "aws_s3_bucket" "main_use1" {
  provider = aws.use1
  bucket   = "${var.s3_bucket_prefix}-main-use1-${local.unique_suffix}"
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-main-bucket-use1"
    Region = "us-east-1"
    Type   = "main"
  })
}

resource "aws_s3_bucket" "main_usw2" {
  provider = aws.usw2
  bucket   = "${var.s3_bucket_prefix}-main-usw2-${local.unique_suffix}"
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-main-bucket-usw2"
    Region = "us-west-2"
    Type   = "main"
  })
}

# S3 bucket configurations
resource "aws_s3_bucket_versioning" "main_use1" {
  provider = aws.use1
  bucket   = aws_s3_bucket.main_use1.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "main_usw2" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.main_usw2.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main_use1" {
  provider = aws.use1
  bucket   = aws_s3_bucket.main_use1.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key_use1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main_usw2" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.main_usw2.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key_usw2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_logging" "main_use1" {
  provider = aws.use1
  bucket   = aws_s3_bucket.main_use1.id
  
  target_bucket = aws_s3_bucket.audit_use1.id
  target_prefix = "access-logs/"
}

resource "aws_s3_bucket_logging" "main_usw2" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.main_usw2.id
  
  target_bucket = aws_s3_bucket.audit_usw2.id
  target_prefix = "access-logs/"
}

resource "aws_s3_bucket_public_access_block" "main_use1" {
  provider = aws.use1
  bucket   = aws_s3_bucket.main_use1.id
  
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "main_usw2" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.main_usw2.id
  
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_account_public_access_block" "account" {
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "main_use1" {
  provider   = aws.use1
  bucket     = aws_s3_bucket.main_use1.id
  depends_on = [
    aws_s3_bucket_public_access_block.main_use1,
    aws_s3_account_public_access_block.account,
  ]
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:ListBucket"
        Resource  = aws_s3_bucket.main_use1.arn
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "main_usw2" {
  provider   = aws.usw2
  bucket     = aws_s3_bucket.main_usw2.id
  depends_on = [
    aws_s3_bucket_public_access_block.main_use1,
    aws_s3_account_public_access_block.account,
  ]
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:ListBucket"
        Resource  = aws_s3_bucket.main_usw2.arn
      }
    ]
  })
}

# ============================================================================
# VPC AND NETWORKING
# ============================================================================

# VPC for us-east-1
resource "aws_vpc" "main_use1" {
  provider             = aws.use1
  cidr_block           = local.region_configs["us-east-1"].vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-use1"
    Region = "us-east-1"
  })
}

# VPC for us-west-2
resource "aws_vpc" "main_usw2" {
  provider             = aws.usw2
  cidr_block           = local.region_configs["us-west-2"].vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-usw2"
    Region = "us-west-2"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "main_use1" {
  provider = aws.use1
  vpc_id   = aws_vpc.main_use1.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-igw-use1"
    Region = "us-east-1"
  })
}

resource "aws_internet_gateway" "main_usw2" {
  provider = aws.usw2
  vpc_id   = aws_vpc.main_usw2.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-igw-usw2"
    Region = "us-west-2"
  })
}

# Public Subnets
resource "aws_subnet" "public_use1" {
  count                   = 2
  provider                = aws.use1
  vpc_id                  = aws_vpc.main_use1.id
  cidr_block              = cidrsubnet(local.region_configs["us-east-1"].vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.use1.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-public-subnet-use1-${count.index + 1}"
    Region = "us-east-1"
    Type   = "public"
  })
}

resource "aws_subnet" "public_usw2" {
  count                   = 2
  provider                = aws.usw2
  vpc_id                  = aws_vpc.main_usw2.id
  cidr_block              = cidrsubnet(local.region_configs["us-west-2"].vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.usw2.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-public-subnet-usw2-${count.index + 1}"
    Region = "us-west-2"
    Type   = "public"
  })
}

# Private Subnets for RDS
resource "aws_subnet" "private_use1" {
  count             = 2
  provider          = aws.use1
  vpc_id            = aws_vpc.main_use1.id
  cidr_block        = cidrsubnet(local.region_configs["us-east-1"].vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.use1.names[count.index]
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-private-subnet-use1-${count.index + 1}"
    Region = "us-east-1"
    Type   = "private"
  })
}

resource "aws_subnet" "private_usw2" {
  count             = 2
  provider          = aws.usw2
  vpc_id            = aws_vpc.main_usw2.id
  cidr_block        = cidrsubnet(local.region_configs["us-west-2"].vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.usw2.names[count.index]
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-private-subnet-usw2-${count.index + 1}"
    Region = "us-west-2"
    Type   = "private"
  })
}

# Route Tables
resource "aws_route_table" "public_use1" {
  provider = aws.use1
  vpc_id   = aws_vpc.main_use1.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_use1.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-public-rt-use1"
    Region = "us-east-1"
  })
}

resource "aws_route_table" "public_usw2" {
  provider = aws.usw2
  vpc_id   = aws_vpc.main_usw2.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_usw2.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-public-rt-usw2"
    Region = "us-west-2"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public_use1" {
  count          = length(aws_subnet.public_use1)
  provider       = aws.use1
  subnet_id      = aws_subnet.public_use1[count.index].id
  route_table_id = aws_route_table.public_use1.id
}

resource "aws_route_table_association" "public_usw2" {
  count          = length(aws_subnet.public_usw2)
  provider       = aws.usw2
  subnet_id      = aws_subnet.public_usw2[count.index].id
  route_table_id = aws_route_table.public_usw2.id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

resource "aws_security_group" "ec2_use1" {
  provider    = aws.use1
  name        = "${local.name_prefix}-ec2-sg-use1"
  description = "Security group for EC2 instance in us-east-1"
  vpc_id      = aws_vpc.main_use1.id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
    description = "SSH access"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidrs
    description = "HTTP access"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-ec2-sg-use1"
    Region = "us-east-1"
  })
}

resource "aws_security_group" "ec2_usw2" {
  provider    = aws.usw2
  name        = "${local.name_prefix}-ec2-sg-usw2"
  description = "Security group for EC2 instance in us-west-2"
  vpc_id      = aws_vpc.main_usw2.id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
    description = "SSH access"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidrs
    description = "HTTP access"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-ec2-sg-usw2"
    Region = "us-west-2"
  })
}

resource "aws_security_group" "rds_use1" {
  provider    = aws.use1
  name        = "${local.name_prefix}-rds-sg-use1"
  description = "Security group for RDS instance in us-east-1"
  vpc_id      = aws_vpc.main_use1.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_use1.id]
    description     = "MySQL access from EC2"
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rds-sg-use1"
    Region = "us-east-1"
  })
}

resource "aws_security_group" "rds_usw2" {
  provider    = aws.usw2
  name        = "${local.name_prefix}-rds-sg-usw2"
  description = "Security group for RDS instance in us-west-2"
  vpc_id      = aws_vpc.main_usw2.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_usw2.id]
    description     = "MySQL access from EC2"
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rds-sg-usw2"
    Region = "us-west-2"
  })
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"
  
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

resource "aws_iam_policy" "s3_access" {
  name        = "${local.name_prefix}-s3-access-policy"
  description = "Policy for EC2 to access S3 buckets"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.main_use1.arn,
          "${aws_s3_bucket.main_use1.arn}/*",
          aws_s3_bucket.main_usw2.arn,
          "${aws_s3_bucket.main_usw2.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_key_use1.arn,
          aws_kms_key.s3_key_usw2.arn
        ]
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
  
  tags = local.common_tags
}

# ============================================================================
# RDS SUBNET GROUPS
# ============================================================================

resource "aws_db_subnet_group" "main_use1" {
  provider   = aws.use1
  name       = "${local.name_prefix}-db-subnet-group-use1"
  subnet_ids = aws_subnet.private_use1[*].id
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-db-subnet-group-use1"
    Region = "us-east-1"
  })
}

resource "aws_db_subnet_group" "main_usw2" {
  provider   = aws.usw2
  name       = "${local.name_prefix}-db-subnet-group-usw2"
  subnet_ids = aws_subnet.private_usw2[*].id
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-db-subnet-group-usw2"
    Region = "us-west-2"
  })
}

# ============================================================================
# RDS INSTANCES
# ============================================================================

resource "aws_db_instance" "main_use1" {
  provider = aws.use1
  
  identifier     = "${local.name_prefix}-db-use1"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.m5.large"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "maindb"
  username = var.db_master_username
  password = var.db_master_password != null ? var.db_master_password : random_password.db_password[0].result
  
  vpc_security_group_ids = [aws_security_group.rds_use1.id]
  db_subnet_group_name   = aws_db_subnet_group.main_use1.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  apply_immediately = false
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${local.name_prefix}-db-use1-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  multi_az = true
  
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-db-use1"
    Region = "us-east-1"
  })
  
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_db_instance" "main_usw2" {
  provider = aws.usw2
  
  identifier     = "${local.name_prefix}-db-usw2"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.m5.large"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "maindb"
  username = var.db_master_username
  password = var.db_master_password != null ? var.db_master_password : random_password.db_password[0].result
  
  vpc_security_group_ids = [aws_security_group.rds_usw2.id]
  db_subnet_group_name   = aws_db_subnet_group.main_usw2.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  apply_immediately = false
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${local.name_prefix}-db-usw2-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  multi_az = true

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-db-usw2"
    Region = "us-west-2"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# RDS Enhanced Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
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
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = data.aws_iam_policy.rds_enhanced_monitoring.arn
}

# ============================================================================
# EC2 INSTANCES
# ============================================================================

resource "aws_instance" "main_use1" {
  provider                    = aws.use1
  ami                        = data.aws_ami.amazon_linux_use1.id
  instance_type              = "t2.micro"
  key_name                   = aws_key_pair.main_use1.key_name
  vpc_security_group_ids     = [aws_security_group.ec2_use1.id]
  subnet_id                  = aws_subnet.public_use1[0].id
  iam_instance_profile       = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = true
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd aws-cli

    # Start and enable Apache
    systemctl start httpd
    systemctl enable httpd

    # Create a simple index page
    cat > /var/www/html/index.html << 'HTML'
    <!DOCTYPE html>
    <html>
    <head>
        <title>Multi-Region Infrastructure</title>
    </head>
    <body>
        <h1>Welcome to us-east-1</h1>
        <p>This instance can access S3 bucket: ${aws_s3_bucket.main_use1.bucket}</p>
        <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
        <p>Region: us-east-1</p>
    </body>
    </html>
HTML

    # Test S3 access
    aws s3 ls s3://${aws_s3_bucket.main_use1.bucket} --region us-east-1 > /var/log/s3-test.log 2>&1
    EOF
  )
  
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-ec2-use1"
    Region = "us-east-1"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "main_usw2" {
  provider                    = aws.usw2
  ami                        = data.aws_ami.amazon_linux_usw2.id
  instance_type              = "t2.micro"
  key_name                   = aws_key_pair.main_usw2.key_name
  vpc_security_group_ids     = [aws_security_group.ec2_usw2.id]
  subnet_id                  = aws_subnet.public_usw2[0].id
  iam_instance_profile       = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = true
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd aws-cli

    # Start and enable Apache
    systemctl start httpd
    systemctl enable httpd

    # Create a simple index page
    cat > /var/www/html/index.html << 'HTML'
    <!DOCTYPE html>
    <html>
    <head>
        <title>Multi-Region Infrastructure</title>
    </head>
    <body>
        <h1>Welcome to us-west-2</h1>
        <p>This instance can access S3 bucket: ${aws_s3_bucket.main_usw2.bucket}</p>
        <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
        <p>Region: us-west-2</p>
    </body>
    </html>
HTML

    # Test S3 access
    aws s3 ls s3://${aws_s3_bucket.main_usw2.bucket} --region us-west-2 > /var/log/s3-test.log 2>&1
    EOF
  )
  
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-ec2-usw2"
    Region = "us-west-2"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# KEY PAIRS (for EC2 access)
# ============================================================================

resource "tls_private_key" "main" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "main_use1" {
  provider   = aws.use1
  key_name   = "${local.name_prefix}-keypair-use1"
  public_key = tls_private_key.main.public_key_openssh
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-keypair-use1"
    Region = "us-east-1"
  })
}

resource "aws_key_pair" "main_usw2" {
  provider   = aws.usw2
  key_name   = "${local.name_prefix}-keypair-usw2"
  public_key = tls_private_key.main.public_key_openssh
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-keypair-usw2"
    Region = "us-west-2"
  })
}

# ============================================================================
# SECRETS MANAGER (for RDS password)
# ============================================================================

resource "aws_secretsmanager_secret" "db_password_use1" {
  provider                = aws.use1
  name                   = "${local.name_prefix}-db-password-use1"
  description            = "RDS master password for us-east-1"
  recovery_window_in_days = 7
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-db-password-use1"
    Region = "us-east-1"
  })
}

resource "aws_secretsmanager_secret_version" "db_password_use1" {
  provider  = aws.use1
  secret_id = aws_secretsmanager_secret.db_password_use1.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = var.db_master_password != null ? var.db_master_password : random_password.db_password[0].result
  })
}

resource "aws_secretsmanager_secret" "db_password_usw2" {
  provider                = aws.usw2
  name                   = "${local.name_prefix}-db-password-usw2"
  description            = "RDS master password for us-west-2"
  recovery_window_in_days = 7
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-db-password-usw2"
    Region = "us-west-2"
  })
}

resource "aws_secretsmanager_secret_version" "db_password_usw2" {
  provider  = aws.usw2
  secret_id = aws_secretsmanager_secret.db_password_usw2.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = var.db_master_password != null ? var.db_master_password : random_password.db_password[0].result
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "s3_bucket_names" {
  description = "Names of the S3 buckets created"
  value = {
    main_use1  = aws_s3_bucket.main_use1.bucket
    main_usw2  = aws_s3_bucket.main_usw2.bucket
    audit_use1 = aws_s3_bucket.audit_use1.bucket
    audit_usw2 = aws_s3_bucket.audit_usw2.bucket
  }
}

output "ec2_public_ips" {
  description = "Public IP addresses of EC2 instances"
  value = {
    use1 = aws_instance.main_use1.public_ip
    usw2 = aws_instance.main_usw2.public_ip
  }
}

output "rds_ids" {
  description = "RDS instance identifiers per region"
  value = {
    use1 = aws_db_instance.main_use1.id
    usw2 = aws_db_instance.main_usw2.id
  }
}

output "rds_endpoints" {
  description = "RDS instance endpoints"
  value = {
    use1 = aws_db_instance.main_use1.endpoint
    usw2 = aws_db_instance.main_usw2.endpoint
  }
  sensitive = true
}

output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    use1 = aws_vpc.main_use1.id
    usw2 = aws_vpc.main_usw2.id
  }
}

output "private_key_pem" {
  description = "Private key for SSH access to EC2 instances"
  value       = tls_private_key.main.private_key_pem
  sensitive   = true
}

output "secrets_manager_arns" {
  description = "ARNs of Secrets Manager secrets containing RDS credentials"
  value = {
    use1 = aws_secretsmanager_secret.db_password_use1.arn
    usw2 = aws_secretsmanager_secret.db_password_usw2.arn
  }
  sensitive = true
}
```
