# Get current AWS account ID and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  project_name         = var.project_name
  environment          = var.environment
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  project_name = var.project_name
  environment  = var.environment
}

# Security Module
module "security" {
  source = "./modules/security"
  
  vpc_id           = module.vpc.vpc_id
  allowed_ssh_cidr = var.allowed_ssh_cidr
  project_name     = var.project_name
  environment      = var.environment
}

# Storage Module
module "storage" {
  source = "./modules/storage"
  
  project_name = var.project_name
  environment  = var.environment
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
}