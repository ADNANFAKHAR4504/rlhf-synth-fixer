module "hub_vpc_endpoints" {
  source = "./modules/vpc-endpoints"

  providers = {
    aws = aws.hub
  }

  vpc_id               = module.hub_vpc.vpc_id
  subnet_ids           = module.hub_vpc.private_subnet_ids
  vpc_cidr             = var.hub_vpc_cidr
  region               = "us-east-1"
  endpoint_name_prefix = "hub"
  environment_suffix   = local.env_suffix
  project_tags         = local.common_tags
}

module "uswest_vpc_endpoints" {
  source = "./modules/vpc-endpoints"

  providers = {
    aws = aws.us_west
  }

  vpc_id               = module.uswest_vpc.vpc_id
  subnet_ids           = module.uswest_vpc.private_subnet_ids
  vpc_cidr             = var.uswest_vpc_cidr
  region               = "us-west-2"
  endpoint_name_prefix = "uswest-spoke"
  environment_suffix   = local.env_suffix
  project_tags         = local.common_tags
}

module "europe_vpc_endpoints" {
  source = "./modules/vpc-endpoints"

  providers = {
    aws = aws.europe
  }

  vpc_id               = module.europe_vpc.vpc_id
  subnet_ids           = module.europe_vpc.private_subnet_ids
  vpc_cidr             = var.europe_vpc_cidr
  region               = "eu-west-1"
  endpoint_name_prefix = "europe-spoke"
  environment_suffix   = local.env_suffix
  project_tags         = local.common_tags
}
