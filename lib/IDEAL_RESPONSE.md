######################

# Data

######################

# Data sources

data "aws_availability_zones" "available" {
state = "available"
}

data "aws_caller_identity" "current" {}

######################

# Networking Module

######################

module "networking" {
source = "./modules/networking"

project_name = var.project_name
environment = var.environment
vpc_cidr = var.vpc_cidr
public_subnet_cidrs = var.public_subnet_cidrs
private_subnet_cidrs = var.private_subnet_cidrs
availability_zones = data.aws_availability_zones.available.names
}

######################

# Security Module

######################

module "security" {
source = "./modules/security"

project_name = var.project_name
environment = var.environment
vpc_id = module.networking.vpc_id
vpc_cidr = var.vpc_cidr
}
######################

# IAM Module

######################

module "iam" {
source = "./modules/iam"

project_name = var.project_name
environment = var.environment
s3_data_bucket_arn = module.storage.s3_data_bucket_arn
s3_logs_bucket_arn = module.storage.s3_logs_bucket_arn
}

######################

# Compute

######################

# Storage Module

module "storage" {
source = "./modules/storage"

project_name = var.project_name
environment = var.environment
vpc_id = module.networking.vpc_id
vpc_endpoint_sg_id = module.security.vpc_endpoint_sg_id
route_table_ids = module.networking.private_route_table_ids
}

# Database Module

module "database" {
source = "./modules/database"

project_name = var.project_name
environment = var.environment
vpc_id = module.networking.vpc_id
private_subnet_ids = module.networking.private_subnet_ids
rds_security_group_id = module.security.rds_sg_id
kms_key_id = module.storage.kms_key_id
}

# Compute Module

module "compute" {
source = "./modules/compute"

project_name = var.project_name
environment = var.environment
vpc_id = module.networking.vpc_id
public_subnet_ids = module.networking.public_subnet_ids
private_subnet_ids = module.networking.private_subnet_ids
ec2_security_group_id = module.security.ec2_sg_id
alb_security_group_id = module.security.alb_sg_id
instance_profile_name = module.iam.ec2_instance_profile_name
}

######################

# Monitoring

######################

# Monitoring Module

module "monitoring" {
source = "./modules/monitoring"

project_name = var.project_name
environment = var.environment
vpc_id = module.networking.vpc_id
s3_logs_bucket_name = module.storage.s3_logs_bucket_name
}

######################

# Outputs

######################

output "vpc_id" {
description = "ID of the VPC"
value = module.networking.vpc_id
}

output "alb_dns_name" {
description = "DNS name of the Application Load Balancer"
value = module.compute.alb_dns_name
}

output "rds_endpoint" {
description = "RDS instance endpoint"
value = module.database.rds_endpoint
sensitive = true
}

output "s3_data_bucket_name" {
description = "Name of the S3 data bucket"
value = module.storage.s3_data_bucket_name
}

output "cloudtrail_arn" {
description = "ARN of the CloudTrail"
value = module.monitoring.cloudtrail_arn
}
