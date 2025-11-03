# routing.tf - NAT Gateway, route tables, and routing configuration

# Elastic IP for NAT Gateway (only in first AZ for cost optimization)
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway && var.single_nat_gateway ? 1 : 0

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = local.nat_eip_name
    Type = "elastic-ip"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway in first availability zone only (cost optimization)
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway && var.single_nat_gateway ? 1 : 0

  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, {
    Name = local.nat_gateway_name
    Type = "nat-gateway"
    AZ   = local.selected_azs[0]
  })

  depends_on = [
    aws_internet_gateway.main,
    aws_subnet.public
  ]
}

# Route table for public subnets (shared across all public subnets)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  # Route to Internet Gateway for internet access
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = local.public_route_table_name
    Type = "route-table"
    Tier = "public"
  })

  depends_on = [aws_vpc.main, aws_internet_gateway.main]
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = var.availability_zones_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id

  depends_on = [aws_subnet.public, aws_route_table.public]
}

# Separate route tables for each private subnet (prevents cross-AZ communication)
resource "aws_route_table" "private" {
  count = var.availability_zones_count

  vpc_id = aws_vpc.main.id

  # Route to NAT Gateway for internet access (only if NAT Gateway is enabled)
  dynamic "route" {
    for_each = var.enable_nat_gateway && var.single_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[0].id
    }
  }

  tags = merge(local.common_tags, {
    Name = local.private_route_table_names[count.index]
    Type = "route-table"
    Tier = "private"
    AZ   = local.selected_azs[count.index]
  })

  depends_on = [aws_vpc.main]
}

# Associate each private subnet with its own route table
resource "aws_route_table_association" "private" {
  count = var.availability_zones_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id

  depends_on = [aws_subnet.private, aws_route_table.private]
}