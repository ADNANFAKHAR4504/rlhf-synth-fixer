variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "purpose" {
  description = "Purpose of the VPC"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "create_igw" {
  description = "Whether to create Internet Gateway"
  type        = bool
  default     = false
}

variable "create_public_subnets" {
  description = "Whether to create public subnets"
  type        = bool
  default     = true
}

variable "create_tgw_attachment_subnets" {
  description = "Whether to create Transit Gateway attachment subnets"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
