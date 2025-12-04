locals {
  project_name = "payments"
  environment  = var.environment
  region       = var.aws_region

  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Owner       = "SecurityTeam"
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }

  # Environment-specific settings
  env_config = {
    dev = {
      multi_az            = false
      deletion_protection = false
    }
    staging = {
      multi_az            = false
      deletion_protection = false
    }
    prod = {
      multi_az            = true
      deletion_protection = true
    }
  }
}

# Generate secure RDS password if not provided
resource "random_password" "db_password" {
  count            = var.db_password == "" ? 1 : 0
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# KMS Key Module
module "kms" {
  source = "./modules/kms"

  environment  = var.environment
  project_name = local.project_name
  common_tags  = local.common_tags
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment  = var.environment
  project_name = local.project_name
  vpc_cidr     = var.vpc_cidr
  region       = var.aws_region
  common_tags  = local.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  environment  = var.environment
  project_name = local.project_name
  vpc_id       = module.vpc.vpc_id
  common_tags  = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment             = var.environment
  project_name            = local.project_name
  db_instance_class       = var.db_instance_class
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password != "" ? var.db_password : random_password.db_password[0].result
  backup_retention_period = var.rds_backup_retention
  multi_az                = local.env_config[var.environment].multi_az
  deletion_protection     = local.env_config[var.environment].deletion_protection
  subnet_ids              = module.vpc.private_subnet_ids
  kms_key_id              = module.kms.key_arn
  security_group_id       = module.security_groups.rds_sg_id
  common_tags             = local.common_tags
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment    = var.environment
  project_name   = local.project_name
  kms_key_id     = module.kms.key_id
  lifecycle_days = var.s3_lifecycle_days
  common_tags    = local.common_tags
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  environment       = var.environment
  project_name      = local.project_name
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.public_subnet_ids
  security_group_id = module.security_groups.alb_sg_id
  common_tags       = local.common_tags
}

# ASG Module
module "asg" {
  source = "./modules/asg"

  environment       = var.environment
  project_name      = local.project_name
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_id = module.security_groups.ec2_sg_id
  target_group_arns = [module.alb.target_group_arn]
  instance_type     = var.instance_type
  min_size          = var.asg_min
  max_size          = var.asg_max
  s3_bucket_arn     = module.s3.bucket_arn
  common_tags       = local.common_tags
}
