variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness. Should be set via TF_VAR_environment_suffix environment variable or -var flag. Defaults to 'dev' if not provided."
  type        = string
  default     = "dev"

  # Note: In CI/CD, the deploy script should export TF_VAR_environment_suffix=$ENVIRONMENT_SUFFIX
  # to ensure resources are created with the correct suffix (e.g., pr6692 instead of dev)
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
