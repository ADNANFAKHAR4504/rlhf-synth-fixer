variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "alb_sg_id" {
  description = "ALB security group ID"
  type        = string
}

variable "region_name" {
  description = "Region name identifier (primary or secondary)"
  type        = string
}

variable "resource_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
}

