# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = data.aws_availability_zones.available.names
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  common_tags         = var.common_tags
}

# Secrets Manager Module
module "secrets" {
  source = "./modules/secrets"
  
  secrets_config = var.secrets_config
  common_tags   = var.common_tags
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  secrets_policy_arn = module.secrets.secrets_access_policy_arn
  common_tags       = var.common_tags
  
  depends_on = [module.secrets]
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  vpc_id            = module.vpc.vpc_id
  common_tags       = var.common_tags
  log_retention_days = var.log_retention_days
  
  depends_on = [module.vpc]
}

# EC2 Module
module "ec2" {
  source = "./modules/ec2"
  
  instance_type           = var.instance_type
  vpc_id                 = module.vpc.vpc_id
  public_subnet_ids      = module.vpc.public_subnet_ids
  private_subnet_ids     = module.vpc.private_subnet_ids
  ec2_instance_profile   = module.iam.ec2_instance_profile_name
  web_security_group_id  = module.vpc.web_security_group_id
  log_group_name        = module.monitoring.log_group_name
  common_tags           = var.common_tags
  
  depends_on = [module.vpc, module.iam, module.monitoring]
}