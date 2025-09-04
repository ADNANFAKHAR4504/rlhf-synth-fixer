# Infrastructure as Code Solution

## Terraform Configuration Files


### provider.tf

```hcl
# provider.tf

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

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
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
```


### tap_stack.tf

```hcl

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
  default     = "eu-west-2"
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
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 1
}

# ============================================================================
# DATA SOURCES
# ============================================================================
# Get current AWS account ID
data "aws_caller_identity" "current" {}

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
    values = ["al2023-ami-*-x86_64"]
  }
}

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# ============================================================================
# RANDOM GENERATORS
# ============================================================================
# Generate random suffix for resource naming
resource "random_id" "suffix" {
  byte_length = 2
  # This creates a 3-character alphanumeric suffix
}

# Generate random password for RDS master user
resource "random_password" "rds_master_password" {
  length  = 16
  special = true
  # Exclude characters that RDS doesn't allow: /, @, ", and space
  override_special = "!#$%&*()-_=+[]{}<>:?"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.primary_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${var.project_name}/web-primary-${random_id.suffix.hex}"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-kms-key-primary-${random_id.suffix.hex}"
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/${var.project_name}-primary-${random_id.suffix.hex}"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key for secondary region
resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for ${var.project_name} encryption in ${var.secondary_region}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.secondary_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${var.project_name}/web-secondary-${random_id.suffix.hex}"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-kms-key-secondary-${random_id.suffix.hex}"
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/${var.project_name}-secondary-${random_id.suffix.hex}"
  target_key_id = aws_kms_key.secondary.key_id
}

# ============================================================================
# AWS SECRETS MANAGER - SECURE CREDENTIAL STORAGE
# ============================================================================
# Store RDS credentials in Secrets Manager (primary region)
resource "aws_secretsmanager_secret" "rds_credentials_primary" {
  provider                       = aws.primary
  name                           = "${var.project_name}-rds-credentials-primary-${random_id.suffix.hex}"
  description                    = "RDS master user credentials for primary region"
  kms_key_id                     = aws_kms_key.primary.arn
  recovery_window_in_days        = 0
  force_overwrite_replica_secret = true

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
  provider                       = aws.secondary
  name                           = "${var.project_name}-rds-credentials-secondary-${random_id.suffix.hex}"
  description                    = "RDS master user credentials for secondary region"
  kms_key_id                     = aws_kms_key.secondary.arn
  recovery_window_in_days        = 0
  force_overwrite_replica_secret = true

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
  name = "${var.project_name}-ec2-role-${random_id.suffix.hex}"

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
  name = "${var.project_name}-ec2-policy-${random_id.suffix.hex}"
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
  name = "${var.project_name}-ec2-profile-${random_id.suffix.hex}"
  role = aws_iam_role.ec2_role.name
}

# ============================================================================
# S3 BUCKETS - STATIC CONTENT STORAGE
# ============================================================================
# S3 bucket for static content (Primary Region)
resource "aws_s3_bucket" "static_content_primary" {
  provider = aws.primary
  bucket   = "${var.project_name}-static-content-primary-${random_id.suffix.hex}"

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
  bucket   = "${var.project_name}-static-content-secondary-${random_id.suffix.hex}"

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
        ]
        Resource = "${aws_s3_bucket.static_content_secondary.arn}/*"
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH LOG GROUPS - CENTRALIZED LOGGING
# ============================================================================
# CloudWatch Log Group for web servers (Primary Region)
resource "aws_cloudwatch_log_group" "web_logs_primary" {
  provider          = aws.primary
  name              = "/aws/ec2/${var.project_name}/web-primary-${random_id.suffix.hex}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.primary.arn

  tags = {
    Name = "${var.project_name}-web-logs-primary"
  }
}

# CloudWatch Log Group for web servers (Secondary Region)
resource "aws_cloudwatch_log_group" "web_logs_secondary" {
  provider          = aws.secondary
  name              = "/aws/ec2/${var.project_name}/web-secondary-${random_id.suffix.hex}"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.secondary.arn

  tags = {
    Name = "${var.project_name}-web-logs-secondary"
  }
}

# ============================================================================
# RDS DATABASE - MULTI-AZ DEPLOYMENT
# ============================================================================
# DB Subnet Group for primary region
resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "${var.project_name}-db-subnet-group-primary-${random_id.suffix.hex}"
  subnet_ids = aws_subnet.db_primary[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group-primary"
  }
}

# DB Subnet Group for secondary region
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${var.project_name}-db-subnet-group-secondary-${random_id.suffix.hex}"
  subnet_ids = aws_subnet.db_secondary[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group-secondary"
  }
}

# RDS Instance in primary region (Multi-AZ enabled)
resource "aws_db_instance" "primary" {
  provider                = aws.primary
  identifier              = "${var.project_name}-db-primary-${random_id.suffix.hex}"
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp2"
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.primary.arn
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  db_name                 = "webapp"
  username                = "admin"
  password                = random_password.rds_master_password.result
  vpc_security_group_ids  = [aws_security_group.db_primary.id]
  db_subnet_group_name    = aws_db_subnet_group.primary.name
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  multi_az                = true
  publicly_accessible     = false
  skip_final_snapshot     = true
  deletion_protection     = false

  # Enable enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance Insights not supported on db.t3.micro
  # performance_insights_enabled    = true
  # performance_insights_kms_key_id = aws_kms_key.primary.arn

  tags = {
    Name = "${var.project_name}-db-primary"
  }
}

# RDS Instance in secondary region (Read Replica)
resource "aws_db_instance" "secondary" {
  provider               = aws.secondary
  identifier             = "${var.project_name}-db-secondary-${random_id.suffix.hex}"
  replicate_source_db    = aws_db_instance.primary.arn
  instance_class         = "db.t3.micro"
  vpc_security_group_ids = [aws_security_group.db_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false

  # Cross-region read replica encryption (required when source is encrypted)
  storage_encrypted = true
  kms_key_id        = aws_kms_key.secondary.arn

  # Enable enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "${var.project_name}-db-secondary"
  }
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-rds-monitoring-role-${random_id.suffix.hex}"

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

  tags = {
    Name = "${var.project_name}-rds-monitoring-role"
  }
}

# Attach AWS managed policy for RDS enhanced monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ============================================================================
# LAUNCH TEMPLATES - EC2 CONFIGURATION
# ============================================================================
# Launch template for primary region
resource "aws_launch_template" "web_primary" {
  provider      = aws.primary
  name          = "${var.project_name}-web-template-primary-${random_id.suffix.hex}"
  description   = "Launch template for web servers in primary region"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web_primary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  # Enable detailed monitoring
  monitoring {
    enabled = true
  }

  # User data script to configure web server
  user_data = base64encode(<<-EOF
#!/bin/bash
# Ultra-simple user data script with extensive debugging
exec > /var/log/user-data.log 2>&1
set -x  # Enable debug mode

echo "=== User data script started at $(date) ==="
echo "Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo 'unknown')"
echo "Instance Type: $(curl -s http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null || echo 'unknown')"

# Check internet connectivity
echo "=== Testing internet connectivity ==="
ping -c 3 8.8.8.8 || echo "No internet connectivity"
nslookup amazon.com || echo "DNS resolution failed"

# Detect package manager and install Apache with retries
echo "=== Detecting package manager ==="
if command -v dnf &> /dev/null; then
    PKG_MGR="dnf"
    echo "Using dnf (Amazon Linux 2023+)"
elif command -v yum &> /dev/null; then
    PKG_MGR="yum"
    echo "Using yum (Amazon Linux 2)"
else
    echo "ERROR: No supported package manager found"
    exit 1
fi

echo "=== Installing Apache ==="
for i in {1..3}; do
    echo "Attempt $i to install httpd using $PKG_MGR"
    if $PKG_MGR install -y httpd; then
        echo "Apache installed successfully"
        break
    else
        echo "Apache installation failed, attempt $i"
        sleep 10
    fi
done

# Start Apache
echo "=== Starting Apache ==="
systemctl enable httpd
systemctl start httpd
systemctl status httpd

# Create health endpoints immediately with debugging
echo "=== Creating health endpoints ==="
mkdir -p /var/www/html
echo "OK" > /var/www/html/health.html
echo "OK" > /var/www/html/health
echo "Instance ready at $(date)" > /var/www/html/index.html

# Set permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html

# Verify files exist
echo "=== Verifying files ==="
ls -la /var/www/html/
cat /var/www/html/health.html

# Test local connectivity
echo "=== Testing local Apache ==="
sleep 5
curl -v http://localhost/health.html || echo "Local health check failed"
curl -v http://localhost/ || echo "Local index check failed"

# Check if Apache is listening
echo "=== Checking Apache ports ==="
netstat -tulpn | grep :80 || echo "Apache not listening on port 80"

echo "=== User data script completed at $(date) ==="
EOF
  )

  # EBS block device configuration
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.primary.arn
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-web-instance-primary"
    }
  }

  tags = {
    Name = "${var.project_name}-web-template-primary"
  }
}

# Launch template for secondary region
resource "aws_launch_template" "web_secondary" {
  provider      = aws.secondary
  name          = "${var.project_name}-web-template-secondary-${random_id.suffix.hex}"
  description   = "Launch template for web servers in secondary region"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web_secondary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(<<-EOF
#!/bin/bash
# Ultra-simple user data script with extensive debugging
exec > /var/log/user-data.log 2>&1
set -x  # Enable debug mode

echo "=== User data script started at $(date) ==="
echo "Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo 'unknown')"
echo "Instance Type: $(curl -s http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null || echo 'unknown')"

# Check internet connectivity
echo "=== Testing internet connectivity ==="
ping -c 3 8.8.8.8 || echo "No internet connectivity"
nslookup amazon.com || echo "DNS resolution failed"

# Detect package manager and install Apache with retries
echo "=== Detecting package manager ==="
if command -v dnf &> /dev/null; then
    PKG_MGR="dnf"
    echo "Using dnf (Amazon Linux 2023+)"
elif command -v yum &> /dev/null; then
    PKG_MGR="yum"
    echo "Using yum (Amazon Linux 2)"
else
    echo "ERROR: No supported package manager found"
    exit 1
fi

echo "=== Installing Apache ==="
for i in {1..3}; do
    echo "Attempt $i to install httpd using $PKG_MGR"
    if $PKG_MGR install -y httpd; then
        echo "Apache installed successfully"
        break
    else
        echo "Apache installation failed, attempt $i"
        sleep 10
    fi
done

# Start Apache
echo "=== Starting Apache ==="
systemctl enable httpd
systemctl start httpd
systemctl status httpd

# Create health endpoints immediately with debugging
echo "=== Creating health endpoints ==="
mkdir -p /var/www/html
echo "OK" > /var/www/html/health.html
echo "OK" > /var/www/html/health
echo "Instance ready at $(date)" > /var/www/html/index.html

# Set permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html

# Verify files exist
echo "=== Verifying files ==="
ls -la /var/www/html/
cat /var/www/html/health.html

# Test local connectivity
echo "=== Testing local Apache ==="
sleep 5
curl -v http://localhost/health.html || echo "Local health check failed"
curl -v http://localhost/ || echo "Local index check failed"

# Check if Apache is listening
echo "=== Checking Apache ports ==="
netstat -tulpn | grep :80 || echo "Apache not listening on port 80"

echo "=== User data script completed at $(date) ==="
EOF
  )

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.secondary.arn
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-web-instance-secondary"
    }
  }

  tags = {
    Name = "${var.project_name}-web-template-secondary"
  }
}

# ============================================================================
# APPLICATION LOAD BALANCERS - GLOBAL TRAFFIC DISTRIBUTION
# ============================================================================
# Application Load Balancer for primary region
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "mrapp-alb-pri-${random_id.suffix.hex}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets            = aws_subnet.public_primary[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}-alb-primary"
  }
}

# Application Load Balancer for secondary region
resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "mrapp-alb-sec-${random_id.suffix.hex}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets            = aws_subnet.public_secondary[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}-alb-secondary"
  }
}

# Target Group for primary region
resource "aws_lb_target_group" "web_primary" {
  provider = aws.primary
  name     = "mrapp-web-pri-${random_id.suffix.hex}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 10
    matcher             = "200"
    path                = "/health.html"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 10
  }

  tags = {
    Name = "${var.project_name}-web-tg-primary"
  }
}

# Target Group for secondary region
resource "aws_lb_target_group" "web_secondary" {
  provider = aws.secondary
  name     = "mrapp-web-sec-${random_id.suffix.hex}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 10
    matcher             = "200"
    path                = "/health.html"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 10
  }

  tags = {
    Name = "${var.project_name}-web-tg-secondary"
  }
}

# ALB Listener for primary region
resource "aws_lb_listener" "web_primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_primary.arn
  }

  tags = {
    Name = "${var.project_name}-listener-primary"
  }
}

# ALB Listener for secondary region
resource "aws_lb_listener" "web_secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_secondary.arn
  }

  tags = {
    Name = "${var.project_name}-listener-secondary"
  }
}

# ============================================================================
# AUTO SCALING GROUPS - ELASTIC WEB TIER
# ============================================================================
# Auto Scaling Group for primary region
resource "aws_autoscaling_group" "web_primary" {
  provider                  = aws.primary
  name                      = "${var.project_name}-asg-primary-${random_id.suffix.hex}"
  vpc_zone_identifier       = aws_subnet.private_primary[*].id
  target_group_arns         = [aws_lb_target_group.web_primary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 900

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  # Temporary: Don't wait for capacity during deployment to enable debugging
  wait_for_capacity_timeout = "0"

  launch_template {
    id      = aws_launch_template.web_primary.id
    version = "$Latest"
  }

  # Instance refresh configuration for rolling updates
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-primary"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Auto Scaling Group for secondary region
resource "aws_autoscaling_group" "web_secondary" {
  provider                  = aws.secondary
  name                      = "${var.project_name}-asg-secondary-${random_id.suffix.hex}"
  vpc_zone_identifier       = aws_subnet.private_secondary[*].id
  target_group_arns         = [aws_lb_target_group.web_secondary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 900

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  # Temporary: Don't wait for capacity during deployment to enable debugging
  wait_for_capacity_timeout = "0"

  launch_template {
    id      = aws_launch_template.web_secondary.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-secondary"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# ============================================================================
# AUTO SCALING POLICIES - DYNAMIC SCALING
# ============================================================================
# Scale up policy for primary region
resource "aws_autoscaling_policy" "scale_up_primary" {
  provider               = aws.primary
  name                   = "${var.project_name}-scale-up-primary-${random_id.suffix.hex}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web_primary.name
}

# Scale down policy for primary region
resource "aws_autoscaling_policy" "scale_down_primary" {
  provider               = aws.primary
  name                   = "${var.project_name}-scale-down-primary-${random_id.suffix.hex}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web_primary.name
}

# CloudWatch alarms for primary region
resource "aws_cloudwatch_metric_alarm" "cpu_high_primary" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-cpu-high-primary-${random_id.suffix.hex}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up_primary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web_primary.name
  }

  tags = {
    Name = "${var.project_name}-cpu-high-primary"
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low_primary" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-cpu-low-primary-${random_id.suffix.hex}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "25"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down_primary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web_primary.name
  }

  tags = {
    Name = "${var.project_name}-cpu-low-primary"
  }
}

# Scale up policy for secondary region
resource "aws_autoscaling_policy" "scale_up_secondary" {
  provider               = aws.secondary
  name                   = "${var.project_name}-scale-up-secondary-${random_id.suffix.hex}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web_secondary.name
}

# Scale down policy for secondary region
resource "aws_autoscaling_policy" "scale_down_secondary" {
  provider               = aws.secondary
  name                   = "${var.project_name}-scale-down-secondary-${random_id.suffix.hex}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web_secondary.name
}

# CloudWatch alarms for secondary region
resource "aws_cloudwatch_metric_alarm" "cpu_high_secondary" {
  provider            = aws.secondary
  alarm_name          = "${var.project_name}-cpu-high-secondary-${random_id.suffix.hex}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up_secondary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web_secondary.name
  }

  tags = {
    Name = "${var.project_name}-cpu-high-secondary"
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low_secondary" {
  provider            = aws.secondary
  alarm_name          = "${var.project_name}-cpu-low-secondary-${random_id.suffix.hex}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "25"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down_secondary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web_secondary.name
  }

  tags = {
    Name = "${var.project_name}-cpu-low-secondary"
  }
}

# ============================================================================
# OUTPUTS - USEFUL INFORMATION
# ============================================================================
output "primary_alb_dns" {
  description = "DNS name of the primary region ALB"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of the secondary region ALB"
  value       = aws_lb.secondary.dns_name
}

output "primary_rds_endpoint" {
  description = "RDS instance endpoint in primary region"
  value       = aws_db_instance.primary.endpoint
  sensitive   = true
}

output "secondary_rds_endpoint" {
  description = "RDS read replica endpoint in secondary region"
  value       = aws_db_instance.secondary.endpoint
  sensitive   = true
}

output "s3_bucket_primary" {
  description = "S3 bucket name for primary region"
  value       = aws_s3_bucket.static_content_primary.bucket
}

output "s3_bucket_secondary" {
  description = "S3 bucket name for secondary region"
  value       = aws_s3_bucket.static_content_secondary.bucket
}
```
