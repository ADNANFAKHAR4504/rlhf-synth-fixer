variable "domain_name" {
  description = "Domain name for the hosted zone"
  type        = string
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

variable "us_east_1_lb_dns" {
  description = "Load balancer DNS name for US East 1"
  type        = string
}

variable "eu_west_1_lb_dns" {
  description = "Load balancer DNS name for EU West 1"
  type        = string
}

variable "ap_southeast_1_lb_dns" {
  description = "Load balancer DNS name for AP Southeast 1"
  type        = string
}

variable "us_east_1_region" {
  description = "US East 1 region name"
  type        = string
}

variable "eu_west_1_region" {
  description = "EU West 1 region name"
  type        = string
}

variable "ap_southeast_1_region" {
  description = "AP Southeast 1 region name"
  type        = string
}
