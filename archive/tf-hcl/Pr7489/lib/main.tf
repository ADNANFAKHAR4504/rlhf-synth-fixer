# Primary Region VPC
module "vpc_primary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region             = var.primary_region
  vpc_cidr           = var.vpc_cidr_primary
  availability_zones = var.availability_zones_primary
  is_primary         = true
}

# DR Region VPC
module "vpc_dr" {
  source = "./modules/vpc"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  region             = var.dr_region
  vpc_cidr           = var.vpc_cidr_dr
  availability_zones = var.availability_zones_dr
  is_primary         = false
}

# VPC Peering
module "vpc_peering" {
  source = "./modules/vpc-peering"

  providers = {
    aws.primary = aws.primary
    aws.dr      = aws.dr
  }

  environment_suffix      = var.environment_suffix
  primary_vpc_id          = module.vpc_primary.vpc_id
  dr_vpc_id               = module.vpc_dr.vpc_id
  primary_vpc_cidr        = var.vpc_cidr_primary
  dr_vpc_cidr             = var.vpc_cidr_dr
  primary_route_table_ids = module.vpc_primary.private_route_table_ids
  dr_route_table_ids      = module.vpc_dr.private_route_table_ids
  primary_region          = var.primary_region
  dr_region               = var.dr_region
}

# IAM Roles
module "iam" {
  source = "./modules/iam"

  providers = {
    aws = aws.global
  }

  environment_suffix = var.environment_suffix
  primary_region     = var.primary_region
  dr_region          = var.dr_region
}

# S3 Buckets with Cross-Region Replication
module "s3_primary" {
  source = "./modules/s3"

  providers = {
    aws = aws.primary
  }

  environment_suffix   = var.environment_suffix
  region               = var.primary_region
  replication_region   = var.dr_region
  replication_role_arn = module.iam.s3_replication_role_arn
  is_primary           = true
}

module "s3_dr" {
  source = "./modules/s3"

  providers = {
    aws = aws.dr
  }

  environment_suffix   = var.environment_suffix
  region               = var.dr_region
  replication_region   = var.primary_region
  replication_role_arn = module.iam.s3_replication_role_arn
  is_primary           = false
}

# DynamoDB Global Tables
module "dynamodb" {
  source = "./modules/dynamodb"

  providers = {
    aws.primary = aws.primary
    aws.dr      = aws.dr
  }

  environment_suffix = var.environment_suffix
  primary_region     = var.primary_region
  dr_region          = var.dr_region
}

# RDS Aurora Global Database
module "rds_primary" {
  source = "./modules/rds"

  providers = {
    aws = aws.primary
  }

  environment_suffix        = var.environment_suffix
  region                    = var.primary_region
  vpc_id                    = module.vpc_primary.vpc_id
  private_subnet_ids        = module.vpc_primary.private_subnet_ids
  availability_zones        = var.availability_zones_primary
  db_master_username        = var.db_master_username
  db_master_password        = var.db_master_password
  is_primary                = true
  global_cluster_identifier = "transaction-db-${var.environment_suffix}"
}

module "rds_dr" {
  source = "./modules/rds"

  providers = {
    aws = aws.dr
  }

  environment_suffix        = var.environment_suffix
  region                    = var.dr_region
  vpc_id                    = module.vpc_dr.vpc_id
  private_subnet_ids        = module.vpc_dr.private_subnet_ids
  availability_zones        = var.availability_zones_dr
  db_master_username        = var.db_master_username
  db_master_password        = var.db_master_password
  is_primary                = false
  global_cluster_identifier = "transaction-db-${var.environment_suffix}"

  depends_on = [module.rds_primary]
}

# Lambda Functions
module "lambda_primary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.primary
  }

  environment_suffix    = var.environment_suffix
  region                = var.primary_region
  vpc_id                = module.vpc_primary.vpc_id
  private_subnet_ids    = module.vpc_primary.private_subnet_ids
  lambda_execution_role = module.iam.lambda_execution_role_arn
  source_bucket         = module.s3_primary.lambda_source_bucket_name
}

module "lambda_dr" {
  source = "./modules/lambda"

  providers = {
    aws = aws.dr
  }

  environment_suffix    = var.environment_suffix
  region                = var.dr_region
  vpc_id                = module.vpc_dr.vpc_id
  private_subnet_ids    = module.vpc_dr.private_subnet_ids
  lambda_execution_role = module.iam.lambda_execution_role_arn
  source_bucket         = module.s3_dr.lambda_source_bucket_name
}

# Application Load Balancers
module "alb_primary" {
  source = "./modules/alb"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region             = var.primary_region
  vpc_id             = module.vpc_primary.vpc_id
  public_subnet_ids  = module.vpc_primary.public_subnet_ids
  lambda_arn         = module.lambda_primary.function_arn
}

module "alb_dr" {
  source = "./modules/alb"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  region             = var.dr_region
  vpc_id             = module.vpc_dr.vpc_id
  public_subnet_ids  = module.vpc_dr.public_subnet_ids
  lambda_arn         = module.lambda_dr.function_arn
}

# Route 53
module "route53" {
  source = "./modules/route53"

  providers = {
    aws = aws.global
  }

  environment_suffix  = var.environment_suffix
  domain_name         = var.domain_name
  primary_alb_dns     = module.alb_primary.dns_name
  primary_alb_zone_id = module.alb_primary.zone_id
  dr_alb_dns          = module.alb_dr.dns_name
  dr_alb_zone_id      = module.alb_dr.zone_id
}

# CloudWatch Monitoring
module "cloudwatch_primary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region             = var.primary_region
  cluster_identifier = module.rds_primary.cluster_identifier
  sns_topic_arn      = module.sns_primary.topic_arn
}

module "cloudwatch_dr" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  region             = var.dr_region
  cluster_identifier = module.rds_dr.cluster_identifier
  sns_topic_arn      = module.sns_dr.topic_arn
}

# SNS Topics
module "sns_primary" {
  source = "./modules/sns"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region             = var.primary_region
  alert_email        = var.alert_email
}

module "sns_dr" {
  source = "./modules/sns"

  providers = {
    aws = aws.dr
  }

  environment_suffix = var.environment_suffix
  region             = var.dr_region
  alert_email        = var.alert_email
}
