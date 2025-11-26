# VPC in primary region (us-east-1)
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Subnets in primary region
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.primary_vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name        = "subnet-primary-private-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 3
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.primary_vpc_cidr, 8, count.index + 10)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "subnet-primary-public-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Internet Gateway for primary
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name        = "igw-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# VPC in secondary region (us-west-2)
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Subnets in secondary region
resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = 3
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.secondary_vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = {
    Name        = "subnet-secondary-private-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 3
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.secondary_vpc_cidr, 8, count.index + 10)
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "subnet-secondary-public-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Internet Gateway for secondary
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name        = "igw-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# NAT Gateways for primary region
resource "aws_eip" "primary_nat" {
  provider = aws.primary
  count    = 3
  domain   = "vpc"

  tags = {
    Name        = "eip-nat-primary-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 3
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  tags = {
    Name        = "nat-primary-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }

  depends_on = [aws_internet_gateway.primary]
}

# NAT Gateways for secondary region
resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  count    = 3
  domain   = "vpc"

  tags = {
    Name        = "eip-nat-secondary-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = 3
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  tags = {
    Name        = "nat-secondary-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }

  depends_on = [aws_internet_gateway.secondary]
}

# Route tables for primary region - Private
resource "aws_route_table" "primary_private" {
  provider = aws.primary
  count    = 3
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }

  tags = {
    Name        = "rt-primary-private-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# Route tables for primary region - Public
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name        = "rt-primary-public-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Route tables for secondary region - Private
resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  count    = 3
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }

  tags = {
    Name        = "rt-secondary-private-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# Route tables for secondary region - Public
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = {
    Name        = "rt-secondary-public-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}
