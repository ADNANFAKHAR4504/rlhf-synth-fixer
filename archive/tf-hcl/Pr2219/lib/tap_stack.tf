# KMS
module "kms" {
  source      = "./modules/kms"
  project     = var.project
  environment = var.environment
  region      = var.aws_region
}

# VPC
module "vpc" {
  source              = "./modules/vpc"
  project             = var.project
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "sg" {
    source              = "./modules/sg"
    project             = var.project
    environment         = var.environment
    allowed_ssh_cidr    = var.allowed_ssh_cidr
    vpc_id              = module.vpc.vpc_id
}

# S3_secure_bucket
module "s3_secure_bucket" {
  source      = "./modules/s3"
  project     = var.project
  kms_key_id = module.kms.kms_key_arn
  bucket_name = "secconfig-secure-bucket-pr2219"
  bucket_policy = data.aws_iam_policy_document.secure_bucket.json
}

# S3_cloudtrail
module "s3_cloudtrail_bucket" {
  source      = "./modules/s3"
  project     = var.project
  kms_key_id = module.kms.kms_key_arn
  bucket_name = "secconfig-cloudtrail-bucket-pr2219"
  bucket_policy = data.aws_iam_policy_document.cloudtrail_s3.json
}

# S3_cloudtrail
module "s3_config_bucket" {
  source      = "./modules/s3"
  project     = var.project
  kms_key_id = module.kms.kms_key_arn
  bucket_name = "secconfig-config-bucket-pr2219"
  bucket_policy = data.aws_iam_policy_document.config_s3.json
}

# SNS
module "sns" {
  source      = "./modules/sns"
  topic_name = "SecConfig-Security-Alerts-Pr2219"
  kms_key_id= module.kms.kms_key_arn
}

# CloudWatch
module "cloudwatch_security" {
  source      = "./modules/cloudwatch"
  log_group_name = "/aws/secconfig/security-logs-pr2219"
  retention_in_days = 90
  sns_topic = module.sns.sns_topic_arn
}

# CloudWatch
module "cloudwatch_cloudtrail" {
  source      = "./modules/cloudwatch"
  log_group_name = "/aws/cloudtrail/cloudtrail-logs-pr2219"
  retention_in_days = 90
  sns_topic = module.sns.sns_topic_arn
}

## CloudTrail
#module "cloudtrail" {
#  source          = "./modules/cloudtrail"
#  project         = var.project
#  environment     = var.environment
#  s3_bucket_name  = module.s3_cloudtrail_bucket.s3_bucket_id
#  kms_key_id = module.kms.kms_key_arn
#  cw_logs_role_arn = module.iam_cloudtrail.role_arn
#  cw_logs_group_arn = module.cloudwatch_cloudtrail.log_group_arn
#}

## GuardDuty
#module "guardduty" {
#  source  = "./modules/guardduty"
#}

module "iam_cloudtrail" {
  source = "./modules/iam"
  role_name= "${var.project}-cloudtrail-cw-role"
  policy_name = "${var.project}-cloudtrail-cw-policy"
  assume_policy = data.aws_iam_policy_document.cloudtrail_assume.json
  iam_policy = data.aws_iam_policy_document.cloudtrail_cw_policy.json
  policy_arn = ""
}

module "iam_config" {
  source = "./modules/iam"
  role_name= "${var.project}-config-role"
  policy_name = "${var.project}-config-policy"
  assume_policy = data.aws_iam_policy_document.config_assume.json
  iam_policy = data.aws_iam_policy_document.config_policy.json
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

module "iam_mfa_role" {
  source = "./modules/iam"
  role_name= "${var.project}-MFA-Required-Role"
  policy_name = "${var.project}-mfa-required-policy"
  assume_policy = data.aws_iam_policy_document.mfa_role_assume.json
  iam_policy = data.aws_iam_policy_document.s3_readonly.json
  policy_arn = ""
}

module "config" {
  source = "./modules/config"
  config_bucket = module.s3_config_bucket.s3_bucket_id
  config_role_arn = module.iam_config.role_arn
}