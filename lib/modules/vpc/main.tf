# Reusable VPC module for consistent network deployment across regions

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

locals {
  # Generate consistent naming with environment suffix
  name_prefix = "${var.environment}-${var.region}-${var.environment_suffix}"

  # Calculate number of NAT Gateways
  nat_gateway_count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0

  # Create AZ to subnet mappings
  azs = slice(var.availability_zones, 0, min(length(var.availability_zones), 3))
}

# Main VPC resource
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-vpc"
    }
  )
}

# Internet Gateway for public subnet connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-igw"
    }
  )
}

# Public subnets - one per AZ
resource "aws_subnet" "public" {
  for_each = { for idx, az in local.azs : az => idx }

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[each.value]
  availability_zone       = each.key
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-public-subnet-${each.value + 1}"
      Type = "public"
      Tier = "public"
    }
  )
}

# Private subnets - one per AZ
resource "aws_subnet" "private" {
  for_each = { for idx, az in local.azs : az => idx }

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[each.value]
  availability_zone = each.key

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-private-subnet-${each.value + 1}"
      Type = "private"
      Tier = "private"
    }
  )
}

# Elastic IPs for NAT Gateways (only if enabled)
resource "aws_eip" "nat" {
  for_each = var.enable_nat_gateway ? { for idx in range(local.nat_gateway_count) : idx => local.azs[idx] } : {}

  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-nat-eip-${each.key + 1}"
    }
  )

  # Ensure proper cleanup order
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways for private subnet egress (only if enabled)
resource "aws_nat_gateway" "main" {
  for_each = var.enable_nat_gateway ? { for idx in range(local.nat_gateway_count) : idx => local.azs[idx] } : {}

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.value].id

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-nat-${each.key + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-public-rt"
      Type = "public"
    }
  )
}

# Route tables for private subnets
resource "aws_route_table" "private" {
  for_each = { for idx in range(length(local.azs)) : idx => local.azs[idx] }

  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-private-rt-${each.key + 1}"
      Type = "private"
    }
  )
}

# Public route to Internet Gateway
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Private routes to NAT Gateways (only if NAT is enabled)
resource "aws_route" "private_nat" {
  for_each = var.enable_nat_gateway ? { for idx in range(length(local.azs)) : idx => idx } : {}

  route_table_id         = aws_route_table.private[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[var.single_nat_gateway ? 0 : each.key].id
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with private route tables
resource "aws_route_table_association" "private" {
  for_each = { for idx in range(length(local.azs)) : idx => local.azs[idx] }

  subnet_id      = aws_subnet.private[each.value].id
  route_table_id = aws_route_table.private[each.key].id
}

# Default security group with restrictive rules
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id

  # Remove all rules from default security group
  ingress = []
  egress  = []

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-default-sg"
      Note = "Default SG with all rules removed"
    }
  )
}

# VPC Flow Logs (if enabled)
resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name              = "/aws/vpc/flowlogs/${local.name_prefix}"
  retention_in_days = 30

  tags = var.tags
}

resource "aws_iam_role" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${local.name_prefix}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${local.name_prefix}-vpc-flow-logs-policy"
  role = aws_iam_role.flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_logs[0].arn
  log_destination = aws_cloudwatch_log_group.flow_logs[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name = "${local.name_prefix}-flow-logs"
    }
  )
}