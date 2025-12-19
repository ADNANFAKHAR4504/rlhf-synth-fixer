variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for endpoint network interfaces"
  type        = list(string)
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "endpoint_name_prefix" {
  description = "Prefix for endpoint names"
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
