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

variable "data_classification" {
  description = "Data classification level for compliance tagging"
  type        = string
  default     = "Confidential"
}

variable "cost_center" {
  description = "Cost center for billing and resource allocation"
  type        = string
  default     = "FinanceIT"
}

variable "transit_gateway_id" {
  description = "ID of the existing Transit Gateway for centralized routing"
  type        = string
  default     = "tgw-xxxxxxxxxxxxxxxxx"

  validation {
    condition     = var.transit_gateway_id != null && var.transit_gateway_id != ""
    error_message = "transit_gateway_id must be provided and cannot be empty."
  }
}
