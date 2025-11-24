# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_dr" {
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.dr.id
  peer_region = var.dr_region
  auto_accept = false

  tags = merge(
    local.common_tags,
    {
      Name = "rds-vpc-peering-${var.environment_suffix}"
    }
  )
}

# Accept VPC peering in DR region
resource "aws_vpc_peering_connection_accepter" "dr" {
  provider                  = aws.us-west-2
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
  auto_accept               = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-vpc-peering-accepter-${var.environment_suffix}"
    }
  )
}

# Route from primary to DR
resource "aws_route" "primary_to_dr" {
  route_table_id            = aws_route_table.primary_private.id
  destination_cidr_block    = var.dr_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
}

# Route from DR to primary
resource "aws_route" "dr_to_primary" {
  provider                  = aws.us-west-2
  route_table_id            = aws_route_table.dr_private.id
  destination_cidr_block    = var.primary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
}
