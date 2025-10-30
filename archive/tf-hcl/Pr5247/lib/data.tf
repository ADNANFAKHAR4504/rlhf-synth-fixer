# data.tf - Data sources for dynamic resource selection

# Get current AWS region
data "aws_region" "current" {}

# Get current AWS caller identity
data "aws_caller_identity" "current" {}

# Dynamically get availability zones for the current region
# Filter to get only available AZs and select exactly 3
data "aws_availability_zones" "available" {
  state = "available"

  # Exclude any AZs that might have limited instance types
  exclude_names = []

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Local validation to ensure we have at least 3 AZs
locals {
  # Select exactly 3 AZs from available ones
  selected_azs = slice(data.aws_availability_zones.available.names, 0, var.availability_zones_count)

  # Validation: ensure we have enough AZs
  az_validation = length(data.aws_availability_zones.available.names) >= var.availability_zones_count ? true : tobool("Region ${var.aws_region} does not have enough availability zones. Required: ${var.availability_zones_count}, Available: ${length(data.aws_availability_zones.available.names)}")
}