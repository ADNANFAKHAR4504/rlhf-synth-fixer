# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? var.availability_zone_count : 0

  domain = "vpc"

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-eip-nat-az${count.index + 1}-${local.name_suffix}"
  })

  depends_on = [module.vpc_hub]
}

# NAT Gateways
resource "aws_nat_gateway" "hub" {
  count = var.enable_nat_gateway ? var.availability_zone_count : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = module.vpc_hub.public_subnet_ids[count.index]

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-nat-az${count.index + 1}-${local.name_suffix}"
  })

  depends_on = [aws_eip.nat]
}

# Routes from hub private subnets to NAT Gateways
resource "aws_route" "hub_private_nat" {
  count = var.enable_nat_gateway ? length(module.vpc_hub.private_route_table_ids) : 0

  route_table_id         = module.vpc_hub.private_route_table_ids[count.index]
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.hub[count.index].id

  depends_on = [aws_nat_gateway.hub]
}
