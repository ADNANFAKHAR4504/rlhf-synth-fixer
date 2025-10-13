variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "primary_alb_dns" {
  description = "Primary ALB DNS name"
  type        = string
}

variable "secondary_alb_dns" {
  description = "Secondary ALB DNS name"
  type        = string
}

