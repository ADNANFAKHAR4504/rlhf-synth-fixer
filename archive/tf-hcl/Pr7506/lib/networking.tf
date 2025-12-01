# Primary Region VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-primary-${var.environment_suffix}"
  }
}

resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 8, count.index)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-primary-public-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 8, count.index + 2)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name = "subnet-primary-private-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name = "igw-primary-${var.environment_suffix}"
  }
}

resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name = "rt-primary-public-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = 2
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Secondary Region VPC
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-secondary-${var.environment_suffix}"
  }
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_secondary, 8, count.index)
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-secondary-public-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_secondary, 8, count.index + 2)
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = {
    Name = "subnet-secondary-private-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name = "igw-secondary-${var.environment_suffix}"
  }
}

resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = {
    Name = "rt-secondary-public-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = 2
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}
