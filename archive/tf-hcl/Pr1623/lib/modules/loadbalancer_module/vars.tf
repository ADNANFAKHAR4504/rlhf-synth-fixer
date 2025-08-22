variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of public subnets"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region_name" {
  description = "Region name for naming resources"
  type        = string
}