terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
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

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Optional: Reference existing Route53 hosted zone
data "aws_route53_zone" "main" {
  count = var.route53_zone_name != "" ? 1 : 0
  name  = var.route53_zone_name
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  vpc_cidr           = var.vpc_cidr
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
  project_name       = var.project_name
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  vpc_id             = module.vpc.vpc_id
  project_name       = var.project_name
}

# KMS Module
module "kms" {
  source = "./modules/kms"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  kms_key_arn        = module.kms.key_arn
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.rds_security_group_id
  instance_class     = var.rds_instance_class
  backup_retention   = var.rds_backup_retention
  kms_key_arn        = module.kms.key_arn
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  security_group_id  = module.security_groups.alb_security_group_id
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  environment               = var.environment
  environment_suffix        = var.environment_suffix
  project_name              = var.project_name
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  security_group_id         = module.security_groups.ecs_security_group_id
  alb_target_group_arn      = module.alb.target_group_arn
  task_cpu                  = var.ecs_task_cpu
  task_memory               = var.ecs_task_memory
  desired_count             = var.ecs_desired_count
  cloudwatch_log_group_name = module.cloudwatch.log_group_name
  aws_region                = var.aws_region
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  project_name       = var.project_name
  retention_days     = var.cloudwatch_retention_days
  kms_key_arn        = module.kms.key_arn
}
