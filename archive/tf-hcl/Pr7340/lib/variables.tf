# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., dev, pr123, pr456 for parallel deployments)"
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

variable "authorizer_reserved_concurrency" {
  description = "Optional reserved concurrency for the token authorizer Lambda"
  type        = number
  default     = null
}

variable "transaction_validation_reserved_concurrency" {
  description = "Optional reserved concurrency for the transaction validation Lambda"
  type        = number
  default     = null
}

variable "fraud_scoring_reserved_concurrency" {
  description = "Optional reserved concurrency for the fraud scoring Lambda"
  type        = number
  default     = null
}

variable "notification_reserved_concurrency" {
  description = "Optional reserved concurrency for the notification Lambda"
  type        = number
  default     = null
}
