########################
# Shared Variables
########################

variable "name_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "secure-env"
}

variable "environment" {
  description = "Environment suffix for resource names (must start with a letter, use only letters and numbers)"
  type        = string
  default     = "dev"
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9]*$", var.environment))
    error_message = "Environment must start with a letter and contain only letters and numbers."
  }
}

variable "aws_region" {
  description = "Primary AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS provider region"
  type        = string
  default     = "us-west-2"
}
