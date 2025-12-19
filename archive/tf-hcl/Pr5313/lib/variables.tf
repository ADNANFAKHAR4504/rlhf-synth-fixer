variable "aws_region" {
  description = "Primary AWS region (hub)"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development"
  }
}

variable "environment_suffix" {
  description = "Random suffix for unique resource naming across environments"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "trading-platform"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "finance"
}

variable "hub_vpc_cidr" {
  description = "CIDR block for hub VPC in us-east-1"
  type        = string
  default     = "10.0.0.0/16"
}

variable "hub_public_subnet_cidrs" {
  description = "CIDR blocks for hub public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "hub_private_subnet_cidrs" {
  description = "CIDR blocks for hub private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "uswest_vpc_cidr" {
  description = "CIDR block for US West spoke VPC in us-west-2"
  type        = string
  default     = "10.1.0.0/16"
}

variable "uswest_public_subnet_cidrs" {
  description = "CIDR blocks for US West public subnets"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
}

variable "uswest_private_subnet_cidrs" {
  description = "CIDR blocks for US West private subnets"
  type        = list(string)
  default     = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
}

variable "europe_vpc_cidr" {
  description = "CIDR block for Europe spoke VPC in eu-west-1"
  type        = string
  default     = "10.2.0.0/16"
}

variable "europe_public_subnet_cidrs" {
  description = "CIDR blocks for Europe public subnets"
  type        = list(string)
  default     = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
}

variable "europe_private_subnet_cidrs" {
  description = "CIDR blocks for Europe private subnets"
  type        = list(string)
  default     = ["10.2.11.0/24", "10.2.12.0/24", "10.2.13.0/24"]
}

variable "hub_tgw_asn" {
  description = "Amazon side ASN for hub Transit Gateway"
  type        = number
  default     = 64512
}

variable "uswest_tgw_asn" {
  description = "Amazon side ASN for US West Transit Gateway"
  type        = number
  default     = 64513
}

variable "europe_tgw_asn" {
  description = "Amazon side ASN for Europe Transit Gateway"
  type        = number
  default     = 64514
}

variable "route53_domain_name" {
  description = "Domain name for Route53 private hosted zone"
  type        = string
  default     = "trading.internal"
}

variable "flow_logs_retention_days" {
  description = "Number of days to retain flow logs in S3"
  type        = number
  default     = 7

  validation {
    condition     = var.flow_logs_retention_days > 0
    error_message = "Flow logs retention must be greater than 0 days"
  }
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 3
    error_message = "AZ count must be 2 or 3"
  }
}
