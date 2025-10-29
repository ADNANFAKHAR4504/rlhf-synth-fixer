module "hub_vpc" {
  source = "./modules/vpc"

  providers = {
    aws = aws.hub
  }

  environment          = var.environment
  vpc_cidr             = var.hub_vpc_cidr
  region               = "us-east-1"
  availability_zones   = local.hub_azs
  public_subnet_cidrs  = var.hub_public_subnet_cidrs
  private_subnet_cidrs = var.hub_private_subnet_cidrs
  vpc_name             = "hub-vpc"
  environment_suffix   = local.env_suffix
  project_tags         = local.common_tags
}
