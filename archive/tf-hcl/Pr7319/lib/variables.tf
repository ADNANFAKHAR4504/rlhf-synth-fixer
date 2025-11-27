variable "environment_suffix" {
  description = "Unique suffix to append to resource names for multi-environment support. Can be set via ENVIRONMENT_SUFFIX environment variable or passed directly."
  type        = string
  default     = ""
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-2"
}

variable "cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.28"
}

variable "vpc_id" {
  description = "VPC ID for EKS cluster"
  type        = string
  # If empty, the module will create a VPC and populate references from aws_vpc.main
  default = ""
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs across 3 AZs for EKS nodes"
  type        = list(string)
  validation {
    # Allow an empty list (module will create private subnets) or exactly 3 values
    condition     = length(var.private_subnet_ids) == 0 || length(var.private_subnet_ids) == 3
    error_message = "private_subnet_ids must be empty (auto-create) or contain exactly 3 subnet IDs (one per AZ)"
  }
  default = []
}

variable "node_instance_type" {
  description = "Instance type for EKS worker nodes"
  type        = string
  default     = "t3.large"
}

variable "node_min_size" {
  description = "Minimum number of nodes"
  type        = number
  default     = 3
}

variable "node_max_size" {
  description = "Maximum number of nodes"
  type        = number
  default     = 15
}

variable "node_desired_size" {
  description = "Desired number of nodes"
  type        = number
  default     = 3
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "production_namespace_pod_limit" {
  description = "Maximum pods allowed in production namespace"
  type        = number
  default     = 100
}

variable "production_namespace_storage_limit" {
  description = "Maximum storage allowed in production namespace"
  type        = string
  default     = "200Gi"
}
