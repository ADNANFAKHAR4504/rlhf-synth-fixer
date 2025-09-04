# Data sources for resource lookups and references

# Get current AWS account information
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}

# Get default VPC (if needed for fallback)
data "aws_vpc" "default" {
  count   = 0  # Disabled by default, enable if needed
  default = true
}

# Get availability zones for the current region
data "aws_availability_zones" "available" {
  state = "available"
}
