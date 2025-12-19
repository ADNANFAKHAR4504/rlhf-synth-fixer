locals {
  common_tags = { Environment = "Production" }
}

module "secrets" {
  source             = "./modules/secrets"
  project            = var.project
  db_password_length = var.db_password_length
  common_tags        = local.common_tags
}

module "vpc" {
  source              = "./modules/vpc"
  project             = var.project
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidr  = var.public_subnet_cidr
  private_subnet_cidr = var.private_subnet_cidr
  common_tags         = local.common_tags
}

module "security_group" {
  source      = "./modules/security_group"
  project     = var.project
  vpc_id      = module.vpc.vpc_id
  common_tags = local.common_tags
}

module "iam" {
  source      = "./modules/iam"
  project     = var.project
  secret_arn  = module.secrets.secret_arn
  common_tags = local.common_tags
}

module "ec2" {
  source               = "./modules/ec2"
  project              = var.project
  ec2_instance_type    = var.ec2_instance_type
  key_pair_name        = var.key_pair_name
  public_subnet_id     = module.vpc.public_subnet_id
  private_subnet_id    = module.vpc.private_subnet_id
  bastion_sg_id        = module.sg.bastion_sg_id
  private_sg_id        = module.sg.private_sg_id
  iam_instance_profile = module.iam.iam_instance_profile
  common_tags          = local.common_tags
}
