terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# Local variables for environment-specific configuration
locals {
  environment_suffix = var.environment_suffix
  name_prefix        = "${var.environment}-${var.aws_region}"

  # Environment-specific configurations
  vpc_cidr = {
    dev     = "10.0.0.0/16"
    staging = "10.1.0.0/16"
    prod    = "10.2.0.0/16"
  }

  db_instance_class = {
    dev     = "db.t3.medium"
    staging = "db.r5.large"
    prod    = "db.r5.xlarge"
  }

  ecs_task_cpu = {
    dev     = "256"
    staging = "512"
    prod    = "1024"
  }

  ecs_task_memory = {
    dev     = "512"
    staging = "1024"
    prod    = "2048"
  }

  log_retention_days = {
    dev     = 7
    staging = 30
    prod    = 90
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_cidr           = lookup(local.vpc_cidr, var.environment, local.vpc_cidr["dev"])
  availability_zones = data.aws_availability_zones.available.names
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security"

  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
}

# RDS Aurora Module
module "database" {
  source = "./modules/database"

  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.database_sg_id
  instance_class     = lookup(local.db_instance_class, var.environment, local.db_instance_class["dev"])
  enable_rotation    = var.environment == "prod" ? true : false
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.public_subnet_ids
  security_group_id  = module.security_groups.alb_sg_id
}

# ECS Fargate Module
module "ecs" {
  source = "./modules/ecs"

  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.ecs_sg_id
  target_group_arn   = module.alb.target_group_arn
  task_cpu           = lookup(local.ecs_task_cpu, var.environment, local.ecs_task_cpu["dev"])
  task_memory        = lookup(local.ecs_task_memory, var.environment, local.ecs_task_memory["dev"])
  db_secret_arn      = module.database.secret_arn
}

# CloudWatch Logs Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  retention_days     = lookup(local.log_retention_days, var.environment, local.log_retention_days["dev"])
}

# SNS Alerting Module
module "sns" {
  source = "./modules/sns"

  environment        = var.environment
  environment_suffix = local.environment_suffix
  name_prefix        = local.name_prefix
  email_addresses    = var.alert_email_addresses
}

# Route53 (Production only - blue-green)
module "route53" {
  source = "./modules/route53"
  count  = var.environment == "prod" ? 1 : 0

  environment        = var.environment
  environment_suffix = local.environment_suffix
  hosted_zone_id     = var.hosted_zone_id
  domain_name        = var.domain_name
  alb_dns_name       = module.alb.alb_dns_name
  alb_zone_id        = module.alb.alb_zone_id
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
