variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness. MUST be set via TF_VAR_environment_suffix environment variable or -var flag. This is required and has no default value."
  type        = string

  # Note: In CI/CD, the deploy script MUST export TF_VAR_environment_suffix=$ENVIRONMENT_SUFFIX
  # to ensure resources are created with the correct suffix (e.g., pr6692 instead of dev)
  # Without this, Terraform will fail with: Error: No value for required variable "environment_suffix"
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

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-2"
}
