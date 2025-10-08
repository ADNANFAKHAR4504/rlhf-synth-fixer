# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the website"
  type        = string
  default     = ""
}

variable "create_dns_records" {
  description = "Whether to create Route 53 DNS records"
  type        = bool
  default     = false
}

variable "hosted_zone_name" {
  description = "Route 53 hosted zone name (if different from domain_name root)"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "donation-platform"
}

variable "environment_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "donation-platform"
    ManagedBy   = "terraform"
  }
}