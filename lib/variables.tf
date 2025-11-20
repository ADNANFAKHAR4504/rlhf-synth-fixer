# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
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

variable "db_master_username" {
  description = "Master username for Aurora PostgreSQL"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora PostgreSQL"
  type        = string
  sensitive   = true
}

variable "container_image" {
  description = "Container image for ECS tasks"
  type        = string
  default     = "nginx:latest" # Replace with actual payment processing image
}

variable "active_environment" {
  description = "Active environment for traffic routing (blue or green)"
  type        = string
  default     = "blue"

  validation {
    condition     = contains(["blue", "green"], var.active_environment)
    error_message = "Active environment must be either 'blue' or 'green'."
  }
}

variable "source_db_server" {
  description = "Source Oracle database server hostname"
  type        = string
  sensitive   = true
}

variable "source_db_name" {
  description = "Source Oracle database name"
  type        = string
  default     = "ORCL"
}

variable "source_db_username" {
  description = "Source Oracle database username"
  type        = string
  sensitive   = true
}

variable "source_db_password" {
  description = "Source Oracle database password"
  type        = string
  sensitive   = true
}