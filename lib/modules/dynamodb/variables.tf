variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "secondary_region" {
  description = "Secondary AWS region for replica"
  type        = string
}

