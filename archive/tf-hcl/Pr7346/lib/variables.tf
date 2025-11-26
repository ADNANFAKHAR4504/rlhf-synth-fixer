variable "environment_suffix" {
  description = "Unique suffix for resource isolation and naming"
  type        = string
  default     = "dev289"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
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

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "eks-cluster"
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable GuardDuty EKS protection (optional enhancement)"
  type        = bool
  default     = false
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
  description = "Instance type for data-processing node group"
  type        = string
  default     = "c5.2xlarge"
}

variable "node_group_min_size" {
  description = "Minimum number of nodes per group"
  type        = number
  default     = 2
}

variable "node_group_max_size" {
  description = "Maximum number of nodes per group"
  type        = number
  default     = 10
}

variable "node_group_desired_size" {
  description = "Desired number of nodes per group"
  type        = number
  default     = 2
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Project     = "eks-microservices"
  }
}
