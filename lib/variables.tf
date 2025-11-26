variable "environment_suffix" {
  description = "Unique suffix for resource naming to support multiple environments"
  type        = string
  default     = "pr7338"
}

variable "aws_region" {
  description = "AWS region for EKS cluster"
  type        = string
  default     = "us-east-2"
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_instance_type" {
  description = "EC2 instance type for worker nodes"
  type        = string
  default     = "t3.large"
}

variable "node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 3
}

variable "node_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 15
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 3
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones for the cluster"
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b", "us-east-2c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "production_namespace_pod_quota" {
  description = "Maximum pods allowed in production namespace"
  type        = number
  default     = 100
}

variable "production_namespace_storage_quota" {
  description = "Maximum storage in production namespace"
  type        = string
  default     = "200Gi"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}