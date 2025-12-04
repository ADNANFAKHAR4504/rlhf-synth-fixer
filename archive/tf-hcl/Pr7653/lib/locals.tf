locals {
  current_region = terraform.workspace == "primary" ? "us-east-1" : "eu-west-1"
  other_region   = terraform.workspace == "primary" ? "eu-west-1" : "us-east-1"

  # Workspace-specific configuration
  is_primary = terraform.workspace == "primary"

  # Resource naming with environment suffix
  resource_prefix = "${var.project_name}-${var.environment_suffix}"

  # Availability zones
  azs_primary   = ["us-east-1a", "us-east-1b", "us-east-1c"]
  azs_secondary = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

  current_azs = local.is_primary ? local.azs_primary : local.azs_secondary

  # Subnet CIDRs
  primary_public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  primary_private_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]

  secondary_public_subnets  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  secondary_private_subnets = ["10.1.10.0/24", "10.1.11.0/24", "10.1.12.0/24"]

  current_public_subnets  = local.is_primary ? local.primary_public_subnets : local.secondary_public_subnets
  current_private_subnets = local.is_primary ? local.primary_private_subnets : local.secondary_private_subnets
  current_vpc_cidr        = local.is_primary ? var.vpc_cidr_primary : var.vpc_cidr_secondary
  other_vpc_cidr          = local.is_primary ? var.vpc_cidr_secondary : var.vpc_cidr_primary

  common_tags = {
    Project     = var.project_name
    Environment = var.environment_suffix
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }
}
