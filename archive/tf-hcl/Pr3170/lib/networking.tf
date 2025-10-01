resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "${var.environment}-vpc"
    Project = "ProjectX"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "${var.environment}-igw"
    Project = "ProjectX"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name    = "${var.environment}-public-subnet"
    Type    = "Public"
    Project = "ProjectX"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name    = "${var.environment}-private-subnet"
    Type    = "Private"
    Project = "ProjectX"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_2_cidr
  availability_zone = data.aws_availability_zones.available.names[2]

  tags = {
    Name    = "${var.environment}-private-subnet-2"
    Type    = "Private"
    Project = "ProjectX"
  }
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name    = "${var.environment}-nat-eip"
    Project = "ProjectX"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name    = "${var.environment}-nat-gateway"
    Project = "ProjectX"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name    = "${var.environment}-public-rt"
    Project = "ProjectX"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name    = "${var.environment}-private-rt"
    Project = "ProjectX"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/${var.environment}-flow-logs"
  retention_in_days = 7

  tags = {
    Name    = "${var.environment}-flow-log-group"
    Project = "ProjectX"
  }
}

resource "aws_iam_role" "flow_log" {
  name = "${var.environment}-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "${var.environment}-flow-log-role"
    Project = "ProjectX"
  }
}

resource "aws_iam_policy" "flow_log" {
  name = "${var.environment}-flow-log-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name    = "${var.environment}-flow-log-policy"
    Project = "ProjectX"
  }
}

resource "aws_iam_role_policy_attachment" "flow_log" {
  role       = aws_iam_role.flow_log.name
  policy_arn = aws_iam_policy.flow_log.arn
}

resource "aws_flow_log" "main" {
  iam_role_arn             = aws_iam_role.flow_log.arn
  log_destination_type     = "cloud-watch-logs"
  log_destination          = aws_cloudwatch_log_group.flow_log.arn
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.main.id
  max_aggregation_interval = 60

  tags = {
    Name    = "${var.environment}-vpc-flow-logs"
    Project = "ProjectX"
  }
}


