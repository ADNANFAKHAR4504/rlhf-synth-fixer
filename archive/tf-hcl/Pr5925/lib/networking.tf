# Primary Region VPC
resource "aws_vpc" "primary" {
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "payment-vpc-primary-${var.environment_suffix}"
  }
}

# Primary Region Private Subnets
resource "aws_subnet" "primary_private" {
  count             = var.availability_zones_count
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 4, count.index)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name = "payment-private-subnet-primary-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Primary Region Public Subnets
resource "aws_subnet" "primary_public" {
  count                   = var.availability_zones_count
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 4, count.index + 10)
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "payment-public-subnet-primary-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Primary Region Internet Gateway
resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id

  tags = {
    Name = "payment-igw-primary-${var.environment_suffix}"
  }
}

# Primary Region NAT Gateway
resource "aws_eip" "primary_nat" {
  domain = "vpc"

  tags = {
    Name = "payment-nat-eip-primary-${var.environment_suffix}"
  }
}

resource "aws_nat_gateway" "primary" {
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public[0].id

  tags = {
    Name = "payment-nat-primary-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.primary]
}

# Primary Region Route Tables
resource "aws_route_table" "primary_public" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name = "payment-public-rt-primary-${var.environment_suffix}"
  }
}

resource "aws_route_table" "primary_private" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }

  tags = {
    Name = "payment-private-rt-primary-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "primary_public" {
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

# DR Region VPC
resource "aws_vpc" "dr" {
  provider             = aws.dr
  cidr_block           = var.vpc_cidr_dr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "payment-vpc-dr-${var.environment_suffix}"
  }
}

# DR Region Private Subnets
resource "aws_subnet" "dr_private" {
  provider          = aws.dr
  count             = var.availability_zones_count
  vpc_id            = aws_vpc.dr.id
  cidr_block        = cidrsubnet(var.vpc_cidr_dr, 4, count.index)
  availability_zone = data.aws_availability_zones.dr.names[count.index]

  tags = {
    Name = "payment-private-subnet-dr-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# DR Region Public Subnets
resource "aws_subnet" "dr_public" {
  provider                = aws.dr
  count                   = var.availability_zones_count
  vpc_id                  = aws_vpc.dr.id
  cidr_block              = cidrsubnet(var.vpc_cidr_dr, 4, count.index + 10)
  availability_zone       = data.aws_availability_zones.dr.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "payment-public-subnet-dr-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# DR Region Internet Gateway
resource "aws_internet_gateway" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = {
    Name = "payment-igw-dr-${var.environment_suffix}"
  }
}

# DR Region NAT Gateway
resource "aws_eip" "dr_nat" {
  provider = aws.dr
  domain   = "vpc"

  tags = {
    Name = "payment-nat-eip-dr-${var.environment_suffix}"
  }
}

resource "aws_nat_gateway" "dr" {
  provider      = aws.dr
  allocation_id = aws_eip.dr_nat.id
  subnet_id     = aws_subnet.dr_public[0].id

  tags = {
    Name = "payment-nat-dr-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.dr]
}

# DR Region Route Tables
resource "aws_route_table" "dr_public" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dr.id
  }

  tags = {
    Name = "payment-public-rt-dr-${var.environment_suffix}"
  }
}

resource "aws_route_table" "dr_private" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dr.id
  }

  tags = {
    Name = "payment-private-rt-dr-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "dr_public" {
  provider       = aws.dr
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.dr_public[count.index].id
  route_table_id = aws_route_table.dr_public.id
}

resource "aws_route_table_association" "dr_private" {
  provider       = aws.dr
  count          = var.availability_zones_count
  subnet_id      = aws_subnet.dr_private[count.index].id
  route_table_id = aws_route_table.dr_private.id
}

# Security Groups
resource "aws_security_group" "aurora_primary" {
  name        = "aurora-sg-primary-${var.environment_suffix}"
  description = "Security group for Aurora primary cluster"
  vpc_id      = aws_vpc.primary.id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "aurora-sg-primary-${var.environment_suffix}"
  }
}

resource "aws_security_group" "aurora_dr" {
  provider    = aws.dr
  name        = "aurora-sg-dr-${var.environment_suffix}"
  description = "Security group for Aurora DR cluster"
  vpc_id      = aws_vpc.dr.id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_dr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "aurora-sg-dr-${var.environment_suffix}"
  }
}

resource "aws_security_group" "lambda_primary" {
  name        = "lambda-sg-primary-${var.environment_suffix}"
  description = "Security group for Lambda functions in primary region"
  vpc_id      = aws_vpc.primary.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-sg-primary-${var.environment_suffix}"
  }
}

resource "aws_security_group" "lambda_dr" {
  provider    = aws.dr
  name        = "lambda-sg-dr-${var.environment_suffix}"
  description = "Security group for Lambda functions in DR region"
  vpc_id      = aws_vpc.dr.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-sg-dr-${var.environment_suffix}"
  }
}