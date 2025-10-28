variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming (e.g., pr4798, synth123). Reads from ENVIRONMENT_SUFFIX env variable if not provided."
  type        = string
  default     = ""

  validation {
    condition     = var.environment_suffix == "" || can(regex("^[a-z0-9-]+$", var.environment_suffix))
    error_message = "Environment suffix must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "hub_vpc_cidr" {
  description = "CIDR block for hub VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.hub_vpc_cidr, 0))
    error_message = "Hub VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "production_vpc_cidr" {
  description = "CIDR block for production VPC"
  type        = string
  default     = "10.1.0.0/16"

  validation {
    condition     = can(cidrhost(var.production_vpc_cidr, 0))
    error_message = "Production VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "development_vpc_cidr" {
  description = "CIDR block for development VPC"
  type        = string
  default     = "10.2.0.0/16"

  validation {
    condition     = can(cidrhost(var.development_vpc_cidr, 0))
    error_message = "Development VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zone_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 3

  validation {
    condition     = var.availability_zone_count >= 2 && var.availability_zone_count <= 6
    error_message = "Availability zone count must be between 2 and 6."
  }
}

variable "transit_gateway_asn" {
  description = "Amazon side ASN for Transit Gateway"
  type        = number
  default     = 64512

  validation {
    condition     = var.transit_gateway_asn >= 64512 && var.transit_gateway_asn <= 65534
    error_message = "Transit Gateway ASN must be between 64512 and 65534 (private ASN range)."
  }
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
  default     = "infrastructure"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "digital-banking"
}

variable "flow_logs_retention_days" {
  description = "Number of days to retain flow logs"
  type        = number
  default     = 365

  validation {
    condition     = var.flow_logs_retention_days >= 1 && var.flow_logs_retention_days <= 3650
    error_message = "Flow logs retention must be between 1 and 3650 days."
  }
}

variable "flow_logs_glacier_transition_days" {
  description = "Number of days before transitioning flow logs to Glacier"
  type        = number
  default     = 30

  validation {
    condition     = var.flow_logs_glacier_transition_days >= 1
    error_message = "Glacier transition days must be at least 1."
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateways in hub VPC"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "enable_vpc_endpoints" {
  description = "Enable Systems Manager VPC endpoints"
  type        = bool
  default     = true
}

variable "enable_route53_resolver" {
  description = "Enable Route53 Resolver endpoints"
  type        = bool
  default     = true
}

variable "enable_ram_sharing" {
  description = "Enable RAM resource sharing for Route53 Resolver (requires AWS Organizations)"
  type        = bool
  default     = false
}
