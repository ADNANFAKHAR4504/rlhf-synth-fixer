variable "local_tgw_id" {
  description = "ID of the local Transit Gateway"
  type        = string
}

variable "peer_tgw_id" {
  description = "ID of the peer Transit Gateway"
  type        = string
}

variable "peer_region" {
  description = "AWS region of the peer Transit Gateway"
  type        = string
}

variable "peering_name" {
  description = "Name for the peering connection"
  type        = string
}

variable "environment_suffix" {
  description = "Random suffix for unique resource naming"
  type        = string
  default     = ""
}

variable "project_tags" {
  description = "Common project tags"
  type        = map(string)
  default     = {}
}
