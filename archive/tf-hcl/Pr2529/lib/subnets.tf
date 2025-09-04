# VPC 1 Subnets
resource "aws_subnet" "vpc1_public" {
  vpc_id                  = aws_vpc.vpc1.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "vpc1-public-subnet"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc1_private" {
  vpc_id            = aws_vpc.vpc1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(var.common_tags, {
    Name = "vpc1-private-subnet"
    Type = "Private"
  })
}

resource "aws_subnet" "vpc1_private2" {
  vpc_id            = aws_vpc.vpc1.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[2]

  tags = merge(var.common_tags, {
    Name = "vpc1-private-subnet-2"
    Type = "Private"
  })
}

resource "aws_subnet" "vpc1_private_db" {
  vpc_id                  = aws_vpc.vpc1.id
  cidr_block              = "10.0.4.0/24"
  availability_zone       = data.aws_availability_zones.available.names[3]
  map_public_ip_on_launch = false

  tags = merge(var.common_tags, {
    Name = "vpc1-private-db-subnet"
    Type = "Private"
  })
}

# VPC 2 Subnets
resource "aws_subnet" "vpc2_public" {
  vpc_id                  = aws_vpc.vpc2.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "vpc2-public-subnet"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc2_private" {
  vpc_id            = aws_vpc.vpc2.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(var.common_tags, {
    Name = "vpc2-private-subnet"
    Type = "Private"
  })
}

# RDS Subnet Group (only in VPC 1)
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "rds-subnet-group"
  subnet_ids = [aws_subnet.vpc1_private.id, aws_subnet.vpc1_private_db.id]

  tags = merge(var.common_tags, {
    Name = "rds-subnet-group"
  })
}