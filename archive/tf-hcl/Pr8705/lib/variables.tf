variable "environment_suffix" {
  description = "Unique suffix for resource names to ensure uniqueness across environments"
  type        = string
  default     = "synth101912402v4"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "github_repository_id" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to trigger pipeline"
  type        = string
  default     = "main"
}

variable "notification_email" {
  description = "Email address for pipeline notifications"
  type        = string
}

variable "terraform_version" {
  description = "Terraform version to use in CodeBuild"
  type        = string
  default     = "1.6.0"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7
}
