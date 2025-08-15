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
      Project     = var.project_name
      Author      = var.author
      Environment = var.environment
      CreatedDate = var.created_date
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  project_name        = var.project_name
  vpc_cidr           = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones  = data.aws_availability_zones.available.names
}

# Security Module
module "security" {
  source = "./modules/security"

  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  vpc_cidr     = var.vpc_cidr
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  kms_key_arn  = aws_kms_key.main.arn
}

# Storage Module
module "storage" {
  source = "./modules/storage"

  project_name           = var.project_name
  vpc_id                = module.networking.vpc_id
  route_table_ids       = module.networking.private_route_table_ids
  kms_key_arn           = aws_kms_key.main.arn
  vpc_endpoint_sg_id    = module.security.vpc_endpoint_sg_id
  ec2_instance_role_arn = module.iam.ec2_instance_role_arn
}

# Database Module
module "database" {
  source = "./modules/database"

  project_name           = var.project_name
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  rds_security_group_id = module.security.rds_sg_id
  kms_key_arn           = aws_kms_key.main.arn
  db_username           = var.db_username
  db_password           = var.db_password
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  project_name           = var.project_name
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.security.alb_sg_id
  ec2_security_group_id = module.security.ec2_sg_id
  instance_profile_name = module.iam.ec2_instance_profile_name
  kms_key_arn           = aws_kms_key.main.arn
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  kms_key_arn  = aws_kms_key.main.arn
}