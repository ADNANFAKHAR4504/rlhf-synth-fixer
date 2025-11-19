# Hardcoded to us-east-1 as per requirements
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "region-name"
    values = ["us-east-1"]
  }
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name            = "main-vpc-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[0]

  tags = {
    Name            = "public-subnet-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name            = "private-subnet-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

# For RDS, we need at least two subnets in different AZs
resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[2]

  tags = {
    Name            = "private-subnet-2-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name            = "main-igw-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name            = "public-rt-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
