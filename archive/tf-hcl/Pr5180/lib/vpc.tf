# vpc.tf - VPC and networking configuration

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # Use provided AZs or default to first 3 available
  azs = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 3)

  # Calculate subnet CIDR blocks
  private_subnet_cidrs = [for i in range(length(local.azs)) : cidrsubnet(var.vpc_cidr, 4, i)]
  public_subnet_cidrs  = [for i in range(length(local.azs)) : cidrsubnet(var.vpc_cidr, 4, i + length(local.azs))]
}

# VPC for Aurora cluster
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-vpc"
    }
  )
}

# Internet Gateway for NAT instances
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-igw"
    }
  )
}

# Public subnets for NAT gateways
resource "aws_subnet" "public" {
  count = length(local.azs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-public-subnet-${count.index + 1}"
      Type = "Public"
    }
  )
}

# Private subnets for Aurora cluster
resource "aws_subnet" "private" {
  count = length(local.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-private-subnet-${count.index + 1}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT gateways
resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-nat-eip-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways for private subnet internet access
resource "aws_nat_gateway" "main" {
  count = length(local.azs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-nat-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-public-rt"
    }
  )
}

# Route tables for private subnets
resource "aws_route_table" "private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-private-rt-${count.index + 1}"
    }
  )
}

# Route table associations for public subnets
resource "aws_route_table_association" "public" {
  count = length(local.azs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route table associations for private subnets
resource "aws_route_table_association" "private" {
  count = length(local.azs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints for AWS services to reduce NAT traffic
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-s3-endpoint"
    }
  )
}

# Associate S3 endpoint with route tables
resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  count = length(local.azs)

  vpc_endpoint_id = aws_vpc_endpoint.s3.id
  route_table_id  = aws_route_table.private[count.index].id
}