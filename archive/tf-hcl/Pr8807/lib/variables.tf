variable "aws_region" {
  description = "AWS region for EKS cluster deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to prevent conflicts"
  type        = string
  default     = "dev"
}

variable "team" {
  description = "Team name tag"
  type        = string
  default     = "platform"
}

variable "cost_center" {
  description = "Cost center tag"
  type        = string
  default     = "engineering"
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

variable "enable_cluster_autoscaler" {
  description = "Enable cluster autoscaler tags on node groups"
  type        = bool
  default     = true
}

variable "enable_spot_instances" {
  description = "Enable spot instance node group"
  type        = bool
  default     = true
}
