variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "legacy_vpc_cidr" {
  description = "CIDR block for legacy VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "production_vpc_cidr" {
  description = "CIDR block for production VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "route53_zone_name" {
  description = "Route 53 hosted zone name"
  type        = string
}

variable "legacy_traffic_weight" {
  description = "Weight for legacy environment (0-100)"
  type        = number
  default     = 100
}

variable "production_traffic_weight" {
  description = "Weight for production environment (0-100)"
  type        = number
  default     = 0
}

variable "backend_bucket" {
  description = "S3 bucket name for Terraform state"
  type        = string
}
