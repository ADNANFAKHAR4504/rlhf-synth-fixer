# Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "secure-infra"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "idp_arn" {
  description = "Identity Provider ARN for SAML federation"
  type        = string
  default     = "arn:aws:iam::123456789012:saml-provider/my-saml-provider" # replace with actual ARN
}

variable "idp_url" {
  description = "Identity Provider URL"
  type        = string
  default     = "https://my-saml-provider.example.com/saml2/idp/metadata" # replace with actual URL
}

variable "idp_thumbprint" {
  description = "Identity Provider certificate thumbprint"
  type        = string
  default     = "1234567890abcdef1234567890abcdef12345678" # replace with actual thumbprint
}

variable "notification_email" {
  description = "Email address for security notifications"
  type        = string
  default     = "dev@example.com" # replace with actual email address
}

variable "saml_metadata_document" {
  description = "SAML metadata document for the identity provider"
  type        = string
  default     = "" # replace with actual SAML metadata document
}

# Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "security_groups" {
  description = "Security group IDs"
  value       = module.security.security_groups
}

output "s3_buckets" {
  description = "S3 bucket information"
  value = {
    sensitive_data_bucket = module.storage.sensitive_data_bucket_name
    cloudtrail_bucket     = module.storage.cloudtrail_bucket_name
    config_bucket         = module.storage.config_bucket_name
  }
  sensitive = true
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = module.storage.kms_key_id
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = module.monitoring.cloudtrail_arn
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = module.compliance.config_recorder_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = module.monitoring.sns_topic_arn
}

output "saml_provider_arn" {
  description = "ARN of the SAML provider"
  value       = module.iam.saml_provider_arn
}

output "admin_role_arn" {
  description = "ARN of the admin role"
  value       = module.iam.admin_role_arn
}

output "readonly_role_arn" {
  description = "ARN of the readonly role"
  value       = module.iam.readonly_role_arn
}

output "saml_role_arn" {
  description = "ARN of the SAML role"
  value       = module.iam.saml_role_arn
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr

  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment

  idp_arn                = var.idp_arn
  idp_url                = var.idp_url
  idp_thumbprint         = var.idp_thumbprint
  saml_metadata_document = var.saml_metadata_document
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  depends_on = [module.vpc]
}

# Security Module (Security Groups)
module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = var.vpc_cidr
}

# Storage Module (S3 + KMS)
module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = var.environment

  account_id = data.aws_caller_identity.current.account_id
}

# Monitoring Module (CloudTrail + SNS)
module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  environment  = var.environment

  account_id           = data.aws_caller_identity.current.account_id
  cloudtrail_s3_bucket = module.storage.cloudtrail_bucket_name
  kms_key_id           = module.storage.kms_key_id

  notification_email = var.notification_email
}

# Compliance Module (AWS Config)
module "compliance" {
  source = "./modules/compliance"

  project_name = var.project_name
  environment  = var.environment

  account_id       = data.aws_caller_identity.current.account_id
  config_s3_bucket = module.storage.config_bucket_name
  sns_topic_arn    = module.monitoring.sns_topic_arn

  use_existing_config_recorder         = true
  use_existing_config_delivery_channel = true
  use_existing_guardduty_detector      = true
  use_existing_securityhub             = true

  depends_on = [module.storage, module.monitoring]
}
