// Cross-region network module: VPCs, subnets, IGWs, RTs, peering, SGs

# Primary VPC
resource "aws_vpc" "primary" {
  count                = var.create_vpcs ? 1 : 0
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "primary-vpc"
    Environment = "production"
    Region      = "us-west-1"
  }
}

# Secondary VPC
resource "aws_vpc" "secondary" {
  count                = var.create_vpcs ? 1 : 0
  provider             = aws.eu_central_1
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "secondary-vpc"
    Environment = "production"
    Region      = "eu-central-1"
  }
}

# Internet Gateways
resource "aws_internet_gateway" "primary" {
  count  = var.create_vpcs ? 1 : 0
  vpc_id = aws_vpc.primary[0].id

  tags = { Name = "primary-igw" }
}

resource "aws_internet_gateway" "secondary" {
  count    = var.create_vpcs ? 1 : 0
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.secondary[0].id

  tags = { Name = "secondary-igw" }
}

# Subnets
resource "aws_subnet" "primary_public" {
  count                   = var.create_vpcs ? 1 : 0
  vpc_id                  = aws_vpc.primary[0].id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-west-1a"
  map_public_ip_on_launch = true

  tags = { Name = "primary-public-subnet" }
}

resource "aws_subnet" "primary_private" {
  count             = var.create_vpcs ? 1 : 0
  vpc_id            = aws_vpc.primary[0].id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-1c"

  tags = { Name = "primary-private-subnet" }
}

resource "aws_subnet" "secondary_public" {
  count                   = var.create_vpcs ? 1 : 0
  provider                = aws.eu_central_1
  vpc_id                  = aws_vpc.secondary[0].id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = "eu-central-1a"
  map_public_ip_on_launch = true

  tags = { Name = "secondary-public-subnet" }
}

resource "aws_subnet" "secondary_private" {
  count             = var.create_vpcs ? 1 : 0
  provider          = aws.eu_central_1
  vpc_id            = aws_vpc.secondary[0].id
  cidr_block        = "10.1.2.0/24"
  availability_zone = "eu-central-1c"

  tags = { Name = "secondary-private-subnet" }
}

# Route Tables
resource "aws_route_table" "primary_public" {
  count  = var.create_vpcs ? 1 : 0
  vpc_id = aws_vpc.primary[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary[0].id
  }

  tags = { Name = "primary-public-rt" }
}

resource "aws_route_table" "secondary_public" {
  count    = var.create_vpcs ? 1 : 0
  provider = aws.eu_central_1
  vpc_id   = aws_vpc.secondary[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary[0].id
  }

  tags = { Name = "secondary-public-rt" }
}

# Route Table Associations
resource "aws_route_table_association" "primary_public" {
  count          = var.create_vpcs ? 1 : 0
  subnet_id      = aws_subnet.primary_public[0].id
  route_table_id = aws_route_table.primary_public[0].id
}

resource "aws_route_table_association" "secondary_public" {
  count          = var.create_vpcs ? 1 : 0
  provider       = aws.eu_central_1
  subnet_id      = aws_subnet.secondary_public[0].id
  route_table_id = aws_route_table.secondary_public[0].id
}

# VPC Peering
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  count       = var.create_vpcs ? 1 : 0
  vpc_id      = aws_vpc.primary[0].id
  peer_vpc_id = aws_vpc.secondary[0].id
  peer_region = "eu-central-1"
  auto_accept = false

  tags = { Name = "primary-to-secondary-peering" }
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  count                     = var.create_vpcs ? 1 : 0
  provider                  = aws.eu_central_1
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary[0].id
  auto_accept               = true

  tags = { Name = "secondary-peering-accepter" }
}

# Peering routes
resource "aws_route" "primary_to_secondary" {
  count                     = var.create_vpcs ? 1 : 0
  route_table_id            = aws_route_table.primary_public[0].id
  destination_cidr_block    = aws_vpc.secondary[0].cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary[0].id
}

resource "aws_route" "secondary_to_primary" {
  count                     = var.create_vpcs ? 1 : 0
  provider                  = aws.eu_central_1
  route_table_id            = aws_route_table.secondary_public[0].id
  destination_cidr_block    = aws_vpc.primary[0].cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary[0].id
}

# Security Groups
resource "aws_security_group" "primary" {
  count       = var.create_vpcs ? 1 : 0
  name_prefix = "primary-sg"
  vpc_id      = aws_vpc.primary[0].id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "primary-security-group" }
}

resource "aws_security_group" "secondary" {
  count       = var.create_vpcs ? 1 : 0
  provider    = aws.eu_central_1
  name_prefix = "secondary-sg"
  vpc_id      = aws_vpc.secondary[0].id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "secondary-security-group" }
}
