// Module: network
// Contains VPC, subnets, routing, NAT, IGW

locals {
  common_tags = var.common_tags
  public_subnets = {
    for i, az in var.azs : az => {
      cidr = cidrsubnet("10.0.0.0/16", 8, i)
      az   = az
    }
  }
  private_subnets = {
    for i, az in var.azs : az => {
      cidr = cidrsubnet("10.0.0.0/16", 8, i + 10)
      az   = az
    }
  }
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-igw" })
}

resource "aws_subnet" "public" {
  for_each                = local.public_subnets
  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-public-${each.key}" })
}

resource "aws_subnet" "private" {
  for_each          = local.private_subnets
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  tags              = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-private-${each.key}" })
}

resource "aws_eip" "nat" {
  for_each = local.public_subnets
  domain   = "vpc"
  tags     = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-nat-eip-${each.key}" })
}

resource "aws_nat_gateway" "main" {
  for_each      = local.public_subnets
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id
  tags          = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-nat-${each.key}" })
  depends_on    = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-public-rt" })
}

resource "aws_route_table" "private" {
  for_each = local.private_subnets
  vpc_id   = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[each.key].id
  }
  tags = merge(local.common_tags, { Name = "${var.project_name}-${var.environment_suffix}-private-rt-${each.key}" })
}

resource "aws_route_table_association" "public" {
  for_each       = local.public_subnets
  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  for_each       = local.private_subnets
  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private[each.key].id
}
