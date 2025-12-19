# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name        = var.vpc_name
      Environment = var.environment
    }
  )
}

# Internet Gateway (only for hub VPC)
resource "aws_internet_gateway" "main" {
  count  = var.enable_public_subnets ? 1 : 0
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-igw-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = var.enable_public_subnets ? length(var.availability_zones) : 0
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-public-subnet-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
      Type        = "public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 4)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-private-subnet-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
      Type        = "private"
    }
  )
}

# Transit Gateway Subnets (dedicated for TGW attachments)
resource "aws_subnet" "transit_gateway" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 8)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-tgw-subnet-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
      Type        = "transit-gateway"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? length(var.availability_zones) : 0
  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-nat-eip-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? length(var.availability_zones) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-nat-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  count  = var.enable_public_subnets ? 1 : 0
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-public-rt-${var.environment_suffix}"
      Environment = var.environment
      Type        = "public"
    }
  )
}

# Public Route to Internet Gateway
resource "aws_route" "public_internet" {
  count                  = var.enable_public_subnets ? 1 : 0
  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main[0].id
}

# Public Subnet Route Table Associations
resource "aws_route_table_association" "public" {
  count          = var.enable_public_subnets ? length(var.availability_zones) : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Private Route Tables (one per AZ for NAT Gateway redundancy)
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-private-rt-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
      Type        = "private"
    }
  )
}

# Private Route to NAT Gateway (only in hub VPC)
resource "aws_route" "private_nat" {
  count                  = var.enable_nat_gateway ? length(var.availability_zones) : 0
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

# Private Subnet Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Transit Gateway Subnet Route Table Associations
resource "aws_route_table_association" "transit_gateway" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.transit_gateway[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
