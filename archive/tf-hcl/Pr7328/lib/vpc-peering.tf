# VPC Peering Connection (initiated from primary)
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.primary
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.secondary.id
  peer_region = var.secondary_region
  auto_accept = false

  tags = merge(local.common_tags, {
    Name    = "vpc-peering-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Accept VPC Peering Connection in secondary region
resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = merge(local.common_tags, {
    Name    = "vpc-peering-accepter-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Add routes to primary private route tables
resource "aws_route" "primary_to_secondary" {
  provider                  = aws.primary
  count                     = 3
  route_table_id            = aws_route_table.primary_private[count.index].id
  destination_cidr_block    = var.vpc_cidr_secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# Add routes to secondary private route tables
resource "aws_route" "secondary_to_primary" {
  provider                  = aws.secondary
  count                     = 3
  route_table_id            = aws_route_table.secondary_private[count.index].id
  destination_cidr_block    = var.vpc_cidr_primary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}
