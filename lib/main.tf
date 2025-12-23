# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "vpc-payment-${var.environment_suffix}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "igw-payment-${var.environment_suffix}"
    }
  )
}

# Public Subnets (DMZ Tier)
resource "aws_subnet" "public" {
  count = var.az_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "subnet-public-${count.index + 1}-${var.environment_suffix}"
      Tier = "public"
      Type = "dmz"
    }
  )
}

# Private Subnets (Application Tier)
resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    var.common_tags,
    {
      Name = "subnet-private-${count.index + 1}-${var.environment_suffix}"
      Tier = "private"
      Type = "application"
    }
  )
}

# Isolated Subnets (Data Tier - Payment Processing)
resource "aws_subnet" "isolated" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + (var.az_count * 2))
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    var.common_tags,
    {
      Name       = "subnet-isolated-${count.index + 1}-${var.environment_suffix}"
      Tier       = "isolated"
      Type       = "data"
      Compliance = "PCI-DSS"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.az_count

  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name = "eip-nat-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per AZ for HA)
resource "aws_nat_gateway" "main" {
  count = var.az_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.common_tags,
    {
      Name = "nat-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "rt-public-${var.environment_suffix}"
    }
  )
}

# Public Route to Internet Gateway
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Private Route Tables (one per AZ)
resource "aws_route_table" "private" {
  count = var.az_count

  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "rt-private-${count.index + 1}-${var.environment_suffix}"
    }
  )
}

# Private Routes to NAT Gateways
resource "aws_route" "private_nat" {
  count = var.az_count

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

# Isolated Route Tables (one per AZ - no internet access)
resource "aws_route_table" "isolated" {
  count = var.az_count

  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name       = "rt-isolated-${count.index + 1}-${var.environment_suffix}"
      Compliance = "PCI-DSS"
    }
  )
}

# Route Table Associations - Public Subnets
resource "aws_route_table_association" "public" {
  count = var.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private Subnets
resource "aws_route_table_association" "private" {
  count = var.az_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route Table Associations - Isolated Subnets
resource "aws_route_table_association" "isolated" {
  count = var.az_count

  subnet_id      = aws_subnet.isolated[count.index].id
  route_table_id = aws_route_table.isolated[count.index].id
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}"
  retention_in_days = var.flow_log_retention_days

  tags = merge(
    var.common_tags,
    {
      Name = "log-group-vpc-flow-${var.environment_suffix}"
    }
  )
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "role-vpc-flow-logs-${var.environment_suffix}"

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

  tags = merge(
    var.common_tags,
    {
      Name = "role-vpc-flow-logs-${var.environment_suffix}"
    }
  )
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "policy-vpc-flow-logs-${var.environment_suffix}"
  role = aws_iam_role.vpc_flow_logs.id

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

# VPC Flow Logs
resource "aws_flow_log" "main" {
  log_destination_type     = "cloud-watch-logs"
  log_destination          = aws_cloudwatch_log_group.vpc_flow_logs.arn
  iam_role_arn             = aws_iam_role.vpc_flow_logs.arn
  vpc_id                   = aws_vpc.main.id
  traffic_type             = "ALL"
  max_aggregation_interval = 60

  tags = merge(
    var.common_tags,
    {
      Name = "flow-log-vpc-${var.environment_suffix}"
    }
  )
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
