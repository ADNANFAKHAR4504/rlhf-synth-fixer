# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_dr" {
  provider    = aws.primary
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.dr.id
  peer_region = var.dr_region
  auto_accept = false

  tags = {
    Name              = "vpc-peering-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Accept VPC Peering Connection
resource "aws_vpc_peering_connection_accepter" "dr" {
  provider                  = aws.dr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
  auto_accept               = true

  tags = {
    Name              = "vpc-peering-accepter-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Route from primary to DR
resource "aws_route" "primary_to_dr" {
  provider                  = aws.primary
  route_table_id            = aws_route_table.primary.id
  destination_cidr_block    = var.vpc_cidr_dr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id

  depends_on = [aws_vpc_peering_connection_accepter.dr]
}

# Route from DR to primary
resource "aws_route" "dr_to_primary" {
  provider                  = aws.dr
  route_table_id            = aws_route_table.dr.id
  destination_cidr_block    = var.vpc_cidr_primary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id

  depends_on = [aws_vpc_peering_connection_accepter.dr]
}
