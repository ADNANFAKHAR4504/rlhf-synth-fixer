# variables.tf - Input variables for multi-region VPC infrastructure

variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-1"
  validation {
    condition = contains([
      "us-east-1", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1",
      "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ca-central-1"
    ], var.aws_region)
    error_message = "Region must be a valid AWS region."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment))
    error_message = "Environment must be lowercase alphanumeric with hyphens."
  }
}

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
  default     = "fintech-vpc"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must be lowercase alphanumeric with hyphens."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC - must be /20 for future expansion"
  type        = string
  default     = "10.0.0.0/20"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0)) && can(regex("/20$", var.vpc_cidr))
    error_message = "VPC CIDR must be a valid /20 CIDR block."
  }
}

variable "availability_zones_count" {
  description = "Number of availability zones to use (must be exactly 3)"
  type        = number
  default     = 3
  validation {
    condition     = var.availability_zones_count == 3
    error_message = "Must use exactly 3 availability zones as per requirements."
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnet internet access"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway for cost optimization (only in first AZ)"
  type        = bool
  default     = true
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "custom_dns_servers" {
  description = "Custom DNS servers for DHCP options set"
  type        = list(string)
  default     = ["8.8.8.8", "8.8.4.4"]
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs with CloudWatch destination"
  type        = bool
  default     = true
}

variable "flow_logs_retention_days" {
  description = "Number of days to retain VPC Flow Logs"
  type        = number
  default     = 14
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.flow_logs_retention_days)
    error_message = "Retention days must be a valid CloudWatch Logs retention period."
  }
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Private subnet configuration
variable "private_subnet_suffix" {
  description = "Suffix for private subnet names"
  type        = string
  default     = "private"
}

# Public subnet configuration
variable "public_subnet_suffix" {
  description = "Suffix for public subnet names"
  type        = string
  default     = "public"
}

variable "map_public_ip_on_launch" {
  description = "Map public IP on launch for instances in public subnets"
  type        = bool
  default     = true
}