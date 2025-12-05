variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "email_endpoint" {
  description = "Email endpoint for notifications"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
