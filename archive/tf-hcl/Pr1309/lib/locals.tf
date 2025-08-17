# Local values for resource naming
locals {
  # Get environment suffix from environment variable or use default
  environment_suffix = coalesce(
    var.environment_suffix != "" ? var.environment_suffix : null,
    "synthtrainr861"
  )

  # Construct resource prefix with environment suffix
  resource_prefix = "${var.project_name}-${local.environment_suffix}"

  # Common tags with environment suffix
  common_tags = merge(var.common_tags, {
    EnvironmentSuffix = local.environment_suffix
  })
}