variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region_name" {
  description = "Region name identifier (primary or secondary)"
  type        = string
}

variable "alb_arn" {
  description = "ALB ARN to associate with WAF"
  type        = string
}

