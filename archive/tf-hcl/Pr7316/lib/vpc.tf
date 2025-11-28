# VPC and networking resources for primary region
resource "aws_vpc" "primary" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-dr-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_subnet" "primary" {
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-dr-primary-subnet-${count.index + 1}-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-dr-primary-igw-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_route_table" "primary" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-dr-primary-rt-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_route_table_association" "primary" {
  count          = 3
  subnet_id      = aws_subnet.primary[count.index].id
  route_table_id = aws_route_table.primary.id
}

# VPC and networking resources for secondary region
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-dr-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_subnet" "secondary" {
  count             = 3
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-dr-secondary-subnet-${count.index + 1}-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-dr-secondary-igw-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_route_table" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-dr-secondary-rt-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_route_table_association" "secondary" {
  count          = 3
  provider       = aws.secondary
  subnet_id      = aws_subnet.secondary[count.index].id
  route_table_id = aws_route_table.secondary.id
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}
