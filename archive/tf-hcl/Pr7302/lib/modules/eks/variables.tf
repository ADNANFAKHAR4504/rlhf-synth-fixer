# EKS Module Variables

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "eks_version" {
  description = "EKS cluster version"
  type        = string
}

variable "cluster_role_arn" {
  description = "ARN of the EKS cluster IAM role"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "vpc_cni_version" {
  description = "Version of vpc-cni addon"
  type        = string
  default     = null
}

variable "kube_proxy_version" {
  description = "Version of kube-proxy addon"
  type        = string
  default     = null
}

variable "coredns_version" {
  description = "Version of coredns addon"
  type        = string
  default     = null
}

variable "ebs_csi_driver_version" {
  description = "Version of EBS CSI driver addon"
  type        = string
  default     = null
}

variable "ebs_csi_driver_role_arn" {
  description = "ARN of the EBS CSI driver IAM role"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
