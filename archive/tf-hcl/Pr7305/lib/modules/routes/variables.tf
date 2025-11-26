variable "transit_gateway_route_table_id" {
  description = "Transit Gateway route table ID"
  type        = string
}

variable "routes" {
  description = "List of routes to create"
  type = list(object({
    destination_cidr_block = string
    attachment_id          = string
  }))
  default = []
}

variable "blackhole_routes" {
  description = "List of CIDR blocks to blackhole"
  type        = list(string)
  default     = []
}