variable "tgw_name" {
  description = "Name of the Transit Gateway"
  type        = string
}

variable "description" {
  description = "Description of the Transit Gateway"
  type        = string
  default     = ""
}

variable "amazon_side_asn" {
  description = "Amazon side ASN"
  type        = number
  default     = 64512
}

variable "enable_dns_support" {
  description = "Enable DNS support"
  type        = bool
  default     = true
}

variable "enable_vpn_ecmp_support" {
  description = "Enable VPN ECMP support"
  type        = bool
  default     = true
}

variable "enable_multicast_support" {
  description = "Enable multicast support"
  type        = bool
  default     = false
}

variable "default_route_table_association" {
  description = "Enable default route table association"
  type        = string
  default     = "disable"
}

variable "default_route_table_propagation" {
  description = "Enable default route table propagation"
  type        = string
  default     = "disable"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}