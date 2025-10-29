module "uswest_vpc" {
  source = "./modules/vpc"

  providers = {
    aws = aws.us_west
  }

  environment          = var.environment
  vpc_cidr             = var.uswest_vpc_cidr
  region               = "us-west-2"
  availability_zones   = local.uswest_azs
  public_subnet_cidrs  = var.uswest_public_subnet_cidrs
  private_subnet_cidrs = var.uswest_private_subnet_cidrs
  vpc_name             = "uswest-spoke-vpc"
  environment_suffix   = local.env_suffix
  project_tags         = local.common_tags
}
