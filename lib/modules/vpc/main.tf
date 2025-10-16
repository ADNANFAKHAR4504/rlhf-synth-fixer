# modules/vpc/main.tf - VPC Module Main Configuration

# ============================================================================
# VPC
# ============================================================================

resource "aws_vpc" "this" {
  cidr_block                           = var.vpc_cidr
  enable_dns_hostnames                 = var.enable_dns_hostnames
  enable_dns_support                   = var.enable_dns_support
  enable_network_address_usage_metrics = var.enable_network_address_usage_metrics

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-${var.suffix}"
    VPC  = var.vpc_name
  })
}

# ============================================================================
# SUBNETS
# ============================================================================

resource "aws_subnet" "public" {
  count                   = length(var.public_subnets)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-public-${count.index + 1}-${var.suffix}"
    VPC  = var.vpc_name
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnets)
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-private-${count.index + 1}-${var.suffix}"
    VPC  = var.vpc_name
    Type = "Private"
  })
}

# ============================================================================
# INTERNET GATEWAY
# ============================================================================

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-igw-${var.suffix}"
    VPC  = var.vpc_name
  })
}

# ============================================================================
# ELASTIC IPS FOR NAT GATEWAYS
# ============================================================================

resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-nat-eip-${count.index + 1}-${var.suffix}"
    VPC  = var.vpc_name
  })

  depends_on = [aws_internet_gateway.this]
}

# ============================================================================
# NAT GATEWAYS
# ============================================================================

resource "aws_nat_gateway" "this" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-nat-${count.index + 1}-${var.suffix}"
    VPC  = var.vpc_name
  })

  depends_on = [aws_internet_gateway.this]
}

# ============================================================================
# ROUTE TABLES
# ============================================================================

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-public-rt-${var.suffix}"
    VPC  = var.vpc_name
    Type = "Public"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ for HA)
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.this.id

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-private-rt-${count.index + 1}-${var.suffix}"
    VPC  = var.vpc_name
    Type = "Private"
  })
}

resource "aws_route" "private_nat" {
  count                  = length(aws_route_table.private)
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[count.index].id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ============================================================================
# VPC FLOW LOGS
# ============================================================================

resource "aws_cloudwatch_log_group" "flow_logs" {
  count             = var.enable_flow_logs ? 1 : 0
  name              = "/aws/vpc/flowlogs/${var.vpc_name}-${var.suffix}"
  retention_in_days = var.flow_logs_retention_days
  kms_key_id        = "alias/aws/logs"

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-flow-logs-${var.suffix}"
    VPC  = var.vpc_name
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_flow_log" "this" {
  count                = var.enable_flow_logs ? 1 : 0
  vpc_id               = aws_vpc.this.id
  traffic_type         = "ALL"
  iam_role_arn         = var.flow_logs_role_arn
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.flow_logs[0].arn

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-flow-log-${var.suffix}"
    VPC  = var.vpc_name
  })
}

# ============================================================================
# VPC ENDPOINTS (for AWS services)
# ============================================================================

# S3 VPC Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.this.id
  service_name = "com.amazonaws.${data.aws_region.current.id}.s3"

  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-s3-endpoint-${var.suffix}"
    VPC  = var.vpc_name
  })
}

# DynamoDB VPC Endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.this.id
  service_name = "com.amazonaws.${data.aws_region.current.id}.dynamodb"

  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(var.common_tags, {
    Name = "${var.vpc_name}-dynamodb-endpoint-${var.suffix}"
    VPC  = var.vpc_name
  })
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_region" "current" {}