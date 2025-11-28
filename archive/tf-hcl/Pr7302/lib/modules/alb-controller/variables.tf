# ALB Controller Module Variables

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "alb_controller_role_arn" {
  description = "ARN of the ALB controller IAM role"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "alb_controller_chart_version" {
  description = "Version of the AWS Load Balancer Controller Helm chart"
  type        = string
  default     = "1.7.0"
}
