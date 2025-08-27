locals {
  # Create a clean suffix for resource naming
  name_suffix = var.environment_suffix != "" ? "-${var.environment_suffix}" : ""

  # Shortened base name for resources with AWS name length limits
  short_project_name = "srvls-ms" # serverless-microservices shortened

  # Base name for all resources including environment suffix
  resource_prefix = "${local.short_project_name}${local.name_suffix}"

  common_tags = {
    Project           = var.project_name
    Environment       = var.environment
    EnvironmentSuffix = var.environment_suffix
    ManagedBy         = "terraform"
  }

  lambda_functions = {
    health = {
      handler  = "health_service.lambda_handler"
      filename = "health_service.py"
    }
    user = {
      handler  = "user_service.lambda_handler"
      filename = "user_service.py"
    }
    notification = {
      handler  = "notification_service.lambda_handler"
      filename = "notification_service.py"
    }
  }
}