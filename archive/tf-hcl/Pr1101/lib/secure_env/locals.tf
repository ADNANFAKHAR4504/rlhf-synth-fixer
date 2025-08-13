locals {
  # Generate random suffix for unique naming
  random_suffix = random_id.resource_suffix.hex

  # Environment suffix from variable or use random suffix
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : "tf${local.random_suffix}"

  common_tags = {
    Environment = "Production"
    Owner       = "SecurityTeam"
    Project     = "SecureEnvironment"
    ManagedBy   = "Terraform"
    Suffix      = local.env_suffix
  }
}