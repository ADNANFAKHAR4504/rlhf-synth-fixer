# modules/vpc/peering.tf - VPC Peering Configuration

variable "enable_peering" {
  description = "Enable VPC peering connection"
  type        = bool
  default     = false
}

variable "peer_vpc_id" {
  description = "ID of the peer VPC"
  type        = string
  default     = ""
}

variable "peer_vpc_cidr" {
  description = "CIDR block of the peer VPC"
  type        = string
  default     = ""
}

variable "peering_connection_id" {
  description = "ID of existing peering connection for route configuration"
  type        = string
  default     = ""
}

# ============================================================================
# PEERING ROUTES
# ============================================================================

# Add routes to peer VPC in public route table
resource "aws_route" "public_to_peer" {
  count                     = var.enable_peering && var.peering_connection_id != "" ? 1 : 0
  route_table_id            = aws_route_table.public.id
  destination_cidr_block    = var.peer_vpc_cidr
  vpc_peering_connection_id = var.peering_connection_id
}

# Add routes to peer VPC in private route tables
resource "aws_route" "private_to_peer" {
  count                     = var.enable_peering && var.peering_connection_id != "" ? length(aws_route_table.private) : 0
  route_table_id            = aws_route_table.private[count.index].id
  destination_cidr_block    = var.peer_vpc_cidr
  vpc_peering_connection_id = var.peering_connection_id
}