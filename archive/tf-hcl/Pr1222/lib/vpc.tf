# VPCs for different environments
resource "aws_vpc" "main" {
  for_each = toset(var.environments)

  cidr_block           = each.key == "dev" ? "10.1.0.0/16" : each.key == "test" ? "10.2.0.0/16" : "10.3.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-vpc"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "main" {
  for_each = aws_vpc.main

  vpc_id = each.value.id

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = {
    for combo in setproduct(var.environments, var.availability_zones) : "${combo[0]}-${combo[1]}" => {
      env = combo[0]
      az  = combo[1]
    }
  }

  vpc_id                  = aws_vpc.main[each.value.env].id
  cidr_block              = each.value.env == "dev" ? (each.value.az == "us-east-1a" ? "10.1.1.0/24" : "10.1.2.0/24") : each.value.env == "test" ? (each.value.az == "us-east-1a" ? "10.2.1.0/24" : "10.2.2.0/24") : (each.value.az == "us-east-1a" ? "10.3.1.0/24" : "10.3.2.0/24")
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  tags = merge(local.env_tags[each.value.env], {
    Name = "${local.project_prefix}-${each.value.env}-public-subnet-${substr(each.value.az, -1, 1)}"
    Type = "public"
  })
}

# Private Subnets for RDS
resource "aws_subnet" "private" {
  for_each = {
    for combo in setproduct(var.environments, var.availability_zones) : "${combo[0]}-${combo[1]}" => {
      env = combo[0]
      az  = combo[1]
    }
  }

  vpc_id            = aws_vpc.main[each.value.env].id
  cidr_block        = each.value.env == "dev" ? (each.value.az == "us-east-1a" ? "10.1.10.0/24" : "10.1.11.0/24") : each.value.env == "test" ? (each.value.az == "us-east-1a" ? "10.2.10.0/24" : "10.2.11.0/24") : (each.value.az == "us-east-1a" ? "10.3.10.0/24" : "10.3.11.0/24")
  availability_zone = each.value.az

  tags = merge(local.env_tags[each.value.env], {
    Name = "${local.project_prefix}-${each.value.env}-private-subnet-${substr(each.value.az, -1, 1)}"
    Type = "private"
  })
}

# Route Tables for Public Subnets
resource "aws_route_table" "public" {
  for_each = aws_vpc.main

  vpc_id = each.value.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[each.key].id
  }

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-public-rt"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public[split("-", each.key)[0]].id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  for_each = aws_vpc.main

  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = each.value.id

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-flow-log"
  })
}