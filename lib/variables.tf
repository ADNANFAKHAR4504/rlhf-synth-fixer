variable "aws_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "trading-platform"
}

variable "enable_route53" {
  description = "Enable Route53 private hosted zone (requires domain)"
  type        = bool
  default     = false
}

variable "hub_region" {
  description = "AWS region for the hub"
  type        = string
  default     = "us-east-1"
}

variable "spoke_regions" {
  description = "AWS regions for the spokes"
  type        = map(string)
  default = {
    "us-west-2" = "us-west-2"
    "eu-west-1" = "eu-west-1"
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

variable "spoke_vpc_cidrs" {
  description = "CIDR blocks for spoke VPCs"
  type        = map(string)
  default = {
    "us-west-2" = "10.1.0.0/16"
    "eu-west-1" = "10.2.0.0/16"
  }

  validation {
    condition = alltrue([
      for cidr in values(var.spoke_vpc_cidrs) : can(cidrhost(cidr, 0))
    ])
    error_message = "All spoke VPC CIDRs must be valid IPv4 CIDR blocks."
  }
}

variable "private_domain_name" {
  description = "Private Route53 domain name"
  type        = string
  default     = "trading.internal"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    CostCenter  = "Finance"
    Owner       = "NetworkTeam"
    Project     = "TradingPlatform"
    Terraform   = "true"
  }
}

variable "flow_log_format" {
  description = "Format for VPC Flow Logs"
  type        = string
  default     = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status} $${vpc-id} $${subnet-id} $${instance-id} $${tcp-flags} $${type} $${pkt-srcaddr} $${pkt-dstaddr} $${region} $${az-id} $${sublocation-type} $${sublocation-id}"
}