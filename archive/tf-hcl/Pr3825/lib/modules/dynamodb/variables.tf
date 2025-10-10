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

variable "resource_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
}

