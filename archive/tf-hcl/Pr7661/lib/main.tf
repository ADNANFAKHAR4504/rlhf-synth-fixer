locals {
  environment = terraform.workspace
  name_prefix = "${var.project_name}-${local.environment}-${var.environment_suffix}"
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store database credentials in Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name                           = "${local.name_prefix}-db-credentials"
  recovery_window_in_days        = 0
  force_overwrite_replica_secret = true

  tags = {
    Name = "${local.name_prefix}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = module.database.db_endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  environment        = local.environment
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  name_prefix                = local.name_prefix
  vpc_id                     = module.vpc.vpc_id
  public_subnet_ids          = module.vpc.public_subnet_ids
  private_subnet_ids         = module.vpc.private_subnet_ids
  alb_security_group_id      = module.vpc.alb_security_group_id
  instance_security_group_id = module.vpc.instance_security_group_id

  instance_type    = var.instance_type
  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  enable_ssl          = var.enable_ssl
  ssl_certificate_arn = var.ssl_certificate_arn
  environment         = local.environment
}

# Database Module
module "database" {
  source = "./modules/database"

  name_prefix          = local.name_prefix
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  db_security_group_id = module.vpc.db_security_group_id

  db_instance_class        = var.db_instance_class
  db_name                  = var.db_name
  db_username              = var.db_username
  db_password              = random_password.db_password.result
  db_backup_retention_days = var.db_backup_retention_days
  db_multi_az              = var.db_multi_az
  environment              = local.environment
}

# Storage Module
module "storage" {
  source = "./modules/storage"

  name_prefix       = local.name_prefix
  enable_versioning = var.enable_s3_versioning
  lifecycle_days    = var.s3_lifecycle_days
  environment       = local.environment
}