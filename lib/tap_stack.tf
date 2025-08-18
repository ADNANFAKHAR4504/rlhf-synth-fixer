######################
# Data
######################
# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

######################
# Infrastructure Module
######################

module "infra" {
  source = "./modules"
  
  project_name         = var.project_name
  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones  = data.aws_availability_zones.available.names
  account_id          = data.aws_caller_identity.current.account_id
}

######################
# Outputs
######################

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.infra.vpc_id
}

output "s3_data_bucket_name" {
  description = "Name of the S3 data bucket"
  value       = module.infra.s3_data_bucket_name
}