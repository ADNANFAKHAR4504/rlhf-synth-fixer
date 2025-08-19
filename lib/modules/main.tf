module "networking" {
  source = "./networking"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "security" {
  source = "./security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.networking.vpc_id
  vpc_cidr     = var.vpc_cidr
}

module "iam" {
  source = "./iam"

  project_name = var.project_name
  environment  = var.environment
}

module "storage" {
  source = "./storage"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  private_route_table_ids = module.networking.private_route_table_ids
  account_id            = var.account_id
}

module "database" {
  source = "./database"

  project_name       = var.project_name
  environment        = var.environment
  private_subnet_ids = module.networking.private_subnet_ids
  rds_sg_id          = module.security.rds_sg_id
  db_username        = var.db_username
  db_password        = var.db_password
}

module "compute" {
  source = "./compute"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  ec2_sg_id             = module.security.ec2_sg_id
  alb_sg_id             = module.security.alb_sg_id
  instance_profile_name = module.iam.ec2_instance_profile_name
  ami_id                = var.ami_id
  instance_type         = var.instance_type
}

module "monitoring" {
  source = "./monitoring"

  project_name = var.project_name
}
