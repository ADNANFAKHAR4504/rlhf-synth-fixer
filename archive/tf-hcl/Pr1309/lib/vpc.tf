# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-primary-vpc"
    Region = var.aws_region_primary
  })
}

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name   = "${local.resource_prefix}-secondary-vpc"
    Region = var.aws_region_secondary
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-igw"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-igw"
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = min(3, length(data.aws_availability_zones.primary.names))
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-public-${count.index + 1}"
    Type = "public"
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = min(3, length(data.aws_availability_zones.primary.names))
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-private-${count.index + 1}"
    Type = "private"
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = min(3, length(data.aws_availability_zones.secondary.names))
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-public-${count.index + 1}"
    Type = "public"
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = min(3, length(data.aws_availability_zones.secondary.names))
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-private-${count.index + 1}"
    Type = "private"
  })
}

# NAT Gateways for Primary Region
resource "aws_eip" "primary_nat" {
  provider = aws.primary
  count    = 1 # Reduced to 1 to avoid EIP limit
  domain   = "vpc"

  depends_on = [aws_internet_gateway.primary]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 1 # Reduced to 1 to avoid EIP limit
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id

  depends_on = [aws_internet_gateway.primary]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-nat-${count.index + 1}"
  })
}

# NAT Gateways for Secondary Region
resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  count    = 1 # Reduced to 1 to avoid EIP limit
  domain   = "vpc"

  depends_on = [aws_internet_gateway.secondary]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = 1 # Reduced to 1 to avoid EIP limit
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id

  depends_on = [aws_internet_gateway.secondary]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-nat-${count.index + 1}"
  })
}

# Route Tables for Primary Region
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-public-rt"
  })
}

resource "aws_route_table" "primary_private" {
  provider = aws.primary
  count    = 1 # Reduced to 1 to avoid EIP limit
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-private-rt-${count.index + 1}"
  })
}

# Route Tables for Secondary Region
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-public-rt"
  })
}

resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  count    = 1 # Reduced to 1 to avoid EIP limit
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-private-rt-${count.index + 1}"
  })
}

# Route Table Associations for Primary Region
resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_public)
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = length(aws_subnet.primary_private)
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[0].id
}

# Route Table Associations for Secondary Region
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = length(aws_subnet.secondary_public)
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = length(aws_subnet.secondary_private)
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[0].id
}