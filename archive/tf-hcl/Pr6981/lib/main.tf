# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment          = var.environment
  environment_suffix   = var.environment_suffix
  project_name         = var.project_name
  vpc_cidr             = var.vpc_cidr
  azs                  = var.azs
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "VPC"
    }
  )
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "SecurityGroups"
    }
  )
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  db_subnet_ids      = module.vpc.private_subnet_ids
  instance_class     = var.rds_instance_class
  allocated_storage  = var.rds_allocated_storage
  username           = var.rds_username
  security_group_ids = [module.security_groups.rds_security_group_id]

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "RDS"
    }
  )
}

# Lambda Module
module "lambda" {
  source = "./modules/lambda"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  memory_size        = var.lambda_memory_size
  timeout            = var.lambda_timeout
  security_group_ids = [module.security_groups.lambda_security_group_id]
  log_retention_days = var.log_retention_days

  # Pass RDS connection info
  db_host     = module.rds.db_endpoint
  db_name     = module.rds.db_name
  db_username = module.rds.db_username
  db_password = module.rds.db_password

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "Lambda"
    }
  )
}

# CloudWatch Logs Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  retention_days     = var.log_retention_days

  tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Module      = "CloudWatch"
    }
  )
}
