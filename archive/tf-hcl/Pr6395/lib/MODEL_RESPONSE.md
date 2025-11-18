## main.tf

```hcl
# Variables
variable "availability_zones" {
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
  description = "List of availability zones for high availability deployment"
}

# Locals
locals {
  vpc_cidr = "10.0.0.0/16"
  
  # Generate subnet configurations dynamically
  azs = var.availability_zones
  
  # Public subnets: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
  public_subnets = {
    for idx, az in local.azs : az => {
      cidr = cidrsubnet(local.vpc_cidr, 8, idx)
      az   = az
    }
  }
  
  # Private subnets: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
  private_subnets = {
    for idx, az in local.azs : az => {
      cidr = cidrsubnet(local.vpc_cidr, 8, idx + 10)
      az   = az
    }
  }
  
  # Common tags for all resources
  common_tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    CostCenter  = "Web-App-Service"
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "production-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "production-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  for_each = local.public_subnets
  
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "nat-eip-${each.key}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = local.public_subnets
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "public-subnet-${each.key}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  for_each = local.private_subnets
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  
  tags = merge(local.common_tags, {
    Name = "private-subnet-${each.key}"
    Type = "Private"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  for_each = local.public_subnets
  
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id
  
  tags = merge(local.common_tags, {
    Name = "nat-gateway-${each.key}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "public-route-table"
    Type = "Public"
  })
}

# Public Route to Internet Gateway
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  for_each = local.public_subnets
  
  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ)
resource "aws_route_table" "private" {
  for_each = local.private_subnets
  
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "private-route-table-${each.key}"
    Type = "Private"
  })
}

# Private Routes to NAT Gateways
resource "aws_route" "private_nat" {
  for_each = local.private_subnets
  
  route_table_id         = aws_route_table.private[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[each.key].id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  for_each = local.private_subnets
  
  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private[each.key].id
}

# Web Tier Security Group
resource "aws_security_group" "web_tier" {
  name        = "web-tier-sg"
  description = "Security group for web tier - allows HTTPS from internet"
  vpc_id      = aws_vpc.main.id
  
  dynamic "ingress" {
    for_each = [{
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }]
    
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = "Allow HTTPS from anywhere"
    }
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "web-tier-sg"
  })
}

# App Tier Security Group
resource "aws_security_group" "app_tier" {
  name        = "app-tier-sg"
  description = "Security group for app tier - allows traffic from web tier only"
  vpc_id      = aws_vpc.main.id
  
  dynamic "ingress" {
    for_each = [{
      from_port       = 8080
      to_port         = 8080
      protocol        = "tcp"
      security_groups = [aws_security_group.web_tier.id]
    }]
    
    content {
      from_port       = ingress.value.from_port
      to_port         = ingress.value.to_port
      protocol        = ingress.value.protocol
      security_groups = ingress.value.security_groups
      description     = "Allow traffic on port 8080 from web tier"
    }
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "app-tier-sg"
  })
}

# Outputs
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the VPC"
}

output "public_subnet_ids" {
  value = {
    for k, v in aws_subnet.public : k => v.id
  }
  description = "Map of public subnet IDs by availability zone"
}

output "private_subnet_ids" {
  value = {
    for k, v in aws_subnet.private : k => v.id
  }
  description = "Map of private subnet IDs by availability zone"
}

output "nat_gateway_ids" {
  value = {
    for k, v in aws_nat_gateway.main : k => v.id
  }
  description = "Map of NAT Gateway IDs by availability zone"
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