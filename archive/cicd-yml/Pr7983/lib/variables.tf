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

# CI/CD Pipeline Specific Variables

variable "dev_account_id" {
  description = "AWS account ID for dev environment"
  type        = string
  default     = "123456789012"
}

variable "staging_account_id" {
  description = "AWS account ID for staging environment"
  type        = string
  default     = "234567890123"
}

variable "prod_account_id" {
  description = "AWS account ID for production environment"
  type        = string
  default     = "345678901234"
}

variable "cross_account_role_name" {
  description = "Name of the IAM role in target accounts that CodeBuild will assume"
  type        = string
  default     = "TerraformDeploymentRole"
}

variable "notification_emails" {
  description = "Email addresses for pipeline notifications"
  type        = list(string)
  default     = []
}

variable "repository_branch" {
  description = "CodeCommit repository branch to monitor"
  type        = string
  default     = "main"
}
