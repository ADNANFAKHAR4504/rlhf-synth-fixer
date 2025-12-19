# VPC Configuration
resource "aws_vpc" "main" {
  count = var.use_existing_vpc ? 0 : 1

  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "fintech-vpc-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  count = var.use_existing_vpc ? 0 : 1

  vpc_id = aws_vpc.main[0].id

  tags = merge(
    local.common_tags,
    {
      Name = "fintech-igw-${var.environment_suffix}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.use_existing_vpc ? 0 : length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index % length(var.availability_zones)]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "fintech-public-subnet-${count.index + 1}-${var.environment_suffix}"
      Type = "public"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = var.use_existing_vpc ? 0 : length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index % length(var.availability_zones)]

  tags = merge(
    local.common_tags,
    {
      Name = "fintech-private-subnet-${count.index + 1}-${var.environment_suffix}"
      Type = "private"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.use_existing_vpc ? 0 : length(var.public_subnet_cidrs)

  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "fintech-nat-eip-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.use_existing_vpc ? 0 : length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "fintech-nat-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  count = var.use_existing_vpc ? 0 : 1

  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "fintech-public-rt-${var.environment_suffix}"
    }
  )
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = var.use_existing_vpc ? 0 : length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "fintech-private-rt-${count.index + 1}-${var.environment_suffix}"
    }
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = var.use_existing_vpc ? 0 : length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = var.use_existing_vpc ? 0 : length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
