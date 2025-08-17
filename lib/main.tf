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
  region = var.region
  
  default_tags {
    tags = {
      Environment   = var.environment
      Project       = "multi-env-infrastructure"
      ManagedBy     = "terraform"
      CostCenter    = "engineering"
      Owner         = "platform-team"
    }
  }
}

# Local values for common configurations
locals {
  common_tags = {
    Environment = var.environment
    Project     = "multi-env-infrastructure"
    ManagedBy   = "terraform"
  }

  public_subnet_cidrs  = [for i in range(length(var.availability_zones)) : cidrsubnet(var.vpc_cidr, 8, i)]
  private_subnet_cidrs = [for i in range(length(var.availability_zones)) : cidrsubnet(var.vpc_cidr, 8, i + 10)]
}

# VPC Module
module "vpc" {
  source = "./modules/vpc_module"

  environment            = var.environment
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = local.public_subnet_cidrs
  private_subnet_cidrs  = local.private_subnet_cidrs
  enable_flow_logs      = true
  tags                  = local.common_tags
}

# IAM Module
module "iam_module" {
    source = "./modules/iam_module"
    environment = var.environment
    tags = local.common_tags

    depends_on = [ module.vpc ]
}


# Security Module
module "security" {
  source = "./modules/security_module"
  environment = var.environment
  vpc_id = module.vpc.vpc_id
  vpc_cidr = var.vpc_cidr
  tags = local.common_tags

  depends_on = [ module.iam_module ]
}

module "ec2_module" {
    source = "./modules/ec2_module"
    instance_type = var.instance_type
    ami_id = var.ami_id
    subnet_ids = module.vpc.private_subnet_ids
    security_group_ids = [module.security.alb_security_group_id, module.security.alb_security_group_id]
    instance_profile_name = module.iam_module.ec2_instance_profile_name
    tags = local.common_tags
    environment = var.environment
}


output "lb_domain" {
    value = module.ec2_module.load_balancer_dns_name
}
  