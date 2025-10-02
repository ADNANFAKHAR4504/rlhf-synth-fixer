locals {
  # Use environment suffix from environment variable if set, otherwise use task ID
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "synth49382157"

  # Resource naming convention with environment suffix
  name_prefix = "${var.project_name}-${local.environment_suffix}"

  # Common tags to apply to all resources
  common_tags = {
    Project           = var.project_name
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    ManagedBy         = "Terraform"
  }
}