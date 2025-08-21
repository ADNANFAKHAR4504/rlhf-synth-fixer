# Main Terraform configuration
locals {
  env = replace(terraform.workspace, "myapp-", "")
}

module "storage" {
  source = "./modules/storage"
  providers = {
    aws = local.env == "production" ? aws.production : aws.staging
  }
  environment = local.env
}

module "network" {
  source = "./modules/network"
  providers = {
    aws = local.env == "production" ? aws.production : aws.staging
  }
  environment = local.env
}

module "iam_role" {
  source = "./modules/iam_role"
  providers = {
    aws = local.env == "production" ? aws.production : aws.staging
  }
  environment = local.env
  bucket_arn = module.storage.bucket_arn
}
