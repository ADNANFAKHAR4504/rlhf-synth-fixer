variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource names to enable multiple deployments"
  type        = string

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "environment_suffix must be between 1 and 20 characters"
  }
}

variable "github_repository_owner" {
  description = "GitHub repository owner (organization or user)"
  type        = string
  default     = "owner"
}

variable "github_repository_name" {
  description = "GitHub repository name"
  type        = string
  default     = "infrastructure-repo"
}

variable "github_branch" {
  description = "GitHub branch to monitor"
  type        = string
  default     = "main"
}

variable "notification_email" {
  description = "Email address for pipeline notifications"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_pipeline_alarms" {
  description = "Enable CloudWatch alarms for pipeline failures"
  type        = bool
  default     = false
}

variable "codebuild_compute_type" {
  description = "CodeBuild compute type"
  type        = string
  default     = "BUILD_GENERAL1_SMALL"
}

variable "codebuild_image" {
  description = "CodeBuild container image"
  type        = string
  default     = "aws/codebuild/standard:7.0"
}
