variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Number of days to retain ALB access logs"
  type        = number
  default     = 90
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS listener (optional)"
  type        = string
  default     = ""

  validation {
    condition     = var.certificate_arn == "" || can(regex("^arn:aws:acm:", var.certificate_arn))
    error_message = "certificate_arn must be a valid ACM certificate ARN or empty string."
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}