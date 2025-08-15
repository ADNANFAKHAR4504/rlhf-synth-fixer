########################
# Variables
########################

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "iac-aws-nova-model-breaking"
}

variable "author" {
  description = "Author of the project"
  type        = string
  default     = "ngwakoleslieelijah"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "created_date" {
  description = "Creation date"
  type        = string
  default     = "2025-08-14T21:08:49Z"
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

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

########################
# Data sources
########################

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  project_name        = var.project_name
  vpc_cidr           = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones  = data.aws_availability_zones.available.names
}

# Security Module
module "security" {
  source = "./modules/security"

  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  vpc_cidr     = var.vpc_cidr
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  kms_key_arn  = aws_kms_key.main.arn
}

# Storage Module
module "storage" {
  source = "./modules/storage"

  project_name           = var.project_name
  vpc_id                = module.networking.vpc_id
  route_table_ids       = module.networking.private_route_table_ids
  kms_key_arn           = aws_kms_key.main.arn
  vpc_endpoint_sg_id    = module.security.vpc_endpoint_sg_id
  ec2_instance_role_arn = module.iam.ec2_instance_role_arn
}

# Database Module
module "database" {
  source = "./modules/database"

  project_name           = var.project_name
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  rds_security_group_id = module.security.rds_sg_id
  kms_key_arn           = aws_kms_key.main.arn
  db_username           = var.db_username
  db_password           = var.db_password
}

# Compute Module
module "compute" {
  source = "./modules/compute"

  project_name           = var.project_name
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.security.alb_sg_id
  ec2_security_group_id = module.security.ec2_sg_id
  instance_profile_name = module.iam.ec2_instance_profile_name
  kms_key_arn           = aws_kms_key.main.arn
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  kms_key_arn  = aws_kms_key.main.arn
}


########################
# Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "s3_data_bucket_name" {
  description = "Name of the S3 data bucket"
  value       = module.storage.s3_data_bucket_name
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = module.storage.s3_logs_bucket_name
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = module.monitoring.cloudtrail_arn
}