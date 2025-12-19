# variables.tf - Complete variables for EKS infrastructure deployment

# Required repository-standard variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-central-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (CRITICAL: must be unique)"
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

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones (must be 3 for high availability)"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
}

# EKS Cluster Configuration
variable "eks_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.28"
}

# Node Group Instance Types
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

# Node Group Scaling Configuration
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

variable "desired_nodes" {
  description = "Desired number of nodes per node group"
  type        = number
  default     = 2
}

# EKS Add-on Versions
variable "vpc_cni_version" {
  description = "Version of vpc-cni addon (null for latest)"
  type        = string
  default     = null
}

variable "kube_proxy_version" {
  description = "Version of kube-proxy addon (null for latest)"
  type        = string
  default     = null
}

variable "coredns_version" {
  description = "Version of coredns addon (null for latest)"
  type        = string
  default     = null
}

variable "ebs_csi_driver_version" {
  description = "Version of EBS CSI driver addon (null for latest)"
  type        = string
  default     = null
}

# Helm Chart Versions
variable "alb_controller_chart_version" {
  description = "Version of the AWS Load Balancer Controller Helm chart"
  type        = string
  default     = "1.7.0"
}

variable "cluster_autoscaler_chart_version" {
  description = "Version of the Cluster Autoscaler Helm chart"
  type        = string
  default     = "9.35.0"
}

variable "istio_version" {
  description = "Version of Istio to deploy"
  type        = string
  default     = "1.20.2"
}

# Common Tags
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
    Project   = "ECommercePlatform"
  }
}
