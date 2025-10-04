# ===========================
# Variables
# ===========================


variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-2"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-1"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "10.0.0.0/16" # Adjust this to your actual IP range
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

# ===========================
# Locals
# ===========================

locals {
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"
  
  # Naming conventions
  resource_prefix = "tap-stack"
  
  # Common tags
  common_tags = {
    Environment  = var.environment
    ownership    = "self"
    departmental = "businessunit"
  }
  
  # Subnet configurations
  primary_public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  primary_private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  secondary_public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  secondary_private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]
}

# ===========================
# Data Sources
# ===========================

# Get availability zones for primary region
data "aws_availability_zones" "primary" {
  provider = aws.us_east_2
  state    = "available"
}

# Get availability zones for secondary region
data "aws_availability_zones" "secondary" {
  provider = aws.us_west_1
  state    = "available"
}

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "primary_amazon_linux" {
  provider    = aws.us_east_2
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

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "secondary_amazon_linux" {
  provider    = aws.us_west_1
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

# ===========================
# Random Resources for RDS
# ===========================

# Generate random username for primary RDS
resource "random_string" "primary_rds_username" {
  length  = 8
  special = false
  upper   = true
  lower   = true
  numeric = false
}

# Generate random password for primary RDS
resource "random_password" "primary_rds_password" {
  length  = 16
  special = true
  # AWS RDS allows these special characters: !#$%&'()*+,-./:;<=>?@[$^_`{|}~
  override_special = "!#$%&*+-.:=?[]^_{|}~"
}

# Generate random username for secondary RDS
resource "random_string" "secondary_rds_username" {
  length  = 8
  special = false
  upper   = true
  lower   = true
  numeric = false
}

# Generate random password for secondary RDS
resource "random_password" "secondary_rds_password" {
  length  = 16
  special = true
  override_special = "!#$%&*+-.:=?[]^_{|}~"
}

# ===========================
# PRIMARY REGION RESOURCES (us-east-2)
# ===========================

# --- VPC and Networking for Primary Region ---

# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.us_east_2
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-vpc-primary"
  })
}

# Internet Gateway for Primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-igw-primary"
  })
}

# Public Subnets for Primary VPC
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_2
  count                   = length(local.primary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-subnet-primary-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets for Primary VPC
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_2
  count             = length(local.primary_private_subnet_cidrs)
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-subnet-primary-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in Primary Region
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_2
  count    = length(local.primary_public_subnet_cidrs)
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-eip-nat-primary-${count.index + 1}"
  })
}

# NAT Gateways for Primary VPC
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_2
  count         = length(aws_subnet.primary_public)
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-primary-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.primary]
}

# Public Route Table for Primary VPC
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rt-public-primary"
  })
}

# Private Route Tables for Primary VPC
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_2
  count    = length(aws_subnet.primary_private)
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rt-private-primary-${count.index + 1}"
  })
}

# Route Table Associations for Public Subnets in Primary VPC
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Route Table Associations for Private Subnets in Primary VPC
resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# --- EC2 and Security Groups for Primary Region ---

# Security Group for EC2 in Primary Region
resource "aws_security_group" "primary_ec2" {
  provider    = aws.us_east_2
  name        = "${local.resource_prefix}-ec2-sg-primary"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }
  
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ec2-sg-primary"
  })
}

# EC2 Instance in Primary Region
resource "aws_instance" "primary" {
  provider               = aws.us_east_2
  ami                    = data.aws_ami.primary_amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.primary_public[0].id
  vpc_security_group_ids = [aws_security_group.primary_ec2.id]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ec2-primary"
  })
}

# --- RDS and Secrets Manager for Primary Region ---

# Security Group for RDS in Primary Region
resource "aws_security_group" "primary_rds" {
  provider    = aws.us_east_2
  name        = "${local.resource_prefix}-rds-sg-primary"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    description     = "PostgreSQL from VPC"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = [local.primary_vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rds-sg-primary"
  })
}

# DB Subnet Group for Primary RDS
resource "aws_db_subnet_group" "primary" {
  provider    = aws.us_east_2
  name        = "${local.resource_prefix}-db-subnet-group-primary"
  description = "Database subnet group for RDS"
  subnet_ids  = aws_subnet.primary_private[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-group-primary"
  })
}

# RDS PostgreSQL Instance in Primary Region
resource "aws_db_instance" "primary" {
  provider                    = aws.us_east_2
  identifier                  = "${local.resource_prefix}-postgres-primary"
  engine                      = "postgres"
  engine_version              = "17.6"
  instance_class              = "db.t3.micro"
  allocated_storage           = 20
  storage_type                = "gp3"
  storage_encrypted           = true
  db_name                     = "tapdb"
  username                    = "a${random_string.primary_rds_username.result}"
  password                    = random_password.primary_rds_password.result
  parameter_group_name        = "default.postgres17"
  db_subnet_group_name        = aws_db_subnet_group.primary.name
  vpc_security_group_ids      = [aws_security_group.primary_rds.id]
  publicly_accessible         = false
  multi_az                    = true
  auto_minor_version_upgrade  = true
  backup_retention_period     = 7
  backup_window               = "03:00-04:00"
  maintenance_window          = "sun:04:00-sun:05:00"
  skip_final_snapshot         = true
  deletion_protection         = false
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-postgres-primary"
  })
}

# Secrets Manager Secret for Primary RDS Credentials
resource "aws_secretsmanager_secret" "primary_rds" {
  provider                = aws.us_east_2
  name                    = "${local.resource_prefix}-rds-credentials-primary"
  description             = "RDS master credentials for primary region"
  recovery_window_in_days = 0
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rds-secret-primary"
  })
}

# Secrets Manager Secret Version for Primary RDS
resource "aws_secretsmanager_secret_version" "primary_rds" {
  provider  = aws.us_east_2
  secret_id = aws_secretsmanager_secret.primary_rds.id
  secret_string = jsonencode({
    username = "a${random_string.primary_rds_username.result}"
    password = random_password.primary_rds_password.result
    engine   = "postgres"
    host     = aws_db_instance.primary.endpoint
    port     = 5432
    dbname   = "tapdb"
  })
}

# --- VPC Flow Logs for Primary Region ---

# CloudWatch Log Group for VPC Flow Logs in Primary Region
resource "aws_cloudwatch_log_group" "primary_flow_logs" {
  provider          = aws.us_east_2
  name              = "/aws/vpc/${local.resource_prefix}-primary"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-flow-logs-primary"
  })
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  provider = aws.us_east_2
  name     = "${local.resource_prefix}-flow-logs-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-flow-logs-role"
  })
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_logs" {
  provider = aws.us_east_2
  name     = "${local.resource_prefix}-flow-logs-policy"
  role     = aws_iam_role.flow_logs.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}

# VPC Flow Logs for Primary VPC
resource "aws_flow_log" "primary" {
  provider             = aws.us_east_2
  iam_role_arn         = aws_iam_role.flow_logs.arn
  log_destination      = aws_cloudwatch_log_group.primary_flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.primary.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-flow-log-primary"
  })
}

# ===========================
# SECONDARY REGION RESOURCES (us-west-1)
# ===========================

# --- VPC and Networking for Secondary Region ---

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_1
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-vpc-secondary"
  })
}

# Internet Gateway for Secondary VPC
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-igw-secondary"
  })
}

# Public Subnets for Secondary VPC
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_1
  count                   = length(local.secondary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-subnet-secondary-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets for Secondary VPC
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_1
  count             = length(local.secondary_private_subnet_cidrs)
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-subnet-secondary-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in Secondary Region
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_1
  count    = length(local.secondary_public_subnet_cidrs)
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-eip-nat-secondary-${count.index + 1}"
  })
}

# NAT Gateways for Secondary VPC
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_1
  count         = length(aws_subnet.secondary_public)
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-secondary-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.secondary]
}

# Public Route Table for Secondary VPC
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rt-public-secondary"
  })
}

# Private Route Tables for Secondary VPC
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_1
  count    = length(aws_subnet.secondary_private)
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rt-private-secondary-${count.index + 1}"
  })
}

# Route Table Associations for Public Subnets in Secondary VPC
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Route Table Associations for Private Subnets in Secondary VPC
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# --- EC2 and Security Groups for Secondary Region ---

# Security Group for EC2 in Secondary Region
resource "aws_security_group" "secondary_ec2" {
  provider    = aws.us_west_1
  name        = "${local.resource_prefix}-ec2-sg-secondary"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }
  
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ec2-sg-secondary"
  })
}

# EC2 Instance in Secondary Region
resource "aws_instance" "secondary" {
  provider               = aws.us_west_1
  ami                    = data.aws_ami.secondary_amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.secondary_public[0].id
  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-ec2-secondary"
  })
}

# --- RDS and Secrets Manager for Secondary Region ---

# Security Group for RDS in Secondary Region
resource "aws_security_group" "secondary_rds" {
  provider    = aws.us_west_1
  name        = "${local.resource_prefix}-rds-sg-secondary"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    description     = "PostgreSQL from VPC"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = [local.secondary_vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rds-sg-secondary"
  })
}

# DB Subnet Group for Secondary RDS
resource "aws_db_subnet_group" "secondary" {
  provider    = aws.us_west_1
  name        = "${local.resource_prefix}-db-subnet-group-secondary"
  description = "Database subnet group for RDS"
  subnet_ids  = aws_subnet.secondary_private[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-group-secondary"
  })
}

# RDS PostgreSQL Instance in Secondary Region
resource "aws_db_instance" "secondary" {
  provider                    = aws.us_west_1
  identifier                  = "${local.resource_prefix}-postgres-secondary"
  engine                      = "postgres"
  engine_version              = "17.6"
  instance_class              = "db.t3.micro"
  allocated_storage           = 20
  storage_type                = "gp3"
  storage_encrypted           = true
  db_name                     = "tapdb"
  username                    = "b${random_string.secondary_rds_username.result}"
  password                    = random_password.secondary_rds_password.result
  parameter_group_name        = "default.postgres17"
  db_subnet_group_name        = aws_db_subnet_group.secondary.name
  vpc_security_group_ids      = [aws_security_group.secondary_rds.id]
  publicly_accessible         = false
  multi_az                    = true
  auto_minor_version_upgrade  = true
  backup_retention_period     = 7
  backup_window               = "03:00-04:00"
  maintenance_window          = "sun:04:00-sun:05:00"
  skip_final_snapshot         = true
  deletion_protection         = false
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-postgres-secondary"
  })
}

# Secrets Manager Secret for Secondary RDS Credentials
resource "aws_secretsmanager_secret" "secondary_rds" {
  provider                = aws.us_west_1
  name                    = "${local.resource_prefix}-rds-credentials-secondary"
  description             = "RDS master credentials for secondary region"
  recovery_window_in_days = 0
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rds-secret-secondary"
  })
}

# Secrets Manager Secret Version for Secondary RDS
resource "aws_secretsmanager_secret_version" "secondary_rds" {
  provider  = aws.us_west_1
  secret_id = aws_secretsmanager_secret.secondary_rds.id
  secret_string = jsonencode({
    username = "b${random_string.secondary_rds_username.result}"
    password = random_password.secondary_rds_password.result
    engine   = "postgres"
    host     = aws_db_instance.secondary.endpoint
    port     = 5432
    dbname   = "tapdb"
  })
}

# --- VPC Flow Logs for Secondary Region ---

# CloudWatch Log Group for VPC Flow Logs in Secondary Region
resource "aws_cloudwatch_log_group" "secondary_flow_logs" {
  provider          = aws.us_west_1
  name              = "/aws/vpc/${local.resource_prefix}-secondary"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-flow-logs-secondary"
  })
}

# VPC Flow Logs for Secondary VPC
resource "aws_flow_log" "secondary" {
  provider             = aws.us_west_1
  iam_role_arn         = aws_iam_role.flow_logs.arn
  log_destination      = aws_cloudwatch_log_group.secondary_flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.secondary.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-flow-log-secondary"
  })
}

# ===========================
# GLOBAL RESOURCES
# ===========================

# --- S3 Bucket for RDS Backups ---

# S3 Bucket for RDS Backups (created in primary region)
resource "aws_s3_bucket" "rds_backups" {
  provider = aws.us_east_2
  bucket   = "${local.resource_prefix}-rds-backups-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-rds-backups"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "rds_backups" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.rds_backups.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "rds_backups" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.rds_backups.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "rds_backups" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.rds_backups.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- CloudTrail ---

# S3 Bucket for CloudTrail Logs
resource "aws_s3_bucket" "cloudtrail" {
  provider = aws.us_east_2
  bucket   = "${local.resource_prefix}-cloudtrail-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-cloudtrail"
  })
}

# S3 Bucket Policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.cloudtrail.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  provider                      = aws.us_east_2
  name                          = "${local.resource_prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-trail"
  })
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# --- SNS Topic for Alerts ---

# SNS Topic for Security Alerts (Primary Region)
resource "aws_sns_topic" "security_alerts_primary" {
  provider = aws.us_east_2
  name     = "${local.resource_prefix}-security-alerts-primary"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-security-alerts-primary"
  })
}

# SNS Topic for Security Alerts (Secondary Region)
resource "aws_sns_topic" "security_alerts_secondary" {
  provider = aws.us_west_1
  name     = "${local.resource_prefix}-security-alerts-secondary"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-security-alerts-secondary"
  })
}

# CloudWatch Metric Filter for Unauthorized Access (Primary)
resource "aws_cloudwatch_log_metric_filter" "unauthorized_access_primary" {
  provider       = aws.us_east_2
  name           = "${local.resource_prefix}-unauthorized-access-primary"
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"
  log_group_name = aws_cloudwatch_log_group.primary_flow_logs.name
  
  metric_transformation {
    name      = "UnauthorizedAccessAttempts"
    namespace = "VPCFlowLogs"
    value     = "1"
  }
}

# CloudWatch Alarm for Unauthorized Access (Primary)
resource "aws_cloudwatch_metric_alarm" "unauthorized_access_primary" {
  provider            = aws.us_east_2
  alarm_name          = "${local.resource_prefix}-unauthorized-access-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAccessAttempts"
  namespace           = "VPCFlowLogs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert on unauthorized access attempts"
  alarm_actions       = [aws_sns_topic.security_alerts_primary.arn]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-unauthorized-alarm-primary"
  })
}

# --- IAM Resources ---

# IAM Policy for DynamoDB Access
resource "aws_iam_policy" "dynamodb_access" {
  provider    = aws.us_east_2
  name        = "${local.resource_prefix}-dynamodb-policy"
  description = "Policy for DynamoDB access with least privilege"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListTables"
        Effect = "Allow"
        Action = [
          "dynamodb:ListTables"
        ]
        Resource = "*"
      },
      {
        Sid    = "TableOperations"
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/${local.resource_prefix}-*"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-dynamodb-policy"
  })
}

# IAM Role for Application
resource "aws_iam_role" "application" {
  provider = aws.us_east_2
  name     = "${local.resource_prefix}-application-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-application-role"
  })
}

# Attach DynamoDB Policy to Application Role
resource "aws_iam_role_policy_attachment" "application_dynamodb" {
  provider   = aws.us_east_2
  role       = aws_iam_role.application.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# Get current AWS account ID
data "aws_caller_identity" "current" {
  provider = aws.us_east_2
}

# ===========================
# Outputs
# ===========================

# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

# Subnet Outputs
output "primary_public_subnet_ids" {
  description = "IDs of public subnets in primary region"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of private subnets in primary region"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of public subnets in secondary region"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of private subnets in secondary region"
  value       = aws_subnet.secondary_private[*].id
}

# EC2 Outputs
output "primary_ec2_instance_id" {
  description = "ID of EC2 instance in primary region"
  value       = aws_instance.primary.id
}

output "primary_ec2_public_ip" {
  description = "Public IP of EC2 instance in primary region"
  value       = aws_instance.primary.public_ip
}

output "secondary_ec2_instance_id" {
  description = "ID of EC2 instance in secondary region"
  value       = aws_instance.secondary.id
}

output "secondary_ec2_public_ip" {
  description = "Public IP of EC2 instance in secondary region"
  value       = aws_instance.secondary.public_ip
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "Endpoint of RDS instance in primary region"
  value       = aws_db_instance.primary.endpoint
}

output "primary_rds_instance_id" {
  description = "ID of RDS instance in primary region"
  value       = aws_db_instance.primary.id
}

output "secondary_rds_endpoint" {
  description = "Endpoint of RDS instance in secondary region"
  value       = aws_db_instance.secondary.endpoint
}

output "secondary_rds_instance_id" {
  description = "ID of RDS instance in secondary region"
  value       = aws_db_instance.secondary.id
}

# Secrets Manager Outputs
output "primary_rds_secret_arn" {
  description = "ARN of RDS credentials secret in primary region"
  value       = aws_secretsmanager_secret.primary_rds.arn
}

output "secondary_rds_secret_arn" {
  description = "ARN of RDS credentials secret in secondary region"
  value       = aws_secretsmanager_secret.secondary_rds.arn
}

# S3 Outputs
output "rds_backup_bucket_name" {
  description = "Name of S3 bucket for RDS backups"
  value       = aws_s3_bucket.rds_backups.id
}

output "cloudtrail_bucket_name" {
  description = "Name of S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.id
}

# CloudTrail Output
output "cloudtrail_arn" {
  description = "ARN of CloudTrail"
  value       = aws_cloudtrail.main.arn
}

# SNS Outputs
output "primary_sns_topic_arn" {
  description = "ARN of SNS topic for security alerts in primary region"
  value       = aws_sns_topic.security_alerts_primary.arn
}

output "secondary_sns_topic_arn" {
  description = "ARN of SNS topic for security alerts in secondary region"
  value       = aws_sns_topic.security_alerts_secondary.arn
}

# IAM Outputs
output "application_role_arn" {
  description = "ARN of application IAM role"
  value       = aws_iam_role.application.arn
}

output "dynamodb_policy_arn" {
  description = "ARN of DynamoDB access policy"
  value       = aws_iam_policy.dynamodb_access.arn
}

output "flow_logs_role_arn" {
  description = "ARN of VPC Flow Logs IAM role"
  value       = aws_iam_role.flow_logs.arn
}

# Security Group Outputs
output "primary_ec2_security_group_id" {
  description = "ID of EC2 security group in primary region"
  value       = aws_security_group.primary_ec2.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of EC2 security group in secondary region"
  value       = aws_security_group.secondary_ec2.id
}

output "primary_rds_security_group_id" {
  description = "ID of RDS security group in primary region"
  value       = aws_security_group.primary_rds.id
}

output "secondary_rds_security_group_id" {
  description = "ID of RDS security group in secondary region"
  value       = aws_security_group.secondary_rds.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_ids" {
  description = "IDs of NAT gateways in primary region"
  value       = aws_nat_gateway.primary[*].id
}

output "secondary_nat_gateway_ids" {
  description = "IDs of NAT gateways in secondary region"
  value       = aws_nat_gateway.secondary[*].id
}

# Internet Gateway Outputs
output "primary_internet_gateway_id" {
  description = "ID of Internet Gateway in primary region"
  value       = aws_internet_gateway.primary.id
}

output "secondary_internet_gateway_id" {
  description = "ID of Internet Gateway in secondary region"
  value       = aws_internet_gateway.secondary.id
}

# AMI Outputs
output "primary_ami_id" {
  description = "ID of AMI used in primary region"
  value       = data.aws_ami.primary_amazon_linux.id
}

output "secondary_ami_id" {
  description = "ID of AMI used in secondary region"
  value       = data.aws_ami.secondary_amazon_linux.id
}
