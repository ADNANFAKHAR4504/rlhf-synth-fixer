terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
      Suffix      = var.environment_suffix
    }
  }
}

module "networking" {
  source = "../../modules/networking"

  environment          = var.environment
  environment_suffix   = var.environment_suffix
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway   = var.enable_nat_gateway
}

module "security_groups" {
  source = "../../modules/security-groups"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  vpc_id             = module.networking.vpc_id
  container_port     = var.container_port
}

module "iam" {
  source = "../../modules/iam"

  environment        = var.environment
  environment_suffix = var.environment_suffix
}

module "ecs" {
  source = "../../modules/ecs"

  environment               = var.environment
  environment_suffix        = var.environment_suffix
  aws_region                = var.aws_region
  vpc_id                    = module.networking.vpc_id
  public_subnet_ids         = module.networking.public_subnet_ids
  private_subnet_ids        = module.networking.private_subnet_ids
  ecs_security_group_id     = module.security_groups.ecs_tasks_security_group_id
  alb_security_group_id     = module.security_groups.alb_security_group_id
  execution_role_arn        = module.iam.ecs_task_execution_role_arn
  task_role_arn             = module.iam.ecs_task_role_arn
  container_image           = var.container_image
  container_port            = var.container_port
  task_cpu                  = var.task_cpu
  task_memory               = var.task_memory
  desired_count             = var.desired_count
  min_capacity              = var.min_capacity
  max_capacity              = var.max_capacity
  health_check_path         = var.health_check_path
  enable_container_insights = var.enable_container_insights
}
