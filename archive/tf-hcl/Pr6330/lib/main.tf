# Data source to fetch available availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.vpc_name}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.vpc_name}-igw-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.vpc_name}-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
    Type        = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.vpc_name}-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
    Type        = "Private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"

  tags = {
    Name        = "${var.vpc_name}-nat-eip-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (only in first two public subnets)
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.vpc_name}-nat-gateway-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.vpc_name}-public-rt-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  # First two private route tables route to NAT Gateways
  # Third private route table routes to the second NAT Gateway
  dynamic "route" {
    for_each = count.index < 2 ? [1] : [1]
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = count.index < 2 ? aws_nat_gateway.main[count.index].id : aws_nat_gateway.main[1].id
    }
  }

  tags = {
    Name        = "${var.vpc_name}-private-rt-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Default Security Group
resource "aws_security_group" "default" {
  name_prefix = "${var.vpc_name}-default-sg-${var.environment_suffix}-"
  description = "Default security group allowing HTTPS inbound and all outbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.vpc_name}-default-sg-${var.environment_suffix}"
    Environment = var.environment
    Project     = var.project
  }
}
