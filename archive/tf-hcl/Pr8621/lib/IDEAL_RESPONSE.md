# Terraform VPC Infrastructure Implementation

This implementation provides a production-ready VPC infrastructure using Terraform with HCL for AWS us-east-1 region. The configuration includes a VPC with 6 subnets across 3 availability zones, Internet Gateway, 2 NAT Gateways, route tables, and security groups.

## File: lib/main.tf

```hcl
# Data source to fetch available availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.vpc_name}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.vpc_name}-igw-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.vpc_name}-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
    Type        = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.vpc_name}-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
    Type        = "Private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"

  tags = {
    Name        = "${var.vpc_name}-nat-eip-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (only in first two public subnets)
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.vpc_name}-nat-gateway-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }

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
    Name        = "${var.vpc_name}-public-rt-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  # First two private route tables route to NAT Gateways
  # Third private route table routes to the second NAT Gateway
  dynamic "route" {
    for_each = count.index < 2 ? [1] : [1]
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = count.index < 2 ? aws_nat_gateway.main[count.index].id : aws_nat_gateway.main[1].id
    }
  }

  tags = {
    Name        = "${var.vpc_name}-private-rt-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Default Security Group
resource "aws_security_group" "default" {
  name_prefix = "${var.vpc_name}-default-sg-${var.environment_suffix}-"
  description = "Default security group allowing HTTPS inbound and all outbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.vpc_name}-default-sg-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}
```

## File: lib/variables.tf

```hcl
variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
  default     = "startup-vpc"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming uniqueness"
  type        = string
  default     = "prod"
}

variable "environment" {
  description = "Environment tag value"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project tag value"
  type        = string
  default     = "startup-infrastructure"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.3.0/24", "10.0.5.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.2.0/24", "10.0.4.0/24", "10.0.6.0/24"]
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
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
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_eips" {
  description = "List of Elastic IP addresses for NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "public_route_table_id" {
  description = "The ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}

output "default_security_group_id" {
  description = "The ID of the default security group"
  value       = aws_security_group.default.id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and customize values

vpc_name           = "startup-vpc"
environment_suffix = "prod-001"
environment        = "production"
project            = "startup-infrastructure"
vpc_cidr           = "10.0.0.0/16"
aws_region         = "us-east-1"

public_subnet_cidrs = [
  "10.0.1.0/24",
  "10.0.3.0/24",
  "10.0.5.0/24"
]

private_subnet_cidrs = [
  "10.0.2.0/24",
  "10.0.4.0/24",
  "10.0.6.0/24"
]
```

## Deployment Instructions

### Prerequisites

1. Terraform 1.5+ installed
2. AWS CLI configured with appropriate credentials
3. Permissions to create VPC resources and allocate Elastic IPs

### Deployment Steps

```bash
# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply

# Verify resources were created
terraform show

# Get outputs
terraform output
```

### Validation

After deployment, verify the following:

1. VPC created with CIDR 10.0.0.0/16 and DNS hostnames enabled
2. 3 public subnets created in different AZs with correct CIDRs
3. 3 private subnets created in different AZs with correct CIDRs
4. Internet Gateway attached to VPC
5. 2 NAT Gateways created with Elastic IPs in first two public subnets
6. Route tables properly configured and associated with subnets
7. Security group created with HTTPS inbound and all outbound rules
8. All resources tagged with Environment and Project tags

### Cleanup

To destroy all resources:

```bash
terraform destroy
```

Note: All resources are configured to be destroyable without any retention policies.
