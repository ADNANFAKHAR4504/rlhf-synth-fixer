# VPC Networking Infrastructure - Terraform HCL Implementation

This is a production-ready VPC networking setup with public and private subnets across multiple availability zones, complete with Internet Gateway and NAT Gateway for secure internet access.

## Architecture Overview

- VPC with /16 CIDR block
- 2 Public subnets across 2 availability zones
- 2 Private subnets across 2 availability zones
- Internet Gateway for public subnet internet access
- NAT Gateway with Elastic IP for private subnet outbound access
- Route tables for proper traffic routing

## File: main.tf

```hcl
# main.tf
# VPC Networking Infrastructure

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "igw-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "eip-nat-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.az_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "subnet-public-${count.index + 1}-${var.environment_suffix}"
    Type        = "public"
    Environment = var.environment_suffix
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "subnet-private-${count.index + 1}-${var.environment_suffix}"
    Type        = "private"
    Environment = var.environment_suffix
  }
}

# NAT Gateway (deployed in first public subnet)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name        = "nat-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "rt-public-${var.environment_suffix}"
    Type        = "public"
    Environment = var.environment_suffix
  }
}

# Public Route - Internet Gateway
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Public Route Table Association
resource "aws_route_table_association" "public" {
  count = var.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "rt-private-${var.environment_suffix}"
    Type        = "private"
    Environment = var.environment_suffix
  }
}

# Private Route - NAT Gateway
resource "aws_route" "private_internet" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main.id
}

# Private Route Table Association
resource "aws_route_table_association" "private" {
  count = var.az_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
```

## File: variables.tf

```hcl
# variables.tf
# Input variables for VPC networking infrastructure

variable "environment_suffix" {
  description = "Unique environment suffix for resource naming"
  type        = string

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "The environment_suffix must be between 1 and 20 characters."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "The vpc_cidr must be a valid CIDR block."
  }
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 4
    error_message = "The az_count must be between 2 and 4."
  }
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^(us|eu|ap|ca|sa|me|af)-[a-z]+-[0-9]+$", var.region))
    error_message = "The region must be a valid AWS region format."
  }
}
```

## File: outputs.tf

```hcl
# outputs.tf
# Output values for VPC networking infrastructure

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

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

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "ID of the private route table"
  value       = aws_route_table.private.id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}
```

## File: provider.tf

```hcl
# provider.tf
# AWS Provider configuration

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environment_suffix
      Project     = "vpc-networking"
    }
  }
}
```

## File: terraform.tfvars.example

```hcl
# terraform.tfvars.example
# Example variable values - copy to terraform.tfvars and modify

environment_suffix = "dev-abc123"
vpc_cidr          = "10.0.0.0/16"
az_count          = 2
region            = "us-east-1"
```

## File: README.md

```markdown
# VPC Networking Infrastructure

Production-ready VPC setup with public and private subnets, Internet Gateway, and NAT Gateway.

## Architecture

This infrastructure creates:
- VPC with configurable CIDR block (default: 10.0.0.0/16)
- Public subnets across multiple AZs (default: 2)
- Private subnets across multiple AZs (default: 2)
- Internet Gateway for public subnet internet access
- NAT Gateway for private subnet outbound internet access
- Route tables with proper associations

## Network Design

### Public Subnets
- CIDR: 10.0.0.0/24, 10.0.1.0/24 (first N /24 blocks)
- Internet access: Direct via Internet Gateway
- Use case: Load balancers, bastion hosts, NAT Gateway

### Private Subnets
- CIDR: 10.0.2.0/24, 10.0.3.0/24 (next N /24 blocks)
- Internet access: Outbound only via NAT Gateway
- Use case: Application servers, databases

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC resources

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Configure Variables

Copy the example file and modify:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
environment_suffix = "dev-abc123"  # REQUIRED: Unique identifier
vpc_cidr          = "10.0.0.0/16"  # Optional: VPC CIDR block
az_count          = 2              # Optional: Number of AZs
region            = "us-east-1"    # Optional: AWS region
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

### 5. Verify Deployment

Check outputs:

```bash
terraform output
```

Test connectivity:
- Launch EC2 instance in public subnet - should have internet access via IGW
- Launch EC2 instance in private subnet - should have outbound internet via NAT

### 6. Destroy Infrastructure

```bash
terraform destroy
```

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment_suffix | Unique environment suffix for resource naming | string | - | yes |
| vpc_cidr | CIDR block for VPC | string | "10.0.0.0/16" | no |
| az_count | Number of availability zones | number | 2 | no |
| region | AWS region | string | "us-east-1" | no |

## Outputs

| Name | Description |
|------|-------------|
| vpc_id | VPC ID |
| vpc_cidr | VPC CIDR block |
| public_subnet_ids | List of public subnet IDs |
| private_subnet_ids | List of private subnet IDs |
| internet_gateway_id | Internet Gateway ID |
| nat_gateway_id | NAT Gateway ID |
| nat_gateway_eip | NAT Gateway Elastic IP |
| public_route_table_id | Public route table ID |
| private_route_table_id | Private route table ID |

## Cost Optimization Notes

- NAT Gateway incurs hourly charges and data transfer costs
- Single NAT Gateway design reduces costs but creates single point of failure
- For production, consider NAT Gateway per AZ for high availability
- Elastic IP is free when associated with running resource

## Security Considerations

- Private subnets have no direct internet access
- NAT Gateway provides outbound-only internet for private subnets
- All resources tagged with environment suffix for tracking
- Network ACLs can be added for additional layer of security

## Troubleshooting

### Issue: Terraform init fails
- Ensure AWS credentials are configured
- Check internet connectivity

### Issue: Resources not destroyed
- Ensure no resources exist in subnets before destroying
- Check for ENIs or other dependencies

### Issue: NAT Gateway creation fails
- Verify Internet Gateway exists and is attached
- Check EIP quota in your account
```
