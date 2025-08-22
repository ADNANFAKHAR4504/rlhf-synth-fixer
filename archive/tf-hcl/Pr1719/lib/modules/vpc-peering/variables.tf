variable "vpc_us_east_1_id" {
  description = "VPC ID for US East 1"
  type        = string
}

variable "vpc_eu_west_1_id" {
  description = "VPC ID for EU West 1"
  type        = string
}

variable "vpc_ap_southeast_1_id" {
  description = "VPC ID for AP Southeast 1"
  type        = string
  default     = null
}

variable "vpc_us_east_1_cidr" {
  description = "CIDR block for US East 1 VPC"
  type        = string
}

variable "vpc_eu_west_1_cidr" {
  description = "CIDR block for EU West 1 VPC"
  type        = string
}

variable "vpc_ap_southeast_1_cidr" {
  description = "CIDR block for AP Southeast 1 VPC"
  type        = string
  default     = null
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
