variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "microservices-cicd"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "your-org/microservices-app"
}

variable "github_branch" {
  description = "GitHub branch to track"
  type        = string
  default     = "main"
}

variable "notification_email" {
  description = "Email for deployment notifications"
  type        = string
  default     = "devops@example.com"
}

variable "environment_suffix" {
  description = "Suffix for resource names to avoid conflicts"
  type        = string
  default     = "dev"
}