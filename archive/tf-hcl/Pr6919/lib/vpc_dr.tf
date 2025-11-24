# DR VPC
resource "aws_vpc" "dr" {
  provider             = aws.dr
  cidr_block           = var.vpc_cidr_dr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name              = "vpc-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Private subnets in DR region
resource "aws_subnet" "dr_private" {
  provider          = aws.dr
  count             = 3
  vpc_id            = aws_vpc.dr.id
  cidr_block        = cidrsubnet(var.vpc_cidr_dr, 8, count.index)
  availability_zone = data.aws_availability_zones.dr.names[count.index]

  tags = {
    Name              = "subnet-dr-private-${count.index + 1}-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Internet Gateway for DR VPC
resource "aws_internet_gateway" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = {
    Name              = "igw-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Route table for DR VPC
resource "aws_route_table" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = {
    Name              = "rt-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Route table associations
resource "aws_route_table_association" "dr_private" {
  provider       = aws.dr
  count          = 3
  subnet_id      = aws_subnet.dr_private[count.index].id
  route_table_id = aws_route_table.dr.id
}

# Security group for DR RDS
resource "aws_security_group" "dr_rds" {
  provider    = aws.dr
  name        = "rds-dr-${var.environment_suffix}"
  description = "Security group for DR RDS instance"
  vpc_id      = aws_vpc.dr.id

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
    Name              = "rds-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}
