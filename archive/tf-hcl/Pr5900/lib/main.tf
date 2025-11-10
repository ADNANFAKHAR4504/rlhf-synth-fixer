# Default tags for all resources
locals {
  common_tags = {
    Environment       = var.environment_suffix
    Project           = "fintech-microservices"
    ManagedBy         = "terraform"
    EnvironmentSuffix = var.environment_suffix
  }
}
