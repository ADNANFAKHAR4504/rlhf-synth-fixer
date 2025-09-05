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