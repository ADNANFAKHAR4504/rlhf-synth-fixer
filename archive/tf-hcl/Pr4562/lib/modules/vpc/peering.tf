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

# NOTE: Peering routes are managed in the root module (main.tf) to avoid
# circular dependencies and count issues with peering_connection_id.
# The peering_connection_id is created in main.tf and passed to route resources there.