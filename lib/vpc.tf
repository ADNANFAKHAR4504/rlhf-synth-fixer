# Primary VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-${var.aws_region}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw-${var.aws_region}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-${var.environment}-public-subnet-${count.index + 1}-${var.aws_region}"
    Type = "Public"
  }
}

# Private Subnets for EC2
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-${var.environment}-private-subnet-${count.index + 1}-${var.aws_region}"
    Type = "Private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 6)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-${count.index + 1}-${var.aws_region}"
    Type = "Database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}-${var.aws_region}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_eip.nat]

  tags = {
    Name = "${var.project_name}-${var.environment}-nat-${count.index + 1}-${var.aws_region}"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public-rt-${var.aws_region}"
  }
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}-${var.aws_region}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count          = 3
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs/${var.project_name}-${var.environment}-${var.aws_region}-${formatdate("YYYYMMDD-hhmm", timestamp())}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-flow-logs-${var.aws_region}"
  }
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-flow-logs-${var.aws_region}"
  }
}

# Peer VPC in different account
resource "aws_vpc" "peer" {
  provider = aws.peer

  cidr_block           = var.peer_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-peer-vpc-${var.peer_region}"
  }
}

# Peer VPC Internet Gateway
resource "aws_internet_gateway" "peer" {
  provider = aws.peer
  vpc_id   = aws_vpc.peer.id

  tags = {
    Name = "${var.project_name}-${var.environment}-peer-igw-${var.peer_region}"
  }
}

# Peer VPC Subnets
resource "aws_subnet" "peer" {
  provider                = aws.peer
  count                   = 3
  vpc_id                  = aws_vpc.peer.id
  cidr_block              = cidrsubnet(var.peer_vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.peer.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-${var.environment}-peer-subnet-${count.index + 1}-${var.peer_region}"
    Type = "Public"
  }
}

# Peer VPC Route Table
resource "aws_route_table" "peer" {
  provider = aws.peer
  vpc_id   = aws_vpc.peer.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.peer.id
  }

  route {
    cidr_block                = var.vpc_cidr
    vpc_peering_connection_id = aws_vpc_peering_connection.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-peer-rt-${var.peer_region}"
  }
}

# Peer VPC Route Table Associations
resource "aws_route_table_association" "peer" {
  provider       = aws.peer
  count          = 3
  subnet_id      = aws_subnet.peer[count.index].id
  route_table_id = aws_route_table.peer.id
}

# VPC Peering Connection
resource "aws_vpc_peering_connection" "main" {
  vpc_id      = aws_vpc.main.id
  peer_vpc_id = aws_vpc.peer.id
  peer_region = var.peer_region
  auto_accept = false

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-peering-${var.aws_region}-to-${var.peer_region}"
  }
}

# Accept peering connection in peer account
resource "aws_vpc_peering_connection_accepter" "peer" {
  provider                  = aws.peer
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
  auto_accept               = true

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc-peering-accepter-${var.peer_region}"
  }
}

# Routes for VPC peering
resource "aws_route" "main_to_peer" {
  count                     = 3
  route_table_id            = aws_route_table.private[count.index].id
  destination_cidr_block    = var.peer_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.main.id
}


# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_availability_zones" "peer" {
  provider = aws.peer
  state    = "available"
}
