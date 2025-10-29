# Create production spoke VPC
module "vpc_production" {
  source = "./modules/spoke-vpc"

  vpc_cidr           = var.production_vpc_cidr
  environment        = "production"
  region             = var.region
  purpose            = "workloads"
  name_suffix        = local.name_suffix
  availability_zones = local.selected_azs

  tags = local.production_tags
}

# Create development spoke VPC
module "vpc_development" {
  source = "./modules/spoke-vpc"

  vpc_cidr           = var.development_vpc_cidr
  environment        = "development"
  region             = var.region
  purpose            = "workloads"
  name_suffix        = local.name_suffix
  availability_zones = local.selected_azs

  tags = local.development_tags
}
