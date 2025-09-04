# Main Terraform configuration - uses centralized locals from locals.tf

# Staging environment modules
module "storage_staging" {
  count  = local.env == "staging" ? 1 : 0
  source = "./modules/storage"
  providers = {
    aws = aws.staging
  }
  environment = "staging"
}

module "network_staging" {
  count  = local.env == "staging" ? 1 : 0
  source = "./modules/network"
  providers = {
    aws = aws.staging
  }
  environment = "staging"
}

module "iam_role_staging" {
  count  = local.env == "staging" ? 1 : 0
  source = "./modules/iam_role"
  providers = {
    aws = aws.staging
  }
  environment = "staging"
  bucket_arn  = local.env == "staging" ? module.storage_staging[0].bucket_arn : null
}

# Production environment modules
module "storage_production" {
  count  = local.env == "production" ? 1 : 0
  source = "./modules/storage"
  providers = {
    aws = aws.production
  }
  environment = "production"
}

module "network_production" {
  count  = local.env == "production" ? 1 : 0
  source = "./modules/network"
  providers = {
    aws = aws.production
  }
  environment = "production"
}

module "iam_role_production" {
  count  = local.env == "production" ? 1 : 0
  source = "./modules/iam_role"
  providers = {
    aws = aws.production
  }
  environment = "production"
  bucket_arn  = local.env == "production" ? module.storage_production[0].bucket_arn : null
}

# Environment-agnostic modules using conditional provider
module "storage" {
  count  = 1
  source = "./modules/storage"
  providers = {
    aws = aws
  }
  environment = local.env
}

module "network" {
  count  = 1
  source = "./modules/network"
  providers = {
    aws = aws
  }
  environment = local.env
}

module "iam_role" {
  count  = 1
  source = "./modules/iam_role"
  providers = {
    aws = aws
  }
  environment = local.env
  bucket_arn  = module.storage[0].bucket_arn
}
