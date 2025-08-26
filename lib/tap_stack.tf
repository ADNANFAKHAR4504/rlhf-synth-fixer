# KMS
module "kms" {
  source      = "../modules/kms"
  project     = var.project
  environment = var.environment
}

# VPC
module "vpc" {
  source              = "../modules/vpc"
  project             = var.project
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidr  = var.public_subnet_cidr
  private_subnet_cidr = var.private_subnet_cidr
}

module "sg" {
    source              = "../modules/sg"
    project             = var.project
    environment         = var.environment
    allowed_ssh_cidr    = var.allowed_ssh_cidr
    vpc_id              = module.vpc.vpc_id
}

# S3
module "s3" {
  source      = "../modules/s3"
  project     = var.project
  environment = var.environment
  kms_key_arn = module.kms.kms_key_arn
}

# SNS
module "sns" {
  source      = "../modules/sns"
  project     = var.project
  environment = var.environment
}

# CloudWatch
module "cloudwatch" {
  source      = "../modules/cloudwatch"
  project     = var.project
  environment = var.environment
  kms_key_arn = module.kms.kms_key_arn
}

# CloudTrail
module "cloudtrail" {
  source          = "../modules/cloudtrail"
  project         = var.project
  environment     = var.environment
  kms_key_arn     = module.kms.kms_key_arn
  s3_bucket_name  = module.s3.cloudtrail_bucket_name
  log_group_arn   = module.cloudwatch.log_group_arn
}

# GuardDuty
module "guardduty" {
  source  = "../modules/guardduty"
}