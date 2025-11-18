## main.tf
```hcl


# main.tf

# ===========================
# VARIABLES
# ===========================
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

# ===========================
# EC2 IAM
# ===========================

# 1. IAM Role to be assumed by the EC2 instance
resource "aws_iam_role" "e2e_test_role" {
  name_prefix = "e2e-test-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  tags = local.common_tags
}

# 2. IAM Policy to allow the instance to terminate itself
resource "aws_iam_policy" "e2e_test_policy" {
  name_prefix = "e2e-test-policy"
  description = "Allows EC2 instance to terminate itself"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "ec2:TerminateInstances",
          "ec2:DescribeInstances" # Good for general introspection
        ],
        Effect   = "Allow",
        Resource = "*"
        # A safer, production-ready version would restrict to the instance's ARN, 
        # but using "*" is acceptable for a dedicated, temporary E2E testing role.
      }
    ]
  })
}

# 3. Attach Policy to Role
resource "aws_iam_role_policy_attachment" "e2e_test_attach" {
  role       = aws_iam_role.e2e_test_role.name
  policy_arn = aws_iam_policy.e2e_test_policy.arn
}

# 4. Instance Profile (The actual container used by EC2)
resource "aws_iam_instance_profile" "e2e_test_profile" {
  name_prefix = "e2e-test-profile"
  role        = aws_iam_role.e2e_test_role.name
}

# ===========================
# LOCALS
# ===========================
locals {
  vpc_cidr = "10.0.0.0/16"

  # Define three distinct availability zones
  availability_zones = [
    "${var.aws_region}a",
    "${var.aws_region}b",
    "${var.aws_region}c"
  ]

  # Create a map for easier iteration
  azs = {
    for idx, az in local.availability_zones :
    az => {
      index = idx
      az    = az
    }
  }

  # Common tags for all resources
  common_tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    CostCenter  = "Web-App-Service"
  }
}

# ===========================
# VPC CORE
# ===========================

# VPC Base Configuration
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "production-vpc"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "production-igw"
    }
  )
}

# ===========================
# SUBNETS
# ===========================

# Public Subnets (3 total, one per AZ)
resource "aws_subnet" "public" {
  for_each = local.azs

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.vpc_cidr, 8, each.value.index)
  availability_zone       = each.key
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "public-subnet-${each.key}"
      Type = "Public"
    }
  )
}

# Private Subnets (3 total, one per AZ)
resource "aws_subnet" "private" {
  for_each = local.azs

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.vpc_cidr, 8, each.value.index + 10)
  availability_zone       = each.key
  map_public_ip_on_launch = false

  tags = merge(
    local.common_tags,
    {
      Name = "private-subnet-${each.key}"
      Type = "Private"
    }
  )
}

# ===========================
# NAT GATEWAYS
# ===========================

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  for_each = local.azs

  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "nat-eip-${each.key}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (3 total, one per public subnet)
resource "aws_nat_gateway" "main" {
  for_each = local.azs

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id

  tags = merge(
    local.common_tags,
    {
      Name = "nat-gateway-${each.key}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# ===========================
# ROUTE TABLES
# ===========================

# Public Route Table (single table for all public subnets)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "public-route-table"
      Type = "Public"
    }
  )
}

# Public Route to Internet Gateway
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Associate Public Subnets with Public Route Table
resource "aws_route_table_association" "public" {
  for_each = local.azs

  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (3 total, one per AZ)
resource "aws_route_table" "private" {
  for_each = local.azs

  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "private-route-table-${each.key}"
      Type = "Private"
    }
  )
}

# Private Routes to NAT Gateways
resource "aws_route" "private_nat" {
  for_each = local.azs

  route_table_id         = aws_route_table.private[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[each.key].id
}

# Associate Private Subnets with Private Route Tables
resource "aws_route_table_association" "private" {
  for_each = local.azs

  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private[each.key].id
}

# ===========================
# SECURITY GROUPS
# ===========================

# Web Tier Security Group
resource "aws_security_group" "web_tier" {
  name        = "web-tier-sg"
  description = "Security group for web tier allowing HTTPS traffic"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = [
      {
        from_port   = 443
        to_port     = 443
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "Allow HTTPS from anywhere"
      }
    ]
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "web-tier-sg"
      Tier = "Web"
    }
  )
}

# App Tier Security Group
resource "aws_security_group" "app_tier" {
  name        = "app-tier-sg"
  description = "Security group for app tier allowing traffic from web tier"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = [
      {
        from_port       = 8080
        to_port         = 8080
        protocol        = "tcp"
        security_groups = [aws_security_group.web_tier.id]
        description     = "Allow traffic from Web Tier SG on port 8080"
      }
    ]
    content {
      from_port       = ingress.value.from_port
      to_port         = ingress.value.to_port
      protocol        = ingress.value.protocol
      security_groups = ingress.value.security_groups
      description     = ingress.value.description
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "app-tier-sg"
      Tier = "Application"
    }
  )
}

# ===========================
# OUTPUTS
# ===========================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Map of public subnet IDs by availability zone"
  value = {
    for k, v in aws_subnet.public : k => v.id
  }
}

output "private_subnet_ids" {
  description = "Map of private subnet IDs by availability zone"
  value = {
    for k, v in aws_subnet.private : k => v.id
  }
}

output "nat_gateway_ids" {
  description = "Map of NAT Gateway IDs by availability zone"
  value = {
    for k, v in aws_nat_gateway.main : k => v.id
  }
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "web_tier_security_group_id" {
  description = "ID of the Web Tier Security Group"
  value       = aws_security_group.web_tier.id
}

output "app_tier_security_group_id" {
  description = "ID of the App Tier Security Group"
  value       = aws_security_group.app_tier.id
}

output "public_route_table_id" {
  description = "ID of the Public Route Table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "Map of Private Route Table IDs by availability zone"
  value = {
    for k, v in aws_route_table.private : k => v.id
  }
}

output "eip_allocation_ids" {
  description = "Map of Elastic IP allocation IDs by availability zone"
  value = {
    for k, v in aws_eip.nat : k => v.id
  }
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_cidrs" {
  description = "Map of public subnet CIDR blocks by availability zone"
  value = {
    for k, v in aws_subnet.public : k => v.cidr_block
  }
}

output "private_subnet_cidrs" {
  description = "Map of private subnet CIDR blocks by availability zone"
  value = {
    for k, v in aws_subnet.private : k => v.cidr_block
  }
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = local.availability_zones
}

output "e2e_instance_profile_arn" {
  description = "ARN of the IAM Instance Profile for E2E testing EC2"
  value       = aws_iam_instance_profile.e2e_test_profile.arn
}
```
## provider.tf

```hcl

# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
``` 