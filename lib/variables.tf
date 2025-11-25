# variables.tf - Updated to include all required variables for EKS deployment

# Required repository-standard variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-central-1"  # Updated to match PROMPT requirement
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
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

# EKS-specific variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
}

variable "eks_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.28"
}

variable "frontend_instance_type" {
  description = "Instance type for frontend node group"
  type        = string
  default     = "t3.large"
}

variable "backend_instance_type" {
  description = "Instance type for backend node group"
  type        = string
  default     = "m5.xlarge"
}

variable "data_processing_instance_type" {
  description = "Instance type for data processing node group"
  type        = string
  default     = "c5.2xlarge"
}

variable "min_nodes" {
  description = "Minimum number of nodes per node group"
  type        = number
  default     = 2
}

variable "max_nodes" {
  description = "Maximum number of nodes per node group"
  type        = number
  default     = 10
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "ECommercePlatform"
  }
}
