# Main VPC Configuration
resource "aws_vpc" "payment_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "payment-vpc-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "payment_igw" {
  vpc_id = aws_vpc.payment_vpc.id

  tags = {
    Name        = "payment-igw-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 3
  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier        = "Public"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier        = "Private"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = "10.0.${count.index + 21}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "database-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier        = "Database"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name        = "nat-eip-${count.index + 1}-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }

  depends_on = [aws_internet_gateway.payment_igw]
}

# NAT Gateways
resource "aws_nat_gateway" "nat" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }

  depends_on = [aws_internet_gateway.payment_igw]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.payment_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.payment_igw.id
  }

  tags = {
    Name        = "public-rt-${var.environment_suffix}"
    Tier        = "Public"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ for NAT Gateway redundancy)
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.payment_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }

  tags = {
    Name        = "private-rt-${count.index + 1}-${var.environment_suffix}"
    Tier        = "Private"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Table (local only, no internet)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.payment_vpc.id

  tags = {
    Name        = "database-rt-${var.environment_suffix}"
    Tier        = "Database"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Database Route Table Associations
resource "aws_route_table_association" "database" {
  count          = 3
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
