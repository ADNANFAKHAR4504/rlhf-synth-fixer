# VPC Module
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  project_name         = "${var.project_name}-${var.environment_suffix}"
  tags                 = var.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security-groups"

  vpc_id           = module.vpc.vpc_id
  project_name     = "${var.project_name}-${var.environment_suffix}"
  allowed_ssh_cidr = var.allowed_ssh_cidr
  tags             = var.common_tags
}
