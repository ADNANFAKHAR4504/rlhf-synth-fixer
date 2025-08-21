# Main Terraform configuration
locals {
  env = replace(terraform.workspace, "myapp-", "")
}

module "storage" {
  source = "./modules/storage"
  providers = {
    aws = aws.staging
  }
  environment = local.env
}

module "network" {
  source = "./modules/network"
  providers = {
    aws = aws.staging
  }
  environment = local.env
}

module "iam_role" {
  source = "./modules/iam_role"
  providers = {
    aws = aws.staging
  }
  environment = local.env
  bucket_arn = module.storage.bucket_arn
}
