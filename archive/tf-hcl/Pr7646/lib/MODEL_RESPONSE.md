# VPC Networking Infrastructure - Terraform HCL Solution

This solution provides a production-ready VPC networking environment with public and private subnets across multiple availability zones.

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

# Legacy variables for compatibility with test framework
variable "aws_region" {
  description = "AWS region for resources (legacy)"
  type        = string
  default     = "us-east-1"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
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
  region = var.region

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environment_suffix
      Project     = "vpc-networking"
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}
```

## Deployment Instructions

### Prerequisites
- Terraform >= 1.4.0
- AWS CLI configured with appropriate credentials
- S3 backend configured for state management

### Deployment Steps

1. **Initialize Terraform**
```bash
cd lib
terraform init
```

2. **Create terraform.tfvars**
```hcl
environment_suffix = "dev-abc123"
vpc_cidr          = "10.0.0.0/16"
az_count          = 2
region            = "us-east-1"
```

3. **Plan Deployment**
```bash
terraform plan
```

4. **Deploy Infrastructure**
```bash
terraform apply
```

5. **Verify Deployment**
```bash
terraform output
```

### Destroying Infrastructure

```bash
terraform destroy
```

All resources are designed to be fully destroyable without manual intervention.

## Architecture Notes

- VPC with /16 CIDR provides 65,536 IP addresses
- Public subnets get /24 blocks (256 IPs each)
- Private subnets get /24 blocks (256 IPs each)
- Single NAT Gateway for cost optimization (consider multi-AZ NAT for production HA)
- All resources include environment_suffix for uniqueness
- DNS resolution enabled for VPC resources

## Cost Considerations

- NAT Gateway: ~$0.045/hour + data transfer costs
- Elastic IP: Free when attached to running NAT Gateway
- VPC, Subnets, IGW, Route Tables: Free
- Total estimated monthly cost: ~$35-40 (NAT Gateway only)
