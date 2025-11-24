# Primary VPC
resource "aws_vpc" "primary" {
  cidr_block           = var.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-vpc-${var.environment_suffix}"
    }
  )
}

# Primary subnets
resource "aws_subnet" "primary_private_1" {
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.primary_vpc_cidr, 8, 1)
  availability_zone = data.aws_availability_zones.primary.names[0]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-private-1-${var.environment_suffix}"
    }
  )
}

resource "aws_subnet" "primary_private_2" {
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.primary_vpc_cidr, 8, 2)
  availability_zone = data.aws_availability_zones.primary.names[1]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-private-2-${var.environment_suffix}"
    }
  )
}

# Primary DB subnet group
resource "aws_db_subnet_group" "primary" {
  name       = "rds-primary-subnet-group-${var.environment_suffix}"
  subnet_ids = [aws_subnet.primary_private_1.id, aws_subnet.primary_private_2.id]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-subnet-group-${var.environment_suffix}"
    }
  )
}

# Primary security group
resource "aws_security_group" "primary_db" {
  name        = "rds-primary-sg-${var.environment_suffix}"
  description = "Security group for primary RDS instance"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr, var.dr_vpc_cidr]
    description = "PostgreSQL access from VPCs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-sg-${var.environment_suffix}"
    }
  )
}

# Primary route table
resource "aws_route_table" "primary_private" {
  vpc_id = aws_vpc.primary.id

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-private-rt-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "primary_private_1" {
  subnet_id      = aws_subnet.primary_private_1.id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "primary_private_2" {
  subnet_id      = aws_subnet.primary_private_2.id
  route_table_id = aws_route_table.primary_private.id
}
