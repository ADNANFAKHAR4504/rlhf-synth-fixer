# Production AWS Infrastructure - Project #166 Batch 004
# Terraform configuration for secure, scalable production environment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
  
  # Backend configuration for remote state storage
  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "prod/infrastructure/terraform.tfstate"
  #   region         = "us-west-2"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

# AWS Provider configuration with default tags
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "project-166"
      Batch       = "batch-004"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = var.owner
      CostCenter  = "infrastructure"
    }
  }
}

# Random provider for generating unique identifiers
provider "random" {}

# Data sources for dynamic configuration
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Local values for computed configurations
locals {
  # Ensure we have at least 2 AZs for high availability
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
  
  # Common tags to be applied to all resources
  common_tags = {
    ProjectName = var.project_name
    Environment = var.environment
    DeployedBy  = "terraform"
    CreatedDate = timestamp()
  }
}

# Networking Module - VPC, Subnets, NAT Gateway, Route Tables
module "networking" {
  source = "./modules/networking"
  
  project_name        = var.project_name
  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = local.availability_zones
  enable_nat_gateway = var.enable_nat_gateway
  
  # Pass common tags
  tags = local.common_tags
}

# Storage Module - S3 Bucket with security features
module "storage" {
  source = "./modules/storage"
  
  project_name      = var.project_name
  environment       = var.environment
  enable_encryption = var.enable_encryption
  
  # Pass common tags
  tags = local.common_tags
}

# Database Module - RDS with encryption and monitoring
module "database" {
  source = "./modules/database"
  
  project_name           = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  db_instance_class     = var.db_instance_class
  db_name               = var.db_name
  db_username           = var.db_username
  enable_encryption     = var.enable_encryption
  
  # Pass common tags
  tags = local.common_tags
  
  # Dependency to ensure networking is ready
  depends_on = [module.networking]
}

# Compute Module - EC2 instances with IAM roles and security groups
module "compute" {
  source = "./modules/compute"
  
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  s3_bucket_arn      = module.storage.s3_bucket_arn
  instance_type      = var.instance_type
  key_name           = var.key_name
  
  # Pass common tags
  tags = local.common_tags
  
  # Dependencies to ensure other modules are ready
  depends_on = [module.networking, module.storage]
}

# Monitoring Module - CloudWatch alarms and SNS notifications
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name    = var.project_name
  environment     = var.environment
  instance_ids    = module.compute.instance_ids
  db_instance_id  = module.database.db_instance_id
  sns_email       = var.sns_email
  vpc_id          = module.networking.vpc_id
  
  # Pass common tags
  tags = local.common_tags
  
  # Dependencies to ensure resources exist before monitoring
  depends_on = [module.compute, module.database]
}