# Primary Region VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name    = "vpc-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name    = "igw-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 3
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_subnets[count.index]
  availability_zone       = local.primary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name    = "subnet-public-primary-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
    Type    = "public"
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnets[count.index]
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.common_tags, {
    Name    = "subnet-private-primary-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
    Type    = "private"
  })
}

# Primary Database Subnets
resource "aws_subnet" "primary_db" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_db_subnets[count.index]
  availability_zone = local.primary_azs[count.index]

  tags = merge(local.common_tags, {
    Name    = "subnet-db-primary-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
    Type    = "database"
  })
}

# Primary Public Route Table
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name    = "rt-public-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Public Route Table Associations
resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Primary Private Route Tables
resource "aws_route_table" "primary_private" {
  provider = aws.primary
  count    = 3
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name    = "rt-private-primary-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Private Route Table Associations
resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}
