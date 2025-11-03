# Terraform Multi-Tier VPC Architecture with PCI DSS Compliance - Ideal Response

This document represents the ideal Terraform HCL configuration for deploying a production-ready multi-tier VPC architecture with PCI DSS-compliant network segmentation, high availability across 3 availability zones, and comprehensive security controls.

## Architecture Summary

The solution creates a complete network foundation for a payment processing application with:
- VPC with 10.0.0.0/16 CIDR block and DNS support enabled
- 6 subnets across 3 availability zones (3 public + 3 private)
- Internet Gateway for public internet access
- 3 NAT Gateways with Elastic IPs (one per AZ for high availability)
- Security Groups implementing least-privilege access controls
- Network ACLs providing defense-in-depth with deny-by-default rules
- Full parameterization using Terraform variables for reusability

## Deployment Results

- Deployment Status: **SUCCESS** (first attempt)
- Resources Created: 28 AWS resources
- Deployment Time: ~3 minutes
- Region: us-east-1
- All resources properly tagged with environment_suffix

## Key Infrastructure Components

### Networking
- **VPC**: 10.0.0.0/16 with DNS hostnames and support enabled
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 (map_public_ip_on_launch enabled)
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **Availability Zones**: 3 (us-east-1a, us-east-1b, us-east-1c)

### High Availability
- 3 NAT Gateways (one per public subnet/AZ)
- 3 Elastic IPs for NAT Gateways
- Dedicated route table per private subnet pointing to corresponding NAT Gateway
- Single public route table shared across all public subnets

### Security
- **Web Tier SG**: Allows HTTPS (443) from 0.0.0.0/0, SSH (22) from allowed_ssh_cidr
- **App Tier SG**: Allows all TCP (0-65535) only from Web Tier security group
- **Public NACL**: Allows HTTPS, HTTP, SSH (from allowed_ssh_cidr), ephemeral ports (1024-65535)
- **Private NACL**: Allows VPC CIDR traffic, HTTPS/HTTP outbound, ephemeral ports
- All security groups have create_before_destroy lifecycle

## Code Quality

The generated Terraform configuration demonstrates:
1. **Correct Platform/Language**: Pure Terraform HCL as specified
2. **Proper Variable Usage**: All 7 variables correctly typed and documented
3. **Resource Naming**: All resources include environment_suffix in names
4. **High Availability**: Resources distributed across 3 AZs
5. **Security Best Practices**: Least-privilege access, defense-in-depth
6. **Clean Code**: Well-organized, properly formatted, clear descriptions
7. **Complete Outputs**: 14 output values for integration with other modules


Below is the deployed IAC ideal response:

## terraform.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}
```

## variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "0.0.0.0/0"
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default = {
    Project     = "payment-processing"
    Environment = "production"
    Compliance  = "PCI-DSS"
    ManagedBy   = "terraform"
  }
}
```

## terraform.tfvars

```hcl
# Environment configuration
environment_suffix = "synth101000811"
aws_region         = "us-east-1"

# Network configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# Security configuration
allowed_ssh_cidr = "10.0.0.0/8"

# Resource tags
tags = {
  Project     = "payment-processing"
  Environment = "production"
  Compliance  = "PCI-DSS"
  ManagedBy   = "terraform"
  CostCenter  = "fintech-ops"
}
```

## main.tf

```hcl

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "eip-nat-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per public subnet for high availability)
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
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

# Public Subnet Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets (one per AZ with dedicated NAT Gateway)
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-route-table-${count.index + 1}-${var.environment_suffix}"
  }
}

# Private Subnet Route Table Associations
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for Web Tier
resource "aws_security_group" "web_tier" {
  name_prefix = "web-tier-${var.environment_suffix}-"
  description = "Security group for web tier - allows HTTPS from internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-tier-sg-${var.environment_suffix}"
    Tier = "web"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for Application Tier
resource "aws_security_group" "app_tier" {
  name_prefix = "app-tier-${var.environment_suffix}-"
  description = "Security group for application tier - allows traffic only from web tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow traffic from web tier"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "app-tier-sg-${var.environment_suffix}"
    Tier = "application"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Network ACL for Public Subnets
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  # Inbound Rules - Deny by default, explicit allows below
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = var.allowed_ssh_cidr
    from_port  = 22
    to_port    = 22
  }

  # Ephemeral ports for return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound Rules
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  egress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Ephemeral ports for response traffic
  egress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  tags = {
    Name = "public-nacl-${var.environment_suffix}"
  }
}

# Network ACL for Private Subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Inbound Rules - Allow from VPC CIDR
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 65535
  }

  # Ephemeral ports for return traffic from internet
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound Rules
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  egress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  egress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 65535
  }

  # Ephemeral ports for response traffic
  egress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  tags = {
    Name = "private-nacl-${var.environment_suffix}"
  }
}
```

## outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  description = "CIDR blocks of public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_eips" {
  description = "Elastic IP addresses of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "web_tier_security_group_id" {
  description = "ID of web tier security group"
  value       = aws_security_group.web_tier.id
}

output "app_tier_security_group_id" {
  description = "ID of application tier security group"
  value       = aws_security_group.app_tier.id
}

output "public_route_table_id" {
  description = "ID of public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of private route tables"
  value       = aws_route_table.private[*].id
}

output "availability_zones" {
  description = "Availability zones used for subnet deployment"
  value       = data.aws_availability_zones.available.names
}
```