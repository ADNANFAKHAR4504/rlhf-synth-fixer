# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 10
    error_message = "Environment suffix must be between 1 and 10 characters"
  }
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

# Hub-and-Spoke specific variables

variable "hub_vpc_cidr" {
  description = "CIDR block for hub VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "spoke_vpc_cidrs" {
  description = "CIDR blocks for spoke VPCs"
  type        = map(string)
  default = {
    production  = "10.1.0.0/16"
    staging     = "10.2.0.0/16"
    development = "10.3.0.0/16"
  }
}

variable "transit_gateway_asn" {
  description = "BGP ASN for Transit Gateway"
  type        = number
  default     = 64512
}

variable "enable_dns_support" {
  description = "Enable DNS support on Transit Gateway"
  type        = bool
  default     = true
}

variable "enable_vpn_ecmp_support" {
  description = "Enable VPN ECMP support on Transit Gateway"
  type        = bool
  default     = true
}