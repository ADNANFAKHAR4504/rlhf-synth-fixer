# VPC
resource "aws_vpc" "ecommerce_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "ecommerce-vpc-${var.environment_suffix}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "ecommerce_igw" {
  vpc_id = aws_vpc.ecommerce_vpc.id

  tags = merge(var.common_tags, {
    Name = "ecommerce-igw-${var.environment_suffix}"
  })
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.ecommerce_vpc.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "ecommerce-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  })
}

# Private Subnets for RDS
resource "aws_subnet" "private_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.ecommerce_vpc.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name = "ecommerce-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.ecommerce_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ecommerce_igw.id
  }

  tags = merge(var.common_tags, {
    Name = "ecommerce-public-rt-${var.environment_suffix}"
  })
}

# Associate Public Subnets with Route Table
resource "aws_route_table_association" "public_rta" {
  count          = length(aws_subnet.public_subnets)
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# DB Subnet Group
resource "aws_db_subnet_group" "ecommerce_db_subnet_group" {
  name       = "ecommerce-db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private_subnets[*].id

  tags = merge(var.common_tags, {
    Name = "ecommerce-db-subnet-group-${var.environment_suffix}"
  })
}