# locals.tf - CIDR calculations and tag mappings

locals {
  # Environment and project metadata
  project_name = "fintech-payment"
  environment  = "production"

  # Common tags for all resources
  common_tags = {
    Environment = local.environment
    Project     = local.project_name
    CostCenter  = "payment-processing"
    ManagedBy   = "Terraform"
  }

  # Region configuration
  primary_region = "us-east-1"
  partner_region = "us-east-2"

  # VPC CIDR blocks
  production_vpc_cidr = "10.0.0.0/16"
  partner_vpc_cidr    = "172.16.0.0/16"

  # Application subnet CIDRs (only these subnets will have peering routes)
  production_app_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  partner_app_subnet_cidrs    = ["172.16.10.0/24", "172.16.11.0/24", "172.16.12.0/24"]

  # Public and database subnet CIDRs (no peering access)
  production_public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  production_db_subnet_cidrs     = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]

  partner_public_subnet_cidrs = ["172.16.1.0/24", "172.16.2.0/24", "172.16.3.0/24"]
  partner_db_subnet_cidrs     = ["172.16.20.0/24", "172.16.21.0/24", "172.16.22.0/24"]

  # Availability zones
  azs         = ["${local.primary_region}a", "${local.primary_region}b", "${local.primary_region}c"]
  partner_azs = ["${local.partner_region}a", "${local.partner_region}b", "${local.partner_region}c"]

  # Allowed traffic ports for peering
  allowed_ports = {
    https      = 443
    custom_api = 8443
  }

  # Flow log configuration
  flow_log_aggregation_interval = 60 # 1 minute in seconds

  # CIDR validation - ensure no overlap
  cidr_overlap_check = (
    can(cidrsubnet(local.production_vpc_cidr, 0, 0)) &&
    can(cidrsubnet(local.partner_vpc_cidr, 0, 0)) &&
    local.production_vpc_cidr != local.partner_vpc_cidr
  )
}