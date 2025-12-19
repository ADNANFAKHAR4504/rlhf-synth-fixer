data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-vpc"
    }
  )
}

resource "aws_subnet" "private" {
  count             = min(length(data.aws_availability_zones.available.names), 3)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-private-${data.aws_availability_zones.available.zone_ids[count.index]}"
      Type = "private"
    }
  )
}

resource "aws_subnet" "public" {
  count                   = min(length(data.aws_availability_zones.available.names), 3)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index + 10)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-public-${data.aws_availability_zones.available.zone_ids[count.index]}"
      Type = "public"
    }
  )
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-igw"
    }
  )
}

resource "aws_eip" "nat" {
  count  = var.enable_multi_az ? length(aws_subnet.public) : 1
  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-nat-eip-${count.index}"
    }
  )
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_multi_az ? length(aws_subnet.public) : 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-nat-${count.index}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  count  = var.enable_multi_az ? length(aws_subnet.private) : 1
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[var.enable_multi_az ? count.index : 0].id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-private-rt-${count.index}"
    }
  )
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.enable_multi_az ? count.index : 0].id
}

resource "aws_security_group" "lambda" {
  name_prefix = "${var.name_prefix}-lambda-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-lambda-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "elasticache" {
  name_prefix = "${var.name_prefix}-elasticache-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-elasticache-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "opensearch" {
  name_prefix = "${var.name_prefix}-opensearch-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-opensearch-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}
