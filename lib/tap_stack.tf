# Main Terraform configuration
locals {
  env = replace(terraform.workspace, "myapp-", "")
  
  # Determine provider based on environment
  aws_provider = local.env == "production" ? aws.production : aws.staging
}

module "storage" {
  source = "./modules/storage"
  providers = {
    aws = local.aws_provider
  }
  environment = local.env
}

module "network" {
  source = "./modules/network"
  providers = {
    aws = local.aws_provider
  }
  environment = local.env
}

module "iam_role" {
  source = "./modules/iam_role"
  providers = {
    aws = local.aws_provider
  }
  environment = local.env
  bucket_arn = module.storage.bucket_arn
}
