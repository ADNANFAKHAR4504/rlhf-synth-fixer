# tap_stack.tf - Production-ready AWS Network Infrastructure for us-west-1
# This configuration implements a secure, scalable VPC with public subnets,
# security groups, and IAM roles following AWS best practices

# Input Variables for flexible configuration
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_1_cidr" {
  description = "CIDR block for public subnet 1"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_2_cidr" {
  description = "CIDR block for public subnet 2"
  type        = string
  default     = "10.0.2.0/24"
}

variable "instance_type" {
  description = "EC2 instance type for future deployments"
  type        = string
  default     = "t3.micro"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "production-infrastructure"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

# Data source to fetch available AZs in us-west-1
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Configuration
# Security Best Practice: Using RFC 1918 private address space
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true # Enable DNS hostnames for easier resource identification
  enable_dns_support   = true # Enable DNS resolution within VPC

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Internet Gateway for public subnet internet connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Public Subnet 1 in first available AZ
# Security Best Practice: Distributing subnets across multiple AZs for high availability
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_1_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true # Auto-assign public IPs to instances launched in this subnet

  tags = {
    Name        = "${var.project_name}-public-subnet-1"
    Type        = "Public"
    Environment = var.environment
    Project     = var.project_name
    AZ          = data.aws_availability_zones.available.names[0]
    ManagedBy   = "Terraform"
  }
}

# Public Subnet 2 in second available AZ
resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_2_cidr
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true # Auto-assign public IPs to instances launched in this subnet

  tags = {
    Name        = "${var.project_name}-public-subnet-2"
    Type        = "Public"
    Environment = var.environment
    Project     = var.project_name
    AZ          = data.aws_availability_zones.available.names[1]
    ManagedBy   = "Terraform"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-public-rt"
    Type        = "Public"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Route for internet traffic through Internet Gateway
# Security Best Practice: Only allowing outbound internet access through controlled IGW
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id

  depends_on = [aws_internet_gateway.main]
}

# Associate Public Subnet 1 with Public Route Table
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

# Associate Public Subnet 2 with Public Route Table
resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Security Group for web and SSH access
# Security Best Practice: Implementing least privilege principle with specific port allowances
resource "aws_security_group" "main" {
  name        = "${var.project_name}-sg"
  description = "Security group for web and SSH access"
  vpc_id      = aws_vpc.main.id

  # Inbound rule for HTTP traffic
  # Security Note: Consider adding source IP restrictions for production environments
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound rule for SSH access
  # Security Best Practice: In production, restrict SSH to known IP ranges or use Systems Manager Session Manager
  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # WARNING: Consider restricting to specific IPs in production
  }

  # Allow all outbound traffic
  # Security Note: Consider restricting egress to specific destinations for enhanced security
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-security-group"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# IAM Role for EC2 instances with S3 ReadOnly and EC2 Full Control
# Security Best Practice: Using AWS managed policies for standard permissions
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  # Trust relationship policy allowing EC2 service to assume this role
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
    Name        = "${var.project_name}-ec2-iam-role"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "EC2 instance role with S3 read and EC2 management permissions"
    ManagedBy   = "Terraform"
  }
}

# Attach S3 ReadOnly policy to IAM role
# Security Best Practice: Using AWS managed policy for consistent, maintained permissions
resource "aws_iam_role_policy_attachment" "s3_readonly" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

# Attach EC2 Full Access policy to IAM role
# Security Note: Full EC2 access should be reviewed for production use cases
resource "aws_iam_role_policy_attachment" "ec2_full" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2FullAccess"
}

# Create instance profile for EC2 instances to use the IAM role
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name        = "${var.project_name}-ec2-instance-profile"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Outputs for reference and integration with other Terraform configurations
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_1_id" {
  description = "ID of public subnet 1"
  value       = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  description = "ID of public subnet 2"
  value       = aws_subnet.public_2.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "security_group_id" {
  description = "ID of the main security group"
  value       = aws_security_group.main.id
}

output "iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "iam_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "availability_zones" {
  description = "Availability zones used for subnets"
  value = [
    data.aws_availability_zones.available.names[0],
    data.aws_availability_zones.available.names[1]
  ]
}