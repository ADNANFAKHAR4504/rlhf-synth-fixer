resource "aws_vpc" "main" {
  cidr_block           = local.config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "igw-${terraform.workspace}-${var.environment_suffix}"
  })
}

# Two public subnets in different AZs (required for ALB)
resource "aws_subnet" "public" {
  count                   = length(local.config.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.config.public_subnet_cidrs[count.index]
  availability_zone       = local.config.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "public-subnet-${count.index}-${terraform.workspace}-${var.environment_suffix}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = length(local.config.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.config.private_subnet_cidrs[count.index]
  availability_zone = local.config.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "private-subnet-${count.index}-${terraform.workspace}-${var.environment_suffix}"
    Type = "Private"
  })
}

# NAT Gateway for private subnet internet access
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "nat-eip-${terraform.workspace}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, {
    Name = "nat-gateway-${terraform.workspace}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "public-rt-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "private-rt-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flowlogs-${terraform.workspace}-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "vpc-flowlogs-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_iam_role" "flow_logs" {
  name_prefix = "vpc-flowlogs-role-${terraform.workspace}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = merge(local.common_tags, {
    Name = "vpc-flowlogs-role-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  name_prefix = "vpc-flowlogs-policy-"
  role        = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "vpc-flowlog-${terraform.workspace}-${var.environment_suffix}"
  })
}
