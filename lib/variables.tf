# variables.tf

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "FINTECH-001"
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "confidential"
}

variable "container_image" {
  description = "Docker image for ECS tasks"
  type        = string
  default     = "nginx:latest"
}

variable "lambda_source_path" {
  description = "Path to Lambda deployment package"
  type        = string
  default     = "lambda.zip"
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