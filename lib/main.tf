# main.tf

locals {
  environment = terraform.workspace
  
  # Environment-specific configurations
  env_config = {
    dev = {
      vpc_cidr           = "${var.vpc_cidr_base}.0.0/16"
      instance_class     = "db.t3.micro"
      multi_az          = false
      task_count        = 1
      task_cpu          = 256
      task_memory       = 512
      log_retention     = 7
      s3_lifecycle_days = 30
      min_capacity      = 1
      max_capacity      = 2
    }
    staging = {
      vpc_cidr           = "${var.vpc_cidr_base}.16.0/16"
      instance_class     = "db.t3.small"
      multi_az          = false
      task_count        = 1
      task_cpu          = 512
      task_memory       = 1024
      log_retention     = 30
      s3_lifecycle_days = 60
      min_capacity      = 1
      max_capacity      = 3
    }
    prod = {
      vpc_cidr           = "${var.vpc_cidr_base}.32.0/16"
      instance_class     = "db.r6g.large"
      multi_az          = true
      task_count        = 3
      task_cpu          = 1024
      task_memory       = 2048
      log_retention     = 90
      s3_lifecycle_days = 90
      min_capacity      = 3
      max_capacity      = 10
    }
  }
  
  current_env_config = local.env_config[local.environment]
  
  common_tags = {
    Environment = local.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
  }
  
  resource_prefix = "${var.project_name}-${local.environment}"
}

# Network Module
module "network" {
  source = "./modules/network"
  
  vpc_cidr        = local.current_env_config.vpc_cidr
  environment     = local.environment
  project_name    = var.project_name
  azs             = data.aws_availability_zones.available.names
  tags            = local.common_tags
}

# Database Module
module "database" {
  source = "./modules/database"
  
  environment         = local.environment
  project_name       = var.project_name
  subnet_ids         = module.network.private_subnet_ids
  vpc_id            = module.network.vpc_id
  instance_class    = local.current_env_config.instance_class
  multi_az         = local.current_env_config.multi_az
  db_username      = var.db_username
  db_password      = var.db_password
  app_security_group_id = module.compute.ecs_security_group_id
  tags             = local.common_tags
}

# Storage Module
module "storage" {
  source = "./modules/storage"
  
  environment         = local.environment
  project_name       = var.project_name
  lifecycle_days     = local.current_env_config.s3_lifecycle_days
  tags               = local.common_tags
}

# Compute Module
module "compute" {
  source = "./modules/compute"
  
  environment            = local.environment
  project_name          = var.project_name
  vpc_id                = module.network.vpc_id
  public_subnet_ids     = module.network.public_subnet_ids
  private_subnet_ids    = module.network.private_subnet_ids
  task_count           = local.current_env_config.task_count
  task_cpu            = local.current_env_config.task_cpu
  task_memory         = local.current_env_config.task_memory
  container_image     = var.container_image
  s3_bucket_arn      = module.storage.bucket_arn
  db_endpoint        = module.database.db_endpoint
  db_name           = module.database.db_name
  db_username       = var.db_username
  db_password       = var.db_password
  log_retention     = local.current_env_config.log_retention
  certificate_arn   = var.alb_certificate_arn
  min_capacity     = local.current_env_config.min_capacity
  max_capacity     = local.current_env_config.max_capacity
  tags             = local.common_tags
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
