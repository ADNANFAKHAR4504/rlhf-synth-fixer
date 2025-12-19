# VPC endpoints for hub
module "vpc_endpoints_hub" {
  count = var.enable_vpc_endpoints ? 1 : 0

  source = "./modules/vpc-endpoints"

  name_prefix = "hub-${var.region}"
  name_suffix = local.name_suffix
  vpc_id      = module.vpc_hub.vpc_id
  vpc_cidr    = module.vpc_hub.vpc_cidr
  subnet_ids  = module.vpc_hub.private_subnet_ids
  region      = var.region

  tags = local.hub_tags
}

# VPC endpoints for production
module "vpc_endpoints_production" {
  count = var.enable_vpc_endpoints ? 1 : 0

  source = "./modules/vpc-endpoints"

  name_prefix = "production-${var.region}"
  name_suffix = local.name_suffix
  vpc_id      = module.vpc_production.vpc_id
  vpc_cidr    = module.vpc_production.vpc_cidr
  subnet_ids  = module.vpc_production.private_subnet_ids
  region      = var.region

  tags = local.production_tags
}

# VPC endpoints for development
module "vpc_endpoints_development" {
  count = var.enable_vpc_endpoints ? 1 : 0

  source = "./modules/vpc-endpoints"

  name_prefix = "development-${var.region}"
  name_suffix = local.name_suffix
  vpc_id      = module.vpc_development.vpc_id
  vpc_cidr    = module.vpc_development.vpc_cidr
  subnet_ids  = module.vpc_development.private_subnet_ids
  region      = var.region

  tags = local.development_tags
}
