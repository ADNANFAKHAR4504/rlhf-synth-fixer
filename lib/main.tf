# Data sources for existing resources and dynamic values
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Networking Module
module "networking" {
  source = "./modules/networking"
  
  project_name        = var.project_name
  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = data.aws_availability_zones.available.names
  enable_nat_gateway = var.enable_nat_gateway
}

# Storage Module (S3)
module "storage" {
  source = "./modules/storage"
  
  project_name = var.project_name
  environment  = var.environment
}

# Database Module
module "database" {
  source = "./modules/database"
  
  project_name           = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  db_instance_class     = var.db_instance_class
  db_name               = var.db_name
  db_username           = var.db_username
  enable_encryption     = var.enable_encryption
}

# Compute Module
module "compute" {
  source = "./modules/compute"
  
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  s3_bucket_arn      = module.storage.s3_bucket_arn
  instance_type      = var.instance_type
  key_name           = var.key_name
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name    = var.project_name
  environment     = var.environment
  instance_ids    = module.compute.instance_ids
  db_instance_id  = module.database.db_instance_id
  sns_email       = var.sns_email
}