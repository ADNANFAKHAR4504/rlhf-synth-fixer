variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-2"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "environment" {
  description = "Environment name for tagging"
  type        = string
  default     = "production"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "compliance-operations"
}
