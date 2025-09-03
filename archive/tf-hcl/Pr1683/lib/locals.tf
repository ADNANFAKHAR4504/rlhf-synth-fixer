locals {
  # Use environment suffix if provided, otherwise generate a unique one
  env_suffix  = var.environment_suffix != "" ? var.environment_suffix : "synth${var.random_id}"
  name_prefix = "AppResource-${var.environment}-${local.env_suffix}"

  common_tags = {
    Environment       = var.environment
    EnvironmentSuffix = local.env_suffix
    ManagedBy         = "terraform"
    Project           = "WebAppInfra"
  }
}