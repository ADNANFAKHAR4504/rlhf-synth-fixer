terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "iac-rlhf-terraform-states-us-east-1-342597974367"
    key     = "synth-101000938/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true

    workspace_key_prefix = "workspaces"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

locals {
  environment = "dev"

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
    Workspace   = terraform.workspace
  }

  # Environment-specific configurations
  env_config = {
    dev = {
      vpc_cidr            = "10.0.0.0/16"
      instance_type       = "t3.micro"
      db_instance_class   = "db.t3.micro"
      asg_min_size        = 1
      asg_max_size        = 2
      asg_desired         = 1
      multi_az            = false
      deletion_protection = false
      backup_retention    = 1
    }
    staging = {
      vpc_cidr            = "10.1.0.0/16"
      instance_type       = "t3.small"
      db_instance_class   = "db.t3.small"
      asg_min_size        = 1
      asg_max_size        = 3
      asg_desired         = 2
      multi_az            = false
      deletion_protection = false
      backup_retention    = 3
    }
    prod = {
      vpc_cidr            = "10.2.0.0/16"
      instance_type       = "t3.medium"
      db_instance_class   = "db.t3.medium"
      asg_min_size        = 2
      asg_max_size        = 6
      asg_desired         = 2
      multi_az            = true
      deletion_protection = false
      backup_retention    = 7
    }
  }

  current_env = local.env_config[local.environment]
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = local.environment
  environment_suffix = var.environment_suffix
  vpc_cidr           = local.current_env.vpc_cidr
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)

  tags = local.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  project_name       = var.project_name
  environment        = local.environment
  environment_suffix = var.environment_suffix
  vpc_id             = module.vpc.vpc_id
  vpc_cidr           = local.current_env.vpc_cidr

  tags = local.common_tags
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  project_name          = var.project_name
  environment           = local.environment
  environment_suffix    = var.environment_suffix
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id

  tags = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  project_name         = var.project_name
  environment          = local.environment
  environment_suffix   = var.environment_suffix
  db_instance_class    = local.current_env.db_instance_class
  multi_az             = local.current_env.multi_az
  deletion_protection  = local.current_env.deletion_protection
  backup_retention     = local.current_env.backup_retention
  private_subnet_ids   = module.vpc.private_subnet_ids
  db_security_group_id = module.security_groups.db_security_group_id
  db_password          = var.db_password

  skip_final_snapshot = !local.current_env.deletion_protection

  tags = local.common_tags
}

# Auto Scaling Group Module
module "asg" {
  source = "./modules/asg"

  project_name          = var.project_name
  environment           = local.environment
  environment_suffix    = var.environment_suffix
  ami_id                = data.aws_ami.amazon_linux_2.id
  instance_type         = local.current_env.instance_type
  min_size              = local.current_env.asg_min_size
  max_size              = local.current_env.asg_max_size
  desired_capacity      = local.current_env.asg_desired
  private_subnet_ids    = module.vpc.private_subnet_ids
  target_group_arns     = [module.alb.target_group_arn]
  asg_security_group_id = module.security_groups.asg_security_group_id
  db_endpoint           = module.rds.db_endpoint

  tags = local.common_tags
}
