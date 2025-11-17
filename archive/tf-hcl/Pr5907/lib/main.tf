# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name           = "payment-vpc-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name           = "payment-igw-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name           = "payment-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
    Tier           = "public"
  }
}

# Private Subnets for Application
resource "aws_subnet" "private_app" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name           = "payment-private-app-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
    Tier           = "private-app"
  }
}

# Private Subnets for Database
resource "aws_subnet" "private_db" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 4)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name           = "payment-private-db-subnet-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
    Tier           = "private-db"
  }
}

# Elastic IPs for NAT Gateway
resource "aws_eip" "nat" {
  count  = 1
  domain = "vpc"

  tags = {
    Name           = "payment-nat-eip-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (single NAT for cost optimization)
resource "aws_nat_gateway" "main" {
  count         = 1
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name           = "payment-nat-gateway-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name           = "payment-public-rt-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table for Private App Subnets
resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = {
    Name           = "payment-private-app-rt-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Route Table Associations for Private App Subnets
resource "aws_route_table_association" "private_app" {
  count          = 2
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app.id
}

# Route Table for Private DB Subnets
resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = {
    Name           = "payment-private-db-rt-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Route Table Associations for Private DB Subnets
resource "aws_route_table_association" "private_db" {
  count          = 2
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db.id
}
