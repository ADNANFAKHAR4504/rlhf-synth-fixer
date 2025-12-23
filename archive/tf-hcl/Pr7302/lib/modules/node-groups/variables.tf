# Node Groups Module Variables

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "eks_version" {
  description = "EKS cluster version"
  type        = string
}

variable "node_role_arn" {
  description = "ARN of the node group IAM role"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "frontend_instance_type" {
  description = "Instance type for frontend node group"
  type        = string
}

variable "backend_instance_type" {
  description = "Instance type for backend node group"
  type        = string
}

variable "data_processing_instance_type" {
  description = "Instance type for data processing node group"
  type        = string
}

variable "min_nodes" {
  description = "Minimum number of nodes per node group"
  type        = number
}

variable "max_nodes" {
  description = "Maximum number of nodes per node group"
  type        = number
}

variable "desired_nodes" {
  description = "Desired number of nodes per node group"
  type        = number
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
