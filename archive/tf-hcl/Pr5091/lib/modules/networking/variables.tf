variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "enable_multi_az" {
  description = "Enable multi-AZ configuration"
  type        = bool
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
