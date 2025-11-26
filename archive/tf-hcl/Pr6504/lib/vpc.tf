locals {
  use_existing_vpc = var.existing_vpc_id != ""
  az_map           = { for idx, az in var.availability_zones : az => idx }
}

resource "aws_vpc" "eks" {
  count                = local.use_existing_vpc ? 0 : 1
  cidr_block           = "10.30.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}${local.resource_suffix}-vpc"
  })
}

resource "aws_internet_gateway" "eks" {
  count  = local.use_existing_vpc ? 0 : 1
  vpc_id = aws_vpc.eks[0].id

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}${local.resource_suffix}-igw"
  })
}

resource "aws_subnet" "public" {
  for_each = local.use_existing_vpc ? {} : local.az_map

  vpc_id                  = aws_vpc.eks[0].id
  cidr_block              = cidrsubnet("10.30.0.0/16", 4, each.value)
  availability_zone       = each.key
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                                          = "${local.cluster_name}${local.resource_suffix}-public-${each.key}"
    "kubernetes.io/role/elb"                      = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  })
}

resource "aws_subnet" "private" {
  for_each = local.use_existing_vpc ? {} : local.az_map

  vpc_id            = aws_vpc.eks[0].id
  cidr_block        = cidrsubnet("10.30.0.0/16", 4, each.value + 8)
  availability_zone = each.key

  tags = merge(local.common_tags, {
    Name                                          = "${local.cluster_name}${local.resource_suffix}-private-${each.key}"
    "kubernetes.io/role/internal-elb"             = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  })
}

resource "aws_eip" "nat" {
  for_each = local.use_existing_vpc ? {} : local.az_map

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}${local.resource_suffix}-nat-eip-${each.key}"
  })
}

resource "aws_nat_gateway" "eks" {
  for_each = local.use_existing_vpc ? {} : local.az_map

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}${local.resource_suffix}-nat-${each.key}"
  })

  depends_on = [aws_internet_gateway.eks]
}

resource "aws_route_table" "public" {
  count  = local.use_existing_vpc ? 0 : 1
  vpc_id = aws_vpc.eks[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eks[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}${local.resource_suffix}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  for_each = local.use_existing_vpc ? {} : local.az_map

  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table" "private" {
  for_each = local.use_existing_vpc ? {} : local.az_map

  vpc_id = aws_vpc.eks[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.eks[each.key].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}${local.resource_suffix}-private-rt-${each.key}"
  })
}

resource "aws_route_table_association" "private" {
  for_each = local.use_existing_vpc ? {} : local.az_map

  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private[each.key].id
}

locals {
  created_vpc_id             = local.use_existing_vpc ? null : aws_vpc.eks[0].id
  created_private_subnet_ids = local.use_existing_vpc ? [] : [for s in values(aws_subnet.private) : s.id]
  created_public_subnet_ids  = local.use_existing_vpc ? [] : [for s in values(aws_subnet.public) : s.id]
  base_vpc_id                = local.use_existing_vpc ? var.existing_vpc_id : local.created_vpc_id
  private_subnet_ids         = local.use_existing_vpc ? var.existing_private_subnet_ids : local.created_private_subnet_ids
  public_subnet_ids          = local.use_existing_vpc ? var.existing_public_subnet_ids : local.created_public_subnet_ids
}

resource "aws_ssm_parameter" "vpc_id" {
  count = var.vpc_id_parameter_name != "" && var.manage_vpc_ssm_parameter ? 1 : 0

  name        = "${var.vpc_id_parameter_name}${local.resource_suffix}"
  description = "VPC ID for the payments EKS environment"
  type        = "String"
  value       = local.base_vpc_id
  overwrite   = true

  tags = local.common_tags
}

data "aws_ssm_parameter" "vpc_id" {
  count = var.vpc_id_parameter_name != "" && !var.manage_vpc_ssm_parameter ? 1 : 0
  name  = "${var.vpc_id_parameter_name}${local.resource_suffix}"
}

locals {
  # Use newly created VPC if we're creating one, otherwise use SSM or existing VPC
  vpc_id = local.use_existing_vpc ? local.base_vpc_id : (
    var.vpc_id_parameter_name != "" && var.manage_vpc_ssm_parameter
    ? aws_ssm_parameter.vpc_id[0].value
    : local.base_vpc_id
  )
}

