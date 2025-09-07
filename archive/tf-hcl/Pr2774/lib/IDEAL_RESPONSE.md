# Simple Terraform Infrastructure Guide

This guide shows you how to create a basic AWS network using Terraform.
You'll set up a VPC with two public subnets that can access the internet.

## What You're Building

A simple AWS network with:

- One VPC (Virtual Private Cloud)
- Two public subnets in different zones
- An internet gateway for web access
- Route tables to connect everything

## Files You Need

### 1. provider.tf

This file tells Terraform you want to use AWS:

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

### 2. tap_stack.tf

This file creates all your AWS resources:

```hcl
# You can change "dev" to any environment name
variable "environment_suffix" {
  description = "Environment name for your resources"
  type        = string
  default     = "dev"
}

# Create the main network (VPC)
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

# Create internet gateway (door to the internet)
resource "aws_internet_gateway" "basic_igw" {
  vpc_id = aws_vpc.basic_vpc.id

  tags = {
    Name        = "basic-igw-${var.environment_suffix}"
    Project     = "basic-network"
    Environment = var.environment_suffix
  }
}

# Create first public subnet
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

# Create second public subnet
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

# Create route table (traffic rules)
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.basic_vpc.id

  tags = {
    Name        = "public-rt-${var.environment_suffix}"
    Project     = "basic-network"
    Environment = var.environment_suffix
  }
}

# Add route to internet
resource "aws_route" "public_internet_access" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.basic_igw.id
}

# Connect first subnet to route table
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

# Connect second subnet to route table
resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

# Show important information after creation
output "vpc_id" {
  description = "Your VPC ID"
  value       = aws_vpc.basic_vpc.id
}

output "subnet_ids" {
  description = "Your subnet IDs"
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "internet_gateway_id" {
  description = "Your internet gateway ID"
  value       = aws_internet_gateway.basic_igw.id
}

output "route_table_id" {
  description = "Your route table ID"
  value       = aws_route_table.public_rt.id
}
```

## How to Use This

### What You Need First

- Terraform installed on your computer
- AWS account with proper permissions
- AWS CLI configured with your credentials

### Commands to Run

```bash
# Set up Terraform
terraform init

# See what will be created
terraform plan -var="environment_suffix=myproject"

# Create everything
terraform apply -var="environment_suffix=myproject"

# See what was created
terraform output

# Delete everything when done
terraform destroy -var="environment_suffix=myproject"
```

## Why This Works Well

**Flexible naming**: Change "myproject" to any name you want. This lets you create multiple environments without conflicts.

**High availability**: Two subnets in different AWS zones means if one fails, the other keeps working.

**Internet access**: Both subnets can reach the internet and receive traffic from it.

**Clean organization**: Everything is tagged so you can easily find and manage your resources.

**Easy cleanup**: You can delete everything with one command when you're done.

## Simple Network Diagram

```text
Your VPC (10.0.0.0/16)
├── Subnet A (10.0.1.0/24) in us-east-1a
├── Subnet B (10.0.2.0/24) in us-east-1b
├── Internet Gateway (connects to internet)
└── Route Table (directs traffic to internet gateway)
```

This setup gives you a solid foundation for building web applications, databases,
or any other services that need internet connectivity in AWS.