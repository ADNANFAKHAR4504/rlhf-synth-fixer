variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "amazon_side_asn" {
  description = "Private Autonomous System Number (ASN) for the Amazon side of a BGP session"
  type        = number
}

variable "tgw_name" {
  description = "Name for the Transit Gateway"
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
