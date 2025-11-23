variable "environment_suffix" {
  description = "Unique suffix for resource naming to enable multiple deployments"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "AWS region for EKS cluster deployment"
  type        = string
  default     = "us-east-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_instance_type" {
  description = "EC2 instance type for EKS nodes (Graviton2 ARM)"
  type        = string
  default     = "t4g.medium"
}

variable "node_min_size" {
  description = "Minimum number of nodes in the node group"
  type        = number
  default     = 3
}

variable "node_max_size" {
  description = "Maximum number of nodes in the node group"
  type        = number
  default     = 15
}

variable "node_desired_size" {
  description = "Desired number of nodes in the node group"
  type        = number
  default     = 3
}

variable "node_disk_size" {
  description = "Root volume size for EKS nodes in GB"
  type        = number
  default     = 100
}

variable "authorized_cidr_blocks" {
  description = "CIDR blocks allowed to access EKS public endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_prefix_delegation" {
  description = "Enable VPC CNI prefix delegation for increased pod density"
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
