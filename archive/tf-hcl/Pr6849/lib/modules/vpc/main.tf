resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "dr-payment-vpc-${var.region_name}-${var.environment_suffix}"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "dr-payment-private-subnet-${var.region_name}-${count.index + 1}-${var.environment_suffix}"
  }
}

resource "aws_security_group" "lambda" {
  name_prefix = "dr-payment-lambda-${var.region_name}-${var.environment_suffix}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Lambda functions in ${var.region_name} region"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "dr-payment-lambda-sg-${var.region_name}-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "aurora" {
  name_prefix = "dr-payment-aurora-${var.region_name}-${var.environment_suffix}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Aurora database in ${var.region_name} region"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Allow PostgreSQL from Lambda"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "dr-payment-aurora-sg-${var.region_name}-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
