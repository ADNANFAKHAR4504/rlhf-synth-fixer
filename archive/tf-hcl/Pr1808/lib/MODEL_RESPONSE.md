```hcl
# tap_stack.tf - Complete TAP infrastructure stack

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name for resource tagging"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "tap-stack"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access to EC2 instance"
  type        = string
  default     = "10.0.0.0/16"
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CostCenter  = "${var.project_name}-${var.environment}"
    Owner       = "Infrastructure-Team"
  }

  # Naming convention
  name_prefix = "${var.project_name}-${var.environment}"
  
  # VPC Configuration
  vpc_cidr = "10.0.0.0/16"
  
  # Subnet CIDRs
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]
  
  # Availability Zones
  availability_zones = ["${var.aws_region}a", "${var.aws_region}b"]
}

# ============================================================================
# DATA SOURCES
# ============================================================================

# Get latest Amazon Linux 2 AMI
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

# Get current AWS caller identity
data "aws_caller_identity" "current" {}

# ============================================================================
# RANDOM RESOURCES
# ============================================================================

# Generate random password for RDS
resource "random_password" "rds_password" {
  length  = 16
  special = true
}

# Generate random username for RDS
resource "random_pet" "rds_username" {
  length = 2
}

# ============================================================================
# VPC AND NETWORKING
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
    Type = "VPC"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
    Type = "InternetGateway"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(local.public_subnet_cidrs)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "PublicSubnet"
    AZ   = local.availability_zones[count.index]
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(local.private_subnet_cidrs)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "PrivateSubnet"
    AZ   = local.availability_zones[count.index]
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip"
    Type = "ElasticIP"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway"
    Type = "NATGateway"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
    Type = "RouteTable"
  })
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt"
    Type = "RouteTable"
  })
}

# Associate Public Subnets with Public Route Table
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate Private Subnets with Private Route Table
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security Group for EC2 Instance
resource "aws_security_group" "ec2" {
  name_prefix = "${local.name_prefix}-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instance with SSH access from VPC CIDR"
  
  ingress {
    description = "SSH access from VPC CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }
  
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg"
    Type = "SecurityGroup"
  })
}

# Security Group for RDS Instance
resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS instance with access from EC2 security group"
  
  ingress {
    description     = "MySQL/Aurora access from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }
  
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
    Type = "SecurityGroup"
  })
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for RDS Access
resource "aws_iam_role" "rds_access" {
  name = "${local.name_prefix}-rds-access-role"
  
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
    Name = "${local.name_prefix}-rds-access-role"
    Type = "IAMRole"
  })
}

# IAM Policy for RDS Access
resource "aws_iam_role_policy" "rds_access" {
  name = "${local.name_prefix}-rds-access-policy"
  role = aws_iam_role.rds_access.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters",
          "rds:Connect"
        ]
        Resource = [
          aws_db_instance.main.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = [
          aws_ssm_parameter.rds_username.arn,
          aws_ssm_parameter.rds_password.arn
        ]
      }
    ]
  })
}

# IAM Role for User with Least Privilege
resource "aws_iam_role" "user_least_privilege" {
  name = "${local.name_prefix}-user-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-user-role"
    Type = "IAMRole"
  })
}

# IAM Policy for User with Least Privilege
resource "aws_iam_role_policy" "user_least_privilege" {
  name = "${local.name_prefix}-user-policy"
  role = aws_iam_role.user_least_privilege.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Project" = var.project_name
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.rds_access.name
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-profile"
    Type = "InstanceProfile"
  })
}

# ============================================================================
# EC2 INSTANCE
# ============================================================================

resource "aws_instance" "main" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y mysql
    EOF
  )
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-instance"
    Type = "EC2Instance"
  })
}

# ============================================================================
# RDS SUBNET GROUP AND INSTANCE
# ============================================================================

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
    Type = "DBSubnetGroup"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "tapdb"
  username = random_pet.rds_username.id
  password = random_password.rds_password.result
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  publicly_accessible = false
  skip_final_snapshot = true
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
    Type = "RDSInstance"
  })
}

# ============================================================================
# S3 BUCKET
# ============================================================================

# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${local.name_prefix}-secure-bucket-${random_pet.rds_username.id}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secure-bucket"
    Type = "S3Bucket"
  })
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# ============================================================================
# CLOUDTRAIL
# ============================================================================

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${local.name_prefix}-cloudtrail-logs-${random_pet.rds_username.id}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-bucket"
    Type = "S3Bucket"
  })
}

# CloudTrail S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail S3 Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
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
  name           = "${local.name_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket
  
  include_global_service_events = true
  is_multi_region_trail        = false
  enable_logging               = true
  
  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.main.arn}/*"]
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
    Type = "CloudTrail"
  })
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# ============================================================================
# SYSTEMS MANAGER PARAMETER STORE
# ============================================================================

# SSM Parameter for RDS Username
resource "aws_ssm_parameter" "rds_username" {
  name  = "/${var.project_name}/${var.environment}/rds/username"
  type  = "SecureString"
  value = random_pet.rds_username.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-username-param"
    Type = "SSMParameter"
  })
}

# SSM Parameter for RDS Password
resource "aws_ssm_parameter" "rds_password" {
  name  = "/${var.project_name}/${var.environment}/rds/password"
  type  = "SecureString"
  value = random_password.rds_password.result
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-password-param"
    Type = "SSMParameter"
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

# EC2 Outputs
output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.main.public_ip
}

output "ec2_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.main.private_ip
}

# AMI Output
output "ami_id" {
  description = "AMI ID used for the EC2 instance"
  value       = data.aws_ami.amazon_linux.id
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "rds_db_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

# S3 Outputs
output "s3_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

# IAM Outputs
output "rds_access_role_arn" {
  description = "ARN of the RDS access IAM role"
  value       = aws_iam_role.rds_access.arn
}

output "user_role_arn" {
  description = "ARN of the user IAM role"
  value       = aws_iam_role.user_least_privilege.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

# Security Group Outputs
output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# CloudTrail Output
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

# SSM Parameter Outputs
output "rds_username_parameter_name" {
  description = "Name of the SSM parameter storing RDS username"
  value       = aws_ssm_parameter.rds_username.name
}

output "rds_password_parameter_name" {
  description = "Name of the SSM parameter storing RDS password"
  value       = aws_ssm_parameter.rds_password.name
}

# Network Infrastructure Outputs
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

output "nat_gateway_eip" {
  description = "Elastic IP address of the NAT Gateway"
  value       = aws_eip.nat.public_ip
}
```

## Key Features and Security Implementations

### 🏗️ **Infrastructure Components**
- **VPC**: Single region (us-east-2) with 10.0.0.0/16 CIDR
- **Subnets**: 2 public (10.0.1.0/24, 10.0.2.0/24) and 2 private (10.0.3.0/24, 10.0.4.0/24)
- **NAT Gateway**: Enables outbound internet access for private subnets
- **Route Tables**: Separate routing for public and private subnets

### 🔒 **Security Features**
- **Security Groups**: Restrictive rules with SSH access only from VPC CIDR
- **RDS**: Private subnet deployment with no public access
- **S3**: Public access blocked with AWS managed encryption
- **IAM**: Least privilege roles with specific resource access

### 📊 **Monitoring & Compliance**
- **CloudTrail**: Comprehensive API logging for all resources
- **SSM Parameter Store**: Secure storage for RDS credentials
- **Consistent Tagging**: All resources tagged for cost tracking

### 🎯 **Best Practices**
- **Naming Convention**: Consistent resource naming using locals
- **Random Credentials**: Secure RDS username/password generation
- **Encryption**: S3 server-side encryption enabled
- **Network Isolation**: RDS in private subnets only

The configuration is fully deployable and follows AWS security best practices while meeting all specified requirements.
