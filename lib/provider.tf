// tap_stack.tf
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags       = { Name = "main-vpc" }
}

data "aws_availability_zones" "available" {}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags                    = { Name = "public-subnet-${count.index + 1}" }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "main-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
  tags = { Name = "public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

// provider.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5"
}

provider "aws" {
  region = var.aws_region

  # For CI/CD environments, credentials can be provided via:
  # 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  # 2. IAM roles for service accounts (IRSA) in EKS
  # 3. EC2 instance profile (for EC2-based runners)
  # 4. AWS STS assume role

  # Uncomment and configure one of the following methods:

  # Method 1: Static credentials (not recommended for production)
  # access_key = var.aws_access_key_id
  # secret_key = var.aws_secret_access_key

  # Method 2: Assume role (recommended for CI/CD)
  # assume_role {
  #   role_arn = var.aws_assume_role_arn
  # }

  # Method 3: Use environment variables (current setup)
  # AWS provider will automatically use AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
  # environment variables if they are set
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "subnet_ids" {
  description = "IDs of the subnets"
  value       = aws_subnet.public[*].id
}

output "igw_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.gw.id
}