# Cluster Autoscaler Module Variables

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "cluster_autoscaler_role_arn" {
  description = "ARN of the cluster autoscaler IAM role"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "cluster_autoscaler_chart_version" {
  description = "Version of the Cluster Autoscaler Helm chart"
  type        = string
  default     = "9.35.0"
}
