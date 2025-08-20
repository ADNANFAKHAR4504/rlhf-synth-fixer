variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
}

variable "allowed_ingress_cidrs" {
  description = "Organization-approved CIDR blocks for ingress"
  type        = list(string)
}

variable "allowed_ports" {
  description = "Allowed ports for ingress"
  type        = list(number)
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
}