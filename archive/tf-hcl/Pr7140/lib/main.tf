# Primary Region VPC
module "vpc_primary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  vpc_cidr           = var.primary_vpc_cidr
  region             = var.primary_region
  region_name        = "primary"

  tags = merge(var.common_tags, {
    Region = var.primary_region
  })
}

# DR Region VPC
module "vpc_dr" {
  source = "./modules/vpc"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  vpc_cidr           = var.dr_vpc_cidr
  region             = var.dr_region
  region_name        = "dr"

  tags = merge(var.common_tags, {
    Region = var.dr_region
  })
}

# Aurora Global Database
module "aurora_global" {
  source = "./modules/aurora"

  providers = {
    aws.primary = aws.primary
    aws.dr      = aws.dr
  }

  environment_suffix = var.environment_suffix
  primary_region     = var.primary_region
  dr_region          = var.dr_region
  db_master_username = var.db_master_username
  db_master_password = var.db_master_password

  primary_subnet_ids = module.vpc_primary.private_subnet_ids
  primary_vpc_id     = module.vpc_primary.vpc_id
  dr_subnet_ids      = module.vpc_dr.private_subnet_ids
  dr_vpc_id          = module.vpc_dr.vpc_id

  replication_lag_threshold = var.replication_lag_threshold

  tags = var.common_tags
}

# ECS Primary Region
module "ecs_primary" {
  source = "./modules/ecs"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region             = var.primary_region
  region_name        = "primary"

  vpc_id             = module.vpc_primary.vpc_id
  private_subnet_ids = module.vpc_primary.private_subnet_ids
  public_subnet_ids  = module.vpc_primary.public_subnet_ids
  container_image    = var.container_image
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory

  db_endpoint = module.aurora_global.primary_cluster_endpoint

  tags = merge(var.common_tags, {
    Region = var.primary_region
  })
}

# ECS DR Region
module "ecs_dr" {
  source = "./modules/ecs"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  region             = var.dr_region
  region_name        = "dr"

  vpc_id             = module.vpc_dr.vpc_id
  private_subnet_ids = module.vpc_dr.private_subnet_ids
  public_subnet_ids  = module.vpc_dr.public_subnet_ids
  container_image    = var.container_image
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory

  db_endpoint = module.aurora_global.dr_cluster_endpoint

  tags = merge(var.common_tags, {
    Region = var.dr_region
  })
}

# Route53 Health Checks and Failover
module "route53_failover" {
  source = "./modules/route53"

  environment_suffix    = var.environment_suffix
  primary_lb_dns        = module.ecs_primary.lb_dns_name
  primary_lb_zone_id    = module.ecs_primary.lb_zone_id
  dr_lb_dns             = module.ecs_dr.lb_dns_name
  dr_lb_zone_id         = module.ecs_dr.lb_zone_id
  health_check_interval = var.health_check_interval

  tags = var.common_tags
}
