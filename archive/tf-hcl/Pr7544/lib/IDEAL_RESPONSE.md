# IDEAL RESPONSE - Multi-Environment AWS VPC Infrastructure

## Overview
This document contains the ideal Terraform configuration for a production-ready, highly available AWS VPC infrastructure with multi-environment support and security best practices.

## Key Features Implemented
- Multi-environment support with `environment_suffix` variable
- High availability across 2 AZs in us-west-2 region
- Public and private subnets with proper routing
- NAT Gateways for private subnet internet access
- Security groups with restricted SSH access
- Encrypted EBS volumes and detailed monitoring
- Multi-file structure separation (tap_stack.tf, provider.tf, variables.tf)

## Complete Terraform Configuration

### tap_stack.tf
```hcl
# tap_stack.tf - Complete High Availability AWS VPC Infrastructure
# This configuration creates a production-ready, highly available VPC architecture in us-west-2
# with public/private subnets, NAT gateways, and EC2 instances with security best practices

# Data source to get available AZs in us-west-2
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source to get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
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

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "main-vpc-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Public Subnet 1 - AZ 1
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-1-${var.environment_suffix}"
    Type = "Public"
  }
}

# Public Subnet 2 - AZ 2
resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-2-${var.environment_suffix}"
    Type = "Public"
  }
}

# Private Subnet 1 - AZ 1
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "private-subnet-1-${var.environment_suffix}"
    Type = "Private"
  }
}

# Private Subnet 2 - AZ 2
resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "private-subnet-2-${var.environment_suffix}"
    Type = "Private"
  }
}

# Internet Gateway for public internet access
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw-${var.environment_suffix}"
  }
}

# Elastic IP for NAT Gateway 1
resource "aws_eip" "nat_1" {
  domain = "vpc"

  tags = {
    Name = "nat-eip-1-${var.environment_suffix}"
  }

  # Ensure proper resource creation order
  depends_on = [aws_internet_gateway.main]
}

# Elastic IP for NAT Gateway 2
resource "aws_eip" "nat_2" {
  domain = "vpc"

  tags = {
    Name = "nat-eip-2-${var.environment_suffix}"
  }

  # Ensure proper resource creation order
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway 1 in Public Subnet 1
resource "aws_nat_gateway" "nat_1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name = "nat-gateway-1-${var.environment_suffix}"
  }

  # Ensure proper resource creation order
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway 2 in Public Subnet 2
resource "aws_nat_gateway" "nat_2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = aws_subnet.public_2.id

  tags = {
    Name = "nat-gateway-2-${var.environment_suffix}"
  }

  # Ensure proper resource creation order
  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-route-table-${var.environment_suffix}"
  }
}

# Private Route Table 1 - Routes through NAT Gateway 1
resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_1.id
  }

  tags = {
    Name = "private-route-table-1-${var.environment_suffix}"
  }
}

# Private Route Table 2 - Routes through NAT Gateway 2
resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_2.id
  }

  tags = {
    Name = "private-route-table-2-${var.environment_suffix}"
  }
}

# Route Table Associations - Public Subnets
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private Subnets
resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_2.id
}

# Security Group for EC2 Instances
# Security best practice: Restrict SSH access to specific CIDR only
resource "aws_security_group" "ec2_sg" {
  name_prefix = "ec2-sg"
  description = "Security group for EC2 instances with restricted SSH access"
  vpc_id      = aws_vpc.main.id

  # Inbound rule - SSH only from allowed CIDR
  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # Outbound rule - Allow all traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ec2-security-group-${var.environment_suffix}"
  }
}

# Note: Removed Elastic IPs from private EC2 instances to maintain proper private subnet security
# EC2 instances in private subnets should not have direct internet access via Elastic IPs
# They can access internet through NAT Gateways for outbound traffic only

# EC2 Instance 1 in Private Subnet 1
resource "aws_instance" "ec2_1" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.private_1.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  # Security best practice: Enable EBS encryption at rest
  root_block_device {
    encrypted             = true
    volume_type           = "gp3"
    volume_size           = 8
    delete_on_termination = true
  }

  # Security best practice: Enable detailed monitoring
  monitoring = true

  # Security best practice: Enable termination protection in production
  # Note: Disabled as per requirement "no deletion protection"
  disable_api_termination = false

  tags = {
    Name = "ec2-instance-1-${var.environment_suffix}"
    Zone = "private-subnet-1"
  }
}

# EC2 Instance 2 in Private Subnet 2
resource "aws_instance" "ec2_2" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.private_2.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  # Security best practice: Enable EBS encryption at rest
  root_block_device {
    encrypted             = true
    volume_type           = "gp3"
    volume_size           = 8
    delete_on_termination = true
  }

  # Security best practice: Enable detailed monitoring
  monitoring = true

  # Security best practice: Enable termination protection in production
  # Note: Disabled as per requirement "no deletion protection"
  disable_api_termination = false

  tags = {
    Name = "ec2-instance-2-${var.environment_suffix}"
    Zone = "private-subnet-2"
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
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

output "private_subnet_1_id" {
  description = "ID of private subnet 1"
  value       = aws_subnet.private_1.id
}

output "private_subnet_2_id" {
  description = "ID of private subnet 2"
  value       = aws_subnet.private_2.id
}

output "ec2_1_private_ip" {
  description = "Private IP of EC2 instance 1"
  value       = aws_instance.ec2_1.private_ip
}

output "ec2_2_private_ip" {
  description = "Private IP of EC2 instance 2"
  value       = aws_instance.ec2_2.private_ip
}

output "nat_gateway_1_ip" {
  description = "Public IP of NAT Gateway 1"
  value       = aws_eip.nat_1.public_ip
}

output "nat_gateway_2_ip" {
  description = "Public IP of NAT Gateway 2"
  value       = aws_eip.nat_2.public_ip
}
```

## Environment-Specific Variables (dev.tfvars)
```hcl
aws_region = "us-west-2"
environment_suffix = "dev"
allowed_ssh_cidr = "10.0.0.0/16"
```

## Quality Metrics
- **Security**: EBS encryption, restricted SSH, security groups
- **High Availability**: Multi-AZ deployment across 2 availability zones
- **Scalability**: Environment-aware naming for multiple deployments
- **Best Practices**: Terraform version constraints, proper dependencies