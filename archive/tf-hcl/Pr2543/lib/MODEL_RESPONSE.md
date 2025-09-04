```hcl
# tap_stack.tf - Complete Terraform configuration for multi-region infrastructure

# ============================================================================
# VARIABLES
# ============================================================================

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

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "allowed_https_cidr" {
  description = "CIDR blocks allowed for HTTPS access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  # Common tags for all resources
  common_tags = {
    Environment    = "Production"
    ownership      = "self"
    departmental   = "businessunit"
    ManagedBy      = "Terraform"
  }

  # Naming convention
  project_name = "tap-stack"
  
  # VPC CIDR blocks
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"
  
  # Subnet CIDR blocks for primary region (us-east-2)
  primary_public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  primary_private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
  
  # Subnet CIDR blocks for secondary region (us-west-1)
  secondary_public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  secondary_private_subnet_cidrs = ["10.1.10.0/24", "10.1.20.0/24"]
}

# ============================================================================
# DATA SOURCES
# ============================================================================

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
data "aws_ami" "amazon_linux_primary" {
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
data "aws_ami" "amazon_linux_secondary" {
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

# ============================================================================
# RANDOM RESOURCES FOR RDS CREDENTIALS
# ============================================================================

# Random username for primary RDS
resource "random_string" "primary_db_username" {
  length  = 8
  special = false
  numeric = false
  upper   = false
  lower   = true
}

# Random password for primary RDS
resource "random_password" "primary_db_password" {
  length  = 16
  special = true
  # Exclude characters that AWS RDS doesn't allow
  override_special = "!#$%&*+-=?^_`|~"
}

# Random username for secondary RDS
resource "random_string" "secondary_db_username" {
  length  = 8
  special = false
  numeric = false
  upper   = false
  lower   = true
}

# Random password for secondary RDS
resource "random_password" "secondary_db_password" {
  length  = 16
  special = true
  # Exclude characters that AWS RDS doesn't allow
  override_special = "!#$%&*+-=?^_`|~"
}

# ============================================================================
# PRIMARY REGION (US-EAST-2) INFRASTRUCTURE
# ============================================================================

# VPC for primary region
resource "aws_vpc" "primary" {
  provider             = aws.us_east_2
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-vpc"
  })
}

# Internet Gateway for primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-igw"
  })
}

# Public subnets for primary region
resource "aws_subnet" "primary_public" {
  provider                = aws.us_east_2
  count                   = length(local.primary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private subnets for primary region
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_2
  count             = length(local.primary_private_subnet_cidrs)
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in primary region
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_2
  count    = length(aws_subnet.primary_public)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.primary]
}

# NAT Gateways for primary region
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_2
  count         = length(aws_subnet.primary_public)
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.primary]
}

# Route table for public subnets in primary region
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-public-rt"
  })
}

# Route tables for private subnets in primary region
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_2
  count    = length(aws_subnet.primary_private)
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-private-rt-${count.index + 1}"
  })
}

# Route table associations for public subnets in primary region
resource "aws_route_table_association" "primary_public" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Route table associations for private subnets in primary region
resource "aws_route_table_association" "primary_private" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# ============================================================================
# SECONDARY REGION (US-WEST-1) INFRASTRUCTURE
# ============================================================================

# VPC for secondary region
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_1
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-vpc"
  })
}

# Internet Gateway for secondary VPC
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-igw"
  })
}

# Public subnets for secondary region
resource "aws_subnet" "secondary_public" {
  provider                = aws.us_west_1
  count                   = length(local.secondary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private subnets for secondary region
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_1
  count             = length(local.secondary_private_subnet_cidrs)
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways in secondary region
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_1
  count    = length(aws_subnet.secondary_public)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# NAT Gateways for secondary region
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_1
  count         = length(aws_subnet.secondary_public)
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.secondary]
}

# Route table for public subnets in secondary region
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-public-rt"
  })
}

# Route tables for private subnets in secondary region
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_1
  count    = length(aws_subnet.secondary_private)
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-private-rt-${count.index + 1}"
  })
}

# Route table associations for public subnets in secondary region
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Route table associations for private subnets in secondary region
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security group for EC2 instances in primary region
resource "aws_security_group" "primary_ec2" {
  provider    = aws.us_east_2
  name        = "${local.project_name}-primary-ec2-sg"
  description = "Security group for EC2 instances in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidr
  }

  ingress {
    description = "HTTP from ALB"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.primary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-ec2-sg"
  })
}

# Security group for EC2 instances in secondary region
resource "aws_security_group" "secondary_ec2" {
  provider    = aws.us_west_1
  name        = "${local.project_name}-secondary-ec2-sg"
  description = "Security group for EC2 instances in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidr
  }

  ingress {
    description = "HTTP from ALB"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-ec2-sg"
  })
}

# Security group for ALB in primary region
resource "aws_security_group" "primary_alb" {
  provider    = aws.us_east_2
  name        = "${local.project_name}-primary-alb-sg"
  description = "Security group for ALB in primary region"
  vpc_id      = aws_vpc.primary.id

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
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-alb-sg"
  })
}

# Security group for ALB in secondary region
resource "aws_security_group" "secondary_alb" {
  provider    = aws.us_west_1
  name        = "${local.project_name}-secondary-alb-sg"
  description = "Security group for ALB in secondary region"
  vpc_id      = aws_vpc.secondary.id

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
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-alb-sg"
  })
}

# Security group for RDS in primary region
resource "aws_security_group" "primary_rds" {
  provider    = aws.us_east_2
  name        = "${local.project_name}-primary-rds-sg"
  description = "Security group for RDS in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-rds-sg"
  })
}

# Security group for RDS in secondary region
resource "aws_security_group" "secondary_rds" {
  provider    = aws.us_west_1
  name        = "${local.project_name}-secondary-rds-sg"
  description = "Security group for RDS in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-rds-sg"
  })
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${local.project_name}-ec2-role"

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
    Name = "${local.project_name}-ec2-role"
  })
}

# IAM policy for EC2 instances to access CloudWatch and Secrets Manager
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${local.project_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.primary_db_credentials.arn,
          aws_secretsmanager_secret.secondary_db_credentials.arn
        ]
      }
    ]
  })
}

# IAM instance profile for EC2 instances
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-ec2-profile"
  })
}

# ============================================================================
# SECRETS MANAGER
# ============================================================================

# Secrets Manager secret for primary RDS credentials
resource "aws_secretsmanager_secret" "primary_db_credentials" {
  provider    = aws.us_east_2
  name        = "${local.project_name}-primary-db-credentials"
  description = "RDS credentials for primary region"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-db-credentials"
  })
}

# Secrets Manager secret version for primary RDS credentials
resource "aws_secretsmanager_secret_version" "primary_db_credentials" {
  provider  = aws.us_east_2
  secret_id = aws_secretsmanager_secret.primary_db_credentials.id
  secret_string = jsonencode({
    username = random_string.primary_db_username.result
    password = random_password.primary_db_password.result
  })
}

# Secrets Manager secret for secondary RDS credentials
resource "aws_secretsmanager_secret" "secondary_db_credentials" {
  provider    = aws.us_west_1
  name        = "${local.project_name}-secondary-db-credentials"
  description = "RDS credentials for secondary region"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-db-credentials"
  })
}

# Secrets Manager secret version for secondary RDS credentials
resource "aws_secretsmanager_secret_version" "secondary_db_credentials" {
  provider  = aws.us_west_1
  secret_id = aws_secretsmanager_secret.secondary_db_credentials.id
  secret_string = jsonencode({
    username = random_string.secondary_db_username.result
    password = random_password.secondary_db_password.result
  })
}

# ============================================================================
# RDS SUBNET GROUPS
# ============================================================================

# RDS subnet group for primary region
resource "aws_db_subnet_group" "primary" {
  provider   = aws.us_east_2
  name       = "${local.project_name}-primary-db-subnet-group"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-db-subnet-group"
  })
}

# RDS subnet group for secondary region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.us_west_1
  name       = "${local.project_name}-secondary-db-subnet-group"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-db-subnet-group"
  })
}

# ============================================================================
# RDS INSTANCES
# ============================================================================

# RDS instance for primary region
resource "aws_db_instance" "primary" {
  provider               = aws.us_east_2
  identifier             = "${local.project_name}-primary-db"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  db_name                = "primarydb"
  username               = random_string.primary_db_username.result
  password               = random_password.primary_db_password.result
  parameter_group_name   = "default.mysql8.0"
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  multi_az               = true
  publicly_accessible    = false
  storage_encrypted      = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = true
  deletion_protection    = false

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-db"
  })

  depends_on = [aws_db_subnet_group.primary]
}

# RDS instance for secondary region
resource "aws_db_instance" "secondary" {
  provider               = aws.us_west_1
  identifier             = "${local.project_name}-secondary-db"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = var.db_instance_class
  db_name                = "secondarydb"
  username               = random_string.secondary_db_username.result
  password               = random_password.secondary_db_password.result
  parameter_group_name   = "default.mysql8.0"
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  vpc_security_group_ids = [aws_security_group.secondary_rds.id]
  multi_az               = true
  publicly_accessible    = false
  storage_encrypted      = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = true
  deletion_protection    = false

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-db"
  })

  depends_on = [aws_db_subnet_group.secondary]
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

# Primary S3 bucket
resource "aws_s3_bucket" "primary" {
  provider = aws.us_east_2
  bucket   = "${local.project_name}-primary-static-content-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-bucket"
  })
}

# Secondary S3 bucket for replication
resource "aws_s3_bucket" "secondary" {
  provider = aws.us_west_1
  bucket   = "${local.project_name}-secondary-static-content-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-bucket"
  })
}

# Random string for bucket suffix to ensure uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket versioning for primary bucket
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket versioning for secondary bucket
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket lifecycle configuration for primary bucket
resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary.id

  rule {
    id     = "log_archiving"
    status = "Enabled"

    filter {
      prefix = "logs/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }

  depends_on = [aws_s3_bucket_versioning.primary]
}


# S3 bucket lifecycle configuration for secondary bucket
resource "aws_s3_bucket_lifecycle_configuration" "secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary.id

  rule {
    id     = "log_archiving"
    status = "Enabled"

    filter {
      prefix = "logs/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }

  depends_on = [aws_s3_bucket_versioning.secondary]
}

# IAM role for S3 replication
resource "aws_iam_role" "s3_replication" {
  provider = aws.us_east_2
  name     = "${local.project_name}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-s3-replication-role"
  })
}

# IAM policy for S3 replication
resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.us_east_2
  name     = "${local.project_name}-s3-replication-policy"
  role     = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      }
    ]
  })
}

# S3 bucket replication configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  provider   = aws.us_east_2
  role       = aws_iam_role.s3_replication.arn
  bucket     = aws_s3_bucket.primary.id
  depends_on = [aws_s3_bucket_versioning.primary]

  rule {
    id     = "replicate_to_secondary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }
}

# ============================================================================
# LAUNCH TEMPLATES
# ============================================================================

# Launch template for primary region
resource "aws_launch_template" "primary" {
  provider      = aws.us_east_2
  name          = "${local.project_name}-primary-lt"
  description   = "Launch template for primary region instances"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.primary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region = var.primary_region
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.project_name}-primary-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-lt"
  })
}

# Launch template for secondary region
resource "aws_launch_template" "secondary" {
  provider      = aws.us_west_1
  name          = "${local.project_name}-secondary-lt"
  description   = "Launch template for secondary region instances"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region = var.secondary_region
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.project_name}-secondary-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-lt"
  })
}

# ============================================================================
# APPLICATION LOAD BALANCERS
# ============================================================================

# ALB for primary region
resource "aws_lb" "primary" {
  provider           = aws.us_east_2
  name               = "${local.project_name}-primary-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-alb"
  })
}

# ALB for secondary region
resource "aws_lb" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.project_name}-secondary-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = aws_subnet.secondary_public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-alb"
  })
}

# Target group for primary region
resource "aws_lb_target_group" "primary" {
  provider = aws.us_east_2
  name     = "${local.project_name}-primary-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-tg"
  })
}

# Target group for secondary region
resource "aws_lb_target_group" "secondary" {
  provider = aws.us_west_1
  name     = "${local.project_name}-secondary-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-tg"
  })
}

# ALB listener for primary region
resource "aws_lb_listener" "primary" {
  provider          = aws.us_east_2
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-listener"
  })
}

# ALB listener for secondary region
resource "aws_lb_listener" "secondary" {
  provider          = aws.us_west_1
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-listener"
  })
}

# ============================================================================
# AUTO SCALING GROUPS
# ============================================================================

# Auto Scaling Group for primary region
resource "aws_autoscaling_group" "primary" {
  provider            = aws.us_east_2
  name                = "${local.project_name}-primary-asg"
  vpc_zone_identifier = aws_subnet.primary_private[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.project_name}-primary-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  depends_on = [aws_lb_target_group.primary]
}

# Auto Scaling Group for secondary region
resource "aws_autoscaling_group" "secondary" {
  provider            = aws.us_west_1
  name                = "${local.project_name}-secondary-asg"
  vpc_zone_identifier = aws_subnet.secondary_private[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.project_name}-secondary-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  depends_on = [aws_lb_target_group.secondary]
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

# CloudWatch alarm for primary ASG CPU utilization
resource "aws_cloudwatch_metric_alarm" "primary_cpu_high" {
  provider            = aws.us_east_2
  alarm_name          = "${local.project_name}-primary-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization in primary region"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-cpu-high-alarm"
  })
}

# CloudWatch alarm for secondary ASG CPU utilization
resource "aws_cloudwatch_metric_alarm" "secondary_cpu_high" {
  provider            = aws.us_west_1
  alarm_name          = "${local.project_name}-secondary-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization in secondary region"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-cpu-high-alarm"
  })
}

# CloudWatch alarm for primary RDS CPU utilization
resource "aws_cloudwatch_metric_alarm" "primary_rds_cpu" {
  provider            = aws.us_east_2
  alarm_name          = "${local.project_name}-primary-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization in primary region"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-primary-rds-cpu-alarm"
  })
}

# CloudWatch alarm for secondary RDS CPU utilization
resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu" {
  provider            = aws.us_west_1
  alarm_name          = "${local.project_name}-secondary-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization in secondary region"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-secondary-rds-cpu-alarm"
  })
}

# ============================================================================
# AUTO SCALING POLICIES
# ============================================================================

# Scale up policy for primary ASG
resource "aws_autoscaling_policy" "primary_scale_up" {
  provider           = aws.us_east_2
  name               = "${local.project_name}-primary-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Scale down policy for primary ASG
resource "aws_autoscaling_policy" "primary_scale_down" {
  provider           = aws.us_east_2
  name               = "${local.project_name}-primary-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.primary.name
}

# Scale up policy for secondary ASG
resource "aws_autoscaling_policy" "secondary_scale_up" {
  provider           = aws.us_west_1
  name               = "${local.project_name}-secondary-scale-up"
  scaling_adjustment = 1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# Scale down policy for secondary ASG
resource "aws_autoscaling_policy" "secondary_scale_down" {
  provider           = aws.us_west_1
  name               = "${local.project_name}-secondary-scale-down"
  scaling_adjustment = -1
  adjustment_type    = "ChangeInCapacity"
  cooldown           = 300
  autoscaling_group_name = aws_autoscaling_group.secondary.name
}

# ============================================================================
# AWS CONFIG
# ============================================================================

# IAM role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "${local.project_name}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-config-role"
  })
}

# Attach AWS managed policy to Config role
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# S3 bucket for Config in primary region
resource "aws_s3_bucket" "config_primary" {
  provider      = aws.us_east_2
  bucket        = "${local.project_name}-config-primary-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-config-primary-bucket"
  })
}

# S3 bucket for Config in secondary region
resource "aws_s3_bucket" "config_secondary" {
  provider      = aws.us_west_1
  bucket        = "${local.project_name}-config-secondary-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-config-secondary-bucket"
  })
}

# S3 bucket policy for Config primary
resource "aws_s3_bucket_policy" "config_primary" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.config_primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_primary.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_primary.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_primary.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# S3 bucket policy for Config secondary
resource "aws_s3_bucket_policy" "config_secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.config_secondary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_secondary.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_secondary.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_secondary.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# AWS Config delivery channel for primary region
resource "aws_config_delivery_channel" "primary" {
  provider           = aws.us_east_2
  name               = "${local.project_name}-primary-config-delivery-channel"
  s3_bucket_name     = aws_s3_bucket.config_primary.bucket
  s3_key_prefix      = "config"
  snapshot_delivery_properties {
    delivery_frequency = "Daily"
  }

  depends_on = [aws_config_configuration_recorder.primary]
}

# AWS Config delivery channel for secondary region
resource "aws_config_delivery_channel" "secondary" {
  provider           = aws.us_west_1
  name               = "${local.project_name}-secondary-config-delivery-channel"
  s3_bucket_name     = aws_s3_bucket.config_secondary.bucket
  s3_key_prefix      = "config"
  snapshot_delivery_properties {
    delivery_frequency = "Daily"
  }

  depends_on = [aws_config_configuration_recorder.secondary]
}

# AWS Config configuration recorder for primary region
resource "aws_config_configuration_recorder" "primary" {
  provider = aws.us_east_2
  name     = "${local.project_name}-primary-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# AWS Config configuration recorder for secondary region
resource "aws_config_configuration_recorder" "secondary" {
  provider = aws.us_west_1
  name     = "${local.project_name}-secondary-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = false
  }
}

# AWS Config configuration recorder status for primary region
resource "aws_config_configuration_recorder_status" "primary" {
  provider   = aws.us_east_2
  name       = aws_config_configuration_recorder.primary.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.primary]
}

# AWS Config configuration recorder status for secondary region
resource "aws_config_configuration_recorder_status" "secondary" {
  provider   = aws.us_west_1
  name       = aws_config_configuration_recorder.secondary.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.secondary]
}

# ============================================================================
# OUTPUTS
# ============================================================================

# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary.cidr_block
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary.cidr_block
}

# Subnet Outputs
output "primary_public_subnet_ids" {
  description = "IDs of the primary region public subnets"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary region private subnets"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary region public subnets"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary region private subnets"
  value       = aws_subnet.secondary_private[*].id
}

# Internet Gateway Outputs
output "primary_internet_gateway_id" {
  description = "ID of the primary region internet gateway"
  value       = aws_internet_gateway.primary.id
}

output "secondary_internet_gateway_id" {
  description = "ID of the secondary region internet gateway"
  value       = aws_internet_gateway.secondary.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_ids" {
  description = "IDs of the primary region NAT gateways"
  value       = aws_nat_gateway.primary[*].id
}

output "secondary_nat_gateway_ids" {
  description = "IDs of the secondary region NAT gateways"
  value       = aws_nat_gateway.secondary[*].id
}

# Security Group Outputs
output "primary_ec2_security_group_id" {
  description = "ID of the primary region EC2 security group"
  value       = aws_security_group.primary_ec2.id
}

output "secondary_ec2_security_group_id" {
  description = "ID of the secondary region EC2 security group"
  value       = aws_security_group.secondary_ec2.id
}

output "primary_alb_security_group_id" {
  description = "ID of the primary region ALB security group"
  value       = aws_security_group.primary_alb.id
}

output "secondary_alb_security_group_id" {
  description = "ID of the secondary region ALB security group"
  value       = aws_security_group.secondary_alb.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary region RDS security group"
  value       = aws_security_group.primary_rds.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary region RDS security group"
  value       = aws_security_group.secondary_rds.id
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "RDS instance endpoint for primary region"
  value       = aws_db_instance.primary.endpoint
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint for secondary region"
  value       = aws_db_instance.secondary.endpoint
}

output "primary_rds_instance_id" {
  description = "RDS instance ID for primary region"
  value       = aws_db_instance.primary.id
}

output "secondary_rds_instance_id" {
  description = "RDS instance ID for secondary region"
  value       = aws_db_instance.secondary.id
}

output "primary_db_subnet_group_name" {
  description = "Name of the primary region DB subnet group"
  value       = aws_db_subnet_group.primary.name
}

output "secondary_db_subnet_group_name" {
  description = "Name of the secondary region DB subnet group"
  value       = aws_db_subnet_group.secondary.name
}

# S3 Bucket Outputs
output "primary_s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket
}

output "secondary_s3_bucket_name" {
  description = "Name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}

output "config_primary_s3_bucket_name" {
  description = "Name of the primary Config S3 bucket"
  value       = aws_s3_bucket.config_primary.bucket
}

output "config_secondary_s3_bucket_name" {
  description = "Name of the secondary Config S3 bucket"
  value       = aws_s3_bucket.config_secondary.bucket
}

# AMI Outputs
output "primary_ami_id" {
  description = "AMI ID used in primary region"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "secondary_ami_id" {
  description = "AMI ID used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.id
}

output "primary_ami_name" {
  description = "AMI name used in primary region"
  value       = data.aws_ami.amazon_linux_primary.name
}

output "secondary_ami_name" {
  description = "AMI name used in secondary region"
  value       = data.aws_ami.amazon_linux_secondary.name
}

# IAM Role Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_iam_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.arn
}

output "config_role_arn" {
  description = "ARN of the Config IAM role"
  value       = aws_iam_role.config_role.arn
}


# Secrets Manager Outputs (continued)
output "primary_db_secret_arn" {
  description = "ARN of the primary database credentials secret"
  value       = aws_secretsmanager_secret.primary_db_credentials.arn
}

output "secondary_db_secret_arn" {
  description = "ARN of the secondary database credentials secret"
  value       = aws_secretsmanager_secret.secondary_db_credentials.arn
}

output "primary_db_secret_name" {
  description = "Name of the primary database credentials secret"
  value       = aws_secretsmanager_secret.primary_db_credentials.name
}

output "secondary_db_secret_name" {
  description = "Name of the secondary database credentials secret"
  value       = aws_secretsmanager_secret.secondary_db_credentials.name
}

# Launch Template Outputs
output "primary_launch_template_id" {
  description = "ID of the primary region launch template"
  value       = aws_launch_template.primary.id
}

output "secondary_launch_template_id" {
  description = "ID of the secondary region launch template"
  value       = aws_launch_template.secondary.id
}

output "primary_launch_template_name" {
  description = "Name of the primary region launch template"
  value       = aws_launch_template.primary.name
}

output "secondary_launch_template_name" {
  description = "Name of the secondary region launch template"
  value       = aws_launch_template.secondary.name
}

output "primary_launch_template_latest_version" {
  description = "Latest version of the primary region launch template"
  value       = aws_launch_template.primary.latest_version
}

output "secondary_launch_template_latest_version" {
  description = "Latest version of the secondary region launch template"
  value       = aws_launch_template.secondary.latest_version
}

# Load Balancer Outputs
output "primary_alb_arn" {
  description = "ARN of the primary region Application Load Balancer"
  value       = aws_lb.primary.arn
}

output "secondary_alb_arn" {
  description = "ARN of the secondary region Application Load Balancer"
  value       = aws_lb.secondary.arn
}

output "primary_alb_dns_name" {
  description = "DNS name of the primary region Application Load Balancer"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary region Application Load Balancer"
  value       = aws_lb.secondary.dns_name
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary region Application Load Balancer"
  value       = aws_lb.primary.zone_id
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary region Application Load Balancer"
  value       = aws_lb.secondary.zone_id
}

# Target Group Outputs
output "primary_target_group_arn" {
  description = "ARN of the primary region target group"
  value       = aws_lb_target_group.primary.arn
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary region target group"
  value       = aws_lb_target_group.secondary.arn
}

output "primary_target_group_name" {
  description = "Name of the primary region target group"
  value       = aws_lb_target_group.primary.name
}

output "secondary_target_group_name" {
  description = "Name of the secondary region target group"
  value       = aws_lb_target_group.secondary.name
}

# Load Balancer Listener Outputs
output "primary_alb_listener_arn" {
  description = "ARN of the primary region ALB listener"
  value       = aws_lb_listener.primary.arn
}

output "secondary_alb_listener_arn" {
  description = "ARN of the secondary region ALB listener"
  value       = aws_lb_listener.secondary.arn
}

# Auto Scaling Group Outputs
output "primary_asg_arn" {
  description = "ARN of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.arn
}

output "secondary_asg_arn" {
  description = "ARN of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.arn
}

output "primary_asg_name" {
  description = "Name of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_name" {
  description = "Name of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

output "primary_asg_min_size" {
  description = "Minimum size of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.min_size
}

output "secondary_asg_min_size" {
  description = "Minimum size of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.min_size
}

output "primary_asg_max_size" {
  description = "Maximum size of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.max_size
}

output "secondary_asg_max_size" {
  description = "Maximum size of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.max_size
}

output "primary_asg_desired_capacity" {
  description = "Desired capacity of the primary region Auto Scaling Group"
  value       = aws_autoscaling_group.primary.desired_capacity
}

output "secondary_asg_desired_capacity" {
  description = "Desired capacity of the secondary region Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.desired_capacity
}

# Auto Scaling Policy Outputs
output "primary_scale_up_policy_arn" {
  description = "ARN of the primary region scale up policy"
  value       = aws_autoscaling_policy.primary_scale_up.arn
}

output "secondary_scale_up_policy_arn" {
  description = "ARN of the secondary region scale up policy"
  value       = aws_autoscaling_policy.secondary_scale_up.arn
}

output "primary_scale_down_policy_arn" {
  description = "ARN of the primary region scale down policy"
  value       = aws_autoscaling_policy.primary_scale_down.arn
}

output "secondary_scale_down_policy_arn" {
  description = "ARN of the secondary region scale down policy"
  value       = aws_autoscaling_policy.secondary_scale_down.arn
}

# CloudWatch Alarm Outputs
output "primary_cpu_alarm_arn" {
  description = "ARN of the primary region CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_high.arn
}

output "secondary_cpu_alarm_arn" {
  description = "ARN of the secondary region CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_high.arn
}

output "primary_rds_cpu_alarm_arn" {
  description = "ARN of the primary region RDS CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.arn
}

output "secondary_rds_cpu_alarm_arn" {
  description = "ARN of the secondary region RDS CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu.arn
}

output "primary_cpu_alarm_name" {
  description = "Name of the primary region CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.primary_cpu_high.alarm_name
}

output "secondary_cpu_alarm_name" {
  description = "Name of the secondary region CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_cpu_high.alarm_name
}

output "primary_rds_cpu_alarm_name" {
  description = "Name of the primary region RDS CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu.alarm_name
}

output "secondary_rds_cpu_alarm_name" {
  description = "Name of the secondary region RDS CPU utilization alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu.alarm_name
}

# AWS Config Outputs
output "primary_config_recorder_name" {
  description = "Name of the primary region Config recorder"
  value       = aws_config_configuration_recorder.primary.name
}

output "secondary_config_recorder_name" {
  description = "Name of the secondary region Config recorder"
  value       = aws_config_configuration_recorder.secondary.name
}

output "primary_config_delivery_channel_name" {
  description = "Name of the primary region Config delivery channel"
  value       = aws_config_delivery_channel.primary.name
}

output "secondary_config_delivery_channel_name" {
  description = "Name of the secondary region Config delivery channel"
  value       = aws_config_delivery_channel.secondary.name
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary region public route table"
  value       = aws_route_table.primary_public.id
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary region public route table"
  value       = aws_route_table.secondary_public.id
}

output "primary_private_route_table_ids" {
  description = "IDs of the primary region private route tables"
  value       = aws_route_table.primary_private[*].id
}

output "secondary_private_route_table_ids" {
  description = "IDs of the secondary region private route tables"
  value       = aws_route_table.secondary_private[*].id
}

# Elastic IP Outputs
output "primary_nat_eip_ids" {
  description = "IDs of the primary region NAT gateway Elastic IPs"
  value       = aws_eip.primary_nat[*].id
}

output "secondary_nat_eip_ids" {
  description = "IDs of the secondary region NAT gateway Elastic IPs"
  value       = aws_eip.secondary_nat[*].id
}

output "primary_nat_eip_public_ips" {
  description = "Public IPs of the primary region NAT gateway Elastic IPs"
  value       = aws_eip.primary_nat[*].public_ip
}

output "secondary_nat_eip_public_ips" {
  description = "Public IPs of the secondary region NAT gateway Elastic IPs"
  value       = aws_eip.secondary_nat[*].public_ip
}

# Availability Zone Outputs
output "primary_availability_zones" {
  description = "Availability zones used in primary region"
  value       = data.aws_availability_zones.primary.names
}

output "secondary_availability_zones" {
  description = "Availability zones used in secondary region"
  value       = data.aws_availability_zones.secondary.names
}

# Random Resource Outputs (non-sensitive)
output "bucket_suffix" {
  description = "Random suffix used for S3 bucket names"
  value       = random_string.bucket_suffix.result
}

# Region Outputs
output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

# Project Information Outputs
output "project_name" {
  description = "Project name used for resource naming"
  value       = local.project_name
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Network CIDR Outputs
output "primary_public_subnet_cidrs" {
  description = "CIDR blocks of primary region public subnets"
  value       = local.primary_public_subnet_cidrs
}

output "primary_private_subnet_cidrs" {
  description = "CIDR blocks of primary region private subnets"
  value       = local.primary_private_subnet_cidrs
}

output "secondary_public_subnet_cidrs" {
  description = "CIDR blocks of secondary region public subnets"
  value       = local.secondary_public_subnet_cidrs
}

output "secondary_private_subnet_cidrs" {
  description = "CIDR blocks of secondary region private subnets"
  value       = local.secondary_private_subnet_cidrs
}

# S3 Replication Configuration Outputs
output "s3_replication_configuration_id" {
  description = "ID of the S3 replication configuration"
  value       = aws_s3_bucket_replication_configuration.primary_to_secondary.id
}

output "s3_replication_role_name" {
  description = "Name of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.name
}

# Database Information Outputs (non-sensitive)
output "primary_db_name" {
  description = "Name of the primary database"
  value       = aws_db_instance.primary.db_name
}

output "secondary_db_name" {
  description = "Name of the secondary database"
  value       = aws_db_instance.secondary.db_name
}

output "primary_db_port" {
  description = "Port of the primary database"
  value       = aws_db_instance.primary.port
}

output "secondary_db_port" {
  description = "Port of the secondary database"
  value       = aws_db_instance.secondary.port
}

output "primary_db_engine" {
  description = "Engine of the primary database"
  value       = aws_db_instance.primary.engine
}

output "secondary_db_engine" {
  description = "Engine of the secondary database"
  value       = aws_db_instance.secondary.engine
}

output "primary_db_engine_version" {
  description = "Engine version of the primary database"
  value       = aws_db_instance.primary.engine_version
}

output "secondary_db_engine_version" {
  description = "Engine version of the secondary database"
  value       = aws_db_instance.secondary.engine_version
}

# Instance Configuration Outputs
output "instance_type" {
  description = "EC2 instance type used"
  value       = var.instance_type
}

output "db_instance_class" {
  description = "RDS instance class used"
  value       = var.db_instance_class
}

# Security Configuration Outputs
output "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  value       = var.allowed_ssh_cidr
}

output "allowed_https_cidrs" {
  description = "CIDR blocks allowed for HTTPS access"
  value       = var.allowed_https_cidr
}

# ============================================================================
# USER DATA SCRIPT (Create this as a separate file: user_data.sh)
# ============================================================================

# Note: Create a separate file named 'user_data.sh' in the same directory with the following content:
/*
#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create a simple web page
echo "<h1>Hello from ${region}</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
*/

# ============================================================================
# SUMMARY COMMENTS
# ============================================================================

/*
This Terraform configuration creates a comprehensive multi-region infrastructure with the following components:

PRIMARY REGION (us-east-2):
- VPC with CIDR 10.0.0.0/16
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24)
- 2 private subnets (10.0.10.0/24, 10.0.20.0/24)
- Internet Gateway, 2 NAT Gateways with Elastic IPs
- Route tables and associations
- Security groups for EC2, ALB, and RDS
- RDS MySQL instance with Multi-AZ
- Application Load Balancer
- Auto Scaling Group (min: 2, max: 4)
- Launch Template with Amazon Linux 2
- S3 bucket with versioning and lifecycle policies
- Secrets Manager for RDS credentials
- CloudWatch alarms and Auto Scaling policies
- AWS Config for compliance tracking

SECONDARY REGION (us-west-1):
- VPC with CIDR 10.1.0.0/16
- 2 public subnets (10.1.1.0/24, 10.1.2.0/24)
- 2 private subnets (10.1.10.0/24, 10.1.20.0/24)
- Internet Gateway, 2 NAT Gateways with Elastic IPs
- Route tables and associations
- Security groups for EC2, ALB, and RDS
- RDS MySQL instance with Multi-AZ
- Application Load Balancer
- Auto Scaling Group (min: 2, max: 4)
- Launch Template with Amazon Linux 2
- S3 bucket for cross-region replication
- Secrets Manager for RDS credentials
- CloudWatch alarms and Auto Scaling policies
- AWS Config for compliance tracking

GLOBAL RESOURCES:
- IAM roles and policies following least privilege principle
- S3 cross-region replication from primary to secondary
- Random credentials for RDS instances
- Comprehensive tagging strategy
- CloudWatch monitoring and alerting

SECURITY FEATURES:
- Security groups with restrictive rules
- RDS instances in private subnets only
- Encrypted RDS storage
- Secrets Manager for credential management
- IAM roles with minimal required permissions
- VPC isolation between regions

MONITORING & COMPLIANCE:
- CloudWatch alarms for CPU utilization
- Auto Scaling policies for high availability
- AWS Config for infrastructure change tracking
- S3 lifecycle policies for cost optimization
- Cross-region replication for disaster recovery

All resources are tagged with Environment:Production, ownership:self, and departmental:businessunit for proper resource management and cost allocation.
*/
```

This completes the comprehensive Terraform configuration file with all the required infrastructure components across two regions. The configuration includes:

## Key Features:
1. **Multi-region setup** with proper VPC configuration in us-east-2 and us-west-1
2. **High availability** with Auto Scaling Groups and Multi-AZ RDS
3. **Security best practices** with restrictive security groups and IAM roles
4. **Monitoring** with CloudWatch alarms and Auto Scaling policies
5. **Compliance** with AWS Config for change tracking
6. **Data resilience** with S3 cross-region replication
7. **Credential management** with AWS Secrets Manager
8. **Cost optimization** with S3 lifecycle policies

## Complete Outputs:
The configuration provides comprehensive outputs for all created resources including VPCs, subnets, security groups, RDS instances, S3 buckets, IAM roles, Auto Scaling Groups, Load Balancers, and monitoring components.

## Additional Requirements:
- Create a `user_data.sh` file in the same directory for EC2 instance initialization
- Ensure your `provider.tf` file is configured as mentioned in your requirements
- All resources follow the naming convention and tagging strategy defined in the locals

The configuration is production-ready and follows AWS best practices for security, monitoring, and high availability.
