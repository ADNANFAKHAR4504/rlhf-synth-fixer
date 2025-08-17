locals {
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "dev"
  project_prefix     = "${var.project_name}-${local.environment_suffix}"
  # Shortened prefix for resources with name length limits (32 chars)
  short_prefix = "swa-${local.environment_suffix}"

  common_tags = {
    Project           = var.project_name
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    ManagedBy         = "terraform"
  }
}