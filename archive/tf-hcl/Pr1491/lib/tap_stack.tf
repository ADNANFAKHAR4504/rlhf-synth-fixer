## Core utilities (resource suffix)
module "core_util" {
  source = "./modules/core_util"
}

## No placeholder resources at root

## Variables are declared in lib/vars.tf

## No data sources at root

## KMS keys module
module "kms_keys" {
  source = "./modules/kms_keys"

  providers = {
    aws              = aws
    aws.eu_central_1 = aws.eu_central_1
  }

  resource_suffix = module.core_util.resource_suffix
  tags            = { Environment = "production" }
}

## KMS policies module (attaches least-privilege policies to KMS keys)
module "kms_policies" {
  source = "./modules/kms_policies"

  providers = {
    aws              = aws
    aws.eu_central_1 = aws.eu_central_1
  }

  primary_key_id    = module.kms_keys.primary_key_id
  primary_key_arn   = module.kms_keys.primary_key_arn
  secondary_key_id  = module.kms_keys.secondary_key_id
  secondary_key_arn = module.kms_keys.secondary_key_arn
}

## Network (cross-region) module
module "network_xregion" {
  source = "./modules/network_xregion"

  providers = {
    aws              = aws
    aws.eu_central_1 = aws.eu_central_1
  }

  create_vpcs         = var.create_vpcs
  allowed_cidr_blocks = var.allowed_cidr_blocks
}

## No inline security group resources at root

## S3 Buckets module
module "s3_buckets" {
  source = "./modules/s3_buckets"

  providers = {
    aws              = aws
    aws.eu_central_1 = aws.eu_central_1
  }

  primary_kms_key_arn   = module.kms_keys.primary_key_arn
  secondary_kms_key_arn = module.kms_keys.secondary_key_arn
  tags                  = { Environment = "production" }
}

## Resource suffix provided by core_util module

## No placeholder S3 resources at root

## Versioning handled in module s3_buckets

## S3 Bucket Replication (module)
module "s3_replication" {
  source = "./modules/s3_replication"

  # ensure versioning is enabled before creating replication config
  depends_on = [module.s3_buckets]

  source_bucket_id        = module.s3_buckets.primary_bucket_id
  source_bucket_arn       = module.s3_buckets.primary_bucket_arn
  destination_bucket_arn  = module.s3_buckets.secondary_bucket_arn
  source_kms_key_arn      = module.kms_keys.primary_key_arn
  destination_kms_key_arn = module.kms_keys.secondary_key_arn
  role_name_prefix        = "s3-replication-role-${module.core_util.resource_suffix}"
  policy_name_prefix      = "s3-replication-policy-${module.core_util.resource_suffix}"
  tags                    = { Environment = "production" }
}

## No placeholder replication resources at root

## Logging bucket lifecycle handled in module s3_buckets

## Data module: DynamoDB + RDS
module "data" {
  source = "./modules/data"

  providers = {
    aws              = aws
    aws.eu_central_1 = aws.eu_central_1
  }

  create_vpcs                 = var.create_vpcs
  primary_kms_key_arn         = module.kms_keys.primary_key_arn
  secondary_kms_key_arn       = module.kms_keys.secondary_key_arn
  primary_public_subnet_id    = module.network_xregion.primary_public_subnet_id
  primary_private_subnet_id   = module.network_xregion.primary_private_subnet_id
  secondary_public_subnet_id  = module.network_xregion.secondary_public_subnet_id
  secondary_private_subnet_id = module.network_xregion.secondary_private_subnet_id
  primary_security_group_id   = module.network_xregion.primary_security_group_id
  secondary_security_group_id = module.network_xregion.secondary_security_group_id
  db_password                 = var.db_password
  resource_suffix             = module.core_util.resource_suffix
  tags                        = { Environment = "production" }
}

## EC2 instances module
module "ec2_instances" {
  source = "./modules/ec2_instances"

  providers = {
    aws              = aws
    aws.eu_central_1 = aws.eu_central_1
  }

  create_vpcs                 = var.create_vpcs
  ec2_instance_type           = var.ec2_instance_type
  ec2_key_pair_name           = var.ec2_key_pair_name
  primary_subnet_id           = module.network_xregion.primary_public_subnet_id
  secondary_subnet_id         = module.network_xregion.secondary_public_subnet_id
  primary_security_group_id   = module.network_xregion.primary_security_group_id
  secondary_security_group_id = module.network_xregion.secondary_security_group_id
  primary_kms_key_arn         = module.kms_keys.primary_key_arn
  secondary_kms_key_arn       = module.kms_keys.secondary_key_arn
}

## IAM Global (module)
module "iam_global" {
  source = "./modules/iam_global"

  resource_suffix       = module.core_util.resource_suffix
  primary_bucket_arn    = module.s3_buckets.primary_bucket_arn
  secondary_bucket_arn  = module.s3_buckets.secondary_bucket_arn
  primary_table_arn     = module.data.primary_table_arn
  secondary_table_arn   = module.data.secondary_table_arn
  primary_kms_key_arn   = module.kms_keys.primary_key_arn
  secondary_kms_key_arn = module.kms_keys.secondary_key_arn
  tags                  = { Environment = "production" }
}

## Logging (CloudTrail + bucket policy) module
module "logging" {
  source = "./modules/logging"

  providers = {
    aws              = aws
    aws.eu_central_1 = aws.eu_central_1
  }

  create_cloudtrail         = var.create_cloudtrail
  logging_bucket_id         = module.s3_buckets.logging_bucket_id
  logging_bucket_arn        = module.s3_buckets.logging_bucket_arn
  primary_kms_key_arn       = module.kms_keys.primary_key_arn
  primary_data_bucket_arn   = module.s3_buckets.primary_bucket_arn
  secondary_data_bucket_arn = module.s3_buckets.secondary_bucket_arn
  s3_key_prefix             = "cloudtrail-logs"
  tags                      = { Environment = "production" }
}

# Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = module.network_xregion.primary_vpc_id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = module.network_xregion.secondary_vpc_id
}

output "primary_rds_endpoint" {
  description = "RDS instance endpoint in primary region"
  value       = module.data.primary_rds_endpoint
  sensitive   = true
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint in secondary region"
  value       = module.data.secondary_rds_endpoint
  sensitive   = true
}

output "primary_s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = module.s3_buckets.primary_bucket_name
}

output "secondary_s3_bucket_name" {
  description = "Name of the secondary S3 bucket"
  value       = module.s3_buckets.secondary_bucket_name
}

output "logging_s3_bucket_name" {
  description = "Name of the logging S3 bucket"
  value       = module.s3_buckets.logging_bucket_name
}

output "primary_ec2_instance_id" {
  description = "ID of the primary EC2 instance"
  value       = module.ec2_instances.primary_instance_id
}

output "secondary_ec2_instance_id" {
  description = "ID of the secondary EC2 instance"
  value       = module.ec2_instances.secondary_instance_id
}

output "primary_kms_key_id" {
  description = "ID of the primary KMS key"
  value       = module.kms_keys.primary_key_id
}

output "secondary_kms_key_id" {
  description = "ID of the secondary KMS key"
  value       = module.kms_keys.secondary_key_id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB tables"
  value       = module.data.primary_table_name
}

output "vpc_peering_connection_id" {
  description = "ID of the VPC peering connection between primary and secondary VPCs"
  value       = module.network_xregion.vpc_peering_connection_id
}