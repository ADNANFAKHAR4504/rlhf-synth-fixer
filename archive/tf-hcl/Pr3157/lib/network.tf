resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.app_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_subnets" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = "us-east-1${count.index == 0 ? "a" : "b"}"
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.app_name}-public-subnet-${count.index}"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_subnets" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 2}.0/24"
  availability_zone = "us-east-1${count.index == 0 ? "a" : "b"}"

  tags = {
    Name        = "${var.app_name}-private-subnet-${count.index}"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.app_name}-igw"
    Environment = var.environment
  }
}

resource "aws_eip" "nat_eip" {
  count  = 1
  domain = "vpc"

  tags = {
    Name        = "${var.app_name}-nat-eip"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "nat_gw" {
  count         = 1
  allocation_id = aws_eip.nat_eip[count.index].id
  subnet_id     = aws_subnet.public_subnets[count.index].id

  tags = {
    Name        = "${var.app_name}-nat-gw"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name        = "${var.app_name}-public-route-table"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw[0].id
  }

  tags = {
    Name        = "${var.app_name}-private-route-table"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "lambda_sg" {
  name        = "${var.app_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-lambda-sg"
    Environment = var.environment
  }
}