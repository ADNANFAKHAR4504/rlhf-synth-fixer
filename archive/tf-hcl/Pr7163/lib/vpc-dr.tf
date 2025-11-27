# DR VPC
resource "aws_vpc" "dr" {
  provider             = aws.us-west-2
  cidr_block           = var.dr_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-vpc-${var.environment_suffix}"
    }
  )
}

# DR subnets
resource "aws_subnet" "dr_private_1" {
  provider          = aws.us-west-2
  vpc_id            = aws_vpc.dr.id
  cidr_block        = cidrsubnet(var.dr_vpc_cidr, 8, 1)
  availability_zone = data.aws_availability_zones.dr.names[0]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-private-1-${var.environment_suffix}"
    }
  )
}

resource "aws_subnet" "dr_private_2" {
  provider          = aws.us-west-2
  vpc_id            = aws_vpc.dr.id
  cidr_block        = cidrsubnet(var.dr_vpc_cidr, 8, 2)
  availability_zone = data.aws_availability_zones.dr.names[1]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-private-2-${var.environment_suffix}"
    }
  )
}

# DR DB subnet group
resource "aws_db_subnet_group" "dr" {
  provider   = aws.us-west-2
  name       = "rds-dr-subnet-group-${var.environment_suffix}"
  subnet_ids = [aws_subnet.dr_private_1.id, aws_subnet.dr_private_2.id]

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-subnet-group-${var.environment_suffix}"
    }
  )
}

# DR security group
resource "aws_security_group" "dr_db" {
  provider    = aws.us-west-2
  name        = "rds-dr-sg-${var.environment_suffix}"
  description = "Security group for DR RDS instance"
  vpc_id      = aws_vpc.dr.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.dr_vpc_cidr, var.primary_vpc_cidr]
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
      Name = "rds-dr-sg-${var.environment_suffix}"
    }
  )
}

# DR route table
resource "aws_route_table" "dr_private" {
  provider = aws.us-west-2
  vpc_id   = aws_vpc.dr.id

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-private-rt-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "dr_private_1" {
  provider       = aws.us-west-2
  subnet_id      = aws_subnet.dr_private_1.id
  route_table_id = aws_route_table.dr_private.id
}

resource "aws_route_table_association" "dr_private_2" {
  provider       = aws.us-west-2
  subnet_id      = aws_subnet.dr_private_2.id
  route_table_id = aws_route_table.dr_private.id
}
