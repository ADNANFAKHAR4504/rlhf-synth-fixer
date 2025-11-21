# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name              = "vpc-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Private subnets in primary region
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 8, count.index)
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name              = "subnet-primary-private-${count.index + 1}-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Internet Gateway for primary VPC
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name              = "igw-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Route table for primary VPC
resource "aws_route_table" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name              = "rt-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Route table associations
resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary.id
}

# Security group for primary RDS
resource "aws_security_group" "primary_rds" {
  provider    = aws.primary
  name        = "rds-primary-${var.environment_suffix}"
  description = "Security group for primary RDS instance"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary, var.vpc_cidr_dr]
    description = "PostgreSQL access from both regions"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name              = "sg-rds-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}
