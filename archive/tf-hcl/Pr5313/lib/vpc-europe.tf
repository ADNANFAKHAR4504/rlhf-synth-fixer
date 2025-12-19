module "europe_vpc" {
  source = "./modules/vpc"

  providers = {
    aws = aws.europe
  }

  environment          = var.environment
  vpc_cidr             = var.europe_vpc_cidr
  region               = "eu-west-1"
  availability_zones   = local.europe_azs
  public_subnet_cidrs  = var.europe_public_subnet_cidrs
  private_subnet_cidrs = var.europe_private_subnet_cidrs
  vpc_name             = "europe-spoke-vpc"
  environment_suffix   = local.env_suffix
  project_tags         = local.common_tags
}
