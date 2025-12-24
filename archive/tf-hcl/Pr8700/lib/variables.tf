variable "environmentSuffix" {
  description = "Unique suffix to ensure resource name uniqueness across deployments"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
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

variable "app_namespace" {
  description = "Namespace for application workloads"
  type        = string
  default     = "trading-app"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "trading-platform"
    ManagedBy   = "terraform"
  }
}
