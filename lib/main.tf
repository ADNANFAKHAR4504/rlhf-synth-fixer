########################
# Main Infrastructure
########################

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

locals {
  # Add environment suffix to all resource names
  name_prefix = "${var.project_name}-${var.environment_suffix}"

  common_tags = {
    Environment       = var.environment
    Project           = var.project_name
    ManagedBy         = "Terraform"
    EnvironmentSuffix = var.environment_suffix
  }
}

########################
# KMS Key for Encryption
########################

resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-kms-key"
    }
  )
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

########################
# Networking Module
########################

module "networking" {
  source = "./modules/networking"

  project_name         = local.name_prefix
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  common_tags          = local.common_tags
}

########################
# Security Module
########################

module "security" {
  source = "./modules/security"

  project_name     = local.name_prefix
  environment      = var.environment
  vpc_id           = module.networking.vpc_id
  trusted_ip_range = var.trusted_ip_range
  common_tags      = local.common_tags
}

########################
# Storage Module
########################

module "storage" {
  source = "./modules/storage"

  project_name = local.name_prefix
  environment  = var.environment
  kms_key_id   = aws_kms_key.main.id
  common_tags  = local.common_tags

  depends_on = [aws_kms_key.main]
}

########################
# IAM Module
########################

module "iam" {
  source = "./modules/iam"

  project_name   = local.name_prefix
  environment    = var.environment
  kms_key_arn    = aws_kms_key.main.arn
  s3_bucket_arns = module.storage.bucket_arns
  common_tags    = local.common_tags
}