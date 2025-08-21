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