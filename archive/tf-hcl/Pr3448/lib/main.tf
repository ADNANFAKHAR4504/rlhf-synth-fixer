# Helper maps to drive per-index modules
locals {
  idx_map = {
    for idx, r in local.regions_padded : idx => r
  }
}

# Region 0 stack
module "kms_r0" {
  count       = local.region0 != null ? 1 : 0
  source      = "./modules/security"
  providers   = { aws = aws.r0 }
  environment = var.environment
  region      = local.region0
  name_prefix = local.name_prefix
}

module "networking_r0" {
  count              = local.region0 != null ? 1 : 0
  source             = "./modules/networking"
  providers          = { aws = aws.r0 }
  environment        = var.environment
  region             = local.region0
  vpc_cidr           = var.vpc_cidrs[local.region0]
  availability_zones = var.availability_zones_per_region
  public_subnets     = local.subnet_cidrs[local.region0].public
  private_subnets    = local.subnet_cidrs[local.region0].private
  database_subnets   = local.subnet_cidrs[local.region0].database
  name_prefix        = local.name_prefix
  kms_key_id         = module.kms_r0[0].kms_key_id
}

module "compute_r0" {
  count                = local.region0 != null ? 1 : 0
  source               = "./modules/compute"
  providers            = { aws = aws.r0 }
  depends_on           = [module.networking_r0]
  environment          = var.environment
  region               = local.region0
  vpc_id               = module.networking_r0[0].vpc_id
  private_subnet_ids   = module.networking_r0[0].private_subnet_ids
  public_subnet_ids    = module.networking_r0[0].public_subnet_ids
  instance_type        = var.instance_type
  min_size             = var.asg_min_size
  max_size             = var.asg_max_size
  desired_capacity     = var.asg_desired_capacity
  name_prefix          = local.name_prefix
  kms_key_id           = module.kms_r0[0].kms_key_id
  iam_instance_profile = module.kms_r0[0].instance_profile_name
}

module "database_r0" {
  count                   = local.region0 != null ? 1 : 0
  source                  = "./modules/database"
  providers               = { aws = aws.r0 }
  depends_on              = [module.networking_r0, module.kms_r0]
  environment             = var.environment
  region                  = local.region0
  vpc_id                  = module.networking_r0[0].vpc_id
  database_subnet_ids     = module.networking_r0[0].database_subnet_ids
  instance_class          = var.rds_instance_class
  engine                  = var.rds_engine
  engine_version          = var.rds_engine_version
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
  maintenance_window      = var.rds_maintenance_window
  backup_window           = var.rds_backup_window
  master_password         = random_password.rds_master.result
  name_prefix             = local.name_prefix
  kms_key_id              = module.kms_r0[0].kms_key_id
  security_group_id       = module.compute_r0[0].app_security_group_id
}

module "monitoring_r0" {
  count               = local.region0 != null ? 1 : 0
  source              = "./modules/monitoring"
  providers           = { aws = aws.r0 }
  depends_on          = [module.compute_r0, module.database_r0]
  environment         = var.environment
  region              = local.region0
  name_prefix         = local.name_prefix
  kms_key_id          = module.kms_r0[0].kms_key_id
  retention_days      = var.cloudtrail_retention_days
  alarm_email         = var.alarm_email
  vpc_id              = module.networking_r0[0].vpc_id
  alb_arn_suffix      = module.compute_r0[0].alb_arn_suffix
  asg_name            = module.compute_r0[0].asg_name
  rds_instance_id     = module.database_r0[0].rds_instance_id
  dynamodb_table_name = module.database_r0[0].dynamodb_table_name
}

# Region 1 stack
module "kms_r1" {
  count       = local.region1 != null ? 1 : 0
  source      = "./modules/security"
  providers   = { aws = aws.r1 }
  environment = var.environment
  region      = local.region1
  name_prefix = local.name_prefix
}

module "networking_r1" {
  count              = local.region1 != null ? 1 : 0
  source             = "./modules/networking"
  providers          = { aws = aws.r1 }
  environment        = var.environment
  region             = local.region1
  vpc_cidr           = var.vpc_cidrs[local.region1]
  availability_zones = var.availability_zones_per_region
  public_subnets     = local.subnet_cidrs[local.region1].public
  private_subnets    = local.subnet_cidrs[local.region1].private
  database_subnets   = local.subnet_cidrs[local.region1].database
  name_prefix        = local.name_prefix
  kms_key_id         = module.kms_r1[0].kms_key_id
}

module "compute_r1" {
  count                = local.region1 != null ? 1 : 0
  source               = "./modules/compute"
  providers            = { aws = aws.r1 }
  depends_on           = [module.networking_r1]
  environment          = var.environment
  region               = local.region1
  vpc_id               = module.networking_r1[0].vpc_id
  private_subnet_ids   = module.networking_r1[0].private_subnet_ids
  public_subnet_ids    = module.networking_r1[0].public_subnet_ids
  instance_type        = var.instance_type
  min_size             = var.asg_min_size
  max_size             = var.asg_max_size
  desired_capacity     = var.asg_desired_capacity
  name_prefix          = local.name_prefix
  kms_key_id           = module.kms_r1[0].kms_key_id
  iam_instance_profile = module.kms_r1[0].instance_profile_name
}

module "database_r1" {
  count                   = local.region1 != null ? 1 : 0
  source                  = "./modules/database"
  providers               = { aws = aws.r1 }
  depends_on              = [module.networking_r1, module.kms_r1]
  environment             = var.environment
  region                  = local.region1
  vpc_id                  = module.networking_r1[0].vpc_id
  database_subnet_ids     = module.networking_r1[0].database_subnet_ids
  instance_class          = var.rds_instance_class
  engine                  = var.rds_engine
  engine_version          = var.rds_engine_version
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
  maintenance_window      = var.rds_maintenance_window
  backup_window           = var.rds_backup_window
  master_password         = random_password.rds_master.result
  name_prefix             = local.name_prefix
  kms_key_id              = module.kms_r1[0].kms_key_id
  security_group_id       = module.compute_r1[0].app_security_group_id
}

module "monitoring_r1" {
  count               = local.region1 != null ? 1 : 0
  source              = "./modules/monitoring"
  providers           = { aws = aws.r1 }
  depends_on          = [module.compute_r1, module.database_r1]
  environment         = var.environment
  region              = local.region1
  name_prefix         = local.name_prefix
  kms_key_id          = module.kms_r1[0].kms_key_id
  retention_days      = var.cloudtrail_retention_days
  alarm_email         = var.alarm_email
  vpc_id              = module.networking_r1[0].vpc_id
  alb_arn_suffix      = module.compute_r1[0].alb_arn_suffix
  asg_name            = module.compute_r1[0].asg_name
  rds_instance_id     = module.database_r1[0].rds_instance_id
  dynamodb_table_name = module.database_r1[0].dynamodb_table_name
}

# Region 2 stack
module "kms_r2" {
  count       = local.region2 != null ? 1 : 0
  source      = "./modules/security"
  providers   = { aws = aws.r2 }
  environment = var.environment
  region      = local.region2
  name_prefix = local.name_prefix
}

module "networking_r2" {
  count              = local.region2 != null ? 1 : 0
  source             = "./modules/networking"
  providers          = { aws = aws.r2 }
  environment        = var.environment
  region             = local.region2
  vpc_cidr           = var.vpc_cidrs[local.region2]
  availability_zones = var.availability_zones_per_region
  public_subnets     = local.subnet_cidrs[local.region2].public
  private_subnets    = local.subnet_cidrs[local.region2].private
  database_subnets   = local.subnet_cidrs[local.region2].database
  name_prefix        = local.name_prefix
  kms_key_id         = module.kms_r2[0].kms_key_id
}

module "compute_r2" {
  count                = local.region2 != null ? 1 : 0
  source               = "./modules/compute"
  providers            = { aws = aws.r2 }
  depends_on           = [module.networking_r2]
  environment          = var.environment
  region               = local.region2
  vpc_id               = module.networking_r2[0].vpc_id
  private_subnet_ids   = module.networking_r2[0].private_subnet_ids
  public_subnet_ids    = module.networking_r2[0].public_subnet_ids
  instance_type        = var.instance_type
  min_size             = var.asg_min_size
  max_size             = var.asg_max_size
  desired_capacity     = var.asg_desired_capacity
  name_prefix          = local.name_prefix
  kms_key_id           = module.kms_r2[0].kms_key_id
  iam_instance_profile = module.kms_r2[0].instance_profile_name
}

module "database_r2" {
  count                   = local.region2 != null ? 1 : 0
  source                  = "./modules/database"
  providers               = { aws = aws.r2 }
  depends_on              = [module.networking_r2, module.kms_r2]
  environment             = var.environment
  region                  = local.region2
  vpc_id                  = module.networking_r2[0].vpc_id
  database_subnet_ids     = module.networking_r2[0].database_subnet_ids
  instance_class          = var.rds_instance_class
  engine                  = var.rds_engine
  engine_version          = var.rds_engine_version
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
  maintenance_window      = var.rds_maintenance_window
  backup_window           = var.rds_backup_window
  master_password         = random_password.rds_master.result
  name_prefix             = local.name_prefix
  kms_key_id              = module.kms_r2[0].kms_key_id
  security_group_id       = module.compute_r2[0].app_security_group_id
}

module "monitoring_r2" {
  count               = local.region2 != null ? 1 : 0
  source              = "./modules/monitoring"
  providers           = { aws = aws.r2 }
  depends_on          = [module.compute_r2, module.database_r2]
  environment         = var.environment
  region              = local.region2
  name_prefix         = local.name_prefix
  kms_key_id          = module.kms_r2[0].kms_key_id
  retention_days      = var.cloudtrail_retention_days
  alarm_email         = var.alarm_email
  vpc_id              = module.networking_r2[0].vpc_id
  alb_arn_suffix      = module.compute_r2[0].alb_arn_suffix
  asg_name            = module.compute_r2[0].asg_name
  rds_instance_id     = module.database_r2[0].rds_instance_id
  dynamodb_table_name = module.database_r2[0].dynamodb_table_name
}


