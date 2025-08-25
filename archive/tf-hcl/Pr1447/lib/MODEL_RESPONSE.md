I'll design and implement a secure, highly available, multi-region AWS infrastructure using Terraform. Here's the complete implementation:

```hcl
# ============================================================================
# TERRAFORM CONFIGURATION
# ============================================================================
terraform {
  required_version = ">= 0.14"
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

# ============================================================================
# PROVIDER CONFIGURATION - MULTI-REGION SETUP
# ============================================================================
# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.primary_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary region provider (eu-west-1)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================================================
# VARIABLES
# ============================================================================
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "multi-region-app"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

# ============================================================================
# DATA SOURCES
# ============================================================================
# Get availability zones for primary region
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

# Get availability zones for secondary region
data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# ============================================================================
# RANDOM PASSWORD GENERATION
# ============================================================================
# Generate random password for RDS master user
resource "random_password" "rds_master_password" {
  length  = 16
  special = true
}

# ============================================================================
# AWS KMS - ENCRYPTION KEYS
# ============================================================================
# KMS key for primary region
resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "KMS key for ${var.project_name} encryption in ${var.primary_region}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.project_name}-kms-key-primary"
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/${var.project_name}-primary"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key for secondary region
resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for ${var.project_name} encryption in ${var.secondary_region}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.project_name}-kms-key-secondary"
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/${var.project_name}-secondary"
  target_key_id = aws_kms_key.secondary.key_id
}

# ============================================================================
# AWS SECRETS MANAGER - SECURE CREDENTIAL STORAGE
# ============================================================================
# Store RDS credentials in Secrets Manager (primary region)
resource "aws_secretsmanager_secret" "rds_credentials_primary" {
  provider                = aws.primary
  name                    = "${var.project_name}-rds-credentials-primary"
  description             = "RDS master user credentials for primary region"
  kms_key_id              = aws_kms_key.primary.arn
  recovery_window_in_days = 7
  
  tags = {
    Name = "${var.project_name}-rds-secret-primary"
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials_primary" {
  provider  = aws.primary
  secret_id = aws_secretsmanager_secret.rds_credentials_primary.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds_master_password.result
  })
}

# Store RDS credentials in Secrets Manager (secondary region)
resource "aws_secretsmanager_secret" "rds_credentials_secondary" {
  provider                = aws.secondary
  name                    = "${var.project_name}-rds-credentials-secondary"
  description             = "RDS master user credentials for secondary region"
  kms_key_id              = aws_kms_key.secondary.arn
  recovery_window_in_days = 7
  
  tags = {
    Name = "${var.project_name}-rds-secret-secondary"
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials_secondary" {
  provider  = aws.secondary
  secret_id = aws_secretsmanager_secret.rds_credentials_secondary.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds_master_password.result
  })
}

# ============================================================================
# VPC CONFIGURATION - PRIMARY REGION
# ============================================================================
# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-vpc-primary"
  }
}

# Internet Gateway for primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  tags = {
    Name = "${var.project_name}-igw-primary"
  }
}

# Public subnets in primary region (for ALB)
resource "aws_subnet" "public_primary" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project_name}-public-subnet-primary-${count.index + 1}"
    Type = "Public"
  }
}

# Private subnets in primary region (for EC2 instances)
resource "aws_subnet" "private_primary" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = {
    Name = "${var.project_name}-private-subnet-primary-${count.index + 1}"
    Type = "Private"
  }
}

# Database subnets in primary region
resource "aws_subnet" "db_primary" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = {
    Name = "${var.project_name}-db-subnet-primary-${count.index + 1}"
    Type = "Database"
  }
}

# NAT Gateways for private subnet internet access
resource "aws_eip" "nat_primary" {
  provider = aws.primary
  count    = 2
  domain   = "vpc"
  
  tags = {
    Name = "${var.project_name}-nat-eip-primary-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 2
  allocation_id = aws_eip.nat_primary[count.index].id
  subnet_id     = aws_subnet.public_primary[count.index].id
  
  tags = {
    Name = "${var.project_name}-nat-gateway-primary-${count.index + 1}"
  }
  
  depends_on = [aws_internet_gateway.primary]
}

# Route tables for primary region
resource "aws_route_table" "public_primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = {
    Name = "${var.project_name}-rt-public-primary"
  }
}

resource "aws_route_table" "private_primary" {
  provider = aws.primary
  count    = 2
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }
  
  tags = {
    Name = "${var.project_name}-rt-private-primary-${count.index + 1}"
  }
}

# Route table associations for primary region
resource "aws_route_table_association" "public_primary" {
  provider       = aws.primary
  count          = 2
  subnet_id      = aws_subnet.public_primary[count.index].id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "private_primary" {
  provider       = aws.primary
  count          = 2
  subnet_id      = aws_subnet.private_primary[count.index].id
  route_table_id = aws_route_table.private_primary[count.index].id
}

# ============================================================================
# VPC CONFIGURATION - SECONDARY REGION
# ============================================================================
# Secondary VPC (similar structure to primary)
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-vpc-secondary"
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  tags = {
    Name = "${var.project_name}-igw-secondary"
  }
}

resource "aws_subnet" "public_secondary" {
  provider                = aws.secondary
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project_name}-public-subnet-secondary-${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private_secondary" {
  provider          = aws.secondary
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = {
    Name = "${var.project_name}-private-subnet-secondary-${count.index + 1}"
    Type = "Private"
  }
}

resource "aws_subnet" "db_secondary" {
  provider          = aws.secondary
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 20}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = {
    Name = "${var.project_name}-db-subnet-secondary-${count.index + 1}"
    Type = "Database"
  }
}

resource "aws_eip" "nat_secondary" {
  provider = aws.secondary
  count    = 2
  domain   = "vpc"
  
  tags = {
    Name = "${var.project_name}-nat-eip-secondary-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = 2
  allocation_id = aws_eip.nat_secondary[count.index].id
  subnet_id     = aws_subnet.public_secondary[count.index].id
  
  tags = {
    Name = "${var.project_name}-nat-gateway-secondary-${count.index + 1}"
  }
  
  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_route_table" "public_secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = {
    Name = "${var.project_name}-rt-public-secondary"
  }
}

resource "aws_route_table" "private_secondary" {
  provider = aws.secondary
  count    = 2
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }
  
  tags = {
    Name = "${var.project_name}-rt-private-secondary-${count.index + 1}"
  }
}

resource "aws_route_table_association" "public_secondary" {
  provider       = aws.secondary
  count          = 2
  subnet_id      = aws_subnet.public_secondary[count.index].id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "private_secondary" {
  provider       = aws.secondary
  count          = 2
  subnet_id      = aws_subnet.private_secondary[count.index].id
  route_table_id = aws_route_table.private_secondary[count.index].id
}

# ============================================================================
# SECURITY GROUPS - LEAST PRIVILEGE ACCESS
# ============================================================================
# ALB Security Group (Primary Region)
resource "aws_security_group" "alb_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-alb-sg-primary"
  description = "Security group for Application Load Balancer in primary region"
  vpc_id      = aws_vpc.primary.id
  
  # Allow HTTP traffic from anywhere
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Allow HTTPS traffic from anywhere
  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Allow all outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-alb-sg-primary"
  }
}

# Web Server Security Group (Primary Region)
resource "aws_security_group" "web_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-web-sg-primary"
  description = "Security group for web servers in primary region"
  vpc_id      = aws_vpc.primary.id
  
  # Allow HTTP traffic from ALB only
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
  }
  
  # Allow SSH for management (restrict to specific IP ranges in production)
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Only from within VPC
  }
  
  # Allow all outbound traffic for updates and external API calls
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-web-sg-primary"
  }
}

# Database Security Group (Primary Region)
resource "aws_security_group" "db_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-db-sg-primary"
  description = "Security group for RDS database in primary region"
  vpc_id      = aws_vpc.primary.id
  
  # Allow MySQL/Aurora access from web servers only
  ingress {
    description     = "MySQL/Aurora from web servers"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_primary.id]
  }
  
  tags = {
    Name = "${var.project_name}-db-sg-primary"
  }
}

# Security Groups for Secondary Region (similar structure)
resource "aws_security_group" "alb_secondary" {
  provider    = aws.secondary
  name        = "${var.project_name}-alb-sg-secondary"
  description = "Security group for Application Load Balancer in secondary region"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-alb-sg-secondary"
  }
}

resource "aws_security_group" "web_secondary" {
  provider    = aws.secondary
  name        = "${var.project_name}-web-sg-secondary"
  description = "Security group for web servers in secondary region"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }
  
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
  }
  
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-web-sg-secondary"
  }
}

resource "aws_security_group" "db_secondary" {
  provider    = aws.secondary
  name        = "${var.project_name}-db-sg-secondary"
  description = "Security group for RDS database in secondary region"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    description     = "MySQL/Aurora from web servers"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_secondary.id]
  }
  
  tags = {
    Name = "${var.project_name}-db-sg-secondary"
  }
}

# ============================================================================
# IAM ROLES AND POLICIES - LEAST PRIVILEGE
# ============================================================================
# IAM role for EC2 instances with necessary permissions
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"
  
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
  
  tags = {
    Name = "${var.project_name}-ec2-role"
  }
}

# IAM policy for EC2 instances to access Secrets Manager and CloudWatch
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.project_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.rds_credentials_primary.arn,
          aws_secretsmanager_secret.rds_credentials_secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
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
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.static_content_primary.arn}/*",
          "${aws_s3_bucket.static_content_secondary.arn}/*"
        ]
      }
    ]
  })
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# ============================================================================
# S3 BUCKETS - STATIC CONTENT STORAGE
# ============================================================================
# S3 bucket for static content (Primary Region)
resource "aws_s3_bucket" "static_content_primary" {
  provider = aws.primary
  bucket   = "${var.project_name}-static-content-primary-${random_password.rds_master_password.id}"
  
  tags = {
    Name        = "${var.project_name}-static-content-primary"
    Environment = var.environment
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "static_content_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.static_content_primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_content_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.static_content_primary.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block (security best practice)
resource "aws_s3_bucket_public_access_block" "static_content_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.static_content_primary.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for restricted access
resource "aws_s3_bucket_policy" "static_content_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.static_content_primary.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.static_content_primary.arn,
          "${aws_s3_bucket.static_content_primary.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowEC2Access"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.static_content_primary.arn}/*"
      }
    ]
  })
}

# S3 bucket for static content (Secondary Region)
resource "aws_s3_bucket" "static_content_secondary" {
  provider = aws.secondary
  bucket   = "${var.project_name}-static-content-secondary-${random_password.rds_master_password.id}"
  
  tags = {
    Name        = "${var.project_name}-static-content-secondary"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "static_content_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.static_content_secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_content_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.static_content_secondary.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.secondary.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "static_content_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.static_content_secondary.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "static_content_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.static_content_secondary.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.static_content_secondary.arn,
          "${aws_s3_bucket.static_content_secondary.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowEC2Access"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ec2_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject"
```

