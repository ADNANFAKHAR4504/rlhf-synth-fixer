# (terraform block moved to provider.tf to avoid duplication)
# Data source for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# Primary Region Infrastructure
module "primary_networking" {
  source = "./modules/networking"
  providers = {
    aws = aws.primary
  }

  region             = var.primary_region
  vpc_cidr           = var.vpc_cidr["primary"]
  environment        = var.environment
  availability_zones = data.aws_availability_zones.primary.names
  tags = merge(var.tags, {
    Region = var.primary_region
    Type   = "Primary"
  })
}

module "primary_compute" {
  source = "./modules/compute"
  providers = {
    aws = aws.primary
  }

  vpc_id             = module.primary_networking.vpc_id
  public_subnet_ids  = module.primary_networking.public_subnet_ids
  private_subnet_ids = module.primary_networking.private_subnet_ids
  nat_gateway_ids    = module.primary_networking.nat_gateway_ids
  instance_type      = var.instance_type
  min_size           = var.min_size
  max_size           = var.max_size
  desired_capacity   = var.desired_capacity
  environment        = var.environment
  region             = var.primary_region
  db_endpoint        = module.primary_database.endpoint

  tags = merge(var.tags, {
    Region = var.primary_region
    Type   = "Primary"
  })
}

module "primary_database" {
  source = "./modules/database"
  providers = {
    aws = aws.primary
  }

  vpc_id                  = module.primary_networking.vpc_id
  subnet_ids              = module.primary_networking.private_subnet_ids
  instance_class          = var.db_instance_class
  db_username             = var.db_username
  db_password             = var.db_password
  multi_az                = true
  backup_retention_period = 30
  environment             = var.environment
  region                  = var.primary_region
  is_primary              = true

  tags = merge(var.tags, {
    Region = var.primary_region
    Type   = "Primary"
  })
}

# Secondary Region Infrastructure
module "secondary_networking" {
  source = "./modules/networking"
  providers = {
    aws = aws.secondary
  }

  region             = var.secondary_region
  vpc_cidr           = var.vpc_cidr["secondary"]
  environment        = var.environment
  availability_zones = data.aws_availability_zones.secondary.names

  tags = merge(var.tags, {
    Region = var.secondary_region
    Type   = "Secondary"
  })
}

module "secondary_compute" {
  source = "./modules/compute"
  providers = {
    aws = aws.secondary
  }

  vpc_id             = module.secondary_networking.vpc_id
  public_subnet_ids  = module.secondary_networking.public_subnet_ids
  private_subnet_ids = module.secondary_networking.private_subnet_ids
  nat_gateway_ids    = module.secondary_networking.nat_gateway_ids
  instance_type      = var.instance_type
  min_size           = var.min_size
  max_size           = var.max_size
  desired_capacity   = 2 # Lower capacity in standby region
  environment        = var.environment
  region             = var.secondary_region
  db_endpoint        = module.secondary_database.endpoint

  tags = merge(var.tags, {
    Region = var.secondary_region
    Type   = "Secondary"
  })
}

module "secondary_database" {
  source = "./modules/database"
  providers = {
    aws = aws.secondary
  }

  vpc_id                  = module.secondary_networking.vpc_id
  subnet_ids              = module.secondary_networking.private_subnet_ids
  instance_class          = var.db_instance_class
  db_username             = var.db_username
  db_password             = var.db_password
  multi_az                = true
  backup_retention_period = 30
  environment             = var.environment
  region                  = var.secondary_region
  is_primary              = false
  source_db_arn           = module.primary_database.db_arn

  tags = merge(var.tags, {
    Region = var.secondary_region
    Type   = "Secondary"
  })
}

# Failover Module
module "failover_mechanism" {
  count  = var.enable_dns_failover ? 1 : 0
  source = "./modules/failover"
  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  primary_alb_arn       = module.primary_compute.alb_arn
  secondary_alb_arn     = module.secondary_compute.alb_arn
  primary_alb_dns       = module.primary_compute.alb_dns
  secondary_alb_dns     = module.secondary_compute.alb_dns
  primary_alb_zone_id   = module.primary_compute.alb_zone_id
  secondary_alb_zone_id = module.secondary_compute.alb_zone_id
  health_check_interval = var.health_check_interval
  failover_threshold    = var.failover_threshold
  primary_db_arn        = module.primary_database.db_arn
  secondary_db_arn      = module.secondary_database.db_arn
  primary_region        = var.primary_region
  secondary_region      = var.secondary_region
  environment           = var.environment

  tags = merge(var.tags, {
    Type = "Failover"
  })
}
