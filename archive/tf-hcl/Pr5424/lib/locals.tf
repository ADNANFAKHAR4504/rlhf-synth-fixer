# Local values for computed resource attributes
locals {
  # Compute actual environment suffix - use provided value or generate random
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.suffix[0].result

  # Resource naming prefix
  name_prefix = "${var.project_name}-${local.environment_suffix}"

  # VPC ID - use created or existing
  vpc_id = var.create_vpc ? aws_vpc.main[0].id : var.vpc_id

  # Subnet IDs - use created or existing
  private_subnet_ids = var.create_vpc ? aws_subnet.private[*].id : var.private_subnet_ids
  public_subnet_ids  = var.create_vpc ? aws_subnet.public[*].id : var.public_subnet_ids

  # Availability zone calculations
  available_az_names = try(data.aws_availability_zones.available.names, [])
  az_count           = min(var.availability_zones_count, length(local.available_az_names))
  azs                = slice(local.available_az_names, 0, local.az_count)

  # Common tags to apply to all resources
  common_tags = merge(
    var.common_tags,
    {
      EnvironmentSuffix = local.environment_suffix
      Region            = var.aws_region
    }
  )
}

# Generate random suffix if not provided
resource "random_string" "suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

