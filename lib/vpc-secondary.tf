# Secondary Region VPC
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name    = "vpc-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name    = "igw-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 3
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_subnets[count.index]
  availability_zone       = local.secondary_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name    = "subnet-public-secondary-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
    Type    = "public"
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = 3
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnets[count.index]
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.common_tags, {
    Name    = "subnet-private-secondary-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
    Type    = "private"
  })
}

# Secondary Database Subnets
resource "aws_subnet" "secondary_db" {
  provider          = aws.secondary
  count             = 3
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_db_subnets[count.index]
  availability_zone = local.secondary_azs[count.index]

  tags = merge(local.common_tags, {
    Name    = "subnet-db-secondary-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
    Type    = "database"
  })
}

# Secondary Public Route Table
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name    = "rt-public-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Public Route Table Associations
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Secondary Private Route Tables
resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  count    = 3
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name    = "rt-private-secondary-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Private Route Table Associations
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}
