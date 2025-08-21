# Centralized local variables and environment detection

locals {
  # Environment detection - treat default workspace as staging
  env = terraform.workspace == "production" ? "production" : "staging"
  
  # Common tags for all resources
  common_tags = {
    Project     = var.project_name
    Environment = local.env
    ManagedBy   = "terraform"
    Repository  = "iac-test-automations"
  }
  
  # Environment-specific configurations
  environment_config = {
    staging = {
      region = var.staging_region
    }
    production = {
      region = var.production_region
    }
  }
  
  # Current environment configuration
  current_env_config = local.environment_config[local.env]
}
