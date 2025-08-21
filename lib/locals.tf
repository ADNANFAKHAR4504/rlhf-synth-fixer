# Centralized local variables and environment detection

locals {
  # Environment detection from workspace prefix (myapp-staging, myapp-production)
  env = replace(terraform.workspace, "myapp-", "")
  
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
