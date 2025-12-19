# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-${var.environment_suffix}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "igw-${var.environment_suffix}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "public"
  })
}

# Private Subnets for ECS
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 2)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "private"
  })
}

# Private Subnets for RDS
resource "aws_subnet" "database" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 4)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "database-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "database"
  })
}

# NAT Gateway EIP - reduced to 1 to avoid EIP limit
resource "aws_eip" "nat" {
  count  = 1
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway - reduced to 1 to avoid EIP limit
resource "aws_nat_gateway" "main" {
  count = 1

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "nat-gw-${count.index + 1}-${var.environment_suffix}"
  })
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "public-rt-${var.environment_suffix}"
  })
}

# Private Route Tables - all use single NAT gateway
resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = merge(local.common_tags, {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  })
}

# Database Route Tables
resource "aws_route_table" "database" {
  count = 2

  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "database-rt-${count.index + 1}-${var.environment_suffix}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = 2

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}
