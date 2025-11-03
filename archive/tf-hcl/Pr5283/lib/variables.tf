# Input variables for the multi-region VPC infrastructure

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to enable multiple deployments (e.g., pr123, synth456)"
  type        = string
  default     = "dev"
}

variable "regions" {
  description = "List of AWS regions to deploy VPCs"
  type        = list(string)
  default     = ["us-east-1", "us-west-2", "eu-central-1"]
}

variable "nat_gateway_regions" {
  description = "Regions that should have NAT Gateways (for shared egress pattern)"
  type        = list(string)
  default     = ["us-east-1"] # Only one per geographic area for cost savings
}

variable "base_cidr_block" {
  description = "Base CIDR block for all VPCs (will be subnetted per region)"
  type        = string
  default     = "10.0.0.0/8" # Provides ample IP space for growth

  validation {
    condition     = can(cidrhost(var.base_cidr_block, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "vpc-infrastructure"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "engineering-infrastructure"
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs for network monitoring"
  type        = bool
  default     = true
}

# State management configuration
variable "state_bucket" {
  description = "S3 bucket for Terraform state storage"
  type        = string
  default     = "terraform-state"
}

variable "state_key_prefix" {
  description = "S3 key prefix for state files"
  type        = string
  default     = "networking/vpc"
}

variable "state_region" {
  description = "Region for S3 state bucket"
  type        = string
  default     = "us-east-1"
}

variable "dynamodb_table" {
  description = "DynamoDB table for state locking"
  type        = string
  default     = "terraform-state-lock"
}

variable "aws_region" {
  description = "Primary AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "enable_route53_resolver" {
  description = "Enable Route53 Resolver endpoints for DNS resolution between VPCs"
  type        = bool
  default     = false
}