locals {
  east_az_map = {
    for idx, az in local.regions["east"].availability_zones :
    az => idx
  }

  west_az_map = {
    for idx, az in local.regions["west"].availability_zones :
    az => idx
  }
}

# ---------------------------
# Primary region (us-east-1)
# ---------------------------

resource "aws_vpc" "east" {
  cidr_block           = var.east_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-east-vpc-${var.environment_suffix}"
    }
  )
}

resource "aws_internet_gateway" "east" {
  vpc_id = aws_vpc.east.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-east-igw-${var.environment_suffix}"
    }
  )
}

resource "aws_subnet" "east_public" {
  for_each = local.east_az_map

  vpc_id                  = aws_vpc.east.id
  cidr_block              = cidrsubnet(var.east_vpc_cidr, 4, each.value)
  availability_zone       = each.key
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-east-public-${each.key}-${var.environment_suffix}"
      Type = "public"
    }
  )
}

resource "aws_subnet" "east_private" {
  for_each = local.east_az_map

  vpc_id                  = aws_vpc.east.id
  cidr_block              = cidrsubnet(var.east_vpc_cidr, 4, each.value + 8)
  availability_zone       = each.key
  map_public_ip_on_launch = false

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-east-private-${each.key}-${var.environment_suffix}"
      Type = "private"
    }
  )
}

resource "aws_route_table" "east_public" {
  vpc_id = aws_vpc.east.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.east.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-east-public-rt-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "east_public" {
  for_each       = aws_subnet.east_public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.east_public.id
}

resource "aws_route_table" "east_private" {
  vpc_id = aws_vpc.east.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-east-private-rt-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "east_private" {
  for_each       = aws_subnet.east_private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.east_private.id
}

# ---------------------------
# Secondary region (us-west-2)
# ---------------------------

resource "aws_vpc" "west" {
  provider             = aws.west
  cidr_block           = var.west_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-west-vpc-${var.environment_suffix}"
    }
  )
}

resource "aws_internet_gateway" "west" {
  provider = aws.west
  vpc_id   = aws_vpc.west.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-west-igw-${var.environment_suffix}"
    }
  )
}

resource "aws_subnet" "west_public" {
  provider = aws.west
  for_each = local.west_az_map

  vpc_id                  = aws_vpc.west.id
  cidr_block              = cidrsubnet(var.west_vpc_cidr, 4, each.value)
  availability_zone       = each.key
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-west-public-${each.key}-${var.environment_suffix}"
      Type = "public"
    }
  )
}

resource "aws_subnet" "west_private" {
  provider = aws.west
  for_each = local.west_az_map

  vpc_id                  = aws_vpc.west.id
  cidr_block              = cidrsubnet(var.west_vpc_cidr, 4, each.value + 8)
  availability_zone       = each.key
  map_public_ip_on_launch = false

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-west-private-${each.key}-${var.environment_suffix}"
      Type = "private"
    }
  )
}

resource "aws_route_table" "west_public" {
  provider = aws.west
  vpc_id   = aws_vpc.west.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.west.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-west-public-rt-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "west_public" {
  provider       = aws.west
  for_each       = aws_subnet.west_public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.west_public.id
}

resource "aws_route_table" "west_private" {
  provider = aws.west
  vpc_id   = aws_vpc.west.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment}-west-private-rt-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "west_private" {
  provider       = aws.west
  for_each       = aws_subnet.west_private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.west_private.id
}

