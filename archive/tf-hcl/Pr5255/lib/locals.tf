# Random suffix for unique resource naming (fallback when environment_suffix not provided)
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  # Select the required number of AZs
  selected_azs = slice(data.aws_availability_zones.available.names, 0, var.availability_zone_count)

  # Use environment_suffix if provided (from ENVIRONMENT_SUFFIX env var), otherwise use random suffix
  name_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.suffix.result

  # Common tags applied to all resources
  common_tags = {
    Environment = "shared"
    Project     = var.project
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
  }

  # Environment-specific tags
  hub_tags = merge(local.common_tags, {
    Environment = "hub"
    Purpose     = "networking"
  })

  production_tags = merge(local.common_tags, {
    Environment = "production"
    Purpose     = "workloads"
  })

  development_tags = merge(local.common_tags, {
    Environment = "development"
    Purpose     = "workloads"
  })
}
