# ============================================================================
# DATA SOURCES
# ============================================================================
data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# ============================================================================
# KMS MODULE
# ============================================================================

module "kms" {
  source = "./modules/kms"

  project_name = var.project_name
  environment  = var.environment

  providers = {
    aws           = aws
    aws.secondary = aws.secondary
  }
}

# ============================================================================
# VPC MODULES - PRIMARY AND SECONDARY
# ============================================================================

module "vpc_primary" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr_primary
  region       = var.aws_region
  region_name  = "primary"

  providers = {
    aws = aws
  }
}

module "vpc_secondary" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr_secondary
  region       = var.secondary_region
  region_name  = "secondary"

  providers = {
    aws = aws.secondary
  }
}

# ============================================================================
# SECURITY GROUPS MODULES - PRIMARY AND SECONDARY
# ============================================================================

module "security_groups_primary" {
  source = "./modules/security_groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc_primary.vpc_id
  region_name  = "primary"

  providers = {
    aws = aws
  }
}

module "security_groups_secondary" {
  source = "./modules/security_groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc_secondary.vpc_id
  region_name  = "secondary"

  providers = {
    aws = aws.secondary
  }
}

# ============================================================================
# RDS MODULE
# ============================================================================

module "rds" {
  source = "./modules/rds"

  project_name        = var.project_name
  environment         = var.environment
  primary_region      = var.aws_region
  primary_subnet_ids  = module.vpc_primary.private_subnet_ids
  primary_db_sg_id    = module.security_groups_primary.db_sg_id
  primary_kms_key_arn = module.kms.rds_primary_key_arn
  instance_class      = var.aurora_instance_class
  resource_suffix     = var.resource_suffix

  # Secondary region parameters kept for compatibility but not used
  secondary_region      = var.secondary_region
  secondary_subnet_ids  = module.vpc_secondary.private_subnet_ids
  secondary_db_sg_id    = module.security_groups_secondary.db_sg_id
  secondary_kms_key_arn = module.kms.rds_secondary_key_arn
}

# ============================================================================
# DYNAMODB MODULE
# ============================================================================

module "dynamodb" {
  source = "./modules/dynamodb"

  project_name     = var.project_name
  environment      = var.environment
  secondary_region = var.secondary_region
  resource_suffix  = var.resource_suffix
}

# ============================================================================
# ALB MODULES - PRIMARY AND SECONDARY
# ============================================================================

module "alb_primary" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc_primary.vpc_id
  public_subnet_ids = module.vpc_primary.public_subnet_ids
  alb_sg_id         = module.security_groups_primary.alb_sg_id
  region_name       = "primary"
  resource_suffix   = var.resource_suffix

  providers = {
    aws = aws
  }
}

module "alb_secondary" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc_secondary.vpc_id
  public_subnet_ids = module.vpc_secondary.public_subnet_ids
  alb_sg_id         = module.security_groups_secondary.alb_sg_id
  region_name       = "secondary"
  resource_suffix   = var.resource_suffix

  providers = {
    aws = aws.secondary
  }
}

# ============================================================================
# MONITORING MODULE (creates SNS topic needed by IAM)
# ============================================================================

# Note: We need to create a placeholder SNS topic first for IAM module
resource "aws_sns_topic" "alerts_placeholder" {
  name = "${var.project_name}-dr-alerts-${var.environment}-${var.resource_suffix}"

  tags = {
    Name        = "${var.project_name}-sns-alerts-${var.resource_suffix}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# IAM MODULE
# ============================================================================

module "iam" {
  source = "./modules/iam"

  project_name       = var.project_name
  environment        = var.environment
  dynamodb_table_arn = module.dynamodb.table_arn
  sns_topic_arn      = aws_sns_topic.alerts_placeholder.arn
  resource_suffix    = var.resource_suffix
}

# ============================================================================
# LAMBDA MODULE
# ============================================================================

module "lambda" {
  source = "./modules/lambda"

  project_name       = var.project_name
  environment        = var.environment
  lambda_role_arn    = module.iam.lambda_role_arn
  global_cluster_id  = module.rds.global_cluster_id
  primary_region     = var.aws_region
  secondary_region   = var.secondary_region
  sns_topic_arn      = aws_sns_topic.alerts_placeholder.arn
  primary_alb_dns    = module.alb_primary.alb_dns_name
  secondary_alb_dns  = module.alb_secondary.alb_dns_name
  resource_suffix    = var.resource_suffix
}

# ============================================================================
# ASG MODULES - PRIMARY AND SECONDARY
# ============================================================================

module "asg_primary" {
  source = "./modules/asg"

  project_name          = var.project_name
  environment           = var.environment
  region                = var.aws_region
  region_name           = "primary"
  instance_type         = var.ec2_instance_type
  instance_profile_name = module.iam.ec2_instance_profile_name
  app_sg_id             = module.security_groups_primary.app_sg_id
  private_subnet_ids    = module.vpc_primary.private_subnet_ids
  target_group_arn      = module.alb_primary.target_group_arn
  min_capacity          = var.asg_min_capacity
  max_capacity          = var.asg_max_capacity
  desired_capacity      = var.asg_desired_capacity

  providers = {
    aws = aws
  }
}

module "asg_secondary" {
  source = "./modules/asg"

  project_name          = var.project_name
  environment           = var.environment
  region                = var.secondary_region
  region_name           = "secondary"
  instance_type         = var.ec2_instance_type
  instance_profile_name = module.iam.ec2_instance_profile_name
  app_sg_id             = module.security_groups_secondary.app_sg_id
  private_subnet_ids    = module.vpc_secondary.private_subnet_ids
  target_group_arn      = module.alb_secondary.target_group_arn
  min_capacity          = 0
  max_capacity          = var.asg_max_capacity
  desired_capacity      = 0

  providers = {
    aws = aws.secondary
  }
}

# ============================================================================
# MONITORING MODULE (actual)
# ============================================================================

module "monitoring" {
  source = "./modules/monitoring"

  project_name           = var.project_name
  environment            = var.environment
  lambda_function_arn    = module.lambda.function_arn
  lambda_function_name   = module.lambda.function_name
  primary_alb_arn_suffix = module.alb_primary.alb_arn_suffix
  primary_tg_arn_suffix  = module.alb_primary.target_group_arn_suffix
  primary_db_cluster_id  = module.rds.primary_cluster_id
  dynamodb_table_name    = module.dynamodb.table_name
  asg_desired_capacity   = var.asg_desired_capacity
  resource_suffix        = var.resource_suffix
}

# ============================================================================
# BACKUP MODULE
# ============================================================================

module "backup" {
  source = "./modules/backup"

  project_name               = var.project_name
  environment                = var.environment
  backup_role_arn            = module.iam.backup_role_arn
  primary_aurora_cluster_arn = "arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster:${module.rds.primary_cluster_id}"
  dynamodb_table_arn         = module.dynamodb.table_arn
  resource_suffix            = var.resource_suffix
}

data "aws_caller_identity" "current" {}

# ============================================================================
# WAF MODULE - PRIMARY
# ============================================================================

module "waf_primary" {
  source = "./modules/waf"

  project_name = var.project_name
  environment  = var.environment
  region_name  = "primary"
  alb_arn      = module.alb_primary.alb_arn
}

# ============================================================================
# ROUTE53 MODULE
# ============================================================================

module "route53" {
  source = "./modules/route53"

  project_name       = var.project_name
  environment        = var.environment
  primary_alb_dns    = module.alb_primary.alb_dns_name
  secondary_alb_dns  = module.alb_secondary.alb_dns_name
}
