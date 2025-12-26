# VPC in current region
resource "aws_vpc" "main" {
  provider             = aws.primary
  cidr_block           = local.current_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-vpc-${local.current_region}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  provider = aws.primary
  vpc_id   = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-igw-${local.current_region}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  provider                = aws.primary
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.current_public_subnets[count.index]
  availability_zone       = local.current_azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-public-subnet-${count.index + 1}-${local.current_region}"
      Type = "Public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.current_private_subnets[count.index]
  availability_zone = local.current_azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-private-subnet-${count.index + 1}-${local.current_region}"
      Type = "Private"
    }
  )
}

# Elastic IPs for NAT Gateways
# Reduced to 1 for cost optimization
resource "aws_eip" "nat" {
  provider = aws.primary
  count    = 1
  domain   = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-nat-eip-${count.index + 1}-${local.current_region}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
# Reduced to 1 for cost optimization
resource "aws_nat_gateway" "main" {
  provider      = aws.primary
  count         = 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-nat-${count.index + 1}-${local.current_region}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  provider = aws.primary
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-public-rt-${local.current_region}"
    }
  )
}

# Private Route Tables
# All use the same NAT Gateway for cost optimization
resource "aws_route_table" "private" {
  provider = aws.primary
  count    = 3
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-private-rt-${count.index + 1}-${local.current_region}"
    }
  )
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
