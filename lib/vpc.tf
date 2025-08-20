########################
# VPC and Networking (Primary and Secondary Regions)
########################

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

# Primary VPC
resource "aws_vpc" "primary" {
  provider              = aws.primary
  cidr_block            = var.vpc_cidr_primary
  enable_dns_hostnames  = true
  enable_dns_support    = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-primary"
  }
}

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider              = aws.secondary
  cidr_block            = var.vpc_cidr_secondary
  enable_dns_hostnames  = true
  enable_dns_support    = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-secondary"
  }
}

# Private Subnets for Primary Region
resource "aws_subnet" "private_primary_1" {
  provider            = aws.primary
  vpc_id              = aws_vpc.primary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_primary, 4, 1)
  availability_zone   = "us-east-1a"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-primary-1"
  }
}

resource "aws_subnet" "private_primary_2" {
  provider            = aws.primary
  vpc_id              = aws_vpc.primary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_primary, 4, 2)
  availability_zone   = "us-east-1b"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-primary-2"
  }
}

# Private Subnets for Secondary Region
resource "aws_subnet" "private_secondary_1" {
  provider            = aws.secondary
  vpc_id              = aws_vpc.secondary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_secondary, 4, 1)
  availability_zone   = "us-west-2a"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-secondary-1"
  }
}

resource "aws_subnet" "private_secondary_2" {
  provider            = aws.secondary
  vpc_id              = aws_vpc.secondary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_secondary, 4, 2)
  availability_zone   = "us-west-2b"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-subnet-secondary-2"
  }
}

# Outputs for VPC IDs
output "vpc_id_primary" {
  value = aws_vpc.primary.id
}

output "vpc_id_secondary" {
  value = aws_vpc.secondary.id
}
########################
# VPC Flow Logs (Primary and Secondary Regions)
########################

resource "aws_cloudwatch_log_group" "vpc_flow_logs_primary" {
  provider = aws.primary
  name     = "/aws/vpc/flowlogs/primary-${random_id.log_suffix.hex}"
  retention_in_days = 30
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-flowlogs-primary"
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_secondary" {
  provider = aws.secondary
  name     = "/aws/vpc/flowlogs/secondary-${random_id.log_suffix.hex}"
  retention_in_days = 30
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-flowlogs-secondary"
  }
}

resource "aws_flow_log" "primary" {
  provider             = aws.primary
  vpc_id               = aws_vpc.primary.id
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs_primary.arn
  iam_role_arn         = aws_iam_role.vpc_flow_log.arn
  traffic_type         = "ALL"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-flowlog-primary"
  }
}

resource "aws_flow_log" "secondary" {
  provider             = aws.secondary
  vpc_id               = aws_vpc.secondary.id
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs_secondary.arn
  iam_role_arn         = aws_iam_role.vpc_flow_log.arn
  traffic_type         = "ALL"
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-flowlog-secondary"
  }
}

########################
# Route Tables, Associations, and NAT Gateways (Primary and Secondary Regions)
########################

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat_primary" {
  provider = aws.primary
  tags = {
    Name = "${var.name_prefix}-${var.environment}-nat-eip-primary"
  }
}

resource "aws_eip" "nat_secondary" {
  provider = aws.secondary
  tags = {
    Name = "${var.name_prefix}-${var.environment}-nat-eip-secondary"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  allocation_id = aws_eip.nat_primary.id
  subnet_id     = aws_subnet.public_primary_1.id
  tags = {
    Name = "${var.name_prefix}-${var.environment}-nat-gateway-primary"
  }
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  allocation_id = aws_eip.nat_secondary.id
  subnet_id     = aws_subnet.public_secondary_1.id
  tags = {
    Name = "${var.name_prefix}-${var.environment}-nat-gateway-secondary"
  }
}

# Public Route Tables
resource "aws_route_table" "public_primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  tags = {
    Name = "${var.name_prefix}-${var.environment}-public-rt-primary"
  }
}

resource "aws_route_table" "public_secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  tags = {
    Name = "${var.name_prefix}-${var.environment}-public-rt-secondary"
  }
}

# Public Route Table Routes
resource "aws_route" "public_primary_igw" {
  provider               = aws.primary
  route_table_id         = aws_route_table.public_primary.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.primary.id
}

resource "aws_route" "public_secondary_igw" {
  provider               = aws.secondary
  route_table_id         = aws_route_table.public_secondary.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.secondary.id
}

# Public Route Table Associations
resource "aws_route_table_association" "public_primary_1" {
  provider       = aws.primary
  subnet_id      = aws_subnet.public_primary_1.id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "public_primary_2" {
  provider       = aws.primary
  subnet_id      = aws_subnet.public_primary_2.id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "public_secondary_1" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.public_secondary_1.id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "public_secondary_2" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.public_secondary_2.id
  route_table_id = aws_route_table.public_secondary.id
}

# Private Route Tables
resource "aws_route_table" "private_primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-rt-primary"
  }
}

resource "aws_route_table" "private_secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  tags = {
    Name = "${var.name_prefix}-${var.environment}-private-rt-secondary"
  }
}

# Private Route Table Routes (NAT Gateway)
resource "aws_route" "private_primary_nat" {
  provider               = aws.primary
  route_table_id         = aws_route_table.private_primary.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.primary.id
}

resource "aws_route" "private_secondary_nat" {
  provider               = aws.secondary
  route_table_id         = aws_route_table.private_secondary.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.secondary.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private_primary_1" {
  provider       = aws.primary
  subnet_id      = aws_subnet.private_primary_1.id
  route_table_id = aws_route_table.private_primary.id
}

resource "aws_route_table_association" "private_primary_2" {
  provider       = aws.primary
  subnet_id      = aws_subnet.private_primary_2.id
  route_table_id = aws_route_table.private_primary.id
}

resource "aws_route_table_association" "private_secondary_1" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.private_secondary_1.id
  route_table_id = aws_route_table.private_secondary.id
}

resource "aws_route_table_association" "private_secondary_2" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.private_secondary_2.id
  route_table_id = aws_route_table.private_secondary.id
}
########################
# Public Subnets & Internet Gateways (Primary and Secondary Regions)
########################

# Internet Gateway for Primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  tags = {
    Name = "${var.name_prefix}-${var.environment}-igw-primary"
  }
}

# Internet Gateway for Secondary VPC
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  tags = {
    Name = "${var.name_prefix}-${var.environment}-igw-secondary"
  }
}

# Public Subnets for Primary Region
resource "aws_subnet" "public_primary_1" {
  provider            = aws.primary
  vpc_id              = aws_vpc.primary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_primary, 4, 3)
  availability_zone   = "us-east-1a"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-public-subnet-primary-1"
  }
}

resource "aws_subnet" "public_primary_2" {
  provider            = aws.primary
  vpc_id              = aws_vpc.primary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_primary, 4, 4)
  availability_zone   = "us-east-1b"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-public-subnet-primary-2"
  }
}

# Public Subnets for Secondary Region
resource "aws_subnet" "public_secondary_1" {
  provider            = aws.secondary
  vpc_id              = aws_vpc.secondary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_secondary, 4, 3)
  availability_zone   = "us-west-2a"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-public-subnet-secondary-1"
  }
}

resource "aws_subnet" "public_secondary_2" {
  provider            = aws.secondary
  vpc_id              = aws_vpc.secondary.id
  cidr_block          = cidrsubnet(var.vpc_cidr_secondary, 4, 4)
  availability_zone   = "us-west-2b"
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-public-subnet-secondary-2"
  }
}
