# Main Terraform configuration
locals {
  env = replace(terraform.workspace, "myapp-", "")
}

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
  bucket_arn = module.storage_staging[0].bucket_arn
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
  bucket_arn = module.storage_production[0].bucket_arn
}
