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

variable "allowed_kms_role_arns" {
  description = "List of IAM role ARNs allowed to use KMS key"
  type        = list(string)
  default     = []
}

variable "allowed_admin_ips" {
  description = "List of IP ranges allowed for admin access (CIDR format)"
  type        = list(string)
  default     = []
}

variable "vpc_id" {
  description = "Existing VPC ID (if not provided, minimal VPC will be created)"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "List of existing private subnet IDs"
  type        = list(string)
  default     = []
}

variable "target_organization_unit_id" {
  description = "AWS Organizations OU ID to attach SCPs"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "confidential"
}

variable "notification_email" {
  description = "Email for security notifications"
  type        = string
  default     = ""
}