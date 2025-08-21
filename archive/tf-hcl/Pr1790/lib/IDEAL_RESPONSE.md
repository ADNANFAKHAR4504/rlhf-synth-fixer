# Ideal Terraform Response

This document contains the complete Terraform configuration for setting up a secure AWS VPC with network access controls.

## Complete Terraform Configuration

```terraform
########################
# Variables
########################
variable "aws_region" {
  description = "AWS region for the infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "allowed_ip_ranges" {
  description = "List of IP ranges allowed to access the infrastructure"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "environment" {
  description = "Environment name for tagging"
  type        = string
  default     = "Production"
}

variable "environment_suffix" {
  description = "Environment suffix for resource names to avoid conflicts"
  type        = string
  default     = "dev"
}

########################
# Provider Configuration
########################
provider "aws" {
  region = var.aws_region
}

########################
# Data Sources
########################
data "aws_availability_zones" "available" {
  state = "available"
}

########################
# VPC
########################
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "production-vpc-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

########################
# Internet Gateway
########################
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "production-igw-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

########################
# Public Subnets (3 subnets across different AZs)
########################
resource "aws_subnet" "public" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
    Type        = "public"
  }
}

########################
# Private Subnet
########################
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 3)
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "private-subnet-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
    Type        = "private"
  }
}

########################
# Route Table for Public Subnets
########################
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "public-route-table-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

########################
# Route Table Association for Public Subnets
########################
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

########################
# Security Group for Public Resources
########################
resource "aws_security_group" "public" {
  name        = "public-security-group-${var.environment_suffix}"
  description = "Security group for public resources with IP restrictions"
  vpc_id      = aws_vpc.main.id

  # Inbound rules - restricted to specific IP ranges
  dynamic "ingress" {
    for_each = var.allowed_ip_ranges
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
      description = "SSH access from allowed IP ranges"
    }
  }

  dynamic "ingress" {
    for_each = var.allowed_ip_ranges
    content {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
      description = "HTTP access from allowed IP ranges"
    }
  }

  dynamic "ingress" {
    for_each = var.allowed_ip_ranges
    content {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
      description = "HTTPS access from allowed IP ranges"
    }
  }

  # Outbound rules - restricted
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP outbound"
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }

  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS outbound"
  }

  tags = {
    Name        = "public-security-group-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

########################
# Security Group for Private Resources
########################
resource "aws_security_group" "private" {
  name        = "private-security-group-${var.environment_suffix}"
  description = "Security group for private resources"
  vpc_id      = aws_vpc.main.id

  # Inbound rules - only from public subnet
  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.public.id]
    description     = "SSH access from public subnet"
  }

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.public.id]
    description     = "HTTP access from public subnet"
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.public.id]
    description     = "HTTPS access from public subnet"
  }

  # Outbound rules - restricted
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP outbound"
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }

  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS outbound"
  }

  tags = {
    Name        = "private-security-group-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

########################
# Outputs
########################
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = aws_subnet.private.id
}

output "public_security_group_id" {
  description = "ID of the public security group"
  value       = aws_security_group.public.id
}

output "private_security_group_id" {
  description = "ID of the private security group"
  value       = aws_security_group.private.id
}

output "internet_gateway_id" {
  description = "ID of the internet gateway"
  value       = aws_internet_gateway.main.id
}
```
