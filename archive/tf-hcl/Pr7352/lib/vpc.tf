# vpc.tf - VPC and Network Infrastructure

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets (for ALB)
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${var.environment_suffix}-${var.availability_zones[count.index]}"
    Tier = "public"
  }
}

# Private Subnets (for compute and data)
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "private-subnet-${var.environment_suffix}-${var.availability_zones[count.index]}"
    Tier = "private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 6)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "database-subnet-${var.environment_suffix}-${var.availability_zones[count.index]}"
    Tier = "database"
  }
}

# Elastic IPs for NAT Gateways
# Use only 2 NAT gateways to avoid EIP limit issues
resource "aws_eip" "nat" {
  count  = min(2, length(var.availability_zones))
  domain = "vpc"

  tags = {
    Name = "eip-nat-${var.environment_suffix}-${var.availability_zones[count.index]}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
# Use only 2 NAT gateways to avoid EIP limit issues
resource "aws_nat_gateway" "main" {
  count         = min(2, length(var.availability_zones))
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-${var.environment_suffix}-${var.availability_zones[count.index]}"
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
    Name = "public-rt-${var.environment_suffix}"
  }
}

# Public Route Table Association
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ for high availability)
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    # Map AZs to NAT gateways: first 2 AZs get their own NAT, 3rd+ AZs share the last NAT
    nat_gateway_id = aws_nat_gateway.main[min(count.index, length(aws_nat_gateway.main) - 1)].id
  }

  # Only add transit gateway route if transit gateway ID is not placeholder
  dynamic "route" {
    for_each = var.transit_gateway_id != "tgw-00000000000000000" ? [1] : []
    content {
      cidr_block         = var.onprem_cidr
      transit_gateway_id = var.transit_gateway_id
    }
  }

  tags = {
    Name = "private-rt-${var.environment_suffix}-${var.availability_zones[count.index]}"
  }
}

# Private Route Table Association
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Tables
resource "aws_route_table" "database" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    # Map AZs to NAT gateways: first 2 AZs get their own NAT, 3rd+ AZs share the last NAT
    nat_gateway_id = aws_nat_gateway.main[min(count.index, length(aws_nat_gateway.main) - 1)].id
  }

  tags = {
    Name = "database-rt-${var.environment_suffix}-${var.availability_zones[count.index]}"
  }
}

# Database Route Table Association
resource "aws_route_table_association" "database" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}

# DB Subnet Group for Aurora
resource "aws_db_subnet_group" "aurora" {
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "aurora-subnet-group-${var.environment_suffix}"
  }
}

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "dms" {
  replication_subnet_group_description = "DMS replication subnet group for ${var.environment_suffix}"
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  subnet_ids                           = aws_subnet.private[*].id

  tags = {
    Name = "dms-subnet-group-${var.environment_suffix}"
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-sg-${var.environment_suffix}"
  }
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "lambda-sg-${var.environment_suffix}"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-sg-${var.environment_suffix}"
  }
}

# Security Group for Aurora
resource "aws_security_group" "aurora" {
  name        = "aurora-sg-${var.environment_suffix}"
  description = "Security group for Aurora PostgreSQL cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from Lambda"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  ingress {
    description     = "PostgreSQL from DMS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.dms.id]
  }

  ingress {
    description = "PostgreSQL from on-premises"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "aurora-sg-${var.environment_suffix}"
  }
}

# Security Group for DMS
resource "aws_security_group" "dms" {
  name        = "dms-sg-${var.environment_suffix}"
  description = "Security group for DMS replication instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from on-premises"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.onprem_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "dms-sg-${var.environment_suffix}"
  }
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "vpc-endpoints-sg-${var.environment_suffix}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "vpc-endpoints-sg-${var.environment_suffix}"
  }
}
