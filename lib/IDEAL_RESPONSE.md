# Terraform Infrastructure - Ideal Response

## Overview
This document presents the ideal Terraform infrastructure solution that creates a basic VPC network with public subnets, internet gateway, and proper routing configuration.

## Infrastructure Components

### 1. Provider Configuration (`provider.tf`)

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = "us-east-1"
}
```

### 2. Main Infrastructure Stack (`tap_stack.tf`)

```hcl
# Variables
variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

# VPC
resource "aws_vpc" "basic_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "basic-vpc-${var.environment_suffix}"
    Project     = "basic-network"
    Environment = var.environment_suffix
  }
}

# Internet Gateway
resource "aws_internet_gateway" "basic_igw" {
  vpc_id = aws_vpc.basic_vpc.id

  tags = {
    Name        = "basic-igw-${var.environment_suffix}"
    Project     = "basic-network"
    Environment = var.environment_suffix
  }
}

# Public Subnet A
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.basic_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-a-${var.environment_suffix}"
    Project     = "basic-network"
    Environment = var.environment_suffix
  }
}

# Public Subnet B
resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.basic_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-b-${var.environment_suffix}"
    Project     = "basic-network"
    Environment = var.environment_suffix
  }
}

# Public Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.basic_vpc.id

  tags = {
    Name        = "public-rt-${var.environment_suffix}"
    Project     = "basic-network"
    Environment = var.environment_suffix
  }
}

# Default Route to Internet Gateway
resource "aws_route" "public_internet_access" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.basic_igw.id
}

# Route Table Association for Public Subnet A
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

# Route Table Association for Public Subnet B
resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.basic_vpc.id
}

output "subnet_ids" {
  description = "List of public subnet IDs"
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.basic_igw.id
}

output "route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public_rt.id
}
```

## Key Features of the Ideal Solution

### 1. **Environment Suffix Support**
- All resources use `var.environment_suffix` for naming
- Prevents resource conflicts between multiple deployments
- Defaults to "dev" but can be overridden during deployment

### 2. **High Availability Architecture**
- Two public subnets in different availability zones (us-east-1a and us-east-1b)
- Ensures resilience and fault tolerance

### 3. **Proper Network Configuration**
- VPC with /16 CIDR block (10.0.0.0/16) provides 65,536 IP addresses
- Subnets use /24 CIDR blocks with 256 IP addresses each
- DNS hostnames and support enabled for better service discovery

### 4. **Internet Connectivity**
- Internet Gateway attached to VPC
- Public route table with default route to IGW
- Both subnets associated with the public route table
- Auto-assign public IPs enabled on subnets

### 5. **Resource Tagging**
- Consistent tagging strategy with Name, Project, and Environment tags
- All tags use the environment suffix for unique identification

### 6. **Comprehensive Outputs**
- VPC ID for reference by other resources
- Subnet IDs as a list for load balancers or EC2 instances
- Internet Gateway ID for troubleshooting
- Route Table ID for additional route management

## Deployment Instructions

### Prerequisites
- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- IAM permissions for VPC, Subnet, IGW, and Route Table operations

### Deployment Commands

```bash
# Initialize Terraform
terraform init

# Plan the deployment with custom environment suffix
terraform plan -var="environment_suffix=pr2774" -out=tfplan

# Apply the configuration
terraform apply tfplan

# View outputs
terraform output

# Destroy resources when done
terraform destroy -var="environment_suffix=pr2774" -auto-approve
```

## Testing Coverage

### Unit Tests
- File existence validation
- Provider configuration checks
- Stack structure validation
- Environment suffix usage
- CIDR configuration validation
- Availability zone checks
- Resource dependency validation
- Output completeness

### Integration Tests
- Terraform init/validate/plan execution
- Syntax validation
- Resource dependency verification
- Configuration completeness checks

## Best Practices Implemented

1. **Infrastructure as Code**: All resources defined in version-controlled Terraform files
2. **Modularity**: Separate provider and stack configurations
3. **Parameterization**: Environment suffix variable for multi-environment support
4. **Documentation**: Clear descriptions for all outputs
5. **Testing**: Comprehensive unit and integration tests
6. **Resource Cleanup**: No retention policies, all resources are destroyable
7. **Security**: Private IP ranges used, public access controlled via IGW

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      VPC (10.0.0.0/16)                  │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐     │
│  │   Public Subnet A     │  │   Public Subnet B     │    │
│  │    10.0.1.0/24       │  │    10.0.2.0/24        │    │
│  │    us-east-1a        │  │    us-east-1b         │    │
│  └──────────┬───────────┘  └──────────┬────────────┘    │
│             │                          │                 │
│             └────────┬─────────────────┘                 │
│                      │                                   │
│            ┌─────────▼──────────┐                       │
│            │   Route Table      │                       │
│            │   0.0.0.0/0 → IGW  │                       │
│            └─────────┬──────────┘                       │
│                      │                                   │
└──────────────────────┼───────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │ Internet Gateway │
              └────────┬─────────┘
                       │
                   Internet
```

This infrastructure provides a robust, scalable foundation for deploying applications in AWS with proper network isolation, high availability, and internet connectivity.