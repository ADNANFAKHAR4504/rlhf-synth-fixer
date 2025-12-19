########################
# Variables
########################

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "infrastructure-team"
}

variable "purpose" {
  description = "Purpose of the infrastructure"
  type        = string
  default     = "secure-aws-infrastructure"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = []
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

variable "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
  default     = "secure-cloudtrail-logs-bucket"
}

variable "cloudtrail_name" {
  description = "CloudTrail name"
  type        = string
  default     = "secure-infrastructure-trail"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name (optional - if not provided, instances will be accessible via Session Manager)"
  type        = string
  default     = null
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instance"
  type        = bool
  default     = false
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail creation (disable if hitting account limits)"
  type        = bool
  default     = false
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  common_tags = local.common_tags
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  random_prefix = local.random_prefix
  common_tags   = local.common_tags
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  cloudtrail_bucket_name = local.cloudtrail_bucket_name
  common_tags            = local.common_tags
}

# CloudTrail Module (conditional)
module "cloudtrail" {
  count  = var.enable_cloudtrail ? 1 : 0
  source = "./modules/cloudtrail"

  cloudtrail_name        = local.cloudtrail_name
  s3_bucket_name         = module.s3.cloudtrail_bucket_name
  cloudtrail_kms_key_arn = module.s3.cloudtrail_kms_key_arn

  common_tags = local.common_tags

  depends_on = [module.s3]
}

# EC2 Module
module "ec2" {
  source = "./modules/ec2"

  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  private_subnet_ids    = module.vpc.private_subnet_ids
  ec2_instance_role_arn = module.iam.ec2_instance_role_arn
  instance_profile_name = module.iam.ec2_instance_profile_name
  random_prefix         = local.random_prefix

  instance_type = var.ec2_instance_type
  key_pair_name = var.key_pair_name

  common_tags = local.common_tags

  depends_on = [module.vpc, module.iam]
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  random_prefix      = local.random_prefix

  db_instance_class          = var.db_instance_class
  db_allocated_storage       = var.db_allocated_storage
  db_engine_version          = var.db_engine_version
  enable_deletion_protection = var.enable_deletion_protection

  common_tags = local.common_tags

  depends_on = [module.vpc, module.ec2]
}

# Random naming resources to avoid conflicts
resource "random_id" "unique_suffix" {
  byte_length = 4
}

resource "random_string" "prefix" {
  length  = 6
  special = false
  upper   = false
}

# Local values for consistent tagging and naming
locals {
  # Random naming prefix for unique resource names
  random_prefix = "${random_string.prefix.result}-${random_id.unique_suffix.hex}"

  # Unique resource names
  cloudtrail_bucket_name = "${local.random_prefix}-${var.cloudtrail_bucket_name}"
  cloudtrail_name        = "${local.random_prefix}-${var.cloudtrail_name}"

  common_tags = {
    Environment  = var.environment
    Owner        = var.owner
    Purpose      = var.purpose
    RandomPrefix = local.random_prefix
  }
}

output "random_prefix" {
  description = "Random prefix used for resource naming to avoid conflicts"
  value       = local.random_prefix
}

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

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = module.ec2.instance_ids
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = var.enable_cloudtrail ? module.cloudtrail[0].cloudtrail_arn : ""
}

output "s3_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = module.s3.cloudtrail_bucket_name
}
