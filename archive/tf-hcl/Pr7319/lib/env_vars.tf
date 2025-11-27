# Fetch ENVIRONMENT_SUFFIX from environment variable
data "external" "environment" {
  program = ["sh", "-c", "echo \"{\\\"suffix\\\":\\\"$${ENVIRONMENT_SUFFIX:-}\\\"}\""]
}

locals {
  # Use environment variable if var.environment_suffix is not set, fallback to data source
  environment_suffix = length(var.environment_suffix) > 0 ? var.environment_suffix : data.external.environment.result.suffix
}

# Validation for environment_suffix
resource "null_resource" "validate_environment_suffix" {
  lifecycle {
    precondition {
      condition     = length(local.environment_suffix) > 0 && length(local.environment_suffix) <= 10
      error_message = "environment_suffix must be between 1 and 10 characters. Current value: '${local.environment_suffix}'"
    }
  }
}
