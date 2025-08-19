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

project_name = var.project_name
environment = var.environment
vpc_cidr = var.vpc_cidr
public_subnet_cidrs = var.public_subnet_cidrs
private_subnet_cidrs = var.private_subnet_cidrs
availability_zones = data.aws_availability_zones.available.names
account_id = data.aws_caller_identity.current.account_id
caller_arn = data.aws_caller_identity.current.arn
}

######################

# Outputs

######################

output "vpc_id" {
description = "ID of the VPC"
value = module.infra.vpc_id
}

output "s3_data_bucket_name" {
description = "Name of the S3 data bucket"
value = module.infra.s3_data_bucket_name
}

output "s3_logs_bucket_name" {
description = "Name of the S3 logs bucket"
value = module.infra.s3_logs_bucket_name
}

output "nat_gateway_id" {
description = "ID of the NAT Gateway"
value = module.infra.nat_gateway_id
}

output "kms_key_arn" {
description = "ARN of the KMS key"
value = module.infra.kms_key_arn
}

output "instance_profile_name" {
description = "Name of the EC2 instance profile"
value = module.infra.ec2_instance_profile_name
}

output "vpc_cidr" {
description = "CIDR of the VPC"
value = module.infra.vpc_cidr
}

output "public_subnet_ids" {
description = "IDs of the public subnets"
value = module.infra.public_subnet_ids
}

output "private_subnet_ids" {
description = "IDs of the private subnets"
value = module.infra.private_subnet_ids
}

output "private_route_table_ids" {
description = "IDs of the private route tables"
value = module.infra.private_route_table_ids
}

output "internet_gateway_id" {
description = "ID of the Internet Gateway"
value = module.infra.internet_gateway_id
}

output "ec2_sg_id" {
description = "ID of the EC2 Security Group"
value = module.infra.ec2_sg_id
}

output "alb_sg_id" {
description = "ID of the ALB Security Group"
value = module.infra.alb_sg_id
}

output "rds_sg_id" {
description = "ID of the RDS Security Group"
value = module.infra.rds_sg_id
}

output "vpc_endpoint_sg_id" {
description = "ID of the VPC Endpoint Security Group"
value = module.infra.vpc_endpoint_sg_id
}

output "s3_data_bucket_arn" {
description = "ARN of the S3 data bucket"
value = module.infra.s3_data_bucket_arn
}

output "s3_logs_bucket_name" {
description = "Name of the S3 logs bucket"
value = module.infra.s3_logs_bucket_name
}

output "s3_logs_bucket_arn" {
description = "ARN of the S3 logs bucket"
value = module.infra.s3_logs_bucket_arn
}

output "kms_key_id" {
description = "ID of the KMS key"
value = module.infra.kms_key_id
}

output "vpc_endpoint_s3_id" {
description = "ID of the S3 VPC Endpoint"
value = module.infra.vpc_endpoint_s3_id
}
