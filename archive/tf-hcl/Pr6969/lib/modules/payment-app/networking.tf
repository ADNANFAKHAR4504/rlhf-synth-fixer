# 1. Create the VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# 2. Get Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}

# 3. Create Public Subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "subnet-public-${var.pr_number}-${count.index + 1}"
    Type        = "public"
    Environment = var.environment
    Project     = "payment-processing"
  }
}

# 4. Create Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "subnet-private-${var.pr_number}-${count.index + 1}"
    Type        = "private"
    Environment = var.environment
    Project     = "payment-processing"
  }
}

# 5. Internet Gateway (for Public Subnets)
resource "aws_internet_gateway" "main" {
  vpc_id = local.vpc_id

  tags = {
    Name        = "igw-${var.pr_number}"
    Environment = var.environment
  }
}

# 6. NAT Gateway (Allows Private EC2s to download updates/packages)
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = {
    Name = "eip-nat-${var.pr_number}"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = local.public_subnet_ids[0]

  tags = {
    Name        = "nat-gw-${var.pr_number}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# 7. Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "rt-public-${var.pr_number}"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "rt-private-${var.pr_number}"
  }
}

# 8. Route Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}