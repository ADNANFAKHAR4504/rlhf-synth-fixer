```hcl
# tap_stack.tf - Complete infrastructure stack for TAP deployment

# ============================================================================
# VARIABLES
# ============================================================================

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "cost_center" {
  description = "Cost center tag value"
  type        = string
  default     = "TAP-Infrastructure"
}

variable "environment" {
  description = "Environment tag value"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project tag value"
  type        = string
  default     = "TAP-Stack"
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  # Common tags to be applied to all resources
  common_tags = {
    "Cost Center" = var.cost_center
    "Environment" = var.environment
    "Project"     = var.project
  }

  # Availability zones for the region
  availability_zones = ["${var.region}a", "${var.region}b"]

  # Subnet CIDR blocks
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
}

# ============================================================================
# DATA SOURCES
# ============================================================================

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
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

# ============================================================================
# VPC AND NETWORKING
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  provider             = aws.us_east_2
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "tap-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "tap-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  provider                = aws.us_east_2
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "tap-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  provider          = aws.us_east_2
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "tap-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  provider = aws.us_east_2
  count    = 2
  domain   = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "tap-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  provider      = aws.us_east_2
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "tap-nat-gateway-${count.index + 1}"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "tap-public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  provider = aws.us_east_2
  count    = 2
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "tap-private-rt-${count.index + 1}"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  provider       = aws.us_east_2
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  provider       = aws.us_east_2
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security Group for EC2 instances
resource "aws_security_group" "ec2_sg" {
  provider    = aws.us_east_2
  name        = "tap-ec2-security-group"
  description = "Security group for TAP EC2 instances"
  vpc_id      = aws_vpc.main.id

  # Allow SSH access from within VPC
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow HTTP traffic from within VPC
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow HTTPS traffic from within VPC
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "tap-ec2-sg"
  })
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  provider = aws.us_east_2
  name     = "tap-ec2-role"

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

# IAM Policy for EC2 instances (basic CloudWatch and SSM permissions)
resource "aws_iam_role_policy" "ec2_policy" {
  provider = aws.us_east_2
  name     = "tap-ec2-policy"
  role     = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  provider = aws.us_east_2
  name     = "tap-ec2-profile"
  role     = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# ============================================================================
# EC2 INSTANCES
# ============================================================================

# EC2 Instances in Private Subnets
resource "aws_instance" "private_instances" {
  provider                    = aws.us_east_2
  count                       = 4 # 2 instances per private subnet
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.private[count.index % 2].id
  vpc_security_group_ids      = [aws_security_group.ec2_sg.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address = false

  # User data script for basic configuration
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    
    # Create a simple identification file
    echo "Instance: ${count.index + 1}" > /home/ec2-user/instance_info.txt
    echo "Subnet: ${count.index % 2 == 0 ? "private-1" : "private-2"}" >> /home/ec2-user/instance_info.txt
    echo "Deployment: TAP Stack" >> /home/ec2-user/instance_info.txt
    chown ec2-user:ec2-user /home/ec2-user/instance_info.txt
  EOF
  )

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 8
    delete_on_termination = true
    encrypted             = true

    tags = merge(local.common_tags, {
      Name = "tap-instance-${count.index + 1}-root-volume"
    })
  }

  tags = merge(local.common_tags, {
    Name   = "tap-instance-${count.index + 1}"
    Subnet = count.index % 2 == 0 ? "private-1" : "private-2"
  })
}

# ============================================================================
# S3 BUCKET (for application data/logs)
# ============================================================================

# S3 Bucket for TAP application data
resource "aws_s3_bucket" "tap_bucket" {
  provider = aws.us_east_2
  bucket   = "tap-stack-data-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "tap-application-bucket"
  })
}

# Random string for bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "tap_bucket_versioning" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.tap_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "tap_bucket_encryption" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.tap_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "tap_bucket_pab" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.tap_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
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

output "public_subnet_cidrs" {
  description = "CIDR blocks of the public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of the private subnets"
  value       = aws_subnet.private[*].cidr_block
}

# Gateway Outputs
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_eip_addresses" {
  description = "Elastic IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

# EC2 Outputs
output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_instance.private_instances[*].id
}

output "ec2_instance_private_ips" {
  description = "Private IP addresses of the EC2 instances"
  value       = aws_instance.private_instances[*].private_ip
}

output "ec2_instance_availability_zones" {
  description = "Availability zones of the EC2 instances"
  value       = aws_instance.private_instances[*].availability_zone
}

# AMI Outputs
output "amazon_linux_2_ami_id" {
  description = "ID of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.id
}

output "amazon_linux_2_ami_name" {
  description = "Name of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.name
}

# Security Group Outputs
output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2_sg.id
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_iam_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

# S3 Outputs
output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.tap_bucket.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.tap_bucket.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.tap_bucket.bucket_domain_name
}

# Region Output
output "deployment_region" {
  description = "AWS region where resources are deployed"
  value       = var.region
}

# Availability Zones Output
output "availability_zones" {
  description = "Availability zones used for deployment"
  value       = local.availability_zones
}
```

## Key Features of this Configuration:

### **Security Best Practices:**
- All resources are properly tagged with Cost Center, Environment, and Project
- EC2 instances are deployed in private subnets with no public IP addresses
- Security groups follow principle of least privilege
- S3 bucket has encryption enabled and public access blocked
- EBS volumes are encrypted
- IAM roles follow minimal permissions principle

### **High Availability:**
- Resources span across 2 availability zones (us-east-2a and us-east-2b)
- NAT gateways in each AZ for redundancy
- Private subnets route through their respective NAT gateways

### **Network Architecture:**
- VPC with 10.0.0.0/16 CIDR as specified
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24) for NAT gateways
- 2 private subnets (10.0.10.0/24, 10.0.20.0/24) for EC2 instances
- Proper routing configuration for internet access via NAT gateways

### **EC2 Deployment:**
- 4 t2.micro instances total (2 per private subnet)
- Latest Amazon Linux 2 AMI automatically selected
- IAM instance profile attached for AWS service access
- User data script for basic configuration

### **Comprehensive Outputs:**
- All essential resource identifiers
- Network configuration details
- AMI information
- IAM role details
- S3 bucket information

The configuration is fully deployable and follows AWS best practices for security, networking, and resource management.
